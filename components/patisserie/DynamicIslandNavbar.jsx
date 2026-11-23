"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, ShoppingBag, User, Menu, X } from "lucide-react";
import { usePatisserieCart } from "@/lib/patisserieCart";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export function DynamicIslandNavbar({ showEntered = true }) {
  const pathname = usePathname();
  const { totalQty } = usePatisserieCart();
  const [userSession, setUserSession] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState("Cravely");

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Home", href: "/", active: pathname === "/" },
    { label: "Toko", href: "/toko", active: pathname.startsWith("/toko") },
    { label: "Menu", href: "/menu", active: pathname.startsWith("/menu") },
  ];

  return (
    <nav
      aria-label="Dynamic Island Navbar"
      className="fixed z-50 left-1/2 -translate-x-1/2 top-3 sm:top-4 transition-all duration-500 ease-out pointer-events-auto max-w-[calc(100vw-1.5rem)]"
      style={{
        transform: showEntered
          ? "translate(-50%, 0) scale(1)"
          : "translate(-50%, -160%) scale(0.92)",
        opacity: showEntered ? 1 : 0,
        pointerEvents: showEntered ? "auto" : "none",
      }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className={`bg-[#FFFDF9]/96 backdrop-blur-2xl border-2 border-[#C59B62]/80 text-[#3D2B28] shadow-[0_16px_45px_rgba(45,20,15,0.32),0_4px_14px_rgba(0,0,0,0.08)] px-4 sm:px-5 py-2 transition-all duration-300 ${
          mobileMenuOpen
            ? "rounded-3xl w-[calc(100vw-2rem)] sm:w-[480px]"
            : "rounded-full w-max max-w-[calc(100vw-1.5rem)]"
        }`}
      >
        {/* Main Capsule Row: 1 Baris Penuh */}
        <div className="w-full flex items-center justify-between gap-2 sm:gap-3.5 whitespace-nowrap">
          {/* Brand Logo Pill */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#F5ECE2] transition font-coquette font-bold text-xs sm:text-sm tracking-widest text-[#3D2B28] shrink-0 whitespace-nowrap"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8925A] shadow-[0_0_8px_#C59B62] animate-pulse shrink-0" />
            <span>{storeName}</span>
          </Link>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-[#D9B37C]/60 hidden md:block shrink-0" />

          {/* Core Navigation Links: Home, Toko, Menu */}
          <div className="hidden md:flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full transition whitespace-nowrap ${
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
          <div className="h-4 w-px bg-[#D9B37C]/60 hidden sm:block shrink-0" />

          {/* Cake Studio (Pill CTA - URL ke /pesan) */}
          <Link
            href="/pesan"
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(158,59,66,0.35)] border border-[#E8A5AC]/40 flex items-center gap-1.5 shrink-0 transition whitespace-nowrap ${
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
                className={`w-8 h-8 rounded-full flex items-center justify-center border border-[#D9B37C]/60 transition shrink-0 shadow-xs ${
                  pathname.startsWith("/profil")
                    ? "bg-[#9E3B42] text-white"
                    : "bg-[#F5ECE2] hover:bg-[#EBDDD0] text-[#9E3B42]"
                }`}
                title="Akun Saya"
              >
                <User className="w-4 h-4 shrink-0" />
              </Link>
            ) : (
              <Link
                href="/masuk"
                className={`w-8 h-8 rounded-full flex items-center justify-center border border-[#D9B37C]/60 transition shrink-0 shadow-xs ${
                  pathname.startsWith("/masuk")
                    ? "bg-[#9E3B42] text-white"
                    : "bg-[#F5ECE2] hover:bg-[#EBDDD0] text-[#5A3B33] hover:text-[#9E3B42]"
                }`}
                title="Masuk Akun"
              >
                <User className="w-4 h-4 shrink-0" />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden w-8 h-8 rounded-full bg-[#F5ECE2] text-[#3D2B28] flex items-center justify-center border border-[#D9B37C]/60 transition shrink-0"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown (Hanya Home, Toko, Menu, Cake Studio) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full pt-3 pb-1 border-t border-[#D9B37C]/40 mt-2 md:hidden overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold text-center">
                <Link
                  href="/"
                  className={`p-2.5 rounded-xl transition ${
                    pathname === "/"
                      ? "bg-[#9E3B42] text-white font-bold"
                      : "bg-[#F5ECE2]/80 text-[#3D2B28] hover:bg-[#F1DBD0]"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/toko"
                  className={`p-2.5 rounded-xl transition ${
                    pathname.startsWith("/toko")
                      ? "bg-[#9E3B42] text-white font-bold"
                      : "bg-[#F5ECE2]/80 text-[#3D2B28] hover:bg-[#F1DBD0]"
                  }`}
                >
                  Toko
                </Link>
                <Link
                  href="/menu"
                  className={`p-2.5 rounded-xl transition ${
                    pathname.startsWith("/menu")
                      ? "bg-[#9E3B42] text-white font-bold"
                      : "bg-[#F5ECE2]/80 text-[#3D2B28] hover:bg-[#F1DBD0]"
                  }`}
                >
                  Menu
                </Link>
              </div>

              <div className="pt-2 mt-2 border-t border-[#D9B37C]/30 flex items-center justify-between text-xs font-bold">
                <Link
                  href="/pesan"
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#9E3B42] to-[#B23A48] text-white flex items-center gap-1.5"
                >
                  <ChefHat className="w-3.5 h-3.5 text-blush" />
                  <span>Cake Studio</span>
                </Link>

                <Link
                  href="/pesanan-saya"
                  className="px-3 py-1.5 rounded-full bg-[#F5ECE2] text-[#3D2B28] border border-[#D9B37C]/50"
                >
                  Pesanan Saya
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
