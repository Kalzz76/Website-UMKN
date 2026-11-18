"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalSingkat } from "@/lib/format";

export default function DaftarPesananDashboardPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [daftarPesanan, setDaftarPesanan] = useState([]);
  const [totalBaris, setTotalBaris] = useState(0);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [halaman, setHalaman] = useState(1);
  const batasPerHalaman = 10;

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
      .select("role, nama")
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
    }
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatPesanan();
  }, [filterStatus, filterTanggal, halaman]);

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

  const isAdmin = profil?.role === "admin";
  const totalHalaman = Math.ceil(totalBaris / batasPerHalaman) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
        <form onSubmit={handleCari} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cari Pesanan
            </label>
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-stone-400 text-xs"></i>
              <input
                type="text"
                placeholder="Kode atau nama pelanggan..."
                value={kataKunci}
                onChange={(e) => setKataKunci(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Filter Status Pesanan
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setHalaman(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-xs bg-white"
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
              Filter Tanggal
            </label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => {
                setFilterTanggal(e.target.value);
                setHalaman(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-xs bg-white"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition cursor-pointer"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium transition cursor-pointer"
              title="Reset Filter"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </form>

        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-rose-500"></i>
            <p className="text-xs">Memuat data pesanan...</p>
          </div>
        ) : daftarPesanan.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-box-open text-3xl mb-2 block text-stone-300"></i>
            <p className="text-sm font-semibold text-stone-700">Belum ada pesanan ditemukan.</p>
            <p className="text-xs text-stone-400 mt-1">Coba ubah kata kunci atau filter status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Kode</th>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Jadwal Ambil / Kirim</th>
                  <th className="py-3 px-4">Pengambilan</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  {isAdmin && <th className="py-3 px-4">Status Bayar</th>}
                  {isAdmin && <th className="py-3 px-4">Total</th>}
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daftarPesanan.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {p.kode_pesanan}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      <div>
                        <span>{p.nama_penerima}</span>
                        <span className="text-[11px] text-stone-400 block">{p.no_wa}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 text-xs">
                      {formatTanggalSingkat(p.tanggal_ambil)} pukul {p.jam_ambil?.slice(0, 5)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-stone-100 text-stone-700">
                        {p.metode_pengiriman === "Ambil" ? "Ambil di Tempat" : "Kirim"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeStatusPesanan(
                          p.status_pesanan
                        )}`}
                      >
                        {p.status_pesanan}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeStatusBayar(
                            p.status_bayar
                          )}`}
                        >
                          {p.status_bayar}
                        </span>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3.5 px-4 font-semibold text-stone-900 text-xs">
                        {formatRupiah(p.total_bayar)}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/pesanan/${p.kode_pesanan}`}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-500 py-1 px-3 rounded-full hover:bg-rose-50 transition"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalBaris > batasPerHalaman && (
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
            <span className="text-stone-500">
              Menampilkan {daftarPesanan.length} dari {totalBaris} pesanan
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={halaman <= 1}
                onClick={() => setHalaman((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-semibold text-stone-800">
                {halaman} / {totalHalaman}
              </span>
              <button
                type="button"
                disabled={halaman >= totalHalaman}
                onClick={() => setHalaman((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}