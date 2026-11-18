import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabaseServer";
import WizardPesan from "@/components/WizardPesan";

export const metadata = {
  title: "Pesan Kue Custom - Toko Kue",
  description: "Alur kustomisasi dan pemesanan kue custom bertahap",
};

export default async function PesanPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profil = null;
  if (user) {
    const { data: p } = await supabase
      .from("profil")
      .select("*")
      .eq("id", user.id)
      .single();
    profil = p;
  }

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const { data: grupList } = await supabase
    .from("grup_opsi")
    .select(`
      id,
      nama,
      urutan,
      wajib,
      jenis_pilihan,
      peran_visual,
      opsi_item (
        id,
        id_grup,
        nama,
        harga,
        aktif,
        urutan,
        warna,
        kode_visual
      )
    `)
    .order("urutan", { ascending: true });

  const { data: zonaList } = await supabase
    .from("zona_ongkir")
    .select("*")
    .eq("aktif", true)
    .order("tarif", { ascending: true });

  const { data: tutupList } = await supabase
    .from("tanggal_tutup")
    .select("tanggal, alasan");

  const daftarGrupBersih = (grupList || []).map((g) => {
    const items = (g.opsi_item || [])
      .filter((it) => it.aktif)
      .sort((a, b) => a.urutan - b.urutan);
    return {
      ...g,
      opsi_item: items,
    };
  });

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white/80 backdrop-blur sticky top-0 z-30 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-cake-candles"></i>
            </div>
            <div>
              <h1 className="font-extrabold text-stone-900 text-base leading-tight">
                {pengaturan?.nama_toko || "Toko Kue Custom"}
              </h1>
              <p className="text-[11px] text-stone-500">Pemesanan Kue Custom</p>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href="/pesanan-saya"
                className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
              >
                Pesanan Saya
              </Link>
            ) : (
              <Link
                href="/masuk?ke=/pesan"
                className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:py-10">
        <WizardPesan
          pengaturan={pengaturan}
          daftarGrup={daftarGrupBersih}
          daftarZona={zonaList || []}
          daftarTutup={tutupList || []}
          user={user}
          profil={profil}
        />
      </main>
    </div>
  );
}
