import Link from "next/link";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseServer } from "@/lib/supabaseServer";
import {
  formatRupiah,
  formatTanggalSingkat,
  getTanggalHariIniJakarta,
} from "@/lib/format";

export const metadata = {
  title: "Ringkasan - Dashboard",
};

export default async function DashboardPage() {
  const { profil } = await cekRole(["admin", "staf"]);
  const isAdmin = profil?.role === "admin";
  const supabase = await getSupabaseServer();
  const hariIni = getTanggalHariIniJakarta();

  let pesananHariIniCount = 0;
  let belumBayarCount = 0;
  let menungguKonfirmasiCount = 0;
  let omzetBulanIni = 0;
  let daftarPesanan = [];
  let stokMenipis = [];

  const { data: bahanList } = await supabase.from("bahan").select("*");
  if (bahanList) {
    stokMenipis = bahanList.filter(
      (b) => Number(b.jumlah) <= Number(b.batas_minimum)
    );
  }

  if (isAdmin) {
    const { count: cHariIni } = await supabase
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .eq("tanggal_ambil", hariIni)
      .neq("status_pesanan", "Dibatalkan");
    pesananHariIniCount = cHariIni || 0;

    const { count: cBelumBayar } = await supabase
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .eq("status_bayar", "Belum Bayar")
      .neq("status_pesanan", "Dibatalkan");
    belumBayarCount = cBelumBayar || 0;

    const { count: cKonfirmasi } = await supabase
      .from("pembayaran")
      .select("*", { count: "exact", head: true })
      .eq("status", "Menunggu Konfirmasi");
    menungguKonfirmasiCount = cKonfirmasi || 0;

    const awalBulan = `${hariIni.slice(0, 7)}-01T00:00:00Z`;
    const { data: bayarBulan } = await supabase
      .from("pembayaran")
      .select("jumlah")
      .eq("status", "Dikonfirmasi")
      .gte("dibuat_pada", awalBulan);

    if (bayarBulan) {
      omzetBulanIni = bayarBulan.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
    }

    const { data: pList } = await supabase
      .from("pesanan")
      .select("id, kode_pesanan, nama_penerima, tanggal_ambil, jam_ambil, metode_pengiriman, status_pesanan, status_bayar, total_bayar")
      .neq("status_pesanan", "Dibatalkan")
      .neq("status_pesanan", "Selesai")
      .order("tanggal_ambil", { ascending: true })
      .order("jam_ambil", { ascending: true })
      .limit(5);
    daftarPesanan = pList || [];
  } else {
    const { data: pList } = await supabase
      .from("pesanan")
      .select("id, kode_pesanan, nama_penerima, tanggal_ambil, jam_ambil, metode_pengiriman, status_pesanan, tulisan_kue, catatan")
      .in("status_pesanan", ["Diterima", "Sedang Dibuat"])
      .order("tanggal_ambil", { ascending: true })
      .order("jam_ambil", { ascending: true })
      .limit(10);
    daftarPesanan = pList || [];
  }

  function getBadgeStatusPesanan(status) {
    if (status === "Menunggu Pembayaran") {
      return "bg-stone-100 text-stone-700";
    }
    if (status === "Diterima") {
      return "bg-sky-100 text-sky-800";
    }
    if (status === "Sedang Dibuat") {
      return "bg-amber-100 text-amber-800";
    }
    if (status === "Siap") {
      return "bg-emerald-100 text-emerald-800";
    }
    if (status === "Dikirim") {
      return "bg-indigo-100 text-indigo-800";
    }
    if (status === "Selesai") {
      return "bg-green-100 text-green-800";
    }
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeStatusBayar(status) {
    if (status === "Lunas") {
      return "bg-emerald-100 text-emerald-800";
    }
    if (status === "DP Dibayar") {
      return "bg-amber-100 text-amber-800";
    }
    return "bg-rose-100 text-rose-800";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">
          Selamat Datang, {profil?.nama || "Pengguna"}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {isAdmin
            ? "Berikut adalah ringkasan performa dan operasional toko kue Anda hari ini."
            : "Berikut adalah daftar kue yang perlu diproduksi dan informasi stok bahan dapur."}
        </p>
      </div>

      {stokMenipis.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3">
          <i className="fa-solid fa-triangle-exclamation text-rose-600 text-lg mt-0.5"></i>
          <div>
            <h4 className="font-bold text-sm">Peringatan: Stok Bahan Menipis</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Ada {stokMenipis.length} bahan yang sudah mencapai atau di bawah batas minimum:{" "}
              {stokMenipis.map((b) => `${b.nama} (${b.jumlah} ${b.satuan})`).join(", ")}.
            </p>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Pesanan Hari Ini
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <i className="fa-solid fa-calendar-day"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-stone-900 mt-4">
              {pesananHariIniCount}
            </p>
            <span className="text-xs text-stone-400 mt-1 block">
              Jadwal ambil atau kirim hari ini
            </span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Belum Dibayar
              </span>
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <i className="fa-solid fa-clock"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-stone-900 mt-4">
              {belumBayarCount}
            </p>
            <span className="text-xs text-stone-400 mt-1 block">
              Pesanan menunggu pembayaran
            </span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Konfirmasi Bayar
              </span>
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <i className="fa-solid fa-receipt"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-stone-900 mt-4">
              {menungguKonfirmasiCount}
            </p>
            <span className="text-xs text-stone-400 mt-1 block">
              Bukti bayar perlu dicek
            </span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Omzet Bulan Ini
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <i className="fa-solid fa-wallet"></i>
              </div>
            </div>
            <p className="text-2xl font-black text-stone-900 mt-4 truncate">
              {formatRupiah(omzetBulanIni)}
            </p>
            <span className="text-xs text-stone-400 mt-1 block">
              Pembayaran terkonfirmasi
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-stone-900">
              {isAdmin ? "Pesanan Terdekat" : "Daftar Kue yang Harus Dibuat"}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isAdmin
                ? "Daftar pesanan aktif terdekat yang perlu diproses"
                : "Pesanan dengan status Diterima dan Sedang Dibuat (diurutkan jam terdekat)"}
            </p>
          </div>
          <Link
            href="/dashboard/pesanan"
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center space-x-1"
          >
            <span>Lihat Semua</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </Link>
        </div>

        {daftarPesanan.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-sm">
            <i className="fa-solid fa-box-open text-3xl mb-2 block text-stone-300"></i>
            Belum ada pesanan yang perlu diproses saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Kode</th>
                  <th className="py-3 px-4">Penerima</th>
                  <th className="py-3 px-4">Jadwal</th>
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
                      {p.nama_penerima}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {formatTanggalSingkat(p.tanggal_ambil)} {p.jam_ambil?.slice(0, 5)}
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
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
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
      </div>
    </div>
  );
}
