"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Search,
  Check,
  Eye,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  RefreshCcw,
} from "lucide-react";
import { formatRupiah, type ViewType } from "./patisserieData";

export interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  id_kategori?: number | null;
  kategori: string;
  kategoriLabel: string;
  photo?: string | null;
  porsi?: string;
  label_teks?: string;
  desc: string;
  komposisi: string;
  urutan?: number;
}

export interface KategoriItem {
  id: number;
  nama: string;
  urutan?: number;
}

export interface DessertsMenuViewProps {
  initialSelectedId?: number | null;
  totalQty?: number;
  totalPrice?: number;
  items?: MenuItem[];
  kategoriList?: KategoriItem[];
  sedangMemuat?: boolean;
  errorMemuat?: string | null;
  onCobaLagi?: () => void;
  onAddToCart: (item: MenuItem) => void;
  onNavigate?: (view: ViewType) => void;
}

export type SortOptionKey = "terbaru" | "harga-asc" | "harga-desc";

export const DessertsMenuView: React.FC<DessertsMenuViewProps> = ({
  initialSelectedId,
  items = [],
  kategoriList = [],
  sedangMemuat = false,
  errorMemuat = null,
  onCobaLagi,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [sortBy, setSortBy] = useState<SortOptionKey>("terbaru");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [addedItemIds, setAddedItemIds] = useState<Record<number, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const [selectedCake, setSelectedCake] = useState<MenuItem | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (items.length > 0) {
      if (initialSelectedId) {
        const found = items.find((c) => c.id === Number(initialSelectedId));
        if (found) {
          setSelectedCake(found);
          setHighlightedId(found.id);
          setTimeout(() => {
            if (cardRefs.current[found.id]) {
              cardRefs.current[found.id]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 300);
          const t = setTimeout(() => setHighlightedId(null), 3000);
          return () => clearTimeout(t);
        }
      }
      setSelectedCake((prev) => {
        if (!prev) return items[0];
        const stillExists = items.find((c) => c.id === prev.id);
        return stillExists || items[0];
      });
    } else {
      setSelectedCake(null);
    }
  }, [items, initialSelectedId]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    if (selectedCategory !== "semua") {
      result = result.filter(
        (item) =>
          String(item.id_kategori) === selectedCategory ||
          item.kategori.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q)
      );
    }

    if (sortBy === "terbaru") {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (sortBy === "harga-asc") {
      result.sort((a, b) => a.harga - b.harga);
    } else if (sortBy === "harga-desc") {
      result.sort((a, b) => b.harga - a.harga);
    }

    return result;
  }, [items, selectedCategory, searchQuery, sortBy]);

  const visibleItems = useMemo(() => {
    return filteredAndSortedItems.slice(0, visibleCount);
  }, [filteredAndSortedItems, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedItems.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleSelectCakeForPreview = (item: MenuItem, scrollOnMobile = true) => {
    setSelectedCake(item);
    if (scrollOnMobile && typeof window !== "undefined" && window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAddToCartClick = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onAddToCart(item);
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="w-full relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 items-start">
        {/* ==================== LEFT COLUMN: PRATINJAU DETAIL KUE ==================== */}
        <div ref={previewRef} className="lg:col-span-4 xl:col-span-4 w-full lg:sticky lg:top-14 z-20 self-start">
          <div className="relative rounded-[26px] overflow-hidden shadow-xl border border-[#E8D9C8] flex flex-col justify-between h-[calc(100vh-4.5rem)] max-h-[580px] sm:max-h-[610px] min-h-[460px] bg-[#EDE0D1]">
            <AnimatePresence mode="wait">
              {selectedCake && selectedCake.photo && !imgErrors[selectedCake.id] ? (
                <motion.img
                  key={selectedCake.id}
                  src={selectedCake.photo}
                  alt={selectedCake.nama}
                  onError={() =>
                    setImgErrors((prev) => ({
                      ...prev,
                      [selectedCake.id]: true,
                    }))
                  }
                  initial={{ opacity: 0.3, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.3, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <div
                  key={selectedCake ? `no-photo-${selectedCake.id}` : "empty-preview"}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-[#EDE0D1] text-[#8C6D62] p-6 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-[#E0D1C1] flex items-center justify-center mb-3 shadow-inner">
                    <svg
                      className="w-10 h-10 text-[#8C6D62]/70"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <span className="font-serif font-bold text-base text-[#381F1B]">
                    {selectedCake ? "Foto Belum Tersedia" : "Pilih Menu Kue"}
                  </span>
                  <span className="text-xs text-[#7D5A50] mt-1">
                    {selectedCake
                      ? "Foto produk akan tampil setelah diunggah oleh admin."
                      : "Pilih salah satu kue di katalog untuk pratinjau detail."}
                  </span>
                </div>
              )}
            </AnimatePresence>

            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6 pt-5 sm:pt-6 text-white">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-white/95 border border-white/25">
                  Pratinjau Kue Terpilih
                </span>
                {selectedCake?.label_teks ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 text-[10px] font-extrabold tracking-wide uppercase shadow-xs">
                    {selectedCake.label_teks}
                  </span>
                ) : null}
              </div>

              {selectedCake && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCake.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2"
                  >
                    <h2 className="font-serif text-xl sm:text-2xl lg:text-[26px] font-bold uppercase tracking-tight text-white leading-tight drop-shadow-md">
                      {selectedCake.nama}
                    </h2>
                    <p className="font-serif italic text-xs sm:text-sm text-white/90 mt-0.5 drop-shadow">
                      {selectedCake.kategoriLabel}
                    </p>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {selectedCake && (
              <div className="relative z-10 mt-auto">
                <div className="w-full overflow-hidden leading-none -mb-[1px]">
                  <svg
                    viewBox="0 0 400 32"
                    preserveAspectRatio="none"
                    className="w-full h-6 sm:h-7 text-[#7D2330] fill-current"
                  >
                    <path d="M0,32 C130,0 270,28 400,10 L400,32 L0,32 Z" />
                  </svg>
                </div>

                <div className="bg-[#7D2330] text-white px-5 sm:px-6 pb-5 sm:pb-6 pt-0.5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCake.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#F9CCD2] block">
                          {selectedCake.kategoriLabel}
                        </span>
                        <span
                          className="text-sm sm:text-base font-bold text-white font-serif tabular-nums"
                          style={{ fontVariantNumeric: "lining-nums" }}
                        >
                          {formatRupiah(selectedCake.harga)}
                        </span>
                      </div>

                      <p className="text-xs text-white/90 leading-snug mt-1 line-clamp-2">
                        {selectedCake.desc || "Kue lezat berkualitas khas Cravely."}
                      </p>

                      <div className="mt-3 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => handleAddToCartClick(selectedCake, e)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                            addedItemIds[selectedCake.id]
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-[#7D2330] hover:bg-[#FFFDF9]"
                          }`}
                        >
                          {addedItemIds[selectedCake.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Ditambahkan!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>+ Masukkan Keranjang</span>
                            </>
                          )}
                        </button>

                        <Link
                          href="/pesan"
                          className="py-2 px-3 rounded-xl border border-white/40 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                          title="Pesan kue khusus dengan dekorasi kustom"
                        >
                          Custom →
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: FILTER & PRODUCT GRID ==================== */}
        <div className="lg:col-span-8 xl:col-span-8 w-full flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] relative">
          <div>
            <div className="flex items-center gap-4 w-full">
              <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-[44px] text-[#4A2E2B] font-normal shrink-0 tracking-tight">
                Menu Kami
              </h1>
              <div className="flex-1 h-[1px] bg-[#D4BCAF] relative" />
              <div className="shrink-0 text-[#C4A999] opacity-75 hidden sm:block">
                <svg width="42" height="24" viewBox="0 0 50 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M5,25 Q25,12 45,5" strokeLinecap="round" />
                  <path d="M20,15 C22,9 28,10 27,15 C26,20 20,19 20,15 Z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M34,9 C37,5 42,6 41,10 C40,14 34,13 34,9 Z" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#7D5A50] mt-1">
              Pilih kue favoritmu atau klik kartu untuk melihat pratinjau detail lengkap di panel kiri ♡
            </p>

            {/* Filter & Search Bar */}
            <div className="mt-5 p-3 sm:p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE3D5] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C6D62] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(12);
                  }}
                  placeholder="Cari kue, bahan (misal: cokelat, tiramisu)..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-[#FAF4EE] border border-[#E8DACB] text-[#3D2B28] placeholder-[#9E8278] focus:outline-none focus:ring-1 focus:ring-[#7D2330] focus:border-[#7D2330] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C6D62] hover:text-[#3D2B28] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex items-center">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6D62] absolute left-3 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOptionKey)}
                    className="pl-8 pr-7 py-2 rounded-xl text-xs sm:text-[13px] font-semibold bg-[#FAF4EE] border border-[#E8DACB] text-[#5C3D2E] focus:outline-none focus:ring-1 focus:ring-[#7D2330] appearance-none cursor-pointer"
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="harga-asc">Harga Terendah</option>
                    <option value="harga-desc">Harga Tertinggi</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C6D62] absolute right-2.5 pointer-events-none" />
                </div>

                <div className="hidden sm:flex items-center px-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-xs font-semibold text-[#6E4238]">
                  <span>{filteredAndSortedItems.length} Kue</span>
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="mt-3.5 sm:mt-4 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-2 min-w-max">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("semua");
                    setVisibleCount(12);
                  }}
                  className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedCategory === "semua"
                      ? "bg-[#7D2330] text-white shadow-sm ring-1 ring-[#7D2330]"
                      : "bg-[#F5EBE1] text-[#5C3D2E] hover:bg-[#EFE3D5] hover:text-[#3D231E]"
                  }`}
                >
                  <span>Semua</span>
                </button>

                {kategoriList.map((kat) => {
                  const isCatActive =
                    selectedCategory === String(kat.id) ||
                    selectedCategory.toLowerCase() === kat.nama.toLowerCase();
                  return (
                    <button
                      key={kat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(String(kat.id));
                        setVisibleCount(12);
                      }}
                      className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCatActive
                          ? "bg-[#7D2330] text-white shadow-sm ring-1 ring-[#7D2330]"
                          : "bg-[#F5EBE1] text-[#5C3D2E] hover:bg-[#EFE3D5] hover:text-[#3D231E]"
                      }`}
                    >
                      <span>{kat.nama}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="mt-5">
              {sedangMemuat ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6].map((sk) => (
                    <div
                      key={sk}
                      className="rounded-2xl p-3 border border-[#F0E4D8] bg-[#FFFDF9] animate-pulse flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-200 shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 bg-stone-200 rounded-md w-16" />
                          <div className="h-4 bg-stone-200 rounded-md w-3/4" />
                          <div className="h-3 bg-stone-200 rounded-md w-full" />
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#F2E5D9] flex justify-between items-center">
                        <div className="h-4 bg-stone-200 rounded-md w-20" />
                        <div className="h-7 bg-stone-200 rounded-lg w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : errorMemuat ? (
                <div className="bg-[#FFFDF9] rounded-2xl border border-rose-200 p-8 text-center text-rose-800">
                  <p className="font-serif text-lg font-bold">Gagal Memuat Menu</p>
                  <p className="text-xs sm:text-sm mt-1 text-stone-600">{errorMemuat}</p>
                  {onCobaLagi && (
                    <button
                      type="button"
                      onClick={onCobaLagi}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#7D2330] text-white text-xs font-semibold hover:bg-[#681C27] transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>Coba Lagi</span>
                    </button>
                  )}
                </div>
              ) : items.length === 0 ? (
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#F0E4D8] p-10 text-center text-[#7D5A50]">
                  <p className="font-serif text-lg font-bold text-[#381F1B]">Belum ada menu</p>
                  <p className="text-xs sm:text-sm mt-1 text-[#8C6D62]">
                    Menu kue katalog siap pesan sedang disiapkan oleh dapur Cravely.
                  </p>
                </div>
              ) : visibleItems.length === 0 ? (
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#F0E4D8] p-8 text-center text-[#7D5A50]">
                  <p className="font-serif text-lg font-bold text-[#381F1B]">Kue tidak ditemukan</p>
                  <p className="text-xs sm:text-sm mt-1">Coba kata kunci lain atau pilih kategori "Semua".</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("semua");
                    }}
                    className="mt-4 px-4 py-1.5 rounded-xl bg-[#7D2330] text-white text-xs font-semibold hover:bg-[#681C27] transition cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {visibleItems.map((item) => {
                    const isAdded = !!addedItemIds[item.id];
                    const isSelectedInPreview = selectedCake?.id === item.id;
                    const isHighlighted = highlightedId === item.id;

                    return (
                      <div
                        key={item.id}
                        ref={(el) => {
                          cardRefs.current[item.id] = el;
                        }}
                        onClick={() => handleSelectCakeForPreview(item, true)}
                        className={`rounded-2xl p-3 border transition-all flex flex-col justify-between cursor-pointer group relative ${
                          isHighlighted
                            ? "bg-[#FFFDF9] border-[#ba2b2b] ring-4 ring-[#ba2b2b]/40 shadow-xl scale-[1.02]"
                            : isSelectedInPreview
                            ? "bg-[#FFFDF9] border-[#7D2330] ring-2 ring-[#7D2330]/35 shadow-md"
                            : "bg-[#FFFDF9] border-[#F0E4D8] hover:border-[#D9C4B2] hover:shadow-md shadow-xs"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#EFE2D6] relative">
                            {item.photo && !imgErrors[item.id] ? (
                              <img
                                src={item.photo}
                                alt={item.nama}
                                onError={() =>
                                  setImgErrors((prev) => ({
                                    ...prev,
                                    [item.id]: true,
                                  }))
                                }
                                className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5ECE3] text-[#8C6D62] text-center p-1">
                                <svg
                                  className="w-6 h-6 text-[#8C6D62]/60 mb-0.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span className="text-[9px] font-semibold text-[#8C6D62] leading-tight">
                                  Tidak ada foto
                                </span>
                              </div>
                            )}
                            {item.label_teks && (
                              <span className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white text-center truncate">
                                {item.label_teks}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-[#8C6D62] font-semibold truncate">
                                {item.kategoriLabel}
                              </span>
                            </div>

                            <h4 className="font-serif font-bold text-sm text-[#381F1B] leading-tight line-clamp-1 mt-0.5 group-hover:text-[#7D2330] transition-colors">
                              {item.nama}
                            </h4>

                            <p className="text-[11px] text-[#7D5A50] line-clamp-2 mt-1 leading-snug">
                              {item.desc || "Pilihan kue istimewa Cravely."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#F2E5D9] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-[#8C6D62] block leading-none">Harga</span>
                            <span
                              className="text-xs sm:text-sm font-bold text-[#7D2330] font-serif tabular-nums"
                              style={{ fontVariantNumeric: "lining-nums" }}
                            >
                              {formatRupiah(item.harga)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCakeForPreview(item, true);
                              }}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                isSelectedInPreview
                                  ? "bg-[#7D2330] text-white border-[#7D2330]"
                                  : "bg-[#FAF4EE] hover:bg-[#F2E5D9] text-[#6E4238] border-[#E8DACB]"
                              }`}
                              title="Lihat Pratinjau di Panel Kiri"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleAddToCartClick(item, e)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs ${
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 sm:mt-10 pt-4 flex flex-col items-center justify-center gap-2">
            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-6 py-2.5 rounded-full bg-[#FAF0E6] hover:bg-[#F3E3D3] border border-[#D9C4B2] text-[#5C3D2E] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Tampilkan Lebih Banyak ({filteredAndSortedItems.length - visibleCount} Kue Lagi)</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            ) : items.length > 0 ? (
              <div className="px-5 py-2 rounded-full bg-[#FAF4EE] border border-[#E8DACB] text-xs font-medium text-[#7D5A50] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B62]" />
                <span>Semua menu telah ditampilkan ({filteredAndSortedItems.length} kue) ♡</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
