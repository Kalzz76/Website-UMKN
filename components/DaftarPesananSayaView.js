"use client";

import { useState } from "react";
import Link from "next/link";
import TombolKeluar from "@/components/TombolKeluar";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/BadgeStatus";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";

export default function DaftarPesananSayaView({
  pesananList = [],
  namaToko = "",
}) {
  const [filter, setFilter] = useState("Semua");
  const [kataCari, setKataCari] = useState("");

  const tersaring = pesananList.filter((p) => {
    if (filter === "Aktif") {
      if (p.status_pesanan === "Selesai" || p.status_pesanan === "Dibatalkan") {
        return false;
      }
    } else if (filter === "Selesai") {
      if (p.status_pesanan !== "Selesai") return false;
    } else if (filter === "Dibatalkan") {
      if (p.status_pesanan !== "Dibatalkan") return false;
    }

    if (kataCari.trim()) {
      const q = kataCari.trim().toLowerCase();
      const kode = (p.kode_pesanan || "").toLowerCase();
      const isi = (p.isi_singkat || "").toLowerCase();
      if (!kode.includes(q) && !isi.includes(q)) return false;
    }

    return true;
  });

  function getJadwalTeks(p) {
    if (p.metode_pengiriman === "Ambil") {
      const tgl = p.tanggal_ambil ? formatTanggalIndonesia(p.tanggal_ambil) : "-";
      const jam = p.jam_ambil ? `pukul ${p.jam_ambil.slice(0, 5)} WIB` : "";
      return `Ambil di Toko: ${tgl} ${jam}`.trim();
    }
    const tglPasti = p.tanggal_pasti_kirim ? formatTanggalIndonesia(p.tanggal_pasti_kirim) : null;
    const estAwal = p.estimasi_kirim_awal ? formatTanggalIndonesia(p.estimasi_kirim_awal) : null;
    const estAkhir = p.estimasi_kirim_akhir ? formatTanggalIndonesia(p.estimasi_kirim_akhir) : null;
    if (tglPasti) {
      return `Pengantaran: ${tglPasti}`;
    }
    if (estAwal && estAkhir) {
      return `Estimasi Tiba: ${estAwal} – ${estAkhir}`;
    }
    if (estAwal) {
      return `Estimasi Tiba: ${estAwal}`;
    }
    return "Pengantaran: Menunggu konfirmasi jadwal";
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#3D2B28]">
      <header className="bg-white border-b border-[#E8DFD8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/akun"
              className="w-10 h-10 rounded-2xl bg-[#FAF2E8] text-[#9E3B42] border border-[#E8DFD8] flex items-center justify-center text-lg hover:bg-[#F5ECE2] transition shadow-xs"
              title="Kembali ke Akun Saya"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-xl text-[#3D2B28] leading-tight">
                Pesanan Saya
              </h1>
              <p className="text-xs text-stone-500">
                Riwayat dan tiket pesanan digital Anda {namaToko ? `• ${namaToko}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/akun"
              className="text-xs font-bold px-3.5 py-2 rounded-full border border-[#D9B37C]/60 bg-[#FAF2E8] text-[#5A3B33] hover:bg-[#F5ECE2] transition inline-flex items-center gap-1.5"
            >
              <i className="fa-solid fa-user-circle text-[#9E3B42]"></i>
              <span className="hidden sm:inline">Akun Saya</span>
            </Link>
            <TombolKeluar />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {["Semua", "Aktif", "Selesai", "Dibatalkan"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer ${
                  filter === f
                    ? "bg-[#9E3B42] text-white shadow-xs"
                    : "bg-white border border-[#E8DFD8] text-stone-600 hover:bg-[#FAF2E8]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
            <input
              type="text"
              value={kataCari}
              onChange={(e) => setKataCari(e.target.value)}
              placeholder="Cari kode atau nama kue..."
              className="w-full h-[38px] pl-9 pr-4 rounded-xl border border-[#D9B37C]/60 bg-white outline-none focus:border-[#9E3B42] text-xs font-medium text-[#3D2B28]"
            />
          </div>
        </div>

        {tersaring.length === 0 ? (
          <div className="p-10 sm:p-14 rounded-3xl bg-white border border-[#E8DFD8] text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF2E8] border border-[#E8DFD8] text-[#9E3B42] mx-auto flex items-center justify-center text-2xl shadow-xs">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#3D2B28]">
              Belum ada pesanan
            </h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              {filter !== "Semua" || kataCari
                ? "Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian."
                : "Anda belum memiliki riwayat pesanan. Mulai jelajahi kreasi kue lezat kami atau buat custom cake unik Anda sekarang."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/menu"
                className="px-5 py-2.5 rounded-full bg-[#9E3B42] hover:bg-[#872f36] text-white text-xs font-bold shadow-sm transition"
              >
                Katalog Menu
              </Link>
              <Link
                href="/pesan"
                className="px-5 py-2.5 rounded-full bg-[#FAF2E8] hover:bg-[#F5ECE2] text-[#5A3B33] border border-[#D9B37C]/60 text-xs font-bold transition"
              >
                Cake Studio 3D
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tersaring.map((p) => {
              const total = Number(p.total_bayar || 0);
              const terbayar = Number(p.jumlah_terbayar || 0);
              const sisa = Math.max(0, total - terbayar);
              const butuhBayar = (p.status_pesanan === "Menunggu Pembayaran" || sisa > 0) && p.status_pesanan !== "Dibatalkan";

              return (
                <div
                  key={p.id}
                  className="rounded-3xl bg-white border border-[#E8DFD8] p-5 sm:p-6 space-y-4 shadow-xs hover:border-[#D9B37C] transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FAF2E8] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm sm:text-base font-black text-[#9E3B42]">
                        #{p.kode_pesanan}
                      </span>
                      <span className="text-xs text-stone-400">
                        {p.dibuat_pada ? formatTanggalIndonesia(p.dibuat_pada.slice(0, 10)) : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <BadgeStatusPesanan status={p.status_pesanan} />
                      <BadgeStatusBayar status={p.status_bayar} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-7 space-y-2">
                      <div>
                        <span className="text-[11px] font-bold text-stone-400 block">
                          ISI PESANAN
                        </span>
                        <p className="text-sm font-bold text-[#3D2B28] leading-relaxed">
                          {p.isi_singkat}
                        </p>
                      </div>

                      <div className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                        <i className="fa-solid fa-calendar-check text-[#9E3B42] text-xs"></i>
                        <span>{getJadwalTeks(p)}</span>
                      </div>
                    </div>

                    <div className="md:col-span-5 md:text-right space-y-1 border-t md:border-t-0 border-[#FAF2E8] pt-2 md:pt-0">
                      <div>
                        <span className="text-xs text-stone-500">Total: </span>
                        <span className="text-sm font-bold text-[#3D2B28] lining-nums">
                          {formatRupiah(total)}
                        </span>
                      </div>
                      {sisa > 0 && p.status_pesanan !== "Dibatalkan" && (
                        <div>
                          <span className="text-xs text-amber-700 font-bold">
                            Sisa: <span className="lining-nums">{formatRupiah(sisa)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#FAF2E8]">
                    <Link
                      href={`/pesanan-saya/${p.kode_pesanan}`}
                      className="px-4 py-2 rounded-xl border border-[#D9B37C]/60 bg-white hover:bg-[#FAF2E8] text-[#5A3B33] text-xs font-bold transition"
                    >
                      Lihat Tiket
                    </Link>

                    {butuhBayar && (
                      <Link
                        href={`/pesanan-saya/${p.kode_pesanan}?bayar=1`}
                        className="px-4 py-2 rounded-xl bg-[#9E3B42] hover:bg-[#872f36] text-white text-xs font-bold shadow-xs transition"
                      >
                        Bayar Sekarang
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
