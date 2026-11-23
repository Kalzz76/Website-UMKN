"use client";
import React from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { ViewType } from './patisserieData';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface PatisserieFooterProps {
  onNavigate: (view: ViewType) => void;
  onOpenHampers: () => void;
  onExitShop: () => void;
}

export const PatisserieFooter: React.FC<PatisserieFooterProps> = ({
  onNavigate,
  onOpenHampers,
  onExitShop,
}) => {
  return (
    <footer className="bg-kayuGelap text-ivory border-t-[3px] border-kuningan/70 relative overflow-hidden">
      {/* Subtle Top Scalloped Lace Accent */}
      <div
        aria-hidden="true"
        className="w-full h-1.5 bg-gradient-to-r from-kayu via-kuningan/70 to-kayu opacity-75"
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-9 lg:gap-8">
          {/* Column 1: Brand & Story */}
          <div className="lg:col-span-4 space-y-3.5">
            <div>
              <span className="font-script text-3xl text-blush block leading-none">
                Baked with Love
              </span>
              <h2 className="font-coquette text-lg sm:text-xl font-bold text-ivory tracking-wider mt-1">
                Cravely
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ivory/78 leading-relaxed">
              Patisserie rumahan di jantung kota Bandung sejak 2018. Kami memanggang
              cupcake, whole cake berpita, dan kue custom 3D segar setiap hari menggunakan
              mentega pilihan, buah beri segar, dan krim lembut buatan sendiri.
            </p>
            <div className="pt-1 flex items-center gap-4 text-xs text-blush/90 font-semibold">
              <span>100% Bahan Segar</span>
              <span aria-hidden="true">·</span>
              <span>Halal &amp; Homemade</span>
            </div>
          </div>

          {/* Column 2: Alamat Toko Lengkap & Jam Buka */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-coquette text-xs sm:text-sm font-bold tracking-widest text-kuningan uppercase">
              Alamat Toko &amp; Jam Buka
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-ivory/85">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-kuningan shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ivory">Butik &amp; Kafe Utama Bandung</p>
                  <p className="text-ivory/80 leading-relaxed mt-0.5">
                    Jl. Melati Manis No. 18, Kel. Citarum, Kec. Bandung Wetan,
                    Kota Bandung, Jawa Barat 40115
                  </p>
                  <p className="text-[11px] text-blush/85 mt-1">
                    Seberang Taman Melati Heritage · 3 menit dari Gedung Sate (Area Dine-in &amp; Parkir Tersedia)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-kuningan shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-ivory/80">
                  <p>
                    <strong className="text-ivory">Senin – Jumat:</strong> 08.00 – 20.00 WIB
                  </p>
                  <p>
                    <strong className="text-ivory">Sabtu – Minggu &amp; Libur:</strong> 08.00 – 21.00 WIB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Kontak & Layanan */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-coquette text-xs sm:text-sm font-bold tracking-widest text-kuningan uppercase">
              Kontak Kami
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-ivory/80">
              <li>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-blush transition"
                >
                  <Phone className="w-3.5 h-3.5 text-kuningan shrink-0" />
                  <span>+62 812-3456-7890</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:halo@cravely.id"
                  className="inline-flex items-center gap-2 hover:text-blush transition"
                >
                  <Mail className="w-3.5 h-3.5 text-kuningan shrink-0" />
                  <span>halo@cravely.id</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <InstagramIcon className="w-3.5 h-3.5 text-kuningan shrink-0" />
                <span>@cravely.bdg</span>
              </li>
            </ul>
            <p className="text-[11px] text-ivory/65 leading-relaxed pt-1">
              Menerima pesanan custom cake minimal H-2 &amp; pengantaran khusus area Bandung Raya.
            </p>
          </div>

          {/* Column 4: Navigasi Toko */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-coquette text-xs sm:text-sm font-bold tracking-widest text-kuningan uppercase">
              Jelajahi
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-ivory/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('toko')}
                  className="hover:text-blush transition text-left"
                >
                  Ruang Cafe Interaktif
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('etalase')}
                  className="hover:text-blush transition text-left"
                >
                  Etalase Kue Ultah &amp; Chiffon
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('katalog')}
                  className="hover:text-blush transition text-left"
                >
                  Menu Kue Lengkap &amp; Harga
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('custom')}
                  className="hover:text-blush transition text-left"
                >
                  Studio Custom Cake 3D
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('kasir')}
                  className="hover:text-blush transition text-left"
                >
                  Meja Kasir &amp; Keranjang
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dokumentasi')}
                  className="hover:text-blush transition text-left"
                >
                  Dokumentasi &amp; Promo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('lokasi')}
                  className="hover:text-blush transition text-left"
                >
                  Lokasi &amp; Peta Toko
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pengaduan')}
                  className="hover:text-blush transition text-left"
                >
                  Kritik &amp; Saran
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-blush transition text-left"
                >
                  Contact Person
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenHampers}
                  className="hover:text-blush transition text-left"
                >
                  Cookies &amp; Hampers Pita
                </button>
              </li>
              <li className="pt-1">
                <button
                  type="button"
                  onClick={onExitShop}
                  className="text-kuningan hover:text-blush underline underline-offset-4 text-xs font-bold transition"
                >
                  Keluar ke Depan Toko
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="mt-10 pt-5 border-t border-kuningan/25 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-ivory/60">
          <span>© 2026 Cravely Bandung. Seluruh hak cipta dilindungi.</span>
          <span>Cravely Patisserie · Jl. Melati Manis No. 18, Bandung Wetan</span>
        </div>
      </div>
    </footer>
  );
};
