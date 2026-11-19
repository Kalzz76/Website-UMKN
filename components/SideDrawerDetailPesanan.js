"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";

function ekstrakSpesifikasiDanCatatan(pesanan) {
  if (!pesanan) return { spesifikasi: null, catatanMurni: "" };

  let spesifikasi = null;
  let catatanMurni = (pesanan.catatan || "").trim();

  if (pesanan.desain_json && typeof pesanan.desain_json === "object") {
    spesifikasi = pesanan.desain_json;
    return { spesifikasi, catatanMurni };
  }

  // Cek apakah ada catatan lama yang menggabungkan teks sistem (format: Bentuk: ... | Isian: ... | ...)
  if (
    pesanan.catatan &&
    (pesanan.catatan.includes("Bentuk:") ||
      pesanan.catatan.includes("Isian:") ||
      pesanan.catatan.includes("Dekorasi:") ||
      pesanan.catatan.includes(" | "))
  ) {
    const bagian = pesanan.catatan
      .split(" | ")
      .map((s) => s.trim())
      .filter(Boolean);
    const specs = {};
    const sisaCatatan = [];

    for (let i = 0; i < bagian.length; i++) {
      const item = bagian[i];
      if (item.startsWith("Bentuk:")) specs.shapeLabel = item.replace("Bentuk:", "").trim();
      else if (item.startsWith("Isian:")) specs.fillLabel = item.replace("Isian:", "").trim();
      else if (item.startsWith("Krim:")) specs.icingLabel = item.replace("Krim:", "").trim();
      else if (item.startsWith("Dekorasi:")) specs.decoSummary = item.replace("Dekorasi:", "").trim();
      else if (item.startsWith("Elemen:")) specs.itemsSummary = item.replace("Elemen:", "").trim();
      else if (item.startsWith("Metode Bayar:")) specs.metode_bayar = item.replace("Metode Bayar:", "").trim();
      else sisaCatatan.push(item);
    }

    if (Object.keys(specs).length > 0) {
      spesifikasi = specs;
      catatanMurni = sisaCatatan.join(" | ");
    }
  }

  return { spesifikasi, catatanMurni };
}

export default function SideDrawerDetailPesanan({
  kodePesanan,
  terbuka,
  onTutup,
  onPerubahan,
  isAdmin = false,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [pilihan, setPilihan] = useState([]);
  const [daftarBayar, setDaftarBayar] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [fotoReferensiUrl, setFotoReferensiUrl] = useState(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null);

  const [formBatalBuka, setFormBatalBuka] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    pesan: "",
    tipe: "sukses",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Kunci scroll halaman saat side drawer terbuka
  useEffect(() => {
    if (terbuka) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [terbuka]);

  // Tekan Escape untuk menutup side drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && terbuka) {
        if (formBatalBuka) {
          setFormBatalBuka(false);
        } else {
          onTutup();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [terbuka, formBatalBuka, onTutup]);

  async function muatData(kode) {
    if (!kode) return;
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const { data: pData } = await supabase
      .from("pesanan")
      .select("*, zona_ongkir(nama)")
      .eq("kode_pesanan", kode)
      .single();

    if (!pData) {
      setPesanan(null);
      setSedangMemuat(false);
      return;
    }

    setPesanan(pData);

    const { data: pilData } = await supabase
      .from("pesanan_pilihan")
      .select("*")
      .eq("id_pesanan", pData.id);
    if (pilData) setPilihan(pilData);

    if (pData.foto_referensi) {
      const { data: signedRef } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(pData.foto_referensi, 3600);
      if (signedRef) setFotoReferensiUrl(signedRef.signedUrl);
    } else {
      setFotoReferensiUrl(null);
    }

    if (pData.foto_preview) {
      const { data: signedPrev } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(pData.foto_preview, 3600);
      if (signedPrev) setFotoPreviewUrl(signedPrev.signedUrl);
    } else {
      setFotoPreviewUrl(null);
    }

    if (isAdmin) {
      const { data: bayarList } = await supabase
        .from("pembayaran")
        .select("*")
        .eq("id_pesanan", pData.id)
        .order("dibuat_pada", { ascending: false });

      if (bayarList) {
        const bayarWithUrl = [];
        for (let i = 0; i < bayarList.length; i++) {
          const item = bayarList[i];
          let url = null;
          if (item.bukti) {
            const { data: signed } = await supabase.storage
              .from("bukti-bayar")
              .createSignedUrl(item.bukti, 3600);
            if (signed) url = signed.signedUrl;
          }
          bayarWithUrl.push({ ...item, signedUrl: url });
        }
        setDaftarBayar(bayarWithUrl);
      }
    }

    const { data: rList } = await supabase
      .from("riwayat_pesanan")
      .select("*, profil(nama, role)")
      .eq("id_pesanan", pData.id)
      .order("dibuat_pada", { ascending: true });
    if (rList) setRiwayat(rList);

    setSedangMemuat(false);
  }

  useEffect(() => {
    if (terbuka && kodePesanan) {
      setFormBatalBuka(false);
      setNotifikasi({ terbuka: false, pesan: "", tipe: "sukses" });
      muatData(kodePesanan);
    } else if (!terbuka) {
      const timer = setTimeout(() => {
        setPesanan(null);
        setPilihan([]);
        setDaftarBayar([]);
        setRiwayat([]);
        setFotoReferensiUrl(null);
        setFotoPreviewUrl(null);
        setFormBatalBuka(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [terbuka, kodePesanan]);

  async function ubahStatusPesanan(statusBaru, alasan = "") {
    if (!pesanan) return;
    setSedangProses(true);
    const res = await fetch(`/api/pesanan/${pesanan.kode_pesanan}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_baru: statusBaru,
        alasan_batal: alasan,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        pesan: hasil.pesan || "Gagal mengubah status pesanan.",
        tipe: "error",
      });
      return;
    }

    setFormBatalBuka(false);
    setAlasanBatal("");
    setNotifikasi({
      terbuka: true,
      pesan: hasil.pesan,
      tipe: "sukses",
    });

    muatData(pesanan.kode_pesanan);
    if (onPerubahan) onPerubahan();
  }

  async function handleAksiPembayaran(idBayar, aksi) {
    const konfirm = window.confirm(
      `Apakah Anda yakin ingin ${aksi === "konfirmasi" ? "mengonfirmasi" : "menolak"} pembayaran ini?`
    );
    if (!konfirm) return;

    setSedangProses(true);
    const res = await fetch(`/api/pembayaran/${idBayar}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        pesan: hasil.pesan || "Gagal memproses pembayaran.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      pesan: hasil.pesan,
      tipe: "sukses",
    });

    if (pesanan) muatData(pesanan.kode_pesanan);
    if (onPerubahan) onPerubahan();
  }

  function getBadgeStatusPesanan(status) {
    if (status === "Menunggu Pembayaran") return "bg-stone-100 text-stone-700";
    if (status === "Diterima") return "bg-sky-100 text-sky-800";
    if (status === "Sedang Dibuat") return "bg-amber-100 text-amber-800";
    if (status === "Siap") return "bg-emerald-100 text-emerald-800";
    if (status === "Dikirim") return "bg-indigo-100 text-indigo-800";
    if (status === "Selesai") return "bg-green-100 text-green-800";
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeStatusBayar(status) {
    if (status === "Lunas") return "bg-emerald-100 text-emerald-800";
    if (status === "DP Dibayar") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  }

  if (!isMounted) return null;

  const status = pesanan?.status_pesanan;

  return createPortal(
    <div
      className={`fixed inset-0 z-[120] transition-visibility ${
        terbuka ? "visible pointer-events-auto" : "invisible pointer-events-none delay-300"
      }`}
    >
      {/* Backdrop halus di belakang Side Drawer */}
      <div
        onClick={onTutup}
        className={`fixed inset-0 bg-stone-950/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
          terbuka ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Side Drawer Panel: Meluncur keluar dari sisi kanan layar ke arah kiri */}
      <aside
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-[#fbf6e9] border-l-2 border-[#e8dfc8] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out z-10 ${
          terbuka ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Detail Pesanan"
      >
        {/* Header */}
        <div className="flex-none bg-[#fbf6e9] border-b border-[#e0d5b8] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#17382d] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-receipt text-sm"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-[#1d3b2e] truncate">
                  {pesanan?.kode_pesanan || kodePesanan || "Detail Pesanan"}
                </h2>
                {pesanan && (
                  <span
                    className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${getBadgeStatusPesanan(
                      pesanan.status_pesanan
                    )}`}
                  >
                    {pesanan.status_pesanan}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-stone-500 truncate mt-0.5">
                {pesanan
                  ? `Dipesan pada ${formatTanggalIndonesia(pesanan.dibuat_pada)}`
                  : "Memuat informasi pesanan..."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {pesanan && (
              <Link
                href={`/dashboard/pesanan/${pesanan.kode_pesanan}`}
                className="w-9 h-9 rounded-xl border border-[#e0d5b8] bg-[#fffdf6] hover:bg-[#ede2cd] text-[#1d3b2e] flex items-center justify-center transition text-xs"
                title="Buka Halaman Penuh"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </Link>
            )}
            <button
              type="button"
              onClick={onTutup}
              className="w-9 h-9 rounded-xl border border-[#e0d5b8] bg-[#fffdf6] hover:bg-[#ede2cd] text-stone-600 hover:text-stone-900 flex items-center justify-center transition text-sm cursor-pointer"
              title="Tutup (Esc)"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Notifikasi Banner Inline di dalam Side Drawer */}
        {notifikasi.terbuka && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              notifikasi.tipe === "sukses"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <i
                className={`fa-solid ${
                  notifikasi.tipe === "sukses"
                    ? "fa-circle-check text-emerald-600"
                    : "fa-circle-exclamation text-rose-600"
                } text-sm`}
              ></i>
              <span className="font-semibold">{notifikasi.pesan}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotifikasi({ ...notifikasi, terbuka: false })}
              className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Konten Scrollable Side Drawer */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {sedangMemuat ? (
            <div className="py-24 text-center text-stone-400">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
              <p className="text-xs font-semibold text-stone-600">Memuat detail pesanan...</p>
            </div>
          ) : !pesanan ? (
            <div className="py-24 text-center text-stone-400">
              <i className="fa-solid fa-triangle-exclamation text-3xl mb-3 text-amber-500"></i>
              <p className="text-sm font-semibold text-stone-800">Pesanan tidak ditemukan.</p>
              <p className="text-xs text-stone-400 mt-1">Data pesanan mungkin telah dihapus.</p>
            </div>
          ) : (
            <>
              {/* Blok Aksi Status Pesanan */}
              <div className="p-4 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Aksi Status Pesanan
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {isAdmin && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getBadgeStatusBayar(
                          pesanan.status_bayar
                        )}`}
                      >
                        {pesanan.status_bayar}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700">
                      {pesanan.metode_pengiriman === "Ambil" ? "Ambil Sendiri" : "Dikirim"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {status === "Diterima" && (
                    <button
                      type="button"
                      disabled={sedangProses}
                      onClick={() => ubahStatusPesanan("Sedang Dibuat")}
                      className="h-[38px] px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
                    >
                      <i className="fa-solid fa-fire-burner"></i>
                      <span>Mulai Produksi (Sedang Dibuat)</span>
                    </button>
                  )}

                  {status === "Sedang Dibuat" && (
                    <button
                      type="button"
                      disabled={sedangProses}
                      onClick={() => ubahStatusPesanan("Siap")}
                      className="h-[38px] px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
                    >
                      <i className="fa-solid fa-check"></i>
                      <span>Tandai Siap</span>
                    </button>
                  )}

                  {isAdmin && status === "Siap" && pesanan.metode_pengiriman === "Kirim" && (
                    <button
                      type="button"
                      disabled={sedangProses}
                      onClick={() => ubahStatusPesanan("Dikirim")}
                      className="h-[38px] px-4 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
                    >
                      <i className="fa-solid fa-truck"></i>
                      <span>Kirimkan Kue</span>
                    </button>
                  )}

                  {isAdmin && status === "Siap" && pesanan.metode_pengiriman === "Ambil" && (
                    <button
                      type="button"
                      disabled={sedangProses}
                      onClick={() => ubahStatusPesanan("Selesai")}
                      className="h-[38px] px-4 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Selesaikan (Kue Diambil)</span>
                    </button>
                  )}

                  {isAdmin && status === "Dikirim" && (
                    <button
                      type="button"
                      disabled={sedangProses}
                      onClick={() => ubahStatusPesanan("Selesai")}
                      className="h-[38px] px-4 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Selesaikan (Pesanan Tiba)</span>
                    </button>
                  )}

                  {isAdmin && ["Menunggu Pembayaran", "Diterima"].includes(status) && (
                    <button
                      type="button"
                      onClick={() => setFormBatalBuka(!formBatalBuka)}
                      className="h-[38px] px-3.5 rounded-xl font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs transition cursor-pointer inline-flex items-center space-x-2"
                    >
                      <i className="fa-solid fa-ban"></i>
                      <span>Batalkan Pesanan</span>
                    </button>
                  )}

                  {["Selesai", "Dibatalkan"].includes(status) && (
                    <span className="text-xs font-semibold text-stone-500 italic">
                      Pesanan telah berstatus akhir ({status}).
                    </span>
                  )}
                </div>

                {/* Form Pembatalan Inline di dalam Side Drawer */}
                {formBatalBuka && (
                  <div className="mt-3 p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-900 flex items-center space-x-1.5">
                        <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
                        <span>Konfirmasi Pembatalan Pesanan</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormBatalBuka(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Pembatalan akan mengembalikan kuota harian. Masukkan alasan pembatalan untuk dicatat pada riwayat:
                    </p>
                    <textarea
                      rows="2"
                      value={alasanBatal}
                      onChange={(e) => setAlasanBatal(e.target.value)}
                      placeholder="Contoh: Permintaan pelanggan via WA / Batas bayar habis"
                      className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:border-rose-400 resize-none"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormBatalBuka(false)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={sedangProses || !alasanBatal.trim()}
                        onClick={() => ubahStatusPesanan("Dibatalkan", alasanBatal)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {sedangProses ? "Membatalkan..." : "Konfirmasi Batal"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Preview Kue & Catatan */}
              {(() => {
                const { spesifikasi, catatanMurni } = ekstrakSpesifikasiDanCatatan(pesanan);
                return (
                  <>
                    {/* KARTU 1: VISUAL PREVIEW & CATATAN PELANGGAN */}
                    <div className="p-5 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-cake-candles text-amber-600 text-sm"></i>
                          <h3 className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider">
                            Visual Desain Kue
                          </h3>
                        </div>
                        {fotoPreviewUrl && (
                          <span className="text-[10px] font-bold text-[#1d3b2e] bg-[#ede2cd] px-2.5 py-0.5 rounded-full">
                            Snapshot 3D
                          </span>
                        )}
                      </div>

                      <div className="py-2 flex flex-col items-center justify-center">
                        {fotoPreviewUrl ? (
                          <div className="flex flex-col items-center space-y-2 w-full">
                            <div className="relative group max-w-[280px] w-full">
                              <img
                                src={fotoPreviewUrl}
                                alt="Snapshot Desain 3D"
                                className="w-full h-auto object-contain rounded-2xl drop-shadow-md border border-[#e0d5b8] bg-[#fbf6e9] p-2"
                              />
                              <a
                                href={fotoPreviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-3 right-3 bg-stone-900/75 hover:bg-stone-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition"
                              >
                                <i className="fa-solid fa-magnifying-glass-plus text-[9px]"></i>
                                <span>Perbesar</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <PreviewKue
                            pilihan={pilihan}
                            tulisan_kue={pesanan.tulisan_kue}
                            className="w-full max-w-[200px] h-auto drop-shadow-md"
                          />
                        )}
                      </div>

                      {pesanan.tulisan_kue && (
                        <div className="pt-3 border-t border-dashed border-[#e0d5b8] space-y-1">
                          <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                            Tulisan di Atas Kue:
                          </span>
                          <div className="p-3 rounded-xl bg-[#fbf6e9] border border-[#e0d5b8] text-center">
                            <p className="text-sm font-extrabold text-[#1d3b2e] italic">
                              &ldquo;{pesanan.tulisan_kue}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Catatan dari Pelanggan */}
                      <div className="pt-3 border-t border-dashed border-[#e0d5b8] space-y-1.5">
                        <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider flex items-center space-x-1.5">
                          <i className="fa-solid fa-message text-stone-400"></i>
                          <span>Catatan Khusus dari Pemesan:</span>
                        </span>
                        {catatanMurni ? (
                          <div className="p-3.5 rounded-xl bg-[#fbf6e9] border border-[#e0d5b8]">
                            <p className="text-xs font-semibold text-stone-800 leading-relaxed whitespace-pre-line italic">
                              &ldquo;{catatanMurni}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs italic text-stone-400 py-1">
                            Tidak ada catatan khusus dari pemesan.
                          </p>
                        )}
                      </div>

                      {fotoReferensiUrl && (
                        <div className="pt-3 border-t border-dashed border-[#e0d5b8] space-y-2">
                          <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                            Foto Referensi Pelanggan:
                          </span>
                          <a
                            href={fotoReferensiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block group"
                          >
                            <div className="relative">
                              <img
                                src={fotoReferensiUrl}
                                alt="Foto Referensi"
                                className="w-24 h-24 object-cover rounded-xl border-2 border-[#e0d5b8] group-hover:opacity-90 shadow-sm transition"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/70 text-white rounded-md p-1 text-[10px]">
                                <i className="fa-solid fa-magnifying-glass-plus"></i>
                              </span>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* KARTU 2: DETAIL SPESIFIKASI KUSTOMISASI DESAIN (STANDALONE & ELEGAN) */}
                    {spesifikasi && (
                      <div className="p-5 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
                          <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-wand-magic-sparkles text-amber-600 text-sm"></i>
                            <h3 className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider">
                              Spesifikasi Kustomisasi Desain
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                            CakeCraft 3D
                          </span>
                        </div>

                        <div className="divide-y divide-[#e0d5b8] text-xs">
                          {spesifikasi.shapeLabel && (
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="font-semibold text-stone-500 flex items-center space-x-2">
                                <i className="fa-solid fa-shapes text-stone-400 w-4"></i>
                                <span>Bentuk Kue</span>
                              </span>
                              <span className="font-bold text-stone-900 bg-[#ede2cd] px-3 py-1 rounded-lg">
                                {spesifikasi.shapeLabel}
                              </span>
                            </div>
                          )}

                          {spesifikasi.fillLabel && (
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="font-semibold text-stone-500 flex items-center space-x-2">
                                <i className="fa-solid fa-layer-group text-stone-400 w-4"></i>
                                <span>Isian Kue</span>
                              </span>
                              <span className="font-bold text-stone-900 bg-[#fbf6e9] border border-[#e0d5b8] px-3 py-1 rounded-lg">
                                {spesifikasi.fillLabel}
                              </span>
                            </div>
                          )}

                          {spesifikasi.icingLabel && (
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="font-semibold text-stone-500 flex items-center space-x-2">
                                <i className="fa-solid fa-palette text-stone-400 w-4"></i>
                                <span>Warna Krim</span>
                              </span>
                              <div className="flex items-center space-x-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs"
                                  style={{
                                    backgroundColor:
                                      spesifikasi.icing ||
                                      (spesifikasi.icingLabel?.toLowerCase().includes("kuning")
                                        ? "#fbe39a"
                                        : spesifikasi.icingLabel?.toLowerCase().includes("pink")
                                        ? "#f6b4c2"
                                        : spesifikasi.icingLabel?.toLowerCase().includes("mint")
                                        ? "#bfe8d8"
                                        : "#fff8f0"),
                                  }}
                                ></span>
                                <span className="font-bold text-stone-900">
                                  {spesifikasi.icingLabel}
                                </span>
                              </div>
                            </div>
                          )}

                          {spesifikasi.flavorLabel && (
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="font-semibold text-stone-500 flex items-center space-x-2">
                                <i className="fa-solid fa-cookie-bite text-stone-400 w-4"></i>
                                <span>Rasa Dasar</span>
                              </span>
                              <span className="font-bold text-stone-900 bg-[#fbf6e9] border border-[#e0d5b8] px-3 py-1 rounded-lg">
                                {spesifikasi.flavorLabel}
                              </span>
                            </div>
                          )}

                          {spesifikasi.decoSummary && (
                            <div className="py-3 space-y-1.5">
                              <span className="font-semibold text-stone-500 block">
                                Dekorasi Tambahan:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {spesifikasi.decoSummary
                                  .split(",")
                                  .map((d) => d.trim())
                                  .filter(Boolean)
                                  .map((decoItem, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#ede2cd] text-[#1d3b2e] border border-[#e0d5b8]"
                                    >
                                      {decoItem}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                          {spesifikasi.itemsSummary && (
                            <div className="py-3 space-y-1.5">
                              <span className="font-semibold text-stone-500 block">
                                Stiker & Elemen Khusus:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {spesifikasi.itemsSummary
                                  .split(",")
                                  .map((el) => el.trim())
                                  .filter(Boolean)
                                  .map((elItem, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-stone-800 border border-[#e0d5b8] shadow-2xs"
                                    >
                                      {elItem}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Informasi Pemesan & Pengambilan */}
              <div className="p-5 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-[#e0d5b8]">
                  <i className="fa-solid fa-user-check text-[#17382d] text-sm"></i>
                  <h3 className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider">
                    Informasi Pemesan & Pengambilan
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-stone-500 block text-[11px]">Nama Pemesan</span>
                    <span className="font-bold text-stone-900 text-sm block">{pesanan.nama_penerima}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="font-semibold text-stone-500 block text-[11px]">Nomor WhatsApp</span>
                    <a
                      href={`https://wa.me/${pesanan.no_wa.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 hover:text-emerald-800 text-sm inline-flex items-center space-x-1.5"
                    >
                      <i className="fa-brands fa-whatsapp text-emerald-600 text-base"></i>
                      <span>{pesanan.no_wa}</span>
                    </a>
                  </div>

                  <div className="space-y-0.5">
                    <span className="font-semibold text-stone-500 block text-[11px]">Jadwal Pengambilan</span>
                    <span className="font-bold text-stone-900 block">
                      {formatTanggalIndonesia(pesanan.tanggal_ambil)} pukul {pesanan.jam_ambil?.slice(0, 5)} WIB
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="font-semibold text-stone-500 block text-[11px]">Metode Pengiriman</span>
                    <span className="font-bold text-stone-900 block">
                      {pesanan.metode_pengiriman === "Ambil"
                        ? "Ambil Sendiri di Toko"
                        : `Kirim ke Alamat (${pesanan.zona_ongkir?.nama || "Kurir"})`}
                    </span>
                  </div>

                  {pesanan.metode_pengiriman === "Kirim" && (
                    <div className="sm:col-span-2 pt-2 border-t border-dashed border-[#e0d5b8] space-y-1">
                      <span className="font-semibold text-stone-500 block text-[11px]">Alamat Lengkap Pengiriman:</span>
                      <p className="font-medium text-stone-800 leading-relaxed bg-[#fbf6e9] border border-[#e0d5b8] p-2.5 rounded-xl">
                        {pesanan.alamat}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Biaya & Tagihan */}
              <div className="p-5 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-receipt text-[#17382d] text-sm"></i>
                    <h3 className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider">
                      Rincian Biaya & Tagihan
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-[#ede2cd] px-2.5 py-0.5 rounded-full">
                    Invoice
                  </span>
                </div>

                <div className="divide-y divide-[#e0d5b8] text-xs">
                  {pilihan.map((p, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-500">{p.nama_grup}:</span>
                        <span className="text-stone-900 font-bold">{p.nama_item}</span>
                      </div>
                      {isAdmin && (
                        <span className="font-bold text-stone-900">
                          {formatRupiah(p.harga)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t-2 border-dashed border-[#e0d5b8] space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span className="font-medium">Subtotal Kue</span>
                      <span className="font-bold text-stone-900">{formatRupiah(pesanan.total_kue)}</span>
                    </div>
                    {pesanan.ongkir > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span className="font-medium">Ongkos Kirim</span>
                        <span className="font-bold text-stone-900">{formatRupiah(pesanan.ongkir)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3.5 rounded-2xl bg-[#17382d] text-white my-2 shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-200 block uppercase tracking-wider">
                          Total Tagihan
                        </span>
                        <span className="text-lg font-black tracking-tight">
                          {formatRupiah(pesanan.total_bayar)}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                          pesanan.status_bayar === "Lunas"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                        }`}
                      >
                        {pesanan.status_bayar}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 pt-1">
                      <span>Sudah Terbayar</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(pesanan.jumlah_terbayar)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-bold text-rose-800">Sisa Tagihan</span>
                      <span className="font-black text-sm text-rose-800">
                        {formatRupiah(pesanan.total_bayar - pesanan.jumlah_terbayar)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pemeriksaan Bukti Pembayaran (Khusus Admin) */}
              {isAdmin && (
                <div className="p-5 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-4">
                  <div className="flex items-center space-x-2 pb-3 border-b border-[#e0d5b8]">
                    <i className="fa-solid fa-credit-card text-[#17382d] text-sm"></i>
                    <h3 className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider">
                      Pemeriksaan Bukti Pembayaran
                    </h3>
                  </div>

                  {daftarBayar.length === 0 ? (
                    <p className="text-xs text-stone-400 py-3 text-center font-medium">
                      Belum ada bukti pembayaran yang diunggah pelanggan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {daftarBayar.map((bayar) => (
                        <div
                          key={bayar.id}
                          className="p-3.5 rounded-xl bg-[#fbf6e9] border border-[#e0d5b8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-stone-900">{bayar.jenis}</span>
                              <span className="text-stone-300">•</span>
                              <span className="font-medium text-stone-600">{bayar.metode}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  bayar.status === "Dikonfirmasi"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : bayar.status === "Ditolak"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {bayar.status}
                              </span>
                            </div>
                            <span className="text-sm font-black text-stone-900 block">
                              {formatRupiah(bayar.jumlah)}
                            </span>
                            {bayar.signedUrl && (
                              <a
                                href={bayar.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 text-rose-600 font-bold hover:underline mt-0.5"
                              >
                                <i className="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                                <span>Buka Bukti Transfer</span>
                              </a>
                            )}
                          </div>

                          {bayar.status === "Menunggu Konfirmasi" && (
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                type="button"
                                disabled={sedangProses}
                                onClick={() => handleAksiPembayaran(bayar.id, "konfirmasi")}
                                className="h-[34px] px-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer shadow-sm"
                              >
                                Konfirmasi
                              </button>
                              <button
                                type="button"
                                disabled={sedangProses}
                                onClick={() => handleAksiPembayaran(bayar.id, "tolak")}
                                className="h-[34px] px-3.5 rounded-xl font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs transition cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Riwayat Status Pesanan */}
              <div className="p-5 rounded-2xl bg-[#fffdf6] border border-[#e0d5b8] space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-[#e0d5b8]">
                  <i className="fa-solid fa-clock-rotate-left text-stone-600 text-sm"></i>
                  <h3 className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider">
                    Riwayat Status Pesanan
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  {riwayat.length === 0 ? (
                    <p className="text-stone-400 py-1">Belum ada catatan riwayat status.</p>
                  ) : (
                    riwayat.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 pb-3 border-b border-dashed border-[#e0d5b8] last:border-b-0 last:pb-0"
                      >
                        <div className="w-2 h-2 rounded-full bg-rose-600 mt-1 flex-shrink-0"></div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-stone-900">{r.keterangan}</p>
                          <p className="text-[11px] font-medium text-stone-500">
                            {formatTanggalIndonesia(r.dibuat_pada)}{" "}
                            {r.profil?.nama ? `• oleh ${r.profil.nama}` : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none bg-[#fbf6e9] border-t border-[#e0d5b8] px-6 py-3.5 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-medium">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-semibold text-[10px]">ESC</kbd> untuk menutup
          </span>
          <button
            type="button"
            onClick={onTutup}
            className="h-[36px] px-5 rounded-xl border-2 border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}
