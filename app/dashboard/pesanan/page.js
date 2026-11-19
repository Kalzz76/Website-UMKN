"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalSingkat } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";

export default function PesananDashboardPage() {
  const router = useRouter();

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

        const thumbObj = {};
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          if (item.foto_preview) {
            const { data: signed } = await supabase.storage
              .from("referensi-kue")
              .createSignedUrl(item.foto_preview, 3600);
            if (signed) thumbObj[item.id] = signed.signedUrl;
          }
        }
        setThumbnailMap(thumbObj);
      }
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
        <form
          onSubmit={handleCari}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cari Pesanan
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Kode atau nama penerima..."
                value={kataKunci}
                onChange={(e) => setKataKunci(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs outline-none focus:border-rose-500"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-stone-400 text-xs"></i>
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
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs outline-none focus:border-rose-500 bg-white"
            >
              <option value="">Semua Status Pesanan</option>
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
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs hover:bg-stone-50 transition"
              title="Reset Filter"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-list-check text-rose-500"></i>
            <h2 className="text-base font-bold text-stone-900">
              Daftar Pesanan ({totalBaris})
            </h2>
          </div>
        </div>

        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 block text-rose-500"></i>
            <span className="text-xs font-medium">Memuat data pesanan...</span>
          </div>
        ) : daftarPesanan.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-box-open text-3xl mb-2 block text-stone-300"></i>
            <p className="text-sm font-semibold text-stone-700">
              Belum ada pesanan ditemukan.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Coba ubah kata kunci atau filter status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl w-14">Kue</th>
                  <th className="py-3 px-4 whitespace-nowrap">Kode</th>
                  <th className="py-3 px-4 whitespace-nowrap">Nama Pelanggan</th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    Jadwal Ambil / Kirim
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">Pengambilan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status Pesanan</th>
                  {isAdmin && (
                    <th className="py-3 px-4 whitespace-nowrap">Status Bayar</th>
                  )}
                  {isAdmin && (
                    <th className="py-3 px-4 whitespace-nowrap">Total</th>
                  )}
                  <th className="py-3 px-4 text-right rounded-r-xl whitespace-nowrap">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daftarPesanan.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 w-14">
                      {thumbnailMap[p.id] ? (
                        <img
                          src={thumbnailMap[p.id]}
                          alt="Thumbnail Kue"
                          className="w-12 h-12 object-contain rounded-lg border border-[#e0d5b8] bg-[#fbf6e9] p-0.5"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-[#e0d5b8] bg-[#fbf6e9] overflow-hidden">
                          <PreviewKue
                            pilihan={pilihanMap[p.id] || []}
                            tulisan_kue={p.tulisan_kue}
                            className="w-12 h-12"
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/pesanan/${p.kode_pesanan}`)
                        }
                        className="text-left font-bold text-stone-900 hover:text-rose-600 transition cursor-pointer"
                        title="Lihat detail pesanan"
                      >
                        {p.kode_pesanan}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800 whitespace-nowrap">
                      <div>
                        <span className="font-semibold block">
                          {p.nama_penerima}
                        </span>
                        <span className="text-[11px] text-stone-400 block font-normal">
                          {p.no_wa}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 text-xs whitespace-nowrap">
                      {formatTanggalSingkat(p.tanggal_ambil)} pukul{" "}
                      {p.jam_ambil?.slice(0, 5)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 whitespace-nowrap">
                        {p.metode_pengiriman === "Ambil"
                          ? "Ambil di Tempat"
                          : "Kirim"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeStatusPesanan(
                          p.status_pesanan
                        )}`}
                      >
                        {p.status_pesanan}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeStatusBayar(
                            p.status_bayar
                          )}`}
                        >
                          {p.status_bayar}
                        </span>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                        {formatRupiah(p.total_bayar)}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/pesanan/${p.kode_pesanan}`)
                        }
                        className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-500 py-1 px-3 rounded-full hover:bg-rose-50 transition whitespace-nowrap cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
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
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={halaman >= totalHalaman}
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
