import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Sparkles } from 'lucide-react';
import {
  INGREDIENTS_MATRIX,
  MENU_DESSERTS,
  formatRupiah,
  type DessertCategory,
  type DessertItem,
  type IngredientKey,
  type ViewType,
} from '../data/patisserieData';
import { CoquetteRibbonCard, DessertIllustration } from './DessertIllustrations';

interface DessertsMenuViewProps {
  initialSelectedId?: number | null;
  totalQty: number;
  totalPrice: number;
  onAddToCart: (item: { nama: string; harga: number; tipe: DessertItem['tipe'] }) => void;
  onNavigate: (view: ViewType) => void;
}

const CATEGORY_TABS: Array<{ id: DessertCategory; label: string }> = [
  { id: 'semua', label: 'Semua Menu' },
  { id: 'chiffon', label: 'Chiffon & Ultah' },
  { id: 'cupcake', label: 'Cupcakes' },
  { id: 'cake', label: 'Whole Cakes' },
  { id: 'treats', label: 'Sweet Treats' },
];

/** Minimalist patisserie ingredient icons for the Recipe Matrix */
const IngredientSymbol: React.FC<{ kind: IngredientKey; active: boolean }> = ({ kind, active }) => {
  const stroke = active ? '#FFFDF9' : '#6B473C';
  const fillSoft = active ? 'rgba(255,253,249,0.22)' : 'rgba(211,162,157,0.24)';

  switch (kind) {
    case 'sponge_vanila':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <circle cx="14" cy="14" r="9.5" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
          <circle cx="11" cy="12" r="1.2" fill={stroke} />
          <circle cx="16.5" cy="11.5" r="1.2" fill={stroke} />
          <circle cx="14" cy="16.5" r="1.2" fill={stroke} />
        </svg>
      );
    case 'cokelat_belgia':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <rect x="6" y="6" width="16" height="16" rx="2.5" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
          <line x1="14" y1="6" x2="14" y2="22" stroke={stroke} strokeWidth="1.2" />
          <line x1="6" y1="14" x2="22" y2="14" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'red_velvet':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <path
            d="M14 21 C8 16.5 5.5 13 5.5 9.8 C5.5 7.2 7.5 5.5 10 5.5 C11.8 5.5 13.1 6.5 14 8 C14.9 6.5 16.2 5.5 18 5.5 C20.5 5.5 22.5 7.2 22.5 9.8 C22.5 13 20 16.5 14 21 Z"
            fill={fillSoft}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'krim_mawar':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <circle cx="14" cy="14" r="9.5" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
          <path
            d="M14 14 m-4 0 a4 4 0 1 1 8 0 a5.5 5.5 0 1 1 -10 -2"
            fill="none"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'cream_cheese':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <path d="M5 17 Q9.5 10 14 17 T23 17" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 12 Q9.5 6 14 12 T23 12" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'stroberi':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <path
            d="M14 22 C9 19.5 7 14.5 7.5 11 C8 8.5 10.5 8 14 8 C17.5 8 20 8.5 20.5 11 C21 14.5 19 19.5 14 22 Z"
            fill={fillSoft}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M11 8 L14 5.5 L17 8" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'raspberry':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <circle cx="11" cy="13" r="3.4" fill={fillSoft} stroke={stroke} strokeWidth="1.4" />
          <circle cx="17" cy="13" r="3.4" fill={fillSoft} stroke={stroke} strokeWidth="1.4" />
          <circle cx="14" cy="18" r="3.4" fill={fillSoft} stroke={stroke} strokeWidth="1.4" />
          <path d="M11 8.5 Q14 6.5 17 8.5" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'kayu_manis':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <line x1="7" y1="20" x2="21" y2="8" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="11" y1="22" x2="22" y2="13" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    case 'persik':
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <circle cx="14" cy="15" r="8" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
          <path d="M14 7 Q18 5 20 8" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 8 Q11.5 14 14 22" fill="none" stroke={stroke} strokeWidth="1.2" opacity="0.7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 28 28" className="w-6 h-6 mx-auto" aria-hidden="true">
          <path d="M9 14 A5 5 0 0 1 19 14 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
          <polygon points="9.5,14 18.5,14 14,23" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
  }
};

export const DessertsMenuView: React.FC<DessertsMenuViewProps> = ({
  initialSelectedId,
  totalQty,
  totalPrice,
  onAddToCart,
  onNavigate,
}) => {
  const [selectedCake, setSelectedCake] = useState<DessertItem>(() => {
    if (initialSelectedId) {
      const found = MENU_DESSERTS.find((d) => d.id === initialSelectedId);
      if (found) return found;
    }
    return MENU_DESSERTS[0];
  });
  const [category, setCategory] = useState<DessertCategory>('semua');
  const [addedId, setAddedId] = useState<number | null>(null);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const showcaseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!initialSelectedId) return;
    const found = MENU_DESSERTS.find((d) => d.id === initialSelectedId);
    if (found) setSelectedCake(found);
  }, [initialSelectedId]);

  const filteredItems =
    category === 'semua'
      ? MENU_DESSERTS
      : MENU_DESSERTS.filter((item) => item.kategori === category);

  const handleAdd = (item: DessertItem) => {
    onAddToCart({ nama: item.nama, harga: item.harga, tipe: item.tipe });
    setAddedId(item.id);
    window.setTimeout(() => {
      setAddedId((prev) => (prev === item.id ? null : prev));
    }, 850);
  };

  const handleInspectCake = (item: DessertItem, scrollToTop = false) => {
    setSelectedCake(item);
    if (scrollToTop && showcaseRef.current) {
      showcaseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleIngredientClick = (ingredient: IngredientKey) => {
    const match = MENU_DESSERTS.find((item) => item.ingredients.includes(ingredient));
    if (match) setSelectedCake(match);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ivory pt-24 lg:pt-32"
    >
      {/* ==================== SECTION 1: REALISTIC CAKE SHOWCASE & RECIPE MATRIX (COQUETTE EDITORIAL) ==================== */}
      <section
        ref={showcaseRef}
        aria-label="Koleksi Foto Realistis & Komposisi Kue Harian"
        className="w-full border-b-2 border-dusty/55 bg-[#FBF1E4]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* LEFT: Realistic Studio Photograph + Bottom Recipe Strip */}
          <div className="lg:col-span-6 relative flex flex-col bg-[#EDE0D1] border-b lg:border-b-0 lg:border-r border-dusty/60">
            <div className="relative flex-1 min-h-[340px] sm:min-h-[450px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCake.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {!imgError[selectedCake.id] ? (
                    <img
                      src={selectedCake.photo}
                      alt={selectedCake.nama}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgError((prev) => ({ ...prev, [selectedCake.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-ivory to-blush p-8">
                      <DessertIllustration tipe={selectedCake.tipe} className="w-44 h-44" />
                      <p className="font-coquette text-cherry font-bold mt-3">{selectedCake.nama}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Subtle Top Scrim for Editorial Headline */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-kayuGelap/55 via-kayuGelap/20 to-transparent"
              />

              <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-10 text-ivory drop-shadow">
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-blush">
                  Etalase Realistis · Panggang Harian
                </p>
                <h1 className="font-coquette text-xl sm:text-3xl font-bold tracking-wide leading-tight mt-0.5 text-balance">
                  Koleksi Kue
                  <br />
                  Cravely
                </h1>
              </div>

              {/* Subtle Interactive Caption on Photo */}
              <div className="absolute top-5 right-5 z-10 bg-[#FFFDF9]/92 backdrop-blur-sm border border-dusty/80 px-3 py-1.5 rounded-full text-[11px] font-bold text-ink shadow-sm hidden sm:block">
                {selectedCake.servingNote}
              </div>
            </div>

            {/* Bottom Attached Coquette Tasting & Formula Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-12 border-t-2 border-cherry/65 bg-[#FFFDF9]">
              <div className="sm:col-span-5 bg-cherry text-ivory px-5 py-4 flex flex-col justify-center">
                <span className="text-[10px] tracking-[0.18em] uppercase text-blush font-bold">
                  Pilihan Aktif
                </span>
                <h2 className="font-coquette text-sm sm:text-base font-bold leading-snug mt-0.5">
                  {selectedCake.nama}
                </h2>
                <span className="font-serif text-xl font-bold text-ivory mt-1 tabular-nums">
                  {formatRupiah(selectedCake.harga)}
                </span>
              </div>

              <div className="sm:col-span-7 px-5 py-4 flex flex-col justify-between gap-3 bg-[#FFFDF9]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-burgundy">
                    Komposisi Utama
                  </span>
                  <p className="text-xs font-bold text-ink tracking-wide leading-relaxed mt-0.5">
                    {selectedCake.formula}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink/65 line-clamp-1">{selectedCake.desc}</span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAdd(selectedCake)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold whitespace-nowrap shadow-sm transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addedId === selectedCake.id ? 'Masuk!' : 'Pesan'}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Café Menu List + Interactive Patisserie Ingredient Matrix */}
          <div className="lg:col-span-6 p-6 sm:p-9 flex flex-col justify-between gap-7 bg-[#F7EBDC]">
            {/* Top: Editorial Patisserie Menu Selector */}
            <div>
              <div className="flex items-end justify-between border-b border-burgundy/30 pb-3 mb-4">
                <div>
                  <span className="font-script text-3xl text-cherry leading-none block">
                    Daftar Menu Lengkap
                  </span>
                  <h2 className="font-coquette text-base sm:text-lg font-bold text-ink mt-0.5">
                    Jenis Kue &amp; Harga · Klik untuk Lihat Foto Asli
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('etalase')}
                  className="text-[11px] font-bold text-cherry hover:text-burgundy underline underline-offset-2 hidden sm:inline shrink-0"
                >
                  Intip Etalase Dekat →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 max-h-[340px] overflow-y-auto pr-1">
                {MENU_DESSERTS.map((item) => {
                  const isActive = item.id === selectedCake.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInspectCake(item, false)}
                      className={`group flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl border-b border-dashed text-left transition ${
                        isActive
                          ? 'bg-[#FFFDF9] border-cherry shadow-sm ring-1 ring-cherry/35'
                          : 'border-burgundy/30 hover:bg-[#FFFDF9]/75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-lg bg-blush/40 flex items-center justify-center">
                          <DessertIllustration tipe={item.tipe} className="w-8 h-8" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate transition ${
                              isActive ? 'text-cherry' : 'text-ink group-hover:text-cherry'
                            }`}
                          >
                            {item.nama}
                          </p>
                          <p className="text-[11px] font-semibold text-burgundy tabular-nums">
                            {formatRupiah(item.harga)}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <Sparkles className="w-3.5 h-3.5 text-cherry shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Interactive 5x2 Ingredient Composition Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-burgundy">
                  Matriks Komposisi Bahan Kue
                </span>
                <span className="text-[11px] text-ink/60">
                  Menyala sesuai kue terpilih
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 border border-burgundy/45 rounded-2xl overflow-hidden bg-[#FFFDF9]/65">
                {INGREDIENTS_MATRIX.map((ing) => {
                  const active = selectedCake.ingredients.includes(ing.key);
                  return (
                    <button
                      key={ing.key}
                      type="button"
                      onClick={() => handleIngredientClick(ing.key)}
                      className={`p-3 border-r border-b border-burgundy/25 flex flex-col items-center justify-center gap-1.5 text-center transition duration-200 ${
                        active
                          ? 'bg-cherry text-ivory shadow-inner'
                          : 'bg-transparent text-ink/80 hover:bg-blush/45'
                      }`}
                    >
                      <IngredientSymbol kind={ing.key} active={active} />
                      <span className="text-[10.5px] font-bold leading-tight">
                        {ing.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: ARCHED GINGHAM POSTER WITH COQUETTE RIBBON-BORDERED CAKE CARDS ==================== */}
      <section className="latar-gingham py-14 pb-28 px-3 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#FFFDF9] kubah-menu-poster border-[5px] border-cherry shadow-2xl p-4 sm:p-8">
            <div className="kubah-menu-poster border-2 border-cherry/75 px-4 sm:px-9 pt-8 sm:pt-12 pb-10 text-center">
              {/* Poster Header */}
              <div className="flex items-center justify-center gap-4 sm:gap-7 max-w-md mx-auto">
                <div className="text-[10px] sm:text-xs font-coquette font-bold tracking-wider text-cherry uppercase leading-tight text-right">
                  Pilihan
                  <br />
                  Manis
                </div>

                <div className="w-16 sm:w-20 flex-none animate-float-soft">
                  <svg viewBox="0 0 100 120" className="w-full h-auto" aria-hidden="true">
                    <path d="M52 28 L66 8" stroke="#A36361" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M28 52 Q50 22 72 52 Z" fill="#FDF5E7" stroke="#A36361" strokeWidth="2.5" />
                    <circle cx="50" cy="28" r="7" fill="#B23A48" />
                    <path d="M26 52 H74 L66 94 Q50 102 34 94 Z" fill="#F1DBD0" stroke="#A36361" strokeWidth="2.5" />
                    <rect x="36" y="62" width="28" height="22" rx="6" fill="#FFFFFF" stroke="#A36361" strokeWidth="1.5" />
                    <text x="50" y="75" textAnchor="middle" fontSize="6.4" fontWeight="800" fill="#A36361">
                      CRAVELY
                    </text>
                    <rect x="46" y="96" width="8" height="12" fill="#A36361" />
                    <ellipse cx="50" cy="110" rx="20" ry="5" fill="#F1DBD0" stroke="#A36361" strokeWidth="2" />
                  </svg>
                </div>

                <div className="text-[10px] sm:text-xs font-coquette font-bold tracking-wider text-cherry uppercase leading-tight text-left">
                  Dibuat
                  <br />
                  Setiap Hari
                </div>
              </div>

              <h2 className="font-script text-5xl sm:text-7xl text-cherry mt-1 mb-2 drop-shadow-sm">
                Desserts
              </h2>
              <p className="text-xs sm:text-sm text-ink/70 font-semibold max-w-md mx-auto mb-6">
                Klik kue berpita mana pun untuk melihat tampilan foto realistis &amp; resep bahannya di atas.
              </p>

              {/* Category Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter kategori menu desserts"
                className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-ivory border border-dusty/60 rounded-2xl mb-9"
              >
                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={active}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        active
                          ? 'bg-cherry text-white shadow-sm'
                          : 'text-ink/75 hover:text-cherry hover:bg-blush/40'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Ribbon-Bordered Dessert Cards Grid */}
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9 text-center"
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item, idx) => {
                    const isJustAdded = addedId === item.id;
                    const isSelected = selectedCake.id === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{
                          duration: 0.36,
                          delay: Math.min(idx * 0.04, 0.28),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="flex"
                      >
                        <CoquetteRibbonCard
                          variant="menu"
                          className={`w-full flex flex-col justify-between ${
                            isSelected ? 'ring-2 ring-cherry/45 ring-offset-2 ring-offset-[#FFFDF9]' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => handleInspectCake(item, true)}
                              className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cherry rounded-2xl"
                            >
                              <div className="relative flex items-center justify-center h-28 sm:h-32 mb-2">
                                <div className="w-24 h-24 rounded-full bg-blush/30 blur-xl absolute" />
                                <div className="relative transform transition-transform duration-300 ease-out group-hover:scale-108 group-hover:-translate-y-1">
                                  <DessertIllustration
                                    tipe={item.tipe}
                                    className={
                                      item.kategori === 'cupcake'
                                        ? 'w-24 sm:w-28 h-24 sm:h-28 mx-auto'
                                        : 'w-32 sm:w-36 h-28 mx-auto'
                                    }
                                  />
                                </div>

                                <AnimatePresence>
                                  {isJustAdded && (
                                    <motion.span
                                      initial={{ opacity: 0, y: 8, scale: 0.6 }}
                                      animate={{ opacity: 1, y: -26, scale: 1.15 }}
                                      exit={{ opacity: 0, y: -42 }}
                                      transition={{ duration: 0.65, ease: 'easeOut' }}
                                      className="pointer-events-none absolute top-2 right-4 text-xs font-extrabold text-cherry bg-blush/90 border border-cherry/30 px-2 py-0.5 rounded-full shadow-sm"
                                    >
                                      +1 Manis!
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>

                              <h3 className="font-coquette font-bold text-xs sm:text-sm tracking-wide text-cherry leading-snug">
                                {item.nama}
                              </h3>
                              <p className="text-[11.5px] text-ink/70 mt-1.5 leading-relaxed min-h-[34px]">
                                {item.desc}
                              </p>
                              <span className="inline-block mt-1 text-[10.5px] font-bold text-burgundy/80 underline underline-offset-2">
                                Lihat Foto Realistis ↑
                              </span>
                            </button>
                          </div>

                          <div className="mt-4 pt-3 border-t border-dashed border-dusty/55 flex items-center justify-between gap-2">
                            <span className="font-serif text-lg sm:text-xl font-bold text-burgundy tabular-nums">
                              {formatRupiah(item.harga)}
                            </span>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleAdd(item)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                                isJustAdded
                                  ? 'bg-sage text-ink shadow-inner'
                                  : 'bg-cherry/12 text-cherry hover:bg-cherry hover:text-white'
                              }`}
                            >
                              {isJustAdded ? 'Ditambahkan ✓' : '+ Keranjang'}
                            </motion.button>
                          </div>
                        </CoquetteRibbonCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              <div className="mt-12 pt-5 border-t border-cherry/25 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="font-coquette font-bold tracking-[0.18em] text-xs sm:text-sm text-cherry uppercase">
                  Cravely
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('custom')}
                  className="text-xs font-bold text-burgundy underline underline-offset-4 hover:text-cherry transition"
                >
                  Ingin Desain Kue 3D Sendiri? Buka Meja Custom →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Bottom Cart Summary Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl bg-kayu/95 backdrop-blur-md text-ivory border-2 border-kuningan px-4 py-2.5 rounded-full shadow-2xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('toko')}
          className="px-3.5 py-1.5 rounded-full bg-ivory text-ink text-xs font-bold hover:bg-blush transition whitespace-nowrap"
        >
          ← Kembali ke Cafe
        </button>
        <div className="text-center text-xs hidden sm:block tabular-nums">
          <span className="text-blush">Keranjang:</span> <b>{totalQty} item</b> ·{' '}
          <b>{formatRupiah(totalPrice)}</b>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('kasir')}
          className="px-4 py-1.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold transition whitespace-nowrap"
        >
          Lihat Keranjang &amp; Bayar →
        </button>
      </div>
    </motion.div>
  );
};
