import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan perlindungan data pribadi dan privasi pelanggan Cravely Bakery.",
};

export default function KebijakanPrivasiPage() {
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
            Perlindungan Data
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#3D2B28] mt-1">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-stone-400 mt-1">Terakhir diperbarui: 24 November 2026</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5">
            <i className="fa-solid fa-circle-info text-amber-700 text-sm mt-0.5 shrink-0" />
            <div>
              <strong className="block font-bold">Catatan Pratinjau Kesiapan Deploy:</strong>
              Halaman ini merupakan kerangka draf privasi yang perlu ditinjau oleh pemilik toko untuk memastikan keselarasan dengan ketentuan hukum data pribadi yang berlaku.
            </div>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">1. Data yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar akun atau melakukan pemesanan, meliputi: nama lengkap, alamat email, nomor telepon/WhatsApp, alamat pengiriman, dan preferensi desain kue kustom.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">2. Penggunaan Informasi</h2>
            <p>
              Data pribadi Anda digunakan untuk:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Memproses dan memproduksi pesanan kue Anda.</li>
              <li>Menghitung tarif ongkos kirim dan mengoordinasikan rute pengiriman.</li>
              <li>Mengirimkan konfirmasi status pesanan dan bukti transaksi melalui WhatsApp atau email.</li>
              <li>Menyediakan layanan dukungan pelanggan dan pencatatan riwayat tiket pesanan.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">3. Keamanan Data dan Pembayaran</h2>
            <p>
              Keamanan kata sandi dikelola secara terenkripsi melalui sistem Supabase Authentication dan Row Level Security (RLS). Informasi kartu kredit dan pembayaran digital diproses langsung oleh payment gateway Midtrans yang tersertifikasi PCI-DSS. Cravely Bakery tidak menyimpan data nomor kartu pembayaran Anda.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#3D2B28]">4. Berbagi Informasi dengan Pihak Ketiga</h2>
            <p>
              Kami tidak menjual atau menyewakan informasi pribadi Anda. Data penerima dan alamat pengiriman hanya dibagikan kepada kurir resmi atau mitra pengantaran semata-mata untuk keperluan pengantaran pesanan sampai ke lokasi Anda.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
