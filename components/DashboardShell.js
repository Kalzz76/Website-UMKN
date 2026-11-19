"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import PortalLedge from "@/components/PortalLedge";

export default function DashboardShell({
  profil,
  namaToko = "Cravely",
  notifPesananCount = 0,
  notifStokCount = 0,
  children,
}) {
  const [sidebarBuka, setSidebarBuka] = useState(false);
  const [dropdownBuka, setDropdownBuka] = useState(false);
  const [notifDropdownBuka, setNotifDropdownBuka] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const role = profil?.role || "staf";
  const userName = profil?.nama || "Admin";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cravely_sidebar_open");
      if (saved === "1") {
        setSidebarBuka(true);
      }
    } catch (e) {}
  }, []);

  function handleToggleSidebar() {
    const nextState = !sidebarBuka;
    setSidebarBuka(nextState);
    try {
      localStorage.setItem("cravely_sidebar_open", nextState ? "1" : "0");
    } catch (e) {}

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 360);
  }

  const menuAdmin = [
    {
      nama: "Dashboard",
      href: "/dashboard",
      ikon: (
        <svg viewBox="0 0 24 24">
          <rect className="f" x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect
            className="f"
            x="13.5"
            y="3.5"
            width="7"
            height="7"
            rx="3.5"
            opacity=".55"
          />
          <rect
            className="f"
            x="3.5"
            y="13.5"
            width="7"
            height="7"
            rx="3.5"
            opacity=".55"
          />
          <rect className="f" x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
      ),
    },
    {
      nama: "Harga & Opsi",
      href: "/dashboard/harga-opsi",
      ikon: (
        <svg viewBox="0 0 24 24">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle className="f" cx="7" cy="7" r="1.5" />
        </svg>
      ),
    },
    {
      nama: "Pesanan",
      href: "/dashboard/pesanan",
      badge: notifPesananCount > 0 ? String(notifPesananCount) : null,
      ikon: (
        <svg viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      nama: "Stok",
      href: "/dashboard/stok",
      dot: notifStokCount > 0 ? "orange" : null,
      ikon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      nama: "Laporan",
      href: "/dashboard/laporan",
      ikon: (
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      nama: "Pengaturan",
      href: "/dashboard/pengaturan",
      ikon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      nama: "Akun",
      href: "/dashboard/akun",
      ikon: (
        <svg viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  const menuStaf = [
    {
      nama: "Dashboard",
      href: "/dashboard",
      ikon: (
        <svg viewBox="0 0 24 24">
          <rect className="f" x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect
            className="f"
            x="13.5"
            y="3.5"
            width="7"
            height="7"
            rx="3.5"
            opacity=".55"
          />
          <rect
            className="f"
            x="3.5"
            y="13.5"
            width="7"
            height="7"
            rx="3.5"
            opacity=".55"
          />
          <rect className="f" x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
      ),
    },
    {
      nama: "Pesanan",
      href: "/dashboard/pesanan",
      ikon: (
        <svg viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      nama: "Stok",
      href: "/dashboard/stok",
      dot: notifStokCount > 0 ? "orange" : null,
      ikon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
  ];

  const listMenu = role === "admin" ? menuAdmin : menuStaf;

  let infoHalaman = {
    judul: "Dashboard",
    subjudul: `Selamat datang, ${userName} • Ringkasan performa penjualan Cravely Bakery.`,
  };
  if (pathname.startsWith("/dashboard/harga-opsi")) {
    infoHalaman = {
      judul: "Harga & Opsi",
      subjudul: "Kelola grup opsi kue dan daftar harga kustomisasi.",
    };
  } else if (pathname.startsWith("/dashboard/pesanan/")) {
    infoHalaman = {
      judul: "Detail Pesanan",
      subjudul: "Informasi lengkap rincian dan progres pesanan pelanggan.",
    };
  } else if (pathname.startsWith("/dashboard/pesanan")) {
    infoHalaman = {
      judul: "Daftar Pesanan",
      subjudul: "Kelola semua pesanan pelanggan dan status pembayaran.",
    };
  } else if (pathname.startsWith("/dashboard/stok")) {
    infoHalaman = {
      judul: "Stok Bahan",
      subjudul: "Pantau ketersediaan bahan pembuatan kue dan fisik dapur.",
    };
  } else if (pathname.startsWith("/dashboard/laporan")) {
    infoHalaman = {
      judul: "Laporan Penjualan",
      subjudul: "Analisis omzet kas masuk, statistik pesanan, dan pembukuan.",
    };
  } else if (pathname.startsWith("/dashboard/pengaturan")) {
    infoHalaman = {
      judul: "Pengaturan Toko",
      subjudul: "Atur informasi toko, jam kerja, dan kebijakan pembayaran.",
    };
  } else if (pathname.startsWith("/dashboard/akun")) {
    infoHalaman = {
      judul: "Kelola Akun",
      subjudul: "Atur hak akses staf produksi dan administrator toko.",
    };
  }

  const totalNotif = notifPesananCount + notifStokCount;

  async function handleLogout() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  }

  return (
    <div className="dashboard-layout-root">
      {sidebarBuka && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarBuka(false)}
        />
      )}

      <aside className={`sidebar ${sidebarBuka ? "open" : ""}`} id="sidebar">
        <div className="bg">
          <div className="r t">
            <i className="fill"></i>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0H12C66 0 97 28 97 100H0Z" />
            </svg>
          </div>
          <div className="r m">
            <i className="fill"></i>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0H97Q101 50 97 100H0Z" />
            </svg>
          </div>
          <div className="r b">
            <i className="fill"></i>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0H12C66 0 97 28 97 100H0Z" />
            </svg>
          </div>
        </div>

        <div className="body">
          <button
            type="button"
            className="toggle"
            id="toggle"
            aria-label="Buka/tutup sidebar"
            onClick={handleToggleSidebar}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="brand">
            <div className="logo">
              <img
                src="/assets/images/Icon.png"
                alt="Cravely"
                className="logo-img"
              />
            </div>
            <div className="brand-text">
              <strong>Cravely</strong>
              <small>Bakery</small>
            </div>
          </div>

          <nav>
            {listMenu.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`item ${isActive ? "active" : ""}`}
                  data-tip={item.nama}
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.innerWidth <= 640
                    ) {
                      setSidebarBuka(false);
                    }
                  }}
                >
                  {item.ikon}
                  <span className="label">{item.nama}</span>
                  {item.badge && <i className="badge">{item.badge}</i>}
                  {item.dot && <i className={`dot ${item.dot}`}></i>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main
        className={`dashboard-container ${sidebarBuka ? "sidebar-open" : ""}`}
      >
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-title-wrap">
              <h1 className="header-page-title">{infoHalaman.judul}</h1>
              <p className="header-page-subtitle">{infoHalaman.subjudul}</p>
            </div>
          </div>

          <div className="topbar-user-area">
            <div className="notif-dropdown-wrapper">
              <button
                type="button"
                className="btn-bell-notif"
                title="Notifikasi"
                onClick={() => {
                  setNotifDropdownBuka(!notifDropdownBuka);
                  setDropdownBuka(false);
                }}
              >
                <i className="fa-regular fa-bell"></i>
                {totalNotif > 0 && (
                  <span className="badge-notif-num">{totalNotif}</span>
                )}
              </button>

              {notifDropdownBuka && (
                <div className="notif-dropdown-menu">
                  {totalNotif === 0 ? (
                    <div className="notif-empty-state">
                      Tidak ada notifikasi baru
                    </div>
                  ) : (
                    <>
                      {role === "admin" && notifPesananCount > 0 && (
                        <Link
                          href="/dashboard/pesanan"
                          className="notif-dropdown-item"
                          onClick={() => setNotifDropdownBuka(false)}
                        >
                          <i className="fa-solid fa-receipt"></i>
                          <span>
                            {notifPesananCount} pembayaran menunggu konfirmasi
                          </span>
                        </Link>
                      )}
                      {notifStokCount > 0 && (
                        <Link
                          href="/dashboard/stok"
                          className="notif-dropdown-item"
                          onClick={() => setNotifDropdownBuka(false)}
                        >
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>{notifStokCount} bahan stok menipis</span>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="profile-dropdown-wrapper">
              <button
                type="button"
                className="user-profile-btn"
                onClick={() => {
                  setDropdownBuka(!dropdownBuka);
                  setNotifDropdownBuka(false);
                }}
              >
                <svg
                  className="avatar-anime-svg"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
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
                <div className="profile-meta-col">
                  <span className="profile-user-name">
                    {profil?.nama || "Pengguna"}
                  </span>
                  <span className="profile-user-role">
                    {profil?.role || "Staf"}
                  </span>
                </div>
                <i className="fa-solid fa-chevron-down"></i>
              </button>

              {dropdownBuka && (
                <div className="profile-dropdown-menu">
                  <button
                    type="button"
                    className="profile-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {children}
      </main>

      <PortalLedge />
    </div>
  );
}
