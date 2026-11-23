"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  CakeSlice,
  ChefHat,
  Home,
  LogOut,
  Menu,
  ShoppingBag,
  Store,
  User,
  LayoutDashboard,
  X,
} from "lucide-react";
import {
  HAMPERS_ITEMS,
  formatRupiah,
} from "@/components/patisserie/patisserieData";
import { CafeScene } from "@/components/patisserie/CafeScene";
import { CafeStoryShowcase } from "@/components/patisserie/CafeStoryShowcase";
import { EtalaseShowcaseView } from "@/components/patisserie/EtalaseShowcaseView";
import { DessertsMenuView } from "@/components/patisserie/DessertsMenuView";
import { KasirView } from "@/components/patisserie/KasirView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { PromoWelcomeModal } from "@/components/patisserie/PromoWelcomeModal";
import {
  ContactView,
  DokumentasiView,
  LokasiView,
  PengaduanView,
} from "@/components/patisserie/StoreProfilePages";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function HomePage() {
  const router = useRouter();

  const [entered, setEntered] = useState(false);
  const [cafeStartInside, setCafeStartInside] = useState(false);
  const [activeView, setActiveView] = useState("toko");
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [cart, setCart] = useState([
    {
      id: "initial-raspberry",
      nama: "Raspberry Lemonade Cake",
      harga: 185000,
      qty: 1,
      tipe: "cake-raspberry",
    },
  ]);

  const [customerName, setCustomerName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [hampersOpen, setHampersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [areaSidebarOpen, setAreaSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Supabase Auth and Store data
  const [userSession, setUserSession] = useState(null);
  const [toko, setToko] = useState({
    nama_toko: "Cravely Patisserie",
    alamat: "Jl. Melati No. 18, Bandung",
    no_wa: "081234567890",
    jam_operasional: "Senin - Minggu: 08.00 - 20.00",
  });

  const promoShownOnceRef = useRef(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: storeData } = await supabase
          .from("pengaturan_toko")
          .select("nama_toko, alamat, no_wa, jam_operasional")
          .eq("id", 1)
          .maybeSingle();

        if (storeData && storeData.nama_toko) {
          setToko(storeData);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUserSession(session);
      } catch (err) {
        console.error("Gagal memuat pengaturan toko / sesi auth:", err);
      }
    }
    loadData();
  }, []);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const handleCopyText = useCallback(
    (text, label) => {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => showToast(`${label} disalin: ${text}`))
          .catch(() => showToast(`${label}: ${text}`));
      } else {
        showToast(`${label}: ${text}`);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (entered && activeView === "toko" && !promoShownOnceRef.current) {
      promoShownOnceRef.current = true;
      setPromoOpen(true);
    }
  }, [entered, activeView]);

  useEffect(() => {
    if (activeView === "toko") {
      setAreaSidebarOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    if (!areaSidebarOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setAreaSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [areaSidebarOpen]);

  const showAreaShortcut = entered && activeView !== "toko";
  const totalQty = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((s, it) => s + it.harga * it.qty, 0), [cart]);

  const handleNavigate = (view) => {
    setMobileMenuOpen(false);
    setAreaSidebarOpen(false);

    // KETENTUAN USER: /pesan JANGAN DISENTUH!
    // Ketika user mengklik 'custom' (Studio Custom Cake / Kitchen 3D), arahkan ke rute /pesan
    if (view === "custom") {
      router.push("/pesan");
      return;
    }

    setEntered(true);
    if (view === "toko") {
      setCafeStartInside(true);
      if (activeView === "toko") {
        const targetTop = Math.round(window.innerHeight * 1.4);
        window.scrollTo({ top: targetTop, behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setActiveView(view);
  };

  const handleOpenAboutUs = () => {
    setMobileMenuOpen(false);
    setAreaSidebarOpen(false);
    setEntered(true);
    setCafeStartInside(true);
    if (activeView !== "toko") {
      setActiveView("toko");
      window.setTimeout(() => {
        const el = document.getElementById("about-us");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 280);
    } else {
      const el = document.getElementById("about-us");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGoToMenuWithCake = (menuId) => {
    setSelectedMenuId(menuId);
    handleNavigate("katalog");
  };

  const handleExitShop = () => {
    setMobileMenuOpen(false);
    setAreaSidebarOpen(false);
    if (activeView === "toko") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCafeStartInside(false);
      setActiveView("toko");
      setEntered(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.nama === item.nama);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          nama: item.nama,
          harga: item.harga,
          qty: 1,
          tipe: item.tipe,
        },
      ];
    });
    showToast(`Masuk keranjang: ${item.nama}`);
  };

  const handleUpdateQty = (index, delta) => {
    setCart((prev) => {
      const next = [...prev];
      const nextQty = next[index].qty + delta;
      if (nextQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], qty: nextQty };
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-blush selection:text-cherry">
      {/* ==================== COMPACT TOP-LEFT AREA TOKO ICON ==================== */}
      <AnimatePresence>
        {showAreaShortcut && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -24, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setAreaSidebarOpen((prev) => !prev)}
            aria-label={areaSidebarOpen ? "Tutup menu Area Toko" : "Buka menu Area Toko"}
            aria-expanded={areaSidebarOpen}
            title="Area Toko & Keluar"
            className="fixed left-3 sm:left-4 z-[60] w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bingkai-papan-menu text-ivory hover:text-blush flex items-center justify-center transition-colors"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 1.1rem)",
            }}
          >
            {areaSidebarOpen ? <X className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ==================== LEFT SLIDE-OUT DRAWER: AREA TOKO & NAVIGASI ==================== */}
      <AnimatePresence>
        {showAreaShortcut && areaSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setAreaSidebarOpen(false)}
            className="fixed inset-0 z-[58] bg-kayuGelap/50 backdrop-blur-[2px]"
          >
            <motion.aside
              aria-label="Navigasi Area Toko"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-72 max-w-[82vw] bg-gradient-to-b from-[#5A3B33] to-[#3E2721] text-ivory border-r-2 border-kuningan/80 shadow-2xl flex flex-col justify-between p-5 pt-20"
            >
              <div className="space-y-5 overflow-y-auto no-scrollbar">
                <div className="pb-3 border-b border-kuningan/35 flex items-center justify-between">
                  <div>
                    <span className="font-script text-2xl text-blush block leading-none">
                      {toko.nama_toko || "Cravely Patisserie"}
                    </span>
                    <h2 className="font-coquette text-xs font-bold tracking-widest uppercase text-kuningan mt-1">
                      Area Toko
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAreaSidebarOpen(false)}
                    aria-label="Tutup panel Area Toko"
                    className="w-8 h-8 rounded-full bg-kayuGelap/80 hover:bg-cherry text-ivory border border-kuningan/50 flex items-center justify-center transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "toko", label: "Ruang Cafe (Home)", icon: Home },
                    { key: "etalase", label: "Etalase Kue", icon: CakeSlice },
                    { key: "katalog", label: "Daftar Menu", icon: BookOpen },
                    { key: "custom", label: "Pesan Custom Cake", icon: ChefHat },
                    { key: "kasir", label: "Meja Kasir", icon: ShoppingBag },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isCurrent = activeView === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleNavigate(item.key)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 transition ${
                          isCurrent
                            ? "bg-cherry text-white border border-blush/40 shadow-sm"
                            : "bg-kayuGelap/55 hover:bg-kayuGelap text-ivory/90 hover:text-blush border border-kuningan/25"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <IconComp className="w-4 h-4 text-kuningan shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        {item.key === "kasir" && (
                          <span className="px-2 py-0.5 rounded-full bg-ivory text-cherry text-[10px] font-extrabold tabular-nums">
                            {totalQty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Akses Cepat Transaksi & Akun */}
                <div className="pt-3 border-t border-kuningan/30 space-y-2">
                  <Link
                    href="/pesan"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blush/20 hover:bg-blush/30 text-blush border border-kuningan/40 flex items-center gap-2.5 transition"
                  >
                    <ChefHat className="w-4 h-4 text-kuningan" />
                    <span>Pesan Custom Cake</span>
                  </Link>
                  <Link
                    href="/pesanan-saya"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-kayuGelap/55 hover:bg-kayuGelap text-ivory/90 border border-kuningan/25 flex items-center gap-2.5 transition"
                  >
                    <ShoppingBag className="w-4 h-4 text-kuningan" />
                    <span>Pesanan Saya</span>
                  </Link>
                  {userSession ? (
                    <Link
                      href="/profil"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-kayuGelap/55 hover:bg-kayuGelap text-ivory/90 border border-kuningan/25 flex items-center gap-2.5 transition"
                    >
                      <User className="w-4 h-4 text-kuningan" />
                      <span>Akun Saya</span>
                    </Link>
                  ) : (
                    <Link
                      href="/masuk"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cherry/80 hover:bg-cherry text-white border border-blush/30 flex items-center gap-2.5 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>Masuk / Daftar</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Pinned Exit Button */}
              <div className="pt-4 border-t border-kuningan/35 space-y-2">
                <button
                  type="button"
                  onClick={handleExitShop}
                  className="w-full px-4 py-2.5 rounded-xl bg-kayuGelap hover:bg-cherry text-blush hover:text-white border border-kuningan/60 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar ke Depan Pintu</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== HANGING WOODEN & BRASS MENU BAR ==================== */}
      <nav
        aria-label="Navigasi Papan Menu"
        className={`fixed z-50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showAreaShortcut
            ? "left-[calc(50%+1.65rem)] sm:left-1/2 w-[calc(100%-4.5rem)] sm:w-[calc(100%-8.5rem)] max-w-5xl"
            : "left-1/2 w-[calc(100%-1rem)] max-w-6xl"
        }`}
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 0.4rem)",
          transform: entered ? "translate(-50%, 0)" : "translate(-50%, -215%)",
          pointerEvents: entered ? "auto" : "none",
        }}
      >
        <div className="flex justify-around max-w-xl mx-auto px-8">
          <span className="rantai-kuningan" />
          <span className="rantai-kuningan" />
          <span className="rantai-kuningan" />
        </div>

        {/* Main Hanging Wooden Board */}
        <div className="bingkai-papan-menu text-ivory rounded-2xl px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          {/* Brand */}
          <button
            type="button"
            onClick={() => handleNavigate("toko")}
            className="flex items-center gap-2 font-coquette font-bold text-xs sm:text-sm tracking-widest whitespace-nowrap shrink-0 text-ivory hover:text-blush transition"
          >
            <span className="w-2 h-2 rounded-full bg-kuningan inline-block" aria-hidden="true" />
            <span>{toko.nama_toko ? toko.nama_toko.split(" ")[0] : "Cravely"}</span>
          </button>

          {/* Primary Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleNavigate("toko")}
              className={`whitespace-nowrap shrink-0 transition ${
                activeView === "toko"
                  ? "text-blush underline underline-offset-4"
                  : "text-ivory/90 hover:text-blush"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("etalase")}
              className={`whitespace-nowrap shrink-0 transition ${
                activeView === "etalase"
                  ? "text-blush underline underline-offset-4"
                  : "text-ivory/90 hover:text-blush"
              }`}
            >
              Etalase 3D
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("katalog")}
              className={`whitespace-nowrap shrink-0 transition ${
                activeView === "katalog"
                  ? "text-blush underline underline-offset-4"
                  : "text-ivory/90 hover:text-blush"
              }`}
            >
              Daftar Menu
            </button>

            {/* Link Custom Cake Langsung ke /pesan (tidak disentuh) */}
            <Link
              href="/pesan"
              className="px-3 py-1 rounded-full bg-cherry/80 hover:bg-cherry text-white border border-blush/40 whitespace-nowrap shrink-0 transition shadow-sm"
            >
              Pesan Custom Cake
            </Link>

            <button
              type="button"
              onClick={handleOpenAboutUs}
              className="whitespace-nowrap shrink-0 text-ivory/90 hover:text-blush transition"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("dokumentasi")}
              className={`whitespace-nowrap shrink-0 transition ${
                activeView === "dokumentasi"
                  ? "text-blush underline underline-offset-4"
                  : "text-ivory/90 hover:text-blush"
              }`}
            >
              Dokumentasi
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("lokasi")}
              className={`whitespace-nowrap shrink-0 transition ${
                activeView === "lokasi"
                  ? "text-blush underline underline-offset-4"
                  : "text-ivory/90 hover:text-blush"
              }`}
            >
              Lokasi Toko
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("contact")}
              className={`whitespace-nowrap shrink-0 transition ${
                activeView === "contact"
                  ? "text-blush underline underline-offset-4"
                  : "text-ivory/90 hover:text-blush"
              }`}
            >
              Kontak
            </button>
          </div>

          {/* Right Controls: Pesanan Saya, Akun/Login, Kasir, Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/pesanan-saya"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-full bg-blush/20 hover:bg-blush/35 border border-kuningan/70 text-blush hover:text-white text-[11px] font-bold whitespace-nowrap transition"
            >
              Pesanan Saya
            </Link>

            {userSession ? (
              <Link
                href="/profil"
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-kayuGelap hover:bg-black/40 border border-kuningan/60 text-ivory text-[11px] font-bold whitespace-nowrap transition"
              >
                <User className="w-3 h-3 text-kuningan" />
                <span>Akun</span>
              </Link>
            ) : (
              <Link
                href="/masuk"
                className="hidden md:inline-flex items-center px-2.5 py-1.5 rounded-full bg-kayuGelap hover:bg-black/40 border border-kuningan/60 text-ivory text-[11px] font-bold whitespace-nowrap transition"
              >
                Masuk
              </Link>
            )}

            <button
              type="button"
              onClick={() => handleNavigate("kasir")}
              className="px-3 py-1.5 bg-cherry hover:bg-burgundy text-white rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-sm border border-blush/30 transition flex items-center gap-1.5"
            >
              <span>Kasir</span>
              <span className="px-1.5 py-0.5 rounded-full bg-ivory text-cherry text-[11px] font-extrabold tabular-nums">
                {totalQty}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden px-3 py-1.5 rounded-full bg-kayuGelap border border-kuningan/80 text-ivory text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>Menu</span>
              {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 bg-[#FFFDF9] text-ink rounded-2xl border-2 border-kuningan shadow-2xl p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleNavigate("toko")}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  Home (Ruang Cafe)
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("etalase")}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  Etalase 3D
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("katalog")}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  Daftar Menu
                </button>
                <Link
                  href="/pesan"
                  className="p-2.5 rounded-xl bg-cherry text-white text-left border border-cherry transition block"
                >
                  Pesan Custom Cake 🎂
                </Link>
                <button
                  type="button"
                  onClick={handleOpenAboutUs}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  About Us
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("dokumentasi")}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  Dokumentasi
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("lokasi")}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  Lokasi Toko
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("contact")}
                  className="p-2.5 rounded-xl bg-ivory hover:bg-blush text-left border border-dusty/50 transition"
                >
                  Contact Person
                </button>
              </div>
              <div className="pt-2 border-t border-dusty/40 flex flex-wrap gap-2 text-[11px] font-bold">
                <Link
                  href="/pesanan-saya"
                  className="px-3 py-1.5 rounded-full bg-ivory border border-dusty text-ink"
                >
                  Pesanan Saya
                </Link>
                {userSession ? (
                  <Link
                    href="/profil"
                    className="px-3 py-1.5 rounded-full bg-ivory border border-dusty text-ink"
                  >
                    Akun Saya
                  </Link>
                ) : (
                  <Link
                    href="/masuk"
                    className="px-3 py-1.5 rounded-full bg-cherry text-white"
                  >
                    Masuk Akun
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleNavigate("kasir")}
                  className="px-3 py-1.5 rounded-full bg-blush/70 text-cherry ml-auto"
                >
                  Meja Kasir ({totalQty})
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ==================== MAIN VIEWS ==================== */}
      <AnimatePresence mode="wait">
        {activeView === "toko" && (
          <div key="view-toko">
            <CafeScene
              startInside={cafeStartInside}
              onEnteredChange={setEntered}
              onNavigate={handleNavigate}
              onOpenInfo={() => setInfoOpen(true)}
            />
            <CafeStoryShowcase
              onNavigate={handleNavigate}
              onGoToMenuWithCake={handleGoToMenuWithCake}
              onNotify={showToast}
            />
          </div>
        )}

        {activeView === "etalase" && (
          <EtalaseShowcaseView
            key="view-etalase"
            onNavigate={handleNavigate}
            onGoToMenuWithCake={handleGoToMenuWithCake}
          />
        )}

        {activeView === "katalog" && (
          <DessertsMenuView
            key="view-katalog"
            initialSelectedId={selectedMenuId}
            totalQty={totalQty}
            totalPrice={totalPrice}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === "kasir" && (
          <KasirView
            key="view-kasir"
            cart={cart}
            customerName={customerName}
            pickupDate={pickupDate}
            onCustomerNameChange={setCustomerName}
            onPickupDateChange={setPickupDate}
            onUpdateQty={handleUpdateQty}
            onNavigate={handleNavigate}
            onNotify={showToast}
          />
        )}

        {activeView === "dokumentasi" && (
          <DokumentasiView
            key="view-dokumentasi"
            onNavigate={handleNavigate}
            onGoToMenuWithCake={handleGoToMenuWithCake}
          />
        )}

        {activeView === "lokasi" && <LokasiView key="view-lokasi" onNavigate={handleNavigate} />}

        {activeView === "pengaduan" && (
          <PengaduanView key="view-pengaduan" onNavigate={handleNavigate} onNotify={showToast} />
        )}

        {activeView === "contact" && (
          <ContactView key="view-contact" onNavigate={handleNavigate} onCopy={handleCopyText} />
        )}
      </AnimatePresence>

      {/* ==================== COMPLETE PATISSERIE FOOTER ==================== */}
      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => setHampersOpen(true)}
        onExitShop={handleExitShop}
      />

      {/* ==================== POPUP PROMO WELCOME ==================== */}
      <PromoWelcomeModal
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        onCopyCode={handleCopyText}
      />

      {/* ==================== MODAL HAMPERS & KUE KERING ==================== */}
      <AnimatePresence>
        {hampersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHampersOpen(false)}
            className="fixed inset-0 z-[75] bg-ink/55 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDF9] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-cherry/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cherry tracking-wide">Rak Kue Kering</span>
                <button
                  type="button"
                  onClick={() => setHampersOpen(false)}
                  aria-label="Tutup modal hampers"
                  className="w-8 h-8 rounded-full bg-ivory border border-khaki text-ink flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-coquette text-xl font-bold text-ink">
                Toples Cookies &amp; Hampers
              </h3>
              <div className="space-y-3">
                {HAMPERS_ITEMS.map((item) => (
                  <div
                    key={item.nama}
                    className="p-3.5 rounded-2xl bg-ivory border border-dusty/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">{item.nama}</p>
                      <p className="text-[11px] text-ink/65 mt-0.5">{item.desc}</p>
                      <p className="text-xs text-cherry font-extrabold mt-1 tabular-nums">
                        {formatRupiah(item.harga)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart({ nama: item.nama, harga: item.harga, tipe: item.tipe });
                        setHampersOpen(false);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold whitespace-nowrap transition"
                    >
                      + Kasir
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL INFO TOKO ==================== */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInfoOpen(false)}
            className="fixed inset-0 z-[75] bg-ink/55 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDF9] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-cherry/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cherry tracking-wide">Tentang Toko</span>
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  aria-label="Tutup modal info toko"
                  className="w-8 h-8 rounded-full bg-ivory border border-khaki text-ink flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-coquette text-xl font-bold text-ink">
                {toko.nama_toko || "Cravely Patisserie"}
              </h3>
              <p className="text-sm text-ink/75 leading-relaxed">
                Patisserie rumahan yang menyajikan kue etalase segar harian dengan hiasan
                pita coquette dan layanan desain kue custom sesuai impian acaramu.
              </p>
              <div className="bg-ivory rounded-2xl p-4 border border-dusty/50 space-y-1.5 text-xs">
                <p>
                  <b>Alamat:</b> {toko.alamat || "Jl. Melati No. 18, Bandung"}
                </p>
                <p>
                  <b>Jam Buka:</b> {toko.jam_operasional || "08.00–20.00 WIB"}
                </p>
                <p>
                  <b>WhatsApp:</b> {toko.no_wa || "081234567890"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInfoOpen(false);
                    setPromoOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-blush text-cherry text-xs font-bold hover:bg-dusty/40 transition"
                >
                  Lihat Promo 20%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInfoOpen(false);
                    handleNavigate("lokasi");
                  }}
                  className="px-4 py-2 rounded-full bg-cherry text-white text-xs font-bold hover:bg-burgundy transition"
                >
                  Buka Peta Lokasi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== TOAST NOTIFICATION ==================== */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-24 right-5 z-[90] bg-kayu text-ivory border border-kuningan px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CUSTOM PIPING BAG CURSOR ==================== */}
      <PipingBagCursor />
    </div>
  );
}
