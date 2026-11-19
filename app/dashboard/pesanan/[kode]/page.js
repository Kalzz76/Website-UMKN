"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";
import ModalPesan from "@/components/ModalPesan";

export default function DetailPesananDashboardPage({ params }) {
  const unwrappedParams = use(params);
  const kodePesanan = unwrappedParams.kode;

  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [pilihan, setPilihan] = useState([]);
  const [daftarBayar, setDaftarBayar] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [fotoReferensiUrl, setFotoReferensiUrl] = useState(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null);
  const [fotoBentukKustomUrl, setFotoBentukKustomUrl] = useState(null);
  const [fotoGambarKustomUrl, setFotoGambarKustomUrl] = useState(null);

  const [modalBatalBuka, setModalBatalBuka] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSedangMemuat(false);
      return;
    }

    const { data: prof } = await supabase
      .from("profil")
      .select("role, nama")
      .eq("id", user.id)
      .single();

    if (prof) setProfil(prof);

    const { data: pData } = await supabase
      .from("pesanan")
      .select("*, zona_ongkir(nama)")
      .eq("kode_pesanan", kodePesanan)
      .single();

    if (!pData) {
      setSedangMemuat(false);
      return;
    }

    setPesanan(pData);

    const { data: pilData } = await supabase
      .from("pesanan_pilihan")
      .select("*")
      .eq("id_pesanan", pData.id)
      .order("id", { ascending: true });
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

    if (pData.foto_bentuk_kustom) {
      const { data: signedBentuk } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(pData.foto_bentuk_kustom, 3600);
      if (signedBentuk) setFotoBentukKustomUrl(signedBentuk.signedUrl);
    } else {
      setFotoBentukKustomUrl(null);
    }

    if (pData.foto_gambar_kustom) {
      const { data: signedGambar } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(pData.foto_gambar_kustom, 3600);
      if (signedGambar) setFotoGambarKustomUrl(signedGambar.signedUrl);
    } else {
      setFotoGambarKustomUrl(null);
    }

    if (prof?.role === "admin") {
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
          bayarWithUrl.push({ ...item, buktiUrl: url });
        }
        setDaftarBayar(bayarWithUrl);
      }
    }

    const { data: riwayatData } = await supabase
      .from("riwayat_pesanan")
      .select("*, profil(nama)")
      .eq("id_pesanan", pData.id)
      .order("dibuat_pada", { ascending: false });
    if (riwayatData) setRiwayat(riwayatData);

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, [kodePesanan]);

  async function ubahStatusPesanan(statusBaru) {
    setSedangProses(true);
    const res = await fetch(`/api/pesanan/${kodePesanan}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_pesanan: statusBaru }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal mengubah status pesanan.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function handleBatalkanPesanan(e) {
    e.preventDefault();
    if (!alasanBatal.trim()) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: "Alasan pembatalan wajib diisi.",
        tipe: "error",
      });
      return;
    }

    setSedangProses(true);
    const res = await fetch(`/api/pesanan/${kodePesanan}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_pesanan: "Dibatalkan",
        alasan_batal: alasanBatal.trim(),
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal membatalkan pesanan.",
        tipe: "error",
      });
      return;
    }

    setModalBatalBuka(false);
    setAlasanBatal("");
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function handleAksiPembayaran(idBayar, aksi) {
    const konfirm = window.confirm(
      `Apakah Anda yakin ingin ${
        aksi === "konfirmasi" ? "mengonfirmasi" : "menolak"
      } pembayaran ini?`
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
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal memproses pembayaran.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  function getBadgeStatusPesanan(st) {
    if (st === "Menunggu Pembayaran") return "bg-stone-100 text-stone-700";
    if (st === "Diterima") return "bg-emerald-100 text-emerald-800";
    if (st === "Sedang Dibuat") return "bg-amber-100 text-amber-800";
    if (st === "Siap") return "bg-teal-100 text-teal-800";
    if (st === "Dikirim") return "bg-sky-100 text-sky-800";
    if (st === "Selesai") return "bg-[#17382d] text-emerald-100";
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeStatusBayar(st) {
    if (st === "Lunas") return "bg-emerald-100 text-emerald-800";
    if (st === "DP Dibayar") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  }

  if (sedangMemuat) {
    return (
      <div className="content-card p-12 text-center text-stone-400">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
        <p className="text-sm font-medium">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="content-card p-12 text-center text-stone-400">
        <p className="text-sm font-medium text-stone-700">Pesanan tidak ditemukan.</p>
        <Link
          href="/dashboard/pesanan"
          className="mt-4 inline-block text-xs font-semibold text-rose-600 hover:underline"
        >
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const isAdmin = profil?.role === "admin";
  const status = pesanan.status_pesanan;

  const grupPilihan = {};
  for (let i = 0; i < pilihan.length; i++) {
    const p = pilihan[i];
    const gName = p.nama_grup || "Opsi";
    if (!grupPilihan[gName]) grupPilihan[gName] = [];
    grupPilihan[gName].push(p);
  }

  let totalRincianBaris = 0;
  for (let i = 0; i < pilihan.length; i++) {
    totalRincianBaris += Number(pilihan[i].harga || 0) * Number(pilihan[i].jumlah || 1);
  }
  const adaSelisihTotal = isAdmin && totalRincianBaris !== Number(pesanan.total_kue || 0);

  const desain = pesanan.desain_json && typeof pesanan.desain_json === "object" ? pesanan.desain_json : null;
  const itemsDesain = Array.isArray(desain?.items) ? desain.items : [];
  const teksItems = itemsDesain.filter((it) => it.t === "text" && it.text);
  const stikerItems = itemsDesain.filter((it) => it.t === "emoji");

  const stikerPerKategori = {};
  for (let i = 0; i < stikerItems.length; i++) {
    const s = stikerItems[i];
    const cat = s.k || s.kode_visual || "Stiker";
    if (!stikerPerKategori[cat]) stikerPerKategori[cat] = [];
    stikerPerKategori[cat].push(s.e || "✨");
  }

  return (
    <div className="space-y-6">
      <div className="content-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/dashboard/pesanan"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-rose-600 transition"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali ke Daftar Pesanan</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                {pesanan.kode_pesanan}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeStatusPesanan(
                  pesanan.status_pesanan
                )}`}
              >
                {pesanan.status_pesanan}
              </span>
              {isAdmin && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeStatusBayar(
                    pesanan.status_bayar
                  )}`}
                >
                  {pesanan.status_bayar}
                </span>
              )}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 whitespace-nowrap">
                {pesanan.metode_pengiriman === "Ambil" ? "Ambil di Tempat" : "Kirim"}
              </span>
            </div>

            <p className="text-xs font-medium text-stone-500">
              Dipesan pada {formatTanggalIndonesia(pesanan.dibuat_pada)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status === "Diterima" && (
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => ubahStatusPesanan("Sedang Dibuat")}
                className="h-[42px] px-5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
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
                className="h-[42px] px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
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
                className="h-[42px] px-5 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
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
                className="h-[42px] px-5 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
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
                className="h-[42px] px-5 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Selesaikan (Pesanan Tiba)</span>
              </button>
            )}

            {isAdmin && ["Menunggu Pembayaran", "Diterima"].includes(status) && (
              <button
                type="button"
                onClick={() => setModalBatalBuka(true)}
                className="h-[42px] px-4 rounded-xl font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs transition cursor-pointer inline-flex items-center space-x-2"
              >
                <i className="fa-solid fa-ban"></i>
                <span>Batalkan Pesanan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-cake-candles text-amber-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">Visual Preview & Galeri Foto</h3>
            </div>

            <div className="py-4 flex flex-col items-center justify-center">
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
                  <span className="text-[10px] font-semibold text-stone-500 bg-[#ede2cd] px-2.5 py-0.5 rounded-full">
                    Snapshot Desain 3D Studio
                  </span>
                </div>
              ) : (
                <PreviewKue
                  pilihan={pilihan}
                  tulisan_kue={pesanan.tulisan_kue}
                  className="w-full max-w-[240px] h-auto drop-shadow-md"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {fotoBentukKustomUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                    Bentuk Kustom:
                  </span>
                  <a
                    href={fotoBentukKustomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative"
                  >
                    <img
                      src={fotoBentukKustomUrl}
                      alt="Bentuk Kustom"
                      className="w-full h-24 object-contain rounded-xl border border-[#e0d5b8] bg-white p-1"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-1 text-[9px]">
                      <i className="fa-solid fa-magnifying-glass-plus"></i>
                    </span>
                  </a>
                </div>
              )}

              {fotoGambarKustomUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                    Gambar Kustom:
                  </span>
                  <a
                    href={fotoGambarKustomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative"
                  >
                    <img
                      src={fotoGambarKustomUrl}
                      alt="Gambar Kustom"
                      className="w-full h-24 object-contain rounded-xl border border-[#e0d5b8] bg-white p-1"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-1 text-[9px]">
                      <i className="fa-solid fa-magnifying-glass-plus"></i>
                    </span>
                  </a>
                </div>
              )}
            </div>

            {pesanan.tulisan_kue && (
              <div className="pt-3 border-t border-dashed border-stone-200 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                  Tulisan di Atas Kue:
                </span>
                <p className="text-sm font-extrabold text-[#1d3b2e] bg-[#fffdf6] border border-[#e0d5b8] p-3 rounded-xl italic">
                  &ldquo;{pesanan.tulisan_kue}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-dashed border-stone-200 space-y-1.5">
              <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider flex items-center space-x-1.5">
                <i className="fa-solid fa-message text-stone-400"></i>
                <span>Catatan Asli dari Pemesan:</span>
              </span>
              {pesanan.catatan && pesanan.catatan.trim() ? (
                <div className="p-3.5 rounded-xl bg-[#fffdf6] border border-[#e0d5b8]">
                  <p className="text-xs font-semibold text-stone-800 leading-relaxed whitespace-pre-line italic">
                    &ldquo;{pesanan.catatan}&rdquo;
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-stone-400 bg-[#fffdf6] border border-[#e0d5b8] p-3 rounded-xl">
                  Tidak ada catatan khusus dari pemesan.
                </p>
              )}
            </div>

            {fotoReferensiUrl && (
              <div className="pt-3 border-t border-dashed border-stone-200 space-y-2">
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
                      className="w-28 h-28 object-cover rounded-xl border-2 border-[#e0d5b8] group-hover:opacity-90 shadow-sm transition"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white rounded-md px-1.5 py-0.5 text-[10px]">
                      <i className="fa-solid fa-magnifying-glass-plus"></i>
                    </span>
                  </div>
                </a>
              </div>
            )}
          </div>

          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-clock-rotate-left text-stone-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">Riwayat Status Pesanan</h3>
            </div>
            <div className="space-y-3 text-xs">
              {riwayat.length === 0 ? (
                <p className="text-stone-400 py-2">Belum ada catatan riwayat status.</p>
              ) : (
                riwayat.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 pb-3 border-b border-dashed border-stone-200 last:border-b-0 last:pb-0"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 flex-shrink-0"></div>
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
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-user-check text-stone-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">
                Informasi Pemesan & Pengambilan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Nama Pemesan</span>
                <span className="font-bold text-stone-900 text-sm block">
                  {pesanan.nama_penerima}
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Nomor WhatsApp</span>
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

              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Jadwal Pengambilan</span>
                <span className="font-bold text-stone-900 block">
                  {formatTanggalIndonesia(pesanan.tanggal_ambil)} pukul{" "}
                  {pesanan.jam_ambil?.slice(0, 5)} WIB
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Metode Pengiriman</span>
                <span className="font-bold text-stone-900 block">
                  {pesanan.metode_pengiriman === "Ambil"
                    ? "Ambil Sendiri di Toko"
                    : `Kirim ke Alamat (${pesanan.zona_ongkir?.nama || "Kurir"})`}
                </span>
              </div>

              {pesanan.metode_pengiriman === "Kirim" && (
                <div className="sm:col-span-2 pt-3 border-t border-dashed border-stone-200 space-y-1">
                  <span className="font-semibold text-stone-500 block">
                    Alamat Lengkap Pengiriman:
                  </span>
                  <p className="font-medium text-stone-800 leading-relaxed bg-[#fffdf6] border border-[#e0d5b8] p-3 rounded-xl">
                    {pesanan.alamat}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="content-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-wand-magic-sparkles text-amber-600 text-sm"></i>
                <h3 className="text-sm font-bold text-[#1d3b2e] uppercase tracking-wider">
                  Spesifikasi Kustomisasi
                </h3>
              </div>
              {desain?.nama_template && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Template: {desain.nama_template}
                </span>
              )}
            </div>

            <div className="divide-y divide-[#e0d5b8] text-xs">
              {Object.entries(grupPilihan).map(([namaGrup, items]) => (
                <div key={namaGrup} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-stone-500 flex items-center space-x-2">
                    <span>{namaGrup}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {items.map((it, idx) => (
                      <span
                        key={idx}
                        className="font-bold text-stone-900 bg-[#fbf6e9] border border-[#e0d5b8] px-3 py-1 rounded-lg inline-flex items-center space-x-1.5"
                      >
                        {it.warna && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block"
                            style={{ backgroundColor: it.warna }}
                          ></span>
                        )}
                        <span>
                          {it.nama_item}
                          {it.jumlah > 1 ? ` x ${it.jumlah}` : ""}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] font-medium text-stone-500 ml-1">
                            ({it.harga === 0 ? "Termasuk" : formatRupiah(it.harga * (it.jumlah || 1))})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {(teksItems.length > 0 || Object.keys(stikerPerKategori).length > 0) && (
              <div className="pt-3 border-t border-dashed border-[#e0d5b8] space-y-3">
                <span className="text-xs font-bold text-[#1d3b2e] uppercase tracking-wider block">
                  Elemen di Kue:
                </span>

                {teksItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-500">Teks & Gaya:</span>
                    <div className="space-y-1">
                      {teksItems.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-[#e0d5b8] text-xs flex flex-wrap items-center justify-between gap-2"
                        >
                          <span className="font-bold text-stone-900">&ldquo;{t.text}&rdquo;</span>
                          <span className="text-[11px] text-stone-500">
                            Font: {t.font || "Bawaan"} • Ukuran: {t.px || 32}px • Posisi: {t.align || "Tengah"} • Efek: {t.fx || "Normal"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(stikerPerKategori).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-500">Hiasan & Stiker:</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stikerPerKategori).map(([kategori, emojis]) => (
                        <div
                          key={kategori}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#e0d5b8] text-xs flex items-center space-x-2"
                        >
                          <span className="font-bold text-stone-800">{kategori} ({emojis.length}):</span>
                          <span className="tracking-widest">{emojis.join(" ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="content-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-receipt text-[#17382d] text-sm"></i>
                  <h3 className="text-sm font-bold text-[#1d3b2e] uppercase tracking-wider">
                    Rincian Biaya & Tagihan
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-stone-500 bg-[#ede2cd] px-2.5 py-0.5 rounded-full">
                  Invoice
                </span>
              </div>

              {adaSelisihTotal && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <i className="fa-solid fa-triangle-exclamation text-rose-500 text-sm"></i>
                  <span>
                    Peringatan: Jumlah total rincian baris ({formatRupiah(totalRincianBaris)}) tidak sama dengan total kue ({formatRupiah(pesanan.total_kue)}).
                  </span>
                </div>
              )}

              <div className="divide-y divide-[#e0d5b8] text-xs">
                {pilihan.map((p, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-500">{p.nama_grup}:</span>
                      <span className="text-stone-900 font-bold">
                        {p.nama_item}
                        {p.jumlah > 1 ? ` x ${p.jumlah}` : ""}
                      </span>
                    </div>
                    <span className="font-bold text-stone-900">
                      {p.harga === 0 ? "Termasuk" : formatRupiah(p.harga * (p.jumlah || 1))}
                    </span>
                  </div>
                ))}
              </div>

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
                <div className="flex justify-between items-center p-4 rounded-2xl bg-[#17382d] text-white my-2 shadow-sm">
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
                {pesanan.persen_dp_saat_pesan && (
                  <div className="flex justify-between text-stone-600">
                    <span>Tagihan DP ({pesanan.persen_dp_saat_pesan}%)</span>
                    <span className="font-bold text-stone-900">{formatRupiah(pesanan.jumlah_dp)}</span>
                  </div>
                )}
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
            </div>
          )}

          {isAdmin && (
            <div className="content-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
                <i className="fa-solid fa-credit-card text-stone-600 text-sm"></i>
                <h3 className="text-sm font-bold text-stone-900">Pemeriksaan Bukti Pembayaran</h3>
              </div>

              {daftarBayar.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center font-medium">
                  Belum ada bukti pembayaran yang diunggah pelanggan.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftarBayar.map((bayar) => (
                    <div
                      key={bayar.id}
                      className="p-4 rounded-2xl bg-[#fffdf6] border-2 border-[#e0d5b8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900">{bayar.jenis}</span>
                          <span className="text-stone-300">•</span>
                          <span className="font-black text-[#1d3b2e]">
                            {formatRupiah(bayar.jumlah)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {bayar.metode} • {formatTanggalIndonesia(bayar.dibuat_pada)}
                        </p>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
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

                      <div className="flex items-center space-x-2">
                        {bayar.buktiUrl && (
                          <a
                            href={bayar.buktiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-[36px] px-3 rounded-xl border border-[#dcd3c1] bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs inline-flex items-center space-x-1.5 transition"
                          >
                            <i className="fa-solid fa-image text-amber-600"></i>
                            <span>Bukti</span>
                          </a>
                        )}

                        {bayar.status === "Menunggu Konfirmasi" && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled={sedangProses}
                              onClick={() => handleAksiPembayaran(bayar.id, "konfirmasi")}
                              className="h-[36px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-sm transition cursor-pointer"
                            >
                              <i className="fa-solid fa-check"></i>
                              <span>Konfirmasi</span>
                            </button>
                            <button
                              type="button"
                              disabled={sedangProses}
                              onClick={() => handleAksiPembayaran(bayar.id, "tolak")}
                              className="h-[36px] px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer"
                            >
                              <i className="fa-solid fa-xmark"></i>
                              <span>Tolak</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalBatalBuka && (
        <div className="fixed inset-0 z-50 bg-[#17382d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm">Batalkan Pesanan</h3>
              <button
                type="button"
                onClick={() => setModalBatalBuka(false)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleBatalkanPesanan} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Alasan Pembatalan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Stok bahan habis, pelanggan meminta pembatalan..."
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 outline-none focus:border-rose-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBatalBuka(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {sedangProses ? "Memproses..." : "Ya, Batalkan"}
                </button>
              </div>
            </form>
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
    </div>
  );
}
