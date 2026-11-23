"use client";
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ViewType } from './patisserieData';
import { CravelyEditorialSections } from './CravelyEditorialSections';

interface CafeStoryShowcaseProps {
  onNavigate: (view: ViewType) => void;
  onGoToMenuWithCake?: (menuId: number) => void;
  onNotify?: (msg: string) => void;
}

function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const RIBBON_SPARKLES = [
  { x: 204, y: 268, r: 3.6, delay: '0s' },
  { x: 306, y: 184, r: 2.8, delay: '0.4s' },
  { x: 438, y: 126, r: 3.8, delay: '0.9s' },
  { x: 762, y: 124, r: 3.5, delay: '0.2s' },
  { x: 894, y: 188, r: 2.9, delay: '0.7s' },
  { x: 996, y: 274, r: 3.7, delay: '1.1s' },
  { x: 176, y: 406, r: 2.9, delay: '0.6s' },
  { x: 1024, y: 402, r: 3.2, delay: '1.3s' },
  { x: 368, y: 504, r: 2.7, delay: '0.5s' },
  { x: 836, y: 500, r: 3.0, delay: '1.0s' },
  { x: 600, y: 98, r: 3.9, delay: '0.3s' },
  { x: 642, y: 518, r: 2.8, delay: '0.8s' },
];

const TOP_PIPING_DROPS = [
  { cx: 284, cy: 678 },
  { cx: 320, cy: 694 },
  { cx: 364, cy: 705 },
  { cx: 414, cy: 713 },
  { cx: 468, cy: 718 },
  { cx: 526, cy: 721 },
  { cx: 582, cy: 722 },
  { cx: 618, cy: 722 },
  { cx: 674, cy: 721 },
  { cx: 732, cy: 718 },
  { cx: 786, cy: 713 },
  { cx: 836, cy: 705 },
  { cx: 880, cy: 694 },
  { cx: 916, cy: 678 },
];

const BASE_PEARLS = [
  278, 322, 366, 410, 454, 498, 542, 580, 620, 658, 702, 746, 790, 834, 878, 922,
];

export const CafeStoryShowcase: React.FC<CafeStoryShowcaseProps> = ({
  onNavigate,
  onGoToMenuWithCake,
  onNotify,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  // Two-way continuous scroll sync for the full-screen birthday cake stage
  useEffect(() => {
    const syncScroll = () => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      targetProgressRef.current = clamp01(-rect.top / scrollable);
    };

    syncScroll();
    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', syncScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', syncScroll);
    };
  }, []);

  // Buttery 60fps damped interpolation
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const diff = targetProgressRef.current - progressRef.current;
      if (prefersReduced) {
        progressRef.current = targetProgressRef.current;
      } else if (Math.abs(diff) > 0.0004) {
        progressRef.current += diff * Math.min(1, dt * 7.4);
      } else {
        progressRef.current = targetProgressRef.current;
      }

      const next = progressRef.current;
      setProgress((prev) => (Math.abs(prev - next) < 0.0007 ? prev : next));
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleScrollToStagePoint = (ratio: number) => {
    const el = stageRef.current;
    if (!el) return;
    const stageTop = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: stageTop + scrollable * ratio,
      behavior: 'smooth',
    });
  };

  // ==================== 4-PHASE SCROLL CHOREOGRAPHY FOR SIGNATURE BIRTHDAY CAKE ====================
  const blowT = smoothstep(0.12, 0.3, progress);
  const flameAlive = 1 - blowT;
  const flameLean = blowT * 46;
  const emberOpacity =
    progress > 0.24 && progress < 0.46
      ? Math.sin(clamp01((progress - 0.24) / 0.22) * Math.PI) * 0.96
      : 0;

  const smokeDraw = smoothstep(0.22, 0.44, progress);
  const smokeFadeOut = 1 - smoothstep(0.42, 0.58, progress);
  const smokeOpacity = smokeDraw * smokeFadeOut;

  const ribbonOpacity = smoothstep(0.34, 0.46, progress);
  const ribbonBackUnfurl = smoothstep(0.35, 0.78, progress);
  const ribbonCrossUnfurl = smoothstep(0.41, 0.84, progress);
  const ribbonTailUnfurl = smoothstep(0.55, 0.88, progress);
  const ribbonFrontSweep = smoothstep(0.47, 0.86, progress);
  const sparkleOpacity = smoothstep(0.43, 0.78, progress);

  const cardReveal = smoothstep(0.54, 0.84, progress);

  const pullBack = smoothstep(0.24, 0.82, progress);
  const sceneScale = 1.62 - pullBack * 0.62;
  const sceneOriginY = 93 + pullBack * 7;

  const promptOpacity = 1 - smoothstep(0.05, 0.18, progress);
  const isCardVisible = cardReveal > 0.25;

  return (
    <div className="relative bg-ivory text-ink">
      {/* ==================== PART 1: ELEVATED FULL-SCREEN SIGNATURE BIRTHDAY CAKE -> BLOW CANDLE -> SMOKE -> RIBBONS -> CUTE CARD ==================== */}
      <section
        ref={stageRef}
        aria-label="Animasi Kue Ulang Tahun Cravely"
        className="relative w-full bg-ivory border-t-2 border-kuningan/65"
        style={{ height: '295vh' }}
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden flex items-end justify-center select-none">
          {/* Warm Studio Patisserie Backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 34%, #FFFDF9 0%, #F9ECDF 52%, #E8D2C6 100%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-26"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent 0px, transparent 64px, rgba(211, 162, 157, 0.24) 64px, rgba(211, 162, 157, 0.24) 128px)',
            }}
          />

          {/* Soft Arch Studio Spotlight Behind Cake */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[12%] left-1/2 -translate-x-1/2 w-[540px] sm:w-[760px] h-[72%] rounded-t-full border border-kuningan/25 opacity-60"
            style={{
              background:
                'radial-gradient(ellipse at 50% 42%, rgba(255,253,249,0.72) 0%, rgba(253,245,231,0) 74%)',
            }}
          />

          {/* Warm Candlelight Room Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: (flameAlive * 0.94).toFixed(3),
              background:
                'radial-gradient(circle at 50% 34%, rgba(255, 224, 148, 0.48) 0%, rgba(245, 206, 178, 0.16) 40%, rgba(74, 46, 40, 0.24) 100%)',
            }}
          />

          {/* Pearlescent Rose Glow When Ribbons Bloom */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: (ribbonOpacity * 0.84).toFixed(3),
              background:
                'radial-gradient(circle at 50% 30%, rgba(255, 245, 242, 0.86) 0%, rgba(241, 219, 208, 0.28) 46%, rgba(253, 245, 231, 0) 76%)',
            }}
          />

          {/* Initial Whisper Prompt */}
          <div
            className="pointer-events-none absolute top-[11%] sm:top-[12%] left-1/2 -translate-x-1/2 z-30 text-center px-4 w-full max-w-lg"
            style={{
              opacity: promptOpacity.toFixed(3),
              transform: `translate3d(-50%, ${(-progress * 60).toFixed(1)}px, 0)`,
            }}
          >
            <span className="font-script text-4xl sm:text-5xl text-cherry block leading-none drop-shadow-[0_2px_10px_rgba(255,253,249,0.9)]">
              Make a Wish
            </span>
            <p className="font-coquette text-xs sm:text-sm font-bold text-ink mt-1 tracking-wide">
              Gulir perlahan untuk meniup lilin Cravely
            </p>
          </div>

          {/* Unified Full-Screen Sculpted Coquette Birthday Cake + Pedestal + Smoke & Ribbons */}
          <div
            className="relative z-10 w-full h-full flex items-end justify-center will-change-transform"
            style={{
              transformOrigin: `50% ${sceneOriginY.toFixed(1)}%`,
              transform: `scale(${sceneScale.toFixed(4)})`,
            }}
          >
            <svg
              viewBox="0 0 1200 1120"
              preserveAspectRatio="xMidYMax meet"
              onClick={() => handleScrollToStagePoint(progress < 0.5 ? 0.94 : 0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleScrollToStagePoint(progress < 0.5 ? 0.94 : 0);
                }
              }}
              aria-label={
                progress < 0.5 ? 'Tiup lilin kue ulang tahun Cravely' : 'Nyalakan kembali lilin Cravely'
              }
              className="w-full h-full max-w-[1440px] block overflow-visible cursor-pointer focus:outline-none"
            >
              <defs>
                <filter id="cravelySmokeBlur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4.5" />
                </filter>

                <filter id="cravelyRibbonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="softCakeShadow" x="-15%" y="-15%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#5A3B33" floodOpacity="0.22" />
                </filter>

                <radialGradient id="heroCandleGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFAD9" stopOpacity="0.98" />
                  <stop offset="40%" stopColor="#FFD884" stopOpacity="0.54" />
                  <stop offset="100%" stopColor="#FFB85C" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heroCandleTopBounce" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFE9AD" stopOpacity="0.78" />
                  <stop offset="65%" stopColor="#FFDF9E" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FFDF9E" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heroFlameGrad" cx="50%" cy="68%" r="55%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FFE586" />
                  <stop offset="72%" stopColor="#F59B42" />
                  <stop offset="100%" stopColor="#D65A38" stopOpacity="0.92" />
                </radialGradient>

                <linearGradient id="smokePlumeGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#8B746B" stopOpacity="0.7" />
                  <stop offset="46%" stopColor="#DDD0C8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="ribbonSilkMain" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FDF5E7" stopOpacity="0.2" />
                  <stop offset="22%" stopColor="#F5C3CA" stopOpacity="0.94" />
                  <stop offset="52%" stopColor="#FFFDF9" stopOpacity="0.98" />
                  <stop offset="78%" stopColor="#DC98A2" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#FDF5E7" stopOpacity="0.18" />
                </linearGradient>
                <linearGradient id="ribbonSilkCherry" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E4A7AF" stopOpacity="0.28" />
                  <stop offset="38%" stopColor="#B85660" stopOpacity="0.82" />
                  <stop offset="68%" stopColor="#F4CED4" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0.22" />
                </linearGradient>
                <linearGradient id="ribbonSilkGoldEdge" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#E5C590" stopOpacity="0.1" />
                  <stop offset="48%" stopColor="#F6DCA8" stopOpacity="0.96" />
                  <stop offset="100%" stopColor="#C59B62" stopOpacity="0.18" />
                </linearGradient>

                {/* Sculpted Walnut Cake Stand */}
                <linearGradient id="walnutStandTop" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#58382C" />
                  <stop offset="24%" stopColor="#9C705A" />
                  <stop offset="52%" stopColor="#B6876E" />
                  <stop offset="76%" stopColor="#855B49" />
                  <stop offset="100%" stopColor="#462B22" />
                </linearGradient>
                <linearGradient id="walnutStandRim" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3A221B" />
                  <stop offset="32%" stopColor="#7C5444" />
                  <stop offset="68%" stopColor="#5D3B30" />
                  <stop offset="100%" stopColor="#2D1914" />
                </linearGradient>

                {/* Dimensional Velvet Cream-to-Blush Buttercream */}
                <linearGradient id="polosCakeBody" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#D7B8AB" />
                  <stop offset="14%" stopColor="#F5E5D8" />
                  <stop offset="38%" stopColor="#FFFDF9" />
                  <stop offset="60%" stopColor="#FFF9F2" />
                  <stop offset="86%" stopColor="#EBCFC4" />
                  <stop offset="100%" stopColor="#CCA89B" />
                </linearGradient>
                <linearGradient id="polosCakeBlushTint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7E4DC" stopOpacity="0" />
                  <stop offset="56%" stopColor="#F0C7C2" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#DA9D9A" stopOpacity="0.52" />
                </linearGradient>
                <linearGradient id="polosCakeTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFDF9" />
                  <stop offset="58%" stopColor="#FCF1E5" />
                  <stop offset="100%" stopColor="#EED7CC" />
                </linearGradient>
                <linearGradient id="waistRibbonGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#852E37" />
                  <stop offset="22%" stopColor="#B84B55" />
                  <stop offset="50%" stopColor="#D86E79" />
                  <stop offset="78%" stopColor="#B0444E" />
                  <stop offset="100%" stopColor="#74252D" />
                </linearGradient>
                <radialGradient id="berryGlossGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#EF7A82" />
                  <stop offset="45%" stopColor="#C13B46" />
                  <stop offset="100%" stopColor="#7C1E27" />
                </radialGradient>
                <linearGradient id="heroGoldStripe" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#9C743E" />
                  <stop offset="45%" stopColor="#F8E1B0" />
                  <stop offset="72%" stopColor="#D4AE6E" />
                  <stop offset="100%" stopColor="#896331" />
                </linearGradient>
              </defs>

              {/* A. Twin-Wisp Silky Smoke Rising Directly From Wick Tip (600, 540) */}
              {smokeOpacity > 0.01 && (
                <g style={{ opacity: smokeOpacity.toFixed(3) }}>
                  <path
                    d="M600 540 C556 472 648 410 594 336 C546 270 652 204 586 132"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - smokeDraw * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#smokePlumeGrad)"
                    strokeWidth="24"
                    strokeLinecap="round"
                    filter="url(#cravelySmokeBlur)"
                  />
                  <path
                    d="M600 540 C578 480 628 418 602 346 C578 278 626 216 598 146"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - smokeDraw * 100).toFixed(2)}
                    fill="none"
                    stroke="#FFFDF9"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    opacity="0.92"
                  />
                </g>
              )}

              {/* B. Back Swirling Satin Ribbons Transforming Out of the Smoke */}
              {ribbonOpacity > 0.01 && (
                <g style={{ opacity: ribbonOpacity.toFixed(3) }}>
                  <path
                    d="M600 540 C580 462 338 504 226 408 C118 316 196 144 374 114 C522 90 584 214 600 230 C616 214 678 90 826 114 C1004 144 1082 316 974 408 C862 504 620 462 600 540"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonBackUnfurl * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#ribbonSilkMain)"
                    strokeWidth="38"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cravelyRibbonGlow)"
                  />
                  <path
                    d="M600 540 C628 474 834 528 966 438 C1096 350 1044 162 852 152 C704 144 626 268 600 300 C574 268 496 144 348 152 C156 162 104 350 234 438 C366 528 572 474 600 540"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonCrossUnfurl * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#ribbonSilkCherry)"
                    strokeWidth="17"
                    strokeLinecap="round"
                  />
                  <path
                    d="M600 538 C580 460 340 502 228 406 C122 316 198 146 374 116 C522 92 584 214 600 230 C616 214 678 92 826 116 C1002 146 1078 316 972 406 C860 502 620 460 600 538"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonCrossUnfurl * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#ribbonSilkGoldEdge)"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M254 432 C164 478 106 548 78 624"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonTailUnfurl * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#ribbonSilkMain)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    opacity="0.88"
                  />
                  <path
                    d="M946 432 C1036 478 1094 548 1122 624"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonTailUnfurl * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#ribbonSilkMain)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    opacity="0.88"
                  />

                  <g style={{ opacity: sparkleOpacity.toFixed(3) }}>
                    {RIBBON_SPARKLES.map((sp, idx) => (
                      <g
                        key={idx}
                        className="animate-twinkle"
                        style={{
                          transformOrigin: `${sp.x}px ${sp.y}px`,
                          animationDelay: sp.delay,
                        }}
                      >
                        <circle cx={sp.x} cy={sp.y} r={sp.r} fill="#FFFDF9" />
                        <path
                          d={`M${sp.x} ${sp.y - sp.r * 2.6} L${sp.x} ${sp.y + sp.r * 2.6} M${sp.x - sp.r * 2.6} ${sp.y} L${sp.x + sp.r * 2.6} ${sp.y}`}
                          stroke="#F5D7A1"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </g>
                    ))}
                  </g>
                </g>
              )}

              {/* C. Sculpted Walnut & Brass Cake Pedestal */}
              <ellipse cx="600" cy="1114" rx="355" ry="18" fill="#3D2B28" opacity="0.26" />
              <path
                d="M492 1030 C504 1068 468 1092 422 1118 H778 C732 1092 696 1068 708 1030 Z"
                fill="url(#walnutStandRim)"
              />
              <ellipse cx="600" cy="1058" rx="116" ry="13" fill="#8C6350" opacity="0.72" />
              <ellipse cx="600" cy="1078" rx="134" ry="10" fill="#52342B" opacity="0.54" />
              <ellipse
                cx="600"
                cy="1064"
                rx="118"
                ry="11"
                fill="none"
                stroke="#E2BF88"
                strokeWidth="1.5"
                opacity="0.6"
              />

              <path
                d="M126 986 L126 1020 A474 72 0 0 0 1074 1020 L1074 986 Z"
                fill="url(#walnutStandRim)"
              />
              <ellipse
                cx="600"
                cy="986"
                rx="474"
                ry="72"
                fill="url(#walnutStandTop)"
                stroke="#C99E76"
                strokeWidth="2.8"
              />
              <ellipse
                cx="600"
                cy="986"
                rx="438"
                ry="60"
                fill="none"
                stroke="#E8C992"
                strokeWidth="1.8"
                opacity="0.72"
              />

              {/* Crisp Scalloped Gold-Edge Cake Board */}
              <ellipse cx="600" cy="988" rx="382" ry="54" fill="#462C24" opacity="0.24" />
              <ellipse
                cx="600"
                cy="976"
                rx="374"
                ry="51"
                fill="#FFFDF9"
                stroke="url(#heroGoldStripe)"
                strokeWidth="3.2"
              />

              {/* ==================== D. ELEVATED LUXURY COQUETTE BIRTHDAY CAKE ==================== */}
              <ellipse cx="600" cy="968" rx="346" ry="48" fill="#6E443A" opacity="0.18" />

              {/* Smooth Cylindrical Velvet Buttercream Body */}
              <path
                d="M258 668 L258 954 A342 50 0 0 0 942 954 L942 668 Z"
                fill="url(#polosCakeBody)"
                stroke="#DEC2B4"
                strokeWidth="1.8"
              />
              {/* Soft Blush Ombré Near Base */}
              <path
                d="M258 668 L258 954 A342 50 0 0 0 942 954 L942 668 Z"
                fill="url(#polosCakeBlushTint)"
              />

              {/* Studio Vertical Specular Sheen on Left & Right Curvature */}
              <path
                d="M320 694 L320 970"
                stroke="#FFFDF9"
                strokeWidth="26"
                opacity="0.34"
                strokeLinecap="round"
              />
              <path
                d="M366 704 L366 976"
                stroke="#FFFDF9"
                strokeWidth="10"
                opacity="0.28"
                strokeLinecap="round"
              />

              {/* Delicate Buttercream Spatula Texture Lines */}
              <path
                d="M272 758 Q442 782 600 772 T928 758"
                fill="none"
                stroke="#FFFDF9"
                strokeWidth="4.2"
                opacity="0.45"
                strokeLinecap="round"
              />
              <path
                d="M276 820 Q446 842 604 832 T924 820"
                fill="none"
                stroke="#FFFDF9"
                strokeWidth="3.6"
                opacity="0.36"
                strokeLinecap="round"
              />

              {/* Signature Cherry-Rose Satin Ribbon Wrapped Cleanly Around Cake Waist */}
              <path
                d="M258 854 A342 50 0 0 0 942 854 L942 886 A342 50 0 0 1 258 886 Z"
                fill="url(#waistRibbonGrad)"
              />
              {/* Gold Piped Trim Along Top & Bottom of Satin Waist Ribbon */}
              <path
                d="M258 856 A342 50 0 0 0 942 856"
                fill="none"
                stroke="#F5D7A2"
                strokeWidth="1.8"
                opacity="0.82"
              />
              <path
                d="M258 884 A342 50 0 0 0 942 884"
                fill="none"
                stroke="#F5D7A2"
                strokeWidth="1.8"
                opacity="0.72"
              />

              {/* Sculpted Coquette Satin Bow Tied at Front Center of Cake */}
              <g filter="url(#softCakeShadow)" transform="translate(600, 916)">
                {/* Trailing Satin Tails */}
                <path
                  d="M-10 4 C-38 28 -68 50 -86 78 L-64 76 L-50 60 C-36 42 -22 26 -6 10 Z"
                  fill="#9E3B42"
                  stroke="#F5D7A2"
                  strokeWidth="1.3"
                />
                <path
                  d="M10 4 C38 28 68 50 86 78 L64 76 L50 60 C36 42 22 26 6 10 Z"
                  fill="#9E3B42"
                  stroke="#F5D7A2"
                  strokeWidth="1.3"
                />
                {/* Left & Right Satin Bow Loops */}
                <path
                  d="M-6 -2 C-42 -42 -96 -26 -86 12 C-78 38 -34 26 -6 8 Z"
                  fill="#C4535D"
                  stroke="#F5D7A2"
                  strokeWidth="1.5"
                />
                <path
                  d="M6 -2 C42 -42 96 -26 86 12 C78 38 34 26 6 8 Z"
                  fill="#C4535D"
                  stroke="#F5D7A2"
                  strokeWidth="1.5"
                />
                {/* Inner Loop Highlights */}
                <path
                  d="M-16 0 C-42 -16 -68 -8 -62 10"
                  fill="none"
                  stroke="#F5C4CC"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M16 0 C42 -16 68 -8 62 10"
                  fill="none"
                  stroke="#F5C4CC"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                {/* Center Velvet Knot + Tiny Pearl */}
                <rect
                  x="-15"
                  y="-12"
                  width="30"
                  height="25"
                  rx="10"
                  fill="#A83C45"
                  stroke="#F5D7A2"
                  strokeWidth="1.6"
                />
                <circle cx="0" cy="0.5" r="4.8" fill="#FFFDF9" stroke="#D4AE6E" strokeWidth="1.2" />
              </g>

              {/* Delicate Gold Leaf Flecks on Smooth Buttercream */}
              <g fill="#E6BE77" opacity="0.88">
                <polygon points="418,778 428,772 433,781 422,786" />
                <polygon points="444,798 450,794 453,801 446,803" />
                <polygon points="756,772 768,766 772,775 760,780" />
                <polygon points="736,796 742,792 745,799 738,801" />
              </g>

              {/* Clean Smooth Top Frosting Surface */}
              <ellipse
                cx="600"
                cy="668"
                rx="342"
                ry="50"
                fill="url(#polosCakeTop)"
                stroke="#E4CDC0"
                strokeWidth="1.8"
              />
              {/* Soft Cream Swirl Ring on Top */}
              <ellipse
                cx="600"
                cy="668"
                rx="288"
                ry="39"
                fill="none"
                stroke="#FFFDF9"
                strokeWidth="3"
                opacity="0.75"
              />
              {/* Warm Golden Candlelight Reflection on Smooth Frosting */}
              <ellipse
                cx="600"
                cy="668"
                rx="238"
                ry="36"
                fill="url(#heroCandleTopBounce)"
                style={{ opacity: (flameAlive * 0.96).toFixed(3) }}
              />

              {/* Subtle Refined Scalloped Cream Shell Piping Along Front Top Rim */}
              <g fill="#FFFDF9" stroke="#E5CFC3" strokeWidth="1.25">
                {TOP_PIPING_DROPS.map((p, idx) => (
                  <g key={idx}>
                    <ellipse cx={p.cx} cy={p.cy} rx="22" ry="12.5" />
                    <ellipse cx={p.cx - 4} cy={p.cy - 2.5} rx="10" ry="4.5" fill="#FFFFFF" stroke="none" opacity="0.7" />
                  </g>
                ))}
              </g>

              {/* Minimalist Glossy Fresh Strawberries & Cream Pearls Around Candle Base */}
              <g filter="url(#softCakeShadow)">
                {/* Left Strawberry */}
                <g transform="translate(514, 654) rotate(-18)">
                  <path
                    d="M0 -24 C16 -24 23 -6 14 14 C8 25 -8 25 -14 14 C-23 -6 -16 -24 0 -24 Z"
                    fill="url(#berryGlossGrad)"
                  />
                  <ellipse cx="-6" cy="-8" rx="3.5" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-14)" />
                  <path d="M-12 -21 Q0 -14 12 -21 Q6 -29 0 -24 Q-6 -29 -12 -21 Z" fill="#5D7B4A" />
                </g>
                {/* Right Strawberry */}
                <g transform="translate(686, 654) rotate(18)">
                  <path
                    d="M0 -24 C16 -24 23 -6 14 14 C8 25 -8 25 -14 14 C-23 -6 -16 -24 0 -24 Z"
                    fill="url(#berryGlossGrad)"
                  />
                  <ellipse cx="-6" cy="-8" rx="3.5" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-14)" />
                  <path d="M-12 -21 Q0 -14 12 -21 Q6 -29 0 -24 Q-6 -29 -12 -21 Z" fill="#5D7B4A" />
                </g>
                {/* Delicate Sugar Pearls Framing Strawberries */}
                <circle cx="476" cy="666" r="6" fill="#FFFDF9" stroke="#D4AE6E" strokeWidth="1.2" />
                <circle cx="556" cy="672" r="5" fill="#FFFDF9" stroke="#D4AE6E" strokeWidth="1.2" />
                <circle cx="644" cy="672" r="5" fill="#FFFDF9" stroke="#D4AE6E" strokeWidth="1.2" />
                <circle cx="724" cy="666" r="6" fill="#FFFDF9" stroke="#D4AE6E" strokeWidth="1.2" />
              </g>

              {/* Refined Cream Pearl Rim Along Base */}
              <g fill="#FFFDF9" stroke="#E0C8BC" strokeWidth="1.2">
                {BASE_PEARLS.map((sx, idx, arr) => (
                  <circle
                    key={sx}
                    cx={sx}
                    cy={952 + Math.sin((idx / (arr.length - 1)) * Math.PI) * 38}
                    r="11.5"
                  />
                ))}
              </g>

              {/* E. Single Center Gold-Striped Birthday Candle (Wick at 600, 540) */}
              <ellipse cx="600" cy="662" rx="22" ry="8" fill="url(#heroGoldStripe)" />
              <rect
                x="590"
                y="556"
                width="20"
                height="106"
                rx="5"
                fill="#FFFDF8"
                stroke="#C59B62"
                strokeWidth="1.6"
              />
              <g stroke="url(#heroGoldStripe)" strokeWidth="5.2" strokeLinecap="round">
                <line x1="591.5" y1="576" x2="608.5" y2="565" />
                <line x1="591.5" y1="598" x2="608.5" y2="587" />
                <line x1="591.5" y1="620" x2="608.5" y2="609" />
                <line x1="591.5" y1="642" x2="608.5" y2="631" />
              </g>
              <path
                d="M590.5 560 Q595 574 600 565 Q605 576 609.5 560"
                fill="#FFFDF9"
                stroke="#E6D2BE"
                strokeWidth="1"
              />

              {/* Wick */}
              <line
                x1="600"
                y1="556"
                x2="600"
                y2="540"
                stroke="#3D2B28"
                strokeWidth="3.2"
                strokeLinecap="round"
              />

              {/* Luminous Halo */}
              <circle
                cx="600"
                cy="508"
                r="124"
                fill="url(#heroCandleGlow)"
                style={{ opacity: (flameAlive * 0.96).toFixed(3) }}
              />

              {/* Flickering Flame */}
              {flameAlive > 0.02 && (
                <g
                  style={{
                    transformOrigin: '600px 540px',
                    transform: `rotate(${flameLean.toFixed(1)}deg) scale(${Math.max(0, 1 - blowT * 0.72).toFixed(3)}, ${Math.max(0, 1 - blowT * 1.12).toFixed(3)})`,
                    opacity: flameAlive.toFixed(3),
                  }}
                >
                  <g className="animate-candle-flicker-2" style={{ transformOrigin: '600px 540px' }}>
                    <path
                      d="M600 458 C625 492 622 528 600 540 C578 528 575 492 600 458 Z"
                      fill="url(#heroFlameGrad)"
                    />
                    <path
                      d="M600 486 C612 507 611 528 600 535 C589 528 588 507 600 486 Z"
                      fill="#FFFFFF"
                      opacity="0.96"
                    />
                  </g>
                </g>
              )}

              {/* Warm Wick Ember */}
              {emberOpacity > 0.02 && (
                <circle
                  cx="600"
                  cy="540"
                  r="5.6"
                  fill="#F27D38"
                  style={{ opacity: emberOpacity.toFixed(3) }}
                />
              )}
            </svg>
          </div>

          {/* Cute Scalloped Lace Card Revealed Above the Cake */}
          <div
            className="absolute left-1/2 top-[29.5%] sm:top-[28.5%] z-30 w-[calc(100%-2rem)] max-w-[500px]"
            style={{
              opacity: cardReveal.toFixed(3),
              pointerEvents: isCardVisible ? 'auto' : 'none',
              transform: `translate3d(-50%, calc(-50% + ${((1 - cardReveal) * 32).toFixed(1)}px), 0) scale(${(0.84 + cardReveal * 0.16).toFixed(4)})`,
            }}
          >
            <div className="relative mx-auto">
              {/* Double-Loop Satin Coquette Bow with Dangling Pearls */}
              <div
                aria-hidden="true"
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 w-36 h-18 pointer-events-none"
              >
                <svg viewBox="0 0 180 90" className="w-full h-full drop-shadow-[0_8px_14px_rgba(122,42,49,0.28)]">
                  <defs>
                    <linearGradient id="cuteBowCherry" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#D66A74" />
                      <stop offset="55%" stopColor="#9E3B42" />
                      <stop offset="100%" stopColor="#702229" />
                    </linearGradient>
                    <linearGradient id="cuteBowBlush" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFF0F2" />
                      <stop offset="58%" stopColor="#F3C5CD" />
                      <stop offset="100%" stopColor="#DA939F" />
                    </linearGradient>
                  </defs>
                  <path d="M84 46 Q62 64 46 84" fill="none" stroke="url(#cuteBowCherry)" strokeWidth="8.5" strokeLinecap="round" />
                  <path d="M96 46 Q118 64 134 84" fill="none" stroke="url(#cuteBowCherry)" strokeWidth="8.5" strokeLinecap="round" />
                  <path d="M88 42 C58 8 16 14 22 40 C26 56 62 54 88 44 Z" fill="url(#cuteBowBlush)" stroke="#C59B62" strokeWidth="1.4" />
                  <path d="M92 42 C122 8 164 14 158 40 C154 56 118 54 92 44 Z" fill="url(#cuteBowBlush)" stroke="#C59B62" strokeWidth="1.4" />
                  <path d="M88 43 C65 20 34 24 40 42 C44 53 70 50 88 44 Z" fill="url(#cuteBowCherry)" stroke="#F6DBA4" strokeWidth="1.1" />
                  <path d="M92 43 C115 20 146 24 140 42 C136 53 110 50 92 44 Z" fill="url(#cuteBowCherry)" stroke="#F6DBA4" strokeWidth="1.1" />
                  <line x1="82" y1="48" x2="78" y2="66" stroke="#E5C590" strokeWidth="1.5" />
                  <circle cx="78" cy="69" r="3.8" fill="#FFFDF9" stroke="#C59B62" strokeWidth="1.1" />
                  <line x1="98" y1="48" x2="102" y2="66" stroke="#E5C590" strokeWidth="1.5" />
                  <circle cx="102" cy="69" r="3.8" fill="#FFFDF9" stroke="#C59B62" strokeWidth="1.1" />
                  <circle cx="90" cy="43" r="10.5" fill="#B54650" stroke="#F6DBA4" strokeWidth="1.6" />
                  <circle cx="90" cy="43" r="4" fill="#FFFDF9" />
                </svg>
              </div>

              <div
                className="relative rounded-[34px] p-[9px] shadow-[0_24px_52px_-10px_rgba(90,59,51,0.26)]"
                style={{
                  backgroundColor: '#F7E1E4',
                  backgroundImage: 'radial-gradient(circle, #FFFDF9 54%, transparent 57%)',
                  backgroundSize: '18px 18px',
                  backgroundPosition: 'center',
                  border: '2px solid #D8A6AC',
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-3.5 -right-3.5 w-11 h-11 rounded-full bg-[#FFFDF9] border-2 border-[#C59B62] shadow-sm z-20 flex flex-col items-center justify-center leading-none rotate-12"
                >
                  <span className="text-[7px] font-extrabold tracking-widest text-burgundy uppercase">
                    Est.
                  </span>
                  <span className="font-coquette text-[10px] font-bold text-cherry tabular-nums">
                    2018
                  </span>
                </div>

                <div className="relative rounded-[26px] bg-[#FFFDF9] border-[1.5px] border-[#C59B62]/80 px-5 sm:px-8 pt-7 pb-5 text-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-[20px] border border-dashed border-[#DFABB2]/80"
                  />
                  <div className="relative z-10 space-y-2">
                    <span className="font-script text-3xl sm:text-4xl text-cherry block leading-none">
                      Cravely Bandung
                    </span>
                    <p className="font-serif text-[14.5px] sm:text-[16px] text-ink/88 leading-relaxed max-w-md mx-auto">
                      Semoga setiap harapan manismu terkabul. Gulir ke bawah untuk menjelajahi
                      cerita dapur, menu populer, proses pembuatan, dan reservasi Cravely.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigate('katalog')}
                        className="px-4 py-1.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                      >
                        Pesan Kue Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScrollToStagePoint(0)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/62 hover:text-cherry transition-colors whitespace-nowrap"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Nyalakan Lilin</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Foreground Translucent Satin Ribbon Sweep */}
          {ribbonOpacity > 0.01 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-40 flex items-end justify-center will-change-transform"
              style={{
                transformOrigin: `50% ${sceneOriginY.toFixed(1)}%`,
                transform: `scale(${sceneScale.toFixed(4)})`,
              }}
            >
              <svg
                viewBox="0 0 1200 1120"
                preserveAspectRatio="xMidYMax meet"
                className="w-full h-full max-w-[1440px] block overflow-visible"
              >
                <defs>
                  <linearGradient id="frontRibbonSilkMain" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#FDF5E7" stopOpacity="0.16" />
                    <stop offset="28%" stopColor="#F5C3CA" stopOpacity="0.88" />
                    <stop offset="52%" stopColor="#FFFDF9" stopOpacity="0.94" />
                    <stop offset="76%" stopColor="#DC98A2" stopOpacity="0.86" />
                    <stop offset="100%" stopColor="#FDF5E7" stopOpacity="0.16" />
                  </linearGradient>
                  <linearGradient id="frontRibbonGoldEdge" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#E5C590" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#F6DCA8" stopOpacity="0.94" />
                    <stop offset="100%" stopColor="#C59B62" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                <g style={{ opacity: (ribbonOpacity * 0.72).toFixed(3) }}>
                  <path
                    d="M214 436 C366 522 834 522 986 436"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonFrontSweep * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#frontRibbonSilkMain)"
                    strokeWidth="15"
                    strokeLinecap="round"
                    opacity="0.72"
                  />
                  <path
                    d="M240 444 C394 518 806 518 960 444"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={(100 - ribbonFrontSweep * 100).toFixed(2)}
                    fill="none"
                    stroke="url(#frontRibbonGoldEdge)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.86"
                  />
                </g>
              </svg>
            </div>
          )}

          {/* Bottom Tiup Lilin Button While Lit */}
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40"
            style={{
              opacity: promptOpacity.toFixed(3),
              pointerEvents: promptOpacity > 0.2 ? 'auto' : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => handleScrollToStagePoint(0.94)}
              className="px-5 py-2 rounded-full bg-[#FFFDF9]/94 hover:bg-cherry hover:text-white text-ink border border-kuningan/85 text-xs font-bold shadow-lg transition-colors whitespace-nowrap"
            >
              Tiup Lilin
            </button>
          </div>
        </div>
      </section>

      {/* ==================== PART 2: RICH EDITORIAL PATISSERIE JOURNEY (FOLLOWING REFERENCE VIDEO FLOW) ==================== */}
      <CravelyEditorialSections
        onNavigate={onNavigate}
        onGoToMenuWithCake={onGoToMenuWithCake}
        onNotify={onNotify}
      />
    </div>
  );
};
