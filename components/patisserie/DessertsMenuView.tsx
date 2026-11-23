"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { formatRupiah, type DessertIllustType, type ViewType } from "./patisserieData";

export interface DessertsMenuViewProps {
  initialSelectedId?: number | null;
  totalQty: number;
  totalPrice: number;
  onAddToCart: (item: { nama: string; harga: number; tipe: DessertIllustType }) => void;
  onNavigate: (view: ViewType) => void;
}

export type MenuCategoryKey = "semua" | "ultah" | "tart" | "cupcake" | "cookies" | "roti";

interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  kategori: Exclude<MenuCategoryKey, "semua">;
  photo: string;
  tipe: DessertIllustType;
}

// 12 Items across 2 pages (6 per page) exactly reflecting the showcase layout
const MENU_ITEMS: MenuItem[] = [
  // Page 1 Items (Matching screenshot)
  {
    id: 1,
    nama: "Strawberry Shortcake",
    harga: 110000,
    kategori: "ultah",
    photo: "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg",
    tipe: "cake-raspberry",
  },
  {
    id: 2,
    nama: "Chocolate Fudge Cake",
    harga: 120000,
    kategori: "tart",
    photo: "/images/patisserie/cake_pink_rose_chocolate_1795148928845.jpg",
    tipe: "cake-pinkchoc",
  },
  {
    id: 3,
    nama: "Red Velvet Cake",
    harga: 125000,
    kategori: "ultah",
    photo: "/images/patisserie/cake_raspberry_lemonade_1795148927822.jpg",
    tipe: "cake-raspberry",
  },
  {
    id: 4,
    nama: "Cookies & Cream Cake",
    harga: 110000,
    kategori: "ultah",
    photo: "/images/patisserie/etalase_ultah_coquette_1795156809819.jpg",
    tipe: "cupcake-straw",
  },
  {
    id: 5,
    nama: "Vanilla Bliss Cake",
    harga: 100000,
    kategori: "tart",
    photo: "/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg",
    tipe: "cupcake-apple",
  },
  {
    id: 6,
    nama: "Tiramisu Cake",
    harga: 120000,
    kategori: "tart",
    photo: "/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg",
    tipe: "cupcake-mint",
  },

  // Page 2 Items
  {
    id: 7,
    nama: "Berry Peach Cupcake",
    harga: 45000,
    kategori: "cupcake",
    photo: "/images/patisserie/cupcake_berry_peach_1795148928217.jpg",
    tipe: "cupcake-peach",
  },
  {
    id: 8,
    nama: "Cinnamon Mint Cupcake",
    harga: 45000,
    kategori: "cupcake",
    photo: "/images/patisserie/cupcake_cinnamon_mint_1795148928615.jpg",
    tipe: "cupcake-mint",
  },
  {
    id: 9,
    nama: "Rose Garden Tart",
    harga: 135000,
    kategori: "tart",
    photo: "/images/patisserie/cake_rose_garden_1795148927858.jpg",
    tipe: "cake-rosegarden",
  },
  {
    id: 10,
    nama: "Choco Butter Cookies",
    harga: 65000,
    kategori: "cookies",
    photo: "/images/patisserie/umkm_orders_packed_1795398162960.jpg",
    tipe: "donuts",
  },
  {
    id: 11,
    nama: "Artisan Brioche",
    harga: 38000,
    kategori: "roti",
    photo: "/images/patisserie/umkm_bakery_counter_1795398163126.jpg",
    tipe: "donuts",
  },
  {
    id: 12,
    nama: "Sundae Berry & Glazed Donuts",
    harga: 55000,
    kategori: "roti",
    photo: "/images/patisserie/treats_donuts_sundae_1795148927789.jpg",
    tipe: "sundae",
  },
];

interface CategoryTab {
  key: MenuCategoryKey;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const CATEGORIES: CategoryTab[] = [
  {
    key: "semua",
    label: "Semua",
    icon: (active) => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3c0 .3.05.6.14.86A4 4 0 0 0 6 9.5a4 4 0 0 0 1.2 2.8A3.5 3.5 0 0 0 7 15l1.5 6h7L17 15a3.5 3.5 0 0 0-.2-2.7A4 4 0 0 0 18 9.5a4 4 0 0 0-3.14-3.64c.09-.26.14-.56.14-.86a3 3 0 0 0-3-3z"/>
      </svg>
    ),
  },
  {
    key: "ultah",
    label: "Kue Ulang Tahun",
    icon: (active) => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
        <path d="M2 21h20"/>
        <path d="M7 8v3"/>
        <path d="M12 8v3"/>
        <path d="M17 8v3"/>
        <path d="M7 4h.01"/>
        <path d="M12 4h.01"/>
        <path d="M17 4h.01"/>
      </svg>
    ),
  },
  {
    key: "tart",
    label: "Kue Tart",
    icon: (active) => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-4.5 0-8 2-8 4.5v9C4 19 7.5 21 12 21s8-2 8-4.5v-9C20 5 16.5 3 12 3z"/>
        <path d="M4 12c0 2.5 3.5 4.5 8 4.5s8-2 8-4.5"/>
        <path d="M4 7.5c0 2.5 3.5 4.5 8 4.5s8-2 8-4.5"/>
      </svg>
    ),
  },
  {
    key: "cupcake",
    label: "Cupcake",
    icon: (active) => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 10c0 3 2.5 5 7 5s7-2 7-5"/>
        <path d="M6 15l1.5 6h9L18 15"/>
        <path d="M12 3c-1.7 0-3 1.3-3 3 0 1 .4 2 1 2.5C8 9 7 10 7 11h10c0-1-1-2-3-2.5.6-.5 1-1.5 1-2.5 0-1.7-1.3-3-3-3z"/>
      </svg>
    ),
  },
  {
    key: "cookies",
    label: "Cookies",
    icon: (active) => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
        <path d="M8.5 8.5v.01"/>
        <path d="M16 15.5v.01"/>
        <path d="M12 12v.01"/>
        <path d="M11 17v.01"/>
        <path d="M7 13v.01"/>
      </svg>
    ),
  },
  {
    key: "roti",
    label: "Roti Manis",
    icon: (active) => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16c-1.5 0-3-1-3-3.5S5 8 9 7c3-.8 6-.8 9 0 4 1 6 3 6 5.5s-1.5 3.5-3 3.5"/>
        <path d="M7 16l-2 4h14l-2-4"/>
      </svg>
    ),
  },
];

export const DessertsMenuView: React.FC<DessertsMenuViewProps> = ({
  onAddToCart,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryKey>("semua");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [addedItemIds, setAddedItemIds] = useState<Record<number, boolean>>({});

  const ITEMS_PER_PAGE = 6;

  // Filter items based on active category
  const filteredItems = useMemo(() => {
    if (selectedCategory === "semua") {
      return MENU_ITEMS;
    }
    return MENU_ITEMS.filter((item) => item.kategori === selectedCategory);
  }, [selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  // Current slice of 6 items for grid display
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleCategoryChange = (key: MenuCategoryKey) => {
    setSelectedCategory(key);
    setCurrentPage(1);
  };

  const handleAddToCartClick = (item: MenuItem) => {
    onAddToCart({
      nama: item.nama,
      harga: item.harga,
      tipe: item.tipe,
    });

    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="w-full relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 items-start">
        {/* ==================== LEFT COLUMN: HERO SHOWCASE CARD ==================== */}
        <div className="lg:col-span-4 xl:col-span-4 w-full">
          <div className="relative rounded-[26px] overflow-hidden shadow-xl border border-[#E8D9C8] flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[690px] bg-[#EDE0D1]">
            {/* Background Full Photo */}
            <img
              src="/images/patisserie/treats_donuts_sundae_1795148927789.jpg"
              alt="Koleksi Kue Cravely"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Top Scrim Gradient */}
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/65 via-black/25 to-transparent pointer-events-none" />

            {/* Top Text Content */}
            <div className="relative z-10 p-6 sm:p-7 pt-7 sm:pt-8 text-white">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-white/90 drop-shadow">
                SELAMAT DATANG DI CRAVELY
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold uppercase tracking-tight text-white leading-[1.15] mt-1.5 drop-shadow-md">
                KOLEKSI KUE<br />TERBAIK
              </h2>
              <p className="font-serif italic text-base sm:text-lg text-white/95 mt-1 drop-shadow">
                untuk Momen Spesialmu ♡
              </p>
            </div>

            {/* Bottom Attached Burgundy Banner Card with Wave Scoop */}
            <div className="relative z-10 mt-auto">
              {/* Curve Scoop SVG */}
              <div className="w-full overflow-hidden leading-none -mb-[1px]">
                <svg
                  viewBox="0 0 400 36"
                  preserveAspectRatio="none"
                  className="w-full h-7 sm:h-9 text-[#7D2330] fill-current"
                >
                  <path d="M0,36 C130,0 270,32 400,12 L400,36 L0,36 Z" />
                </svg>
              </div>

              <div className="bg-[#7D2330] text-white px-6 sm:px-7 pb-6 sm:pb-7 pt-1">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#F9CCD2] block">
                  CAMILAN MANIS
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug mt-1 text-white">
                  Rasa Lezat<br />di Setiap Gigitan
                </h3>

                <div className="mt-3.5 pt-2 border-t border-white/20">
                  <Link
                    href="/pesan"
                    className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white/95 hover:text-white transition-colors"
                  >
                    <span className="w-4 h-[1px] bg-white/70 group-hover:w-6 transition-all" />
                    <span>Pesan Sekarang</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: MENU CATALOG & FILTER TABS ==================== */}
        <div className="lg:col-span-8 xl:col-span-8 w-full flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[690px] relative">
          <div>
            {/* Header: Menu Kami + Flourish Divider Line */}
            <div className="flex items-center gap-4 w-full">
              <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-[44px] text-[#4A2E2B] font-normal shrink-0 tracking-tight">
                Menu Kami
              </h1>
              <div className="flex-1 h-[1px] bg-[#D4BCAF] relative" />
              {/* Subtle Botanical Branch Flourish */}
              <div className="shrink-0 text-[#C4A999] opacity-75 hidden sm:block">
                <svg width="42" height="24" viewBox="0 0 50 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M5,25 Q25,12 45,5" strokeLinecap="round" />
                  <path d="M20,15 C22,9 28,10 27,15 C26,20 20,19 20,15 Z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M34,9 C37,5 42,6 41,10 C40,14 34,13 34,9 Z" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#7D5A50] mt-1">
              Berbagai pilihan kue lezat untuk setiap momen spesialmu ♡
            </p>

            {/* Category Filter Tabs */}
            <div className="mt-5 sm:mt-6 overflow-x-auto no-scrollbar pb-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-max">
                {CATEGORIES.map((tab) => {
                  const isActive = selectedCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleCategoryChange(tab.key)}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#7D2330] text-white shadow-sm ring-1 ring-[#7D2330]"
                          : "bg-[#F5EBE1] text-[#5C3D2E] hover:bg-[#EFE3D5] hover:text-[#3D231E]"
                      }`}
                    >
                      {tab.icon(isActive)}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid: 3 Columns x 2 Rows */}
            <div className="mt-5 sm:mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedCategory}-${currentPage}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
                >
                  {paginatedItems.map((item) => {
                    const isAdded = !!addedItemIds[item.id];
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FFFDF9] rounded-2xl p-3 border border-[#F0E4D8] shadow-[0_2px_8px_rgba(90,56,47,0.04)] hover:shadow-md transition-shadow flex items-center gap-3.5 group"
                      >
                        {/* Left: Square Cake Photo */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#EFE2D6]">
                          <img
                            src={item.photo}
                            alt={item.nama}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Right: Info + Action */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                          <div>
                            <h4 className="font-serif font-bold text-[13px] sm:text-sm text-[#381F1B] leading-tight line-clamp-2">
                              {item.nama}
                            </h4>
                            <p className="text-xs sm:text-[13px] font-semibold text-[#6E4238] mt-1 tabular-nums">
                              {formatRupiah(item.harga)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCartClick(item)}
                            className={`mt-2.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm w-fit ${
                              isAdded
                                ? "bg-emerald-700 text-white"
                                : "bg-[#7D2330] hover:bg-[#681C27] text-white"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Ditambah</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Tambah</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ==================== BOTTOM PAGINATION & SKETCH ORNAMENT ==================== */}
          <div className="mt-8 sm:mt-10 pt-4 flex items-center justify-between relative">
            {/* Centered Pagination Controls */}
            <div className="flex-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full border border-[#D9C4B2] flex items-center justify-center text-[#6E4238] hover:bg-[#FAF0E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#7D2330] text-white shadow-sm"
                        : "bg-[#F5ECE3] text-[#6E4238] hover:bg-[#EBDDCF]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full border border-[#D9C4B2] flex items-center justify-center text-[#6E4238] hover:bg-[#FAF0E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
                aria-label="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Right Corner Delicate Cake Line-art Sketch */}
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 hidden sm:block">
              <svg width="86" height="72" viewBox="0 0 100 80" fill="none" stroke="#7D5A50" strokeWidth="1.2">
                {/* Cake slice base */}
                <path d="M10,65 L80,65 L95,38 L25,38 Z" strokeLinejoin="round" />
                <path d="M10,65 L10,50 L25,25 L95,25 L95,38" strokeLinejoin="round" />
                <path d="M10,50 L80,50 L95,25" strokeLinejoin="round" />
                {/* Layer fill lines */}
                <line x1="12" y1="57" x2="80" y2="57" strokeDasharray="2,2" />
                {/* Berry on top */}
                <circle cx="58" cy="18" r="6" stroke="#7D5A50" />
                <circle cx="68" cy="19" r="5" stroke="#7D5A50" />
                <path d="M58,12 Q61,7 65,8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
