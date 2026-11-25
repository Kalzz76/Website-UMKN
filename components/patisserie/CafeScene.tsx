"use client";
import React, { useEffect, useRef, useState } from 'react';
import { WalkingPatissier } from './WalkingPatissier';
import type { CafeZone, ViewType } from './patisserieData';

interface CafeSceneProps {
  startInside: boolean;
  alwaysInside?: boolean;
  onEnteredChange: (isInside: boolean) => void;
  onNavigate: (view: ViewType) => void;
  onOpenInfo: () => void;
  toko?: any;
}

export const CafeScene: React.FC<CafeSceneProps> = ({
  startInside,
  alwaysInside = false,
  onEnteredChange,
  onNavigate,
  onOpenInfo,
  toko = null,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cafeContainerRef = useRef<HTMLDivElement | null>(null);
  const [zoomingEtalase, setZoomingEtalase] = useState(false);
  const [warmLighting, setWarmLighting] = useState(false);
  const [activeZone, setActiveZone] = useState<CafeZone>(null);
  const [tetehBlink, setTetehBlink] = useState(false);
  const [spotlightIdx, setSpotlightIdx] = useState(0);

  // Silky-smooth two-way scroll-linked parallax progress: 0 = outside street, 1 = inside café
  const isInsideInitial = alwaysInside || startInside;
  const progressRef = useRef(isInsideInitial ? 1 : 0);
  const targetProgressRef = useRef(isInsideInitial ? 1 : 0);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseSmoothRef = useRef({ x: 0, y: 0 });
  const lastEnteredRef = useRef(isInsideInitial);
  const [parallaxState, setParallaxState] = useState({
    progress: isInsideInitial ? 1 : 0,
    mx: 0,
    my: 0,
  });

  const getScrollRange = () => {
    const stage = stageRef.current;
    if (!stage) return Math.max(1, window.innerHeight * 1.35);
    return Math.max(1, stage.offsetHeight - window.innerHeight);
  };

  // On initial mount (e.g. returning from Etalase/Kasir/Custom), position cleanly inside or outside
  useEffect(() => {
    if (alwaysInside) {
      progressRef.current = 1;
      targetProgressRef.current = 1;
      lastEnteredRef.current = true;
      setParallaxState((prev) => ({ ...prev, progress: 1 }));
      onEnteredChange(true);
      return;
    }
    const range = getScrollRange();
    if (startInside) {
      window.scrollTo({ top: range, behavior: 'instant' });
      progressRef.current = 1;
      targetProgressRef.current = 1;
      lastEnteredRef.current = true;
      setParallaxState((prev) => ({ ...prev, progress: 1 }));
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      progressRef.current = 0;
      targetProgressRef.current = 0;
      lastEnteredRef.current = false;
      setParallaxState((prev) => ({ ...prev, progress: 0 }));
    }
  }, [startInside, alwaysInside, onEnteredChange]);

  // Natural gentle blinking for Teteh Kasir behind the counter
  useEffect(() => {
    let t1: number;
    let t2: number;
    const schedule = () => {
      t1 = window.setTimeout(() => {
        setTetehBlink(true);
        t2 = window.setTimeout(() => {
          setTetehBlink(false);
          schedule();
        }, 140);
      }, 3100 + Math.random() * 2200);
    };
    schedule();
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Gentle staggered one-by-one interactive sign cycle inside the café (pauses while hovering any zone)
  useEffect(() => {
    if (activeZone !== null) return;
    const timer = window.setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % 4);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [activeZone]);

  // Mouse micro-parallax for lively 3D depth on storefront exterior
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      mouseTargetRef.current = { x: nx, y: ny };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Continuous two-way scroll listener (scroll DOWN to walk inside, scroll UP to walk back outside!)
  useEffect(() => {
    if (alwaysInside) return;

    const syncScrollProgress = () => {
      const range = getScrollRange();
      const raw = Math.max(0, Math.min(1, window.scrollY / range));
      targetProgressRef.current = raw;
    };

    syncScrollProgress();
    window.addEventListener('scroll', syncScrollProgress, { passive: true });
    window.addEventListener('resize', syncScrollProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncScrollProgress);
      window.removeEventListener('resize', syncScrollProgress);
    };
  }, [alwaysInside]);

  // Smooth 60fps damped interpolation loop for buttery scroll & mouse parallax
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const pDiff = targetProgressRef.current - progressRef.current;
      if (prefersReduced) {
        progressRef.current = targetProgressRef.current;
      } else if (Math.abs(pDiff) > 0.0006) {
        progressRef.current += pDiff * Math.min(1, dt * 8.5);
      } else {
        progressRef.current = targetProgressRef.current;
      }

      mouseSmoothRef.current.x +=
        (mouseTargetRef.current.x - mouseSmoothRef.current.x) * Math.min(1, dt * 5.5);
      mouseSmoothRef.current.y +=
        (mouseTargetRef.current.y - mouseSmoothRef.current.y) * Math.min(1, dt * 5.5);

      const p = progressRef.current;
      const mx = mouseSmoothRef.current.x;
      const my = mouseSmoothRef.current.y;

      // Notify parent when crossing the doorway threshold so hanging navbar appears/hides smoothly
      if (p > 0.72 && !lastEnteredRef.current) {
        lastEnteredRef.current = true;
        onEnteredChange(true);
      } else if (p < 0.62 && lastEnteredRef.current) {
        lastEnteredRef.current = false;
        onEnteredChange(false);
      }

      setParallaxState((prev) => {
        if (
          Math.abs(prev.progress - p) < 0.0005 &&
          Math.abs(prev.mx - mx) < 0.002 &&
          Math.abs(prev.my - my) < 0.002
        ) {
          return prev;
        }
        return { progress: p, mx, my };
      });

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [onEnteredChange]);

  const handleSmoothEnter = () => {
    const range = getScrollRange();
    window.scrollTo({ top: range, behavior: 'smooth' });
  };

  const handleEnterEtalase = () => {
    if (zoomingEtalase) return;
    setZoomingEtalase(true);
    window.setTimeout(() => {
      onNavigate('etalase');
      setZoomingEtalase(false);
    }, 560);
  };

  // Derived smooth parallax transforms from progress (0..1)
  const p = parallaxState.progress;
  const mx = parallaxState.mx;
  const my = parallaxState.my;
  const showExteriorOverlay = !alwaysInside && p < 0.992;

  // Ease curves
  const doorPhase = Math.min(1, p / 0.48); // doors open smoothly in first 48%
  const doorEase = 1 - Math.pow(1 - doorPhase, 3);
  const doorAngle = doorEase * 82;

  const walkThroughPhase = Math.max(0, (p - 0.14) / 0.86);
  const walkEase =
    walkThroughPhase < 0.5
      ? 2 * walkThroughPhase * walkThroughPhase
      : 1 - Math.pow(-2 * walkThroughPhase + 2, 2) / 2;

  const skyScale = 1 + walkEase * 0.25;
  const facadeScale = 1 + walkEase * 1.65;
  const facadeOpacity = p < 0.58 ? 1 : Math.max(0, 1 - (p - 0.58) / 0.36);

  const fgSpread = walkEase * 320;
  const fgScale = 1 + walkEase * 0.55;
  const fgOpacity = p < 0.46 ? 1 : Math.max(0, 1 - (p - 0.46) / 0.34);

  // Interior gracefully zooms from 0.91 -> 1.0 as you step in
  const interiorScale = zoomingEtalase ? 2.18 : 0.91 + 0.09 * Math.min(1, p * 1.15);
  const interiorY = zoomingEtalase ? -3 : 0;

  const tetehHappy = activeZone === 'kasir';

  return (
    <>
      {/* Shared SVG Definitions for Café Interior & Exterior */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="fBayangan" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#3D2B28" floodOpacity="0.18" />
          </filter>
          <filter id="fBayanganKecil" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3D2B28" floodOpacity="0.22" />
          </filter>

          <linearGradient id="gLangitPagi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9DEC9" />
            <stop offset="48%" stopColor="#FDECE1" />
            <stop offset="100%" stopColor="#F5DDD5" />
          </linearGradient>
          <linearGradient id="gFasadTembok" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7EBDD" />
            <stop offset="55%" stopColor="#FCF5EC" />
            <stop offset="100%" stopColor="#E9D6C3" />
          </linearGradient>
          <linearGradient id="gKayuWalnut" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4B3028" />
            <stop offset="35%" stopColor="#6B473C" />
            <stop offset="70%" stopColor="#5B3B31" />
            <stop offset="100%" stopColor="#3F2720" />
          </linearGradient>
          <linearGradient id="gKuningan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E5C590" />
            <stop offset="50%" stopColor="#B8925A" />
            <stop offset="100%" stopColor="#876636" />
          </linearGradient>
          <linearGradient id="gMarmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F7F0E8" />
            <stop offset="100%" stopColor="#EAE0D5" />
          </linearGradient>
          <linearGradient id="gKacaEtalase" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#FFF9F2" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#EBD3C8" stopOpacity="0.36" />
          </linearGradient>
          <linearGradient id="gTrotoar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E3D0BE" />
            <stop offset="100%" stopColor="#BDA78E" />
          </linearGradient>
          <linearGradient id="gInteriorHangat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE9BF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E6B89C" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="gWainscot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8CBC0" />
            <stop offset="100%" stopColor="#D6B0A2" />
          </linearGradient>

          <radialGradient id="gSorotLampu" cx="0.5" cy="0.12" r="0.88">
            <stop offset="0%" stopColor="#FFF2CC" stopOpacity="0.62" />
            <stop offset="55%" stopColor="#FFE6A8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFE6A8" stopOpacity="0" />
          </radialGradient>

          <pattern id="pDindingGaris" width="120" height="100" patternUnits="userSpaceOnUse">
            <rect width="60" height="100" fill="#FDF5E7" />
            <rect x="60" width="60" height="100" fill="#F4DFD6" />
          </pattern>

          <pattern id="pKanopiGaris" width="64" height="20" patternUnits="userSpaceOnUse">
            <rect width="32" height="20" fill="#9F5A58" />
            <rect x="32" width="32" height="20" fill="#FDF6EC" />
          </pattern>

          <pattern id="pLantaiDalam" width="96" height="48" patternUnits="userSpaceOnUse">
            <rect width="96" height="48" fill="#F8EFE2" />
            <polygon points="0,0 48,0 38,24 -10,24" fill="#E6D2BE" />
            <polygon points="48,24 96,24 86,48 38,48" fill="#E6D2BE" />
          </pattern>

          {/* ==================== INTERIOR LAYER 1: WALLS, PLAQUE, COOKIE SHELF & NEW CAFE WALL MENU BOARD ==================== */}
          <symbol id="sIsiLatar" viewBox="0 0 1600 900">
            <rect width="1600" height="560" fill="url(#pDindingGaris)" />
            <rect y="560" width="1600" height="230" fill="url(#gWainscot)" />
            <rect y="554" width="1600" height="12" fill="#FFFDF9" stroke="#CDB8A2" strokeWidth="1.5" />

            <rect x="0" y="0" width="1600" height="24" fill="url(#gKayuWalnut)" />
            <rect x="0" y="24" width="1600" height="6" fill="#C59B62" />

            <rect y="785" width="1600" height="115" fill="url(#pLantaiDalam)" />
            <rect y="782" width="1600" height="6" fill="#B59B84" />

            {/* Oval Wall Plaque & Cupcake Medallions */}
            <g filter="url(#fBayangan)">
              <circle cx="515" cy="222" r="46" fill="#FDF5E7" stroke="#A36361" strokeWidth="4" />
              <circle cx="515" cy="222" r="39" fill="none" stroke="#B8925A" strokeWidth="1.5" />
              <path d="M498 228 L503 246 H527 L532 228 Z" fill="#D3A29D" />
              <path d="M495 228 Q515 206 535 228 Z" fill="#A36361" />
              <circle cx="515" cy="212" r="5" fill="#B23A48" />

              <ellipse cx="800" cy="222" rx="195" ry="68" fill="#F1DBD0" stroke="#A36361" strokeWidth="5" />
              <ellipse cx="800" cy="222" rx="184" ry="59" fill="none" stroke="#B8925A" strokeWidth="2" />
              <text
                x="800"
                y="227"
                textAnchor="middle"
                fontSize="30"
                fontWeight="700"
                letterSpacing="4"
                fill="#A36361"
                fontFamily="Cinzel Decorative, Cormorant Garamond, serif"
              >
                Cravely
              </text>
              <text
                x="800"
                y="250"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                letterSpacing="3"
                fill="#5A3B33"
              >
                PATISSERIE &amp; CAKE ATELIER
              </text>

              <circle cx="1085" cy="222" r="46" fill="#FDF5E7" stroke="#A36361" strokeWidth="4" />
              <circle cx="1085" cy="222" r="39" fill="none" stroke="#B8925A" strokeWidth="1.5" />
              <path d="M1068 228 L1073 246 H1097 L1102 228 Z" fill="#CDBFAA" />
              <path d="M1065 228 Q1085 206 1105 228 Z" fill="#6B4A3E" />
              <circle cx="1085" cy="212" r="5" fill="#D3A29D" />
            </g>

            {/* ==================== GRAND CAFE WALL MENU BOARD (REPLACES COOKIE SHELF) ==================== */}
            <g filter="url(#fBayangan)">
              {/* Hanging Brass Rods from Ceiling Trim */}
              <line x1="152" y1="30" x2="152" y2="158" stroke="#B8925A" strokeWidth="3" />
              <line x1="336" y1="30" x2="336" y2="158" stroke="#B8925A" strokeWidth="3" />
              <circle cx="152" cy="158" r="5" fill="url(#gKuningan)" />
              <circle cx="336" cy="158" r="5" fill="url(#gKuningan)" />

              {/* Decorative Arch Crown Top */}
              <path
                d="M170 156 Q244 126 318 156 Z"
                fill="url(#gKayuWalnut)"
                stroke="url(#gKuningan)"
                strokeWidth="3.5"
              />
              <circle cx="244" cy="145" r="5" fill="#F5D7A1" />

              {/* Main Walnut & Brass Wall Menu Board */}
              <rect
                x="100"
                y="156"
                width="288"
                height="248"
                rx="14"
                fill="url(#gKayuWalnut)"
                stroke="url(#gKuningan)"
                strokeWidth="4.5"
              />
              {/* Dark Patisserie Chalkboard Inner Surface */}
              <rect
                x="112"
                y="168"
                width="264"
                height="224"
                rx="8"
                fill="#392521"
                stroke="#A57E46"
                strokeWidth="1.5"
              />

              {/* Header */}
              <text
                x="244"
                y="196"
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                letterSpacing="3"
                fill="#F5D7A1"
                fontFamily="Cinzel Decorative, Cormorant Garamond, serif"
              >
                PAPAN MENU
              </text>
              <text
                x="244"
                y="213"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                letterSpacing="2.4"
                fill="#F3C3BC"
                fontFamily="Quicksand, sans-serif"
              >
                CRAVELY PATISSERIE · PESAN DISINI
              </text>
              <line x1="134" y1="223" x2="354" y2="223" stroke="#B8925A" strokeWidth="1.2" opacity="0.75" />

              {/* Complete Categorized Menu Prices */}
              <g fontSize="12" fontWeight="700" fill="#FDF5E7" fontFamily="Quicksand, sans-serif">
                <text x="128" y="248">Chiffon &amp; Kue Ultah</text>
                <text x="360" y="248" textAnchor="end" fill="#F5D7A1">138K – 245K</text>

                <text x="128" y="274">Cupcakes Manis</text>
                <text x="360" y="274" textAnchor="end" fill="#F3C3BC">35K – 42K</text>

                <text x="128" y="300">Signature Whole Cake</text>
                <text x="360" y="300" textAnchor="end" fill="#F3C3BC">185K – 210K</text>

                <text x="128" y="326">Donuts &amp; Ice Sundae</text>
                <text x="360" y="326" textAnchor="end" fill="#F3C3BC">28K – 48K</text>

                <text x="128" y="352">Custom Cake 3D</text>
                <text x="360" y="352" textAnchor="end" fill="#F5D7A1">Mulai 85K</text>
              </g>

              {/* Bottom Highlight Strip */}
              <rect x="130" y="364" width="228" height="20" rx="10" fill="#9E3B42" />
              <text
                x="244"
                y="378"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                letterSpacing="1.2"
                fill="#FFFDF9"
                fontFamily="Quicksand, sans-serif"
              >
                KLIK PAPAN · LIHAT FOTO &amp; PESAN →
              </text>
            </g>

            {/* Brass Wall Light Switch */}
            <g filter="url(#fBayanganKecil)">
              <rect x="406" y="388" width="42" height="62" rx="8" fill="url(#gKuningan)" stroke="#5A3B33" strokeWidth="2" />
              <rect x="411" y="393" width="32" height="52" rx="5" fill="#FDF5E7" stroke="#B8925A" strokeWidth="1" />
              <circle cx="416" cy="398" r="1.5" fill="#8C6936" />
              <circle cx="438" cy="398" r="1.5" fill="#8C6936" />
              <circle cx="416" cy="440" r="1.5" fill="#8C6936" />
              <circle cx="438" cy="440" r="1.5" fill="#8C6936" />
              <rect x="417" y="408" width="9" height="18" rx="3" fill="#E6D5C3" stroke="#B8925A" strokeWidth="1.2" />
              <rect x="429" y="408" width="9" height="18" rx="3" fill="#E6D5C3" stroke="#B8925A" strokeWidth="1.2" />
              <circle cx="427" cy="434" r="3" fill="#E89F43" />
            </g>
          </symbol>

          {/* ==================== INTERIOR LAYER 3: COUNTERS, GLASS DISPLAY, CUSTOM STUDIO, LAMPS ==================== */}
          <symbol id="sIsiDepan" viewBox="0 0 1600 900">
            {/* Left Cashier Desk */}
            <g filter="url(#fBayangan)">
              <rect x="95" y="545" width="320" height="238" rx="10" fill="#D3A29D" stroke="#A36361" strokeWidth="2.5" />
              <rect x="115" y="572" width="280" height="182" rx="6" fill="none" stroke="#F1DBD0" strokeWidth="2.5" />
              <rect x="82" y="528" width="346" height="20" rx="6" fill="url(#gMarmer)" stroke="#CDBFAA" strokeWidth="2" />
              {/* POS Tablet */}
              <rect x="122" y="458" width="84" height="56" rx="8" fill="#3D2B28" stroke="#B8925A" strokeWidth="3" />
              <rect x="130" y="466" width="68" height="38" rx="4" fill="#FDF5E7" />
              <rect x="138" y="473" width="34" height="7" rx="2" fill="#A36361" />
              <rect x="138" y="486" width="48" height="6" rx="2" fill="#CDBFAA" />
              <rect x="155" y="514" width="16" height="14" fill="url(#gKuningan)" />
              {/* QRIS & Brass Service Bell */}
              <rect x="336" y="484" width="36" height="44" rx="5" fill="#FFFFFF" stroke="#A36361" strokeWidth="2" />
              <rect x="344" y="492" width="20" height="20" fill="#3D2B28" />
              <path d="M380 528 A13 11 0 0 1 406 528 Z" fill="url(#gKuningan)" />
            </g>

            {/* Center Glass Cake Display Case */}
            <g filter="url(#fBayangan)">
              <path
                d="M465 568 V375 Q465 335 510 335 H1090 Q1135 335 1135 375 V568 Z"
                fill="#FFFDF9"
                fillOpacity="0.82"
                stroke="url(#gKuningan)"
                strokeWidth="5"
              />
              <path
                d="M473 564 V378 Q473 343 512 343 H1088 Q1127 343 1127 378 V564 Z"
                fill="#F9ECE4"
                fillOpacity="0.62"
              />

              <rect x="473" y="464" width="654" height="8" fill="#DCE5E8" stroke="#B8925A" strokeWidth="1.5" />
              <line x1="495" y1="350" x2="1105" y2="350" stroke="#FFF2CC" strokeWidth="4" />

              {/* Top Shelf Cakes */}
              <ellipse cx="590" cy="460" rx="52" ry="9" fill="#FFFFFF" stroke="#CDBFAA" strokeWidth="1.5" />
              <path d="M550 416 L550 454 A40 9 0 0 0 630 454 L630 416 Z" fill="#A36361" />
              <ellipse cx="590" cy="416" rx="40" ry="9" fill="#F1DBD0" />
              <circle cx="578" cy="410" r="6" fill="#B23A48" />
              <circle cx="590" cy="408" r="7" fill="#B23A48" />
              <circle cx="602" cy="410" r="6" fill="#B23A48" />

              <ellipse cx="800" cy="460" rx="54" ry="9" fill="#FFFFFF" stroke="#CDBFAA" strokeWidth="1.5" />
              <path d="M758 412 L758 454 A42 9 0 0 0 842 454 L842 412 Z" fill="#6B4A3E" />
              <ellipse cx="800" cy="412" rx="42" ry="9" fill="#CDBFAA" />
              <circle cx="788" cy="406" r="5" fill="#3D2B28" />
              <circle cx="800" cy="404" r="6" fill="#3D2B28" />
              <circle cx="812" cy="406" r="5" fill="#3D2B28" />

              <ellipse cx="1010" cy="460" rx="52" ry="9" fill="#FFFFFF" stroke="#CDBFAA" strokeWidth="1.5" />
              <path d="M970 416 L970 454 A40 9 0 0 0 1050 454 L1050 416 Z" fill="#D3A29D" />
              <ellipse cx="1010" cy="416" rx="40" ry="9" fill="#FDF5E7" />
              <circle cx="1010" cy="408" r="7" fill="#A36361" />

              <rect x="473" y="556" width="654" height="9" fill="#DCE5E8" stroke="#B8925A" strokeWidth="1.5" />
              <line x1="490" y1="474" x2="1110" y2="474" stroke="#FFF2CC" strokeWidth="3" />

              {/* Bottom Shelf Cakes */}
              <ellipse cx="630" cy="552" rx="48" ry="8" fill="#FFFFFF" stroke="#CDBFAA" strokeWidth="1.5" />
              <path d="M594 514 L594 546 A36 8 0 0 0 666 546 L666 514 Z" fill="#F1DBD0" />
              <ellipse cx="630" cy="514" rx="36" ry="8" fill="#FDF5E7" />
              <circle cx="630" cy="507" r="6" fill="#B23A48" />

              <ellipse cx="800" cy="552" rx="50" ry="8" fill="#FFFFFF" stroke="#CDBFAA" strokeWidth="1.5" />
              <path d="M762 512 L762 546 A38 8 0 0 0 838 546 L838 512 Z" fill="#D3A29D" />
              <ellipse cx="800" cy="512" rx="38" ry="8" fill="#F1DBD0" />

              <ellipse cx="970" cy="552" rx="48" ry="8" fill="#FFFFFF" stroke="#CDBFAA" strokeWidth="1.5" />
              <path d="M934 514 L934 546 A36 8 0 0 0 1006 546 L1006 514 Z" fill="#8A5A3C" />
              <ellipse cx="970" cy="514" rx="36" ry="8" fill="#F1DBD0" />

              <polygon points="495,343 585,343 525,564 473,564" fill="url(#gKacaEtalase)" pointerEvents="none" />
              <polygon points="610,343 645,343 585,564 550,564" fill="url(#gKacaEtalase)" pointerEvents="none" />

              <rect x="445" y="568" width="710" height="22" rx="6" fill="url(#gMarmer)" stroke="#CDBFAA" strokeWidth="2" />
              <rect x="462" y="590" width="676" height="180" rx="8" fill="#A36361" />
              <rect x="492" y="612" width="190" height="132" rx="6" fill="none" stroke="#F1DBD0" strokeWidth="2.5" opacity="0.7" />
              <rect x="705" y="612" width="190" height="132" rx="6" fill="none" stroke="#F1DBD0" strokeWidth="2.5" opacity="0.7" />
              <rect x="918" y="612" width="190" height="132" rx="6" fill="none" stroke="#F1DBD0" strokeWidth="2.5" opacity="0.7" />
              <rect x="456" y="768" width="688" height="16" rx="3" fill="url(#gKuningan)" />
            </g>

            {/* ==================== RIGHT SIDE: CUSTOM CAKE STUDIO SIGN + ARCHED KITCHEN ROOM DOOR ==================== */}
            <g filter="url(#fBayangan)">
              {/* Preserved "CUSTOM CAKE STUDIO" Vintage Wall Signboard Above Door */}
              <rect
                x="1220"
                y="174"
                width="272"
                height="72"
                rx="12"
                fill="#F1DBD0"
                stroke="url(#gKayuWalnut)"
                strokeWidth="5"
              />
              <rect x="1230" y="183" width="252" height="54" rx="7" fill="#FFFDF9" stroke="#C59B62" strokeWidth="1.5" />
              <text
                x="1356"
                y="211"
                textAnchor="middle"
                fontSize="14.5"
                fontWeight="700"
                letterSpacing="1.6"
                fill="#A36361"
                fontFamily="Cinzel Decorative, Cormorant Garamond, serif"
              >
                CUSTOM CAKE STUDIO
              </text>
              <text
                x="1356"
                y="228"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                letterSpacing="2.2"
                fill="#6B473C"
                fontFamily="Quicksand, sans-serif"
              >
                DESAIN KUE 3D · PINTU DAPUR
              </text>

              {/* Arched Walnut Door Frame Leading Into Kitchen Room */}
              <path
                d="M1230 784 V348 A126 84 0 0 1 1482 348 V784 Z"
                fill="url(#gKayuWalnut)"
                stroke="#3A231D"
                strokeWidth="3"
              />
              {/* Inner Door Leaf */}
              <path
                d="M1248 782 V354 A108 70 0 0 1 1464 354 V782 Z"
                fill="#6A453A"
                stroke="#C59B62"
                strokeWidth="2.5"
              />

              {/* Warm Frosted Glass Upper Door Pane Showing Glowing Bakery Kitchen */}
              <path
                d="M1268 528 V360 A88 54 0 0 1 1444 360 V528 Z"
                fill="url(#gInteriorHangat)"
                stroke="#C59B62"
                strokeWidth="3"
              />
              {/* Subtle Tiered Cake Silhouette Behind Frosted Kitchen Glass */}
              <g opacity="0.34">
                <ellipse cx="1356" cy="496" rx="52" ry="9" fill="#8C534E" />
                <rect x="1316" y="454" width="80" height="40" rx="6" fill="#A36361" />
                <rect x="1328" y="422" width="56" height="32" rx="5" fill="#C47D7B" />
                <circle cx="1356" cy="414" r="7" fill="#9E3B42" />
              </g>
              {/* Glass Mullions & Soft Glint */}
              <line x1="1356" y1="306" x2="1356" y2="528" stroke="#6B473C" strokeWidth="3" opacity="0.7" />
              <line x1="1268" y1="444" x2="1444" y2="444" stroke="#6B473C" strokeWidth="3" opacity="0.7" />
              <polygon points="1276,348 1318,348 1286,522 1268,522" fill="#FFFFFF" opacity="0.26" />

              {/* Hanging Brass "KITCHEN ROOM" Plaque on Door Glass */}
              <line x1="1356" y1="398" x2="1322" y2="416" stroke="#8C6936" strokeWidth="1.8" />
              <line x1="1356" y1="398" x2="1390" y2="416" stroke="#8C6936" strokeWidth="1.8" />
              <circle cx="1356" cy="397" r="3" fill="#B8925A" />
              <rect
                x="1290"
                y="414"
                width="132"
                height="42"
                rx="8"
                fill="#FFFDF9"
                stroke="url(#gKuningan)"
                strokeWidth="2.5"
              />
              <text
                x="1356"
                y="433"
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                letterSpacing="1.6"
                fill="#9E3B42"
                fontFamily="Cinzel Decorative, Cormorant Garamond, serif"
              >
                KITCHEN ROOM
              </text>
              <text
                x="1356"
                y="448"
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="700"
                letterSpacing="1.5"
                fill="#6B473C"
                fontFamily="Quicksand, sans-serif"
              >
                CAKE ATELIER · MASUK
              </text>

              {/* Lower Recessed Walnut Door Panels */}
              <rect x="1270" y="556" width="172" height="88" rx="6" fill="#52342B" stroke="#C59B62" strokeWidth="1.8" />
              <rect x="1270" y="660" width="172" height="86" rx="6" fill="#52342B" stroke="#C59B62" strokeWidth="1.8" />

              {/* Brass Door Handle & Escutcheon Plate */}
              <rect x="1256" y="538" width="14" height="44" rx="5" fill="url(#gKuningan)" stroke="#5A3B33" strokeWidth="1.5" />
              <circle cx="1263" cy="560" r="8" fill="#E5C590" stroke="#7A5A2B" strokeWidth="2" />

              {/* Brass Kickplate & Welcome Mat */}
              <rect x="1248" y="766" width="216" height="16" fill="url(#gKuningan)" />
              <polygon points="1240,784 1472,784 1488,804 1224,804" fill="#D3A29D" stroke="#A36361" strokeWidth="2" />
            </g>

            {/* 3 Brass Hanging Lamps & Soft Glow Beams */}
            <g pointerEvents="none" className="animate-lamp-glow">
              <polygon points="310,145 150,550 470,550" fill="url(#gSorotLampu)" />
              <polygon points="800,125 560,550 1040,550" fill="url(#gSorotLampu)" />
              <polygon points="1290,145 1130,550 1450,550" fill="url(#gSorotLampu)" />
            </g>
            <g filter="url(#fBayanganKecil)">
              <line x1="310" y1="24" x2="310" y2="122" stroke="#8C6936" strokeWidth="3.5" />
              <path d="M282 142 A28 22 0 0 1 338 142 Z" fill="url(#gKuningan)" />
              <circle cx="310" cy="146" r="11" fill="#FFF7DC" />

              <line x1="800" y1="24" x2="800" y2="104" stroke="#8C6936" strokeWidth="3.5" />
              <path d="M770 124 A30 24 0 0 1 830 124 Z" fill="url(#gKuningan)" />
              <circle cx="800" cy="128" r="12" fill="#FFF7DC" />

              <line x1="1290" y1="24" x2="1290" y2="122" stroke="#8C6936" strokeWidth="3.5" />
              <path d="M1262 142 A28 22 0 0 1 1318 142 Z" fill="url(#gKuningan)" />
              <circle cx="1290" cy="146" r="11" fill="#FFF7DC" />
            </g>
          </symbol>
        </defs>
      </svg>

      {/* ==================== CONTINUOUS TWO-WAY STICKY SCROLL PARALLAX STAGE ==================== */}
      <div
        ref={stageRef}
        data-cafe-stage="true"
        className="relative w-full bg-ivory"
        style={{ height: alwaysInside ? '100dvh' : '240vh' }}
      >
        <div
          ref={cafeContainerRef}
          className="sticky top-0 h-[100dvh] w-full overflow-hidden select-none"
        >
          {/* ==================== 1. LIVELY MULTI-DEPTH PARALLAX STOREFRONT EXTERIOR (ABSOLUTE OVERLAY INSIDE STICKY STAGE) ==================== */}
          {showExteriorOverlay && (
            <section
              aria-label="Tampilan Depan Toko Cravely"
              className="absolute inset-0 z-40 h-full w-full overflow-hidden select-none"
              style={{
                pointerEvents: p < 0.82 ? 'auto' : 'none',
              }}
            >
          {/* DEPTH 0: Soft Golden Bandung Morning Sky, Clouds & Distant Trees */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              opacity: facadeOpacity,
              transform: `translate3d(${(-mx * 6).toFixed(1)}px, ${(-my * 4).toFixed(1)}px, 0) scale(${skyScale.toFixed(4)})`,
              transformOrigin: '50% 62%',
            }}
          >
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full block">
              <rect width="1600" height="900" fill="url(#gLangitPagi)" />
              {/* Warm Morning Sunburst */}
              <circle cx="260" cy="150" r="240" fill="#FFF6DC" opacity="0.55" />
              <circle cx="260" cy="150" r="120" fill="#FFFDF4" opacity="0.65" />
              {/* Soft Fluffy Clouds */}
              <g fill="#FFFDF9" opacity="0.82">
                <ellipse cx="320" cy="120" rx="110" ry="34" />
                <ellipse cx="380" cy="108" rx="70" ry="28" />
                <ellipse cx="1240" cy="145" rx="135" ry="36" />
                <ellipse cx="1315" cy="130" rx="80" ry="30" />
              </g>
              {/* Distant Soft Tree Canopies Flanking the Boutique */}
              <g fill="#B9C4A4" opacity="0.6">
                <circle cx="90" cy="240" r="120" />
                <circle cx="190" cy="285" r="85" />
                <circle cx="1510" cy="235" r="130" />
                <circle cx="1410" cy="290" r="90" />
              </g>
            </svg>
          </div>

          {/* DEPTH 1: Patisserie Storefront Facade with Real Open Doorway Cutout */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              opacity: facadeOpacity,
              transform: `translate3d(${(-mx * 14).toFixed(1)}px, ${(-my * 8).toFixed(1)}px, 0) scale(${facadeScale.toFixed(4)})`,
              transformOrigin: '50% 62%',
            }}
          >
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full block">
              <defs>
                {/* Cut out the doorway so the real café interior shines directly through as doors swing open! */}
                <mask id="doorwayCutout">
                  <rect width="1600" height="900" fill="white" />
                  <rect x="695" y="382" width="210" height="338" fill="black" />
                </mask>
              </defs>

              <g mask="url(#doorwayCutout)">
                {/* Main Cream Boutique Wall (with subtle sky top margin so street feels open & airy) */}
                <rect x="0" y="96" width="1600" height="632" fill="url(#gFasadTembok)" />
                {/* Roof Cornice & Trim */}
                <rect x="0" y="76" width="1600" height="24" fill="#D5BFA9" />
                <rect x="0" y="100" width="1600" height="10" fill="#BFA78F" />
                {/* Architectural Wall Panels */}
                <rect x="46" y="150" width="208" height="510" rx="8" fill="none" stroke="#D5C0AA" strokeWidth="4" />
                <rect x="1346" y="150" width="208" height="510" rx="8" fill="none" stroke="#D5C0AA" strokeWidth="4" />

                {/* Vintage Wrought-Iron Streetlamps on Far Edges */}
                <g opacity="0.85">
                  <rect x="118" y="310" width="8" height="415" fill="#4B3833" />
                  <path d="M122 330 Q168 308 184 342" fill="none" stroke="#4B3833" strokeWidth="5" />
                  <circle cx="184" cy="356" r="18" fill="#FFF3CC" stroke="#4B3833" strokeWidth="3" />
                  <circle cx="184" cy="356" r="34" fill="#FFE7A3" opacity="0.28" />

                  <rect x="1474" y="310" width="8" height="415" fill="#4B3833" />
                  <path d="M1478 330 Q1432 308 1416 342" fill="none" stroke="#4B3833" strokeWidth="5" />
                  <circle cx="1416" cy="356" r="18" fill="#FFF3CC" stroke="#4B3833" strokeWidth="3" />
                  <circle cx="1416" cy="356" r="34" fill="#FFE7A3" opacity="0.28" />
                </g>

                {/* Boutique Signboard */}
                <g filter="url(#fBayangan)">
                  <rect x="470" y="114" width="660" height="104" rx="14" fill="url(#gKayuWalnut)" stroke="url(#gKuningan)" strokeWidth="6" />
                  <rect x="484" y="126" width="632" height="80" rx="8" fill="#FDF6EC" stroke="#D5B48A" strokeWidth="2" />
                  <text
                    x="800"
                    y="172"
                    textAnchor="middle"
                    fontSize="40"
                    fontWeight="700"
                    letterSpacing="6"
                    fill="#8C4A48"
                    fontFamily="Cinzel Decorative, Cormorant Garamond, serif"
                  >
                    CRAVELY
                  </text>
                  <text x="800" y="195" textAnchor="middle" fontSize="12.5" fontWeight="700" letterSpacing="4" fill="#8C6936">
                    ARTISAN PATISSERIE &amp; CUSTOM CAKE · BANDUNG
                  </text>
                </g>

                {/* Left Display Window + Overflowing Rose Flower Box */}
                <g filter="url(#fBayangan)">
                  <rect x="290" y="395" width="350" height="275" rx="8" fill="url(#gKayuWalnut)" />
                  <rect x="308" y="413" width="314" height="232" rx="4" fill="url(#gInteriorHangat)" />
                  <rect x="308" y="582" width="314" height="12" fill="#E8D5C3" />
                  {/* Cakes visible through window */}
                  <rect x="382" y="564" width="12" height="18" fill="#B8925A" />
                  <ellipse cx="388" cy="564" rx="44" ry="8" fill="#FFFFFF" />
                  <path d="M354 532 L354 560 A34 7 0 0 0 422 560 L422 532 Z" fill="#C97B78" />
                  <ellipse cx="388" cy="532" rx="34" ry="7" fill="#FDF5E7" />
                  <circle cx="388" cy="524" r="7" fill="#A33B46" />
                  <rect x="524" y="556" width="12" height="26" fill="#B8925A" />
                  <ellipse cx="530" cy="556" rx="46" ry="9" fill="#FFFFFF" />
                  <path d="M492 516 L492 552 A38 8 0 0 0 568 552 L568 516 Z" fill="#6B473C" />
                  <ellipse cx="530" cy="516" rx="38" ry="8" fill="#E8C7B8" />
                  <polygon points="318,413 385,413 330,645 308,645" fill="#FFFFFF" opacity="0.28" />
                  {/* Window Sill + Rose Planter Box */}
                  <rect x="280" y="658" width="370" height="22" rx="5" fill="#5A3B33" stroke="#C59B62" strokeWidth="2" />
                  <g>
                    <circle cx="320" cy="652" r="14" fill="#7D9468" />
                    <circle cx="355" cy="648" r="16" fill="#8EA676" />
                    <circle cx="395" cy="651" r="15" fill="#7D9468" />
                    <circle cx="435" cy="649" r="16" fill="#92AA7B" />
                    <circle cx="480" cy="650" r="15" fill="#7D9468" />
                    <circle cx="520" cy="648" r="16" fill="#8EA676" />
                    <circle cx="565" cy="651" r="15" fill="#7D9468" />
                    <circle cx="605" cy="652" r="14" fill="#8EA676" />
                    {/* Pink Roses */}
                    <circle cx="335" cy="646" r="8" fill="#F29DB0" />
                    <circle cx="382" cy="643" r="9" fill="#E87A90" />
                    <circle cx="442" cy="644" r="8.5" fill="#F7C5D0" />
                    <circle cx="495" cy="643" r="9" fill="#E87A90" />
                    <circle cx="548" cy="646" r="8" fill="#F29DB0" />
                    <circle cx="595" cy="645" r="7.5" fill="#F7C5D0" />
                  </g>
                </g>

                {/* Right Display Window + Overflowing Rose Flower Box */}
                <g filter="url(#fBayangan)">
                  <rect x="960" y="395" width="350" height="275" rx="8" fill="url(#gKayuWalnut)" />
                  <rect x="978" y="413" width="314" height="232" rx="4" fill="url(#gInteriorHangat)" />
                  <rect x="978" y="582" width="314" height="12" fill="#E8D5C3" />
                  <rect x="1062" y="560" width="12" height="22" fill="#B8925A" />
                  <ellipse cx="1068" cy="560" rx="44" ry="8" fill="#FFFFFF" />
                  <path d="M1032 524 L1032 556 A36 8 0 0 0 1104 556 L1104 524 Z" fill="#E5B9B3" />
                  <ellipse cx="1068" cy="524" rx="36" ry="8" fill="#FFFDF8" />
                  <rect x="1198" y="566" width="12" height="16" fill="#B8925A" />
                  <ellipse cx="1204" cy="566" rx="42" ry="8" fill="#FFFFFF" />
                  <path d="M1170 536 L1170 562 A34 7 0 0 0 1238 562 L1238 536 Z" fill="#9AA583" />
                  <ellipse cx="1204" cy="536" rx="34" ry="7" fill="#FDF5E7" />
                  <polygon points="988,413 1055,413 1000,645 978,645" fill="#FFFFFF" opacity="0.28" />
                  <rect x="950" y="658" width="370" height="22" rx="5" fill="#5A3B33" stroke="#C59B62" strokeWidth="2" />
                  <g>
                    <circle cx="990" cy="652" r="14" fill="#7D9468" />
                    <circle cx="1030" cy="648" r="16" fill="#8EA676" />
                    <circle cx="1075" cy="651" r="15" fill="#7D9468" />
                    <circle cx="1118" cy="649" r="16" fill="#92AA7B" />
                    <circle cx="1162" cy="650" r="15" fill="#7D9468" />
                    <circle cx="1205" cy="648" r="16" fill="#8EA676" />
                    <circle cx="1248" cy="651" r="15" fill="#7D9468" />
                    <circle cx="1282" cy="652" r="14" fill="#8EA676" />
                    <circle cx="1010" cy="645" r="8.5" fill="#F29DB0" />
                    <circle cx="1062" cy="644" r="9" fill="#E87A90" />
                    <circle cx="1120" cy="643" r="8.5" fill="#F7C5D0" />
                    <circle cx="1175" cy="644" r="9" fill="#E87A90" />
                    <circle cx="1228" cy="646" r="8" fill="#F29DB0" />
                    <circle cx="1270" cy="645" r="7.5" fill="#F7C5D0" />
                  </g>
                </g>

                {/* Door Arch Frame + Glowing Brass Wall Sconces */}
                <g filter="url(#fBayangan)">
                  <path d="M675 720 V360 A125 95 0 0 1 925 360 V720 Z" fill="url(#gKayuWalnut)" />
                  <path d="M695 365 A105 78 0 0 1 905 365 Z" fill="#FFE7BA" stroke="#C59B62" strokeWidth="3" />
                  <text x="800" y="348" textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="2.5" fill="#6B473C">
                    SEJAK 2018
                  </text>
                  {/* Warm Brass Wall Sconces */}
                  <circle cx="652" cy="430" r="24" fill="#FFE7A3" opacity="0.34" />
                  <circle cx="652" cy="430" r="10" fill="#FFF7DC" stroke="#B8925A" strokeWidth="2.5" />
                  <circle cx="948" cy="430" r="24" fill="#FFE7A3" opacity="0.34" />
                  <circle cx="948" cy="430" r="10" fill="#FFF7DC" stroke="#B8925A" strokeWidth="2.5" />
                </g>

                {/* Striped Scalloped Canopy */}
                <g filter="url(#fBayangan)">
                  <polygon points="310,224 1290,224 1345,322 255,322" fill="url(#pKanopiGaris)" />
                  <path
                    d="M255 322 H1345 V338 Q1317 354 1290 338 Q1262 354 1235 338 Q1207 354 1180 338 Q1152 354 1125 338 Q1097 354 1070 338 Q1042 354 1015 338 Q987 354 960 338 Q932 354 905 338 Q877 354 850 338 Q822 354 795 338 Q767 354 740 338 Q712 354 685 338 Q657 354 630 338 Q602 354 575 338 Q547 354 520 338 Q492 354 465 338 Q437 354 410 338 Q382 354 355 338 Q327 354 300 338 Q277 354 255 338 Z"
                    fill="url(#pKanopiGaris)"
                  />
                  <line x1="255" y1="322" x2="1345" y2="322" stroke="#7A4240" strokeWidth="2" />
                </g>

                {/* Sidewalk & Warm Cobble Paving */}
                <rect x="0" y="720" width="1600" height="180" fill="url(#gTrotoar)" />
                <line x1="0" y1="752" x2="1600" y2="752" stroke="#C5AE96" strokeWidth="1.5" opacity="0.6" />
                <line x1="0" y1="802" x2="1600" y2="802" stroke="#B8A088" strokeWidth="1.5" opacity="0.5" />
                {/* Entry Welcome Step */}
                <polygon points="665,720 935,720 955,748 645,748" fill="#EFE4D6" stroke="#B8A38B" strokeWidth="2" />
                <rect x="645" y="748" width="310" height="10" fill="#C4B098" />

                {/* Potted Topiaries Flanking Door */}
                <g filter="url(#fBayanganKecil)">
                  <circle cx="595" cy="656" r="28" fill="#7D8F69" />
                  <circle cx="578" cy="666" r="22" fill="#94A67E" />
                  <circle cx="612" cy="666" r="22" fill="#8A9C75" />
                  <polygon points="568,678 622,678 614,734 576,734" fill="url(#gKayuWalnut)" stroke="#C59B62" strokeWidth="2" />
                  <circle cx="1005" cy="656" r="28" fill="#7D8F69" />
                  <circle cx="988" cy="666" r="22" fill="#94A67E" />
                  <circle cx="1022" cy="666" r="22" fill="#8A9C75" />
                  <polygon points="978,678 1032,678 1024,734 986,734" fill="url(#gKayuWalnut)" stroke="#C59B62" strokeWidth="2" />
                </g>
              </g>
            </svg>

            {/* DEPTH 2: REAL 3D SWINGING WOODEN DOUBLE DOORS (CSS 3D perspective!) */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ perspective: '1100px' }}
            >
              {/* Perfectly aligned over the 210x338 doorway in the 1600x900 slice viewport */}
              <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full overflow-visible">
                {/* Warm interior light glow spilling onto threshold as doors open */}
                <polygon
                  points="695,720 905,720 970,790 630,790"
                  fill="#FFEAB8"
                  opacity={(doorEase * 0.48).toFixed(2)}
                />
              </svg>
            </div>

            {/* Interactive 3D Hinged Doors Container */}
            <div
              onClick={handleSmoothEnter}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSmoothEnter();
              }}
              aria-label="Ketuk pintu masuk Cravely"
              className="group absolute left-1/2 top-[61.2%] -translate-x-1/2 -translate-y-1/2 w-[13.2vw] min-w-[144px] max-w-[214px] h-[37.6vh] min-h-[220px] max-h-[342px] flex cursor-pointer focus:outline-none"
              style={{ perspective: '950px' }}
            >
              {/* Left 3D Swinging Door Leaf */}
              <div
                className="w-1/2 h-full relative rounded-tl-sm border-2 border-[#3E2721] bg-gradient-to-r from-[#4B3028] via-[#6B473C] to-[#56372E] shadow-xl will-change-transform"
                style={{
                  transformOrigin: 'left center',
                  transform: `rotateY(${doorAngle.toFixed(1)}deg)`,
                }}
              >
                <div className="m-2.5 h-[52%] rounded bg-gradient-to-b from-[#FFE9BF]/85 to-[#E6B89C]/90 border-2 border-[#C59B62] shadow-inner" />
                <div className="mx-2.5 mt-3 h-[28%] rounded-sm bg-[#4B3028] border border-[#6E4A3E]" />
                <span className="absolute right-1.5 top-[45%] w-1.5 h-10 rounded-full bg-gradient-to-b from-[#E5C590] to-[#876636]" />
              </div>

              {/* Right 3D Swinging Door Leaf */}
              <div
                className="w-1/2 h-full relative rounded-tr-sm border-2 border-[#3E2721] bg-gradient-to-l from-[#4B3028] via-[#6B473C] to-[#56372E] shadow-xl will-change-transform"
                style={{
                  transformOrigin: 'right center',
                  transform: `rotateY(${(-doorAngle).toFixed(1)}deg)`,
                }}
              >
                <div className="m-2.5 h-[52%] rounded bg-gradient-to-b from-[#FFE9BF]/85 to-[#E6B89C]/90 border-2 border-[#C59B62] shadow-inner flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded bg-[#FDF6EC] border border-burgundy text-[10px] font-extrabold text-cherry tracking-wider shadow-sm">
                    BUKA
                  </span>
                </div>
                <div className="mx-2.5 mt-3 h-[28%] rounded-sm bg-[#4B3028] border border-[#6E4A3E]" />
                <span className="absolute left-1.5 top-[45%] w-1.5 h-10 rounded-full bg-gradient-to-b from-[#E5C590] to-[#876636]" />
              </div>

              {/* Hover Badge */}
              <span
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition duration-200 absolute -top-9 left-1/2 -translate-x-1/2 bg-kayu/95 text-ivory text-xs font-bold px-4 py-1.5 rounded-full border border-kuningan shadow-lg whitespace-nowrap"
                style={{ opacity: p > 0.12 ? 0 : undefined }}
              >
                Ketuk Pintu Masuk
              </span>
            </div>
          </div>

          {/* DEPTH 3: LIVELY FOREGROUND STREET PROPS (A-Frame Menu Board Left + Bistro Table & Sleeping Cat Right!) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Left Foreground: Sidewalk A-Frame Chalkboard Menu */}
            <div
              className="absolute left-[4%] sm:left-[7%] bottom-[5%] w-[140px] sm:w-[190px] will-change-transform"
              style={{
                opacity: fgOpacity,
                transform: `translate3d(${(-fgSpread - mx * 28).toFixed(1)}px, ${(walkEase * 55 - my * 14).toFixed(1)}px, 0) scale(${fgScale.toFixed(3)})`,
              }}
            >
              <svg viewBox="0 0 180 210" className="w-full h-auto drop-shadow-[0_14px_18px_rgba(61,43,40,0.3)]">
                {/* Wooden A-Frame Stand */}
                <polygon points="28,16 152,16 168,200 12,200" fill="#5A3B33" stroke="#3E2721" strokeWidth="3" />
                <polygon points="38,28 142,28 152,172 28,172" fill="#3A2723" stroke="#C59B62" strokeWidth="2.5" />
                {/* Cute Chalkboard Copy */}
                <text x="90" y="54" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill="#F5D7A1" fontFamily="Cinzel Decorative, serif">
                  FRESH TODAY
                </text>
                <line x1="48" y1="62" x2="132" y2="62" stroke="#C59B62" strokeWidth="1" opacity="0.7" />
                <text x="90" y="84" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFDF9" fontFamily="Quicksand, sans-serif">
                  Strawberry Velvet
                </text>
                <text x="90" y="106" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#F5C6CE" fontFamily="Quicksand, sans-serif">
                  Raspberry Cake
                </text>
                <text x="90" y="128" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFDF9" fontFamily="Quicksand, sans-serif">
                  Custom Cake 3D
                </text>
                {(toko?.jam?.ringkas || toko?.jam?.senin_jumat) && (
                  <text x="90" y="156" textAnchor="middle" fontSize="10" fontWeight="700" fill="#E5C590" fontFamily="Quicksand, sans-serif">
                    {toko?.jam?.ringkas || toko?.jam?.senin_jumat}
                  </text>
                )}
              </svg>
            </div>

            {/* Right Foreground: Parisian-Bandung Bistro Table + Teacup + Cute Sleeping Patisserie Cat */}
            <div
              className="absolute right-[3%] sm:right-[6%] bottom-[3%] w-[180px] sm:w-[250px] will-change-transform"
              style={{
                opacity: fgOpacity,
                transform: `translate3d(${(fgSpread - mx * 28).toFixed(1)}px, ${(walkEase * 55 - my * 14).toFixed(1)}px, 0) scale(${fgScale.toFixed(3)})`,
              }}
            >
              <svg viewBox="0 0 260 220" className="w-full h-auto drop-shadow-[0_14px_20px_rgba(61,43,40,0.28)]">
                {/* Bistro Chair Left */}
                <path d="M22 118 Q22 86 44 86 Q66 86 66 118" fill="none" stroke="#4A322C" strokeWidth="4" />
                <rect x="20" y="118" width="48" height="7" rx="3" fill="#5A3B33" />
                <line x1="26" y1="125" x2="20" y2="195" stroke="#4A322C" strokeWidth="4" />
                <line x1="62" y1="125" x2="66" y2="195" stroke="#4A322C" strokeWidth="4" />

                {/* Bistro Chair Right */}
                <path d="M192 118 Q192 86 214 86 Q236 86 236 118" fill="none" stroke="#4A322C" strokeWidth="4" />
                <rect x="190" y="118" width="48" height="7" rx="3" fill="#5A3B33" />
                <line x1="196" y1="125" x2="190" y2="195" stroke="#4A322C" strokeWidth="4" />
                <line x1="232" y1="125" x2="238" y2="195" stroke="#4A322C" strokeWidth="4" />

                {/* Bistro Round Marble Table */}
                <line x1="128" y1="106" x2="128" y2="195" stroke="#4A322C" strokeWidth="6" />
                <path d="M98 198 Q128 184 158 198" fill="none" stroke="#4A322C" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="128" cy="104" rx="70" ry="14" fill="#FFFDF9" stroke="#C59B62" strokeWidth="3" />
                {/* Tiny Rose Vase & Teacup with Rising Steam */}
                <rect x="122" y="76" width="12" height="24" rx="5" fill="#F1DBD0" stroke="#A36361" strokeWidth="1.5" />
                <circle cx="124" cy="70" r="6" fill="#E87A90" />
                <circle cx="132" cy="72" r="5.5" fill="#F5B5C4" />
                {/* Plated Cake Slice */}
                <ellipse cx="96" cy="100" rx="16" ry="5" fill="#FDF5E7" stroke="#D3A29D" strokeWidth="1.2" />
                <polygon points="88,99 104,99 100,86" fill="#F2B4BF" stroke="#A36361" strokeWidth="1.2" />
                {/* Steaming Teacup */}
                <path d="M150 88 H166 L163 100 H153 Z" fill="#FFFDF9" stroke="#A36361" strokeWidth="1.5" />
                <path d="M158 82 Q155 74 159 66" fill="none" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" className="animate-steam-1" />

                {/* Adorable Curled-up Sleeping Cream Café Cat on Sidewalk! */}
                <g transform="translate(88, 178)">
                  <ellipse cx="26" cy="24" rx="28" ry="8" fill="#4A2E28" opacity="0.2" />
                  {/* Curled Body */}
                  <ellipse cx="28" cy="15" rx="22" ry="13" fill="#F9E4C8" stroke="#C99E76" strokeWidth="1.8" />
                  {/* Tail curled softly */}
                  <path d="M46 18 Q58 12 52 4" fill="none" stroke="#E5B98E" strokeWidth="5.5" strokeLinecap="round" />
                  {/* Cute Cat Head */}
                  <circle cx="13" cy="11" r="11" fill="#FCECD8" stroke="#C99E76" strokeWidth="1.6" />
                  <polygon points="4,4 7,-4 12,2" fill="#F9E4C8" stroke="#C99E76" strokeWidth="1.4" />
                  <polygon points="15,2 20,-4 22,5" fill="#F9E4C8" stroke="#C99E76" strokeWidth="1.4" />
                  {/* Peaceful Sleeping Eyes */}
                  <path d="M8 11 Q10 13.5 12 11" fill="none" stroke="#5A3B33" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 11 Q16 13.5 18 11" fill="none" stroke="#5A3B33" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="14" r="2" fill="#F3A6B5" opacity="0.65" />
                  <circle cx="18" cy="14" r="2" fill="#F3A6B5" opacity="0.65" />
                  {/* Tiny Pink Ribbon Collar */}
                  <path d="M9 20 L17 20" stroke="#9E3B42" strokeWidth="2.4" strokeLinecap="round" />
                </g>
              </svg>
            </div>

            {/* Drifting Blossom Petals */}
            <span className="animate-petal absolute left-[22%] top-[10%] w-3 h-2 rounded-full bg-blush/90 shadow-sm" />
            <span
              className="animate-petal absolute left-[72%] top-[14%] w-2.5 h-2 rounded-full bg-[#EFA7B8]/80 shadow-sm"
              style={{ animationDelay: '2.1s' }}
            />
            <span
              className="animate-petal absolute left-[46%] top-[6%] w-2.5 h-1.5 rounded-full bg-blush/85 shadow-sm"
              style={{ animationDelay: '4.3s' }}
            />
          </div>
        </section>
      )}

      {/* ==================== 2. FULL-SCREEN COQUETTE CAFE INTERIOR ==================== */}
      <main className="relative w-full h-full overflow-hidden select-none">
          <div
            className="relative w-full h-full will-change-transform"
            style={{
              transformOrigin: '50% 54%',
              transform: `scale(${interiorScale.toFixed(4)}) translateY(${interiorY}%)`,
              filter: warmLighting ? 'sepia(0.18) brightness(0.92) contrast(1.06)' : 'none',
              transition: zoomingEtalase
                ? 'transform 0.62s cubic-bezier(0.22, 1, 0.36, 1), filter 0.45s ease'
                : 'filter 0.45s ease',
            }}
          >
            {/* Layer 1: Walls, Plaque, Cookie Shelf, NEW Wall Menu Board */}
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full block">
              <use href="#sIsiLatar" />
            </svg>

            {/* ==================== LAYER 2: NEW "TETEH KASIR" STATIONED BEHIND CASHIER COUNTER ==================== */}
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full pointer-events-none block"
              aria-hidden="true"
            >
              <defs>
                {/* Cleanly clips Teteh Kasir right along the marble counter top (y=528) */}
                <clipPath id="clip-teteh-kasir">
                  <rect x="175" y="340" width="185" height="190" />
                </clipPath>
                <linearGradient id="tetehHijab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F6E5DE" />
                  <stop offset="100%" stopColor="#E4C6BE" />
                </linearGradient>
                <linearGradient id="tetehApron" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A9555A" />
                  <stop offset="100%" stopColor="#8A3D43" />
                </linearGradient>
              </defs>

              <g clipPath="url(#clip-teteh-kasir)">
                <g
                  style={{
                    transformOrigin: '268px 528px',
                    transform: tetehHappy ? 'translateY(-3px) scale(1.02)' : 'translateY(0px)',
                    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {/* Soft Draped Hijab Back */}
                  <path
                    d="M226 420 C216 452 214 486 222 528 L314 528 C322 486 320 452 310 420 Z"
                    fill="url(#tetehHijab)"
                    stroke="#C7A198"
                    strokeWidth="1.8"
                  />

                  {/* Blouse Sleeves & Torso */}
                  <ellipse cx="222" cy="500" rx="18" ry="26" fill="#FDF5E7" stroke="#D4B5AA" strokeWidth="1.8" />
                  <ellipse cx="314" cy="500" rx="18" ry="26" fill="#FDF5E7" stroke="#D4B5AA" strokeWidth="1.8" />
                  <path d="M226 474 Q268 465 310 474 L318 532 H218 Z" fill="#FDF5E7" stroke="#D4B5AA" strokeWidth="1.8" />

                  {/* Friendly Waving Right Hand when hovering Cashier */}
                  <g
                    style={{
                      transformOrigin: '318px 496px',
                      transform: tetehHappy ? 'rotate(-20deg) translateY(-6px)' : 'rotate(0deg)',
                      transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <path
                      d="M316 498 Q332 484 334 466"
                      fill="none"
                      stroke="#FDF5E7"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <circle cx="334" cy="462" r="8" fill="#FDE2CE" stroke="#D8B098" strokeWidth="1.4" />
                  </g>

                  {/* Burgundy Patisserie Apron + Cute Name Badge "TETEH" */}
                  <path d="M236 488 H300 L307 532 H229 Z" fill="url(#tetehApron)" stroke="#6E3035" strokeWidth="1.8" />
                  <rect x="242" y="470" width="7" height="20" rx="3" fill="#F1DBD0" stroke="#8A3D43" strokeWidth="1.4" />
                  <rect x="287" y="470" width="7" height="20" rx="3" fill="#F1DBD0" stroke="#8A3D43" strokeWidth="1.4" />
                  <rect x="246" y="498" width="32" height="14" rx="4" fill="#FFFDF9" stroke="#C59B62" strokeWidth="1.2" />
                  <text x="262" y="508" textAnchor="middle" fontSize="7" fontWeight="800" fill="#8A3D43">
                    TETEH
                  </text>

                  {/* Hijab Front Drape over Chest + Dainty Brass Floral Brooch */}
                  <path
                    d="M234 452 Q268 486 302 452 L298 476 Q268 494 238 476 Z"
                    fill="#F7E8E1"
                    stroke="#CCA69D"
                    strokeWidth="1.6"
                  />
                  <circle cx="268" cy="476" r="4.5" fill="#E5C590" stroke="#8C6936" strokeWidth="1.2" />
                  <circle cx="268" cy="476" r="1.8" fill="#9E3B42" />

                  {/* Head & Soft Framed Hijab Hood */}
                  <path
                    d="M228 424 C228 386 245 376 268 376 C291 376 308 386 308 424 C308 456 290 468 268 468 C246 468 228 456 228 424 Z"
                    fill="url(#tetehHijab)"
                    stroke="#C7A198"
                    strokeWidth="1.8"
                  />

                  {/* Warm Friendly Face */}
                  <path
                    d="M238 424 C238 398 250 390 268 390 C286 390 298 398 298 424 C298 446 285 457 268 457 C251 457 238 446 238 424 Z"
                    fill="#FDE5D3"
                    stroke="#DDB29A"
                    strokeWidth="1.5"
                  />

                  {/* Soft Rosy Cheek Blush */}
                  <ellipse cx="249" cy="436" rx="8" ry="4.5" fill="#F29EB0" opacity="0.52" />
                  <ellipse cx="287" cy="436" rx="8" ry="4.5" fill="#F29EB0" opacity="0.52" />

                  {/* Gentle Eyebrows */}
                  <path d="M248 416 Q254 413 260 415" fill="none" stroke="#5B3930" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M276 415 Q282 413 288 416" fill="none" stroke="#5B3930" strokeWidth="1.8" strokeLinecap="round" />

                  {/* Warm Non-Creepy Eyes (Blinking or Happy ^ ^ on Cashier Hover) */}
                  {tetehBlink ? (
                    <g stroke="#4A2B24" strokeWidth="2.2" strokeLinecap="round" fill="none">
                      <path d="M248 427 Q254 431 260 427" />
                      <path d="M276 427 Q282 431 288 427" />
                    </g>
                  ) : tetehHappy ? (
                    <g stroke="#4A2B24" strokeWidth="2.4" strokeLinecap="round" fill="none">
                      <path d="M248 428 Q254 421 260 428" />
                      <path d="M276 428 Q282 421 288 428" />
                    </g>
                  ) : (
                    <g>
                      <circle cx="254" cy="427" r="5" fill="#462822" />
                      <circle cx="252.5" cy="425" r="1.8" fill="#FFFFFF" />
                      <circle cx="282" cy="427" r="5" fill="#462822" />
                      <circle cx="280.5" cy="425" r="1.8" fill="#FFFFFF" />
                      <path d="M247 424 Q254 419 260 424" fill="none" stroke="#462822" strokeWidth="2" strokeLinecap="round" />
                      <path d="M276 424 Q282 419 289 424" fill="none" stroke="#462822" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}

                  {/* Sweet Warm Smile */}
                  <path
                    d={tetehHappy ? 'M261 440 Q268 447 275 440' : 'M262 441 Q268 445.5 274 441'}
                    fill="none"
                    stroke="#A35058"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            </svg>

            {/* Layer 3: Counters, Glass Cake Display, Custom Cake Table, Brass Lamps */}
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full pointer-events-none block"
            >
              <use href="#sIsiDepan" />

              {/* Gentle Rising Fresh-Baked Pastry Aroma Wisps above Glass Display */}
              <g pointerEvents="none" opacity="0.65">
                <path
                  d="M590 398 Q582 384 590 370 Q598 358 590 344"
                  fill="none"
                  stroke="#FFFDF9"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className="animate-steam-1"
                />
                <path
                  d="M800 392 Q792 378 800 364 Q808 352 800 338"
                  fill="none"
                  stroke="#FFFDF9"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className="animate-steam-2"
                />
                <path
                  d="M1010 398 Q1002 384 1010 370 Q1018 358 1010 344"
                  fill="none"
                  stroke="#FFFDF9"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className="animate-steam-3"
                />
              </g>
            </svg>

            {/* Gentle Golden Ambient Twinkles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span
                className="animate-twinkle absolute left-[28%] top-[24%] w-2 h-2 rounded-full bg-[#FFF2C6] shadow-[0_0_8px_#FFE49C]"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="animate-twinkle absolute left-[52%] top-[34%] w-1.5 h-1.5 rounded-full bg-[#FFF2C6] shadow-[0_0_8px_#FFE49C]"
                style={{ animationDelay: '1.1s' }}
              />
              <span
                className="animate-twinkle absolute left-[76%] top-[26%] w-2 h-2 rounded-full bg-[#FFF2C6] shadow-[0_0_8px_#FFE49C]"
                style={{ animationDelay: '2.1s' }}
              />
            </div>

            {/* Warm Twilight Overlay when Wall Switch is Active */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: warmLighting ? 1 : 0,
                background:
                  'radial-gradient(circle at 50% 24%, rgba(255, 224, 152, 0.16) 0%, rgba(72, 39, 32, 0.28) 100%)',
              }}
            />

            {/* ==================== INTERACTIVE CAFE HOTSPOTS (STAGGERED ONE-BY-ONE SIGNAGE) ==================== */}
            {/* 1. Oval Wall Plaque (Shop Info) */}
            <button
              type="button"
              onClick={onOpenInfo}
              onMouseEnter={() => setActiveZone('plakat')}
              onMouseLeave={() => setActiveZone(null)}
              aria-label="Info Cravely"
              className="zona-klik group absolute left-[50%] top-[24.6%] -translate-x-1/2 -translate-y-1/2 w-[25%] h-[16%] rounded-full flex items-end justify-center pb-1"
            >
              <span className="opacity-0 group-hover:opacity-100 transition duration-200 bg-kayu/92 text-ivory text-[11px] font-bold px-3 py-1 rounded-full border border-kuningan/70 shadow-md whitespace-nowrap">
                Tentang Cravely
              </span>
            </button>

            {/* 3. Brass Wall Lamp Switch */}
            <button
              type="button"
              onClick={() => setWarmLighting((prev) => !prev)}
              onMouseEnter={() => setActiveZone('saklar')}
              onMouseLeave={() => setActiveZone(null)}
              aria-label="Saklar Lampu Suasana Hangat"
              className="zona-klik group absolute left-[26.7%] top-[46.5%] -translate-x-1/2 -translate-y-1/2 w-[4.2%] h-[9%] rounded-lg flex items-center justify-center"
            >
              <span
                className={`w-3 h-3 rounded-full shadow-sm transition-all duration-200 ${
                  warmLighting
                    ? 'translate-y-1 bg-burgundy ring-2 ring-amber-200/70'
                    : '-translate-y-1 bg-amber-300/80'
                }`}
              />
            </button>

            {/* 4. Left Cashier Counter & Teteh Kasir */}
            {(() => {
              const isVisible =
                p > 0.72 &&
                !zoomingEtalase &&
                (activeZone === 'kasir' || (activeZone === null && spotlightIdx === 2));
              return (
                <button
                  type="button"
                  onClick={() => onNavigate('kasir')}
                  onMouseEnter={() => setActiveZone('kasir')}
                  onMouseLeave={() => setActiveZone(null)}
                  aria-label="Meja Kasir bersama Teteh Kasir"
                  className="zona-klik group absolute left-[16%] top-[66%] -translate-x-1/2 -translate-y-1/2 w-[22%] h-[36%] flex items-end justify-center pb-5"
                >
                  <span
                    className={`pointer-events-none transition-all duration-400 ease-out inline-flex flex-col items-center rounded-xl border px-3.5 py-1.5 shadow-lg whitespace-nowrap ${
                      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                    } bg-kayu text-ivory border-[#F5D7A1]`}
                  >
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-wide">
                      Bayar di Kasir
                    </span>
                    <span className="text-[9.5px] font-bold text-blush">
                      Teteh Kasir · Keranjang
                    </span>
                  </span>
                </button>
              );
            })()}

            {/* 5. Center Glass Display Case -> Zoom In to Close-Up 2.5D Etalase */}
            {(() => {
              const isVisible =
                p > 0.72 &&
                !zoomingEtalase &&
                (activeZone === 'etalase' || (activeZone === null && spotlightIdx === 1));
              return (
                <button
                  type="button"
                  onClick={handleEnterEtalase}
                  onMouseEnter={() => setActiveZone('etalase')}
                  onMouseLeave={() => setActiveZone(null)}
                  aria-label="Intip Etalase Kue Ulang Tahun dan Chiffon dari Dekat"
                  className="zona-klik group absolute left-[50%] top-[55%] -translate-x-1/2 -translate-y-1/2 w-[43%] h-[42%] flex items-start justify-center pt-2"
                >
                  <span
                    className={`pointer-events-none transition-all duration-400 ease-out inline-flex flex-col items-center rounded-xl border px-4 py-1.5 shadow-lg whitespace-nowrap ${
                      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                    } bg-[#FFFDF9]/96 text-ink border-[#B8925A]`}
                  >
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-cherry">
                      Intip Etalase Dekat
                    </span>
                    <span className="text-[9.5px] font-bold text-ink/75">
                      Kue Ultah &amp; Chiffon Cake
                    </span>
                  </span>
                </button>
              );
            })()}

            {/* 6. Right Custom Cake Studio + Arched Kitchen Room Door */}
            {(() => {
              const isVisible =
                p > 0.72 &&
                !zoomingEtalase &&
                (activeZone === 'custom' || (activeZone === null && spotlightIdx === 3));
              return (
                <button
                  type="button"
                  onClick={() => onNavigate('custom')}
                  onMouseEnter={() => setActiveZone('custom')}
                  onMouseLeave={() => setActiveZone(null)}
                  aria-label="Masuk Kitchen Room untuk Custom Cake 3D"
                  className="zona-klik group absolute left-[84.8%] top-[54%] -translate-x-1/2 -translate-y-1/2 w-[18.5%] h-[68%] flex items-end justify-center pb-7"
                >
                  <span
                    className={`pointer-events-none transition-all duration-400 ease-out inline-flex flex-col items-center rounded-xl border px-3.5 py-1.5 shadow-lg whitespace-nowrap ${
                      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                    } bg-kayu text-ivory border-[#F5D7A1]`}
                  >
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-wide">
                      Masuk Kitchen Room
                    </span>
                    <span className="text-[9.5px] font-bold text-blush">
                      Custom Cake 3D
                    </span>
                  </span>
                </button>
              );
            })()}

            {/* ==================== WALKING CUTE PATISSIER CHARACTER ==================== */}
            <WalkingPatissier
              containerRef={cafeContainerRef}
              activeZone={activeZone}
              warmLighting={warmLighting}
            />
          </div>
        </main>
        </div>
      </div>
    </>
  );
};
