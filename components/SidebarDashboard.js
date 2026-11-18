"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function SidebarDashboard({ profil, namaToko }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuTerbuka, setMenuTerbuka] = useState(false);

  const isAdmin = profil?.role === "admin";

  const daftarMenu = [
    {
      nama: "Dashboard",
      href: "/dashboard",
      ikon: "fa-solid fa-gauge",
      persis: true,
    },
    ...(isAdmin
      ? [
          {
            nama: "Harga & Opsi",
            href: "/dashboard/harga-opsi",
            ikon: "fa-solid fa-tags",
            persis: false,
          },
        ]
      : []),
    {
      nama: "Pesanan",
      href: "/dashboard/pesanan",
      ikon: "fa-solid fa-bag-shopping",
      persis: false,
    },
    {
      nama: "Stok",
      href: "/dashboard/stok",
      ikon: "fa-solid fa-boxes-stacked",
      persis: false,
    },
    ...(isAdmin
      ? [
          {
            nama: "Laporan",
            href: "/dashboard/laporan",
            ikon: "fa-solid fa-chart-line",
            persis: false,
          },
          {
            nama: "Pengaturan",
            href: "/dashboard/pengaturan",
            ikon: "fa-solid fa-gear",
            persis: false,
          },
          {
            nama: "Akun",
            href: "/dashboard/akun",
            ikon: "fa-solid fa-users",
            persis: false,
          },
        ]
      : []),
  ];

  async function handleKeluar() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  }

  function cekAktif(item) {
    if (item.persis) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  return (
    <>
      <div className="md:hidden bg-stone-900 text-stone-300 p-4 flex items-center justify-between border-b border-stone-800 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <i className="fa-solid fa-cake-candles text-rose-500 text-xl"></i>
          <span className="font-bold text-white text-base">
            {namaToko || "Toko Kue"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMenuTerbuka(!menuTerbuka)}
          className="p-2 rounded-xl bg-stone-800 text-stone-200 hover:text-white"
        >
          <i
            className={`fa-solid ${menuTerbuka ? "fa-xmark" : "fa-bars"} text-lg`}
          ></i>
        </button>
      </div>

      <aside
        className={`${
          menuTerbuka ? "block" : "hidden"
        } md:block md:w-64 bg-stone-900 text-stone-300 flex-shrink-0 md:min-h-screen border-r border-stone-800 z-30`}
      >
        <div className="p-6 flex flex-col h-full justify-between">
          <div>
            <div className="hidden md:flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-500 flex items-center justify-center text-xl">
                <i className="fa-solid fa-cake-candles"></i>
              </div>
              <div>
                <h2 className="font-extrabold text-white text-base leading-tight">
                  {namaToko || "Toko Kue"}
                </h2>
                <span className="text-xs text-stone-400">Panel Manajemen</span>
              </div>
            </div>

            <div className="bg-stone-800/80 rounded-2xl p-3 mb-6 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                {(profil?.nama || "U")[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {profil?.nama || "Pengguna"}
                </p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
                  {profil?.role === "admin" ? "Admin" : "Staf Produksi"}
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {daftarMenu.map((item) => {
                const aktif = cekAktif(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuTerbuka(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                      aktif
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <i className={`${item.ikon} w-5 text-center`}></i>
                    <span>{item.nama}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 mt-6 border-t border-stone-800">
            <button
              type="button"
              onClick={handleKeluar}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-400 hover:bg-rose-950/40 hover:text-rose-400 transition cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center"></i>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
