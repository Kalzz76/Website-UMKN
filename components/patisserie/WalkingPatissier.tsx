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
      const charScreenY = rect.bottom - 145;
      const dx = e.clientX - charScreenX;
      const dy = e.clientY - charScreenY;

      cursorNormRef.current = {
        x: Math.max(-1, Math.min(1, dx / 280)),
        y: Math.max(-1, Math.min(1, dy / 240)),
      };
      isNearCharRef.current = Math.hypot(dx, dy) < 175;
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
        // Gentle follow with small comfortable deadzone (~2.2% of width)
        if (absDiff > 2.2) {
          const maxStepSpeed = 24; // % width per second — pleasant unhurried stroll
          const desiredVel = Math.sign(diff) * Math.min(maxStepSpeed, absDiff * 2.5);
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
              spawnBurst(1, 'puff', -facingRef.current * 14, 72);
            }
          }
        } else {
          speedRef.current *= Math.max(0, 1 - dt * 11);
          if (Math.abs(speedRef.current) < 0.25) {
            speedRef.current = 0;
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
    spawnBurst(6, 'heart', 0, -40);

    window.setTimeout(() => setIsHopping(false), 520);
    if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => setCustomBubble(null), 3200);
  };

  // Keep si Adek peacefully quiet unless explicitly clicked (still shows cute silent mood on zone hover!)
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

  // Compute limb kinematics from walk phase
  const stride = frame.isWalking ? Math.sin(frame.walkPhase) : 0;
  const bounceY = frame.isWalking ? -Math.abs(Math.sin(frame.walkPhase)) * 7.5 : 0;
  const legLeftAngle = stride * 21;
  const legRightAngle = -stride * 21;
  const armLeftAngle = -stride * 17;
  const armRightAngle = isWaving ? -48 + Math.sin(Date.now() * 0.012) * 14 : stride * 17;
  const bodyLean = frame.isWalking ? 3.2 : 0;
  const hairTrail = frame.isWalking ? -6 - Math.abs(stride) * 4 : 0;
  const shadowScale = isHopping ? 0.72 : frame.isWalking ? 0.92 - Math.abs(stride) * 0.1 : 1;

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
      className="pointer-events-none absolute bottom-[1.2%] z-30 select-none will-change-transform"
      style={{
        left: `${frame.x}%`,
        transform: 'translateX(-50%)',
        width: 'clamp(132px, 12.8vw, 196px)',
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
        className="pointer-events-auto relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cherry rounded-full group"
      >
        <svg
          viewBox="0 0 220 275"
          className="w-full h-auto overflow-visible drop-shadow-[0_8px_14px_rgba(61,43,40,0.22)]"
        >
          <defs>
            <radialGradient id="patBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59AB0" stopOpacity="0.68" />
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
              <stop offset="100%" stopColor="#93454B" />
            </linearGradient>
            <linearGradient id="patDress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F6DCE0" />
              <stop offset="100%" stopColor="#E6B8BF" />
            </linearGradient>
          </defs>

          {/* Soft Floor Contact Shadow */}
          <ellipse
            cx="110"
            cy="261"
            rx={38 * shadowScale}
            ry={8.5 * shadowScale}
            fill="#4A2E28"
            opacity="0.22"
          />

          {/* Main Character Group with Facing Direction & Walk Bounce */}
          <g
            transform={`translate(110, ${bounceY.toFixed(1)}) scale(${frame.facing}, 1) translate(-110, 0)`}
          >
            {/* Flowing Back Hair (sways gently behind her while walking) */}
            <g transform={`rotate(${hairTrail.toFixed(1)} 110 88)`}>
              {/* Twin Soft Wavy Pigtails / Back Volume */}
              <path
                d="M66 90 C44 108 38 144 50 176 C58 192 72 194 78 180 C84 166 78 136 82 110 Z"
                fill="url(#patHair)"
                stroke="#3E231D"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M154 90 C176 108 182 144 170 176 C162 192 148 194 142 180 C136 166 142 136 138 110 Z"
                fill="url(#patHair)"
                stroke="#3E231D"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Back Center Hair */}
              <path
                d="M68 88 C62 128 66 168 78 186 L142 186 C154 168 158 128 152 88 Z"
                fill="#523028"
              />
              {/* Cute Little Ribbon Ties on Twin Curls */}
              <circle cx="62" cy="118" r="4.5" fill="#EFA7B8" stroke="#9E3B42" strokeWidth="1.4" />
              <circle cx="158" cy="118" r="4.5" fill="#EFA7B8" stroke="#9E3B42" strokeWidth="1.4" />
            </g>

            {/* ==================== LEGS & MARY-JANE SHOES ==================== */}
            {/* Left Leg */}
            <g transform={`rotate(${legLeftAngle.toFixed(1)} 97 204)`}>
              <rect x="90" y="198" width="14" height="24" rx="6" fill="#FEE4D1" />
              {/* Cream Knee-High Sock */}
              <path
                d="M89.5 218 H104.5 L103.5 246 H90.5 Z"
                fill="#FFFDF9"
                stroke="#E4CBC2"
                strokeWidth="1.4"
              />
              {/* Tiny Pink Sock Bow */}
              <path d="M97 220 L92 217 L93 223 Z M97 220 L102 217 L101 223 Z" fill="#EFA7B8" />
              {/* Burgundy Mary-Jane Shoe */}
              <path
                d="M88 244 H105 C111 244 114 250 112 255 C110 259 93 259 88 256 C85 253 86 247 88 244 Z"
                fill="#8E3B46"
                stroke="#5A232B"
                strokeWidth="1.5"
              />
              <path d="M90 247 Q98 251 105 247" fill="none" stroke="#FFFDF9" strokeWidth="2" />
              <ellipse cx="105" cy="251" rx="3" ry="1.4" fill="#F8C8CF" opacity="0.7" />
            </g>

            {/* Right Leg */}
            <g transform={`rotate(${legRightAngle.toFixed(1)} 123 204)`}>
              <rect x="116" y="198" width="14" height="24" rx="6" fill="#FEE4D1" />
              {/* Cream Knee-High Sock */}
              <path
                d="M115.5 218 H130.5 L129.5 246 H116.5 Z"
                fill="#FFFDF9"
                stroke="#E4CBC2"
                strokeWidth="1.4"
              />
              {/* Tiny Pink Sock Bow */}
              <path d="M123 220 L118 217 L119 223 Z M123 220 L128 217 L127 223 Z" fill="#EFA7B8" />
              {/* Burgundy Mary-Jane Shoe */}
              <path
                d="M114 244 H131 C137 244 140 250 138 255 C136 259 119 259 114 256 C111 253 112 247 114 244 Z"
                fill="#8E3B46"
                stroke="#5A232B"
                strokeWidth="1.5"
              />
              <path d="M116 247 Q124 251 131 247" fill="none" stroke="#FFFDF9" strokeWidth="2" />
              <ellipse cx="131" cy="251" rx="3" ry="1.4" fill="#F8C8CF" opacity="0.7" />
            </g>

            {/* ==================== BODY, PUFFY BLOUSE & COQUETTE APRON ==================== */}
            <g transform={`rotate(${bodyLean.toFixed(1)} 110 198)`}>
              {/* Left Arm (holding a cute mini pastel strawberry macaron!) */}
              <g transform={`rotate(${armLeftAngle.toFixed(1)} 80 142)`}>
                {/* Puffy Cream Sleeve */}
                <ellipse
                  cx="74"
                  cy="148"
                  rx="14"
                  ry="16"
                  fill="#FFF9F1"
                  stroke="#D8B3A8"
                  strokeWidth="1.6"
                />
                {/* Lower Arm */}
                <path
                  d="M71 160 Q65 174 68 185"
                  fill="none"
                  stroke="#FEE4D1"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <circle cx="68" cy="187" r="6.5" fill="#FEE4D1" stroke="#DFB49C" strokeWidth="1.2" />
                {/* Cute Mini Pink Macaron Charm in Hand */}
                <g transform="translate(59, 184) rotate(-14)">
                  <ellipse cx="0" cy="-3.5" rx="7" ry="4" fill="#F29DB0" stroke="#9E3B42" strokeWidth="1" />
                  <rect x="-6.5" y="-1" width="13" height="3" rx="1.5" fill="#FFFDF9" />
                  <ellipse cx="0" cy="3.5" rx="7" ry="3.8" fill="#F29DB0" stroke="#9E3B42" strokeWidth="1" />
                </g>
              </g>

              {/* Right Arm (Waves Warmly When Greeting!) */}
              <g transform={`rotate(${armRightAngle.toFixed(1)} 140 142)`}>
                <ellipse
                  cx="146"
                  cy="148"
                  rx="14"
                  ry="16"
                  fill="#FFF9F1"
                  stroke="#D8B3A8"
                  strokeWidth="1.6"
                />
                <path
                  d="M149 160 Q156 174 152 185"
                  fill="none"
                  stroke="#FEE4D1"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <circle cx="152" cy="187" r="6.5" fill="#FEE4D1" stroke="#DFB49C" strokeWidth="1.2" />
              </g>

              {/* Cream Scalloped Lace Petticoat Under Skirt */}
              <path
                d="M74 205 Q83 214 92 205 Q101 214 110 205 Q119 214 128 205 Q137 214 146 205 L142 194 H78 Z"
                fill="#FFFDF9"
                stroke="#E4C8BE"
                strokeWidth="1.3"
              />

              {/* Soft Blush Pleated Dress Skirt */}
              <path
                d="M84 166 H136 L151 205 Q110 214 69 205 Z"
                fill="url(#patDress)"
                stroke="#C99297"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />

              {/* Cream Blouse Torso */}
              <path
                d="M84 134 Q110 128 136 134 L138 168 H82 Z"
                fill="#FFF9F1"
                stroke="#D8B3A8"
                strokeWidth="1.6"
              />

              {/* Scalloped Peter Pan Collar */}
              <path
                d="M93 134 Q101 146 110 138 Q119 146 127 134"
                fill="#FFFDF9"
                stroke="#D8B3A8"
                strokeWidth="1.5"
              />

              {/* Burgundy Coquette Patissier Apron */}
              <path
                d="M89 148 H131 L141 201 Q110 208 79 201 Z"
                fill="url(#patApron)"
                stroke="#76343A"
                strokeWidth="1.6"
              />
              {/* Apron Cream Lace Hem Scallops */}
              <path
                d="M81 199 Q88 205 95 200 Q102 206 110 201 Q118 206 125 200 Q132 205 139 199"
                fill="none"
                stroke="#FFF8F0"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Apron Straps */}
              <rect x="92" y="133" width="6.5" height="17" rx="3" fill="#F8E2DC" stroke="#9E3B42" strokeWidth="1.2" />
              <rect x="121.5" y="133" width="6.5" height="17" rx="3" fill="#F8E2DC" stroke="#9E3B42" strokeWidth="1.2" />

              {/* Sweet Apron Pocket with Heart & Mini Brass Whisk */}
              <path
                d="M97 173 H123 V186 Q110 194 97 186 Z"
                fill="#FFFDF9"
                stroke="#E2B9B6"
                strokeWidth="1.4"
              />
              {/* Mini Whisk peeking from pocket */}
              <line x1="117" y1="174" x2="122" y2="163" stroke="#C59B62" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="123" cy="160" rx="3.2" ry="5" transform="rotate(24 123 160)" fill="none" stroke="#C59B62" strokeWidth="1.3" />
              {/* Tiny Cherry Heart on Pocket */}
              <path
                d="M108 184 C103.5 180.5 103 176.5 106 176.5 C107.2 176.5 108 177.8 108 177.8 C108 177.8 108.8 176.5 110 176.5 C113 176.5 112.5 180.5 108 184 Z"
                fill="#9E3B42"
              />

              {/* Coquette Ribbon Bow at Waist / Neckline */}
              <g transform="translate(110, 141)">
                <path d="M0 0 C-9 -6 -15 -1 -10 4 C-7 7 -2 3 0 0 Z" fill="#EFA7B8" stroke="#9E3B42" strokeWidth="1.3" />
                <path d="M0 0 C9 -6 15 -1 10 4 C7 7 2 3 0 0 Z" fill="#EFA7B8" stroke="#9E3B42" strokeWidth="1.3" />
                <path d="M-1 2 L-6 11 M1 2 L6 11" stroke="#9E3B42" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="0" cy="0" r="2.8" fill="#9E3B42" />
              </g>

              {/* Soft Neck */}
              <rect x="103" y="120" width="14" height="16" rx="6" fill="#F8D6BF" />

              {/* ==================== HEAD & KAWAII COQUETTE EXPRESSION ==================== */}
              <g transform={`rotate(${(frame.headTilt * frame.facing).toFixed(1)} 110 124)`}>
                {/* Cute Ears with Tiny Pearl Earrings */}
                <circle cx="67" cy="91" r="7" fill="#F9D9C4" stroke="#E0B69E" strokeWidth="1.2" />
                <circle cx="67" cy="97" r="2.4" fill="#FFFDF9" stroke="#D3A29D" strokeWidth="1" />
                <circle cx="153" cy="91" r="7" fill="#F9D9C4" stroke="#E0B69E" strokeWidth="1.2" />
                <circle cx="153" cy="97" r="2.4" fill="#FFFDF9" stroke="#D3A29D" strokeWidth="1" />

                {/* Soft Rounded Storybook Face */}
                <path
                  d="M70 84 C70 50 86 42 110 42 C134 42 150 50 150 84 C150 112 133 125 110 125 C87 125 70 112 70 84 Z"
                  fill="#FEE7D6"
                  stroke="#DFB59D"
                  strokeWidth="1.6"
                />

                {/* Soft Rosy Watercolor Cheek Blush */}
                <ellipse cx="84" cy="99" rx="13" ry="7.5" fill="url(#patBlush)" />
                <ellipse cx="136" cy="99" rx="13" ry="7.5" fill="url(#patBlush)" />
                <circle cx="81" cy="98" r="1.4" fill="#FFFDF9" opacity="0.7" />
                <circle cx="139" cy="98" r="1.4" fill="#FFFDF9" opacity="0.7" />

                {/* Gentle Expressive Eyebrows */}
                <path
                  d="M84 74 Q92 70 100 73"
                  fill="none"
                  stroke="#6A4137"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                <path
                  d="M120 73 Q128 70 136 74"
                  fill="none"
                  stroke="#6A4137"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />

                {/* ==================== CUTE NON-CREEPY EYES ==================== */}
                {isBlinking ? (
                  /* Gentle Natural Blink */
                  <g stroke="#4A2B24" strokeWidth="2.6" strokeLinecap="round" fill="none">
                    <path d="M84 88 Q92 93 100 88" />
                    <path d="M120 88 Q128 93 136 88" />
                  </g>
                ) : isSmilingEyes ? (
                  /* Joyful Happy ^ ^ Crescent Eyes */
                  <g>
                    <path
                      d="M83 90 Q92 80 101 90"
                      fill="none"
                      stroke="#4A2B24"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M119 90 Q128 80 137 90"
                      fill="none"
                      stroke="#4A2B24"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Cute Happy Cheek Sparkles */}
                    <path d="M74 84 L75.5 87.5 L79 89 L75.5 90.5 L74 94 L72.5 90.5 L69 89 L72.5 87.5 Z" fill="#E3A857" />
                    <path d="M146 84 L147.5 87.5 L151 89 L147.5 90.5 L146 94 L144.5 90.5 L141 89 L144.5 87.5 Z" fill="#E3A857" />
                  </g>
                ) : (
                  /* Glossy Warm Espresso Kawaii Eyes (Soft, Warm, Friendly!) */
                  <g>
                    {/* Left Eye */}
                    <g>
                      <ellipse cx="92" cy="88" rx="8.5" ry="9.2" fill="#FFFDF9" />
                      <g transform={`translate(${localGazeX.toFixed(2)}, ${localGazeY.toFixed(2)})`}>
                        <ellipse cx="92" cy="88.5" rx="6.8" ry="7.8" fill="url(#patEyeIris)" />
                        <ellipse cx="92" cy="92.5" rx="4.2" ry="2.4" fill="#B57562" opacity="0.65" />
                        <circle cx="92" cy="88" r="3.4" fill="#2E1915" />
                        {/* Bright Sparkling Catchlights */}
                        <circle cx="89.4" cy="84.8" r="2.6" fill="#FFFFFF" />
                        <circle cx="94.8" cy="91.2" r="1.25" fill="#FFF6F0" />
                      </g>
                      {/* Lush Soft Eyelashes */}
                      <path
                        d="M82 85 Q92 76 101 85"
                        fill="none"
                        stroke="#442721"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                      <path d="M83 84 L79.5 81.5" stroke="#442721" strokeWidth="1.9" strokeLinecap="round" />
                    </g>

                    {/* Right Eye */}
                    <g>
                      <ellipse cx="128" cy="88" rx="8.5" ry="9.2" fill="#FFFDF9" />
                      <g transform={`translate(${localGazeX.toFixed(2)}, ${localGazeY.toFixed(2)})`}>
                        <ellipse cx="128" cy="88.5" rx="6.8" ry="7.8" fill="url(#patEyeIris)" />
                        <ellipse cx="128" cy="92.5" rx="4.2" ry="2.4" fill="#B57562" opacity="0.65" />
                        <circle cx="128" cy="88" r="3.4" fill="#2E1915" />
                        {/* Bright Sparkling Catchlights */}
                        <circle cx="125.4" cy="84.8" r="2.6" fill="#FFFFFF" />
                        <circle cx="130.8" cy="91.2" r="1.25" fill="#FFF6F0" />
                      </g>
                      {/* Lush Soft Eyelashes */}
                      <path
                        d="M119 85 Q128 76 138 85"
                        fill="none"
                        stroke="#442721"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                      <path d="M137 84 L140.5 81.5" stroke="#442721" strokeWidth="1.9" strokeLinecap="round" />
                    </g>
                  </g>
                )}

                {/* Tiny Cute Nose */}
                <path
                  d="M109 96 Q110.5 98.2 108.8 99.2"
                  fill="none"
                  stroke="#D39D84"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />

                {/* Sweet Warm Mouth */}
                {isSmilingEyes ? (
                  <g>
                    <path
                      d="M103 104 Q110 113 117 104 Z"
                      fill="#C9646F"
                      stroke="#933C46"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path d="M106 108 Q110 111 114 108" fill="#F29DAA" />
                  </g>
                ) : (
                  <path
                    d="M104 105 Q110 110.5 116 105"
                    fill="none"
                    stroke="#A35058"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )}

                {/* Fluffy Curtain Bangs & Side Hair Locks */}
                <path
                  d="M66 90 C63 54 80 34 110 34 C140 34 157 54 154 90 C148 72 140 62 132 69 C125 58 117 58 111 72 C106 58 96 58 88 70 C80 62 72 72 66 90 Z"
                  fill="url(#patHair)"
                  stroke="#3E231D"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                {/* Face-Framing Side Locks */}
                <path
                  d="M69 78 C64 94 64 112 72 122 C76 112 75 94 74 82 Z"
                  fill="#663E34"
                />
                <path
                  d="M151 78 C156 94 156 112 148 122 C144 112 145 94 146 82 Z"
                  fill="#663E34"
                />
                {/* Soft Glossy Hair Highlights */}
                <path
                  d="M84 52 Q96 44 106 49"
                  fill="none"
                  stroke="#A87465"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.65"
                />
                <path
                  d="M118 49 Q128 45 136 53"
                  fill="none"
                  stroke="#A87465"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  opacity="0.6"
                />

                {/* Coquette Scalloped Lace Patissier Headband */}
                <path
                  d="M72 56 Q110 26 148 56 Q142 46 134 50 Q126 40 118 44 Q110 35 102 44 Q94 40 86 50 Q78 46 72 56 Z"
                  fill="#FFFDF9"
                  stroke="#D8B3A8"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M76 54 Q110 32 144 54"
                  fill="none"
                  stroke="#EFA7B8"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />

                {/* Signature Coquette Satin Ribbon Bow on Headband */}
                <g transform="translate(133, 41) rotate(22)">
                  <path
                    d="M0,0 C-13,-13 -24,-4 -15,7 C-10,11 -2,4 0,0 Z"
                    fill="#F8D8DC"
                    stroke="#9E3B42"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0,0 C13,-13 24,-4 15,7 C10,11 2,4 0,0 Z"
                    fill="#F8D8DC"
                    stroke="#9E3B42"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M-2,2 Q-9,13 -14,20 L-7,19 Q-3,11 0,3 Z"
                    fill="#9E3B42"
                  />
                  <path
                    d="M2,2 Q9,13 14,20 L7,19 Q3,11 0,3 Z"
                    fill="#9E3B42"
                  />
                  <circle cx="0" cy="0" r="4.4" fill="#FFFDF9" stroke="#9E3B42" strokeWidth="2" />
                  <circle cx="0" cy="0" r="1.8" fill="#EFA7B8" />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </motion.button>
    </div>
  );
};
