"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Copy,
  Check,
  Clock,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Repeat,
} from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/format";
import RootLoading from "@/app/loading";
import { DynamicIslandNavbar } from "./DynamicIslandNavbar";
import { BotanicalTopLeft, BotanicalTopRight } from "./BotanicalBranchDecor";
import { LangkahCheckout, PilihMetodeBayar, OPSI_METODE } from "./LangkahCheckout";

const IS_SANDBOX = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION !== "true";

const INSTRUKSI = {
  qris: [
    "Buka aplikasi e-wallet atau m-banking yang mendukung QRIS.",
    "Pilih menu Scan / Bayar, lalu arahkan kamera ke kode QR di samping.",
    "Pastikan nominal sesuai, lalu konfirmasi pembayaran.",
    "Halaman ini otomatis berpindah setelah pembayaran diterima.",
  ],
  va: [
    "Buka m-banking / internet banking / ATM bank terkait.",
    "Pilih menu Transfer → Virtual Account.",
    "Masukkan nomor Virtual Account di atas, nominal akan muncul otomatis.",
    "Konfirmasi pembayaran. Status di halaman ini akan diperbarui otomatis.",
  ],
  mandiri: [
    "Buka Livin' by Mandiri atau ATM Mandiri.",
    "Pilih Bayar → Multipayment / E-Commerce.",
    "Masukkan Kode Perusahaan (biller) lalu Kode Bayar di atas.",
    "Konfirmasi pembayaran. Status di halaman ini akan diperbarui otomatis.",
  ],
};

function formatSisa(detik) {
  if (detik == null) return "--:--";
  const h = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const s = detik % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function TombolSalin({ teks }) {
  const [tersalin, setTersalin] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(String(teks).replace(/\s/g, ""));
          setTersalin(true);
          setTimeout(() => setTersalin(false), 1800);
        } catch {}
      }}
      className="px-3 py-1.5 rounded-lg border border-[#E6D4C6] bg-white hover:bg-[#FAF4EE] text-[11px] font-bold text-[#7D2330] inline-flex items-center gap-1.5 cursor-pointer transition"
    >
      {tersalin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {tersalin ? "Tersalin" : "Salin"}
    </button>
  );
}

export function PembayaranView() {
  const { kode } = useParams();
  const router = useRouter();

  const [memuat, setMemuat] = useState(true);
  const [pesanan, setPesanan] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [alasan, setAlasan] = useState(null);
  const [error, setError] = useState("");
  const [metode, setMetode] = useState("qris");
  const [pilihUlang, setPilihUlang] = useState(false);
  const [sedangBuat, setSedangBuat] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [sisaDetik, setSisaDetik] = useState(null);
  const [berhasil, setBerhasil] = useState(false);
  const [sedangCek, setSedangCek] = useState(false);

  const autoBuatRef = useRef(false);

  const buatTagihan = useCallback(
    async (metodeDipilih, buatBaru = false) => {
      setSedangBuat(true);
      setError("");
      try {
        const res = await fetch("/api/midtrans/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, metode: metodeDipilih, buat_baru: buatBaru }),
        });
        const data = await res.json();
        if (data.sudah_dibayar) {
          setBerhasil(true);
          return;
        }
        if (!res.ok || !data.tagihan) {
          setError(data.pesan || "Gagal membuat tagihan pembayaran.");
          return;
        }
        setTagihan(data.tagihan);
        setPilihUlang(false);
      } catch {
        setError("Koneksi ke server pembayaran terputus. Silakan coba lagi.");
      } finally {
        setSedangBuat(false);
      }
    },
    [kode]
  );

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await fetch(`/api/midtrans/charge?kode=${encodeURIComponent(kode)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (batal) return;
        if (!res.ok) {
          setError(data.pesan || "Pesanan tidak ditemukan.");
          return;
        }
        setPesanan(data.pesanan);
        setTagihan(data.tagihan);
        setAlasan(data.alasan_tidak_bisa_bayar);
        if (data.tagihan) setMetode(data.tagihan.metode);

        const metodeUrl = new URLSearchParams(window.location.search).get("metode");
        if (metodeUrl && OPSI_METODE.some((m) => m.id === metodeUrl)) {
          setMetode(metodeUrl);
          if (!data.tagihan && !data.alasan_tidak_bisa_bayar && !autoBuatRef.current) {
            autoBuatRef.current = true;
            buatTagihan(metodeUrl);
          }
        }
      } catch {
        if (!batal) setError("Gagal memuat data pembayaran.");
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, [kode, buatTagihan]);

  // QR image
  useEffect(() => {
    if (tagihan?.metode !== "qris" || !tagihan.qr_string) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(tagihan.qr_string, { width: 320, margin: 1, color: { dark: "#2B1A18" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [tagihan]);

  // Countdown
  useEffect(() => {
    if (!tagihan?.kedaluwarsa) {
      setSisaDetik(null);
      return;
    }
    const target = new Date(tagihan.kedaluwarsa).getTime();
    const tick = () => setSisaDetik(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [tagihan]);

  const cekStatus = useCallback(async () => {
    if (!tagihan?.order_id) return;
    try {
      const res = await fetch("/api/midtrans/cek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const row = (data.pembayaran || []).find((p) => p.midtrans_order_id === tagihan.order_id);
      if (row?.status === "Dikonfirmasi") {
        setBerhasil(true);
      } else if (row && ["Kedaluwarsa", "Gagal"].includes(row.status)) {
        setSisaDetik(0);
      }
    } catch {}
  }, [kode, tagihan]);

  // Polling status
  useEffect(() => {
    if (!tagihan || berhasil || sisaDetik === 0) return;
    const t = setInterval(cekStatus, 5000);
    return () => clearInterval(t);
  }, [tagihan, berhasil, sisaDetik === 0, cekStatus]);

  useEffect(() => {
    if (!berhasil) return;
    const t = setTimeout(() => router.push(`/pesanan-saya/${kode}?bayar=1`), 3000);
    return () => clearTimeout(t);
  }, [berhasil, kode, router]);

  if (memuat) return <RootLoading />;

  const kedaluwarsa = tagihan && sisaDetik === 0;
  const tampilkanPilihan = !berhasil && !alasan && (!tagihan || pilihUlang || kedaluwarsa);
  const nominal = tagihan?.nominal ?? pesanan?.nominal_tagihan ?? 0;
  const jenis = tagihan?.jenis ?? pesanan?.jenis_tagihan;

  return (
    <div className="min-h-screen bg-[#FAF4EE] text-[#4A2E2B] pt-14 sm:pt-16 flex flex-col relative overflow-x-clip font-sans">
      <DynamicIslandNavbar showEntered={true} />
      <div className="absolute top-0 left-0 pointer-events-none select-none z-0">
        <BotanicalTopLeft className="w-40 sm:w-56 lg:w-64 h-auto" color="#8A675C" opacity={0.5} />
      </div>
      <div className="absolute top-0 right-0 pointer-events-none select-none z-0">
        <BotanicalTopRight className="w-40 sm:w-56 lg:w-64 h-auto" color="#8A675C" opacity={0.5} />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-14 w-full flex-1 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-7 pb-4 border-b border-[#EEDBCE]">
          <div>
            <h1
              className="text-4xl sm:text-5xl text-[#4A2E2B] font-normal leading-none"
              style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
            >
              Pembayaran
            </h1>
            <p className="text-xs sm:text-sm text-[#7D5A50] mt-1.5">
              Pesanan <strong className="text-[#7D2330]">{kode}</strong> sudah dibuat, tinggal selesaikan pembayarannya ♡
            </p>
          </div>
          <LangkahCheckout aktif={3} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} className="font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {!pesanan ? (
          <div className="text-center py-16">
            <Link href="/pesanan-saya" className="text-sm font-bold text-[#7D2330] underline">
              Kembali ke Pesanan Saya
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            <div className="lg:col-span-8 space-y-5">
              {berhasil ? (
                <div className="bg-[#FAF4ED] rounded-[24px] border border-emerald-200 p-8 sm:p-10 text-center space-y-3">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                  <h2 className="font-serif text-2xl font-bold text-[#4A2E2B]">Pembayaran Diterima!</h2>
                  <p className="text-sm text-[#7D5A50]">
                    Terima kasih, pesananmu sudah masuk antrean dapur. Mengalihkan ke tiket pesanan...
                  </p>
                  <Link
                    href={`/pesanan-saya/${kode}?bayar=1`}
                    className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[#7D2330] text-white text-xs font-bold"
                  >
                    Lihat Tiket Pesanan
                  </Link>
                </div>
              ) : alasan ? (
                <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] p-8 text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-[#7D2330] mx-auto" />
                  <p className="text-sm font-semibold text-[#4A2E2B]">{alasan}</p>
                  <Link
                    href={`/pesanan-saya/${kode}`}
                    className="inline-block px-6 py-2.5 rounded-full bg-[#7D2330] text-white text-xs font-bold"
                  >
                    Lihat Tiket Pesanan
                  </Link>
                </div>
              ) : tampilkanPilihan ? (
                <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] p-5 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#4A2E2B]">
                        {kedaluwarsa ? "Waktu pembayaran habis" : "Pilih Metode Pembayaran"}
                      </h2>
                      <p className="text-xs text-[#7D5A50] mt-0.5">
                        {kedaluwarsa
                          ? "Kode sebelumnya sudah tidak berlaku. Buat kode pembayaran baru di bawah."
                          : "Kode pembayaran akan langsung muncul setelah kamu memilih."}
                      </p>
                    </div>
                    {tagihan && !kedaluwarsa && (
                      <button
                        type="button"
                        onClick={() => setPilihUlang(false)}
                        className="text-xs font-semibold text-[#7D5A50] hover:text-[#7D2330] flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                      </button>
                    )}
                  </div>
                  <PilihMetodeBayar nilai={metode} onUbah={setMetode} />
                  <button
                    type="button"
                    disabled={sedangBuat}
                    onClick={() => buatTagihan(metode, Boolean(kedaluwarsa))}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {sedangBuat ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Membuat kode pembayaran...
                      </>
                    ) : (
                      <>Bayar {formatRupiah(nominal)}</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] overflow-hidden">
                  <div className="px-5 sm:px-7 py-4 bg-[#4A2E2B] text-white flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/70 font-bold">Menunggu pembayaran</p>
                      <p className="font-serif text-lg font-bold">{tagihan.label}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3.5 py-2">
                      <Clock className="w-4 h-4" />
                      <div className="leading-tight">
                        <p className="text-[10px] text-white/70">Bayar dalam</p>
                        <p className={`font-mono font-bold text-lg ${sisaDetik < 120 ? "text-amber-300" : ""}`}>
                          {formatSisa(sisaDetik)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col items-center text-center">
                      {tagihan.metode === "qris" ? (
                        <>
                          <div className="p-3 bg-white rounded-2xl border border-[#E6D4C6] shadow-sm">
                            {qrDataUrl ? (
                              <img src={qrDataUrl} alt="Kode QRIS" className="w-60 h-60 sm:w-64 sm:h-64" />
                            ) : (
                              <div className="w-60 h-60 sm:w-64 sm:h-64 bg-[#F5ECE3] animate-pulse rounded-xl" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#7D5A50] mt-2">Scan dengan aplikasi pembayaran apa pun yang mendukung QRIS</p>
                          {qrDataUrl && (
                            <a
                              href={qrDataUrl}
                              download={`QRIS-${kode}.png`}
                              className="mt-2 text-[11px] font-bold text-[#7D2330] inline-flex items-center gap-1 hover:underline"
                            >
                              <Download className="w-3.5 h-3.5" /> Simpan gambar QR
                            </a>
                          )}
                        </>
                      ) : tagihan.metode === "mandiri" ? (
                        <div className="w-full space-y-3 text-left">
                          <div className="p-4 rounded-2xl bg-white border border-[#E6D4C6]">
                            <p className="text-[11px] text-[#7D5A50] font-semibold">Kode Perusahaan (Biller)</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className="font-mono font-bold text-xl tracking-wider">{tagihan.biller_code}</p>
                              <TombolSalin teks={tagihan.biller_code} />
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-[#E6D4C6]">
                            <p className="text-[11px] text-[#7D5A50] font-semibold">Kode Bayar</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className="font-mono font-bold text-xl tracking-wider break-all">{tagihan.bill_key}</p>
                              <TombolSalin teks={tagihan.bill_key} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full p-4 rounded-2xl bg-white border border-[#E6D4C6] text-left">
                          <p className="text-[11px] text-[#7D5A50] font-semibold">Nomor Virtual Account</p>
                          <p className="font-mono font-bold text-xl sm:text-2xl tracking-wider break-all mt-1">
                            {String(tagihan.va_number || "").replace(/(.{4})/g, "$1 ").trim()}
                          </p>
                          <div className="mt-3">
                            <TombolSalin teks={tagihan.va_number} />
                          </div>
                        </div>
                      )}

                      <div className="w-full mt-4 p-4 rounded-2xl bg-white border border-[#E6D4C6] flex items-center justify-between">
                        <span className="text-xs text-[#7D5A50]">Jumlah dibayar</span>
                        <span className="font-serif font-bold text-xl text-[#7D2330] lining-nums">
                          {formatRupiah(tagihan.nominal)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-sm text-[#4A2E2B] mb-2">Cara membayar</h3>
                        <ol className="space-y-2">
                          {(tagihan.metode === "qris"
                            ? INSTRUKSI.qris
                            : tagihan.metode === "mandiri"
                              ? INSTRUKSI.mandiri
                              : INSTRUKSI.va
                          ).map((t, i) => (
                            <li key={i} className="flex gap-2.5 text-xs text-[#5C3D32] leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-[#F5ECE3] text-[#7D2330] text-[10px] font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#7D5A50] bg-white/70 rounded-xl px-3 py-2 border border-[#EEDBCE]">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Menunggu konfirmasi pembayaran otomatis...
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={sedangCek}
                          onClick={async () => {
                            setSedangCek(true);
                            await cekStatus();
                            setSedangCek(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#4A2E2B] hover:bg-[#382321] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${sedangCek ? "animate-spin" : ""}`} />
                          Saya sudah bayar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPilihUlang(true)}
                          className="px-4 py-2 rounded-xl border border-[#E6D4C6] bg-white hover:bg-[#FAF4EE] text-[#4A2E2B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          Ganti metode
                        </button>
                      </div>

                      {IS_SANDBOX && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
                          Mode sandbox: simulasikan pembayaran lewat{" "}
                          <a
                            href="https://simulator.sandbox.midtrans.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline"
                          >
                            Midtrans Simulator
                          </a>
                          {tagihan.metode === "qris" && tagihan.qr_url && (
                            <>
                              {" "}(menu QRIS, tempel URL QR:{" "}
                              <span className="break-all font-mono">{tagihan.qr_url}</span>)
                            </>
                          )}
                          .
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-[26px] border border-[#ECDCCE] bg-[#FAF4ED] overflow-hidden">
                <div className="bg-[#7D2330] text-white px-6 py-5">
                  <h2
                    className="text-2xl font-normal tracking-wide"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
                  >
                    Ringkasan Tagihan
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5">{pesanan.kode_pesanan}</p>
                </div>
                <div className="p-5 sm:p-6 space-y-2.5 text-xs sm:text-sm text-[#5C3D32]">
                  <div className="flex justify-between gap-3">
                    <span>Penerima</span>
                    <span className="font-bold text-[#4A2E2B] text-right">{pesanan.nama_penerima}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>{pesanan.metode_pengiriman === "Kirim" ? "Dikirim" : "Diambil"}</span>
                    <span className="font-bold text-[#4A2E2B] text-right">
                      {pesanan.tanggal_ambil ? formatTanggal(pesanan.tanggal_ambil) : "-"}
                      {pesanan.jam_ambil ? `, ${String(pesanan.jam_ambil).slice(0, 5)}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 pt-2.5 border-t border-[#EEDBCE]">
                    <span>Total Pesanan</span>
                    <span className="font-serif font-bold text-[#4A2E2B] lining-nums">{formatRupiah(pesanan.total_bayar)}</span>
                  </div>
                  {pesanan.jumlah_terbayar > 0 && (
                    <div className="flex justify-between gap-3">
                      <span>Sudah dibayar</span>
                      <span className="font-serif font-bold text-emerald-700 lining-nums">
                        {formatRupiah(pesanan.jumlah_terbayar)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 pt-2.5 border-t border-[#EEDBCE]">
                    <span className="font-bold text-[#4A2E2B]">
                      Bayar sekarang {jenis === "DP" ? "(DP)" : jenis === "Pelunasan" ? "(Pelunasan)" : "(Lunas)"}
                    </span>
                    <span className="font-serif font-bold text-lg text-[#7D2330] lining-nums">{formatRupiah(nominal)}</span>
                  </div>
                  {jenis === "DP" && (
                    <div className="flex justify-between gap-3 text-xs text-[#7D5A50]">
                      <span>Sisa pelunasan nanti</span>
                      <span className="font-bold lining-nums">
                        {formatRupiah(Math.max(0, pesanan.total_bayar - pesanan.jumlah_terbayar - nominal))}
                      </span>
                    </div>
                  )}
                  {pesanan.status_pesanan === "Menunggu Pembayaran" && (
                    <p className="text-[11px] text-[#7D5A50] pt-2 leading-relaxed">
                      Pesanan otomatis batal jika belum dibayar sampai{" "}
                      <strong>
                        {new Date(pesanan.batas_bayar).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Jakarta",
                        })}{" "}
                        WIB
                      </strong>
                      .
                    </p>
                  )}
                </div>
              </div>
              <Link
                href={`/pesanan-saya/${kode}`}
                className="mt-4 block text-center text-xs font-semibold text-[#7D5A50] hover:text-[#7D2330]"
              >
                Bayar nanti, lihat tiket pesanan →
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
