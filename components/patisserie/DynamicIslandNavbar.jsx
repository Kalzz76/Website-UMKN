"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  ShoppingBag,
  User,
  Sparkles,
  Store,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { usePatisserieCart } from "@/lib/patisserieCart";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export function DynamicIslandNavbar({ showEntered = true }) {
  const pathname = usePathname();
  const { totalQty } = usePatisserieCart();
  const [userSession, setUserSession] = useState(null);
  const [storeName, setStoreName] = useState("Cravely");
  const [isExpanded, setIsExpanded] = useState(false);
  const leaveTimeoutRef = useRef(null);

  useEffect(() => {
    async function checkAuthAndStore() {
      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUserSession(session);

        const { data: storeData } = await supabase
          .from("pengaturan_toko")
          .select("nama_toko")
          .eq("id", 1)
          .maybeSingle();
        if (storeData && storeData.nama_toko) {
          setStoreName(storeData.nama_toko.split(" ")[0]);
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    checkAuthAndStore();
  }, []);

  // Tutup navbar otomatis setiap berpindah halaman (URL berubah)
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  // Bersihkan timeout saat unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 400);
  };

  // Deteksi info halaman aktif untuk status KETUTUP (Dynamic Island Title)
  const getPageInfo = () => {
    if (pathname.startsWith("/toko")) {
      return { title: "Toko", icon: Store };
    }
    if (pathname.startsWith("/menu")) {
      return { title: "Menu", icon: UtensilsCrossed };
    }
    if (pathname.startsWith("/pesan")) {
      return { title: "Cake Studio", icon: ChefHat };
    }
    if (pathname.startsWith("/kasir")) {
      return { title: "Kasir", icon: ShoppingBag };
    }
    if (
      pathname.startsWith("/profil") ||
      pathname.startsWith("/masuk") ||
      pathname.startsWith("/daftar")
    ) {
      return { title: "Akun", icon: User };
    }
    return { title: "Home", icon: Sparkles };
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  const navLinks = [
    { label: "Home", href: "/", active: pathname === "/" },
    { label: "Toko", href: "/toko", active: pathname.startsWith("/toko") },
    { label: "Menu", href: "/menu", active: pathname.startsWith("/menu") },
  ];

  return (
    <nav
      aria-label="Dynamic Island Navbar"
      className="fixed z-50 left-1/2 -translate-x-1/2 top-3 sm:top-4 pointer-events-auto max-w-[calc(100vw-1.5rem)]"
      style={{
        transform: showEntered
          ? "translate(-50%, 0) scale(1)"
          : "translate(-50%, -160%) scale(0.92)",
        opacity: showEntered ? 1 : 0,
        pointerEvents: showEntered ? "auto" : "none",
        transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 440, damping: 32 }}
        className="bg-[#FFFDF9]/96 backdrop-blur-2xl border-2 border-[#C59B62]/85 text-[#3D2B28] shadow-[0_16px_45px_rgba(45,20,15,0.30),0_4px_14px_rgba(0,0,0,0.08)] rounded-full overflow-hidden transition-colors"
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ==================== 1. STATUS KETUTUP (COMPACT DYNAMIC ISLAND) ==================== */
            <motion.button
              key="collapsed-island"
              type="button"
              onClick={() => setIsExpanded(true)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 hover:bg-[#F8EFE4]/80 transition cursor-pointer select-none whitespace-nowrap"
              title="Arahkan kursor atau klik untuk membuka menu"
            >
              {/* Pulsing Gem Dot */}
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8925A] shadow-[0_0_8px_#C59B62] animate-pulse shrink-0" />

              {/* Brand Name */}
              <span className="font-coquette font-bold text-xs sm:text-sm tracking-wider text-[#3D2B28]">
                {storeName}
              </span>

              <span className="text-[#C59B62] font-bold text-xs">·</span>

              {/* Active Page Name (Berubah sesuai halaman) */}
              <span className="font-serif font-extrabold text-xs sm:text-sm text-[#9E3B42] flex items-center gap-1.5">
                <PageIcon className="w-3.5 h-3.5 text-[#9E3B42] shrink-0" />
                <span>{pageInfo.title}</span>
              </span>

              {/* Cart Badge jika ada item */}
              {totalQty > 0 && (
                <span className="ml-0.5 px-2 py-0.5 rounded-full bg-[#9E3B42] text-white text-[10px] font-extrabold tabular-nums shadow-xs flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5 shrink-0" />
                  <span>{totalQty}</span>
                </span>
              )}

              {/* Chevron Down Indicator */}
              <ChevronDown className="w-3.5 h-3.5 text-[#8C6D62] shrink-0 ml-0.5" />
            </motion.button>
          ) : (
            /* ==================== 2. STATUS TERBUKA (EXPANDED NAVIGATION ROW) ==================== */
            <motion.div
              key="expanded-island"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap"
            >
              {/* Brand Logo Pill */}
              <Link
                href="/"
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#F5ECE2] transition font-coquette font-bold text-xs sm:text-sm tracking-widest text-[#3D2B28] shrink-0 whitespace-nowrap"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8925A] shadow-[0_0_8px_#C59B62] animate-pulse shrink-0" />
                <span>{storeName}</span>
              </Link>

              {/* Vertical Divider */}
              <div className="h-4 w-px bg-[#D9B37C]/60 shrink-0" />

              {/* Navigation Links: Home, Toko, Menu */}
              <div className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsExpanded(false)}
                    className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
                      link.active
                        ? "bg-[#9E3B42] text-white font-bold shadow-sm"
                        : "text-[#5A3B33] hover:text-[#9E3B42] hover:bg-[#F5ECE2]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Vertical Divider */}
              <div className="h-4 w-px bg-[#D9B37C]/60 shrink-0" />

              {/* Cake Studio (CTA ke /pesan) */}
              <Link
                href="/pesan"
                onClick={() => setIsExpanded(false)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(158,59,66,0.35)] border border-[#E8A5AC]/40 flex items-center gap-1.5 shrink-0 transition whitespace-nowrap ${
                  pathname.startsWith("/pesan")
                    ? "bg-[#7A2C32] text-white brightness-110"
                    : "bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-105 text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-blush shrink-0" />
                <span>Cake Studio</span>
              </Link>

              {/* Right Controls: Kasir & Akun */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Kasir Pill */}
                <Link
                  href="/kasir"
                  onClick={() => setIsExpanded(false)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border border-[#D9B37C]/60 shadow-xs shrink-0 whitespace-nowrap ${
                    pathname.startsWith("/kasir")
                      ? "bg-[#9E3B42] text-white border-transparent"
                      : "bg-[#F5ECE2] hover:bg-[#EBDDD0] text-[#3D2B28]"
                  }`}
                  title="Meja Kasir"
                >
                  <ShoppingBag
                    className={`w-3.5 h-3.5 shrink-0 ${
                      pathname.startsWith("/kasir") ? "text-white" : "text-[#B8925A]"
                    }`}
                  />
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums shadow-xs ${
                      pathname.startsWith("/kasir")
                        ? "bg-white text-[#9E3B42]"
                        : "bg-[#9E3B42] text-white"
                    }`}
                  >
                    {totalQty}
                  </span>
                </Link>

                {/* Akun */}
                {userSession ? (
                  <Link
                    href="/profil"
                    onClick={() => setIsExpanded(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F5ECE2] hover:bg-[#EBDDD0] border border-[#D9B37C]/60 text-[#3D2B28] flex items-center justify-center transition shrink-0"
                    title="Profil Saya"
                  >
                    <User className="w-3.5 h-3.5 text-[#B8925A]" />
                  </Link>
                ) : (
                  <Link
                    href="/masuk"
                    onClick={() => setIsExpanded(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F5ECE2] hover:bg-[#EBDDD0] border border-[#D9B37C]/60 text-[#3D2B28] flex items-center justify-center transition shrink-0"
                    title="Masuk / Akun"
                  >
                    <User className="w-3.5 h-3.5 text-[#5A3B33]" />
                  </Link>
                )}

                {/* Tombol Tutup / Collapse */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-6 h-6 rounded-full hover:bg-[#F5ECE2] text-[#8C6D62] hover:text-[#3D2B28] flex items-center justify-center transition shrink-0"
                  title="Tutup Menu"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
