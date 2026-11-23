"use client";
import React, { useEffect, useRef, useState } from 'react';

export const PipingBagCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    setEnabled(true);
    document.body.classList.add('kursor-piping');

    const handleMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
      }
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, .zona-klik')) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseover', handleOver, { passive: true });

    return () => {
      document.body.classList.remove('kursor-piping');
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseover', handleOver);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed left-0 top-0 w-[52px] h-[52px] pointer-events-none z-[9999] will-change-transform drop-shadow-[0_5px_8px_rgba(61,43,40,0.24)]"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <div
        className={`w-full h-full transition-transform duration-150 ease-out ${
          isActive ? 'scale-110 -rotate-8' : 'scale-100 rotate-0'
        }`}
      >
        <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible">
          <g
            className="transition-all duration-150"
            style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1)' : 'scale(0.4)',
              transformOrigin: '6px 6px',
            }}
          >
            <circle cx="5" cy="5" r="5" fill="#F1DBD0" stroke="#D96B91" strokeWidth="1.5" />
            <circle cx="2" cy="11" r="3" fill="#EFA7B8" />
          </g>
          <polygon
            points="4,4 18,10 10,18"
            fill="#D8DEE4"
            stroke="#7A828A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M14,14 L54,28 C62,31 66,38 62,46 L46,62 C38,66 31,62 28,54 Z"
            fill="#FFFDF9"
            stroke="#D3A29D"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="22" y1="22" x2="52" y2="38" stroke="#F1DBD0" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="26" x2="44" y2="48" stroke="#F1DBD0" strokeWidth="2" strokeLinecap="round" />
          <polygon
            points="52,42 74,52 64,64 70,72 52,64 42,52"
            fill="#FCE8EC"
            stroke="#D3A29D"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <g transform="translate(50, 48) rotate(-45)">
            <path d="M0,0 C-10,-10 -18,-4 -12,4 C-8,8 -2,3 0,0 Z" fill="#EFA7B8" stroke="#A36361" strokeWidth="1.5" />
            <path d="M0,0 C10,-10 18,-4 12,4 C8,8 2,3 0,0 Z" fill="#EFA7B8" stroke="#A36361" strokeWidth="1.5" />
            <path d="M-2,2 L-9,13 L-4,11 L0,3 Z" fill="#D96B91" />
            <path d="M2,2 L9,13 L4,11 L0,3 Z" fill="#D96B91" />
            <circle cx="0" cy="0" r="3.5" fill="#D96B91" stroke="#A36361" strokeWidth="1.2" />
          </g>
        </svg>
      </div>
    </div>
  );
};
