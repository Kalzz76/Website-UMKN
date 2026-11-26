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
    title: `Kebijakan Pembatalan & Refund - ${nama}`,
    description: `Kebijakan pembatalan pesanan kue dan pengembalian dana di ${nama}.`,
  };
}

export default async function KebijakanPembatalanPage() {
  const toko = await ambilTokoPublik();
  const namaToko = toko.nama_toko || "toko kami";
  const batasBayarJam = toko.batas_bayar_jam !== null ? `${toko.batas_bayar_jam} jam` : "batas waktu yang berlaku";

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
              Kebijakan Toko
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#3D2B28]">
              Kebijakan Pembatalan &amp; Pengembalian Dana
            </h1>
            <p className="text-xs text-[#7A6158] mt-1.5">
              Aturan pembatalan pesanan dan proses refund resmi di {namaToko}.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-[#5C3D32] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">1. Pembatalan oleh Pelanggan</h2>
              <p>
                Pelanggan dapat membatalkan pesanan secara mandiri melalui dashboard atau halaman tiket selama pesanan masih berstatus <strong>Menunggu Pembayaran</strong>. Jika pembayaran tidak diselesaikan dalam waktu {batasBayarJam} sejak pesanan dibuat, sistem akan membatalkan pesanan secara otomatis untuk membuka kembali slot kuota dapur.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">2. Ketentuan Khusus Kue Custom</h2>
              <p>
                Pesanan yang telah masuk ke tahap <strong>Diterima</strong>, <strong>Sedang Dibuat</strong>, atau <strong>Siap</strong> tidak dapat dibatalkan sepihak oleh pelanggan karena bahan baku segar serta jadwal kerja tim dapur telah dialokasikan secara khusus.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">3. Ketentuan Uang Muka (DP)</h2>
              <p>
                {toko.mode_pembayaran === "DP" && toko.persen_dp
                  ? `Opsi uang muka (DP) sebesar ${toko.persen_dp}% berlaku khusus untuk item kue kustom, sedangkan produk kue katalog dan ongkos kirim dibayarkan penuh di awal checkout.`
                  : "Pembayaran pesanan dilakukan penuh di awal checkout."}
                {" "}Jika pesanan dibatalkan setelah produksi dimulai atas kesepakatan khusus, biaya bahan baku yang sudah terpakai tidak dapat dikembalikan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-[#3D2B28]">4. Mekanisme Pengembalian Dana (Refund)</h2>
              <p>
                Pengembalian dana berlaku apabila pesanan dibatalkan oleh pihak {namaToko} atau terdapat pembayaran yang masuk setelah pesanan melewati batas waktu kedaluwarsa:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#5C3D32]">
                <li>
                  <strong>Pembayaran Digital (Midtrans):</strong> Sistem menandai pesanan dengan status <em>Perlu Refund</em> dan administrator {namaToko} akan memproses pengembalian dana.
                </li>
                <li>
                  <strong>Transfer Bank Manual:</strong> Administrator toko akan menghubungi Anda melalui WhatsApp untuk memproses transfer balik ke rekening pelanggan.
                </li>
              </ul>
              {toko.wa_link && (
                <p className="pt-1">
                  Untuk konfirmasi pengembalian dana, hubungi kami melalui{" "}
                  <a
                    href={toko.wa_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9E3B42] font-bold underline"
                  >
                    WhatsApp resmi {namaToko}
                  </a>
                  .
                </p>
              )}
            </section>
          </div>
        </div>
      </main>

      <PatisserieFooter toko={toko} />
    </div>
  );
}
