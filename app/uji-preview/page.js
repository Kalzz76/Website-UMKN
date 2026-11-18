"use client";

import { useState } from "react";
import Link from "next/link";
import PreviewKue from "@/components/PreviewKue";
import { formatRupiah } from "@/lib/format";

const dataSeed = {
  ukuran: [
    { nama: "Kecil (15 cm)", harga: 80000, kode_visual: "kecil", peran_visual: "ukuran" },
    { nama: "Sedang (20 cm)", harga: 150000, kode_visual: "sedang", peran_visual: "ukuran" },
    { nama: "Besar (25 cm)", harga: 250000, kode_visual: "besar", peran_visual: "ukuran" },
  ],
  rasa: [
    { nama: "Coklat", harga: 40000, warna: "#5c3a21", kode_visual: "coklat", peran_visual: "badan" },
    { nama: "Vanilla", harga: 35000, warna: "#fbf0d9", kode_visual: "vanilla", peran_visual: "badan" },
    { nama: "Strawberry", harga: 40000, warna: "#f472b6", kode_visual: "strawberry", peran_visual: "badan" },
    { nama: "Red Velvet", harga: 45000, warna: "#991b1b", kode_visual: "red_velvet", peran_visual: "badan" },
    { nama: "Matcha", harga: 45000, warna: "#4d7c0f", kode_visual: "matcha", peran_visual: "badan" },
  ],
  krim: [
    { nama: "Buttercream Putih", harga: 20000, warna: "#ffffff", kode_visual: "putih", peran_visual: "krim" },
    { nama: "Buttercream Pink", harga: 25000, warna: "#fbcfe8", kode_visual: "pink", peran_visual: "krim" },
    { nama: "Buttercream Coklat", harga: 25000, warna: "#78350f", kode_visual: "coklat", peran_visual: "krim" },
    { nama: "Cream Cheese", harga: 30000, warna: "#fef3c7", kode_visual: "cream_cheese", peran_visual: "krim" },
  ],
  topping: [
    { nama: "Strawberry Segar", harga: 20000, warna: "#ef4444", kode_visual: "strawberry", peran_visual: "topping" },
    { nama: "Coklat Chip", harga: 15000, warna: "#451a03", kode_visual: "coklat_chip", peran_visual: "topping" },
    { nama: "Aneka Buah", harga: 25000, warna: "#f59e0b", kode_visual: "buah", peran_visual: "topping" },
    { nama: "Lilin Ulang Tahun", harga: 10000, warna: "#fbbf24", kode_visual: "lilin", peran_visual: "topping" },
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
