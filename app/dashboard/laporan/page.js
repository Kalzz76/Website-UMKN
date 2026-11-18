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
      const { data: pilList } = await supabase
        .from("pesanan_pilihan")
        .select("nama_grup, nama_item")
        .in("id_pesanan", pesananIds);

      if (pilList) {
        for (let i = 0; i < pilList.length; i++) {
          const row = pilList[i];
          if (!opsiGrupMap[row.nama_grup]) {
            opsiGrupMap[row.nama_grup] = {};
          }
          opsiGrupMap[row.nama_grup][row.nama_item] =
            (opsiGrupMap[row.nama_grup][row.nama_item] || 0) + 1;
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">
            Laporan Bisnis & Penjualan
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Analisis omzet kas masuk, statistik pesanan, opsi terlaris, dan piutang pelanggan.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <i className="fa-solid fa-file-csv text-emerald-600"></i>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm cursor-pointer"
          >
            <i className="fa-solid fa-print"></i>
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 print:border-none print:shadow-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Periode Laporan
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-stone-500">Dari:</span>
              <input
                type="date"
                value={dariTanggal}
                onChange={(e) => setDariTanggal(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 bg-white"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-stone-500">Sampai:</span>
              <input
                type="date"
                value={sampaiTanggal}
                onChange={(e) => setSampaiTanggal(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="hidden print:block pb-4 border-b border-stone-200">
          <h2 className="text-xl font-bold text-stone-900">Laporan Penjualan Toko Kue</h2>
          <p className="text-xs text-stone-500">
            Periode: {formatTanggalSingkat(dariTanggal)} s/d {formatTanggalSingkat(sampaiTanggal)}
          </p>
        </div>

        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-rose-500"></i>
            <p className="text-xs">Memuat laporan...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Omzet Kas Masuk
                </span>
                <p className="text-2xl font-black text-emerald-950 mt-2 truncate">
                  {formatRupiah(dataLaporan.omzet)}
                </p>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  Pembayaran berstatus dikonfirmasi
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Total Piutang
                </span>
                <p className="text-2xl font-black text-rose-950 mt-2 truncate">
                  {formatRupiah(dataLaporan.piutang)}
                </p>
                <span className="text-[11px] text-rose-700 mt-1 block">
                  Sisa tagihan pesanan aktif
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Total Pesanan
                </span>
                <p className="text-2xl font-black text-stone-900 mt-2">
                  {dataLaporan.daftarPesanan.length}
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Jadwal pada rentang periode ini
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Ringkasan DP & Lunas
                </span>
                <div className="mt-2 text-xs space-y-0.5 text-stone-700 font-medium">
                  <p>DP Masuk: <strong>{formatRupiah(dataLaporan.totalDp)}</strong></p>
                  <p>Pelunasan: <strong>{formatRupiah(dataLaporan.totalPelunasan)}</strong></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Jumlah Pesanan Berdasarkan Status
                </h4>
                <div className="divide-y divide-stone-200/60 text-xs">
                  {Object.keys(dataLaporan.hitungStatus).length === 0 ? (
                    <p className="py-2 text-stone-400">Tidak ada pesanan pada periode ini.</p>
                  ) : (
                    Object.entries(dataLaporan.hitungStatus).map(([st, jml]) => (
                      <div key={st} className="py-2 flex justify-between items-center">
                        <span className="text-stone-700">{st}</span>
                        <strong className="text-stone-900 font-bold">{jml} pesanan</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Metode Pengambilan
                </h4>
                <div className="divide-y divide-stone-200/60 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-stone-700">Ambil di Toko</span>
                    <strong className="text-stone-900 font-bold">{dataLaporan.hitungPengambilan.Ambil || 0} pesanan</strong>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-stone-700">Kirim ke Alamat</span>
                    <strong className="text-stone-900 font-bold">{dataLaporan.hitungPengambilan.Kirim || 0} pesanan</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-stone-900">
                Pilihan & Opsi Terlaris per Grup
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(dataLaporan.opsiTerlaris).map(([namaGrup, items]) => (
                  <div key={namaGrup} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 space-y-2 text-xs">
                    <span className="font-bold text-stone-800 block pb-1 border-b border-stone-200/60">
                      {namaGrup}
                    </span>
                    <div className="space-y-1">
                      {Object.entries(items)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([namaItem, count]) => (
                          <div key={namaItem} className="flex justify-between items-center text-stone-600">
                            <span className="truncate pr-2">{namaItem}</span>
                            <span className="font-bold text-stone-900">{count}x</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {dataLaporan.stokMenipis.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                <h4 className="font-bold text-rose-800 flex items-center space-x-1.5">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>Perhatian: Bahan Dapur Menipis Saat Ini</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dataLaporan.stokMenipis.map((b) => (
                    <span key={b.id} className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-medium">
                      {b.nama}: {b.jumlah} {b.satuan} (Min: {b.batas_minimum} {b.satuan})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-stone-900">
                Daftar Pesanan dalam Periode ({dataLaporan.daftarPesanan.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 uppercase">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">Kode</th>
                      <th className="py-2.5 px-3">Nama Pelanggan</th>
                      <th className="py-2.5 px-3">Jadwal</th>
                      <th className="py-2.5 px-3">Pengiriman</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Bayar</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {dataLaporan.daftarPesanan.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-bold text-stone-900">{p.kode_pesanan}</td>
                        <td className="py-2.5 px-3 font-medium text-stone-800">{p.nama_penerima}</td>
                        <td className="py-2.5 px-3 text-stone-600">{p.tanggal_ambil} {p.jam_ambil?.slice(0, 5)}</td>
                        <td className="py-2.5 px-3">{p.metode_pengiriman}</td>
                        <td className="py-2.5 px-3">{p.status_pesanan}</td>
                        <td className="py-2.5 px-3 font-semibold text-stone-800">{p.status_bayar}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-stone-900">{formatRupiah(p.total_bayar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}