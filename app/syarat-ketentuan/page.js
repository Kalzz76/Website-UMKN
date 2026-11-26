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
    title: `Syarat & Ketentuan - ${nama}`,
    description: `Syarat dan ketentuan layanan pemesanan kue ${nama}.`,
  };
}

export default async function SyaratKetentuanPage() {
  const toko = await ambilTokoPublik();
  const namaToko = toko.nama_toko || "toko kami";
  const minHariCustom = toko.minimal_hari_pesan !== null ? `H-${toko.minimal_hari_pesan}` : "beberapa hari sebelumnya";
  const minHariKatalog = toko.minimal_hari_katalog !== null ? `H-${toko.minimal_hari_katalog}` : "sesuai jadwal tersedia";
  const batasBayarJam = toko.batas_bayar_jam !== null ? `${toko.batas_bayar_jam} jam` : "batas waktu yang ditentukan";
  const maksJarakKm = toko.maks_jarak_kirim_km !== null ? `${toko.maks_jarak_kirim_km} km` : "radius layanan yang terverifikasi pada peta";

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
              Informasi Layanan
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#3D2B28]">
              Syarat &amp; Ketentuan
            </h1>
            <p className="text-xs text-[#7A6158] mt-1.5">
              Berlaku untuk seluruh layanan pemesanan di {namaToko}.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-[#5C3D32] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">1. Ketentuan Umum</h2>
              <p>
                Dengan mengakses dan membuat pesanan melalui situs web {namaToko}, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat serta ketentuan operasional yang berlaku untuk pemesanan kue kustom 3D maupun produk katalog toko.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">2. Akun dan Data Pemesan</h2>
              <p>
                Pelanggan bertanggung jawab atas kerahasiaan kata sandi akun serta keakuratan data penerima (nama lengkap, nomor WhatsApp aktif, titik pin lokasi, dan alamat pengiriman). Keterlambatan atau kendala pengantaran akibat informasi kontak maupun titik peta yang tidak akurat berada di luar tanggung jawab {namaToko}.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">3. Jadwal Pemesanan dan Pembayaran</h2>
              <p>
                Pesanan kue kustom memerlukan waktu persiapan minimal {minHariCustom} (tergantung ketersediaan kuota dapur harian), sedangkan pesanan kue katalog dapat dipesan minimal {minHariKatalog}.
                {toko.mode_pembayaran === "DP" && toko.persen_dp
                  ? ` Pembayaran uang muka (DP) sebesar ${toko.persen_dp}% berlaku khusus untuk item kue kustom, sedangkan subtotal kue katalog dan ongkos kirim wajib dibayar penuh di awal transaksi.`
                  : " Seluruh tagihan transaksi wajib dibayarkan penuh di awal pada saat checkout."}
                {" "}Pesanan dengan status Menunggu Pembayaran harus diselesaikan dalam waktu {batasBayarJam} sebelum sistem membatalkannya secara otomatis.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">4. Pengambilan dan Pengiriman</h2>
              <p>
                Untuk metode Ambil di Toko, pesanan diambil sesuai jadwal dan jam operasional {namaToko}
                {toko.jam?.ringkas ? ` (${toko.jam.ringkas})` : ""}
                {toko.alamat ? ` di alamat ${toko.alamat}` : ""}. Untuk metode Kirim Kurir, layanan pengantaran menjangkau maksimal {maksJarakKm} dari lokasi toko dengan tarif dihitung otomatis berdasarkan jarak jalan pada peta. Sisa pelunasan wajib diselesaikan sebelum serah terima atau sebelum kurir diberangkatkan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">5. Perubahan, Pembatalan, &amp; Kontak</h2>
              <p>
                Ketentuan mengenai pembatalan pesanan serta pengembalian dana diatur pada halaman{" "}
                <Link href="/kebijakan-pembatalan" className="text-[#9E3B42] font-bold underline">
                  Kebijakan Pembatalan &amp; Pengembalian Dana
                </Link>
                . Jika membutuhkan bantuan, Anda dapat menghubungi tim {namaToko}
                {toko.wa_link ? (
                  <>
                    {" "}melalui{" "}
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
                {toko.email ? ` atau email ke ${toko.email}` : ""}.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PatisserieFooter toko={toko} />
    </div>
  );
}
