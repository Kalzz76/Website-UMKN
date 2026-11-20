"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { formatRupiah } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function TombolBayarMidtrans({ pesanan }) {
  const [loading, setLoading] = useState(false);
  const [opsiBayar, setOpsiBayar] = useState("Lunas");
  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
    !clientKey.startsWith("SB-");
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const sisa = Math.max(0, pesanan.total_bayar - (pesanan.jumlah_terbayar || 0));
  const isLunas = pesanan.status_bayar === "Lunas" || sisa <= 0;
  const isDpSudahBayar = pesanan.status_bayar === "DP Dibayar";
  const punyaDp = Number(pesanan.jumlah_dp) > 0;

  useEffect(() => {
    if (isDpSudahBayar) {
      setOpsiBayar("Pelunasan");
    } else {
      setOpsiBayar("Lunas");
    }
  }, [isDpSudahBayar]);

  if (["Selesai", "Dibatalkan"].includes(pesanan.status_pesanan)) {
    return null;
  }

  if (isLunas) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
          <i className="fa-solid fa-check" />
        </div>
        <div>
          <h4 className="font-bold text-xs">Pembayaran Lunas</h4>
          <p className="text-[11px] text-emerald-700">
            Terima kasih! Pesanan ini telah lunas dan siap diproses oleh tim Cravely.
          </p>
        </div>
      </div>
    );
  }

  let nominalTerpilih = sisa;
  if (!isDpSudahBayar && opsiBayar === "DP" && punyaDp) {
    nominalTerpilih = pesanan.jumlah_dp;
  }

  async function handleBayar() {
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
          kode_pesanan: pesanan.kode_pesanan,
          jenis_bayar: opsiBayar,
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
        onSuccess: function (result) {
          setLoading(false);
          setNotifikasi({
            terbuka: true,
            judul: "Pembayaran Berhasil!",
            pesan: "Pembayaran Anda telah berhasil diverifikasi otomatis oleh Midtrans.",
            tipe: "sukses",
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        onPending: function (result) {
          setLoading(false);
          setNotifikasi({
            terbuka: true,
            judul: "Menunggu Pembayaran",
            pesan: "Silakan selesaikan pembayaran sesuai petunjuk yang tertera.",
            tipe: "info",
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        onError: function (result) {
          setLoading(false);
          setNotifikasi({
            terbuka: true,
            judul: "Pembayaran Gagal",
            pesan: "Terjadi kendala saat memproses pembayaran Anda. Silakan coba kembali.",
            tipe: "error",
          });
        },
        onClose: function () {
          setLoading(false);
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

  return (
    <>
      <Script
        src={snapScriptUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="p-4 sm:p-5 rounded-2xl bg-[#fbf6e9] border border-[#dfd4bd] space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#e8dfc8]">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-credit-card text-[#ba2b2b] text-sm" />
            <h4 className="font-bold text-xs text-[#1d3b2e] uppercase tracking-wider">
              Pembayaran Online (Midtrans)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Otomatis & Aman
          </span>
        </div>

        {!isDpSudahBayar && punyaDp && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setOpsiBayar("Lunas")}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                opsiBayar === "Lunas"
                  ? "bg-[#17382d] text-white border-[#17382d] shadow-xs"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span className="block font-bold">Bayar Lunas</span>
              <span className={`text-[11px] ${opsiBayar === "Lunas" ? "text-emerald-200" : "text-stone-500"}`}>
                {formatRupiah(pesanan.total_bayar)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOpsiBayar("DP")}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                opsiBayar === "DP"
                  ? "bg-[#17382d] text-white border-[#17382d] shadow-xs"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span className="block font-bold">Bayar DP</span>
              <span className={`text-[11px] ${opsiBayar === "DP" ? "text-emerald-200" : "text-stone-500"}`}>
                {formatRupiah(pesanan.jumlah_dp)}
              </span>
            </button>
          </div>
        )}

        {isDpSudahBayar && (
          <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-medium">Sisa Pelunasan:</span>
            <span className="font-bold text-sm text-[#ba2b2b]">{formatRupiah(sisa)}</span>
          </div>
        )}

        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-stone-500 block uppercase font-bold">Total Pembayaran:</span>
            <span className="text-base font-extrabold text-[#ba2b2b]">{formatRupiah(nominalTerpilih)}</span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleBayar}
            className="h-[42px] px-6 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                <span>Menghubungkan Midtrans...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-lock text-xs" />
                <span>Bayar Sekarang via Midtrans</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-stone-400 text-center sm:text-left">
          Mendukung QRIS, GoPay, ShopeePay, BCA/Mandiri/BRI Virtual Account, dan Kartu Kredit.
        </p>
      </div>

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
