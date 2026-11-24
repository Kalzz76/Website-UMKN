"use client";
import React from 'react';
import Link from 'next/link';
import { Clock, Mail, MapPin, Phone, ChefHat } from 'lucide-react';
import type { ViewType } from './patisserieData';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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
  onNavigate?: (view: ViewType) => void;
  onOpenHampers?: () => void;
  onExitShop?: () => void;
}

export const PatisserieFooter: React.FC<PatisserieFooterProps> = () => {
  return (
    <footer className="bg-gradient-to-b from-[#251410] via-[#1F0E0C] to-[#120705] text-[#FFFDF9] border-t-2 border-[#C59B62]/80 relative overflow-hidden">
      {/* Decorative Top Golden Ribbon Trim */}
      <div
        aria-hidden="true"
        className="w-full h-1 bg-gradient-to-r from-[#8E6A36] via-[#F3DAAC] to-[#8E6A36] opacity-80"
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand & Philosophy */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <span className="font-script text-3xl sm:text-4xl text-[#E8A5AC] block leading-none">
                Baked with Love
              </span>
              <h2 className="font-coquette text-2xl font-bold tracking-wider text-[#FFFDF9] mt-1.5">
                Cravely
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E6D4CC] leading-relaxed">
              Patisserie rumahan di jantung kota Bandung sejak 2018. Kami memanggang cupcake lembut, chiffon pandan wangi, kue ulang tahun berpita, dan kreasi Custom Cake 3D segar setiap hari dengan resep mentega murni pilihan.
            </p>
          </div>

          {/* Column 2: Alamat Toko & Jam Operasional */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-serif text-sm font-bold tracking-widest text-[#E5C590] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5C590]" />
              <span>Butik &amp; Jam Buka</span>
            </h3>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#C59B62]/25 space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#C59B62]/15 border border-[#C59B62]/40 text-[#E5C590] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-[#FFFDF9]">Butik &amp; Kafe Utama Bandung</p>
                  <p className="text-[#DAC8BF] text-xs leading-relaxed mt-0.5">
                    Jl. Melati Manis No. 18, Citarum, Kec. Bandung Wetan, Kota Bandung, 40115
                  </p>
                  <p className="text-[11px] text-[#E8A5AC] mt-1 font-semibold">
                    (Seberang Taman Melati · Area Dine-in &amp; Parkir)
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#C59B62]/15 border border-[#C59B62]/40 text-[#E5C590] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#DAC8BF]">Senin – Jumat:</span>
                    <span className="font-bold text-[#FFFDF9] tabular-nums">08.00 – 20.00 WIB</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#DAC8BF]">Sabtu – Minggu:</span>
                    <span className="font-bold text-[#E5C590] tabular-nums">08.00 – 21.00 WIB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Kontak & Pesanan */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-serif text-sm font-bold tracking-widest text-[#E5C590] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5C590]" />
              <span>Kontak Kami</span>
            </h3>

            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-[#DAC8BF] hover:text-[#FFFDF9] transition group"
                >
                  <span className="w-6 h-6 rounded-md bg-white/5 border border-[#C59B62]/30 flex items-center justify-center text-[#E5C590] group-hover:bg-[#9E3B42] group-hover:border-[#9E3B42] group-hover:text-white transition">
                    <Phone className="w-3 h-3" />
                  </span>
                  <span>WhatsApp Toko</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:halo@cravely.id"
                  className="flex items-center gap-2.5 text-[#DAC8BF] hover:text-[#FFFDF9] transition group"
                >
                  <span className="w-6 h-6 rounded-md bg-white/5 border border-[#C59B62]/30 flex items-center justify-center text-[#E5C590] group-hover:bg-[#9E3B42] group-hover:border-[#9E3B42] group-hover:text-white transition">
                    <Mail className="w-3 h-3" />
                  </span>
                  <span>halo@cravely.id</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-[#DAC8BF] hover:text-[#FFFDF9] transition group"
                >
                  <span className="w-6 h-6 rounded-md bg-white/5 border border-[#C59B62]/30 flex items-center justify-center text-[#E5C590] group-hover:bg-[#9E3B42] group-hover:border-[#9E3B42] group-hover:text-white transition">
                    <InstagramIcon className="w-3 h-3" />
                  </span>
                  <span>@cravely.bdg</span>
                </a>
              </li>
            </ul>

            <p className="text-[11px] text-[#DAC8BF]/80 leading-relaxed pt-1">
              Melayani pesanan custom cake H-2 &amp; pengantaran langsung khusus Bandung Raya.
            </p>
          </div>

          {/* Column 4: Navigasi Halaman Toko (Rute Bersih) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-serif text-sm font-bold tracking-widest text-[#E5C590] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5C590]" />
              <span>Jelajahi</span>
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-[#DAC8BF]">
              <li>
                <Link href="/" className="hover:text-[#E8A5AC] hover:translate-x-1 inline-block transition">
                  Home (Halaman Utama)
                </Link>
              </li>
              <li>
                <Link href="/toko" className="hover:text-[#E8A5AC] hover:translate-x-1 inline-block transition">
                  Ruang Toko &amp; Kafe
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-[#E8A5AC] hover:translate-x-1 inline-block transition">
                  Daftar Menu &amp; Harga
                </Link>
              </li>
              <li>
                <Link href="/pesan" className="hover:text-[#E8A5AC] hover:translate-x-1 inline-flex items-center gap-1.5 text-[#E8A5AC] font-bold transition">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cake Studio 3D</span>
                </Link>
              </li>
              <li>
                <Link href="/keranjang" className="hover:text-[#E8A5AC] hover:translate-x-1 inline-block transition">
                  Meja Kasir &amp; Keranjang
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="mt-12 pt-6 border-t border-[#C59B62]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#DAC8BF]/70">
          <span>© 2026 Cravely. Seluruh hak cipta dilindungi.</span>
          <span className="text-[#E5C590]/80">Bandung, Jawa Barat</span>
        </div>
      </div>
    </footer>
  );
};
