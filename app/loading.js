export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-center items-center p-6">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF2E8] border border-[#E8DFD8] text-[#9E3B42] flex items-center justify-center mx-auto text-2xl shadow-xs animate-bounce">
          <i className="fa-solid fa-cake-candles" />
        </div>
        <h2 className="font-serif text-base font-bold text-[#3D2B28]">
          Menyiapkan Halaman Manis...
        </h2>
        <p className="text-xs text-stone-400">
          Mohon tunggu sebentar selagi dapur kami menyajikan data untuk Anda.
        </p>
      </div>
    </div>
  );
}
