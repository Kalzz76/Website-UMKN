"use client";

import { useState } from "react";
import Link from "next/link";
import PreviewKue from "@/components/PreviewKue";
import { formatRupiah } from "@/lib/format";

const dataSeed = {
  ukuran: [
    { nama: "Mini Ø10", harga: 85000, kode_visual: "mini", peran_visual: "ukuran" },
    { nama: "Small Ø14", harga: 125000, kode_visual: "small", peran_visual: "ukuran" },
    { nama: "Medium Ø18", harga: 165000, kode_visual: "medium", peran_visual: "ukuran" },
    { nama: "Large Ø22", harga: 210000, kode_visual: "large", peran_visual: "ukuran" },
  ],
  rasa: [
    { nama: "Vanilla", harga: 0, warna: "#fbefd5", kode_visual: "vanilla", peran_visual: "badan" },
    { nama: "Cokelat", harga: 10000, warna: "#8a5a3c", kode_visual: "choco", peran_visual: "badan" },
    { nama: "Red Velvet", harga: 15000, warna: "#c0404e", kode_visual: "velvet", peran_visual: "badan" },
    { nama: "Stroberi", harga: 10000, warna: "#f9cdd6", kode_visual: "straw", peran_visual: "badan" },
  ],
  krim: [
    { nama: "Putih", harga: 0, warna: "#FFF8F0", kode_visual: "putih", peran_visual: "krim" },
    { nama: "Pink", harga: 0, warna: "#f6b4c2", kode_visual: "pink", peran_visual: "krim" },
    { nama: "Cokelat", harga: 0, warna: "#6b3d2a", kode_visual: "coklat", peran_visual: "krim" },
    { nama: "Mint", harga: 0, warna: "#bfe8d8", kode_visual: "mint", peran_visual: "krim" },
    { nama: "Kuning", harga: 0, warna: "#fbe39a", kode_visual: "kuning", peran_visual: "krim" },
    { nama: "Lavender", harga: 0, warna: "#d8c7f0", kode_visual: "lavender", peran_visual: "krim" },
  ],
  topping: [
    { nama: "Lelehan Krim", harga: 12000, warna: "#451a03", kode_visual: "drip", peran_visual: "topping" },
    { nama: "Stroberi", harga: 10000, warna: "#ef4444", kode_visual: "straw", peran_visual: "topping" },
    { nama: "Mixed Berry", harga: 15000, warna: "#4338ca", kode_visual: "berry", peran_visual: "topping" },
    { nama: "Bunga Gula", harga: 8000, warna: "#f472b6", kode_visual: "flower", peran_visual: "topping" },
    { nama: "Taburan", harga: 5000, warna: "#f59e0b", kode_visual: "spr", peran_visual: "topping" },
    { nama: "Lilin", harga: 3000, warna: "#fbbf24", kode_visual: "candle", peran_visual: "topping" },
  ],
};

export default function UjiPreviewPage() {
  const [ukuranTerpilih, setUkuranTerpilih] = useState(dataSeed.ukuran[1]);
  const [rasaTerpilih, setRasaTerpilih] = useState(dataSeed.rasa[0]);
  const [krimTerpilih, setKrimTerpilih] = useState(dataSeed.krim[0]);
  const [toppingTerpilih, setToppingTerpilih] = useState([dataSeed.topping[0], dataSeed.topping[3]]);
  const [tulisan, setTulisan] = useState("Happy Birthday!");

  function toggleTopping(item) {
    const sudahPilih = toppingTerpilih.some((t) => t.nama === item.nama);
    if (sudahPilih) {
      setToppingTerpilih(toppingTerpilih.filter((t) => t.nama !== item.nama));
    } else {
      setToppingTerpilih([...toppingTerpilih, item]);
    }
  }

  const semuaPilihan = [
    ukuranTerpilih,
    rasaTerpilih,
    krimTerpilih,
    ...toppingTerpilih,
  ];

  let totalHarga = 0;
  for (let i = 0; i < semuaPilihan.length; i++) {
    totalHarga += semuaPilihan[i].harga;
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Tahap 4: Preview Kue
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 mt-2">
              Pengujian Komponen Preview Kue
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Komponen SVG 2D berlapis diuji langsung dengan seluruh data opsi dari seed database.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-full border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 text-xs font-semibold transition"
          >
            Kembali
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-stone-100 sticky top-6">
            <h2 className="font-bold text-stone-900 text-center mb-2">
              Tampilan Preview Kue
            </h2>
            <div className="bg-amber-50/50 rounded-2xl p-4 flex items-center justify-center min-h-[340px]">
              <PreviewKue
                pilihan={semuaPilihan}
                tulisan={tulisan}
                className="w-full"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 block">Total Harga Pilihan</span>
                <span className="text-xl font-black text-rose-600">
                  {formatRupiah(totalHarga)}
                </span>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-stone-100 text-stone-600 rounded-full">
                {ukuranTerpilih.nama}
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-6">
            <div>
              <label className="block text-sm font-bold text-stone-900 mb-2">
                1. Ukuran Kue (Skala & Jumlah Tingkat)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {dataSeed.ukuran.map((item) => {
                  const terpilih = ukuranTerpilih.nama === item.nama;
                  return (
                    <button
                      key={item.nama}
                      type="button"
                      onClick={() => setUkuranTerpilih(item)}
                      className={`p-3 rounded-2xl text-left border text-xs transition cursor-pointer ${
                        terpilih
                          ? "border-rose-600 bg-rose-50 text-rose-900 font-bold"
                          : "border-stone-200 hover:border-stone-300 text-stone-700"
                      }`}
                    >
                      <div className="font-semibold">{item.nama}</div>
                      <div className="text-stone-500 text-[11px] mt-0.5">
                        {formatRupiah(item.harga)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-900 mb-2">
                2. Rasa (Warna Badan Kue)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dataSeed.rasa.map((item) => {
                  const terpilih = rasaTerpilih.nama === item.nama;
                  return (
                    <button
                      key={item.nama}
                      type="button"
                      onClick={() => setRasaTerpilih(item)}
                      className={`p-3 rounded-2xl text-left border text-xs flex items-center space-x-2.5 transition cursor-pointer ${
                        terpilih
                          ? "border-rose-600 bg-rose-50 text-rose-900 font-bold"
                          : "border-stone-200 hover:border-stone-300 text-stone-700"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 flex-shrink-0"
                        style={{ backgroundColor: item.warna }}
                      ></span>
                      <div>
                        <div>{item.nama}</div>
                        <div className="text-stone-500 text-[11px]">
                          {formatRupiah(item.harga)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-900 mb-2">
                3. Krim (Lapisan & Tetesan Frosting)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dataSeed.krim.map((item) => {
                  const terpilih = krimTerpilih.nama === item.nama;
                  return (
                    <button
                      key={item.nama}
                      type="button"
                      onClick={() => setKrimTerpilih(item)}
                      className={`p-3 rounded-2xl text-left border text-xs flex items-center space-x-2.5 transition cursor-pointer ${
                        terpilih
                          ? "border-rose-600 bg-rose-50 text-rose-900 font-bold"
                          : "border-stone-200 hover:border-stone-300 text-stone-700"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 flex-shrink-0"
                        style={{ backgroundColor: item.warna }}
                      ></span>
                      <div>
                        <div>{item.nama}</div>
                        <div className="text-stone-500 text-[11px]">
                          {formatRupiah(item.harga)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-900 mb-2">
                4. Topping (Pilihan Banyak)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dataSeed.topping.map((item) => {
                  const terpilih = toppingTerpilih.some((t) => t.nama === item.nama);
                  return (
                    <button
                      key={item.nama}
                      type="button"
                      onClick={() => toggleTopping(item)}
                      className={`p-3 rounded-2xl text-left border text-xs flex items-center justify-between transition cursor-pointer ${
                        terpilih
                          ? "border-rose-600 bg-rose-50 text-rose-900 font-bold"
                          : "border-stone-200 hover:border-stone-300 text-stone-700"
                      }`}
                    >
                      <div>
                        <div>{item.nama}</div>
                        <div className="text-stone-500 text-[11px]">
                          +{formatRupiah(item.harga)}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                          terpilih
                            ? "bg-rose-600 text-white"
                            : "border border-stone-300 text-transparent"
                        }`}
                      >
                        <i className="fa-solid fa-check"></i>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-900 mb-2">
                5. Tulisan di Kue
              </label>
              <input
                type="text"
                value={tulisan}
                onChange={(e) => setTulisan(e.target.value)}
                maxLength={30}
                placeholder="Tulis pesan di kue..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
              />
              <span className="text-xs text-stone-400 mt-1 block">
                Maksimal 30 karakter. Otomatis disesuaikan kontras warnanya dengan badan kue.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
