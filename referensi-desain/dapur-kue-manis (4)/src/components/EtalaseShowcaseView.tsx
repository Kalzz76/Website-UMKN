import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Hand, Info, X } from 'lucide-react';
import {
  ETALASE_CAKES,
  formatRupiah,
  type EtalaseCakeItem,
  type ViewType,
} from '../data/patisserieData';
import { DimensionalCake } from './etalase3d/DimensionalCakes';

interface EtalaseShowcaseViewProps {
  onNavigate: (view: ViewType) => void;
  onGoToMenuWithCake: (menuId: number) => void;
}

type ShelfTab = 'semua' | 'chiffon' | 'ultah';

export const EtalaseShowcaseView: React.FC<EtalaseShowcaseViewProps> = ({
  onNavigate,
  onGoToMenuWithCake,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const [isDragging, setIsDragging] = useState(false);
  const [shelfTab, setShelfTab] = useState<ShelfTab>('semua');
  const [inspectedCake, setInspectedCake] = useState<EtalaseCakeItem | null>(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const chiffonCakes = ETALASE_CAKES.filter((c) => c.jenis === 'Chiffon Cake');
  const ultahCakes = ETALASE_CAKES.filter((c) => c.jenis === 'Kue Ulang Tahun');

  const updateScrollRatio = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
    setScrollRatio(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'smooth' });
    updateScrollRatio();
  }, [shelfTab]);

  // Subtle lightweight 2.5D depth parallax from pointer position
  const handleStageMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    setTilt({ x: nx, y: ny });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.startScrollLeft - dx * 1.25;
    updateScrollRatio();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  const panBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const renderCakeBay = (cake: EtalaseCakeItem) => (
    <article
      key={cake.id}
      onClick={() => {
        if (!dragRef.current.moved) setInspectedCake(cake);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setInspectedCake(cake);
      }}
      aria-label={`Lihat detail ${cake.nama}`}
      className="group relative w-[250px] sm:w-[276px] shrink-0 flex flex-col items-center cursor-pointer focus:outline-none"
    >
      {/* Overhead Soft Warm Chiller Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 inset-x-4 h-40 rounded-full opacity-65 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,246,216,0.92) 0%, rgba(255,246,216,0) 72%)',
        }}
      />

      {/* 2.5D Sculpted Dimensional Cake Resting Directly on Glass Shelf */}
      <div className="relative z-10 transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.04]">
        <DimensionalCake cakeId={cake.id} className="w-[216px] sm:w-[238px] h-[180px] sm:h-[196px]" />
      </div>

      {/* ==================== ULTRA-CRISP STANDING FRONT-POV PRICE & NAME TAG ==================== */}
      <div className="relative -mt-6 z-20 w-[224px] sm:w-[244px] transition-transform duration-300 group-hover:-translate-y-0.5">
        {/* Miniature Brushed Brass Card Stand Clip */}
        <div className="mx-auto w-11 h-2.5 rounded-t-md bg-gradient-to-r from-[#8E6A36] via-[#F1D5A0] to-[#8E6A36] border border-[#6E5026] shadow-sm" />

        {/* Crisp High-Contrast Ivory Patisserie Name & Price Placard */}
        <div className="bg-[#FFFDF9] border-2 border-[#B8925A] rounded-xl px-3.5 py-2.5 shadow-[0_10px_22px_rgba(61,43,40,0.24)] text-center">
          <div className="border border-dashed border-[#D3A29D]/75 rounded-lg px-2 py-1.5">
            <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-[0.1em]">
              <span
                className={
                  cake.jenis === 'Kue Ulang Tahun'
                    ? 'text-cherry bg-[#FCE8EC] px-2 py-0.5 rounded'
                    : 'text-[#4B6842] bg-[#EAF2E1] px-2 py-0.5 rounded'
                }
              >
                {cake.jenis === 'Kue Ulang Tahun' ? 'Kue Ultah' : 'Chiffon'}
              </span>
              <span className="text-ink/70 font-bold">{cake.ukuran.split('·')[0].trim()}</span>
            </div>

            <h2 className="font-coquette text-[13px] sm:text-sm font-bold text-[#2D1D1A] leading-snug mt-1.5">
              {cake.nama}
            </h2>

            <div className="mt-1.5 pt-1.5 border-t border-dusty/45 flex items-center justify-between gap-2">
              <span className="font-serif text-lg sm:text-xl font-extrabold text-cherry tabular-nums leading-none">
                {formatRupiah(cake.harga)}
              </span>
              <span className="text-[10.5px] font-extrabold text-burgundy group-hover:text-cherry underline underline-offset-2">
                Detail →
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={handleStageMove}
      className="relative min-h-[100dvh] w-full overflow-hidden pt-24 lg:pt-32 pb-28 flex flex-col justify-between select-none"
      style={{ perspective: '1200px' }}
    >
      {/* ==================== 1. EXACT CRAVELY CAFE BAKERY BACKDROP (STRIPED WALL, WAINSCOT, LAMPS & PLAQUE) ==================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${(-tilt.x * 10).toFixed(1)}px, ${(-tilt.y * 6).toFixed(1)}px, 0) scale(1.04)`,
        }}
      >
        {/* Striped Cream & Blush Wallpaper matching CafeScene pDindingGaris */}
        <div
          className="absolute inset-x-0 top-0 h-[62%]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #FDF5E7 0px, #FDF5E7 68px, #F4DFD6 68px, #F4DFD6 136px)',
          }}
        />
        {/* White Chair Rail */}
        <div className="absolute inset-x-0 top-[62%] h-3 bg-[#FFFDF9] border-y border-[#CDB8A2]" />
        {/* Dusty Rose Wainscot */}
        <div
          className="absolute inset-x-0 top-[calc(62%+12px)] bottom-0"
          style={{
            background: 'linear-gradient(180deg, #E8CBC0 0%, #D6B0A2 100%)',
          }}
        />

        {/* Soft-Focus Background Café Lamps & Cravely Wall Plaque */}
        <svg
          viewBox="0 0 1600 420"
          preserveAspectRatio="xMidYMin slice"
          className="w-full h-56 sm:h-64 opacity-85"
        >
          <defs>
            <linearGradient id="etLampBrass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E5C590" />
              <stop offset="55%" stopColor="#B8925A" />
              <stop offset="100%" stopColor="#876636" />
            </linearGradient>
            <radialGradient id="etLampGlow" cx="0.5" cy="0.1" r="0.88">
              <stop offset="0%" stopColor="#FFF4D0" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#FFF4D0" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Ceiling Trim */}
          <rect x="0" y="0" width="1600" height="20" fill="#5A3B33" />
          <rect x="0" y="20" width="1600" height="5" fill="#C59B62" />

          {/* Hanging Brass Lamps */}
          {[280, 800, 1320].map((lx) => (
            <g key={lx}>
              <polygon points={`${lx},115 ${lx - 180},420 ${lx + 180},420`} fill="url(#etLampGlow)" />
              <line x1={lx} y1="20" x2={lx} y2="96" stroke="#8C6936" strokeWidth="3.5" />
              <path d={`M${lx - 30} 116 A30 22 0 0 1 ${lx + 30} 116 Z`} fill="url(#etLampBrass)" />
              <circle cx={lx} cy="120" r="11" fill="#FFF7DC" />
            </g>
          ))}

          {/* Soft Cravely Oval Wall Plaque Behind Showcase */}
          <g opacity="0.65">
            <ellipse cx="800" cy="212" rx="178" ry="56" fill="#F1DBD0" stroke="#A36361" strokeWidth="4" />
            <ellipse cx="800" cy="212" rx="168" ry="48" fill="none" stroke="#B8925A" strokeWidth="1.6" />
            <text
              x="800"
              y="218"
              textAnchor="middle"
              fontSize="28"
              fontWeight="700"
              letterSpacing="4"
              fill="#A36361"
              fontFamily="Cinzel Decorative, Cormorant Garamond, serif"
            >
              Cravely
            </text>
            <text x="800" y="238" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="3" fill="#5A3B33">
              PATISSERIE &amp; CAKE ATELIER
            </text>
          </g>
        </svg>
      </div>

      {/* ==================== 2. COMPACT TOP HEADER BAR ==================== */}
      <div className="relative z-20 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-1 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="bg-[#FFFDF9]/94 border-2 border-[#C59B62] rounded-2xl px-4 py-2 shadow-md w-fit">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-burgundy">
            Etalase Kaca Cravely · Tampak Dekat
          </p>
          <h1 className="font-coquette text-sm sm:text-lg font-bold text-ink leading-tight">
            Pajangan Kue Ulang Tahun &amp; Chiffon Cake
          </h1>
        </div>

        {/* Clean Shelf Filter Tabs */}
        <div
          role="tablist"
          aria-label="Pilih rak etalase"
          className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#FFFDF9]/95 border-2 border-[#C59B62] shadow-md self-start sm:self-auto"
        >
          {(
            [
              ['semua', 'Semua (2 Rak)'],
              ['chiffon', 'Rak Atas · Chiffon'],
              ['ultah', 'Rak Bawah · Kue Ultah'],
            ] as Array<[ShelfTab, string]>
          ).map(([key, label]) => {
            const active = shelfTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setShelfTab(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? 'bg-cherry text-white shadow-sm'
                    : 'text-ink/80 hover:text-cherry hover:bg-blush/50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== 3. ZOOMED-IN CURVED GLASS CAKE SHOWCASE (MATCHING CAFESCENE ARCHITECTURE!) ==================== */}
      <section
        aria-label="Etalase Kaca Kue Cravely Jarak Dekat"
        className="relative z-20 w-full max-w-[1340px] mx-auto px-2 sm:px-6 my-auto"
      >
        {/* Outer Curved-Top Brass Glass Display Dome Matching sIsiDepan */}
        <div
          className="relative rounded-t-[42px] sm:rounded-t-[58px] rounded-b-[22px] border-[5px] border-[#B8925A] shadow-[0_26px_60px_rgba(61,43,40,0.34)] overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,253,249,0.88) 0%, rgba(250,238,228,0.82) 55%, rgba(242,226,214,0.92) 100%)',
          }}
        >
          {/* Curved Top Brass Trim & Warm Recessed Chiller LED Strip */}
          <div className="relative h-9 bg-gradient-to-r from-[#8E6A36] via-[#EBD09B] to-[#8E6A36] border-b-2 border-[#7A592A] flex items-center justify-between px-6">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.22em] uppercase text-[#3D251E]">
              CRAVELY CAKE SHOWCASE · 4°C FRESH DAILY
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#3D251E]">
              <Hand className="w-3.5 h-3.5" />
              <span>Geser kaca ke kiri / kanan</span>
            </span>
          </div>
          {/* Glowing Overhead Chiller LED Bar */}
          <div
            aria-hidden="true"
            className="pointer-events-none h-2.5 w-full bg-gradient-to-b from-[#FFF7D6] to-transparent shadow-[0_6px_24px_rgba(255,241,196,0.95)]"
          />

          {/* Subtle Interior Side Glass Perspective Frames */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-9 left-0 w-7 sm:w-10 z-20 border-r border-[#C59B62]/55 bg-gradient-to-r from-[#E4D3C3]/75 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-9 right-0 w-7 sm:w-10 z-20 border-l border-[#C59B62]/55 bg-gradient-to-l from-[#E4D3C3]/75 to-transparent"
          />

          {/* Subtle Diagonal Front Glass Reflection (Shifts slightly with pointer for 2.5D feel!) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 opacity-40 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${(tilt.x * 16).toFixed(1)}px)`,
              background:
                'linear-gradient(112deg, transparent 7%, rgba(255,255,255,0.52) 12%, transparent 16%, transparent 52%, rgba(255,255,255,0.28) 56%, transparent 60%, transparent 84%, rgba(255,255,255,0.34) 88%, transparent 92%)',
            }}
          />

          {/* Left / Right Brass Pan Buttons */}
          <button
            type="button"
            onClick={() => panBy(-320)}
            aria-label="Geser etalase ke kiri"
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-kayu/92 hover:bg-cherry text-ivory border-2 border-[#E5C590] shadow-xl absolute left-3.5 top-[44%] -translate-y-1/2 z-40 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => panBy(320)}
            aria-label="Geser etalase ke kanan"
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-kayu/92 hover:bg-cherry text-ivory border-2 border-[#E5C590] shadow-xl absolute right-3.5 top-[44%] -translate-y-1/2 z-40 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Horizontally Draggable 2-Shelf Glass Chamber */}
          <div
            ref={scrollerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onScroll={updateScrollRatio}
            className={`relative z-20 overflow-x-auto no-scrollbar px-8 sm:px-14 pt-3 pb-4 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="w-max min-w-full flex flex-col gap-5">
              {/* ===== RAK ATAS: CHIFFON CAKES ===== */}
              {(shelfTab === 'semua' || shelfTab === 'chiffon') && (
                <div className="relative pt-1">
                  <div className="flex items-end justify-around gap-8 sm:gap-12 px-2 pb-2">
                    {chiffonCakes.map((cake) => renderCakeBay(cake))}
                  </div>

                  {/* Thick Tempered Crystal Glass Shelf + Brushed Brass Front Edge + Under-Shelf LED */}
                  <div className="relative -mt-3">
                    <div
                      className="h-3.5 rounded-sm border-y border-[#9FB6BD]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(232,243,246,0.92) 0%, rgba(196,216,222,0.88) 100%)',
                        boxShadow: '0 8px 18px rgba(61,43,40,0.16)',
                      }}
                    />
                    <div className="h-1.5 bg-gradient-to-r from-[#9C7640] via-[#E7CA94] to-[#9C7640]" />
                    <div className="h-2 bg-gradient-to-b from-[#FFF4CC]/85 to-transparent" />
                  </div>
                </div>
              )}

              {/* ===== RAK BAWAH: KUE ULANG TAHUN ===== */}
              {(shelfTab === 'semua' || shelfTab === 'ultah') && (
                <div className="relative pt-1">
                  <div className="flex items-end justify-around gap-7 sm:gap-10 px-2 pb-2">
                    {ultahCakes.map((cake) => renderCakeBay(cake))}
                  </div>

                  {/* Lower Tempered Glass Deck */}
                  <div className="relative -mt-3">
                    <div
                      className="h-3.5 rounded-sm border-y border-[#9FB6BD]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(232,243,246,0.94) 0%, rgba(196,216,222,0.9) 100%)',
                      }}
                    />
                    <div className="h-1.5 bg-gradient-to-r from-[#9C7640] via-[#E7CA94] to-[#9C7640]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* White Marble Counter Ledge Matching CafeScene gMarmer */}
          <div
            className="relative z-30 h-5 border-y-2 border-[#CDBFAA]"
            style={{
              background: 'linear-gradient(90deg, #FFFFFF 0%, #F7F0E8 50%, #EAE0D5 100%)',
            }}
          />

          {/* Signature Cravely Burgundy Paneled Lower Counter Apron (#A36361) */}
          <div className="relative z-30 bg-[#A36361] px-5 py-3.5 border-b-[5px] border-[#C59B62] flex flex-col sm:flex-row items-center justify-between gap-3 text-ivory">
            {/* Subtle Recessed Decorative Counter Molding */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-[#FCE8EC] whitespace-nowrap">
                Geser Etalase
              </span>
              <div className="w-32 sm:w-40 h-2 rounded-full bg-[#774140] border border-[#F1DBD0]/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F5D7A1] to-[#FFFDF9] transition-all duration-150"
                  style={{ width: `${Math.max(18, Math.round(scrollRatio * 100))}%` }}
                />
              </div>
            </div>

            {/* Clear Browse-Only Notice Directing Customers to Menu Lengkap */}
            <div className="flex items-center gap-2 text-xs text-ivory font-semibold text-center sm:text-right">
              <Info className="w-4 h-4 text-[#F5D7A1] shrink-0" />
              <span>
                Etalase khusus melihat kue dari dekat · Ingin memesan?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('katalog')}
                  className="text-[#FDE8BD] hover:text-white font-extrabold underline underline-offset-2"
                >
                  Lanjut ke Menu Lengkap →
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== BROWSE-ONLY CAKE DETAIL MODAL ==================== */}
      <AnimatePresence>
        {inspectedCake && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspectedCake(null)}
            className="fixed inset-0 z-[80] bg-ink/55 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDF9] text-ink rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-[#C59B62]"
            >
              {/* Soft Cream Patisserie Showcase Header with 2.5D Cake */}
              <div className="relative bg-gradient-to-b from-[#FDF5E7] to-[#F4DFD6] pt-6 pb-3 flex flex-col items-center border-b border-dusty/50">
                <button
                  type="button"
                  onClick={() => setInspectedCake(null)}
                  aria-label="Tutup detail kue"
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#FFFDF9] border border-khaki text-ink flex items-center justify-center hover:bg-blush transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <DimensionalCake cakeId={inspectedCake.id} className="w-56 h-44" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cherry bg-[#FFFDF9] border border-dusty px-3 py-0.5 rounded-full">
                  {inspectedCake.jenis} · {inspectedCake.ukuran}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-coquette text-lg font-bold text-ink leading-snug">
                      {inspectedCake.nama}
                    </h2>
                    <p className="text-xs font-bold text-burgundy mt-0.5">
                      {inspectedCake.catatanRasa}
                    </p>
                  </div>
                  <span className="font-serif text-2xl font-extrabold text-cherry tabular-nums shrink-0">
                    {formatRupiah(inspectedCake.harga)}
                  </span>
                </div>

                <p className="text-sm text-ink/80 leading-relaxed">{inspectedCake.desc}</p>

                {/* Explicit Browse-Only Notice */}
                <div className="rounded-2xl bg-ivory border border-dusty/70 p-3.5 text-xs text-ink/85 leading-relaxed">
                  <strong className="text-cherry block mb-0.5">
                    Belum bisa memesan langsung dari etalase
                  </strong>
                  Etalase kaca ini khusus untuk melihat pajangan kue dari dekat. Silakan lanjut ke <b>Menu Lengkap Cravely</b> untuk memesan kue ini.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setInspectedCake(null)}
                    className="px-4 py-2 rounded-full border border-khaki text-xs font-bold text-ink hover:bg-ivory transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = inspectedCake.menuId;
                      setInspectedCake(null);
                      onGoToMenuWithCake(targetId);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold shadow-md transition"
                  >
                    <span>Pesan di Menu Lengkap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== FLOATING BOTTOM NAVIGATION BAR ==================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl bg-kayu/95 backdrop-blur-md text-ivory border-2 border-kuningan px-4 py-2.5 rounded-full shadow-2xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('toko')}
          className="px-3.5 py-1.5 rounded-full bg-ivory text-ink text-xs font-bold hover:bg-blush transition whitespace-nowrap"
        >
          ← Kembali ke Cafe
        </button>
        <div className="text-center text-xs hidden sm:block text-ivory/85 font-semibold">
          Etalase Kaca Pajangan · Geser &amp; Klik Kue
        </div>
        <button
          type="button"
          onClick={() => onNavigate('katalog')}
          className="px-4 py-1.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold transition whitespace-nowrap inline-flex items-center gap-1.5"
        >
          <span>Pesan lewat Menu</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
