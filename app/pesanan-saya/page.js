import Link from "next/link";
import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseServer } from "@/lib/supabaseServer";
import TombolKeluar from "@/components/TombolKeluar";

export const metadata = {
  title: "Pesanan Saya - Toko Kue Custom",
};

export default async function PesananSayaPage() {
  const { user, profil, diizinkan } = await cekRole(["pelanggan", "admin", "staf"]);

  if (!diizinkan || !user) {
    redirect("/masuk?ke=/pesanan-saya");
  }

  const supabase = await getSupabaseServer();
  const { data: pesananList } = await supabase
    .from("pesanan")
    .select("id, kode_pesanan, tanggal_ambil, jam_ambil, metode_pengiriman, status_pesanan, status_bayar, total_bayar")
    .eq("id_pelanggan", user.id)
    .order("dibuat_pada", { ascending: false });

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-cake-candles"></i>
            </div>
            <div>
              <h1 className="font-extrabold text-stone-900 text-lg leading-tight">
                Pesanan Saya
              </h1>
              <p className="text-xs text-stone-500">
                Halo, {profil?.nama || "Pelanggan"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <Link
              href="/"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
            >
              Beranda
            </Link>
            <Link
              href="/profil"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition inline-flex items-center gap-1.5"
            >
              <i className="fa-regular fa-user text-rose-600"></i>
              <span>Profil Saya</span>
            </Link>
            <TombolKeluar />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!pesananList || pesananList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-100 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-2xl">
              <i className="fa-solid fa-basket-shopping"></i>
            </div>
            <h2 className="text-xl font-bold text-stone-900">
              Belum Ada Pesanan
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-2">
              Anda belum memiliki riwayat pesanan kue custom. Buat kue impian Anda sekarang!
            </p>
            <Link
              href="/pesan"
              className="inline-block mt-6 px-6 py-3 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
            >
              Pesan Kue Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pesananList.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-stone-400 block">
                    Kode Pesanan
                  </span>
                  <span className="text-lg font-extrabold text-stone-900">
                    {p.kode_pesanan}
                  </span>
                  <span className="text-xs text-stone-500 block mt-1">
                    Jadwal: {p.tanggal_ambil} pukul {p.jam_ambil?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
                    {p.status_pesanan}
                  </span>
                  <Link
                    href={`/pesanan-saya/${p.kode_pesanan}`}
                    className="text-xs font-semibold px-4 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition"
                  >
                    Lihat Tiket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
