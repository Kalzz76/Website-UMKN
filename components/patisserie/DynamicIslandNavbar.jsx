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

export function DynamicIslandNavbar({ showEntered = true }) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalQty } = usePatisserieCart();
  const [userSession, setUserSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const leaveTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
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
    }, 380);
  };

  const getPageTitle = () => {
    if (pathname.startsWith("/toko")) return "Toko";
    if (pathname.startsWith("/menu")) return "Menu";
    if (pathname.startsWith("/pesan")) return "Cake Studio";
    if (pathname.startsWith("/kasir")) return "Kasir";
    if (
      pathname.startsWith("/profil") ||
      pathname.startsWith("/dashboard/profil") ||
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
    { label: "Toko", href: "/toko", active: pathname.startsWith("/toko") },
    { label: "Menu", href: "/menu", active: pathname.startsWith("/menu") },
  ];

  const profileHref = !userSession
    ? "/masuk"
    : userRole === "admin" || userRole === "staf"
    ? "/dashboard/profil"
    : "/profil";

  const handleProfileClick = async (e) => {
    setIsExpanded(false);
    if (!userSession) return;
    if (userRole === "admin" || userRole === "staf") {
      return;
    }
    if (userRole === "pelanggan") {
      return;
    }
    e.preventDefault();
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabaseBrowser");
      const supabase = getSupabaseBrowser();
      const { data: profil } = await supabase
        .from("profil")
        .select("nama, role")
        .eq("id", userSession.user.id)
        .maybeSingle();
      const role = profil?.role || "pelanggan";
      setUserRole(role);
      if (profil?.nama) setUserName(profil.nama);
      if (role === "admin" || role === "staf") {
        router.push("/dashboard/profil");
      } else {
        router.push("/profil");
      }
    } catch {
      router.push("/profil");
    }
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
        className="bg-[#FFFDF9]/96 backdrop-blur-2xl border-2 border-[#C59B62]/85 text-[#3D2B28] shadow-[0_16px_45px_rgba(45,20,15,0.28),0_4px_14px_rgba(0,0,0,0.08)] rounded-full overflow-hidden will-change-transform"
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

              <span className="font-coquette font-bold text-xs sm:text-sm tracking-wider text-[#3D2B28]">
                Cravely
              </span>

              <span className="text-[#C59B62] font-bold text-xs">·</span>

              <span className="font-serif font-extrabold text-xs sm:text-sm text-[#9E3B42]">
                {activeTitle}
              </span>

              {totalQty > 0 && (
                <span className="ml-0.5 px-2 py-0.5 rounded-full bg-[#9E3B42] text-white text-[10px] font-extrabold tabular-nums shadow-xs flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5 shrink-0" />
                  <span>{totalQty}</span>
                </span>
              )}

              <ChevronDown className="w-3.5 h-3.5 text-[#8C6D62] shrink-0 ml-0.5" />
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
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#F5ECE2] transition font-coquette font-bold text-xs sm:text-sm tracking-widest text-[#3D2B28] shrink-0 whitespace-nowrap"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8925A] shadow-[0_0_8px_#C59B62] animate-pulse shrink-0" />
                <span>Cravely</span>
              </Link>

              <div className="h-4 w-px bg-[#D9B37C]/60 shrink-0" />

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

              <div className="h-4 w-px bg-[#D9B37C]/60 shrink-0" />

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

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

                {userSession ? (
                  <Link
                    href={profileHref}
                    onClick={handleProfileClick}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#D9B37C]/80 shadow-xs flex items-center justify-center transition shrink-0 hover:scale-105 bg-[#f8e4d9]"
                    title="Profil Saya"
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

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-6 h-6 rounded-full hover:bg-[#F5ECE2] text-[#8C6D62] hover:text-[#3D2B28] flex items-center justify-center transition shrink-0 cursor-pointer"
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
