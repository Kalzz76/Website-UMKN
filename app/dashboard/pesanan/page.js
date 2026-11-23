"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalSingkat, formatTanggalIndonesia, formatTanggalWaktu, formatAngka } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";
import ModalPesan from "@/components/ModalPesan";

export default function PesananDashboardPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [daftarPesanan, setDaftarPesanan] = useState([]);
  const [profil, setProfil] = useState(null);
  const [thumbnailMap, setThumbnailMap] = useState({});
  const [pilihanMap, setPilihanMap] = useState({});
  const [isiRingkasMap, setIsiRingkasMap] = useState({});

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
  const [detailItems, setDetailItems] = useState([]);
  const [detailPilihan, setDetailPilihan] = useState([]);
  const [detailBayar, setDetailBayar] = useState([]);
  const [detailRiwayat, setDetailRiwayat] = useState([]);
  const [detailFotoRefUrl, setDetailFotoRefUrl] = useState(null);
  const [detailFotoPrevUrl, setDetailFotoPrevUrl] = useState(null);
  const [detailFotoBentukUrl, setDetailFotoBentukUrl] = useState(null);
  const [detailFotoGambarUrl, setDetailFotoGambarUrl] = useState(null);

  const [infoStokPesanan, setInfoStokPesanan] = useState(null);
  const [modalKurangiStokBuka, setModalKurangiStokBuka] = useState(false);
  const [modalKembalikanStokBuka, setModalKembalikanStokBuka] = useState(false);
  const [modalKonfirmasiBatalStokBuka, setModalKonfirmasiBatalStokBuka] = useState(false);
  const [sedangProsesStok, setSedangProsesStok] = useState(false);

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
        const [pilRes, itemRes] = await Promise.all([
          supabase
            .from("pesanan_pilihan")
            .select("id_pesanan, peran_visual, warna, kode_visual")
            .in("id_pesanan", ids),
          supabase
            .from("pesanan_item")
            .select("id_pesanan, jenis, nama_item, jumlah, foto_preview, produk(foto)")
            .in("id_pesanan", ids)
            .order("urutan", { ascending: true })
        ]);

        const pMap = {};
        if (pilRes.data) {
          for (let i = 0; i < pilRes.data.length; i++) {
            const item = pilRes.data[i];
            if (!pMap[item.id_pesanan]) pMap[item.id_pesanan] = [];
            pMap[item.id_pesanan].push(item);
          }
        }
        setPilihanMap(pMap);

        const itemsByOrder = {};
        const allItems = itemRes.data || [];
        for (let i = 0; i < allItems.length; i++) {
          const it = allItems[i];
          if (!itemsByOrder[it.id_pesanan]) itemsByOrder[it.id_pesanan] = [];
          itemsByOrder[it.id_pesanan].push(it);
        }

        const isiMap = {};
        const thumbObj = {};
        const pathsToSign = [];
        const pathToOrderMap = {};

        const { data: storagePublik } = supabase.storage.from("publik").getPublicUrl("");
        const basePublikUrl = storagePublik?.publicUrl ? storagePublik.publicUrl.replace(/\/+$/, "") : "";

        for (let i = 0; i < data.length; i++) {
          const p = data[i];
          const orderItems = itemsByOrder[p.id] || [];
          if (orderItems.length > 0) {
            isiMap[p.id] = orderItems
              .map((it) => (it.jumlah > 1 ? `${it.jumlah}x ` : "") + it.nama_item)
              .join(", ");
            const first = orderItems[0];
            if (first.jenis === "Custom" && first.foto_preview) {
              pathsToSign.push(first.foto_preview);
              pathToOrderMap[first.foto_preview] = p.id;
            } else if ((first.jenis === "Katalog" || first.jenis === "Siap") && first.produk?.foto) {
              const f = first.produk.foto;
              if (f.startsWith("http://") || f.startsWith("https://")) {
                thumbObj[p.id] = f;
              } else {
                thumbObj[p.id] = `${basePublikUrl}/${f.replace(/^\/+/, "")}`;
              }
            } else if (p.foto_preview) {
              pathsToSign.push(p.foto_preview);
              pathToOrderMap[p.foto_preview] = p.id;
            }
          } else {
            isiMap[p.id] = p.tulisan_kue ? "1x Kue Custom" : "1x Kue";
            if (p.foto_preview) {
              pathsToSign.push(p.foto_preview);
              pathToOrderMap[p.foto_preview] = p.id;
            }
          }
        }
        setIsiRingkasMap(isiMap);

        if (pathsToSign.length > 0) {
          try {
            const resSign = await fetch("/api/berkas/signed-urls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paths: pathsToSign, bucket: "referensi-kue" }),
            });
            const jsonSign = await resSign.json();
            for (let i = 0; i < pathsToSign.length; i++) {
              const path = pathsToSign[i];
              const orderId = pathToOrderMap[path];
              if (orderId && jsonSign.urls?.[path]) {
                thumbObj[orderId] = jsonSign.urls[path];
              }
            }
          } catch {}
        }
        setThumbnailMap(thumbObj);
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
        setInfoStokPesanan(null);
        setDetailLoading(false);
        return;
      }

      setDetailPesanan(json.pesanan);
      setDetailItems(json.items || []);
      setDetailPilihan(json.pilihan || []);
      setDetailBayar(json.pembayaran || []);
      setDetailRiwayat(json.riwayat || []);
      setDetailFotoPrevUrl(json.urls?.fotoPreview || null);
      setDetailFotoRefUrl(json.urls?.fotoReferensi || null);
      setDetailFotoBentukUrl(json.urls?.fotoBentukKustom || null);
      setDetailFotoGambarUrl(json.urls?.fotoGambarKustom || null);

      try {
        const resStok = await fetch(`/api/pesanan/${kode}/stok`);
        const jsonStok = await resStok.json();
        if (resStok.ok) {
          setInfoStokPesanan(jsonStok);
        } else {
          setInfoStokPesanan(null);
        }
      } catch {
        setInfoStokPesanan(null);
      }
    } catch {
      setDetailPesanan(null);
      setInfoStokPesanan(null);
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
    setInfoStokPesanan(null);
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

    if (detailPesanan?.stok_dipotong_pada) {
      setModalBatalBuka(false);
      setModalKonfirmasiBatalStokBuka(true);
      return;
    }

    await eksekusiBatalPesanan(false);
  }

  async function eksekusiBatalPesanan(kembalikanStok = false) {
    setSedangProses(true);

    if (kembalikanStok) {
      try {
        await fetch(`/api/pesanan/${drawerKode}/stok`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aksi: "kembalikan" }),
        });
      } catch {}
    }

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
    setModalKonfirmasiBatalStokBuka(false);
    setModalBatalBuka(false);
    setAlasanBatal("");

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal membatalkan pesanan.",
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

  async function handleKurangiStok() {
    if (!drawerKode) return;
    setSedangProsesStok(true);
    const res = await fetch(`/api/pesanan/${drawerKode}/stok`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "kurangi" }),
    });

    const hasil = await res.json();
    setSedangProsesStok(false);
    setModalKurangiStokBuka(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Gagal Mengurangi Stok",
        pesan: hasil.pesan || "Terjadi kesalahan saat mengurangi stok.",
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

  async function handleKembalikanStok() {
    if (!drawerKode) return;
    setSedangProsesStok(true);
    const res = await fetch(`/api/pesanan/${drawerKode}/stok`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "kembalikan" }),
    });

    const hasil = await res.json();
    setSedangProsesStok(false);
    setModalKembalikanStokBuka(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Gagal Mengembalikan Stok",
        pesan: hasil.pesan || "Terjadi kesalahan saat mengembalikan stok.",
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

        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center space-x-1">
              <i className="fa-solid fa-layer-group text-amber-700 text-[11px]" />
              <span>Isi Pesanan ({detailItems.length || 1})</span>
            </span>
          </div>

          {(detailItems.length > 0
            ? detailItems
            : [
                {
                  id: 0,
                  jenis: "Custom",
                  nama_item: "Kue Custom",
                  subtotal: detailPesanan.total_kue,
                  jumlah: 1,
                  fotoPreviewUrl: detailFotoPrevUrl,
                  fotoBentukUrl: detailFotoBentukUrl,
                  fotoGambarUrl: detailFotoGambarUrl,
                  tulisan_kue: detailPesanan.tulisan_kue,
                  catatan: detailPesanan.catatan,
                  pilihan: detailPilihan,
                  desain_json: detailPesanan.desain_json,
                },
              ]
          ).map((it, idx) => {
            const isCustom = it.jenis === "Custom";
            const itPilihan = it.pilihan || [];
            const itGrup = {};
            for (let i = 0; i < itPilihan.length; i++) {
              const p = itPilihan[i];
              const gName = p.nama_grup || "Opsi";
              if (!itGrup[gName]) itGrup[gName] = [];
              itGrup[gName].push(p);
            }
            const itDesain =
              it.desain_json && typeof it.desain_json === "object"
                ? it.desain_json
                : null;
            const itDesainItems = Array.isArray(itDesain?.items)
              ? itDesain.items
              : [];
            const itTeks = itDesainItems.filter((x) => x.t === "text" && x.text);
            const itStiker = itDesainItems.filter((x) => x.t === "emoji");

            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-2"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isCustom
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-sky-100 text-sky-900 border border-sky-200"
                      }`}
                    >
                      {isCustom ? "Kue Custom" : "Kue Katalog"}
                    </span>
                    <h5 className="text-xs font-bold text-stone-900 truncate">
                      {it.nama_item} {it.jumlah > 1 ? `(${it.jumlah}x)` : ""}
                    </h5>
                  </div>
                  {isAdmin && (
                    <span className="text-xs font-bold text-[#1d3b2e] lining-nums tabular-nums flex-shrink-0 ml-2">
                      {formatRupiah(it.subtotal)}
                    </span>
                  )}
                </div>

                {isCustom ? (
                  <div className="space-y-2">
                    <div className="flex justify-center py-1">
                      {it.fotoPreviewUrl ? (
                        <div className="relative group w-full flex justify-center">
                          <img
                            src={it.fotoPreviewUrl}
                            alt="Snapshot 3D"
                            className="w-full max-h-[180px] object-contain rounded-xl border border-[#e0d5b8] bg-[#fbf6e9] p-1 shadow-2xs"
                          />
                          <a
                            href={it.fotoPreviewUrl}
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
                          pilihan={itPilihan.length > 0 ? itPilihan : detailPilihan}
                          tulisan_kue={it.tulisan_kue || detailPesanan.tulisan_kue}
                          className="w-full max-w-[140px] h-auto drop-shadow-2xs"
                        />
                      )}
                    </div>

                    {(it.fotoBentukUrl || it.fotoGambarUrl) && (
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {it.fotoBentukUrl && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-stone-400 block uppercase">
                              Bentuk Kustom
                            </span>
                            <a
                              href={it.fotoBentukUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group"
                            >
                              <img
                                src={it.fotoBentukUrl}
                                alt="Bentuk"
                                className="w-full h-12 object-contain rounded-lg border border-[#e0d5b8] bg-white p-0.5"
                              />
                            </a>
                          </div>
                        )}
                        {it.fotoGambarUrl && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-stone-400 block uppercase">
                              Gambar Kustom
                            </span>
                            <a
                              href={it.fotoGambarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group"
                            >
                              <img
                                src={it.fotoGambarUrl}
                                alt="Gambar"
                                className="w-full h-12 object-contain rounded-lg border border-[#e0d5b8] bg-white p-0.5"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {it.tulisan_kue && (
                      <div className="pt-1 border-t border-dashed border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">
                          Tulisan di Kue
                        </span>
                        <p className="text-xs font-bold text-[#1d3b2e] bg-[#fbf6e9] border border-[#e0d5b8] p-1.5 rounded-lg italic mt-0.5">
                          &ldquo;{it.tulisan_kue}&rdquo;
                        </p>
                      </div>
                    )}

                    {it.catatan && it.catatan.trim() ? (
                      <div className="pt-1 border-t border-dashed border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">
                          Catatan Pemesan
                        </span>
                        <p className="text-[11px] font-medium text-stone-800 bg-[#fbf6e9] border border-[#e0d5b8] p-1.5 rounded-lg whitespace-pre-line italic mt-0.5">
                          &ldquo;{it.catatan}&rdquo;
                        </p>
                      </div>
                    ) : null}

                    {Object.keys(itGrup).length > 0 && (
                      <div className="pt-1 border-t border-[#dfd4bd] divide-y divide-[#ede2cd] text-xs">
                        {Object.entries(itGrup).map(([namaGrup, items]) => (
                          <div
                            key={namaGrup}
                            className="py-1 flex items-center justify-between gap-1.5"
                          >
                            <span className="font-semibold text-stone-500 text-[10px]">
                              {namaGrup}
                            </span>
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {items.map((opt, i) => (
                                <span
                                  key={i}
                                  className="font-bold text-stone-900 bg-[#fbf6e9] border border-[#e0d5b8] px-1.5 py-0.2 rounded text-[10px] inline-flex items-center space-x-1"
                                >
                                  {opt.warna && (
                                    <span
                                      className="w-2 h-2 rounded-full border border-stone-300 inline-block"
                                      style={{ backgroundColor: opt.warna }}
                                    />
                                  )}
                                  <span>
                                    {opt.nama_item}
                                    {opt.jumlah > 1 ? ` x ${opt.jumlah}` : ""}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {itTeks.length > 0 && (
                      <div className="pt-1 border-t border-dashed border-stone-200 space-y-0.5">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">
                          Teks Desain
                        </span>
                        {itTeks.map((t, i) => (
                          <div
                            key={i}
                            className="p-1 rounded bg-[#fbf6e9] border border-[#e0d5b8] text-[10px] flex justify-between"
                          >
                            <span className="font-bold">&ldquo;{t.text}&rdquo;</span>
                            <span className="text-[8px] text-stone-400">
                              {t.font || "Bawaan"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-stone-100 border border-[#dfd4bd] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {it.fotoProdukUrl ? (
                        <img
                          src={it.fotoProdukUrl}
                          alt={it.nama_item}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <i className="fa-solid fa-cake-candles text-stone-300 text-xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900">{it.nama_item}</p>
                      {isAdmin ? (
                        <p className="text-[11px] text-stone-600 mt-0.5 lining-nums">
                          {formatRupiah(it.harga_satuan)} x {it.jumlah}
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Jumlah: {it.jumlah}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              <span className="text-stone-400 block text-[9px]">
                {detailPesanan.jarak_km ? "Jarak Pengantaran" : "Zona / Lokasi"}
              </span>
              <span className="font-bold text-stone-900">
                {detailPesanan.jarak_km
                  ? `${detailPesanan.jarak_km} km`
                  : detailPesanan.zona_ongkir?.nama || "Toko Cravely"}
              </span>
            </div>
            {detailPesanan.metode_pengiriman === "Kirim" && detailPesanan.alamat && (
              <div className="col-span-2 pt-1 border-t border-dashed border-stone-200 space-y-1.5">
                <span className="text-stone-400 block text-[9px]">Alamat Lengkap</span>
                <p className="font-medium text-stone-800 bg-[#fbf6e9] border border-[#e0d5b8] p-1.5 rounded-lg mt-0.5">
                  {detailPesanan.alamat}
                </p>
                {detailPesanan.lat_tujuan !== null &&
                  detailPesanan.lng_tujuan !== null &&
                  detailPesanan.lat_tujuan !== undefined &&
                  detailPesanan.lng_tujuan !== undefined && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${detailPesanan.lat_tujuan},${detailPesanan.lng_tujuan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline pt-0.5"
                    >
                      <i className="fa-solid fa-map-location-dot text-xs"></i>
                      <span>Lihat Lokasi di Google Maps</span>
                    </a>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#dfd4bd] space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center space-x-1">
              <i className="fa-solid fa-boxes-stacked text-amber-700 text-[11px]" />
              <h4 className="text-[10px] font-bold text-[#1d3b2e] uppercase tracking-wider">
                Kebutuhan Bahan
              </h4>
            </div>
          </div>

          {infoStokPesanan?.pesanan?.stok_dipotong_pada ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-emerald-600" />
                  <span>
                    Stok sudah dikurangi pada {formatTanggalWaktu(infoStokPesanan.pesanan.stok_dipotong_pada)} WIB oleh {infoStokPesanan.pesanan.nama_pemotong || "Staf"}
                  </span>
                </div>
                {infoStokPesanan.riwayatPengurangan?.length > 0 && (
                  <div className="pt-1.5 border-t border-emerald-200/60 text-[10px] space-y-0.5">
                    <span className="font-semibold text-emerald-900 block">Jumlah yang dikurangi:</span>
                    <div className="grid grid-cols-2 gap-1 font-medium">
                      {infoStokPesanan.riwayatPengurangan.map((r) => (
                        <div
                          key={r.id_bahan}
                          className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200/50 flex justify-between"
                        >
                          <span>{r.nama}</span>
                          <span className="font-bold">{formatAngka(r.dikurangi)} {r.satuan}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={sedangProsesStok}
                onClick={() => setModalKembalikanStokBuka(true)}
                className="w-full py-1.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs disabled:opacity-50"
              >
                <i className="fa-solid fa-rotate-left text-[11px]" />
                <span>Kembalikan Stok</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {(infoStokPesanan?.daftarKebutuhan || []).filter((b) => b.kurang > 0).length > 0 ? (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <i className="fa-solid fa-triangle-exclamation text-rose-600" />
                    <span>Stok tidak mencukupi untuk:</span>
                  </div>
                  <div className="text-[10px] font-medium pl-4 space-y-0.5">
                    {(infoStokPesanan?.daftarKebutuhan || [])
                      .filter((b) => b.kurang > 0)
                      .map((k) => (
                        <div key={k.id_bahan}>
                          • {k.nama} (kurang {formatAngka(k.kurang)} {k.satuan})
                        </div>
                      ))}
                  </div>
                </div>
              ) : (infoStokPesanan?.daftarKebutuhan?.length || 0) > 0 ? (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-emerald-600" />
                  <span>Stok cukup</span>
                </div>
              ) : null}

              {infoStokPesanan?.pilihanTanpaResep > 0 && (
                <div className="p-2.5 rounded-xl bg-[#fbf6e9] border border-[#e0d5b8] text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#e0d5b8]">
                    <div className="flex items-center gap-1.5 font-bold text-stone-700">
                      <i className="fa-solid fa-circle-info text-amber-700 text-[11px]" />
                      <span>{infoStokPesanan.pilihanTanpaResep} pilihan belum punya resep dan tidak dihitung</span>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/dashboard/katalog-opsi"
                        className="font-bold text-amber-800 hover:text-amber-900 underline whitespace-nowrap text-[10px]"
                      >
                        Atur di Katalog & Opsi
                      </Link>
                    )}
                  </div>

                  {infoStokPesanan.daftarPilihanTanpaResep?.length > 0 && (
                    <div className="divide-y divide-[#ede2cd]/80">
                      {infoStokPesanan.daftarPilihanTanpaResep.map((p, i) => (
                        <div key={i} className="py-1 flex items-center justify-between text-[10px]">
                          <span className="text-stone-500 font-medium">{p.nama_grup}</span>
                          <span className="font-bold text-stone-800">
                            {p.nama_item}
                            {p.jumlah > 1 ? ` (${p.jumlah}x)` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {infoStokPesanan?.daftarKebutuhan?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase font-bold border-y border-[#dfd4bd]">
                      <tr>
                        <th className="py-1 px-1.5">Bahan</th>
                        <th className="py-1 px-1.5 text-center">Dibutuhkan</th>
                        <th className="py-1 px-1.5 text-center">Stok Saat Ini</th>
                        <th className="py-1 px-1.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ede2cd]">
                      {infoStokPesanan.daftarKebutuhan.map((b) => (
                        <tr key={b.id_bahan} className="hover:bg-stone-50">
                          <td className="py-1.5 px-1.5 font-bold text-stone-800">{b.nama}</td>
                          <td className="py-1.5 px-1.5 text-center font-semibold text-stone-700">
                            {formatAngka(b.dibutuhkan)} {b.satuan}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-semibold text-stone-700">
                            {formatAngka(b.stok_sekarang)} {b.satuan}
                          </td>
                          <td className="py-1.5 px-1.5 text-right">
                            {b.kurang > 0 ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                Kurang {formatAngka(b.kurang)} {b.satuan}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Cukup
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-2 text-center text-[10px] text-stone-400 italic">
                  Belum ada kebutuhan bahan terhitung.
                </div>
              )}

              {["Diterima", "Sedang Dibuat", "Siap", "Dikirim", "Selesai"].includes(detailPesanan.status_pesanan) ? (
                <button
                  type="button"
                  disabled={sedangProsesStok}
                  onClick={() => setModalKurangiStokBuka(true)}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs disabled:opacity-50"
                >
                  <i className="fa-solid fa-minus text-[10px]" />
                  <span>Kurangi Stok</span>
                </button>
              ) : (
                <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 italic">
                    Tombol kurangi stok nonaktif untuk pesanan {detailPesanan.status_pesanan}.
                  </span>
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
              {detailItems.map((it, idx) => (
                <div key={idx} className="flex justify-between text-stone-600 text-[10px]">
                  <span className="truncate pr-2">{it.jumlah > 1 ? `${it.jumlah}x ` : ""}{it.nama_item}</span>
                  <span className="font-bold text-stone-900 lining-nums tabular-nums flex-shrink-0">{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between text-stone-600 text-[10px] pt-1 border-t border-dashed border-stone-100">
                <span>Subtotal Semua Kue</span>
                <span className="font-bold text-stone-900 lining-nums tabular-nums">{formatRupiah(detailPesanan.total_kue)}</span>
              </div>
              {isAdmin && detailPesanan.ongkir > 0 && (
                <div className="flex justify-between text-stone-600 text-[10px]">
                  <span>Ongkos Kirim</span>
                  <span className="font-bold text-stone-900 lining-nums tabular-nums">{formatRupiah(detailPesanan.ongkir)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#17382d] text-white my-1">
                <div>
                  <span className="text-[8px] font-bold text-emerald-200 block uppercase">
                    Total
                  </span>
                  <span className="text-xs font-black lining-nums tabular-nums">
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
                <span className="font-bold text-emerald-700 lining-nums tabular-nums">{formatRupiah(detailPesanan.jumlah_terbayar)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-0.5 border-t border-dashed border-stone-200 text-xs">
                <span className="font-bold text-rose-800 text-[10px]">Sisa Tagihan</span>
                <span className="font-black text-xs text-rose-800 lining-nums tabular-nums">
                  {formatRupiah(Math.max(0, detailPesanan.total_bayar - detailPesanan.jumlah_terbayar))}
                </span>
              </div>

              {(() => {
                const sumSub = detailItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
                if (detailItems.length > 0 && sumSub !== Number(detailPesanan.total_kue)) {
                  return (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-[10px] font-bold flex items-center space-x-1.5 mt-2">
                      <i className="fa-solid fa-triangle-exclamation text-rose-600 text-xs flex-shrink-0" />
                      <span>
                        Peringatan: Jumlah subtotal item ({formatRupiah(sumSub)}) tidak sama dengan total kue ({formatRupiah(detailPesanan.total_kue)}).
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
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
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none" />
                <input
                  type="text"
                  placeholder="Kode pesanan / nama..."
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  className="w-full h-[38px] pl-10 pr-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white text-stone-800 placeholder:text-stone-400"
                />
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
                className="w-full h-[38px] px-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white cursor-pointer"
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
                className="w-full h-[38px] px-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex-1 h-[38px] px-4 bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Filter
              </button>
              {(filterStatus || filterTanggal || kataKunci) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-[38px] px-3 border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold rounded-xl text-xs transition cursor-pointer"
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
                    <th className="py-3 px-3 whitespace-nowrap">Isi</th>
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
                        <td className="py-2.5 px-3 w-14 align-middle">
                          <div className="w-11 h-11 rounded-xl border border-[#e0d5b8] bg-[#fbf6e9] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                            {thumbnailMap[p.id] ? (
                              <img
                                src={thumbnailMap[p.id]}
                                alt="Thumbnail Kue"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <PreviewKue
                                pilihan={pilihanMap[p.id] || []}
                                tulisan_kue={p.tulisan_kue}
                                className="w-full h-full p-0.5"
                              />
                            )}
                          </div>
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
                        <td className="py-3 px-3 font-medium text-stone-700 text-xs max-w-[200px]">
                          <span className="truncate block" title={isiRingkasMap[p.id]}>
                            {isiRingkasMap[p.id] || "1 Kue"}
                          </span>
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

      {modalKurangiStokBuka && (
        <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf6e9] border border-[#dfd4bd] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
              <div>
                <h3 className="font-bold text-[#1d3b2e] text-sm">Konfirmasi Pengurangan Stok</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Pesanan: {drawerKode}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalKurangiStokBuka(false)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {(infoStokPesanan?.daftarKebutuhan || []).some((b) => b.kurang > 0) && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm" />
                <span>Stok akan dikurangi sampai 0 dan kekurangannya dicatat</span>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto rounded-xl border border-[#dfd4bd] bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Bahan</th>
                    <th className="py-2 px-3 text-center">Dibutuhkan</th>
                    <th className="py-2 px-3 text-center">Stok Saat Ini</th>
                    <th className="py-2 px-3 text-right">Akan Dipotong</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede2cd]">
                  {(infoStokPesanan?.daftarKebutuhan || []).map((b) => {
                    const dipotong = Math.min(b.stok_sekarang, b.dibutuhkan);
                    return (
                      <tr key={b.id_bahan}>
                        <td className="py-2 px-3 font-bold text-stone-800">{b.nama}</td>
                        <td className="py-2 px-3 text-center font-medium">{formatAngka(b.dibutuhkan)} {b.satuan}</td>
                        <td className="py-2 px-3 text-center font-medium">{formatAngka(b.stok_sekarang)} {b.satuan}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-700">
                          -{formatAngka(Math.max(0, dipotong))} {b.satuan}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#dfd4bd]">
              <button
                type="button"
                disabled={sedangProsesStok}
                onClick={() => setModalKurangiStokBuka(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer text-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesStok}
                onClick={handleKurangiStok}
                className="px-4 py-2 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold cursor-pointer text-xs shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                {sedangProsesStok ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Konfirmasi Kurangi Stok</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalKembalikanStokBuka && (
        <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf6e9] border border-[#dfd4bd] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
              <h3 className="font-bold text-[#1d3b2e] text-sm">Kembalikan Stok</h3>
              <button
                type="button"
                onClick={() => setModalKembalikanStokBuka(false)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Apakah Anda yakin ingin mengembalikan seluruh stok bahan yang sebelumnya telah dipotong untuk pesanan{" "}
              <span className="font-bold text-[#1d3b2e]">{drawerKode}</span>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#dfd4bd]">
              <button
                type="button"
                disabled={sedangProsesStok}
                onClick={() => setModalKembalikanStokBuka(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer text-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesStok}
                onClick={handleKembalikanStok}
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer text-xs shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                {sedangProsesStok ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    <span>Mengembalikan...</span>
                  </>
                ) : (
                  <span>Ya, Kembalikan Stok</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalKonfirmasiBatalStokBuka && (
        <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf6e9] border border-[#dfd4bd] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0d5b8]">
              <h3 className="font-bold text-[#1d3b2e] text-sm">Kembalikan Stok Pesanan?</h3>
              <button
                type="button"
                onClick={() => setModalKonfirmasiBatalStokBuka(false)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Stok sudah dikurangi. Kembalikan stok sekarang?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#dfd4bd]">
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => setModalKonfirmasiBatalStokBuka(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer text-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => eksekusiBatalPesanan(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold cursor-pointer text-xs disabled:opacity-50"
              >
                Lewati
              </button>
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => eksekusiBatalPesanan(true)}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer text-xs shadow-xs disabled:opacity-50"
              >
                Kembalikan
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
    </div>
  );
}
