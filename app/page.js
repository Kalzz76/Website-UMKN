"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function Home() {
  const [toko, setToko] = useState({
    nama_toko: "Dapur Manis Custom Cake",
    alamat: "Jl. Melati No. 12, Jakarta Selatan",
    no_wa: "081234567890",
    jam_operasional: "Senin - Minggu: 08.00 - 20.00",
  });

  useEffect(() => {
    async function muatToko() {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("pengaturan_toko")
        .select("nama_toko, alamat, no_wa, jam_operasional")
        .eq("id", 1)
        .maybeSingle();

      if (data && data.nama_toko) {
        setToko(data);
      }
    }
    muatToko();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const preferKurangGerak = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!preferKurangGerak) {
      const elemenStory = gsap.utils.toArray(".adegan-story");
      elemenStory.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const noWaBersih = (toko.no_wa || "081234567890").replace(/\D/g, "");

  const adeganPerjalanan = [
    {
      nomor: "01",
      judulBaris1: "Langkah Pertama: Tentukan Fondasi",
      judulBaris2: "Pilihan Rasa & Ukuran yang Pas",
      deskripsi:
        "Mulai petualangan rasa kue Anda. Pilih dari cake coklat legit, vanilla harum, pandan wangi, hingga red velvet lembut. Sesuaikan ukuran porsi mulai dari 15 cm untuk perayaan intim hingga ukuran bertingkat untuk pesta megah.",
      kartuJudul: "Rasa & Dimensi",
      kartuPoin: [
        "Bolu lembut dengan resep otentik",
        "Pilihan diameter 15 cm, 20 cm, hingga 25 cm",
        "Dapat memilih single tier maupun multi-tier",
      ],
      svg: (
        <svg viewBox="0 0 240 180" className="w-full h-auto max-w-[220px] mx-auto drop-shadow-sm">
          <ellipse cx="120" cy="140" rx="80" ry="24" fill="#fbcfe8" />
          <path d="M 40 140 C 40 155, 200 155, 200 140 L 200 105 C 200 120, 40 120, 40 105 Z" fill="#f472b6" />
          <ellipse cx="120" cy="105" rx="80" ry="24" fill="#fbcfe8" />
          <ellipse cx="120" cy="85" rx="55" ry="18" fill="#fed7aa" />
          <path d="M 65 85 C 65 98, 175 98, 175 85 L 175 55 C 175 68, 65 68, 65 55 Z" fill="#fb923c" />
          <ellipse cx="120" cy="55" rx="55" ry="18" fill="#fef3c7" />
          <circle cx="120" cy="38" r="8" fill="#e11d48" />
          <path d="M 119 30 Q 121 24 125 22" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      nomor: "02",
      judulBaris1: "Kreasikan Karakter Unik",
      judulBaris2: "Sentuhan Hiasan & Tulisan Spesial",
      deskripsi:
        "Berikan jiwa pada kue Anda. Tentukan warna lelehan krim lembut, taburan coklat chip, buah strawberry segar, atau lilin perayaan. Ketik ucapan atau doa tulus yang langsung terpampang nyata di atas preview kue.",
      kartuJudul: "Dekorasi Personal",
      kartuPoin: [
        "Live Preview 2D mengikuti pilihan Anda",
        "Pilihan warna buttercream & topping variatif",
        "Pesan tulisan kustom di permukaan kue",
      ],
      svg: (
        <svg viewBox="0 0 240 180" className="w-full h-auto max-w-[220px] mx-auto drop-shadow-sm">
          <ellipse cx="120" cy="135" rx="75" ry="24" fill="#e2e8f0" />
          <rect x="45" y="80" width="150" height="55" rx="16" fill="#f5f5f4" />
          <ellipse cx="120" cy="80" rx="75" ry="24" fill="#fecdd3" />
          <path d="M 45 80 Q 60 100 75 80 Q 90 100 105 80 Q 120 100 135 80 Q 150 100 165 80 Q 180 100 195 80" stroke="#f43f5e" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="75" cy="65" r="7" fill="#ef4444" />
          <circle cx="120" cy="60" r="7" fill="#ef4444" />
          <circle cx="165" cy="65" r="7" fill="#ef4444" />
          <rect x="117" y="32" width="6" height="24" fill="#fbbf24" rx="2" />
          <ellipse cx="120" cy="26" rx="4" ry="7" fill="#f97316" />
        </svg>
      ),
    },
    {
      nomor: "03",
      judulBaris1: "Atur Waktu Perayaan",
      judulBaris2: "Pilih Tanggal & Cara Pengambilan",
      deskripsi:
        "Tentukan jadwal momen istimewa Anda. Ambil pesanan langsung di toko kami saat hangat, atau nikmati layanan pengantaran aman langsung ke depan gerbang rumah Anda sesuai zona ongkir yang jelas.",
      kartuJudul: "Jadwal & Kuota Terjamin",
      kartuPoin: [
        "Sistem kuota harian agar mutu terjaga",
        "Pilihan jam pengambilan per jam",
        "Ambil sendiri di toko atau kirim ke alamat",
      ],
      svg: (
        <svg viewBox="0 0 240 180" className="w-full h-auto max-w-[220px] mx-auto drop-shadow-sm">
          <rect x="40" y="30" width="95" height="110" rx="16" fill="#ffffff" stroke="#e7e5e4" strokeWidth="4" />
          <rect x="40" y="30" width="95" height="30" rx="16" fill="#e11d48" />
          <circle cx="65" cy="24" r="5" fill="#78716c" />
          <circle cx="110" cy="24" r="5" fill="#78716c" />
          <rect x="55" y="75" width="16" height="16" rx="4" fill="#cbd5e1" />
          <rect x="80" y="75" width="16" height="16" rx="4" fill="#e11d48" />
          <rect x="105" y="75" width="16" height="16" rx="4" fill="#cbd5e1" />
          <rect x="55" y="102" width="16" height="16" rx="4" fill="#cbd5e1" />
          <rect x="80" y="102" width="16" height="16" rx="4" fill="#cbd5e1" />
          <g transform="translate(130, 85)">
            <rect x="0" y="10" width="65" height="35" rx="8" fill="#0284c7" />
            <rect x="45" y="18" width="22" height="27" rx="5" fill="#0369a1" />
            <circle cx="16" cy="46" r="9" fill="#334155" />
            <circle cx="54" cy="46" r="9" fill="#334155" />
          </g>
        </svg>
      ),
    },
    {
      nomor: "04",
      judulBaris1: "Dipanggang Penuh Dedikasi",
      judulBaris2: "Diramu Hangat di Dapur Kami",
      deskripsi:
        "Tanpa bahan pengawet dan tanpa stok beku. Setelah pembayaran Anda terkonfirmasi, chef dapur kami meracik adonan segar menggunakan bahan-bahan bersertifikasi kualitas terbaik tepat sebelum jadwal pengambilan.",
      kartuJudul: "Standar Dapur Manis",
      kartuPoin: [
        "100% bahan segar tanpa pengawet",
        "Kebersihan dapur dan peralatan terjaga",
        "Dikerjakan dengan teliti sesuai pesanan",
      ],
      svg: (
        <svg viewBox="0 0 240 180" className="w-full h-auto max-w-[220px] mx-auto drop-shadow-sm">
          <rect x="35" y="30" width="170" height="120" rx="16" fill="#1e293b" />
          <rect x="55" y="48" width="130" height="70" rx="10" fill="#ea580c" opacity="0.9" />
          <ellipse cx="120" cy="85" rx="42" ry="16" fill="#78350f" />
          <ellipse cx="120" cy="80" rx="35" ry="12" fill="#fb923c" />
          <circle cx="75" cy="133" r="6" fill="#64748b" />
          <circle cx="120" cy="133" r="6" fill="#64748b" />
          <circle cx="165" cy="133" r="6" fill="#64748b" />
          <path d="M 105 32 Q 108 20 115 15" stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 125 32 Q 128 20 135 15" stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      nomor: "05",
      judulBaris1: "Kue Sempurna Telah Siap",
      judulBaris2: "Disertai Tiket QR & Box Eksklusif",
      deskripsi:
        "Kue dikemas dalam kotak pelindung premium yang kokoh dan aman dari guncangan. Pelanggan cukup menunjukkan kode QR digital tiket pesanan untuk serah terima yang cepat dan menyenangkan.",
      kartuJudul: "Momen Spesial Tiba",
      kartuPoin: [
        "Box packaging tebal transparan berpita",
        "Tiket QR digital untuk verifikasi cepat",
        "Siap menceriakan pesta dan keluarga Anda",
      ],
      svg: (
        <svg viewBox="0 0 240 180" className="w-full h-auto max-w-[220px] mx-auto drop-shadow-sm">
          <rect x="55" y="65" width="130" height="85" rx="14" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="4" />
          <line x1="120" y1="65" x2="120" y2="150" stroke="#f43f5e" strokeWidth="5" />
          <line x1="55" y1="105" x2="185" y2="105" stroke="#f43f5e" strokeWidth="5" />
          <ellipse cx="98" cy="52" rx="18" ry="12" fill="#fb7185" />
          <ellipse cx="142" cy="52" rx="18" ry="12" fill="#fb7185" />
          <circle cx="120" cy="54" r="8" fill="#e11d48" />
          <g transform="translate(170, 35)">
            <rect x="0" y="0" width="36" height="36" rx="6" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
            <rect x="5" y="5" width="10" height="10" fill="#e11d48" />
            <rect x="21" y="5" width="10" height="10" fill="#e11d48" />
            <rect x="5" y="21" width="10" height="10" fill="#e11d48" />
            <rect x="18" y="18" width="6" height="6" fill="#e11d48" />
          </g>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800 selection:bg-rose-100 selection:text-rose-900">
      <header className="sticky top-4 z-40 px-4">
        <nav className="max-w-4xl mx-auto px-6 py-3.5 bg-white/90 backdrop-blur rounded-full shadow-sm border border-stone-200/60 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm shadow-sm">
              <i className="fa-solid fa-cake-candles"></i>
            </div>
            <span className="font-extrabold text-stone-900 text-sm tracking-tight">
              {toko.nama_toko || "Dapur Manis"}
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-stone-600">
            <Link href="#perjalanan" className="hover:text-rose-600 transition">
              Perjalanan Kue
            </Link>
            <Link href="#cara-pesan" className="hover:text-rose-600 transition">
              Cara Pesan
            </Link>
            <Link href="#kontak" className="hover:text-rose-600 transition">
              Lokasi & Kontak
            </Link>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/pesanan-saya"
              className="hidden sm:inline-block text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
            >
              Pesanan Saya
            </Link>
            <Link
              href="/pesan"
              className="text-xs font-semibold px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
            >
              Pesan Sekarang
            </Link>
          </div>
        </nav>
      </header>

      <section className="pt-16 pb-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Kustomisasi Interaktif • Live Preview Kue</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-[1.15] tracking-tight">
            Kue Impian untuk Momen
            <span className="block text-rose-600 mt-1">Paling Istimewa Anda</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
            Rancang kue custom Anda secara bertahap dengan mudah. Tentukan rasa favorit, pilih ukuran, atur lelehan krim dan tulisan ucapan, lalu nikmati hasilnya tepat di hari perayaan.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/pesan"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold bg-rose-600 hover:bg-rose-500 text-white text-sm shadow-md transition"
            >
              Mulai Pesan Kue Sekarang
            </Link>
            <Link
              href="#perjalanan"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm transition"
            >
              Lihat Perjalanan Kue
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 400 180" className="w-full h-auto max-w-md drop-shadow-sm">
            <rect x="50" y="80" width="300" height="80" rx="16" fill="#fff1f2" stroke="#fecdd3" strokeWidth="3" />
            <path d="M 30 80 L 200 20 L 370 80 Z" fill="#e11d48" />
            <path d="M 50 80 Q 75 95 100 80 Q 125 95 150 80 Q 175 95 200 80 Q 225 95 250 80 Q 275 95 300 80 Q 325 95 350 80" stroke="#ffe4e6" strokeWidth="8" fill="none" strokeLinecap="round" />
            <rect x="80" y="100" width="70" height="50" rx="8" fill="#ffffff" stroke="#fda4af" strokeWidth="2" />
            <circle cx="115" cy="120" r="12" fill="#f43f5e" />
            <rect x="250" y="100" width="70" height="50" rx="8" fill="#ffffff" stroke="#fda4af" strokeWidth="2" />
            <circle cx="285" cy="120" r="12" fill="#fb923c" />
            <rect x="180" y="95" width="40" height="65" rx="6" fill="#ffffff" stroke="#fda4af" strokeWidth="2" />
            <circle cx="212" cy="125" r="3" fill="#e11d48" />
          </svg>
        </div>
      </section>

      <section id="perjalanan" className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Scroll Storytelling
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Perjalanan Sebuah Kue Custom
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Simak bagaimana rancangan manis Anda diolah dari sebutir ide hingga hadir menyemarakkan acara.
            </p>
          </div>

          <div className="space-y-16 relative">
            {adeganPerjalanan.map((adegan, idx) => (
              <div
                key={idx}
                className="adegan-story bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-5 bg-stone-50/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-rose-200 self-start">
                    {adegan.nomor}
                  </span>
                  <div className="my-3">{adegan.svg}</div>
                </div>

                <div className="md:col-span-7 space-y-4 text-left">
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                    {adegan.judulBaris1}
                    <span className="block text-rose-600">{adegan.judulBaris2}</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {adegan.deskripsi}
                  </p>

                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2 text-xs">
                    <span className="font-bold text-stone-800 block">
                      {adegan.kartuJudul}
                    </span>
                    {adegan.kartuPoin.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2 text-stone-600">
                        <i className="fa-solid fa-circle-check text-rose-500 text-[11px]"></i>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-pesan" className="py-16 px-4 bg-white border-y border-stone-200/60">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Alur Cepat
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              4 Langkah Mudah Pemesanan
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Tak perlu antre di toko. Cukup selesaikan pesanan Anda dalam hitungan menit lewat HP.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-sm text-stone-900">Kustomisasi</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Pilih ukuran, varian rasa adonan, warna krim, hiasan, dan tulisan di kue.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-sm text-stone-900">Tentukan Jadwal</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Pilih tanggal dan jam ketersediaan kuota. Pilih ambil di toko atau diantar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-bold text-sm text-stone-900">Pembayaran</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Kirim pembayaran DP atau pelunasan via transfer bank atau QRIS resmi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="font-bold text-sm text-stone-900">Dapatkan Tiket QR</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Dapatkan tiket pesanan dengan kode QR untuk memantau status pembuatan kue.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/pesan"
              className="inline-block px-8 py-3.5 rounded-full font-bold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm"
            >
              Mulai Pesan Kue Sekarang
            </Link>
          </div>
        </div>
      </section>

      <section id="kontak" className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-stone-900 text-stone-200 rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <i className="fa-solid fa-location-dot"></i>
              <span>Kunjungi Dapur Kami</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              {toko.nama_toko || "Dapur Manis Custom Cake"}
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              {toko.alamat || "Jl. Melati No. 12, Jakarta Selatan"}
            </p>
            <div className="pt-2 text-xs text-stone-300 space-y-1">
              <p>
                <i className="fa-regular fa-clock text-rose-400 mr-2"></i>
                {toko.jam_operasional || "Setiap Hari: 08.00 - 20.00 WIB"}
              </p>
              <p>
                <i className="fa-brands fa-whatsapp text-emerald-400 mr-2"></i>
                WhatsApp: {toko.no_wa || "081234567890"}
              </p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-4">
            <p className="text-sm font-medium text-stone-300">
              Ada pertanyaan khusus atau ingin konsultasi desain kue kustom dalam jumlah banyak?
            </p>
            <a
              href={`https://wa.me/${noWaBersih}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition shadow-md"
            >
              <i className="fa-brands fa-whatsapp text-base"></i>
              <span>Hubungi Dapur via WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-stone-200 text-center text-xs text-stone-500">
        <p>© 2026 {toko.nama_toko || "Dapur Manis Custom Cake"}. Seluruh hak cipta dilindungi.</p>
      </footer>

      <a
        href={`https://wa.me/${noWaBersih}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-xl transition hover:scale-105"
        title="Chat WhatsApp"
      >
        <i className="fa-brands fa-whatsapp"></i>
      </a>
    </div>
  );
}