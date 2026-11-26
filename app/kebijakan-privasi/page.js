import Link from "next/link";
import { ambilTokoPublik } from "@/lib/tokoPublik";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import {
  BotanicalTopLeft,
  BotanicalTopRight,
} from "@/components/patisserie/BotanicalBranchDecor";

export const revalidate = 60;

export async function generateMetadata() {
  const toko = await ambilTokoPublik();
  const nama = toko.nama_toko || "Cravely Patisserie";
  return {
    title: `Kebijakan Privasi - ${nama}`,
    description: `Kebijakan perlindungan data pribadi dan privasi pelanggan ${nama}.`,
  };
}

export default async function KebijakanPrivasiPage() {
  const toko = await ambilTokoPublik();
  const namaToko = toko.nama_toko || "toko kami";

  return (
    <div className="min-h-screen bg-[#FAF4EE] text-[#4A2E2B] pt-16 sm:pt-20 flex flex-col relative overflow-x-clip">
      <DynamicIslandNavbar showEntered={true} toko={toko} />

      <div className="absolute top-0 left-0 pointer-events-none select-none z-0">
        <BotanicalTopLeft className="w-40 sm:w-56 lg:w-64 h-auto" color="#8A675C" opacity={0.45} />
      </div>
      <div className="absolute top-0 right-0 pointer-events-none select-none z-0">
        <BotanicalTopRight className="w-40 sm:w-56 lg:w-64 h-auto" color="#8A675C" opacity={0.45} />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-16 relative z-10">
        <div className="bg-[#FFFDF9] rounded-[28px] p-6 sm:p-10 border border-[#ECDCCE] shadow-[0_14px_40px_rgba(61,43,40,0.06)] space-y-8">
          <div className="border-b border-[#EEDBCE] pb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#7D5A50] hover:text-[#9E3B42] transition mb-5"
            >
              <span className="w-7 h-7 rounded-full bg-[#FAF4ED] border border-[#EADCC8] flex items-center justify-center text-[#9E3B42]">
                <i className="fa-solid fa-arrow-left text-[11px]" />
              </span>
              <span>Kembali ke Beranda</span>
            </Link>

            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#9E3B42] bg-[#FCE8EC] px-3 py-1 rounded-full border border-[#EBC0C8] mb-2">
              Perlindungan Data
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#3D2B28]">
              Kebijakan Privasi
            </h1>
            <p className="text-xs text-[#7A6158] mt-1.5">
              Komitmen {namaToko} dalam menjaga keamanan informasi pribadi pelanggan.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-[#5C3D32] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">1. Data yang Kami Kumpulkan</h2>
              <p>
                {namaToko} mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar akun, mengatur profil, atau membuat pesanan, meliputi nama lengkap, alamat email, nomor WhatsApp, alamat serta titik koordinat pengiriman, dan berkas referensi desain kue kustom.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">2. Penggunaan Informasi</h2>
              <p>Data pribadi Anda digunakan secara terbatas untuk:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#5C3D32]">
                <li>Memproses produksi kue kustom dan produk katalog pesanan Anda.</li>
                <li>Menghitung jarak dan tarif ongkos kirim secara akurat serta mengoordinasikan pengantaran.</li>
                <li>Menyediakan tiket digital, pelacakan status dapur, serta dukungan pelanggan.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">3. Keamanan Data dan Pembayaran</h2>
              <p>
                Kata sandi akun dikelola secara terenkripsi melalui sistem Supabase Authentication dan kebijakan Row Level Security (RLS). Transaksi pembayaran digital diproses langsung melalui gateway Midtrans yang tersertifikasi, sehingga {namaToko} tidak menyimpan kredensial kartu atau PIN pembayaran Anda.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">4. Pertanyaan Privasi</h2>
              <p>
                Kami tidak menjual atau menyewakan data pelanggan kepada pihak ketiga. Apabila Anda ingin memperbarui atau menanyakan data akun Anda, silakan hubungi {namaToko}
                {toko.email ? ` melalui email ${toko.email}` : ""}
                {toko.wa_link ? (
                  <>
                    {toko.email ? " atau " : " melalui "}
                    <a
                      href={toko.wa_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9E3B42] font-bold underline"
                    >
                      WhatsApp resmi toko
                    </a>
                  </>
                ) : null}
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <PatisserieFooter toko={toko} />
    </div>
  );
}
