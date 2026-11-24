import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#3D2B28] flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DFD8] shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF2E8] border border-[#E8DFD8] text-[#9E3B42] flex items-center justify-center mx-auto text-3xl shadow-xs">
          <i className="fa-solid fa-cake-candles" />
        </div>
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#9E3B42] bg-[#FAF2E8] px-3 py-1 rounded-full">
          Galat 404
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#3D2B28]">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          Maaf, halaman atau kreasi kue yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-[#9E3B42] hover:bg-[#872f36] text-white text-xs font-bold shadow-sm transition"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/menu"
            className="px-6 py-2.5 rounded-full border border-[#D9B37C]/70 bg-white hover:bg-[#FAF2E8] text-[#5A3B33] text-xs font-bold transition"
          >
            Jelajahi Menu Kue
          </Link>
        </div>
      </div>
    </div>
  );
}
