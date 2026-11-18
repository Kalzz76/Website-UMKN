import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center text-center">
      <div className="max-w-lg bg-white rounded-3xl p-8 border border-stone-100 shadow-sm space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl">
          <i className="fa-solid fa-cake-candles"></i>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">Toko Kue Custom</h1>
        <p className="text-sm text-stone-600">
          Website pemesanan kue custom untuk UMKM.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/uji-preview"
            className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition text-sm shadow-sm"
          >
            Uji Preview Kue (Tahap 4)
          </Link>
          <Link
            href="/masuk"
            className="px-6 py-2.5 rounded-full font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition text-sm"
          >
            Masuk Akun
          </Link>
        </div>
      </div>
    </main>
  );
}
