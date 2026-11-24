import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan layanan pemesanan kue Cravely Bakery.",
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#3D2B28] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DFD8] shadow-xs">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-[#9E3B42] transition mb-4"
          >
            <i className="fa-solid fa-arrow-left" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E3B42] block">
            Informasi Layanan
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#3D2B28] mt-1">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-xs text-stone-400 mt-1">Terakhir diperbarui: 24 November 2026</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5">
            <i className="fa-solid fa-circle-info text-amber-700 text-sm mt-0.5 shrink-0" />
            <div>
              <strong className="block font-bold">Catatan Pratinjau Kesiapan Deploy:</strong>
              Halaman ini merupakan kerangka draf operasional yang perlu ditinjau dan disesuaikan oleh pemilik toko sebelum dinyatakan berkekuatan hukum penuh.
            </div>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">1. Ketentuan Umum</h2>
            <p>
              Dengan mengakses dan menggunakan situs web Cravely Bakery, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku. Layanan ini ditujukan untuk memfasilitasi pemesanan kue artisanal, kustomisasi studio kue 3D, serta produk patisserie siap antar.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">2. Akun dan Data Pemesan</h2>
            <p>
              Pelanggan bertanggung jawab untuk menjaga kerahasiaan kata sandi akun dan keakuratan informasi kontak (nama penerima, nomor WhatsApp aktif, dan alamat pengiriman). Kesalahan pengiriman akibat nomor WhatsApp yang tidak dapat dihubungi atau alamat yang keliru berada di luar tanggung jawab Cravely Bakery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">3. Pemesanan dan Pembayaran</h2>
            <p>
              Pesanan custom cake memerlukan waktu persiapan minimal (H-2 atau sesuai jadwal kuota toko). Pembayaran dapat dilakukan melalui gateway Midtrans (QRIS, Virtual Account, Kartu) atau transfer bank manual dengan bukti sah. Pesanan berstatus Menunggu Pembayaran harus diselesaikan sebelum batas waktu kedaluwarsa yang ditentukan sistem toko.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">4. Pengambilan dan Pengiriman</h2>
            <p>
              Untuk metode Ambil di Toko, pelanggan mengambil pesanan sesuai jam operasional toko pada tanggal yang dipilih. Untuk metode Kirim Kurir, pengantaran dilakukan sesuai radius jarak maksimal pengiriman yang terverifikasi pada peta lokasi. Pelunasan tagihan wajib diselesaikan sebelum serah terima kue atau sebelum kurir diberangkatkan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">5. Perubahan dan Pembatalan</h2>
            <p>
              Aturan terkait pembatalan pesanan dan pengembalian dana diatur secara terpisah pada{" "}
              <Link href="/kebijakan-pembatalan" className="text-[#9E3B42] font-bold underline">
                Kebijakan Pembatalan &amp; Refund
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
