"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Star,
  Check,
  Eye,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { formatRupiah, type DessertIllustType, type ViewType } from "./patisserieData";

export interface DessertsMenuViewProps {
  initialSelectedId?: number | null;
  totalQty: number;
  totalPrice: number;
  items?: MenuItem[];
  onAddToCart: (item: { id?: number; nama: string; harga: number; tipe?: DessertIllustType }) => void;
  onNavigate: (view: ViewType) => void;
}

export type MenuCategoryKey = "semua" | "ultah" | "tart" | "cupcake" | "cookies" | "roti";
export type SortOptionKey = "populer" | "harga-asc" | "harga-desc" | "nama";

export interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  kategori: Exclude<MenuCategoryKey, "semua">;
  kategoriLabel: string;
  photo: string;
  tipe: DessertIllustType;
  ukuran: string;
  rating: number;
  terjual: number;
  badge?: string;
  desc: string;
  komposisi: string;
}

// 12 Koleksi Menu Lengkap dengan Foto Asli & Data Detail
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    nama: "Strawberry Shortcake",
    harga: 110000,
    kategori: "ultah",
    kategoriLabel: "Kue Ulang Tahun",
    photo: "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg",
    tipe: "cake-raspberry",
    ukuran: "Whole Cake Ø16 cm · 6-8 Porsi",
    rating: 4.9,
    terjual: 248,
    badge: "Terlaris",
    desc: "Sponge cake vanilla super lembut dengan chantilly cream manis segar dan stroberi Lembang pilihan.",
    komposisi: "Sponge Vanila, Buah Stroberi Segar, Chantilly Cream, Selai Homemade",
  },
  {
    id: 2,
    nama: "Chocolate Fudge Cake",
    harga: 120000,
    kategori: "tart",
    kategoriLabel: "Kue Tart",
    photo: "/images/patisserie/cake_pink_rose_chocolate_1795148928845.jpg",
    tipe: "cake-pinkchoc",
    ukuran: "Whole Cake Ø16 cm · 6-8 Porsi",
    rating: 4.8,
    terjual: 195,
    badge: "Favorit",
    desc: "Cokelat Belgia 70% intens dengan ganache lumer berkilau, tekstur fudgy pekat yang meleleh di lidah.",
    komposisi: "Dark Chocolate Belgia 70%, Cocoa Ganache, Sponge Cokelat Moist",
  },
  {
    id: 3,
    nama: "Red Velvet Rose Cake",
    harga: 125000,
    kategori: "ultah",
    kategoriLabel: "Kue Ulang Tahun",
    photo: "/images/patisserie/cake_raspberry_lemonade_1795148927822.jpg",
    tipe: "cake-raspberry",
    ukuran: "Whole Cake Ø16 cm · 6-8 Porsi",
    rating: 4.9,
    terjual: 210,
    badge: "Signature",
    desc: "Red velvet klasik berpadu frosting cream cheese New Zealand yang gurih asam seimbang berhias kelopak mawar.",
    komposisi: "Red Velvet Sponge, New Zealand Cream Cheese, Raspberry Reduction",
  },
  {
    id: 4,
    nama: "Vintage Coquette Cake",
    harga: 110000,
    kategori: "ultah",
    kategoriLabel: "Kue Ulang Tahun",
    photo: "/images/patisserie/etalase_ultah_coquette_1795156809819.jpg",
    tipe: "cupcake-straw",
    ukuran: "Whole Cake Ø16 cm · 6-8 Porsi",
    rating: 5.0,
    terjual: 312,
    badge: "Viral di Bandung",
    desc: "Kue piping pita Lambeth estetik dengan buttercream mawar ringan, mutiara gula mutiara dan taburan edible glitter.",
    komposisi: "Sponge Cake Vanila, Mawar Buttercream Ringan, Sugar Pearls",
  },
  {
    id: 5,
    nama: "Vanilla Bliss Earl Grey",
    harga: 100000,
    kategori: "tart",
    kategoriLabel: "Kue Tart",
    photo: "/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg",
    tipe: "cupcake-apple",
    ukuran: "Whole Tart Ø16 cm · 6-8 Porsi",
    rating: 4.7,
    terjual: 142,
    desc: "Infusi seduhan daun teh Earl Grey bergamot dengan krim vanila Madagaskar dan taburan bunga mawar kering.",
    komposisi: "Earl Grey Tea Sponge, Madagaskar Vanilla Cream, Dried Rose Petals",
  },
  {
    id: 6,
    nama: "Tiramisu Pandan Suji",
    harga: 120000,
    kategori: "tart",
    kategoriLabel: "Kue Tart",
    photo: "/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg",
    tipe: "cupcake-mint",
    ukuran: "Whole Tart Ø18 cm · 8-10 Porsi",
    rating: 4.8,
    terjual: 184,
    badge: "Resep Warisan",
    desc: "Perpaduan unik mascarpone cream khas Italia dengan chiffon pandan suji asli dari kebun lokal Jawa Barat.",
    komposisi: "Pandan Suji Chiffon, Italian Mascarpone Cream, Cocoa Dusting",
  },
  {
    id: 7,
    nama: "Berry Peach Cupcake",
    harga: 45000,
    kategori: "cupcake",
    kategoriLabel: "Cupcake",
    photo: "/images/patisserie/cupcake_berry_peach_1795148928217.jpg",
    tipe: "cupcake-peach",
    ukuran: "1 Pcs Cupcake Artisan",
    rating: 4.8,
    terjual: 168,
    desc: "Cupcake mentega lembut dengan mahkota krim keju, potongan buah persik manis dan buah berry segar.",
    komposisi: "Butter Cupcake, Cream Cheese Frosting, Glaze Persik, Buah Berry",
  },
  {
    id: 8,
    nama: "Cinnamon Mint Cupcake",
    harga: 45000,
    kategori: "cupcake",
    kategoriLabel: "Cupcake",
    photo: "/images/patisserie/cupcake_cinnamon_mint_1795148928615.jpg",
    tipe: "cupcake-mint",
    ukuran: "1 Pcs Cupcake Artisan",
    rating: 4.6,
    terjual: 96,
    desc: "Aroma hangat kayu manis asli berpadu kesegaran mint alami, tekstur basah legit yang harum memikat.",
    komposisi: "Cinnamon Spiced Batter, Fresh Mint Buttercream, Cinnamon Stick",
  },
  {
    id: 9,
    nama: "The Rose Garden Tart",
    harga: 135000,
    kategori: "tart",
    kategoriLabel: "Kue Tart",
    photo: "/images/patisserie/cake_rose_garden_1795148927858.jpg",
    tipe: "cake-rosegarden",
    ukuran: "Whole Tart Ø18 cm · 8 Porsi",
    rating: 4.9,
    terjual: 153,
    badge: "Signature",
    desc: "Kulit pie almond renyah dipadu custard mawar lembut dan tatanan aneka buah berry segar bermandikan madu.",
    komposisi: "Almond Tart Crust, Rose Custard Cream, Strawberry & Raspberry",
  },
  {
    id: 10,
    nama: "Choco Butter Cookies Box",
    harga: 65000,
    kategori: "cookies",
    kategoriLabel: "Cookies",
    photo: "/images/patisserie/umkm_orders_packed_1795398162960.jpg",
    tipe: "donuts",
    ukuran: "Toples Kedap Udara 250 gram",
    rating: 4.9,
    terjual: 380,
    badge: "Favorit Camilan",
    desc: "Kue kering butter Wijsman berpadu choco chips leleh, renyah rekah di luar dan gurih wangi mentega asli.",
    komposisi: "Mentega Wijsman, Tepung Terigu Jepang, Dark Chocolate Chips",
  },
  {
    id: 11,
    nama: "Artisan Brioche & Roti Manis",
    harga: 38000,
    kategori: "roti",
    kategoriLabel: "Roti Manis",
    photo: "/images/patisserie/umkm_bakery_counter_1795398163126.jpg",
    tipe: "donuts",
    ukuran: "Isi 3 Pcs Roti Hangat",
    rating: 4.7,
    terjual: 220,
    desc: "Roti brioche kaya telur dan mentega Prancis, dipanggang hangat segar setiap pukul 7 pagi di dapur kami.",
    komposisi: "French Butter, Kuning Telur Organik, Ragi Alami, Madu Hutan",
  },
  {
    id: 12,
    nama: "Sundae Berry & Glazed Donuts",
    harga: 55000,
    kategori: "roti",
    kategoriLabel: "Roti Manis",
    photo: "/images/patisserie/treats_donuts_sundae_1795148927789.jpg",
    tipe: "sundae",
    ukuran: "1 Porsi Sundae + 2 Donat Glaze",
    rating: 4.9,
    terjual: 275,
    badge: "Menu Akhir Pekan",
    desc: "Paket donat kentang glaze mawar merah muda ditemani es krim strawberry sundae segar dan cherry maraschino.",
    komposisi: "Donat Kentang Lembut, Rose Glaze, Es Krim Strawberry Artisan",
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
    icon: () => (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3c0 .3.05.6.14.86A4 4 0 0 0 6 9.5a4 4 0 0 0 1.2 2.8A3.5 3.5 0 0 0 7 15l1.5 6h7L17 15a3.5 3.5 0 0 0-.2-2.7A4 4 0 0 0 18 9.5a4 4 0 0 0-3.14-3.64c.09-.26.14-.56.14-.86a3 3 0 0 0-3-3z"/>
      </svg>
    ),
  },
  {
    key: "ultah",
    label: "Kue Ulang Tahun",
    icon: () => (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
        <path d="M2 21h20"/>
        <path d="M7 8v3"/>
        <path d="M12 8v3"/>
        <path d="M17 8v3"/>
      </svg>
    ),
  },
  {
    key: "tart",
    label: "Kue Tart",
    icon: () => (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-4.5 0-8 2-8 4.5v9C4 19 7.5 21 12 21s8-2 8-4.5v-9C20 5 16.5 3 12 3z"/>
        <path d="M4 12c0 2.5 3.5 4.5 8 4.5s8-2 8-4.5"/>
      </svg>
    ),
  },
  {
    key: "cupcake",
    label: "Cupcake",
    icon: () => (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 10c0 3 2.5 5 7 5s7-2 7-5"/>
        <path d="M6 15l1.5 6h9L18 15"/>
        <path d="M12 3c-1.7 0-3 1.3-3 3 0 1 .4 2 1 2.5C8 9 7 10 7 11h10c0-1-1-2-3-2.5.6-.5 1-1.5 1-2.5 0-1.7-1.3-3-3-3z"/>
      </svg>
    ),
  },
  {
    key: "cookies",
    label: "Cookies",
    icon: () => (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
        <path d="M8.5 8.5v.01"/>
        <path d="M16 15.5v.01"/>
        <path d="M12 12v.01"/>
      </svg>
    ),
  },
  {
    key: "roti",
    label: "Roti Manis",
    icon: () => (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16c-1.5 0-3-1-3-3.5S5 8 9 7c3-.8 6-.8 9 0 4 1 6 3 6 5.5s-1.5 3.5-3 3.5"/>
        <path d="M7 16l-2 4h14l-2-4"/>
      </svg>
    ),
  },
];

export const DessertsMenuView: React.FC<DessertsMenuViewProps> = ({
  initialSelectedId,
  items: itemsProp,
  onAddToCart,
}) => {
  const allItems = itemsProp && itemsProp.length > 0 ? itemsProp : MENU_ITEMS;
  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryKey>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOptionKey>("populer");
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [addedItemIds, setAddedItemIds] = useState<Record<number, boolean>>({});

  const [selectedCake, setSelectedCake] = useState<MenuItem>(() => {
    if (initialSelectedId) {
      const match = allItems.find((c) => c.id === initialSelectedId);
      if (match) return match;
    }
    return allItems[0] || MENU_ITEMS[0];
  });
  const previewRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (allItems.length > 0) {
      setSelectedCake((prev) => {
        const found = allItems.find((c) => c.id === prev?.id);
        return found || allItems[0];
      });
    }
  }, [allItems]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...allItems];

    // Filter Kategori
    if (selectedCategory !== "semua") {
      result = result.filter((item) => item.kategori === selectedCategory);
    }

    // Filter Pencarian Teks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.komposisi.toLowerCase().includes(q) ||
          item.kategoriLabel.toLowerCase().includes(q)
      );
    }

    // Sorting Profesional
    if (sortBy === "populer") {
      result.sort((a, b) => b.terjual - a.terjual);
    } else if (sortBy === "harga-asc") {
      result.sort((a, b) => a.harga - b.harga);
    } else if (sortBy === "harga-desc") {
      result.sort((a, b) => b.harga - a.harga);
    } else if (sortBy === "nama") {
      result.sort((a, b) => a.nama.localeCompare(b.nama));
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  // Sliced items according to "Tampilkan Lebih Banyak"
  const visibleItems = useMemo(() => {
    return filteredAndSortedItems.slice(0, visibleCount);
  }, [filteredAndSortedItems, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedItems.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleSelectCakeForPreview = (item: MenuItem, scrollOnMobile = true) => {
    setSelectedCake(item);
    if (scrollOnMobile && window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAddToCartClick = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onAddToCart({
      id: item.id,
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
        {/* ==================== LEFT COLUMN: LIVE SPOTLIGHT / PRATINJAU DETAIL KUE ==================== */}
        <div ref={previewRef} className="lg:col-span-4 xl:col-span-4 w-full lg:sticky lg:top-14 z-20 self-start">
          <div className="relative rounded-[26px] overflow-hidden shadow-xl border border-[#E8D9C8] flex flex-col justify-between h-[calc(100vh-4.5rem)] max-h-[580px] sm:max-h-[610px] min-h-[460px] bg-[#EDE0D1]">
            {/* Background Live Preview Photo with Cross-fade Animation */}
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedCake.id}
                src={selectedCake.photo}
                alt={selectedCake.nama}
                initial={{ opacity: 0.3, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.3, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </AnimatePresence>

            {/* Top Scrim Gradient */}
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />

            {/* Top Text Content & Live Status */}
            <div className="relative z-10 p-5 sm:p-6 pt-5 sm:pt-6 text-white">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-white/95 border border-white/25">
                  Pratinjau Kue Terpilih
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-300 drop-shadow">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>{selectedCake.rating.toFixed(1)}</span>
                </span>
              </div>

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
                    {selectedCake.ukuran}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Attached Burgundy Banner Card: Detail Komposisi & Aksi Langsung */}
            <div className="relative z-10 mt-auto">
              {/* Curve Scoop SVG */}
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
                        {selectedCake.badge || selectedCake.kategoriLabel}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white font-serif tabular-nums">
                        {formatRupiah(selectedCake.harga)}
                      </span>
                    </div>

                    <p className="text-xs text-white/90 leading-snug mt-1 line-clamp-2">
                      {selectedCake.desc}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-white/20">
                      <p className="text-[10.5px] text-[#F9CCD2]/90 font-medium line-clamp-1">
                        <span className="font-bold text-white">Komposisi:</span> {selectedCake.komposisi}
                      </p>
                    </div>

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
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: PROFESSIONAL FILTER & RICH PRODUCT GRID ==================== */}
        <div className="lg:col-span-8 xl:col-span-8 w-full flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] relative">
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
              Pilih kue favoritmu atau klik kartu untuk melihat pratinjau detail lengkap di panel kiri ♡
            </p>

            {/* ==================== PROFESSIONAL FILTER & SEARCH BAR ==================== */}
            <div className="mt-5 p-3 sm:p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE3D5] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C6D62] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(6);
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

              {/* Sort Selector Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex items-center">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6D62] absolute left-3 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOptionKey)}
                    className="pl-8 pr-7 py-2 rounded-xl text-xs sm:text-[13px] font-semibold bg-[#FAF4EE] border border-[#E8DACB] text-[#5C3D2E] focus:outline-none focus:ring-1 focus:ring-[#7D2330] appearance-none cursor-pointer"
                  >
                    <option value="populer">Paling Populer</option>
                    <option value="harga-asc">Harga: Terendah</option>
                    <option value="harga-desc">Harga: Tertinggi</option>
                    <option value="nama">Nama (A - Z)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C6D62] absolute right-2.5 pointer-events-none" />
                </div>

                {/* Counter Tag */}
                <div className="hidden sm:flex items-center px-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-xs font-semibold text-[#6E4238]">
                  <span>{filteredAndSortedItems.length} Kue</span>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="mt-3.5 sm:mt-4 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-2 min-w-max">
                {CATEGORIES.map((tab) => {
                  const isActive = selectedCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(tab.key);
                        setVisibleCount(6);
                      }}
                      className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
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

            {/* ==================== PRODUCT CARDS GRID ==================== */}
            <div className="mt-5">
              {visibleItems.length === 0 ? (
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#F0E4D8] p-8 text-center text-[#7D5A50]">
                  <p className="font-serif text-lg font-bold text-[#381F1B]">Kue tidak ditemukan</p>
                  <p className="text-xs sm:text-sm mt-1">Coba kata kunci lain atau pilih kategori "Semua".</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("semua");
                    }}
                    className="mt-4 px-4 py-1.5 rounded-xl bg-[#7D2330] text-white text-xs font-semibold hover:bg-[#681C27] transition"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {visibleItems.map((item) => {
                    const isAdded = !!addedItemIds[item.id];
                    const isSelectedInPreview = selectedCake.id === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectCakeForPreview(item, true)}
                        className={`rounded-2xl p-3 border transition-all flex flex-col justify-between cursor-pointer group relative ${
                          isSelectedInPreview
                            ? "bg-[#FFFDF9] border-[#7D2330] ring-2 ring-[#7D2330]/35 shadow-md"
                            : "bg-[#FFFDF9] border-[#F0E4D8] hover:border-[#D9C4B2] hover:shadow-md shadow-xs"
                        }`}
                      >
                        {/* Top: Photo & Info Row */}
                        <div className="flex items-start gap-3">
                          {/* Cake Photo with Zoom on Hover */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#EFE2D6] relative">
                            <img
                              src={item.photo}
                              alt={item.nama}
                              className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-300"
                            />
                            {item.badge && (
                              <span className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white text-center truncate">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {/* Info Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-[#8C6D62] font-semibold truncate">
                                {item.kategoriLabel}
                              </span>
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 shrink-0">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>{item.rating.toFixed(1)}</span>
                              </span>
                            </div>

                            <h4 className="font-serif font-bold text-sm text-[#381F1B] leading-tight line-clamp-1 mt-0.5 group-hover:text-[#7D2330] transition-colors">
                              {item.nama}
                            </h4>

                            <p className="text-[11px] text-[#7D5A50] line-clamp-2 mt-1 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row: Price + Actions */}
                        <div className="mt-3 pt-2.5 border-t border-[#F2E5D9] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-[#8C6D62] block leading-none">Harga</span>
                            <span className="text-xs sm:text-sm font-bold text-[#7D2330] font-serif tabular-nums">
                              {formatRupiah(item.harga)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Tombol Pratinjau (Lihat di Kiri) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCakeForPreview(item, true);
                              }}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                isSelectedInPreview
                                  ? "bg-[#7D2330] text-white border-[#7D2330]"
                                  : "bg-[#FAF4EE] hover:bg-[#F2E5D9] text-[#6E4238] border-[#E8DACB]"
                              }`}
                              title="Lihat Pratinjau di Panel Kiri"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Tambah ke Keranjang */}
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

          {/* ==================== LOAD MORE BUTTON (MENGGANTIKAN PAGINATION) ==================== */}
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
            ) : (
              <div className="px-5 py-2 rounded-full bg-[#FAF4EE] border border-[#E8DACB] text-xs font-medium text-[#7D5A50] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B62]" />
                <span>Semua menu telah ditampilkan ({filteredAndSortedItems.length} kue) ♡</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
