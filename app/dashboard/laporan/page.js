"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalSingkat, getTanggalHariIniJakarta } from "@/lib/format";

export default function LaporanDashboardPage() {
  const router = useRouter();
  const [sedangMemuat, setSedangMemuat] = useState(true);

  const hariIni = getTanggalHariIniJakarta();
  const awalBulanIni = `${hariIni.slice(0, 7)}-01`;

  const [dariTanggal, setDariTanggal] = useState(awalBulanIni);
  const [sampaiTanggal, setSampaiTanggal] = useState(hariIni);

  const [dataLaporan, setDataLaporan] = useState({
    omzet: 0,
    piutang: 0,
    totalDp: 0,
    totalPelunasan: 0,
    totalLunasLangsung: 0,
    nilaiCustom: 0,
    nilaiKatalog: 0,
    nilaiOngkir: 0,
    totalNilaiPenjualan: 0,
    jumlahPerluRefund: 0,
    hitungStatus: {},
    hitungPengambilan: { Ambil: 0, Kirim: 0 },
    opsiTerlaris: {},
    katalogTerlaris: [],
    stokMenipis: [],
    daftarPesanan: [],
  });

  useEffect(() => {
    async function cekAkses() {
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/masuk?ke=/dashboard/laporan");
        return;
      }

      const { data: prof } = await supabase
        .from("profil")
        .select("role")
        .eq("id", user.id)
        .single();

      if (prof?.role === "staf") {
        router.replace("/dashboard");
      }
    }
    cekAkses();
  }, [router]);

  async function muatLaporan() {
    setSedangMemuat(true);
    try {
      const res = await fetch(`/api/laporan?dari=${dariTanggal}&sampai=${sampaiTanggal}`);
      if (!res.ok) {
        setSedangMemuat(false);
        return;
      }
      const json = await res.json();
      if (json.sukses) {
        setDataLaporan({
          omzet: json.omzet || 0,
          piutang: json.piutang || 0,
          totalDp: json.totalDp || 0,
          totalPelunasan: json.totalPelunasan || 0,
          totalLunasLangsung: json.totalLunasLangsung || 0,
          nilaiCustom: json.nilaiCustom || 0,
          nilaiKatalog: json.nilaiKatalog || 0,
          nilaiOngkir: json.nilaiOngkir || 0,
          totalNilaiPenjualan: json.totalNilaiPenjualan || 0,
          jumlahPerluRefund: json.jumlahPerluRefund || 0,
          hitungStatus: json.hitungStatus || {},
          hitungPengambilan: json.hitungPengambilan || { Ambil: 0, Kirim: 0 },
          opsiTerlaris: json.opsiTerlaris || {},
          katalogTerlaris: json.katalogTerlaris || [],
          stokMenipis: json.stokMenipis || [],
          daftarPesanan: json.daftarPesanan || [],
        });
      }
    } catch {
    } finally {
      setSedangMemuat(false);
    }
  }

  useEffect(() => {
    muatLaporan();
  }, [dariTanggal, sampaiTanggal]);

  function exportCsv() {
    const barisCsv = [];
    barisCsv.push([
      "Kode Pesanan",
      "Jenis",
      "Isi",
      "Nama Pelanggan",
      "Tanggal Ambil",
      "Jam",
      "Pengiriman",
      "Status Pesanan",
      "Perlu Refund",
      "Status Bayar",
      "Total Tagihan",
      "Terbayar",
    ].join(","));

    for (let i = 0; i < dataLaporan.daftarPesanan.length; i++) {
      const p = dataLaporan.daftarPesanan[i];
      const baris = [
        `"${p.kode_pesanan}"`,
        `"${p.jenisPesanan}"`,
        `"${p.isiRingkas}"`,
        `"${(p.nama_penerima || "").replace(/"/g, '""')}"`,
        `"${p.tanggal_ambil || ""}"`,
        `"${p.jam_ambil || ""}"`,
        `"${p.metode_pengiriman || ""}"`,
        `"${p.status_pesanan || ""}"`,
        `"${p.perlu_refund ? "Ya" : "Tidak"}"`,
        `"${p.status_bayar || ""}"`,
        p.total_bayar || 0,
        p.jumlah_terbayar || 0,
      ];
      barisCsv.push(baris.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(barisCsv.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `laporan-pesanan-${dariTanggal}-sampai-${sampaiTanggal}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalPengambilan = (dataLaporan.hitungPengambilan.Ambil || 0) + (dataLaporan.hitungPengambilan.Kirim || 0);
  const persenAmbil = totalPengambilan > 0 ? Math.round(((dataLaporan.hitungPengambilan.Ambil || 0) / totalPengambilan) * 100) : 0;
  const persenKirim = totalPengambilan > 0 ? 100 - persenAmbil : 0;

  function getBadgeStatusBayar(status) {
    if (status === "Lunas") return "bg-emerald-100 text-emerald-800";
    if (status === "DP Dibayar") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeJenis(jenis) {
    if (jenis === "Custom") return "bg-amber-100 text-amber-900 border border-amber-200";
    if (jenis === "Katalog") return "bg-sky-100 text-sky-900 border border-sky-200";
    return "bg-emerald-100 text-emerald-900 border border-emerald-200";
  }

  return (
    <div className="space-y-6">
      <div className="content-card p-6 print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Laporan Keuangan & Penjualan
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Pantau arus kas masuk, piutang, dan statistik pesanan toko Anda
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={exportCsv}
              className="h-[42px] px-4 rounded-xl border-2 border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-file-csv text-emerald-700 text-sm"></i>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-[42px] px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-stone-700">
            <i className="fa-regular fa-calendar-days text-stone-500 text-sm"></i>
            <span>Rentang Tanggal Laporan:</span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-stone-500">Dari:</span>
              <input
                type="date"
                value={dariTanggal}
                onChange={(e) => setDariTanggal(e.target.value)}
                className="text-xs outline-none"
              />
            </div>
            <span className="text-stone-400 text-xs hidden sm:inline">-</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-stone-500">Sampai:</span>
              <input
                type="date"
                value={sampaiTanggal}
                onChange={(e) => setSampaiTanggal(e.target.value)}
                className="text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block p-4 border-b border-stone-200">
        <h2 className="text-xl font-bold text-stone-900">Laporan Penjualan Toko Kue</h2>
        <p className="text-xs text-stone-500">
          Periode: {formatTanggalSingkat(dariTanggal)} s/d {formatTanggalSingkat(sampaiTanggal)}
        </p>
      </div>

      {sedangMemuat ? (
        <div className="content-card py-16 text-center text-stone-400">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
          <p className="text-sm font-medium">Memuat data laporan...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="content-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Omzet Kas Masuk
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-coins"></i>
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900 truncate lining-nums tabular-nums">
                {formatRupiah(dataLaporan.omzet)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Pembayaran status Dikonfirmasi
              </p>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Nilai Penjualan
                </span>
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-cart-shopping"></i>
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900 truncate lining-nums tabular-nums">
                {formatRupiah(dataLaporan.totalNilaiPenjualan)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Pesanan non-batal dibuat pada periode
              </p>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Total Piutang
                </span>
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-receipt"></i>
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900 truncate lining-nums tabular-nums">
                {formatRupiah(dataLaporan.piutang)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Sisa tagihan pesanan aktif
              </p>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Total Pesanan
                </span>
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-bag-shopping"></i>
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900">
                {dataLaporan.daftarPesanan.length}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                {dataLaporan.jumlahPerluRefund > 0 ? (
                  <span className="text-rose-600 font-bold">
                    {dataLaporan.jumlahPerluRefund} pesanan Perlu Refund
                  </span>
                ) : (
                  "Semua pesanan tercatat"
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="content-card p-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-chart-pie text-amber-700 text-sm"></i>
                  <h3 className="text-sm font-bold text-stone-900">
                    Rincian Nilai Penjualan
                  </h3>
                </div>
                <span className="text-xs font-bold text-stone-900 lining-nums tabular-nums">
                  {formatRupiah(dataLaporan.totalNilaiPenjualan)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-stone-700 font-medium">Kue Custom</span>
                  </div>
                  <strong className="text-stone-900 font-bold lining-nums tabular-nums">
                    {formatRupiah(dataLaporan.nilaiCustom)}
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="text-stone-700 font-medium">Kue Katalog</span>
                  </div>
                  <strong className="text-stone-900 font-bold lining-nums tabular-nums">
                    {formatRupiah(dataLaporan.nilaiKatalog)}
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
                    <span className="text-stone-700 font-medium">Ongkos Kirim</span>
                  </div>
                  <strong className="text-stone-900 font-bold lining-nums tabular-nums">
                    {formatRupiah(dataLaporan.nilaiOngkir)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-money-bill-transfer text-emerald-700 text-sm"></i>
                  <h3 className="text-sm font-bold text-stone-900">
                    Rincian Arus Kas Masuk
                  </h3>
                </div>
                <span className="text-xs font-bold text-stone-900 lining-nums tabular-nums">
                  {formatRupiah(dataLaporan.omzet)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-medium">Uang Muka (DP):</span>
                  <strong className="text-stone-900 font-bold lining-nums tabular-nums">
                    {formatRupiah(dataLaporan.totalDp)}
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-medium">Pelunasan:</span>
                  <strong className="text-stone-900 font-bold lining-nums tabular-nums">
                    {formatRupiah(dataLaporan.totalPelunasan)}
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-700 font-medium">Bayar Penuh / Lunas Awal:</span>
                  <strong className="text-stone-900 font-bold lining-nums tabular-nums">
                    {formatRupiah(dataLaporan.totalLunasLangsung)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="content-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-list-check text-stone-700 text-sm"></i>
                  <h3 className="text-sm font-bold text-stone-900">
                    Status Pesanan
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  Total {dataLaporan.daftarPesanan.length}
                </span>
              </div>
              <div className="divide-y divide-stone-100 text-xs">
                {Object.keys(dataLaporan.hitungStatus).length === 0 ? (
                  <p className="py-6 text-center text-stone-400">Tidak ada pesanan pada periode ini.</p>
                ) : (
                  Object.entries(dataLaporan.hitungStatus).map(([st, jml]) => (
                    <div key={st} className="py-3 flex justify-between items-center">
                      <span className="font-medium text-stone-700">{st}</span>
                      <span className="font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full">
                        {jml} pesanan
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="content-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-truck-ramp-box text-stone-700 text-sm"></i>
                  <h3 className="text-sm font-bold text-stone-900">
                    Metode Pengambilan
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  Total {totalPengambilan}
                </span>
              </div>
              <div className="py-4 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-medium">
                    <span className="text-stone-700">Ambil Sendiri di Toko</span>
                    <span className="font-bold text-stone-900">{dataLaporan.hitungPengambilan.Ambil || 0} pesanan ({persenAmbil}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${persenAmbil}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 font-medium">
                    <span className="text-stone-700">Kirim ke Alamat Pemesan</span>
                    <span className="font-bold text-stone-900">{dataLaporan.hitungPengambilan.Kirim || 0} pesanan ({persenKirim}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full transition-all" style={{ width: `${persenKirim}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="content-card p-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-200 mb-4">
                <i className="fa-solid fa-box-open text-sky-600 text-sm"></i>
                <h3 className="text-sm font-bold text-stone-900">
                  Produk Katalog Terlaris
                </h3>
              </div>
              {dataLaporan.katalogTerlaris.length === 0 ? (
                <p className="py-8 text-center text-stone-400 text-xs font-medium">
                  Belum ada produk katalog terjual pada periode ini.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 text-xs">
                  {dataLaporan.katalogTerlaris.slice(0, 10).map((prod, idx) => (
                    <div key={prod.nama} className="py-2.5 flex justify-between items-center">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-stone-800 truncate">
                          {prod.nama}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 flex-none">
                        <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                          {prod.jumlah} terjual
                        </span>
                        <span className="font-bold text-emerald-800 lining-nums tabular-nums hidden sm:inline">
                          {formatRupiah(prod.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="content-card p-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-200 mb-4">
                <i className="fa-solid fa-wand-magic-sparkles text-amber-600 text-sm"></i>
                <h3 className="text-sm font-bold text-stone-900">
                  Opsi Terlaris Custom Cake
                </h3>
              </div>
              {Object.keys(dataLaporan.opsiTerlaris).length === 0 ? (
                <p className="py-8 text-center text-stone-400 text-xs font-medium">
                  Belum ada opsi custom cake pada periode ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(dataLaporan.opsiTerlaris).map(([namaGrup, items]) => (
                    <div key={namaGrup} className="space-y-1.5 text-xs">
                      <h4 className="font-bold text-stone-800 pb-1 border-b border-stone-100">
                        {namaGrup}
                      </h4>
                      <div className="divide-y divide-stone-100">
                        {Object.entries(items)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([namaItem, count], idx) => (
                            <div key={namaItem} className="py-1 flex justify-between items-center text-stone-600">
                              <span className="truncate pr-2">
                                <strong className="text-stone-400 font-semibold mr-1">#{idx + 1}</strong>
                                {namaItem}
                              </span>
                              <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-[11px] flex-none">
                                {count}x
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {dataLaporan.stokMenipis.length > 0 && (
            <div className="content-card p-4 border border-amber-200">
              <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold mb-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Perhatian Stok: Bahan Dapur Menipis</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dataLaporan.stokMenipis.map((b) => (
                  <span key={b.id} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
                    {b.nama}: {b.jumlah} {b.satuan} (Min: {b.batas_minimum} {b.satuan})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="content-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-table-list text-stone-700 text-sm"></i>
                <h3 className="text-sm font-bold text-stone-900">
                  Daftar Pesanan dalam Periode ({dataLaporan.daftarPesanan.length})
                </h3>
              </div>
              {dataLaporan.jumlahPerluRefund > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {dataLaporan.jumlahPerluRefund} Perlu Refund
                </span>
              )}
            </div>
            {dataLaporan.daftarPesanan.length === 0 ? (
              <p className="py-8 text-center text-stone-400 text-xs font-medium">
                Belum ada transaksi pesanan pada rentang tanggal ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-600 font-bold">
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Jenis</th>
                      <th className="py-2.5 px-3">Isi</th>
                      <th className="py-2.5 px-3">Nama Pelanggan</th>
                      <th className="py-2.5 px-3">Jadwal Ambil</th>
                      <th className="py-2.5 px-3">Pengiriman</th>
                      <th className="py-2.5 px-3">Status Pesanan</th>
                      <th className="py-2.5 px-3">Status Bayar</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLaporan.daftarPesanan.map((p) => (
                      <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition">
                        <td className="py-3 px-3 font-bold text-stone-900">{p.kode_pesanan}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${getBadgeJenis(p.jenisPesanan)}`}>
                            {p.jenisPesanan}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-700 font-medium">{p.isiRingkas}</td>
                        <td className="py-3 px-3 font-medium text-stone-800">{p.nama_penerima}</td>
                        <td className="py-3 px-3 text-stone-600">
                          {p.tanggal_ambil} {p.jam_ambil ? p.jam_ambil.slice(0, 5) : ""}
                        </td>
                        <td className="py-3 px-3">{p.metode_pengiriman}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-stone-100 text-stone-700">
                              {p.status_pesanan}
                            </span>
                            {p.perlu_refund && (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                                Perlu Refund
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${getBadgeStatusBayar(p.status_bayar)}`}>
                            {p.status_bayar}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900 lining-nums tabular-nums">
                          {formatRupiah(p.total_bayar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
