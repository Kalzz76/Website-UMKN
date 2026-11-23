"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalSingkat, getTanggalHariIniJakarta } from "@/lib/format";

export default function LaporanDashboardPage() {
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
    hitungStatus: {},
    hitungPengambilan: { Ambil: 0, Kirim: 0 },
    opsiTerlaris: {},
    stokMenipis: [],
    daftarPesanan: [],
  });

  async function muatLaporan() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const dariIso = `${dariTanggal}T00:00:00Z`;
    const sampaiIso = `${sampaiTanggal}T23:59:59Z`;

    const { data: bayarList } = await supabase
      .from("pembayaran")
      .select("jenis, jumlah, status, dibuat_pada")
      .eq("status", "Dikonfirmasi")
      .gte("dibuat_pada", dariIso)
      .lte("dibuat_pada", sampaiIso);

    let omzetTotal = 0;
    let dpTotal = 0;
    let pelunasanTotal = 0;
    let lunasLangsungTotal = 0;

    if (bayarList) {
      for (let i = 0; i < bayarList.length; i++) {
        const b = bayarList[i];
        const j = b.jumlah || 0;
        omzetTotal += j;
        if (b.jenis === "DP") dpTotal += j;
        else if (b.jenis === "Pelunasan") pelunasanTotal += j;
        else if (b.jenis === "Lunas") lunasLangsungTotal += j;
      }
    }

    const { data: pesananList } = await supabase
      .from("pesanan")
      .select("id, kode_pesanan, nama_penerima, tanggal_ambil, jam_ambil, metode_pengiriman, status_pesanan, status_bayar, total_bayar, jumlah_terbayar")
      .gte("tanggal_ambil", dariTanggal)
      .lte("tanggal_ambil", sampaiTanggal)
      .order("tanggal_ambil", { ascending: true });

    let piutangTotal = 0;
    const statusCounts = {};
    const pengCounts = { Ambil: 0, Kirim: 0 };
    const pesananIds = [];

    if (pesananList) {
      for (let i = 0; i < pesananList.length; i++) {
        const p = pesananList[i];
        pesananIds.push(p.id);

        statusCounts[p.status_pesanan] = (statusCounts[p.status_pesanan] || 0) + 1;
        pengCounts[p.metode_pengiriman] = (pengCounts[p.metode_pengiriman] || 0) + 1;

        if (p.status_pesanan !== "Dibatalkan" && p.status_bayar !== "Lunas") {
          piutangTotal += (p.total_bayar - p.jumlah_terbayar);
        }
      }
    }

    const opsiGrupMap = {};
    if (pesananIds.length > 0) {
      const [pilRes, itemRes] = await Promise.all([
        supabase
          .from("pesanan_pilihan")
          .select("nama_grup, nama_item")
          .in("id_pesanan", pesananIds),
        supabase
          .from("pesanan_item")
          .select("jenis, nama_item, jumlah")
          .in("id_pesanan", pesananIds)
      ]);

      const pilList = pilRes.data || [];
      for (let i = 0; i < pilList.length; i++) {
        const row = pilList[i];
        if (row.nama_grup && row.nama_item) {
          if (!opsiGrupMap[row.nama_grup]) {
            opsiGrupMap[row.nama_grup] = {};
          }
          opsiGrupMap[row.nama_grup][row.nama_item] =
            (opsiGrupMap[row.nama_grup][row.nama_item] || 0) + 1;
        }
      }

      const itList = itemRes.data || [];
      for (let i = 0; i < itList.length; i++) {
        const it = itList[i];
        if (it.jenis === "Siap" && it.nama_item) {
          if (!opsiGrupMap["Kue Katalog"]) {
            opsiGrupMap["Kue Katalog"] = {};
          }
          opsiGrupMap["Kue Katalog"][it.nama_item] =
            (opsiGrupMap["Kue Katalog"][it.nama_item] || 0) + (Number(it.jumlah) || 1);
        }
      }
    }

    const { data: bList } = await supabase.from("bahan").select("*");
    const menipisList = [];
    if (bList) {
      for (let i = 0; i < bList.length; i++) {
        if (Number(bList[i].jumlah) <= Number(bList[i].batas_minimum)) {
          menipisList.push(bList[i]);
        }
      }
    }

    setDataLaporan({
      omzet: omzetTotal,
      piutang: piutangTotal,
      totalDp: dpTotal,
      totalPelunasan: pelunasanTotal,
      totalLunasLangsung: lunasLangsungTotal,
      hitungStatus: statusCounts,
      hitungPengambilan: pengCounts,
      opsiTerlaris: opsiGrupMap,
      stokMenipis: menipisList,
      daftarPesanan: pesananList || [],
    });

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatLaporan();
  }, [dariTanggal, sampaiTanggal]);

  function exportCsv() {
    const barisCsv = [];
    barisCsv.push(["Kode Pesanan", "Nama Pelanggan", "Tanggal Ambil", "Jam", "Pengiriman", "Status Pesanan", "Status Bayar", "Total Tagihan", "Terbayar"].join(","));

    for (let i = 0; i < dataLaporan.daftarPesanan.length; i++) {
      const p = dataLaporan.daftarPesanan[i];
      const baris = [
        `"${p.kode_pesanan}"`,
        `"${p.nama_penerima.replace(/"/g, '""')}"`,
        `"${p.tanggal_ambil}"`,
        `"${p.jam_ambil}"`,
        `"${p.metode_pengiriman}"`,
        `"${p.status_pesanan}"`,
        `"${p.status_bayar}"`,
        p.total_bayar,
        p.jumlah_terbayar,
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
              <p className="text-2xl font-black text-stone-900 truncate">
                {formatRupiah(dataLaporan.omzet)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Pembayaran status dikonfirmasi
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
              <p className="text-2xl font-black text-stone-900 truncate">
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
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-bag-shopping"></i>
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900">
                {dataLaporan.daftarPesanan.length}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Jadwal pesanan pada periode ini
              </p>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Rincian Penerimaan
                </span>
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-scale-balanced"></i>
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-stone-600">
                  <span>DP Masuk:</span>
                  <strong className="text-stone-900 font-bold">{formatRupiah(dataLaporan.totalDp)}</strong>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Pelunasan:</span>
                  <strong className="text-stone-900 font-bold">{formatRupiah(dataLaporan.totalPelunasan)}</strong>
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

          {Object.keys(dataLaporan.opsiTerlaris).length > 0 && (
            <div className="content-card p-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-200 mb-4">
                <i className="fa-solid fa-fire text-amber-500 text-sm"></i>
                <h3 className="text-sm font-bold text-stone-900">
                  Pilihan & Opsi Terlaris per Kategori
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(dataLaporan.opsiTerlaris).map(([namaGrup, items]) => (
                  <div key={namaGrup} className="space-y-2 text-xs">
                    <h4 className="font-bold text-stone-800 pb-1.5 border-b border-stone-200">
                      {namaGrup}
                    </h4>
                    <div className="divide-y divide-stone-100">
                      {Object.entries(items)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([namaItem, count], idx) => (
                          <div key={namaItem} className="py-1.5 flex justify-between items-center text-stone-600">
                            <span className="truncate pr-2">
                              <strong className="text-stone-400 font-semibold mr-1.5">#{idx + 1}</strong>
                              {namaItem}
                            </span>
                            <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md flex-none">
                              {count}x
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            </div>
            {dataLaporan.daftarPesanan.length === 0 ? (
              <p className="py-8 text-center text-stone-400 text-xs font-medium">
                Belum ada transaksi pesanan pada rentang tanggal ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
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
                      <tr key={p.id}>
                        <td className="py-3 px-3 font-bold text-stone-900">{p.kode_pesanan}</td>
                        <td className="py-3 px-3 font-medium text-stone-800">{p.nama_penerima}</td>
                        <td className="py-3 px-3 text-stone-600">{p.tanggal_ambil} {p.jam_ambil?.slice(0, 5)}</td>
                        <td className="py-3 px-3">{p.metode_pengiriman}</td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-stone-100 text-stone-700">
                            {p.status_pesanan}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${getBadgeStatusBayar(p.status_bayar)}`}>
                            {p.status_bayar}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900">{formatRupiah(p.total_bayar)}</td>
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