"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { KasirView } from "@/components/patisserie/KasirView";

function hitungRingkasanLokal(list, prevRingkasan) {
  let subtotal_custom = 0;
  let subtotal_katalog = 0;
  for (const it of list) {
    const sub = Number(it.subtotal ?? (Number(it.harga_satuan || 0) * Number(it.jumlah || 1)));
    if (it.jenis === "Custom") {
      subtotal_custom += sub;
    } else {
      subtotal_katalog += sub;
    }
  }
  return {
    ...prevRingkasan,
    subtotal_custom,
    subtotal_katalog,
    total_kue: subtotal_custom + subtotal_katalog,
  };
}

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
  const [itemAkanDihapus, setItemAkanDihapus] = useState(null);
  const [toast, setToast] = useState(null);

  function tampilkanToast(pesan, tipe = "sukses") {
    setToast({ pesan, tipe });
    setTimeout(() => {
      setToast((prev) => (prev?.pesan === pesan ? null : prev));
    }, 3000);
  }

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

    const snapshotKeranjang = keranjang;
    const snapshotRingkasan = ringkasan;

    const keranjangBaru = keranjang.map((it) => {
      if (it.id !== item.id) return it;
      const hargaSatuan = Number(it.harga_satuan ?? (Number(it.subtotal || 0) / Math.max(1, Number(it.jumlah || 1))));
      return {
        ...it,
        jumlah: jumlahBaru,
        subtotal: hargaSatuan * jumlahBaru,
      };
    });

    setKeranjang(keranjangBaru);
    setRingkasan((prev) => hitungRingkasanLokal(keranjangBaru, prev));

    try {
      const res = await fetch("/api/keranjang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, jumlah: jumlahBaru }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cravely_cart_updated"));
      } else {
        const json = await res.json();
        setKeranjang(snapshotKeranjang);
        setRingkasan(snapshotRingkasan);
        tampilkanToast(json.pesan || "Gagal memperbarui jumlah.", "error");
      }
    } catch {
      setKeranjang(snapshotKeranjang);
      setRingkasan(snapshotRingkasan);
      tampilkanToast("Gangguan koneksi saat memperbarui jumlah.", "error");
    }
  }

  function mintaKonfirmasiHapus(id) {
    const target = keranjang.find((it) => it.id === id);
    if (!target) return;
    setItemAkanDihapus(target);
  }

  async function jalankanHapusItem() {
    if (!itemAkanDihapus) return;
    const target = itemAkanDihapus;
    const namaItem = target.nama || (target.jenis === "Custom" ? "Kue Custom 3D" : "Produk");
    setItemAkanDihapus(null);

    const snapshotKeranjang = keranjang;
    const snapshotRingkasan = ringkasan;

    const keranjangBaru = keranjang.filter((it) => it.id !== target.id);
    setKeranjang(keranjangBaru);
    setRingkasan((prev) => hitungRingkasanLokal(keranjangBaru, prev));
    tampilkanToast(`"${namaItem}" dihapus dari keranjang.`);

    try {
      const res = await fetch(`/api/keranjang?id=${target.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cravely_cart_updated"));
      } else {
        const json = await res.json();
        setKeranjang(snapshotKeranjang);
        setRingkasan(snapshotRingkasan);
        tampilkanToast(json.pesan || "Gagal menghapus item.", "error");
      }
    } catch {
      setKeranjang(snapshotKeranjang);
      setRingkasan(snapshotRingkasan);
      tampilkanToast("Gangguan koneksi saat menghapus item.", "error");
    }
  }

  async function hapusYangTidakTersedia() {
    const listHapus = keranjang.filter((it) => it.tersedia === false);
    if (listHapus.length === 0) return;

    const snapshotKeranjang = keranjang;
    const snapshotRingkasan = ringkasan;
    const idHapusSet = new Set(listHapus.map((it) => it.id));
    const keranjangBaru = keranjang.filter((it) => !idHapusSet.has(it.id));

    setKeranjang(keranjangBaru);
    setRingkasan((prev) => hitungRingkasanLokal(keranjangBaru, prev));
    tampilkanToast(`${listHapus.length} produk tidak tersedia telah dihapus.`);

    try {
      await Promise.all(
        listHapus.map((it) => fetch(`/api/keranjang?id=${it.id}`, { method: "DELETE" }))
      );
      window.dispatchEvent(new Event("cravely_cart_updated"));
    } catch {
      setKeranjang(snapshotKeranjang);
      setRingkasan(snapshotRingkasan);
      tampilkanToast("Gagal menghapus beberapa item yang tidak tersedia.", "error");
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
          onHapusItem={mintaKonfirmasiHapus}
          onHapusTidakTersedia={hapusYangTidakTersedia}
          onNotify={(msg) => tampilkanToast(msg)}
        />
      </main>

      {itemAkanDihapus && (
        <div className="fixed inset-0 z-[120] bg-[#2D1E1B]/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FFFDF9] border border-[#EADCC8] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-[#9E3B42] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-trash-can text-sm" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2D1E1B]">
                  Hapus Produk dari Keranjang?
                </h3>
                <p className="text-xs text-[#6B5249] mt-1 leading-relaxed">
                  Produk{" "}
                  <strong className="text-[#2D1E1B]">
                    {itemAkanDihapus.nama || (itemAkanDihapus.jenis === "Custom" ? "Kue Custom 3D" : "ini")}
                  </strong>{" "}
                  akan dihapus dari daftar keranjang belanja Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemAkanDihapus(null)}
                className="px-4 py-2 rounded-full border border-[#DFCBB0] bg-white hover:bg-[#FAF4ED] text-xs font-bold text-[#3D2B28] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={jalankanHapusItem}
                className="px-4 py-2 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[130] px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            toast.tipe === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-[#3D2B28] border-[#C59B62]/50 text-[#FFFDF9]"
          }`}
        >
          <i
            className={`fa-solid ${
              toast.tipe === "error"
                ? "fa-circle-exclamation text-rose-600"
                : "fa-circle-check text-[#E5BF88]"
            }`}
          />
          <span>{toast.pesan}</span>
        </div>
      )}

      <PatisserieFooter />
      <PipingBagCursor />
    </div>
  );
}
