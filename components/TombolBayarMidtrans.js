"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function TombolBayarMidtrans({
  pesanan,
  batasBayarIso = null,
  transferManualAktif = false,
  pengaturan = null,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingCek, setLoadingCek] = useState(false);
  const [pesananAktif, setPesananAktif] = useState(pesanan);
  const [sisaWaktuDetik, setSisaWaktuDetik] = useState(null);
  const [modalBatalTerbuka, setModalBatalTerbuka] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [sedangBatal, setSedangBatal] = useState(false);

  const [formManualTerbuka, setFormManualTerbuka] = useState(false);
  const [metodeManual, setMetodeManual] = useState("Transfer Bank");
  const [fileBuktiManual, setFileBuktiManual] = useState(null);
  const [sedangUnggahManual, setSedangUnggahManual] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
    (!clientKey.startsWith("SB-") && clientKey.length > 0);
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const totalBayar = Number(pesananAktif.total_bayar || 0);
  const terbayar = Number(pesananAktif.jumlah_terbayar || 0);
  const sisa = Math.max(0, totalBayar - terbayar);
  const isLunas = pesananAktif.status_bayar === "Lunas" || sisa <= 0;
  const isDpSudahBayar = pesananAktif.status_bayar === "DP Dibayar" && sisa > 0;
  const isMenungguBayar = pesananAktif.status_pesanan === "Menunggu Pembayaran" && !isLunas;

  const batasWaktuString = batasBayarIso || pesananAktif.batas_bayar;

  useEffect(() => {
    setPesananAktif(pesanan);
  }, [pesanan]);

  useEffect(() => {
    if (!batasWaktuString || !isMenungguBayar) {
      setSisaWaktuDetik(null);
      return;
    }

    function hitungSisa() {
      const target = new Date(batasWaktuString).getTime();
      const selisih = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setSisaWaktuDetik(selisih);
    }

    hitungSisa();
    const interval = setInterval(hitungSisa, 1000);
    return () => clearInterval(interval);
  }, [batasWaktuString, isMenungguBayar]);

  const pollingRef = useRef(null);
  const waktuMulaiPollingRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const adaBayarParam = params.get("bayar") === "1";

    if (!adaBayarParam || isLunas) return;

    waktuMulaiPollingRef.current = Date.now();

    async function pollingCek() {
      if (Date.now() - waktuMulaiPollingRef.current > 120000) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }

      try {
        const res = await fetch("/api/midtrans/cek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode: pesanan.kode_pesanan }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.pesanan) {
            setPesananAktif(data.pesanan);
            if (data.pesanan.status_bayar === "Lunas" || data.pesanan.status_pesanan !== "Menunggu Pembayaran") {
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }
        }
      } catch {}
    }

    pollingCek();
    pollingRef.current = setInterval(pollingCek, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pesanan.kode_pesanan, isLunas]);

  async function handleCekStatusManual() {
    setLoadingCek(true);
    try {
      const res = await fetch("/api/midtrans/cek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: pesananAktif.kode_pesanan }),
      });

      const data = await res.json();
      if (res.ok && data.pesanan) {
        setPesananAktif(data.pesanan);
        setNotifikasi({
          terbuka: true,
          judul: "Status Pembayaran",
          pesan: `Status pesanan: ${data.pesanan.status_pesanan}. Status bayar: ${data.pesanan.status_bayar}. Terbayar: ${formatRupiah(data.pesanan.jumlah_terbayar || 0)}.`,
          tipe: "info",
        });
      } else {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal Memeriksa",
          pesan: data.pesan || "Tidak dapat memperbarui status dari Midtrans.",
          tipe: "error",
        });
      }
    } catch {
      setNotifikasi({
        terbuka: true,
        judul: "Kesalahan Jaringan",
        pesan: "Gagal menghubungi server untuk cek status.",
        tipe: "error",
      });
    } finally {
      setLoadingCek(false);
    }
  }

  async function handleBayar(jenisTarget) {
    if (typeof window === "undefined" || !window.snap) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Modul pembayaran Midtrans sedang disiapkan, silakan coba beberapa detik lagi.",
        tipe: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode_pesanan: pesananAktif.kode_pesanan,
          jenis: jenisTarget,
        }),
      });

      const hasil = await res.json();

      if (!res.ok || !hasil.token) {
        setLoading(false);
        setNotifikasi({
          terbuka: true,
          judul: "Informasi",
          pesan: hasil.pesan || "Gagal mendapatkan token pembayaran Midtrans.",
          tipe: "error",
        });
        return;
      }

      window.snap.pay(hasil.token, {
        onSuccess: function () {
          setLoading(false);
          window.location.href = `/pesanan-saya/${pesananAktif.kode_pesanan}?bayar=1`;
        },
        onPending: function () {
          setLoading(false);
          window.location.href = `/pesanan-saya/${pesananAktif.kode_pesanan}?bayar=1`;
        },
        onError: function () {
          setLoading(false);
          window.location.href = `/pesanan-saya/${pesananAktif.kode_pesanan}?bayar=1`;
        },
        onClose: function () {
          setLoading(false);
          window.location.href = `/pesanan-saya/${pesananAktif.kode_pesanan}?bayar=1`;
        },
      });
    } catch (err) {
      setLoading(false);
      setNotifikasi({
        terbuka: true,
        judul: "Kesalahan",
        pesan: err.message || "Gagal menghubungi server pembayaran.",
        tipe: "error",
      });
    }
  }

  async function handleBatalPesanan() {
    setSedangBatal(true);
    try {
      const res = await fetch(`/api/pesanan/${pesananAktif.kode_pesanan}/batal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan: alasanBatal.trim() }),
      });
      const data = await res.json();
      setSedangBatal(false);
      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal Membatalkan",
          pesan: data.pesan || "Pesanan tidak dapat dibatalkan.",
          tipe: "error",
        });
        return;
      }
      setModalBatalTerbuka(false);
      setPesananAktif((prev) => ({
        ...prev,
        status_pesanan: "Dibatalkan",
        dibatalkan_oleh: "Pelanggan",
        alasan_batal: alasanBatal.trim() || "Dibatalkan oleh pelanggan",
      }));
      setNotifikasi({
        terbuka: true,
        judul: "Pesanan Dibatalkan",
        pesan: "Pesanan berhasil dibatalkan.",
        tipe: "sukses",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setSedangBatal(false);
      setNotifikasi({
        terbuka: true,
        judul: "Kesalahan",
        pesan: "Gagal menghubungi server untuk membatalkan pesanan.",
        tipe: "error",
      });
    }
  }

  async function handleUnggahManual(e) {
    e.preventDefault();
    if (!fileBuktiManual) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Silakan pilih berkas bukti transfer terlebih dahulu.",
        tipe: "error",
      });
      return;
    }
    setSedangUnggahManual(true);
    try {
      const nominal = isDpSudahBayar ? sisa : (pesananAktif.jumlah_dp || totalBayar);
      const jenisTgt = isDpSudahBayar ? "Pelunasan" : (pesananAktif.jumlah_dp ? "DP" : "Lunas");

      const fd = new FormData();
      fd.append("kode_pesanan", pesananAktif.kode_pesanan);
      fd.append("id_pesanan", pesananAktif.id);
      fd.append("jenis", jenisTgt);
      fd.append("jumlah", nominal);
      fd.append("metode", metodeManual);
      fd.append("bukti", fileBuktiManual);

      const res = await fetch("/api/pembayaran", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setSedangUnggahManual(false);
      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal Mengunggah",
          pesan: data.pesan || "Terjadi kesalahan saat mengunggah bukti.",
          tipe: "error",
        });
        return;
      }
      setNotifikasi({
        terbuka: true,
        judul: "Berhasil",
        pesan: "Bukti pembayaran berhasil diunggah dan sedang menunggu konfirmasi admin toko.",
        tipe: "sukses",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setSedangUnggahManual(false);
      setNotifikasi({
        terbuka: true,
        judul: "Kesalahan Jaringan",
        pesan: "Gagal mengirim berkas ke server.",
        tipe: "error",
      });
    }
  }

  function formatDetik(detik) {
    if (detik === null || detik <= 0) return "Waktu habis";
    const jam = Math.floor(detik / 3600);
    const sisaDetik = detik % 3600;
    const menit = Math.floor(sisaDetik / 60);
    const d = sisaDetik % 60;
    if (jam > 0) {
      return `${jam} jam ${menit} menit ${d} detik`;
    }
    return `${menit} menit ${d} detik`;
  }

  if (pesananAktif.perlu_refund) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
          <i className="fa-solid fa-triangle-exclamation text-amber-600" />
          <span>Pemberitahuan Refund</span>
        </div>
        <p className="text-xs leading-relaxed font-semibold">
          Pembayaran diterima setelah pesanan dibatalkan; toko akan menghubungi Anda.
        </p>
      </div>
    );
  }

  if (["Selesai", "Dibatalkan"].includes(pesananAktif.status_pesanan)) {
    return null;
  }

  if (isLunas) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
          <i className="fa-solid fa-check" />
        </div>
        <div>
          <h4 className="font-bold text-xs">Pembayaran Diterima (Lunas)</h4>
          <p className="text-[11px] text-emerald-700">
            Terima kasih! Seluruh pembayaran telah berhasil diverifikasi oleh sistem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src={snapScriptUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF4ED] border border-[#ECDCCE] space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEDBCE]">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-credit-card text-[#7D2330] text-sm" />
              <h4 className="font-bold text-xs text-[#4A2E2B] uppercase tracking-wider">
                Pembayaran Online (Midtrans)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Otomatis & Terverifikasi
            </span>
          </div>

          {isMenungguBayar && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">Batas Waktu Pembayaran:</span>
                <span className="font-mono font-bold text-rose-700">
                  {formatDetik(sisaWaktuDetik)}
                </span>
              </div>
              <p className="text-[11px] text-amber-700">
                Selesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak dibatalkan otomatis.
              </p>
            </div>
          )}

          {isDpSudahBayar && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center justify-between">
                <span>DP Terkonfirmasi:</span>
                <strong className="font-mono lining-nums text-emerald-800">
                  {formatRupiah(terbayar)}
                </strong>
              </div>
              <div className="flex items-center justify-between font-bold text-[#7D2330]">
                <span>Sisa Pelunasan:</span>
                <strong className="font-mono lining-nums">{formatRupiah(sisa)}</strong>
              </div>
            </div>
          )}

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#7D5A50] block uppercase font-bold">
                {isDpSudahBayar ? "Nominal Sisa:" : "Nominal Harus Dibayar:"}
              </span>
              <span className="text-base font-extrabold text-[#7D2330] font-mono lining-nums">
                {formatRupiah(isDpSudahBayar ? sisa : (pesananAktif.jumlah_dp || totalBayar))}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isMenungguBayar && (
                <button
                  type="button"
                  disabled={sedangBatal}
                  onClick={() => setModalBatalTerbuka(true)}
                  className="h-[40px] px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-ban text-xs" />
                  <span>Batalkan Pesanan</span>
                </button>
              )}

              <button
                type="button"
                disabled={loadingCek}
                onClick={handleCekStatusManual}
                className="h-[40px] px-3.5 rounded-xl border border-[#ECDCCE] bg-white hover:bg-stone-50 text-[#4A2E2B] font-bold text-xs transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <i className={`fa-solid fa-arrows-rotate text-xs ${loadingCek ? "animate-spin" : ""}`} />
                <span>{loadingCek ? "Mengecek..." : "Cek Status"}</span>
              </button>

              {isDpSudahBayar ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleBayar("Pelunasan")}
                  className="h-[40px] px-5 rounded-xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock text-xs" />
                      <span>Bayar Sisa Pelunasan</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleBayar(pesananAktif.jumlah_dp ? "DP" : "Lunas")}
                  className="h-[40px] px-5 rounded-xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock text-xs" />
                      <span>Bayar Sekarang</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-[10px] text-[#7D5A50] text-center sm:text-left">
            Didukung oleh Midtrans: QRIS, GoPay, ShopeePay, Virtual Account Bank, dan Kartu Kredit.
          </p>
        </div>

        {transferManualAktif && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-building-columns text-stone-600 text-sm" />
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Transfer Manual & Unggah Bukti
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setFormManualTerbuka(!formManualTerbuka)}
                className="text-xs font-bold text-[#7D2330] hover:underline cursor-pointer"
              >
                {formManualTerbuka ? "Sembunyikan" : "Buka Formulir"}
              </button>
            </div>

            {formManualTerbuka && (
              <form onSubmit={handleUnggahManual} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                  <p className="font-semibold text-stone-800">Rekening Tujuan Toko:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">Bank</span>
                      <strong className="text-stone-900">{pengaturan?.nama_bank || "BCA"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">Nomor Rekening</span>
                      <strong className="text-rose-700 font-mono text-sm">{pengaturan?.no_rekening || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">Atas Nama</span>
                      <strong className="text-stone-900">{pengaturan?.atas_nama || "-"}</strong>
                    </div>
                  </div>
                  {pengaturan?.gambar_qris && (
                    <div className="pt-2 border-t border-stone-200">
                      <span className="text-[10px] text-stone-400 block uppercase mb-1">Barcode QRIS</span>
                      <div className="w-32 h-32 relative border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <Image
                          src={pengaturan.gambar_qris}
                          alt="QRIS"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Metode Transfer
                    </label>
                    <select
                      value={metodeManual}
                      onChange={(e) => setMetodeManual(e.target.value)}
                      className="w-full h-[38px] px-3 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                    >
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Unggah File Bukti (JPG/PNG, maks. 2 MB)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => setFileBuktiManual(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sedangUnggahManual}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {sedangUnggahManual ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-upload text-xs" />
                        <span>Kirim Bukti Pembayaran</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {modalBatalTerbuka && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Konfirmasi Batalkan Pesanan</h3>
              <button
                type="button"
                onClick={() => setModalBatalTerbuka(false)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan <strong>{pesananAktif.kode_pesanan}</strong>? Tindakan ini tidak dapat dibatalkan dan kuota tanggal akan dilepas kembali.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Alasan pembatalan (opsional):
              </label>
              <textarea
                rows={2}
                value={alasanBatal}
                onChange={(e) => setAlasanBatal(e.target.value)}
                placeholder="Contoh: Ingin mengubah pesanan"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-[#7D2330]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={sedangBatal}
                onClick={() => setModalBatalTerbuka(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={sedangBatal}
                onClick={handleBatalPesanan}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {sedangBatal ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-ban text-xs" />
                    <span>Ya, Batalkan Pesanan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalPesan
        terbuka={notifikasi.terbuka}
        judul={notifikasi.judul}
        pesan={notifikasi.pesan}
        tipe={notifikasi.tipe}
        padaTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
      />
    </>
  );
}
