import Link from "next/link";

export const metadata = {
  title: "Kebijakan Pembatalan & Refund",
  description: "Kebijakan pembatalan pesanan kue dan pengembalian dana Cravely Bakery.",
};

export default function KebijakanPembatalanPage() {
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
            Kebijakan Toko
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#3D2B28] mt-1">
            Kebijakan Pembatalan &amp; Pengembalian Dana
          </h1>
          <p className="text-xs text-stone-400 mt-1">Terakhir diperbarui: 24 November 2026</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5">
            <i className="fa-solid fa-circle-info text-amber-700 text-sm mt-0.5 shrink-0" />
            <div>
              <strong className="block font-bold">Catatan Pratinjau Kesiapan Deploy:</strong>
              Ketentuan operasional di bawah ini telah diselaraskan dengan mekanisme sistem Cravely Bakery dan perlu ditinjau ulang oleh pemilik toko.
            </div>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">1. Pembatalan oleh Pelanggan</h2>
            <p>
              Pelanggan hanya dapat membatalkan pesanan secara mandiri selama pesanan berstatus <strong>Menunggu Pembayaran</strong> (sebelum pembayaran uang muka atau pembayaran penuh diselesaikan). Jika pembayaran tidak diselesaikan hingga batas waktu bayar berakhir, sistem akan membatalkan pesanan secara otomatis demi membuka kembali alokasi kuota produksi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">2. Ketentuan Khusus Kue Custom</h2>
            <p>
              Kue custom yang telah masuk ke tahap <strong>Sedang Dibuat</strong> atau <strong>Siap</strong> tidak dapat dibatalkan atau diubah spesifikasinya. Hal ini dikarenakan bahan baku segar dan waktu dekorasi spesifik telah dialokasikan khusus untuk pesanan Anda.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">3. Ketentuan Uang Muka (DP)</h2>
            <p>
              Opsi pembayaran Uang Muka (DP) hanya berlaku khusus untuk item <em>Custom Cake</em>. Produk kue katalog dan biaya ongkos kirim wajib dibayar penuh di awal transaksi checkout. Jika pesanan custom dibatalkan secara sepihak oleh pelanggan setelah dapur memulai tahap produksi, uang muka yang telah dibayarkan tidak dapat dikembalikan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">4. Mekanisme Pengembalian Dana (Refund)</h2>
            <p>
              Pengembalian dana hanya berlaku jika pesanan dibatalkan oleh pihak Cravely Bakery (misalnya akibat kendala operasional tak terduga atau kuota darurat toko ditutup). Mekanisme refund dilakukan sebagai berikut:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>
                <strong>Pembayaran Midtrans:</strong> Pengembalian dana diproses secara manual oleh administrator melalui dasbor merchant Midtrans sesuai metode pembayaran awal pemesan.
              </li>
              <li>
                <strong>Transfer Bank Manual:</strong> Administrator toko akan menghubungi pemesan via WhatsApp untuk memproses transfer balik ke rekening pelanggan.
              </li>
              <li>
                Sistem menandai pesanan dengan label <em>Perlu Refund</em> pada dasbor manajemen hingga bukti pengembalian dana selesai dicatat.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
