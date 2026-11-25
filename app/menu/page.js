"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { DessertsMenuView } from "@/components/patisserie/DessertsMenuView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { AnimatePresence, motion } from "motion/react";

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [toastMsg, setToastMsg] = useState(null);
  const [daftarProduk, setDaftarProduk] = useState([]);
  const [daftarKategori, setDaftarKategori] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [errorMemuat, setErrorMemuat] = useState(null);

  async function muatData() {
    setSedangMemuat(true);
    setErrorMemuat(null);
    try {
      const [resProd, resKat] = await Promise.all([
        fetch("/api/produk"),
        fetch("/api/kategori-produk"),
      ]);

      const jsonProd = await resProd.json();
      const jsonKat = await resKat.json();

      if (!resProd.ok) {
        throw new Error(jsonProd.pesan || "Gagal memuat katalog produk");
      }

      const rawItems = Array.isArray(jsonProd.data) ? jsonProd.data : [];
      const aktifOnly = rawItems.filter((p) => p.aktif !== false);

      const mapped = aktifOnly.map((p) => ({
        id: p.id,
        nama: p.nama,
        harga: p.harga,
        id_kategori: p.id_kategori || null,
        kategori: p.kategori || "Kue Spesial",
        kategoriLabel: p.kategori || "Kue Spesial",
        photo: p.fotoUrl || null,
        label_teks: p.label_teks || "",
        desc: p.deskripsi || "",
        dibuat_pada: p.dibuat_pada,
      }));

      setDaftarProduk(mapped);

      if (resKat.ok && Array.isArray(jsonKat.data)) {
        setDaftarKategori(jsonKat.data);
      }
    } catch (err) {
      setErrorMemuat(err.message || "Gagal memuat menu kue.");
    } finally {
      setSedangMemuat(false);
    }
  }

  useEffect(() => {
    muatData();
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
          jenis: "Katalog",
          id_produk: item.id,
          jumlah: 1,
        }),
      });

      if (res.status === 401) {
        const currentUrl =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/menu";
        router.push(`/masuk?ke=${encodeURIComponent(currentUrl)}`);
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
      router.push("/#toko");
    } else if (view === "kasir" || view === "checkout") {
      router.push("/keranjang");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
        <DessertsMenuView
          initialSelectedId={initialId}
          items={daftarProduk}
          kategoriList={daftarKategori}
          sedangMemuat={sedangMemuat}
          errorMemuat={errorMemuat}
          onCobaLagi={muatData}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
        />
      </main>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-24 right-5 z-[90] bg-[#3D2B28] text-[#FFFDF9] border border-[#C59B62] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function MenuPage() {
  const router = useRouter();

  const handleFooterNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "toko") {
      router.push("/#toko");
    } else if (view === "kasir") {
      router.push("/keranjang");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EE] text-ink selection:bg-blush selection:text-cherry pt-14 sm:pt-16">
      <DynamicIslandNavbar showEntered={true} />

      <main className="flex-1 w-full">
        <Suspense
          fallback={
            <div
              className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center"
              role="status"
              aria-label="Memuat"
            >
              <div className="w-10 h-10 rounded-full border-[3px] border-[#EADCC8] border-t-[#9E3B42] animate-spin" />
            </div>
          }
        >
          <MenuContent />
        </Suspense>
      </main>

      <PatisserieFooter
        onNavigate={handleFooterNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => router.push("/")}
      />

      <PipingBagCursor />
    </div>
  );
}
