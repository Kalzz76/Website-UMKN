"use client";
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PATISSIER_CLICK_LINES,
  ZONE_REACTIONS,
  type CafeZone,
} from './patisserieData';

interface WalkingPatissierProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  activeZone: CafeZone;
  warmLighting: boolean;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  kind: 'heart' | 'star' | 'puff';
  color: string;
}

export const WalkingPatissier: React.FC<WalkingPatissierProps> = ({
  containerRef,
  activeZone,
  warmLighting,
}) => {
  // Physics state kept in refs for 60fps requestAnimationFrame smoothness
  const posXRef = useRef<number>(24); // percentage 0..100 of container width
  const targetXRef = useRef<number>(24);
  const facingRef = useRef<1 | -1>(1); // 1 = right, -1 = left
  const walkPhaseRef = useRef<number>(0);
  const speedRef = useRef<number>(0);
  const cursorNormRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isNearCharRef = useRef<boolean>(false);
  const lastStepSideRef = useRef<number>(0);

  // Rendered visual frame state
  const [frame, setFrame] = useState({
    x: 24,
    facing: 1 as 1 | -1,
    walkPhase: 0,
    isWalking: false,
    speed: 0,
    gazeX: 0,
    gazeY: 0,
    headTilt: 0,
    isNear: false,
  });

  const [isBlinking, setIsBlinking] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [clickLineIndex, setClickLineIndex] = useState<number>(-1);
  const [customBubble, setCustomBubble] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const particleIdRef = useRef(1);
  const bubbleTimerRef = useRef<number | null>(null);

  // Natural blinking loop every 2.8 - 4.4 seconds
  useEffect(() => {
    let timeoutId: number;
    let blinkCloseId: number;

    const scheduleBlink = () => {
      const delay = 2600 + Math.random() * 2000;
      timeoutId = window.setTimeout(() => {
        setIsBlinking(true);
        blinkCloseId = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 145);
      }, delay);
    };

    scheduleBlink();
    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(blinkCloseId);
    };
  }, []);

  // Cleanup bubble timeout on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  // React softly & briefly when warm lighting is toggled
  useEffect(() => {
    if (warmLighting) {
      setCustomBubble('Suasana lampu hangatnya nyaman sekali~');
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = window.setTimeout(() => setCustomBubble(null), 2600);
    }
  }, [warmLighting]);

  const spawnBurst = (count: number, kind: 'heart' | 'star' | 'puff', originX = 0, originY = 0) => {
    const colors = ['#EFA7B8', '#9E3B42', '#D9A760', '#F3B7C3'];
    const created: FloatingParticle[] = Array.from({ length: count }, (_, idx) => {
      const id = particleIdRef.current++;
      return {
        id,
        x: originX + (Math.random() - 0.5) * (kind === 'puff' ? 18 : 96),
        y: originY + (Math.random() - 0.5) * (kind === 'puff' ? 8 : 44),
        kind: kind === 'puff' ? 'puff' : idx % 2 === 0 ? 'heart' : 'star',
        color: colors[idx % colors.length],
      };
    });
    setParticles((prev) => [...prev.slice(-14), ...created]);
    window.setTimeout(() => {
      const ids = new Set(created.map((p) => p.id));
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 1050);
  };

  // Track mouse / pointer movement across the café container
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      // Only follow when pointer is inside or near the café scene
      if (e.clientY < rect.top - 40 || e.clientY > rect.bottom + 40) return;

      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPct = Math.max(9, Math.min(91, rawPct));
      targetXRef.current = clampedPct;

      // Character head screen coords for gentle gaze & proximity waving
      const charScreenX = rect.left + (posXRef.current / 100) * rect.width;
      const charScreenY = rect.bottom - Math.min(340, rect.height * 0.42);
      const dx = e.clientX - charScreenX;
      const dy = e.clientY - charScreenY;

      cursorNormRef.current = {
        x: Math.max(-1, Math.min(1, dx / 280)),
        y: Math.max(-1, Math.min(1, dy / 240)),
      };
      isNearCharRef.current = Math.hypot(dx, dy) < 220;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [containerRef]);

  // Smooth 60fps walking & animation loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const diff = targetXRef.current - posXRef.current;
      const absDiff = Math.abs(diff);

      if (prefersReduced) {
        posXRef.current += diff * Math.min(1, dt * 8);
        speedRef.current = 0;
      } else {
        // Gentle follow with comfortable companion distance (~13.5% of width) so she stands beside the cursor, not under it
        if (absDiff > 13.5) {
          const effectiveDiff = absDiff - 12.5;
          const maxStepSpeed = 22; // % width per second — pleasant unhurried stroll
          const desiredVel = Math.sign(diff) * Math.min(maxStepSpeed, effectiveDiff * 2.2);
          speedRef.current += (desiredVel - speedRef.current) * Math.min(1, dt * 9);
          posXRef.current += speedRef.current * dt;

          if (Math.abs(speedRef.current) > 1.2) {
            facingRef.current = speedRef.current > 0 ? 1 : -1;
          }

          // Advance walk cycle proportional to walking speed
          const prevSin = Math.sin(walkPhaseRef.current);
          walkPhaseRef.current += Math.abs(speedRef.current) * dt * 0.62;
          const nextSin = Math.sin(walkPhaseRef.current);

          // Spawn delicate little step puff occasionally on footfall
          if ((prevSin < 0 && nextSin >= 0) || (prevSin > 0 && nextSin <= 0)) {
            const side = nextSin >= 0 ? 1 : -1;
            if (side !== lastStepSideRef.current && Math.abs(speedRef.current) > 6) {
              lastStepSideRef.current = side;
              spawnBurst(1, 'puff', -facingRef.current * 16, 150);
            }
          }
        } else {
          speedRef.current *= Math.max(0, 1 - dt * 11);
          if (Math.abs(speedRef.current) < 0.25) {
            speedRef.current = 0;
          }
          if (absDiff > 1.5) {
            facingRef.current = diff > 0 ? 1 : -1;
          }
          // Settle walk phase smoothly to neutral stance
          walkPhaseRef.current += (0 - Math.sin(walkPhaseRef.current)) * Math.min(1, dt * 8);
        }
      }

      const isWalking = Math.abs(speedRef.current) > 1.4;
      const gazeX = cursorNormRef.current.x * 2.4;
      const gazeY = cursorNormRef.current.y * 1.9;
      const headTilt = isWalking
        ? facingRef.current * Math.sin(walkPhaseRef.current) * 3.2
        : cursorNormRef.current.x * 5.2;

      setFrame({
        x: posXRef.current,
        facing: facingRef.current,
        walkPhase: walkPhaseRef.current,
        isWalking,
        speed: speedRef.current,
        gazeX,
        gazeY,
        headTilt,
        isNear: isNearCharRef.current,
      });

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handlePatissierClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (clickLineIndex + 1) % PATISSIER_CLICK_LINES.length;
    setClickLineIndex(nextIdx);
    setCustomBubble(PATISSIER_CLICK_LINES[nextIdx]);
    setIsHopping(true);
    spawnBurst(6, 'heart', 0, -95);

    window.setTimeout(() => setIsHopping(false), 520);
    if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => setCustomBubble(null), 3200);
  };

  // Keep the patissier peacefully quiet unless explicitly clicked
  const zoneInfo = activeZone ? ZONE_REACTIONS[activeZone] : null;
  const activeBubbleText = customBubble;
  const mood: 'happy' | 'excited' | 'cozy' | 'wave' = isHopping
    ? 'excited'
    : zoneInfo
      ? zoneInfo.mood
      : frame.isNear
        ? 'wave'
        : 'happy';

  const isSmilingEyes = isHopping || mood === 'excited' || (mood === 'wave' && !frame.isWalking);
  const isWaving = !frame.isWalking && (mood === 'wave' || isHopping || frame.isNear);

  // Compute limb kinematics from walk phase (graceful adult stride)
  const stride = frame.isWalking ? Math.sin(frame.walkPhase) : 0;
  const bounceY = frame.isWalking ? -Math.abs(Math.sin(frame.walkPhase)) * 6.5 : 0;
  const legLeftAngle = stride * 15;
  const legRightAngle = -stride * 15;
  const armLeftAngle = -stride * 13;
  const armRightAngle = isWaving ? -44 + Math.sin(Date.now() * 0.011) * 12 : stride * 13;
  const bodyLean = frame.isWalking ? 2.4 : 0;
  const hairTrail = frame.isWalking ? -4.5 - Math.abs(stride) * 3.5 : 0;
  const shadowScale = isHopping ? 0.78 : frame.isWalking ? 0.94 - Math.abs(stride) * 0.08 : 1;

  // Keep speech bubble safely inside horizontal bounds
  const bubbleAlignClass =
    frame.x < 22
      ? 'left-2 translate-x-0'
      : frame.x > 78
        ? 'right-2 translate-x-0'
        : 'left-1/2 -translate-x-1/2';

  // Local gaze corrected for horizontal flip
  const localGazeX = frame.gazeX * frame.facing;
  const localGazeY = frame.gazeY;

  return (
    <div
      className="pointer-events-none absolute bottom-[0.6%] z-30 select-none will-change-transform"
      style={{
        left: `${frame.x}%`,
        transform: 'translateX(-50%)',
        width: 'clamp(165px, min(20vw, 29dvh), 275px)',
      }}
    >
      {/* Floating Coquette Speech Bubble */}
      <AnimatePresence mode="wait">
        {activeBubbleText && (
          <motion.div
            key={activeBubbleText}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-none absolute -top-16 sm:-top-20 ${bubbleAlignClass} w-48 sm:w-56 z-40`}
          >
            <div className="relative bg-[#FFFDF9]/96 backdrop-blur-md border-2 border-dusty/85 rounded-2xl px-3.5 py-2 shadow-[0_10px_24px_-6px_rgba(158,59,66,0.28)] text-center">
              {/* Tiny decorative bow dot at top */}
              <span
                aria-hidden="true"
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-2.5 flex items-center justify-center"
              >
                <svg viewBox="0 0 28 14" className="w-5 h-2.5">
                  <path
                    d="M14 7 C9 1 3 3 5 9 C7 12 11 9 14 7 Z M14 7 C19 1 25 3 23 9 C21 12 17 9 14 7 Z"
                    fill="#EFA7B8"
                    stroke="#9E3B42"
                    strokeWidth="1.4"
                  />
                  <circle cx="14" cy="7" r="2" fill="#9E3B42" />
                </svg>
              </span>
              <p className="text-[11px] sm:text-xs font-bold text-ink leading-snug">
                {activeBubbleText}
              </p>
              {/* Bubble pointer tail */}
              <span
                aria-hidden="true"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#FFFDF9] border-r-2 border-b-2 border-dusty/85 rotate-45"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Hearts / Sparkles / Step Puffs */}
      <div className="pointer-events-none absolute inset-0 overflow-visible z-30">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                opacity: p.kind === 'puff' ? 0.55 : 0.95,
                x: p.x,
                y: p.y,
                scale: p.kind === 'puff' ? 0.6 : 0.45,
              }}
              animate={{
                opacity: 0,
                x: p.x + (p.kind === 'puff' ? -frame.facing * 16 : (Math.random() - 0.5) * 24),
                y: p.y - (p.kind === 'puff' ? 14 : 58),
                scale: p.kind === 'puff' ? 1.35 : 1.15,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.kind === 'puff' ? 0.55 : 0.95, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2"
            >
              {p.kind === 'heart' && (
                <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-sm">
                  <path
                    d="M12 20 C6 15.2 3 11.8 3 8.2 C3 5.5 5.2 3.5 7.8 3.5 C9.6 3.5 11.1 4.5 12 6 C12.9 4.5 14.4 3.5 16.2 3.5 C18.8 3.5 21 5.5 21 8.2 C21 11.8 18 15.2 12 20 Z"
                    fill={p.color}
                  />
                </svg>
              )}
              {p.kind === 'star' && (
                <svg viewBox="0 0 24 24" className="w-4 h-4 drop-shadow-sm">
                  <path
                    d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
                    fill={p.color}
                  />
                </svg>
              )}
              {p.kind === 'puff' && (
                <span className="block w-3 h-3 rounded-full bg-[#F7E5DB]/80 blur-[1px]" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Clickable Adorable Patissier Character */}
      <motion.button
        type="button"
        onClick={handlePatissierClick}
        aria-label="Sapa Patissier Cravely"
        animate={{ y: isHopping ? -24 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className={`${activeZone ? 'pointer-events-none' : 'pointer-events-auto'} relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cherry rounded-full group`}
      >
        <svg
          viewBox="0 0 220 385"
          className="w-full h-auto overflow-visible drop-shadow-[0_10px_18px_rgba(61,43,40,0.24)]"
        >
          <defs>
            <radialGradient id="patBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59AB0" stopOpacity="0.58" />
              <stop offset="100%" stopColor="#F59AB0" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="patHair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C4E41" />
              <stop offset="55%" stopColor="#5D372E" />
              <stop offset="100%" stopColor="#482922" />
            </linearGradient>
            <linearGradient id="patEyeIris" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B211C" />
              <stop offset="60%" stopColor="#63382D" />
              <stop offset="100%" stopColor="#9A6150" />
            </linearGradient>
            <linearGradient id="patApron" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B86268" />
              <stop offset="100%" stopColor="#8F3F46" />
            </linearGradient>
            <linearGradient id="patDress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F6DCE0" />
              <stop offset="100%" stopColor="#E4B3BC" />
            </linearGradient>
          </defs>

          {/* Soft Floor Contact Shadow */}
          <ellipse
            cx="110"
            cy="370"
            rx={44 * shadowScale}
            ry={9 * shadowScale}
            fill="#4A2E28"
            opacity="0.22"
          />

          {/* Main Character Group with Facing Direction & Walk Bounce */}
          <g
            transform={`translate(110, ${bounceY.toFixed(1)}) scale(${frame.facing}, 1) translate(-110, 0)`}
          >
            {/* Long Flowing Wavy Hair Back (sways gently while walking) */}
            <g transform={`rotate(${hairTrail.toFixed(1)} 110 76)`}>
              <path
                d="M78 72 C64 98 60 144 66 196 C70 212 80 220 92 216 L128 216 C140 220 150 212 154 196 C160 144 156 98 142 72 Z"
                fill="url(#patHair)"
                stroke="#3E231D"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              {/* Soft Wavy Side Strands */}
              <path
                d="M74 102 C62 128 60 162 72 190 C78 176 80 144 82 114 Z"
                fill="#523028"
                opacity="0.65"
              />
              <path
                d="M146 102 C158 128 160 162 148 190 C142 176 140 144 138 114 Z"
                fill="#523028"
                opacity="0.65"
              />
            </g>

            {/* ==================== LONG ADULT LEGS & LOW-HEEL MARY-JANE SHOES ==================== */}
            {/* Left Leg */}
            <g transform={`rotate(${legLeftAngle.toFixed(1)} 98 242)`}>
              {/* Thigh, Knee & Slender Calf */}
              <path
                d="M91 236 H106 L104.5 292 C104 312 102 330 101.5 348 H94.5 C93.5 330 92 312 91.5 292 Z"
                fill="#FDE2CE"
                stroke="#DFB59D"
                strokeWidth="1.2"
              />
              {/* Subtle Knee Highlight */}
              <ellipse cx="98" cy="291" rx="3.8" ry="2.2" fill="#F4C7AE" opacity="0.55" />
              {/* Refined Cream Ankle Sock */}
              <path
                d="M93.5 334 H102.5 L102 354 H94 Z"
                fill="#FFFDF9"
                stroke="#E4CBC2"
                strokeWidth="1.2"
              />
              <path d="M93.5 336 Q98 339 102.5 336" fill="none" stroke="#EFA7B8" strokeWidth="1.5" />
              {/* Elegant Burgundy Low-Heel Mary-Jane Shoe */}
              <path
                d="M91.5 352 H104 C112 352 118 357 117 363 C115.5 367 101 367.5 92 365.5 C88.5 364 89 356 91.5 352 Z"
                fill="#8E3B46"
                stroke="#5A232B"
                strokeWidth="1.5"
              />
              {/* Small Classic Block Heel */}
              <rect x="90" y="363" width="6.5" height="4.5" rx="1.2" fill="#5A232B" />
              {/* Dainty Ankle Strap */}
              <path d="M92.5 354 Q99 357.5 105 354" fill="none" stroke="#FFFDF9" strokeWidth="1.8" />
              <ellipse cx="109" cy="359" rx="3.2" ry="1.4" fill="#F8C8CF" opacity="0.65" />
            </g>

            {/* Right Leg */}
            <g transform={`rotate(${legRightAngle.toFixed(1)} 122 242)`}>
              {/* Thigh, Knee & Slender Calf */}
              <path
                d="M114 236 H129 L128.5 292 C128 312 126.5 330 125.5 348 H118.5 C118 330 116 312 115.5 292 Z"
                fill="#FDE2CE"
                stroke="#DFB59D"
                strokeWidth="1.2"
              />
              {/* Subtle Knee Highlight */}
              <ellipse cx="122" cy="291" rx="3.8" ry="2.2" fill="#F4C7AE" opacity="0.55" />
              {/* Refined Cream Ankle Sock */}
              <path
                d="M117.5 334 H126.5 L126 354 H118 Z"
                fill="#FFFDF9"
                stroke="#E4CBC2"
                strokeWidth="1.2"
              />
              <path d="M117.5 336 Q122 339 126.5 336" fill="none" stroke="#EFA7B8" strokeWidth="1.5" />
              {/* Elegant Burgundy Low-Heel Mary-Jane Shoe */}
              <path
                d="M115.5 352 H128 C136 352 142 357 141 363 C139.5 367 125 367.5 116 365.5 C112.5 364 113 356 115.5 352 Z"
                fill="#8E3B46"
                stroke="#5A232B"
                strokeWidth="1.5"
              />
              {/* Small Classic Block Heel */}
              <rect x="114" y="363" width="6.5" height="4.5" rx="1.2" fill="#5A232B" />
              {/* Dainty Ankle Strap */}
              <path d="M116.5 354 Q123 357.5 129 354" fill="none" stroke="#FFFDF9" strokeWidth="1.8" />
              <ellipse cx="133" cy="359" rx="3.2" ry="1.4" fill="#F8C8CF" opacity="0.65" />
            </g>

            {/* ==================== GRACEFUL BODY, BLOUSE & COQUETTE MIDI APRON ==================== */}
            <g transform={`rotate(${bodyLean.toFixed(1)} 110 236)`}>
              {/* Left Arm (holding a delicate pastel strawberry macaron) */}
              <g transform={`rotate(${armLeftAngle.toFixed(1)} 82 128)`}>
                {/* Soft Puff Cream Sleeve */}
                <ellipse
                  cx="76"
                  cy="137"
                  rx="13.5"
                  ry="17"
                  fill="#FFF9F1"
                  stroke="#D8B3A8"
                  strokeWidth="1.5"
                />
                {/* Slender Upper & Lower Arm */}
                <path
                  d="M74 152 Q67 176 70 202"
                  fill="none"
                  stroke="#FDE2CE"
                  strokeWidth="9.5"
                  strokeLinecap="round"
                />
                <circle cx="70" cy="205" r="6" fill="#FDE2CE" stroke="#DFB49C" strokeWidth="1.2" />
                {/* Cute Mini Pink Macaron in Hand */}
                <g transform="translate(60, 201) rotate(-14)">
                  <ellipse cx="0" cy="-3.5" rx="7.5" ry="4" fill="#F29DB0" stroke="#9E3B42" strokeWidth="1" />
                  <rect x="-7" y="-1" width="14" height="3" rx="1.5" fill="#FFFDF9" />
                  <ellipse cx="0" cy="3.5" rx="7.5" ry="3.8" fill="#F29DB0" stroke="#9E3B42" strokeWidth="1" />
                </g>
              </g>

              {/* Right Arm (Waves Warmly When Greeting) */}
              <g transform={`rotate(${armRightAngle.toFixed(1)} 138 128)`}>
                <ellipse
                  cx="144"
                  cy="137"
                  rx="13.5"
                  ry="17"
                  fill="#FFF9F1"
                  stroke="#D8B3A8"
                  strokeWidth="1.5"
                />
                <path
                  d="M146 152 Q153 176 150 202"
                  fill="none"
                  stroke="#FDE2CE"
                  strokeWidth="9.5"
                  strokeLinecap="round"
                />
                <circle cx="150" cy="205" r="6" fill="#FDE2CE" stroke="#DFB49C" strokeWidth="1.2" />
              </g>

              {/* Cream Scalloped Lace Petticoat Under Midi Skirt */}
              <path
                d="M66 250 Q77 259 88 250 Q99 259 110 250 Q121 259 132 250 Q143 259 154 250 L149 238 H71 Z"
                fill="#FFFDF9"
                stroke="#E4C8BE"
                strokeWidth="1.3"
              />

              {/* Soft Blush Pleated A-Line Midi Dress Skirt */}
              <path
                d="M88 174 H132 L157 248 Q110 258 63 248 Z"
                fill="url(#patDress)"
                stroke="#C99297"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {/* Soft Skirt Pleat Lines */}
              <path d="M96 184 L82 246 M110 184 L110 248 M124 184 L138 246" stroke="#D39AA2" strokeWidth="1" opacity="0.45" />

              {/* Fitted Cream Blouse Torso */}
              <path
                d="M82 122 Q110 116 138 122 L133 176 H87 Z"
                fill="#FFF9F1"
                stroke="#D8B3A8"
                strokeWidth="1.6"
              />

              {/* Refined Scalloped Collar */}
              <path
                d="M94 121 Q102 133 110 125 Q118 133 126 121"
                fill="#FFFDF9"
                stroke="#D8B3A8"
                strokeWidth="1.4"
              />

              {/* Burgundy Coquette Patissier Apron (Bib + Flared Skirt) */}
              <path
                d="M91 136 H129 L131 174 L146 242 Q110 250 74 242 L89 174 Z"
                fill="url(#patApron)"
                stroke="#76343A"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {/* Apron Waistband */}
              <rect x="87" y="170" width="46" height="7" rx="3" fill="#8B3B42" stroke="#6E2E34" strokeWidth="1.2" />
              {/* Apron Cream Lace Hem Scallops */}
              <path
                d="M77 240 Q85 246 93 241 Q101 247 110 242 Q119 247 127 241 Q135 246 143 240"
                fill="none"
                stroke="#FFF8F0"
                strokeWidth="2.3"
                strokeLinecap="round"
              />
              {/* Apron Straps */}
              <rect x="93" y="120" width="6" height="18" rx="2.8" fill="#F8E2DC" stroke="#9E3B42" strokeWidth="1.2" />
              <rect x="121" y="120" width="6" height="18" rx="2.8" fill="#F8E2DC" stroke="#9E3B42" strokeWidth="1.2" />

              {/* Sweet Apron Pocket with Heart & Mini Brass Whisk */}
              <path
                d="M96 196 H124 V214 Q110 223 96 214 Z"
                fill="#FFFDF9"
                stroke="#E2B9B6"
                strokeWidth="1.4"
              />
              {/* Mini Whisk peeking from pocket */}
              <line x1="118" y1="197" x2="124" y2="184" stroke="#C59B62" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="125" cy="181" rx="3.2" ry="5.2" transform="rotate(24 125 181)" fill="none" stroke="#C59B62" strokeWidth="1.3" />
              {/* Tiny Cherry Heart on Pocket */}
              <path
                d="M108 211 C103.5 207.5 103 203.5 106 203.5 C107.2 203.5 108 204.8 108 204.8 C108 204.8 108.8 203.5 110 203.5 C113 203.5 112.5 207.5 108 211 Z"
                fill="#9E3B42"
              />

              {/* Coquette Ribbon Bow at Waistline */}
              <g transform="translate(110, 174)">
                <path d="M0 0 C-10 -6 -16 -1 -11 5 C-8 8 -2 3 0 0 Z" fill="#EFA7B8" stroke="#9E3B42" strokeWidth="1.3" />
                <path d="M0 0 C10 -6 16 -1 11 5 C8 8 2 3 0 0 Z" fill="#EFA7B8" stroke="#9E3B42" strokeWidth="1.3" />
                <path d="M-1 2 L-7 14 M1 2 L7 14" stroke="#9E3B42" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="0" cy="0" r="2.8" fill="#9E3B42" />
              </g>

              {/* Slender Neck */}
              <rect x="103.5" y="101" width="13" height="22" rx="6" fill="#F8D6BF" />

              {/* ==================== REFINED ADULT HEAD & EXPRESSION ==================== */}
              <g transform={`rotate(${(frame.headTilt * frame.facing).toFixed(1)} 110 106)`}>
                {/* Ears with Dainty Pearl Drop Earrings */}
                <circle cx="77" cy="76" r="5.5" fill="#F9D9C4" stroke="#E0B69E" strokeWidth="1.1" />
                <circle cx="77" cy="82.5" r="2.2" fill="#FFFDF9" stroke="#D3A29D" strokeWidth="1" />
                <circle cx="143" cy="76" r="5.5" fill="#F9D9C4" stroke="#E0B69E" strokeWidth="1.1" />
                <circle cx="143" cy="82.5" r="2.2" fill="#FFFDF9" stroke="#D3A29D" strokeWidth="1" />

                {/* Graceful Oval Adult Face */}
                <path
                  d="M79 71 C79 44 92 36 110 36 C128 36 141 44 141 71 C141 93 127 106 110 106 C93 106 79 93 79 71 Z"
                  fill="#FEE7D6"
                  stroke="#DFB59D"
                  strokeWidth="1.5"
                />

                {/* Soft Rosy Watercolor Cheek Blush */}
                <ellipse cx="90" cy="84" rx="9.5" ry="5.2" fill="url(#patBlush)" />
                <ellipse cx="130" cy="84" rx="9.5" ry="5.2" fill="url(#patBlush)" />

                {/* Gentle Expressive Eyebrows */}
                <path
                  d="M89 64 Q96 60.5 103 63"
                  fill="none"
                  stroke="#6A4137"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
                <path
                  d="M117 63 Q124 60.5 131 64"
                  fill="none"
                  stroke="#6A4137"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />

                {/* ==================== WARM EXPRESSIVE EYES ==================== */}
                {isBlinking ? (
                  <g stroke="#4A2B24" strokeWidth="2.3" strokeLinecap="round" fill="none">
                    <path d="M89 75 Q96 79 103 75" />
                    <path d="M117 75 Q124 79 131 75" />
                  </g>
                ) : isSmilingEyes ? (
                  <g>
                    <path
                      d="M89 76 Q96 68 103 76"
                      fill="none"
                      stroke="#4A2B24"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M117 76 Q124 68 131 76"
                      fill="none"
                      stroke="#4A2B24"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    {/* Gentle Happy Sparkles */}
                    <path d="M82 72 L83.2 74.8 L86 76 L83.2 77.2 L82 80 L80.8 77.2 L78 76 L80.8 74.8 Z" fill="#E3A857" />
                    <path d="M138 72 L139.2 74.8 L142 76 L139.2 77.2 L138 80 L136.8 77.2 L134 76 L136.8 74.8 Z" fill="#E3A857" />
                  </g>
                ) : (
                  <g>
                    {/* Left Eye */}
                    <g>
                      <ellipse cx="96" cy="75" rx="6.8" ry="7.2" fill="#FFFDF9" />
                      <g transform={`translate(${(localGazeX * 0.85).toFixed(2)}, ${(localGazeY * 0.85).toFixed(2)})`}>
                        <ellipse cx="96" cy="75.3" rx="5.3" ry="6" fill="url(#patEyeIris)" />
                        <ellipse cx="96" cy="78.4" rx="3.2" ry="1.8" fill="#B57562" opacity="0.65" />
                        <circle cx="96" cy="75" r="2.6" fill="#2E1915" />
                        <circle cx="94" cy="72.6" r="2" fill="#FFFFFF" />
                        <circle cx="98.2" cy="77.4" r="1" fill="#FFF6F0" />
                      </g>
                      <path
                        d="M88 73 Q96 66 103.5 73"
                        fill="none"
                        stroke="#442721"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path d="M89 72 L85.8 69.8" stroke="#442721" strokeWidth="1.6" strokeLinecap="round" />
                    </g>

                    {/* Right Eye */}
                    <g>
                      <ellipse cx="124" cy="75" rx="6.8" ry="7.2" fill="#FFFDF9" />
                      <g transform={`translate(${(localGazeX * 0.85).toFixed(2)}, ${(localGazeY * 0.85).toFixed(2)})`}>
                        <ellipse cx="124" cy="75.3" rx="5.3" ry="6" fill="url(#patEyeIris)" />
                        <ellipse cx="124" cy="78.4" rx="3.2" ry="1.8" fill="#B57562" opacity="0.65" />
                        <circle cx="124" cy="75" r="2.6" fill="#2E1915" />
                        <circle cx="122" cy="72.6" r="2" fill="#FFFFFF" />
                        <circle cx="126.2" cy="77.4" r="1" fill="#FFF6F0" />
                      </g>
                      <path
                        d="M116.5 73 Q124 66 132 73"
                        fill="none"
                        stroke="#442721"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path d="M131 72 L134.2 69.8" stroke="#442721" strokeWidth="1.6" strokeLinecap="round" />
                    </g>
                  </g>
                )}

                {/* Delicate Nose */}
                <path
                  d="M109.5 81 Q111 83.2 109.3 84.5"
                  fill="none"
                  stroke="#D39D84"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />

                {/* Warm Smile */}
                {isSmilingEyes ? (
                  <g>
                    <path
                      d="M103.5 90 Q110 97.5 116.5 90 Z"
                      fill="#C9646F"
                      stroke="#933C46"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                    <path d="M106 93 Q110 95.5 114 93" fill="#F29DAA" />
                  </g>
                ) : (
                  <path
                    d="M104 91 Q110 95.5 116 91"
                    fill="none"
                    stroke="#A35058"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Soft Curtain Bangs & Elegant Crown Hair */}
                <path
                  d="M75 76 C73 46 87 30 110 30 C133 30 147 46 145 76 C140 62 133 54 126 60 C121 50 114 50 110 61 C106 50 99 50 94 60 C87 54 80 62 75 76 Z"
                  fill="url(#patHair)"
                  stroke="#3E231D"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                {/* Graceful Face-Framing Side Locks */}
                <path
                  d="M78 65 C73 82 72 104 79 118 C83 105 83 84 82 70 Z"
                  fill="#663E34"
                />
                <path
                  d="M142 65 C147 82 148 104 141 118 C137 105 137 84 138 70 Z"
                  fill="#663E34"
                />
                {/* Soft Glossy Hair Highlights */}
                <path
                  d="M90 45 Q100 38 108 42"
                  fill="none"
                  stroke="#A87465"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  opacity="0.65"
                />
                <path
                  d="M115 42 Q123 39 130 46"
                  fill="none"
                  stroke="#A87465"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  opacity="0.6"
                />

                {/* Refined Scalloped Lace Patissier Headband */}
                <path
                  d="M80 48 Q110 24 140 48 Q135 40 128 43 Q122 35 116 38 Q110 31 104 38 Q98 35 92 43 Q85 40 80 48 Z"
                  fill="#FFFDF9"
                  stroke="#D8B3A8"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M83 46 Q110 29 137 46"
                  fill="none"
                  stroke="#EFA7B8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Signature Coquette Satin Ribbon Bow on Headband */}
                <g transform="translate(128, 36) rotate(20)">
                  <path
                    d="M0,0 C-10,-10 -19,-3 -12,6 C-8,9 -2,3 0,0 Z"
                    fill="#F8D8DC"
                    stroke="#9E3B42"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0,0 C10,-10 19,-3 12,6 C8,9 2,3 0,0 Z"
                    fill="#F8D8DC"
                    stroke="#9E3B42"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M-1.5,2 Q-7,11 -11,17 L-5.5,16 Q-2,9 0,3 Z"
                    fill="#9E3B42"
                  />
                  <path
                    d="M1.5,2 Q7,11 11,17 L5.5,16 Q2,9 0,3 Z"
                    fill="#9E3B42"
                  />
                  <circle cx="0" cy="0" r="3.6" fill="#FFFDF9" stroke="#9E3B42" strokeWidth="1.7" />
                  <circle cx="0" cy="0" r="1.5" fill="#EFA7B8" />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </motion.button>
    </div>
  );
};
