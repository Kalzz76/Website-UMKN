"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { KasirView } from "@/components/patisserie/KasirView";

export default function KeranjangPage() {
  const router = useRouter();
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [keranjang, setKeranjang] = useState([]);
  const [ringkasan, setRingkasan] = useState({
    subtotal_custom: 0,
    subtotal_katalog: 0,
    total_kue: 0,
  });
  const [pesanError, setPesanError] = useState("");

  async function muatKeranjang() {
    setPesanError("");
    try {
      const res = await fetch("/api/keranjang", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/masuk?ke=/keranjang");
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.pesan || "Gagal memuat keranjang.");
      }
      const data = await res.json();
      setKeranjang(data.keranjang || []);
      if (data.ringkasan) {
        setRingkasan(data.ringkasan);
      }
    } catch (err) {
      setPesanError(err.message || "Terjadi kesalahan saat memuat keranjang.");
    } finally {
      setSedangMemuat(false);
    }
  }

  useEffect(() => {
    muatKeranjang();
  }, []);

  async function ubahJumlah(item, jumlahBaru) {
    if (jumlahBaru < 1 || jumlahBaru > 20) return;
    try {
      const res = await fetch("/api/keranjang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, jumlah: jumlahBaru }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cravely_cart_updated"));
        await muatKeranjang();
      } else {
        const json = await res.json();
        alert(json.pesan || "Gagal memperbarui jumlah.");
      }
    } catch {
      alert("Gangguan koneksi saat memperbarui jumlah.");
    }
  }

  async function hapusItem(id) {
    try {
      const res = await fetch(`/api/keranjang?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cravely_cart_updated"));
        await muatKeranjang();
      } else {
        const json = await res.json();
        alert(json.pesan || "Gagal menghapus item.");
      }
    } catch {
      alert("Gangguan koneksi saat menghapus item.");
    }
  }

  async function hapusYangTidakTersedia() {
    const listHapus = keranjang.filter((it) => it.tersedia === false);
    if (listHapus.length === 0) return;

    setSedangMemuat(true);
    try {
      for (let i = 0; i < listHapus.length; i++) {
        await fetch(`/api/keranjang?id=${listHapus[i].id}`, {
          method: "DELETE",
        });
      }
      window.dispatchEvent(new Event("cravely_cart_updated"));
      await muatKeranjang();
    } catch {
      alert("Gagal menghapus beberapa item yang tidak tersedia.");
      setSedangMemuat(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4ED] text-[#4A2E2B] selection:bg-[#F3C5CD] selection:text-[#7D2330] pt-14 sm:pt-16">
      <DynamicIslandNavbar showEntered={true} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <KasirView
          keranjang={keranjang}
          ringkasan={ringkasan}
          sedangMemuat={sedangMemuat}
          pesanError={pesanError}
          onRefresh={muatKeranjang}
          onUbahJumlah={ubahJumlah}
          onHapusItem={hapusItem}
          onHapusTidakTersedia={hapusYangTidakTersedia}
        />
      </main>

      <PatisserieFooter />
      <PipingBagCursor />
    </div>
  );
}
