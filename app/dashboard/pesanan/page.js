"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalSingkat, formatTanggalIndonesia } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";
import ModalPesan from "@/components/ModalPesan";

export default function PesananDashboardPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [daftarPesanan, setDaftarPesanan] = useState([]);
  const [profil, setProfil] = useState(null);
  const [thumbnailMap, setThumbnailMap] = useState({});
  const [pilihanMap, setPilihanMap] = useState({});

  const [filterStatus, setFilterStatus] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [kataKunci, setKataKunci] = useState("");

  const [halaman, setHalaman] = useState(1);
  const [totalBaris, setTotalBaris] = useState(0);
  const batasPerHalaman = 10;

  const [drawerKode, setDrawerKode] = useState(null);
  const [drawerBuka, setDrawerBuka] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPesanan, setDetailPesanan] = useState(null);
  const [detailPilihan, setDetailPilihan] = useState([]);
  const [detailBayar, setDetailBayar] = useState([]);
  const [detailRiwayat, setDetailRiwayat] = useState([]);
  const [detailFotoRefUrl, setDetailFotoRefUrl] = useState(null);
  const [detailFotoPrevUrl, setDetailFotoPrevUrl] = useState(null);
  const [detailFotoBentukUrl, setDetailFotoBentukUrl] = useState(null);
  const [detailFotoGambarUrl, setDetailFotoGambarUrl] = useState(null);

  const [modalBatalBuka, setModalBatalBuka] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatPesanan() {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (prof) setProfil(prof);

    let query = supabase
      .from("pesanan")
      .select("*", { count: "exact" });

    if (filterStatus) {
      query = query.eq("status_pesanan", filterStatus);
    }

    if (filterTanggal) {
      query = query.eq("tanggal_ambil", filterTanggal);
    }

    if (kataKunci.trim()) {
      const q = `%${kataKunci.trim()}%`;
      query = query.or(`kode_pesanan.ilike.${q},nama_penerima.ilike.${q}`);
    }

    query = query
      .order("tanggal_ambil", { ascending: true })
      .order("jam_ambil", { ascending: true });

    const dari = (halaman - 1) * batasPerHalaman;
    const sampai = dari + batasPerHalaman - 1;
    query = query.range(dari, sampai);

    const { data, count, error } = await query;

    if (!error && data) {
      setDaftarPesanan(data);
      setTotalBaris(count || 0);

      const ids = data.map((x) => x.id);
      if (ids.length > 0) {
        const { data: pilData } = await supabase
          .from("pesanan_pilihan")
          .select("id_pesanan, peran_visual, warna, kode_visual")
          .in("id_pesanan", ids);

        const pMap = {};
        if (pilData) {
          for (let i = 0; i < pilData.length; i++) {
            const item = pilData[i];
            if (!pMap[item.id_pesanan]) pMap[item.id_pesanan] = [];
            pMap[item.id_pesanan].push(item);
          }
        }
        setPilihanMap(pMap);

        const pathsToSign = data.map((x) => x.foto_preview).filter(Boolean);
        if (pathsToSign.length > 0) {
          try {
            const resSign = await fetch("/api/berkas/signed-urls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paths: pathsToSign, bucket: "referensi-kue" }),
            });
            const jsonSign = await resSign.json();
            const thumbObj = {};
            for (let i = 0; i < data.length; i++) {
              const item = data[i];
              if (item.foto_preview && jsonSign.urls?.[item.foto_preview]) {
                thumbObj[item.id] = jsonSign.urls[item.foto_preview];
              }
            }
            setThumbnailMap(thumbObj);
          } catch {}
        }
      }
    }
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatPesanan();
  }, [filterStatus, filterTanggal, halaman]);

  async function muatDetailPesanan(kode) {
    if (!kode) return;
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/pesanan/${kode}`);
      const json = await res.json();
      if (!res.ok || !json.sukses) {
        setDetailPesanan(null);
        setDetailLoading(false);
        return;
      }

      setDetailPesanan(json.pesanan);
      setDetailPilihan(json.pilihan || []);
      setDetailBayar(json.pembayaran || []);
      setDetailRiwayat(json.riwayat || []);
      setDetailFotoPrevUrl(json.urls?.fotoPreview || null);
      setDetailFotoRefUrl(json.urls?.fotoReferensi || null);
      setDetailFotoBentukUrl(json.urls?.fotoBentukKustom || null);
      setDetailFotoGambarUrl(json.urls?.fotoGambarKustom || null);
    } catch {
      setDetailPesanan(null);
    }
    setDetailLoading(false);
  }

  function bukaDrawer(kode) {
    setDrawerKode(kode);
    setDrawerBuka(true);
    muatDetailPesanan(kode);
  }

  function tutupDrawer() {
    setDrawerBuka(false);
    setDrawerKode(null);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const k = params.get("kode");
      if (k) {
        bukaDrawer(k);
      }
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && drawerBuka) {
        tutupDrawer();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerBuka]);

  async function ubahStatusPesanan(statusBaru) {
    if (!drawerKode) return;
    setSedangProses(true);
    const res = await fetch(`/api/pesanan/${drawerKode}/status`, {
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
    muatDetailPesanan(drawerKode);
    muatPesanan();
  }

  async function handleBatalkanPesanan(e) {
    e.preventDefault();
    if (!drawerKode) return;
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
    const res = await fetch(`/api/pesanan/${drawerKode}/status`, {
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
    muatDetailPesanan(drawerKode);
    muatPesanan();
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
    if (drawerKode) {
      muatDetailPesanan(drawerKode);
    }
    muatPesanan();
  }

  function handleCari(e) {
    e.preventDefault();
    setHalaman(1);
    muatPesanan();
  }

  function handleReset() {
    setFilterStatus("");
    setFilterTanggal("");
    setKataKunci("");
    setHalaman(1);
  }

  function getBadgeStatusPesanan(status) {
    if (status === "Menunggu Pembayaran") return "bg-stone-100 text-stone-700";
    if (status === "Diterima") return "bg-emerald-100 text-emerald-800";
    if (status === "Sedang Dibuat") return "bg-amber-100 text-amber-800";
    if (status === "Siap") return "bg-teal-100 text-teal-800";
    if (status === "Dikirim") return "bg-sky-100 text-sky-800";
    if (status === "Selesai") return "bg-[#17382d] text-emerald-100";
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeStatusBayar(status) {
    if (status === "Lunas") return "bg-emerald-100 text-emerald-800";
    if (status === "DP Dibayar") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  }

  const isAdmin = profil?.role === "admin";
  const totalHalaman = Math.ceil(totalBaris / batasPerHalaman) || 1;

  const grupPilihan = {};
  for (let i = 0; i < detailPilihan.length; i++) {
    const item = detailPilihan[i];
    const gName = item.nama_grup || "Opsi";
    if (!grupPilihan[gName]) grupPilihan[gName] = [];
    grupPilihan[gName].push(item);
  }

  const desain = detailPesanan?.desain_json && typeof detailPesanan.desain_json === "object" ? detailPesanan.desain_json : null;
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

  function renderKontenDetail() {
    if (detailLoading) {
      return (
        <div className="py-20 text-center text-stone-400">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-rose-500" />
          <p className="text-xs font-semibold text-stone-600">
            Memuat rincian pesanan {drawerKode}...
          </p>
        </div>
      );
    }

    if (!detailPesanan) {
      return (
        <div className="py-20 text-center text-stone-400">
          <i className="fa-solid fa-circle-exclamation text-2xl mb-2 text-stone-300" />
          <p className="text-xs font-semibold text-stone-700">
            Pesanan tidak ditemukan.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3.5">
        <div className="p-3 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] flex items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#17382d] text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-2xs">
              {detailPesanan.nama_penerima?.slice(0, 2).toUpperCase() || "KP"}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#1d3b2e] truncate">
                {detailPesanan.nama_penerima}
              </h4>
              <a
                href={`https://wa.me/${detailPesanan.no_wa.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-emerald-700 hover:underline inline-flex items-center space-x-1"
              >
                <i className="fa-brands fa-whatsapp text-[11px]" />
                <span className="truncate">{detailPesanan.no_wa}</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${getBadgeStatusPesanan(
                detailPesanan.status_pesanan
              )}`}
            >
              {detailPesanan.status_pesanan}
            </span>
            {isAdmin && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${getBadgeStatusBayar(
                  detailPesanan.status_bayar
                )}`}
              >
                {detailPesanan.status_bayar}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {detailPesanan.status_pesanan === "Diterima" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Sedang Dibuat")}
              className="flex-1 min-w-[110px] h-[30px] px-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white text-[11px] transition cursor-pointer inline-flex items-center justify-center space-x-1 shadow-2xs"
            >
              <i className="fa-solid fa-fire-burner text-[10px]" />
              <span>Mulai Produksi</span>
            </button>
          )}

          {detailPesanan.status_pesanan === "Sedang Dibuat" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Siap")}
              className="flex-1 min-w-[110px] h-[30px] px-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] transition cursor-pointer inline-flex items-center justify-center space-x-1 shadow-2xs"
            >
              <i className="fa-solid fa-check text-[10px]" />
              <span>Tandai Siap</span>
            </button>
          )}

          {isAdmin && detailPesanan.status_pesanan === "Siap" && detailPesanan.metode_pengiriman === "Kirim" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Dikirim")}
              className="flex-1 min-w-[110px] h-[30px] px-3 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white text-[11px] transition cursor-pointer inline-flex items-center justify-center space-x-1 shadow-2xs"
            >
              <i className="fa-solid fa-truck text-[10px]" />
              <span>Kirimkan Kue</span>
            </button>
          )}

          {isAdmin && detailPesanan.status_pesanan === "Siap" && detailPesanan.metode_pengiriman === "Ambil" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Selesai")}
              className="flex-1 min-w-[110px] h-[30px] px-3 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] transition cursor-pointer inline-flex items-center justify-center space-x-1 shadow-2xs"
            >
              <i className="fa-solid fa-circle-check text-[10px]" />
              <span>Selesaikan</span>
            </button>
          )}

          {isAdmin && detailPesanan.status_pesanan === "Dikirim" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Selesai")}
              className="flex-1 min-w-[110px] h-[30px] px-3 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] transition cursor-pointer inline-flex items-center justify-center space-x-1 shadow-2xs"
            >
              <i className="fa-solid fa-circle-check text-[10px]" />
              <span>Selesaikan</span>
            </button>
          )}

          {isAdmin && ["Menunggu Pembayaran", "Diterima"].includes(detailPesanan.status_pesanan) && (
            <button
              type="button"
              onClick={() => setModalBatalBuka(true)}
              className="h-[30px] px-2.5 rounded-xl font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] transition cursor-pointer inline-flex items-center space-x-1"
            >
              <i className="fa-solid fa-ban text-[10px]" />
              <span>Batal</span>
            </button>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center space-x-1">
              <i className="fa-solid fa-cake-candles text-amber-600 text-[11px]" />
              <span>Visual Kue</span>
            </span>
            <span className="text-[10px] text-stone-500 font-medium">
              {formatTanggalSingkat(detailPesanan.tanggal_ambil)} {detailPesanan.jam_ambil?.slice(0, 5)} WIB
            </span>
          </div>

          <div className="flex justify-center py-1">
            {detailFotoPrevUrl ? (
              <div className="relative group w-full flex justify-center">
                <img
                  src={detailFotoPrevUrl}
                  alt="Snapshot 3D"
                  className="w-full max-h-[220px] object-contain rounded-xl border border-[#e0d5b8] bg-[#fbf6e9] p-1 shadow-2xs"
                />
                <a
                  href={detailFotoPrevUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-black/60 hover:bg-black text-white text-[9px] font-bold px-2 py-1 rounded-lg transition"
                >
                  <i className="fa-solid fa-magnifying-glass-plus mr-1" />
                  <span>Perbesar</span>
                </a>
              </div>
            ) : (
              <PreviewKue
                pilihan={detailPilihan}
                tulisan_kue={detailPesanan.tulisan_kue}
                className="w-full max-w-[150px] h-auto drop-shadow-2xs"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {detailFotoBentukUrl && (
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-stone-400 block uppercase">
                  Bentuk Kustom
                </span>
                <a
                  href={detailFotoBentukUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group"
                >
                  <img
                    src={detailFotoBentukUrl}
                    alt="Bentuk Kustom"
                    className="w-full h-14 object-contain rounded-lg border border-[#e0d5b8] bg-white p-0.5"
                  />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white rounded p-0.5 text-[7px]">
                    <i className="fa-solid fa-magnifying-glass-plus" />
                  </span>
                </a>
              </div>
            )}

            {detailFotoGambarUrl && (
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-stone-400 block uppercase">
                  Gambar Kustom
                </span>
                <a
                  href={detailFotoGambarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group"
                >
                  <img
                    src={detailFotoGambarUrl}
                    alt="Gambar Kustom"
                    className="w-full h-14 object-contain rounded-lg border border-[#e0d5b8] bg-white p-0.5"
                  />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white rounded p-0.5 text-[7px]">
                    <i className="fa-solid fa-magnifying-glass-plus" />
                  </span>
                </a>
              </div>
            )}
          </div>

          {detailPesanan.tulisan_kue && (
            <div className="pt-1 border-t border-dashed border-stone-200">
              <span className="text-[9px] font-bold text-stone-400 block uppercase">
                Tulisan di Kue
              </span>
              <p className="text-xs font-bold text-[#1d3b2e] bg-[#fbf6e9] border border-[#e0d5b8] p-1.5 rounded-lg italic mt-0.5">
                &ldquo;{detailPesanan.tulisan_kue}&rdquo;
              </p>
            </div>
          )}

          {detailPesanan.catatan && detailPesanan.catatan.trim() ? (
            <div className="pt-1 border-t border-dashed border-stone-200">
              <span className="text-[9px] font-bold text-stone-400 block uppercase">
                Catatan Pemesan
              </span>
              <p className="text-[11px] font-medium text-stone-800 bg-[#fbf6e9] border border-[#e0d5b8] p-1.5 rounded-lg whitespace-pre-line italic mt-0.5">
                &ldquo;{detailPesanan.catatan}&rdquo;
              </p>
            </div>
          ) : null}

          {detailFotoRefUrl && (
            <div className="pt-1 border-t border-dashed border-stone-200">
              <span className="text-[9px] font-bold text-stone-400 block uppercase mb-0.5">
                Foto Referensi
              </span>
              <a
                href={detailFotoRefUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block relative group"
              >
                <img
                  src={detailFotoRefUrl}
                  alt="Foto Referensi"
                  className="w-12 h-12 object-cover rounded-lg border border-[#e0d5b8] shadow-2xs"
                />
              </a>
            </div>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-1.5">
          <div className="flex items-center space-x-1 pb-1 border-b border-stone-100">
            <i className="fa-solid fa-location-dot text-rose-500 text-[11px]" />
            <h4 className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
              Pengambilan
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-stone-400 block text-[9px]">Metode</span>
              <span className="font-bold text-stone-900">
                {detailPesanan.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim Kurir"}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[9px]">Zona / Lokasi</span>
              <span className="font-bold text-stone-900">
                {detailPesanan.zona_ongkir?.nama || "Toko Cravely"}
              </span>
            </div>
            {detailPesanan.metode_pengiriman === "Kirim" && detailPesanan.alamat && (
              <div className="col-span-2 pt-1 border-t border-dashed border-stone-200">
                <span className="text-stone-400 block text-[9px]">Alamat</span>
                <p className="font-medium text-stone-800 bg-[#fbf6e9] border border-[#e0d5b8] p-1.5 rounded-lg mt-0.5">
                  {detailPesanan.alamat}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center space-x-1">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-600 text-[11px]" />
              <h4 className="text-[10px] font-bold text-[#1d3b2e] uppercase tracking-wider">
                Spesifikasi
              </h4>
            </div>
            {desain?.nama_template && (
              <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-200">
                {desain.nama_template}
              </span>
            )}
          </div>

          <div className="divide-y divide-[#e0d5b8] text-xs">
            {Object.entries(grupPilihan).map(([namaGrup, items]) => (
              <div key={namaGrup} className="py-1 flex items-center justify-between gap-1.5">
                <span className="font-semibold text-stone-500 text-[10px]">{namaGrup}</span>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {items.map((it, idx) => (
                    <span
                      key={idx}
                      className="font-bold text-stone-900 bg-[#fbf6e9] border border-[#e0d5b8] px-1.5 py-0.2 rounded text-[10px] inline-flex items-center space-x-1"
                    >
                      {it.warna && (
                        <span
                          className="w-2 h-2 rounded-full border border-stone-300 inline-block"
                          style={{ backgroundColor: it.warna }}
                        />
                      )}
                      <span>
                        {it.nama_item}
                        {it.jumlah > 1 ? ` x ${it.jumlah}` : ""}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {(teksItems.length > 0 || Object.keys(stikerPerKategori).length > 0) && (
            <div className="pt-1 border-t border-dashed border-[#e0d5b8] space-y-1 text-xs">
              {teksItems.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-stone-500">Teks Kue:</span>
                  {teksItems.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-1 rounded bg-[#fbf6e9] border border-[#e0d5b8] flex justify-between items-center text-[10px]"
                    >
                      <span className="font-bold text-stone-900">&ldquo;{t.text}&rdquo;</span>
                      <span className="text-[8px] text-stone-400">{t.font || "Bawaan"}</span>
                    </div>
                  ))}
                </div>
              )}
              {Object.keys(stikerPerKategori).length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-stone-500">Stiker:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(stikerPerKategori).map(([kategori, emojis]) => (
                      <div
                        key={kategori}
                        className="px-1.5 py-0.2 rounded bg-[#fbf6e9] border border-[#e0d5b8] text-[9px] flex items-center space-x-1"
                      >
                        <span className="font-bold text-stone-800">{kategori}:</span>
                        <span>{emojis.join(" ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <span className="text-[10px] font-bold text-[#1d3b2e] uppercase tracking-wider flex items-center space-x-1">
                <i className="fa-solid fa-receipt text-[#17382d] text-[11px]" />
                <span>Rincian Biaya</span>
              </span>
              <span className="text-[8px] font-bold text-stone-500 bg-[#ede2cd] px-1.5 py-0.2 rounded-full">
                Invoice
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-600 text-[10px]">
                <span>Subtotal Kue</span>
                <span className="font-bold text-stone-900">{formatRupiah(detailPesanan.total_kue)}</span>
              </div>
              {detailPesanan.ongkir > 0 && (
                <div className="flex justify-between text-stone-600 text-[10px]">
                  <span>Ongkir</span>
                  <span className="font-bold text-stone-900">{formatRupiah(detailPesanan.ongkir)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#17382d] text-white my-1">
                <div>
                  <span className="text-[8px] font-bold text-emerald-200 block uppercase">
                    Total
                  </span>
                  <span className="text-xs font-black">
                    {formatRupiah(detailPesanan.total_bayar)}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                    detailPesanan.status_bayar === "Lunas"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  {detailPesanan.status_bayar}
                </span>
              </div>
              <div className="flex justify-between text-stone-600 text-[10px]">
                <span>Terbayar</span>
                <span className="font-bold text-emerald-700">{formatRupiah(detailPesanan.jumlah_terbayar)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-0.5 border-t border-dashed border-stone-200 text-xs">
                <span className="font-bold text-rose-800 text-[10px]">Sisa Tagihan</span>
                <span className="font-black text-xs text-rose-800">
                  {formatRupiah(detailPesanan.total_bayar - detailPesanan.jumlah_terbayar)}
                </span>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-1.5">
            <div className="flex items-center space-x-1 pb-1 border-b border-stone-100">
              <i className="fa-solid fa-credit-card text-stone-600 text-[11px]" />
              <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">
                Bukti Bayar ({detailBayar.length})
              </h4>
            </div>

            {detailBayar.length === 0 ? (
              <p className="text-[10px] text-stone-400 py-1.5 text-center">
                Belum ada bukti pembayaran diunggah.
              </p>
            ) : (
              <div className="space-y-1">
                {detailBayar.map((bayar) => (
                  <div
                    key={bayar.id}
                    className="p-2 rounded-xl bg-[#fbf6e9] border border-[#e0d5b8] flex items-center justify-between gap-1.5 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-1 truncate text-[10px]">
                        <span className="font-bold text-stone-900">{bayar.jenis}</span>
                        <span className="text-stone-300">•</span>
                        <span className="font-bold text-[#1d3b2e]">
                          {formatRupiah(bayar.jumlah)}
                        </span>
                      </div>
                      <span
                        className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded ${
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

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {bayar.buktiUrl && (
                        <a
                          href={bayar.buktiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-[24px] px-1.5 rounded-lg border border-[#dcd3c1] bg-white hover:bg-stone-50 text-stone-700 font-bold text-[9px] inline-flex items-center space-x-1"
                        >
                          <i className="fa-solid fa-image text-amber-600 text-[8px]" />
                          <span>Foto</span>
                        </a>
                      )}
                      {bayar.status === "Menunggu Konfirmasi" && (
                        <>
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => handleAksiPembayaran(bayar.id, "konfirmasi")}
                            className="h-[24px] px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] inline-flex items-center space-x-0.5 cursor-pointer"
                          >
                            <i className="fa-solid fa-check text-[8px]" />
                            <span>Setuju</span>
                          </button>
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => handleAksiPembayaran(bayar.id, "tolak")}
                            className="h-[24px] px-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[9px] inline-flex items-center space-x-0.5 cursor-pointer"
                          >
                            <i className="fa-solid fa-xmark text-[8px]" />
                            <span>Tolak</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-1.5">
          <div className="flex items-center space-x-1 pb-1 border-b border-stone-100">
            <i className="fa-solid fa-clock-rotate-left text-stone-600 text-[11px]" />
            <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">
              Riwayat Status
            </h4>
          </div>
          <div className="space-y-1 text-xs">
            {detailRiwayat.length === 0 ? (
              <p className="text-stone-400 py-1 text-center text-[10px]">Belum ada riwayat.</p>
            ) : (
              detailRiwayat.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-1.5 pb-1 border-b border-dashed border-stone-100 last:border-b-0 last:pb-0"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-stone-900 text-[10px]">{r.keterangan}</p>
                    <p className="text-[9px] text-stone-400">
                      {formatTanggalSingkat(r.dibuat_pada)} {r.profil?.nama ? `• ${r.profil.nama}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0 w-full space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
          <form
            onSubmit={handleCari}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cari Pesanan
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Kode pesanan / nama..."
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-stone-400 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Status Pesanan
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setHalaman(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white"
              >
                <option value="">Semua Status</option>
                <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                <option value="Diterima">Diterima</option>
                <option value="Sedang Dibuat">Sedang Dibuat</option>
                <option value="Siap">Siap</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Ambil / Kirim
              </label>
              <input
                type="date"
                value={filterTanggal}
                onChange={(e) => {
                  setFilterTanggal(e.target.value);
                  setHalaman(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Filter
              </button>
              {(filterStatus || filterTanggal || kataKunci) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold rounded-xl text-xs transition cursor-pointer"
                  title="Reset Filter"
                >
                  <i className="fa-solid fa-rotate-left" />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-list-check text-rose-500" />
              <h2 className="text-base font-bold text-stone-900">
                Daftar Pesanan ({totalBaris})
              </h2>
            </div>
            {drawerBuka && (
              <span className="text-xs font-bold text-[#ba2b2b] bg-[#ba2b2b]/10 px-3 py-1 rounded-full border border-[#ba2b2b]/20 self-start sm:self-auto">
                Detail: {drawerKode}
              </span>
            )}
          </div>

          {sedangMemuat ? (
            <div className="py-12 text-center text-stone-400">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 block text-rose-500" />
              <span className="text-xs font-medium">Memuat data pesanan...</span>
            </div>
          ) : daftarPesanan.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <i className="fa-solid fa-box-open text-3xl mb-2 block text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">
                Belum ada pesanan ditemukan.
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Coba ubah kata kunci atau filter status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl w-12">Kue</th>
                    <th className="py-3 px-3 whitespace-nowrap">Kode</th>
                    <th className="py-3 px-3 whitespace-nowrap">Pelanggan</th>
                    <th className="py-3 px-3 whitespace-nowrap">Jadwal</th>
                    <th className="py-3 px-3 whitespace-nowrap">Pengiriman</th>
                    <th className="py-3 px-3 whitespace-nowrap">Status Pesanan</th>
                    {isAdmin && (
                      <th className="py-3 px-3 whitespace-nowrap">Status Bayar</th>
                    )}
                    {isAdmin && (
                      <th className="py-3 px-3 whitespace-nowrap">Total</th>
                    )}
                    <th className="py-3 px-3 text-right rounded-r-xl whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede2cd]">
                  {daftarPesanan.map((p) => {
                    const isDipilih = drawerBuka && drawerKode === p.kode_pesanan;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => bukaDrawer(p.kode_pesanan)}
                        className={`transition cursor-pointer ${
                          isDipilih
                            ? "bg-amber-100/70 border-l-4 border-[#ba2b2b]"
                            : "hover:bg-stone-50/70"
                        }`}
                      >
                        <td className="py-3 px-3 w-12">
                          {thumbnailMap[p.id] ? (
                            <img
                              src={thumbnailMap[p.id]}
                              alt="Thumbnail Kue"
                              className="w-10 h-10 object-contain rounded-lg border border-[#e0d5b8] bg-[#fbf6e9] p-0.5"
                            />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#e0d5b8] bg-[#fbf6e9] overflow-hidden">
                              <PreviewKue
                                pilihan={pilihanMap[p.id] || []}
                                tulisan_kue={p.tulisan_kue}
                                className="w-10 h-10"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              bukaDrawer(p.kode_pesanan);
                            }}
                            className={`text-left font-bold transition cursor-pointer ${
                              isDipilih ? "text-[#ba2b2b]" : "text-stone-900 hover:text-rose-600"
                            }`}
                          >
                            {p.kode_pesanan}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-medium text-stone-800 whitespace-nowrap">
                          <div>
                            <span className="font-semibold block text-xs">
                              {p.nama_penerima}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-normal">
                              {p.no_wa}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-stone-600 text-[11px] whitespace-nowrap">
                          {formatTanggalSingkat(p.tanggal_ambil)} {p.jam_ambil?.slice(0, 5)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 whitespace-nowrap">
                            {p.metode_pengiriman === "Ambil" ? "Ambil" : "Kirim"}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${getBadgeStatusPesanan(
                              p.status_pesanan
                            )}`}
                          >
                            {p.status_pesanan}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${getBadgeStatusBayar(
                                p.status_bayar
                              )}`}
                            >
                              {p.status_bayar}
                            </span>
                          </td>
                        )}
                        {isAdmin && (
                          <td className="py-3 px-3 font-bold text-stone-900 text-xs whitespace-nowrap">
                            {formatRupiah(p.total_bayar)}
                          </td>
                        )}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              bukaDrawer(p.kode_pesanan);
                            }}
                            className={`inline-flex items-center text-[11px] font-bold py-1 px-3 rounded-full transition whitespace-nowrap cursor-pointer shadow-2xs ${
                              isDipilih
                                ? "bg-[#ba2b2b] text-white"
                                : "text-rose-600 hover:text-rose-500 hover:bg-rose-50"
                            }`}
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalHalaman > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
              <span className="text-stone-500">
                Halaman {halaman} dari {totalHalaman}
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={halaman <= 1}
                  onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={halaman >= totalHalaman}
                  onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {drawerBuka && (
        <aside className="w-full lg:w-[380px] xl:w-[410px] flex-shrink-0 lg:sticky lg:top-4 bg-[#fbf6e9] border border-[#dfd4bd] rounded-3xl p-4 shadow-sm space-y-3 max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#e8dfc8]">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center font-bold text-xs">
                <i className="fa-solid fa-receipt text-[11px]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1d3b2e]">Detail Pesanan</h3>
                <p className="text-[10px] font-mono font-bold text-stone-500">{drawerKode}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={tutupDrawer}
                className="w-7 h-7 rounded-lg border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center text-xs transition cursor-pointer"
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {renderKontenDetail()}
          </div>

          <div className="flex items-center justify-end pt-2.5 border-t border-[#e8dfc8]">
            <button
              type="button"
              onClick={tutupDrawer}
              className="h-[32px] px-4 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </aside>
      )}

      {modalBatalBuka && (
        <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf6e9] border border-[#dfd4bd] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
              <h3 className="font-bold text-[#1d3b2e] text-sm">Batalkan Pesanan</h3>
              <button
                type="button"
                onClick={() => setModalBatalBuka(false)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white outline-none focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBatalBuka(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
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
