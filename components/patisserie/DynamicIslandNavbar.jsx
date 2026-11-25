"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  ShoppingBag,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePatisserieCart } from "@/lib/patisserieCart";

export function DynamicIslandNavbar({ showEntered = true, toko = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clientNamaToko, setClientNamaToko] = useState(toko?.nama_toko || "");
  const [userSession, setUserSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [dropdownAkunBuka, setDropdownAkunBuka] = useState(false);
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0);
  const leaveTimeoutRef = useRef(null);

  const handleKeluar = async () => {
    setDropdownAkunBuka(false);
    setIsExpanded(false);
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabaseBrowser");
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      window.location.href = "/masuk";
    } catch {
      window.location.href = "/masuk";
    }
  };

  useEffect(() => {
    if (toko?.nama_toko) {
      setClientNamaToko(toko.nama_toko);
      return;
    }
    let aktif = true;
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((res) => {
        if (aktif && res?.data?.nama_toko) {
          setClientNamaToko(res.data.nama_toko);
        }
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, [toko]);

  const labelBrand = (clientNamaToko || toko?.nama_toko || "").trim();

  async function muatJumlahKeranjang() {
    try {
      const res = await fetch("/api/keranjang/jumlah", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJumlahKeranjang(Number(data.jumlah || 0));
      }
    } catch {}
  }

  useEffect(() => {
    muatJumlahKeranjang();
    const handleUpdate = () => muatJumlahKeranjang();
    window.addEventListener("cravely_cart_updated", handleUpdate);
    return () => window.removeEventListener("cravely_cart_updated", handleUpdate);
  }, [userSession]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/profil", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.data) {
            setUserSession({ user: { id: data.data.id } });
            if (data.data.role) setUserRole(data.data.role);
            if (data.data.nama) setUserName(data.data.nama);
            return;
          }
        }
      } catch {}

      try {
        const { getSupabaseBrowser } = await import("@/lib/supabaseBrowser");
        const supabase = getSupabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        setUserSession(session);

        if (session?.user?.id) {
          const { data: profil } = await supabase
            .from("profil")
            .select("nama, role")
            .eq("id", session.user.id)
            .maybeSingle();

          if (isMounted) {
            if (profil?.role) setUserRole(profil.role);
            if (profil?.nama) setUserName(profil.nama);
          }
        } else {
          setUserRole(null);
          setUserName("");
        }
      } catch {}
    }

    checkAuth();

    let authSubscription = null;
    import("@/lib/supabaseBrowser").then(({ getSupabaseBrowser }) => {
      const supabase = getSupabaseBrowser();
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;
        setUserSession(session);
        if (session?.user?.id) {
          const { data: profil } = await supabase
            .from("profil")
            .select("nama, role")
            .eq("id", session.user.id)
            .maybeSingle();
          if (isMounted) {
            if (profil?.role) setUserRole(profil.role);
            if (profil?.nama) setUserName(profil.nama);
          }
        } else {
          setUserRole(null);
          setUserName("");
        }
      });
      authSubscription = data?.subscription;
    });

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    setIsExpanded(false);
    setDropdownAkunBuka(false);
  }, [pathname]);

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
      setDropdownAkunBuka(false);
    }, 380);
  };

  const getPageTitle = () => {
    if (pathname.startsWith("/menu")) return "Menu";
    if (pathname.startsWith("/pesan")) return "Cake Studio";
    if (pathname.startsWith("/keranjang") || pathname.startsWith("/kasir")) return "Keranjang";
    if (pathname.startsWith("/checkout")) return "Checkout";
    if (pathname.startsWith("/user") || pathname.startsWith("/pesanan-saya") || pathname.startsWith("/dashboard")) {
      return "Dashboard";
    }
    if (
      pathname.startsWith("/profil") ||
      pathname.startsWith("/masuk") ||
      pathname.startsWith("/daftar")
    ) {
      return "Akun";
    }
    return "Home";
  };

  const activeTitle = getPageTitle();

  const navLinks = [
    { label: "Home", href: "/", active: pathname === "/" },
    { label: "Menu", href: "/menu", active: pathname.startsWith("/menu") },
  ];

  const targetDashboard =
    userRole === "admin" || userRole === "staf"
      ? "/dashboard"
      : "/user";

  const profileHref = !userSession
    ? `/masuk?ke=${encodeURIComponent(pathname)}`
    : targetDashboard;

  const handleProfileClick = (e) => {
    setIsExpanded(false);
    setDropdownAkunBuka(false);
    if (!userSession) {
      router.push(`/masuk?ke=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push(targetDashboard);
  };

  return (
    <nav
      aria-label="Dynamic Island Navbar"
      className="fixed z-50 left-1/2 -translate-x-1/2 top-3 sm:top-4 pointer-events-auto max-w-[calc(100vw-1.5rem)] will-change-transform"
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
        transition={{
          layout: { type: "spring", stiffness: 380, damping: 28, mass: 0.7 },
          opacity: { duration: 0.18 },
        }}
        className="bg-[#FFFDF9]/96 backdrop-blur-2xl border-2 border-[#C59B62]/85 text-[#3D2B28] shadow-[0_16px_45px_rgba(45,20,15,0.28),0_4px_14px_rgba(0,0,0,0.08)] rounded-full overflow-visible will-change-transform"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!isExpanded ? (
            <motion.button
              key="collapsed-island"
              type="button"
              onClick={() => setIsExpanded(true)}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 hover:bg-[#F8EFE4]/80 transition cursor-pointer select-none whitespace-nowrap"
              title="Buka menu navigasi"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8925A] shadow-[0_0_8px_#C59B62] animate-pulse shrink-0" />

              {labelBrand && (
                <>
                  <span className="font-coquette font-bold text-xs sm:text-sm tracking-wider text-[#3D2B28]">
                    {labelBrand}
                  </span>
                  <span className="text-[#C59B62] font-bold text-xs">·</span>
                </>
              )}

              <span className="font-serif font-extrabold text-xs sm:text-sm text-[#9E3B42]">
                {activeTitle}
              </span>

              {jumlahKeranjang > 0 && (
                <span className="ml-0.5 px-2 py-0.5 rounded-full bg-[#9E3B42] text-white text-[10px] font-extrabold tabular-nums shadow-xs flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5 shrink-0" />
                  <span>{jumlahKeranjang}</span>
                </span>
              )}

              <ChevronDown className="w-3.5 h-3.5 text-[#4A2E2B] shrink-0 ml-0.5" />
            </motion.button>
          ) : (
            <motion.div
              key="expanded-island"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap select-none"
            >
              <Link
                href="/"
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setIsExpanded(false);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#F5ECE2] transition font-coquette font-bold text-xs sm:text-sm tracking-widest text-[#3D2B28] shrink-0 whitespace-nowrap"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8925A] shadow-[0_0_8px_#C59B62] animate-pulse shrink-0" />
                {labelBrand && <span>{labelBrand}</span>}
              </Link>

              <div className="h-4 w-px bg-[#D9B37C]/60 shrink-0" />

              <div className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      if (link.label === "Home" && pathname === "/") {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setIsExpanded(false);
                        return;
                      }
                      if (link.active) setIsExpanded(false);
                    }}
                    className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
                      link.active
                        ? "bg-[#9E3B42] text-white font-bold shadow-sm"
                        : "text-[#3D2B28] hover:text-[#9E3B42] hover:bg-[#F5ECE2] font-semibold"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="h-4 w-px bg-[#D9B37C]/60 shrink-0" />

              <Link
                href="/pesan"
                onClick={() => {
                  if (pathname.startsWith("/pesan")) setIsExpanded(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(158,59,66,0.35)] border border-[#E8A5AC]/40 flex items-center gap-1.5 shrink-0 transition whitespace-nowrap ${
                  pathname.startsWith("/pesan")
                    ? "bg-[#7A2C32] text-white brightness-110"
                    : "bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-105 text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-blush shrink-0" />
                <span>Cake Studio</span>
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  href="/keranjang"
                  prefetch={false}
                  onClick={() => {
                    if (pathname.startsWith("/keranjang")) setIsExpanded(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border border-[#D9B37C]/60 shadow-xs shrink-0 whitespace-nowrap ${
                    pathname.startsWith("/keranjang")
                      ? "bg-[#9E3B42] text-white border-transparent"
                      : "bg-[#F5ECE2] hover:bg-[#EBDDD0] text-[#3D2B28]"
                  }`}
                  title="Keranjang Belanja"
                >
                  <ShoppingBag
                    className={`w-3.5 h-3.5 shrink-0 ${
                      pathname.startsWith("/keranjang") ? "text-white" : "text-[#B8925A]"
                    }`}
                  />
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums shadow-xs ${
                      pathname.startsWith("/keranjang")
                        ? "bg-white text-[#9E3B42]"
                        : "bg-[#9E3B42] text-white"
                    }`}
                  >
                    {jumlahKeranjang}
                  </span>
                </Link>

                {userSession ? (
                  <div className="relative shrink-0 flex items-center z-20 pointer-events-auto">
                    <Link
                      href={profileHref}
                      prefetch={false}
                      onClick={handleProfileClick}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#D9B37C]/80 shadow-xs flex items-center justify-center transition shrink-0 hover:scale-105 bg-[#f8e4d9] cursor-pointer"
                      title={userRole === "admin" || userRole === "staf" ? "Dashboard Toko" : "Dashboard Pelanggan"}
                    >
                      <svg
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full object-cover shrink-0 select-none pointer-events-none"
                      >
                        <rect width="100" height="100" fill="#f8e4d9" />
                        <path
                          d="M20 50 C15 30 30 10 50 10 C70 10 85 30 80 50 C85 65 75 75 75 75 C75 75 65 60 65 55 C35 55 25 75 25 75 C25 75 15 65 20 50 Z"
                          fill="#2d2226"
                        />
                        <path
                          d="M28 42 C28 65 38 78 50 78 C62 78 72 65 72 42 C72 25 28 25 28 42 Z"
                          fill="#ffdfd2"
                        />
                        <ellipse
                          cx="36"
                          cy="56"
                          rx="5"
                          ry="3"
                          fill="#ffb4a2"
                          opacity="0.8"
                        />
                        <ellipse
                          cx="64"
                          cy="56"
                          rx="5"
                          ry="3"
                          fill="#ffb4a2"
                          opacity="0.8"
                        />
                        <ellipse cx="40" cy="48" rx="3.5" ry="5.5" fill="#2d2226" />
                        <circle cx="41" cy="46" r="1.5" fill="#ffffff" />
                        <ellipse cx="60" cy="48" rx="3.5" ry="5.5" fill="#2d2226" />
                        <circle cx="61" cy="46" r="1.5" fill="#ffffff" />
                        <path
                          d="M47 62 Q50 65 53 62"
                          stroke="#b25d5d"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d="M25 35 C32 20 45 15 50 15 C55 15 68 20 75 35 C70 30 65 30 60 38 C55 28 48 26 42 36 C38 28 32 30 25 35 Z"
                          fill="#3a2e33"
                        />
                        <path
                          d="M38 25 L43 42 L47 28 L53 40 L56 26"
                          fill="#3a2e33"
                        />
                        <path
                          d="M25 88 C30 76 42 76 50 76 C58 76 70 76 75 88 L85 100 L15 100 Z"
                          fill="#ffffff"
                        />
                        <path d="M46 76 L50 85 L54 76 Z" fill="#2d2226" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownAkunBuka((v) => !v);
                      }}
                      className="w-4 h-7 flex items-center justify-center text-[#5A3B33] hover:text-[#9E3B42] transition cursor-pointer ml-0.5"
                      title="Pilihan Akun"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${dropdownAkunBuka ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownAkunBuka && (
                      <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#FFFDF9] border border-[#D9B37C]/60 shadow-[0_12px_30px_rgba(45,20,15,0.2)] py-1.5 z-50 text-xs font-semibold text-[#3D2B28]">
                        {userRole === "admin" || userRole === "staf" ? (
                          <Link
                            href="/dashboard"
                            onClick={() => {
                              setDropdownAkunBuka(false);
                              setIsExpanded(false);
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5ECE2] text-[#3D2B28] transition"
                          >
                            <User className="w-3.5 h-3.5 text-[#9E3B42]" />
                            <span>Panel Dashboard</span>
                          </Link>
                        ) : (
                          <>
                            <Link
                              href="/user"
                              onClick={() => {
                                setDropdownAkunBuka(false);
                                setIsExpanded(false);
                              }}
                              className="flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5ECE2] text-[#3D2B28] transition"
                            >
                              <User className="w-3.5 h-3.5 text-[#9E3B42]" />
                              <span>Akun Saya</span>
                            </Link>
                            <Link
                              href="/user?tab=pesanan"
                              onClick={() => {
                                setDropdownAkunBuka(false);
                                setIsExpanded(false);
                              }}
                              className="flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5ECE2] text-[#3D2B28] transition"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-[#9E3B42]" />
                              <span>Pesanan Saya</span>
                            </Link>
                          </>
                        )}
                        <div className="my-1 border-t border-[#D9B37C]/30" />
                        <button
                          type="button"
                          onClick={handleKeluar}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-50 text-rose-700 transition cursor-pointer text-left font-semibold"
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket text-xs text-rose-600" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={`/masuk?ke=${encodeURIComponent(pathname)}`}
                    onClick={() => setIsExpanded(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F5ECE2] hover:bg-[#EBDDD0] border border-[#D9B37C]/60 text-[#3D2B28] flex items-center justify-center transition shrink-0"
                    title="Masuk / Akun"
                  >
                    <User className="w-3.5 h-3.5 text-[#5A3B33]" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-6 h-6 rounded-full hover:bg-[#F5ECE2] text-[#4A2E2B] hover:text-[#9E3B42] flex items-center justify-center transition shrink-0 cursor-pointer"
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
