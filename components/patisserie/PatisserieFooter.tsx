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
  toko?: any;
}

export const PatisserieFooter: React.FC<PatisserieFooterProps> = ({ toko = null }) => {
  const [clientToko, setClientToko] = React.useState<any>(toko);

  React.useEffect(() => {
    const punyaIsi = Boolean(
      toko &&
        (toko.nama_toko ||
          toko.alamat ||
          toko.no_wa ||
          toko.wa_link ||
          toko.jam?.senin_jumat ||
          toko.jam?.sabtu_minggu)
    );
    if (punyaIsi) {
      setClientToko(toko);
      return;
    }
    let aktif = true;
    fetch('/api/pengaturan')
      .then((r) => r.json())
      .then((res) => {
        if (aktif && res?.sukses && res?.data) {
          const d = res.data;
          let bersihWa = String(d.no_wa || '').replace(/[^0-9]/g, '');
          if (bersihWa.startsWith('0')) bersihWa = '62' + bersihWa.slice(1);
          else if (bersihWa.startsWith('8')) bersihWa = '62' + bersihWa;

          let igHandle = (d.instagram || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/^@+/, '').replace(/\/.*$/, '');
          const igUrl = igHandle ? `https://instagram.com/${igHandle}` : '';
          if (igHandle) igHandle = `@${igHandle}`;

          const formatJam = (b: any, t: any) => (b && t ? `${String(b).slice(0, 5).replace(':', '.')} – ${String(t).slice(0, 5).replace(':', '.')} WIB` : '');
          const seninJumat = formatJam(d.jam_buka_senin_jumat || d.jam_buka, d.jam_tutup_senin_jumat || d.jam_tutup);
          const sabtuMinggu = formatJam(d.jam_buka_sabtu_minggu || d.jam_buka, d.jam_tutup_sabtu_minggu || d.jam_tutup);

          setClientToko({
            nama_toko: (d.nama_toko || '').trim(),
            alamat: (d.alamat || '').trim(),
            no_wa: bersihWa,
            wa_link: bersihWa ? `https://wa.me/${bersihWa}` : '',
            email: (d.email || '').trim(),
            instagram_handle: igHandle,
            instagram_url: igUrl,
            tautan_peta: (d.tautan_peta || '').trim(),
            deskripsi_footer: (d.deskripsi_footer || '').trim(),
            jam: {
              senin_jumat: seninJumat,
              sabtu_minggu: sabtuMinggu,
            },
            minimal_hari_pesan: d.minimal_hari_pesan !== null && d.minimal_hari_pesan !== undefined && d.minimal_hari_pesan !== "" ? Number(d.minimal_hari_pesan) : null,
            maks_jarak_kirim_km: d.maks_jarak_kirim_km !== null && d.maks_jarak_kirim_km !== undefined && d.maks_jarak_kirim_km !== "" ? Number(d.maks_jarak_kirim_km) : null,
          });
        }
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, [toko]);

  const tokoData = clientToko || toko;
  const namaToko = (tokoData?.nama_toko || '').trim();
  const adaAlamat = Boolean(tokoData?.alamat);
  const adaJam = Boolean(tokoData?.jam?.senin_jumat || tokoData?.jam?.sabtu_minggu);
  const adaKontak = Boolean(tokoData?.wa_link || tokoData?.email || tokoData?.instagram_url);
  const tahunBerjalan = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-[#251410] via-[#1F0E0C] to-[#120705] text-[#FFFDF9] border-t-2 border-[#C59B62]/80 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="w-full h-1 bg-gradient-to-r from-[#8E6A36] via-[#F3DAAC] to-[#8E6A36] opacity-80"
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/images/Icon.png"
                alt="Cravely"
                className="w-12 h-12 object-contain shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
              />
              <div>
                <span className="font-script text-3xl sm:text-4xl text-[#EFA7B8] block leading-none">
                  Baked with Love
                </span>
                {namaToko && (
                  <h2 className="font-coquette text-2xl font-bold tracking-wider text-[#FFFDF9] mt-1.5">
                    {namaToko}
                  </h2>
                )}
              </div>
            </div>
            {tokoData?.deskripsi_footer && (
              <p className="text-xs sm:text-sm text-[#F3E8E2] leading-relaxed">
                {tokoData.deskripsi_footer}
              </p>
            )}
          </div>

          {(adaAlamat || adaJam) && (
            <div className="lg:col-span-4 space-y-4">
              <h3 className="font-serif text-sm font-bold tracking-widest text-[#F5D5A5] uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5D5A5]" />
                <span>Butik &amp; Jam Buka</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white/[0.06] border border-[#C59B62]/35 space-y-3.5 text-xs sm:text-sm">
                {adaAlamat && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#C59B62]/20 border border-[#C59B62]/50 text-[#F5D5A5] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#FFFDF9]">Alamat Toko</p>
                      <p className="text-[#F3E8E2] text-xs leading-relaxed mt-0.5">
                        {tokoData.alamat}
                      </p>
                    </div>
                  </div>
                )}

                {adaJam && (
                  <div className={`flex items-start gap-3 ${adaAlamat ? 'border-t border-white/10 pt-3' : ''}`}>
                    <div className="w-7 h-7 rounded-lg bg-[#C59B62]/20 border border-[#C59B62]/50 text-[#F5D5A5] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1 text-xs w-full">
                      {tokoData?.jam?.senin_jumat && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#F3E8E2]">Senin – Jumat:</span>
                          <span className="font-bold text-[#FFFDF9] tabular-nums">{tokoData.jam.senin_jumat}</span>
                        </div>
                      )}
                      {tokoData?.jam?.sabtu_minggu && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#F3E8E2]">Sabtu – Minggu:</span>
                          <span className="font-bold text-[#F5D5A5] tabular-nums">{tokoData.jam.sabtu_minggu}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {adaKontak && (
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif text-sm font-bold tracking-widest text-[#F5D5A5] uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5D5A5]" />
                <span>Kontak Kami</span>
              </h3>

              <ul className="space-y-2.5 text-xs sm:text-sm">
                {tokoData?.wa_link && (
                  <li>
                    <a
                      href={tokoData.wa_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[#F3E8E2] hover:text-[#FFFDF9] transition group"
                    >
                      <span className="w-6 h-6 rounded-md bg-white/10 border border-[#C59B62]/40 flex items-center justify-center text-[#F5D5A5] group-hover:bg-[#9E3B42] group-hover:border-[#9E3B42] group-hover:text-white transition">
                        <Phone className="w-3 h-3" />
                      </span>
                      <span>WhatsApp Toko</span>
                    </a>
                  </li>
                )}

                {tokoData?.email && (
                  <li>
                    <a
                      href={`mailto:${tokoData.email}`}
                      className="flex items-center gap-2.5 text-[#F3E8E2] hover:text-[#FFFDF9] transition group"
                    >
                      <span className="w-6 h-6 rounded-md bg-white/10 border border-[#C59B62]/40 flex items-center justify-center text-[#F5D5A5] group-hover:bg-[#9E3B42] group-hover:border-[#9E3B42] group-hover:text-white transition">
                        <Mail className="w-3 h-3" />
                      </span>
                      <span className="truncate">{tokoData.email}</span>
                    </a>
                  </li>
                )}

                {tokoData?.instagram_url && (
                  <li>
                    <a
                      href={tokoData.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[#F3E8E2] hover:text-[#FFFDF9] transition group"
                    >
                      <span className="w-6 h-6 rounded-md bg-white/10 border border-[#C59B62]/40 flex items-center justify-center text-[#F5D5A5] group-hover:bg-[#9E3B42] group-hover:border-[#9E3B42] group-hover:text-white transition">
                        <InstagramIcon className="w-3 h-3" />
                      </span>
                      <span>{tokoData.instagram_handle || 'Instagram'}</span>
                    </a>
                  </li>
                )}
              </ul>

              {tokoData?.minimal_hari_pesan !== undefined && tokoData?.minimal_hari_pesan !== null && (
                <p className="text-[11px] text-[#F3E8E2] leading-relaxed pt-1">
                  Melayani pesanan custom cake H-{tokoData.minimal_hari_pesan}
                  {tokoData.maks_jarak_kirim_km ? `, pengantaran hingga ${tokoData.maks_jarak_kirim_km} km dari toko` : ''}
                </p>
              )}
            </div>
          )}

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-serif text-sm font-bold tracking-widest text-[#F5D5A5] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5D5A5]" />
              <span>Jelajahi</span>
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-[#F3E8E2]">
              <li>
                <Link href="/" className="hover:text-[#EFA7B8] hover:translate-x-1 inline-block transition">
                  Home (Halaman Utama)
                </Link>
              </li>
              <li>
                <Link
                  href="/#toko"
                  onClick={(e) => {
                    if (typeof window !== 'undefined' && window.location.pathname === '/') {
                      e.preventDefault();
                      const stage = document.querySelector('[data-cafe-stage="true"]') as HTMLElement | null;
                      const top = stage ? Math.max(0, stage.offsetHeight - window.innerHeight) : 0;
                      window.scrollTo({ top, behavior: 'smooth' });
                    }
                  }}
                  className="hover:text-[#EFA7B8] hover:translate-x-1 inline-block transition"
                >
                  Ruang Toko &amp; Kafe
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-[#EFA7B8] hover:translate-x-1 inline-block transition">
                  Daftar Menu &amp; Harga
                </Link>
              </li>
              <li>
                <Link href="/pesan" className="hover:text-[#EFA7B8] hover:translate-x-1 inline-flex items-center gap-1.5 text-[#EFA7B8] font-bold transition">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cake Studio 3D</span>
                </Link>
              </li>
              <li>
                <Link href="/keranjang" className="hover:text-[#EFA7B8] hover:translate-x-1 inline-block transition">
                  Meja Kasir &amp; Keranjang
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#C59B62]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FFFDF9]/95 font-medium">
          <span>© {tahunBerjalan}{namaToko ? ` ${namaToko}` : ''}</span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-[#F3E8E2]/80">
            <Link href="/syarat-ketentuan" className="hover:text-white transition">
              Syarat &amp; Ketentuan
            </Link>
            <span>•</span>
            <Link href="/kebijakan-privasi" className="hover:text-white transition">
              Kebijakan Privasi
            </Link>
            <span>•</span>
            <Link href="/kebijakan-pembatalan" className="hover:text-white transition">
              Kebijakan Pembatalan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
