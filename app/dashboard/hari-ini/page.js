"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import {
  formatRupiah,
  formatTanggalIndonesia,
  formatTanggalSingkat,
  formatTanggalWaktu,
  formatAngka,
} from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";
import ModalPesan from "@/components/ModalPesan";

function getJakartaIsoDate(hariOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + hariOffset);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function normalisasiWa(nomor) {
  if (!nomor) return "";
  let digits = nomor.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }
  return digits;
}

export default function HariIniDashboardPage() {
  const tglHariIni = getJakartaIsoDate(0);
  const tglBesok = getJakartaIsoDate(1);

  const [tanggalTerpilih, setTanggalTerpilih] = useState(tglHariIni);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [daftarPesanan, setDaftarPesanan] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [pilihanMap, setPilihanMap] = useState({});
  const [bahanRendah, setBahanRendah] = useState([]);
  const [kataKunciCari, setKataKunciCari] = useState("");
  const [sedangProses, setSedangProses] = useState(false);
  const [waktuRefreshTerakhir, setWaktuRefreshTerakhir] = useState(new Date());

  const [modalTunaiBuka, setModalTunaiBuka] = useState(false);
  const [pesananTunai, setPesananTunai] = useState(null);
  const [sedangSimpanTunai, setSedangSimpanTunai] = useState(false);
  const [konfirmasiStatus, setKonfirmasiStatus] = useState({
    terbuka: false,
    kodePesanan: "",
    statusBaru: "",
  });

  const [drawerBuka, setDrawerBuka] = useState(false);
  const [drawerKode, setDrawerKode] = useState(null);
  const [detailPesanan, setDetailPesanan] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  const muatData = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowser();

      const { data: pesananList, error: errPesanan } = await supabase
        .from("pesanan")
        .select("*")
        .neq("status_pesanan", "Dibatalkan")
        .order("tanggal_ambil", { ascending: true })
        .order("jam_ambil", { ascending: true, nullsFirst: false });

      if (!errPesanan && pesananList) {
        setDaftarPesanan(pesananList);

        const ids = pesananList.map((p) => p.id);
        if (ids.length > 0) {
          const [resItems, resPilihan] = await Promise.all([
            supabase
              .from("pesanan_item")
              .select("id, id_pesanan, jenis, nama_item, jumlah, foto_preview, catatan_opsi, spesifikasi_singkat")
              .in("id_pesanan", ids),
            supabase
              .from("pesanan_pilihan")
              .select("id_pesanan, peran_visual, warna, kode_visual, teks_pilihan")
              .in("id_pesanan", ids),
          ]);

          const itMap = {};
          (resItems.data || []).forEach((item) => {
            if (!itMap[item.id_pesanan]) itMap[item.id_pesanan] = [];
            itMap[item.id_pesanan].push(item);
          });
          setItemsMap(itMap);

          const piMap = {};
          (resPilihan.data || []).forEach((pil) => {
            if (!piMap[pil.id_pesanan]) piMap[pil.id_pesanan] = [];
            piMap[pil.id_pesanan].push(pil);
          });
          setPilihanMap(piMap);
        }
      }

      const { data: listBahan } = await supabase
        .from("bahan")
        .select("id, nama, satuan, jumlah, batas_minimum")
        .order("nama", { ascending: true });

      if (listBahan) {
        const menipis = listBahan.filter(
          (b) => Number(b.jumlah) <= Number(b.batas_minimum)
        );
        setBahanRendah(menipis);
      }

      setWaktuRefreshTerakhir(new Date());
    } catch {
    } finally {
      setSedangMemuat(false);
    }
  }, []);

  useEffect(() => {
    muatData();
    const timer = setInterval(() => {
      muatData();
    }, 60000);
    return () => clearInterval(timer);
  }, [muatData]);

  async function bukaDrawer(kode) {
    if (!kode) return;
    setDrawerKode(kode);
    setDrawerBuka(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/pesanan/${kode}`);
      const json = await res.json();
      if (res.ok && json.sukses) {
        setDetailPesanan(json);
      } else {
        setDetailPesanan(null);
      }
    } catch {
      setDetailPesanan(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function tutupDrawer() {
    setDrawerBuka(false);
    setDrawerKode(null);
    setDetailPesanan(null);
  }

  function ubahStatusPesanan(kodePesanan, statusBaru) {
    setKonfirmasiStatus({
      terbuka: true,
      kodePesanan,
      statusBaru,
    });
  }

  async function eksekusiUbahStatus() {
    const { kodePesanan, statusBaru } = konfirmasiStatus;
    if (!kodePesanan || !statusBaru) return;

    setSedangProses(true);
    try {
      const res = await fetch(`/api/pesanan/${kodePesanan}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_baru: statusBaru }),
      });
      const data = await res.json();

      if (!res.ok) {
        setKonfirmasiStatus({ terbuka: false, kodePesanan: "", statusBaru: "" });
        setNotifikasi({
          terbuka: true,
          judul: "Gagal Mengubah Status",
          pesan: data.pesan || "Terjadi kesalahan saat memperbarui status pesanan.",
          tipe: "error",
        });
      } else {
        setKonfirmasiStatus({ terbuka: false, kodePesanan: "", statusBaru: "" });
        setNotifikasi({
          terbuka: true,
          judul: "Status Berhasil Diperbarui",
          pesan: `Pesanan #${kodePesanan} kini berstatus "${statusBaru}".`,
          tipe: "sukses",
        });
        await muatData();
        if (drawerBuka && drawerKode === kodePesanan) {
          bukaDrawer(kodePesanan);
        }
      }
    } catch {
      setKonfirmasiStatus({ terbuka: false, kodePesanan: "", statusBaru: "" });
      setNotifikasi({
        terbuka: true,
        judul: "Kesalahan Jaringan",
        pesan: "Tidak dapat terhubung ke server. Silakan coba lagi.",
        tipe: "error",
      });
    } finally {
      setSedangProses(false);
    }
  }

  function handleBukaPelunasan(p) {
    setPesananTunai(p);
    setModalTunaiBuka(true);
  }

  async function handleSimpanPelunasan(e) {
    e.preventDefault();
    if (!pesananTunai) return;

    const sisa = Math.max(0, Number(pesananTunai.total_bayar || 0) - Number(pesananTunai.jumlah_terbayar || 0));
    if (sisa <= 0) {
      setModalTunaiBuka(false);
      return;
    }

    setSedangSimpanTunai(true);
    try {
      const formData = new FormData();
      formData.append("id_pesanan", String(pesananTunai.id));
      formData.append("kode_pesanan", pesananTunai.kode_pesanan);
      formData.append("jumlah", String(sisa));
      formData.append("metode", "Tunai di Tempat");
      formData.append("jenis", "Pelunasan");

      const res = await fetch("/api/pembayaran", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Pelunasan Gagal",
          pesan: data.pesan || "Terjadi kesalahan saat mencatat pelunasan tunai.",
          tipe: "error",
        });
      } else {
        setModalTunaiBuka(false);
        setNotifikasi({
          terbuka: true,
          judul: "Pelunasan Berhasil Dicatat",
          pesan: `Pelunasan tunai #${pesananTunai.kode_pesanan} sebesar ${formatRupiah(sisa)} telah berhasil dikonfirmasi.`,
          tipe: "sukses",
        });
        await muatData();
        if (drawerBuka && drawerKode === pesananTunai.kode_pesanan) {
          bukaDrawer(pesananTunai.kode_pesanan);
        }
      }
    } catch {
      setNotifikasi({
        terbuka: true,
        judul: "Kesalahan Jaringan",
        pesan: "Gagal mencatat pelunasan. Periksa koneksi internet Anda.",
        tipe: "error",
      });
    } finally {
      setSedangSimpanTunai(false);
    }
  }

  function handleCariSubmit(e) {
    e.preventDefault();
    const query = kataKunciCari.trim();
    if (!query) return;

    const cocok = daftarPesanan.find((p) => {
      const k = (p.kode_pesanan || "").toLowerCase();
      const w = (p.no_wa || "").toLowerCase();
      const n = (p.nama_penerima || "").toLowerCase();
      const q = query.toLowerCase();
      return k.includes(q) || w.includes(q) || n.includes(q);
    });

    if (cocok) {
      bukaDrawer(cocok.kode_pesanan);
    } else {
      setNotifikasi({
        terbuka: true,
        judul: "Pesanan Tidak Ditemukan",
        pesan: `Tidak ditemukan pesanan dengan kata kunci "${query}".`,
        tipe: "info",
      });
    }
  }

  const isTabCustom = tanggalTerpilih === "custom";

  const isAdaCustom = (p) => {
    const its = itemsMap[p.id] || [];
    return its.some((it) => it.jenis === "Custom") || Boolean(p.tulisan_kue || p.desain_json);
  };

  const semuaCustomAktif = daftarPesanan.filter(
    (p) => p.tanggal_ambil >= tglHariIni && isAdaCustom(p)
  );

  const pesananHariTerpilih = isTabCustom
    ? semuaCustomAktif
    : daftarPesanan.filter((p) => p.tanggal_ambil === tanggalTerpilih);

  const daftarPerluDibuat = pesananHariTerpilih.filter((p) =>
    ["Diterima", "Sedang Dibuat"].includes(p.status_pesanan)
  );

  const daftarSiap = pesananHariTerpilih.filter(
    (p) => p.status_pesanan === "Siap" || (p.metode_pengiriman === "Kirim" && p.status_pesanan === "Dikirim")
  );

  const daftarMenungguPelunasan = pesananHariTerpilih.filter(
    (p) =>
      p.status_bayar !== "Lunas" &&
      !["Selesai", "Dibatalkan"].includes(p.status_pesanan) &&
      Number(p.total_bayar || 0) > Number(p.jumlah_terbayar || 0)
  );

  const countPerluDiprosesSemua = daftarPesanan.filter((p) => p.status_pesanan === "Diterima").length;
  const countKueCustomSemua = semuaCustomAktif.filter((p) =>
    ["Diterima", "Sedang Dibuat"].includes(p.status_pesanan)
  ).length;
  const countKueCustomHariTerpilih = daftarPerluDibuat.filter(isAdaCustom).length;
  const countSiapHariTerpilih = daftarSiap.length;
  const countMenungguPelunasanHariTerpilih = daftarMenungguPelunasan.length;
  const countStokMenipis = bahanRendah.length;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-[#FFFDF9] border border-[#dfd4bd] rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#dfd4bd]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#9E3B42]">
                Dapur Produksi & Pengantaran
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1d3b2e] mt-0.5">
              Tugas & Antrean Dapur
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Pembaruan otomatis tiap 60 detik • Terakhir diperbarui:{" "}
              {waktuRefreshTerakhir.toLocaleTimeString("id-ID")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl bg-[#ede2cd] p-1 border border-[#dfd4bd]">
              <button
                type="button"
                onClick={() => setTanggalTerpilih(tglHariIni)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tanggalTerpilih === tglHariIni
                    ? "bg-[#1d3b2e] text-white shadow-xs"
                    : "text-[#1d3b2e] hover:text-[#9E3B42]"
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setTanggalTerpilih(tglBesok)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tanggalTerpilih === tglBesok
                    ? "bg-[#1d3b2e] text-white shadow-xs"
                    : "text-[#1d3b2e] hover:text-[#9E3B42]"
                }`}
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => setTanggalTerpilih("custom")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isTabCustom
                    ? "bg-[#9E3B42] text-white shadow-xs"
                    : "text-[#1d3b2e] hover:text-[#9E3B42]"
                }`}
              >
                <span>Kue Kustom</span>
                {countKueCustomSemua > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black tabular-nums ${
                      isTabCustom ? "bg-white text-[#9E3B42]" : "bg-[#9E3B42] text-white"
                    }`}
                  >
                    {countKueCustomSemua}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              disabled={sedangMemuat}
              onClick={() => muatData()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#dfd4bd] hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Segarkan data antrean"
            >
              <i className={`fa-solid fa-arrows-rotate text-xs ${sedangMemuat ? "fa-spin text-[#9E3B42]" : ""}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleCariSubmit} className="mt-4">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
            <input
              type="text"
              value={kataKunciCari}
              onChange={(e) => setKataKunciCari(e.target.value)}
              placeholder="Cari cepat kode pesanan, nomor WhatsApp, atau nama penerima..."
              className="w-full pl-9 pr-24 py-2.5 rounded-2xl border border-[#dfd4bd] bg-white text-xs font-medium text-stone-800 placeholder-stone-400 outline-none focus:border-[#9E3B42] focus:ring-1 focus:ring-[#9E3B42] transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1d3b2e] hover:bg-[#152b22] text-white text-xs font-bold transition cursor-pointer"
            >
              Cari & Buka
            </button>
          </div>
        </form>
      </div>

      {countStokMenipis > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 text-sm">
              <i className="fa-solid fa-triangle-exclamation" />
            </span>
            <div>
              <h2 className="text-xs font-bold">Peringatan: {countStokMenipis} Bahan di Bawah Batas Minimum</h2>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                {bahanRendah.slice(0, 3).map((b) => `${b.nama} (${formatAngka(b.jumlah)} ${b.satuan})`).join(", ")}
                {bahanRendah.length > 3 ? ` dan ${bahanRendah.length - 3} bahan lainnya` : ""}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/stok"
            className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
          >
            Buka Kelola Stok
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Perlu Diproses
          </span>
          <div className="text-xl font-black text-stone-800 mt-1 tabular-nums lining-nums">
            {countPerluDiprosesSemua}
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">status Diterima</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            {isTabCustom ? "Kustom Aktif" : `Custom ${tanggalTerpilih === tglHariIni ? "Hari Ini" : "Besok"}`}
          </span>
          <div className="text-xl font-black text-rose-700 mt-1 tabular-nums lining-nums">
            {isTabCustom ? countKueCustomSemua : countKueCustomHariTerpilih}
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            {isTabCustom ? "semua jadwal" : `${countKueCustomSemua} total mendatang`}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            {isTabCustom ? "Kustom Siap" : `Siap ${tanggalTerpilih === tglHariIni ? "Hari Ini" : "Besok"}`}
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums lining-nums">
            {countSiapHariTerpilih}
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">siap ambil / kirim</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Menunggu Pelunasan
          </span>
          <div className="text-xl font-black text-amber-700 mt-1 tabular-nums lining-nums">
            {countMenungguPelunasanHariTerpilih}
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">ada sisa bayar</span>
        </div>

        <Link
          href="/dashboard/stok"
          className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-amber-300 transition block col-span-2 md:col-span-1"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Stok Menipis
          </span>
          <div className="text-xl font-black text-amber-600 mt-1 tabular-nums lining-nums">
            {countStokMenipis}
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">di bawah minimum</span>
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              1. Perlu Dibuat ({daftarPerluDibuat.length})
            </h2>
          </div>
          <span className="text-xs text-stone-500">
            {isTabCustom ? "Semua Kue Kustom (Hari Ini & Mendatang)" : `Jadwal: ${formatTanggalSingkat(tanggalTerpilih)}`}
          </span>
        </div>

        {daftarPerluDibuat.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 text-center text-stone-400">
            <i className="fa-solid fa-cake-candles text-2xl text-stone-300 mb-2 block" />
            <p className="text-xs font-semibold text-stone-600">Tidak ada antrean yang perlu dibuat untuk tanggal ini.</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Semua kue telah siap atau belum ada pesanan baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {daftarPerluDibuat.map((p) => {
              const items = itemsMap[p.id] || [];
              const pilihan = pilihanMap[p.id] || [];
              const adaCustom = items.some((it) => it.jenis === "Custom") || Boolean(p.tulisan_kue || p.desain_json);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-[#dfd4bd] p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => bukaDrawer(p.kode_pesanan)}
                          className="font-mono font-bold text-xs text-[#9E3B42] hover:underline cursor-pointer"
                        >
                          #{p.kode_pesanan}
                        </button>
                        <h3 className="font-bold text-sm text-stone-900 mt-0.5">{p.nama_penerima}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          p.status_pesanan === "Sedang Dibuat"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-stone-100 text-stone-700 border border-stone-200"
                        }`}
                      >
                        {p.status_pesanan}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                      {isTabCustom && p.tanggal_ambil && (
                        <>
                          <span className="inline-flex items-center gap-1 font-bold text-[#9E3B42]">
                            <i className="fa-regular fa-calendar" />
                            {formatTanggalSingkat(p.tanggal_ambil)}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <i className="fa-regular fa-clock text-stone-400" />
                        {p.jam_ambil ? p.jam_ambil.slice(0, 5) : "Jadwal Fleksibel"}
                      </span>
                      <span>•</span>
                      <span className="font-medium">
                        {p.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim Kurir"}
                      </span>
                    </div>

                    {adaCustom ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-2xl bg-[#fbf6e9] border border-[#dfd4bd]/70 flex gap-3 items-center">
                          <div className="w-16 h-16 rounded-xl bg-white border border-[#dfd4bd] overflow-hidden flex items-center justify-center shrink-0">
                            <PreviewKue
                              pilihan={pilihan}
                              tulisanKue={p.tulisan_kue || ""}
                              className="w-full h-full scale-90"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-[#9E3B42] uppercase tracking-wider block">
                              Kustom Studio
                            </span>
                            {p.tulisan_kue && (
                              <p className="text-xs font-bold text-stone-800 italic truncate" title={p.tulisan_kue}>
                                &ldquo;{p.tulisan_kue}&rdquo;
                              </p>
                            )}
                            <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5">
                              {items
                                .filter((it) => it.jenis === "Custom")
                                .map((it) => it.nama_item)
                                .join(", ") || "Custom Cake"}
                            </p>
                          </div>
                        </div>
                        {items.some((it) => it.jenis !== "Custom") && (
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-700">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                              + Produk Katalog
                            </span>
                            <p className="font-semibold text-stone-800 mt-0.5">
                              {items
                                .filter((it) => it.jenis !== "Custom")
                                .map((it) => `${it.jumlah}x ${it.nama_item}`)
                                .join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Produk Katalog
                        </span>
                        <p className="font-semibold text-stone-800 mt-0.5">
                          {items.map((it) => `${it.jumlah}x ${it.nama_item}`).join(", ") || "Kue Katalog"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bukaDrawer(p.kode_pesanan)}
                      className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition cursor-pointer"
                    >
                      Detail
                    </button>

                    {adaCustom ? (
                      p.status_pesanan === "Diterima" ? (
                        <button
                          type="button"
                          disabled={sedangProses}
                          onClick={() => ubahStatusPesanan(p.kode_pesanan, "Sedang Dibuat")}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 text-center"
                        >
                          Mulai Dibuat
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={sedangProses}
                          onClick={() => ubahStatusPesanan(p.kode_pesanan, "Siap")}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 text-center"
                        >
                          Tandai Siap
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={sedangProses}
                        onClick={() => ubahStatusPesanan(p.kode_pesanan, "Siap")}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 text-center"
                      >
                        Tandai Siap
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              2. Siap Diambil atau Diantar ({daftarSiap.length})
            </h2>
          </div>
          <span className="text-xs text-stone-500">
            {isTabCustom ? "Semua Kue Kustom (Hari Ini & Mendatang)" : `Jadwal: ${formatTanggalSingkat(tanggalTerpilih)}`}
          </span>
        </div>

        {daftarSiap.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 text-center text-stone-400">
            <i className="fa-solid fa-box-open text-2xl text-stone-300 mb-2 block" />
            <p className="text-xs font-semibold text-stone-600">Belum ada pesanan yang siap untuk tanggal ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {daftarSiap.map((p) => {
              const isLunas = p.status_bayar === "Lunas";
              const sisa = Math.max(0, Number(p.total_bayar || 0) - Number(p.jumlah_terbayar || 0));

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-[#dfd4bd] p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => bukaDrawer(p.kode_pesanan)}
                          className="font-mono font-bold text-xs text-[#9E3B42] hover:underline cursor-pointer"
                        >
                          #{p.kode_pesanan}
                        </button>
                        <h3 className="font-bold text-sm text-stone-900 mt-0.5">{p.nama_penerima}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          p.metode_pengiriman === "Ambil"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-sky-50 text-sky-800 border border-sky-200"
                        }`}
                      >
                        {p.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim Kurir"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">
                        {p.jam_ambil ? `Jam ${p.jam_ambil.slice(0, 5)}` : "Jadwal Fleksibel"}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          isLunas
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isLunas ? "Lunas" : `Sisa ${formatRupiah(sisa)}`}
                      </span>
                    </div>

                    {p.no_wa && (
                      <p className="text-xs text-stone-600 font-mono">
                        WA: {p.no_wa}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex flex-col gap-2">
                    {p.metode_pengiriman === "Ambil" ? (
                      isLunas ? (
                        <button
                          type="button"
                          disabled={sedangProses}
                          onClick={() => ubahStatusPesanan(p.kode_pesanan, "Selesai")}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 text-center"
                        >
                          Serah Terima (Selesai)
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleBukaPelunasan(p)}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-xs text-center"
                          >
                            Catat Pelunasan Tunai ({formatRupiah(sisa)})
                          </button>
                          <p className="text-[10px] text-stone-400 text-center">
                            Tagihan harus dilunasi sebelum serah terima kue
                          </p>
                        </div>
                      )
                    ) : (
                      p.status_pesanan === "Siap" ? (
                        isLunas ? (
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => ubahStatusPesanan(p.kode_pesanan, "Dikirim")}
                            className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 text-center"
                          >
                            Tandai Dikirim
                          </button>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-900 font-semibold">
                            Pesanan belum lunas. Tunggu pelunasan sebelum dikirim.
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled={sedangProses || !isLunas}
                          onClick={() => ubahStatusPesanan(p.kode_pesanan, "Selesai")}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 text-center"
                        >
                          Selesai (Pesanan Tiba)
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => bukaDrawer(p.kode_pesanan)}
                      className="w-full py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold transition cursor-pointer text-center"
                    >
                      Buka Rincian
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              3. Menunggu Pelunasan ({daftarMenungguPelunasan.length})
            </h2>
          </div>
          <span className="text-xs text-stone-500">
            {isTabCustom ? "Semua Kue Kustom (Hari Ini & Mendatang)" : `Jadwal: ${formatTanggalSingkat(tanggalTerpilih)}`}
          </span>
        </div>

        {daftarMenungguPelunasan.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 text-center text-stone-400">
            <i className="fa-solid fa-circle-check text-2xl text-emerald-300 mb-2 block" />
            <p className="text-xs font-semibold text-stone-600">Semua pesanan untuk tanggal ini telah lunas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {daftarMenungguPelunasan.map((p) => {
              const sisa = Math.max(0, Number(p.total_bayar || 0) - Number(p.jumlah_terbayar || 0));
              const waLink = `https://wa.me/${normalisasiWa(p.no_wa)}?text=${encodeURIComponent(
                `Halo Kak ${p.nama_penerima}, kami dari Cravely Bakery ingin mengonfirmasi pesanan #${p.kode_pesanan} untuk jadwal ${formatTanggalIndonesia(
                  p.tanggal_ambil
                )}. Sisa tagihan adalah ${formatRupiah(sisa)}. Mohon info apakah ingin transfer atau pelunasan tunai di toko. Terima kasih!`
              )}`;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-[#dfd4bd] p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => bukaDrawer(p.kode_pesanan)}
                          className="font-mono font-bold text-xs text-[#9E3B42] hover:underline cursor-pointer"
                        >
                          #{p.kode_pesanan}
                        </button>
                        <h3 className="font-bold text-sm text-stone-900 mt-0.5">{p.nama_penerima}</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {p.status_bayar}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Total Tagihan:</span>
                        <span className="font-bold text-stone-800 tabular-nums">{formatRupiah(p.total_bayar)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Sudah Dibayar:</span>
                        <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(p.jumlah_terbayar)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-amber-900 pt-1 border-t border-amber-200/60">
                        <span>Sisa Tagihan:</span>
                        <span className="tabular-nums">{formatRupiah(sisa)}</span>
                      </div>
                    </div>

                    {p.no_wa && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        <i className="fa-brands fa-whatsapp text-sm" />
                        <span>Hubungi Pelanggan ({p.no_wa})</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bukaDrawer(p.kode_pesanan)}
                      className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition cursor-pointer"
                    >
                      Detail
                    </button>

                    {p.metode_pengiriman === "Ambil" && (
                      <button
                        type="button"
                        onClick={() => handleBukaPelunasan(p)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-xs text-center"
                      >
                        Catat Pelunasan Tunai
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modalTunaiBuka && pesananTunai && (
        <div className="fixed inset-0 !mt-0 z-[9999] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#dfd4bd] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfd4bd]">
              <div>
                <h3 className="font-black text-sm text-[#1d3b2e]">Catat Pelunasan Tunai</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">#{pesananTunai.kode_pesanan}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalTunaiBuka(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#dfd4bd] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Penerima:</span>
                  <span className="font-bold text-stone-800">{pesananTunai.nama_penerima}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Metode:</span>
                  <span className="font-bold text-emerald-800">Ambil di Toko</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Tagihan:</span>
                  <span className="font-bold text-stone-800 tabular-nums">{formatRupiah(pesananTunai.total_bayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Sudah Masuk:</span>
                  <span className="font-bold text-stone-800 tabular-nums">{formatRupiah(pesananTunai.jumlah_terbayar)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-stone-100 font-black text-stone-900 text-sm">
                  <span>Jumlah Pelunasan Tunai:</span>
                  <span className="text-[#9E3B42] tabular-nums">
                    {formatRupiah(Math.max(0, Number(pesananTunai.total_bayar || 0) - Number(pesananTunai.jumlah_terbayar || 0)))}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                Pelunasan tunai akan langsung tercatat sebagai lunas pada sistem dan tercatat dalam riwayat pembayaran pesanan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dfd4bd]">
              <button
                type="button"
                disabled={sedangSimpanTunai}
                onClick={() => setModalTunaiBuka(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 font-semibold hover:bg-stone-50 text-xs cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangSimpanTunai}
                onClick={handleSimpanPelunasan}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {sedangSimpanTunai ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Konfirmasi Terima Uang Tunai</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerBuka && (
        <div className="fixed inset-0 !mt-0 z-[9999] overflow-hidden">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={tutupDrawer}
          />
          <aside className="fixed inset-y-0 right-0 max-w-[560px] w-full bg-[#fbf6e9] border-l border-[#dfd4bd] shadow-2xl p-5 flex flex-col z-10 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dfc8] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center font-bold text-xs shadow-2xs">
                  <i className="fa-solid fa-receipt text-xs" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1d3b2e]">Detail Pesanan</h3>
                  <p className="text-[10px] font-mono font-bold text-stone-500">{drawerKode}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={tutupDrawer}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center text-xs transition cursor-pointer"
                title="Tutup Drawer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {detailLoading ? (
                <div className="py-16 text-center text-stone-400">
                  <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#9E3B42] mb-2 block" />
                  <span className="text-xs font-medium">Memuat detail pesanan...</span>
                </div>
              ) : !detailPesanan?.pesanan ? (
                <div className="py-16 text-center text-stone-400">
                  <p className="text-xs font-semibold text-stone-600">Gagal memuat rincian pesanan.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl border border-[#dfd4bd] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Status Pesanan & Bayar
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                          {detailPesanan.pesanan.status_pesanan}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {detailPesanan.pesanan.status_bayar}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Penerima</span>
                        <span className="font-bold text-stone-800">{detailPesanan.pesanan.nama_penerima}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">WhatsApp</span>
                        <span className="font-mono text-stone-800">{detailPesanan.pesanan.no_wa}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Metode</span>
                        <span className="font-semibold text-stone-800">
                          {detailPesanan.pesanan.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim Kurir"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Jadwal</span>
                        <span className="font-semibold text-stone-800">
                          {formatTanggalSingkat(detailPesanan.pesanan.tanggal_ambil)}{" "}
                          {detailPesanan.pesanan.jam_ambil ? detailPesanan.pesanan.jam_ambil.slice(0, 5) : ""}
                        </span>
                      </div>
                    </div>

                    {detailPesanan.pesanan.alamat_pengiriman && (
                      <div className="pt-2 border-t border-stone-100 text-xs">
                        <span className="text-[10px] text-stone-400 block">Alamat Kirim</span>
                        <p className="text-stone-700 mt-0.5">{detailPesanan.pesanan.alamat_pengiriman}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-[#dfd4bd] p-4 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Daftar Item ({detailPesanan.items?.length || 0})
                    </span>
                    <div className="space-y-2">
                      {(detailPesanan.items || []).map((it) => (
                        <div key={it.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex justify-between items-start">
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {it.jumlah}x {it.nama_item}
                            </span>
                            {it.spesifikasi_singkat && (
                              <span className="text-[11px] text-stone-500 block">{it.spesifikasi_singkat}</span>
                            )}
                            {it.catatan_opsi && (
                              <span className="text-[10px] text-stone-400 block italic mt-0.5">Catatan: {it.catatan_opsi}</span>
                            )}
                          </div>
                          <span className="font-bold text-stone-800 tabular-nums">
                            {formatRupiah(it.subtotal || it.harga_satuan * it.jumlah)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {detailPesanan.pesanan.tulisan_kue && (
                      <div className="p-2.5 rounded-xl bg-[#fbf6e9] border border-[#dfd4bd] text-xs">
                        <span className="text-[10px] font-bold text-[#9E3B42] uppercase tracking-wider block">
                          Tulisan pada Kue
                        </span>
                        <p className="font-bold text-stone-800 italic mt-0.5">
                          &ldquo;{detailPesanan.pesanan.tulisan_kue}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-[#dfd4bd] p-4 space-y-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Ringkasan Pembayaran
                    </span>
                    <div className="flex justify-between text-stone-600">
                      <span>Total Tagihan:</span>
                      <span className="font-bold text-stone-900 tabular-nums">{formatRupiah(detailPesanan.pesanan.total_bayar)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Sudah Terbayar:</span>
                      <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(detailPesanan.pesanan.jumlah_terbayar)}</span>
                    </div>
                    <div className="flex justify-between font-black text-stone-900 pt-1.5 border-t border-stone-100 text-sm">
                      <span>Sisa Tagihan:</span>
                      <span className="text-[#9E3B42] tabular-nums">
                        {formatRupiah(Math.max(0, Number(detailPesanan.pesanan.total_bayar || 0) - Number(detailPesanan.pesanan.jumlah_terbayar || 0)))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#dfd4bd] p-4 space-y-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Riwayat Pesanan
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(detailPesanan.riwayat || []).map((rw) => (
                        <div key={rw.id} className="text-[11px] text-stone-600 border-l-2 border-[#dfd4bd] pl-2 py-0.5">
                          <span className="font-bold text-stone-800">{rw.status_baru || rw.aksi}</span>
                          <span className="text-stone-400 block text-[10px]">{formatTanggalWaktu(rw.created_at)}</span>
                          {rw.catatan && <p className="text-stone-500 text-[10px] mt-0.5">{rw.catatan}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#e8dfc8] shrink-0 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={tutupDrawer}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
              >
                Tutup
              </button>

              <Link
                href={`/dashboard/pesanan`}
                className="px-4 py-2 rounded-xl bg-[#1d3b2e] hover:bg-[#152b22] text-white text-xs font-bold transition cursor-pointer"
              >
                Kelola di Menu Pesanan
              </Link>
            </div>
          </aside>
        </div>
      )}

      {konfirmasiStatus.terbuka && (
        <div
          className="fixed inset-0 !mt-0 z-[10000] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sedangProses) {
              setKonfirmasiStatus({ terbuka: false, kodePesanan: "", statusBaru: "" });
            }
          }}
        >
          <div className="bg-[#FFFDF9] border border-[#dfd4bd] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfd4bd]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <i className="fa-solid fa-arrows-rotate text-sm" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#1d3b2e]">Konfirmasi Ubah Status</h3>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">#{konfirmasiStatus.kodePesanan}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => setKonfirmasiStatus({ terbuka: false, kodePesanan: "", statusBaru: "" })}
                className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 cursor-pointer disabled:opacity-50"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#dfd4bd] text-xs space-y-2">
              <p className="text-stone-600 leading-relaxed">
                Apakah Anda yakin ingin mengubah status pesanan{" "}
                <span className="font-mono font-bold text-[#1d3b2e]">#{konfirmasiStatus.kodePesanan}</span>{" "}
                menjadi:
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-500">Status Baru:</span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
                  {konfirmasiStatus.statusBaru}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dfd4bd]">
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => setKonfirmasiStatus({ terbuka: false, kodePesanan: "", statusBaru: "" })}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 font-semibold hover:bg-stone-50 text-xs cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProses}
                onClick={eksekusiUbahStatus}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {sedangProses ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>Memperbarui...</span>
                  </>
                ) : (
                  <span>Ya, Ubah Status</span>
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
        onKonfirmasi={notifikasi.onKonfirmasi}
        padaTutup={() => setNotifikasi({ ...notifikasi, terbuka: false, onKonfirmasi: null })}
      />
    </div>
  );
}
