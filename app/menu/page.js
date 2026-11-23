"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { DessertsMenuView, MENU_ITEMS } from "@/components/patisserie/DessertsMenuView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { usePatisserieCart } from "@/lib/patisserieCart";
import { AnimatePresence, motion } from "motion/react";

export default function MenuPage() {
  const router = useRouter();
  const { totalQty } = usePatisserieCart();
  const [toastMsg, setToastMsg] = useState(null);
  const [menuItems, setMenuItems] = useState(MENU_ITEMS);

  useEffect(() => {
    async function muatProduk() {
      try {
        const res = await fetch("/api/produk");
        const json = await res.json();
        if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
          const aktif = json.data.filter((p) => p.aktif);
          if (aktif.length > 0) {
            const mapped = aktif.map((p, idx) => {
              const fallback =
                MENU_ITEMS.find(
                  (m) => m.nama.toLowerCase() === p.nama.toLowerCase()
                ) || MENU_ITEMS[idx % MENU_ITEMS.length] || {};

              let kategori = fallback.kategori || "tart";
              let kategoriLabel = fallback.kategoriLabel || "Kue Tart";
              const lowerNama = p.nama.toLowerCase();
              if (lowerNama.includes("cookie") || lowerNama.includes("kering")) {
                kategori = "cookies";
                kategoriLabel = "Cookies";
              } else if (
                lowerNama.includes("roti") ||
                lowerNama.includes("donut") ||
                lowerNama.includes("brioche")
              ) {
                kategori = "roti";
                kategoriLabel = "Roti Manis";
              } else if (lowerNama.includes("cupcake")) {
                kategori = "cupcake";
                kategoriLabel = "Cupcake";
              } else if (
                lowerNama.includes("ulang tahun") ||
                lowerNama.includes("ultah") ||
                lowerNama.includes("shortcake") ||
                lowerNama.includes("coquette") ||
                lowerNama.includes("red velvet")
              ) {
                kategori = "ultah";
                kategoriLabel = "Kue Ulang Tahun";
              }

              return {
                id: p.id,
                nama: p.nama,
                harga: p.harga,
                kategori,
                kategoriLabel,
                photo: p.fotoUrl || null,
                tipe: fallback.tipe || "cake-raspberry",
                ukuran: fallback.ukuran || "Whole Cake Ø16 cm · 6-8 Porsi",
                rating: fallback.rating || 4.9,
                terjual: fallback.terjual || 100,
                badge: fallback.badge,
                desc: p.deskripsi || fallback.desc || "",
                komposisi:
                  fallback.komposisi ||
                  p.deskripsi ||
                  "Bahan-bahan berkualitas pilihan",
              };
            });
            setMenuItems(mapped);
          }
        }
      } catch {}
    }
    muatProduk();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleAddToCart = async (item) => {
    try {
      const res = await fetch("/api/keranjang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis: "Siap",
          id_produk: item.id,
          jumlah: 1,
        }),
      });

      if (res.status === 401) {
        router.push("/masuk?redirect=/menu");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showToast(data.pesan || "Gagal menambahkan ke keranjang.");
        return;
      }

      window.dispatchEvent(new Event("cravely_cart_updated"));
      showToast(`Masuk keranjang: ${item.nama}`);
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    }
  };

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "toko" || view === "etalase") {
      router.push("/toko");
    } else if (view === "kasir" || view === "checkout") {
      router.push("/checkout");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4EE] text-ink selection:bg-blush selection:text-cherry pt-14 sm:pt-16 pb-16">
      <DynamicIslandNavbar showEntered={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
        <DessertsMenuView
          totalQty={totalQty}
          totalPrice={0}
          items={menuItems}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
        />
      </main>

      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => router.push("/")}
      />

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

      <PipingBagCursor />
    </div>
  );
}
