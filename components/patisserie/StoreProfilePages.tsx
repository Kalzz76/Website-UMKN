"use client";
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { formatRupiah, type ViewType } from './patisserieData';

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

interface SharedNavProps {
  onNavigate: (view: ViewType) => void;
}

interface DokumentasiViewProps extends SharedNavProps {
  onGoToMenuWithCake: (menuId: number) => void;
}

interface ContactViewProps extends SharedNavProps {
  onCopy: (text: string, label: string) => void;
}

interface PengaduanViewProps extends SharedNavProps {
  onNotify: (msg: string) => void;
}

type DocFilter = 'semua' | 'suasana' | 'produk' | 'aktivitas';

interface DocItem {
  id: number;
  kategori: Exclude<DocFilter, 'semua'>;
  tag: string;
  judul: string;
  desc: string;
  photo: string;
  alt: string;
}

const DOC_ITEMS: DocItem[] = [
  {
    id: 0,
    kategori: 'suasana',
    tag: 'Suasana Dalam Toko',
    judul: 'Interior & Area Pelayanan Toko',
    desc: 'Ruangan dalam toko kue Cravely yang bersih, tertata rapi, dan hangat dengan etalase kaca segar sehingga pengunjung nyaman memilih kue langsung.',
    photo: '/images/patisserie/umkm_bakery_counter_1795398163126.jpg',
    alt: 'Suasana ruang dalam dan counter etalase toko kue Cravely Bandung',
  },
  {
    id: 1,
    kategori: 'produk',
    tag: 'Jenis Kue Dijual',
    judul: 'Koleksi Chiffon & Kue Ulang Tahun',
    desc: 'Ragam chiffon cake lembut, sponge cake krim segar, dan kue ulang tahun berpita yang siap dibawa langsung dari etalase harian.',
    photo: '/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg',
    alt: 'Japanese Strawberry Chiffon Cake Cravely Patisserie',
  },
  {
    id: 2,
    kategori: 'produk',
    tag: 'Aktivitas Dapur',
    judul: 'Pemolesan Krim Manual di Dapur',
    desc: 'Proses menimbang bahan, memanggang adonan hangat, serta pemolesan krim manual setiap pagi menggunakan 100% mentega murni tanpa bahan pengawet.',
    photo: '/images/patisserie/umkm_kitchen_decorating_1795398163081.jpg',
    alt: 'Proses pemolesan kue ulang tahun polos di dapur Cravely Bandung',
  },
  {
    id: 3,
    kategori: 'aktivitas',
    tag: 'Kue Terjual & Kemasan',
    judul: 'Puluhan Kotak Pesanan Siap Ambil',
    desc: 'Dokumentasi kotak pesanan kue pelanggan yang telah dikemas rapi dengan pita satin dan kartu ucapan untuk ulang tahun, hantaran kantor, dan arisan.',
    photo: '/images/patisserie/umkm_orders_packed_1795398162960.jpg',
    alt: 'Dokumentasi kotak kue Cravely berpita satin siap ambil di meja kayu toko',
  },
  {
    id: 4,
    kategori: 'aktivitas',
    tag: 'Favorit Pelanggan',
    judul: 'Pandan Kaya Chiffon Fresh Oven',
    desc: 'Salah satu varian paling laris di kloter pagi dengan perasan daun pandan suji asli dan saus srikaya kelapa gurih yang disukai semua kalangan.',
    photo: '/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg',
    alt: 'Pandan Kaya Chiffon Cake freshly baked Cravely',
  },
  {
    id: 5,
    kategori: 'suasana',
    tag: 'Tampilan Depan Toko',
    judul: 'Fasad Gerai Jl. Melati Manis No. 18',
    desc: 'Tampak luar bagian depan toko Cravely Patisserie di kawasan Citarum, Bandung Wetan dengan kanopi bergaris dan akses parkir yang nyaman.',
    photo: '/images/patisserie/umkm_storefront_bandung_1795398164371.jpg',
    alt: 'Tampak depan toko kue Cravely di Jl. Melati Manis No. 18 Bandung',
  },
];

const MONTHLY_PROMOS = [
  {
    kode: 'CRAVELY20',
    judul: 'Sweet Welcome Diskon 20%',
    detail: 'Potongan langsung 20% untuk Chiffon Cake, Kue Ulang Tahun & Cupcakes pilihan dengan menunjukkan kode di kasir.',
    berlaku: 'Berlaku di gerai Bandung & pemesanan online',
    target: 'katalog' as ViewType,
    cta: 'Pilih Kue di Menu',
  },
  {
    kode: 'BUNDLING ULTAH',
    judul: 'Hemat Rp 25.000 Paket Perayaan',
    detail: 'Setiap pembelian 1 Whole Cake + 1 kotak isi 4 Cupcakes sudah termasuk lilin spiral & kartu ucapan tulis tangan.',
    berlaku: 'Setiap hari · Ambil di toko & kirim Bandung',
    target: 'katalog' as ViewType,
    cta: 'Lihat Paket Menu',
  },
  {
    kode: 'GRATIS ONGKIR',
    judul: 'Antar Gratis Area Bandung Wetan',
    detail: 'Minimal transaksi Rp 200.000 langsung mendapat pengantaran mobil berpendingin khusus kue dalam radius 5 km.',
    berlaku: 'Radius 5 km dari Jl. Melati Manis, Citarum',
    target: 'custom' as ViewType,
    cta: 'Racik Custom Cake',
  },
];

const BESTSELLER_RECAP = [
  { menuId: 403, nama: 'Pandan Kaya Chiffon Cake', terjual: '510+ loyang / bulan', harga: 138000 },
  { menuId: 402, nama: 'Japanese Strawberry Chiffon', terjual: '420+ loyang / bulan', harga: 165000 },
  { menuId: 401, nama: 'Vintage Coquette Birthday Cake', terjual: '340+ loyang / bulan', harga: 245000 },
  { menuId: 202, nama: 'Pink Rose Chocolate Cake', terjual: '265+ loyang / bulan', harga: 195000 },
];

/* ==================== 1. DOKUMENTASI TOKO & PRODUK ==================== */
export const DokumentasiView: React.FC<DokumentasiViewProps> = ({
  onNavigate,
  onGoToMenuWithCake,
}) => {
  const [filter, setFilter] = useState<DocFilter>('semua');
  const [lightboxItem, setLightboxItem] = useState<DocItem | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxItem]);

  const filteredDocs =
    filter === 'semua' ? DOC_ITEMS : DOC_ITEMS.filter((item) => item.kategori === filter);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ivory pt-28 lg:pt-36 pb-16 px-4 sm:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('toko')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-khaki hover:border-burgundy text-xs sm:text-sm font-bold text-ink shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Home</span>
          </button>
          <span className="text-xs font-bold text-cherry tracking-wide">
            Dokumentasi Nyata Cravely
          </span>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="font-script text-3xl sm:text-4xl text-cherry block leading-none">
            Real Store &amp; Bakery Moments
          </span>
          <h1 className="font-coquette text-2xl sm:text-3xl font-bold text-ink mt-1">
            Dokumentasi Toko, Promo &amp; Pesanan Terjual
          </h1>
          <p className="text-xs sm:text-sm text-ink/75 mt-2 leading-relaxed">
            Potret kondisi nyata suasana dalam toko, proses pemolesan kue di dapur, pesanan
            pelanggan yang siap diambil, tampak depan gerai Bandung, serta promo berjalan.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {(
            [
              ['semua', 'Semua Foto (6)'],
              ['suasana', 'Suasana & Depan Toko'],
              ['produk', 'Kue & Aktivitas Dapur'],
              ['aktivitas', 'Promosi & Pesanan Terjual'],
            ] as Array<[DocFilter, string]>
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  active
                    ? 'bg-cherry text-white shadow-sm'
                    : 'bg-[#FFFDF9] border border-dusty/80 text-ink hover:bg-blush/60'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 6 Realistic Documentary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {filteredDocs.map((doc) => (
            <article
              key={doc.id}
              onClick={() => setLightboxItem(doc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLightboxItem(doc);
                }
              }}
              role="button"
              tabIndex={0}
              className="group cursor-pointer bg-[#FFFDF9] rounded-3xl border-2 border-dusty/70 hover:border-cherry overflow-hidden shadow-sm hover:shadow-[0_18px_32px_-12px_rgba(158,59,66,0.22)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-blush/35 overflow-hidden">
                {!imgErrors[doc.id] ? (
                  <img
                    src={doc.photo}
                    alt={doc.alt}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors((prev) => ({ ...prev, [doc.id]: true }))}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-xs font-bold text-burgundy">
                    {doc.judul}
                  </div>
                )}
                <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#FFFDF9]/95 text-cherry text-[11px] font-bold border border-dusty/70">
                  {doc.tag}
                </span>
              </div>
              <div className="p-5 flex-1">
                <h2 className="font-coquette text-sm font-bold text-ink">{doc.judul}</h2>
                <p className="text-xs text-ink/75 mt-1.5 leading-relaxed">{doc.desc}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Promo Bulan Ini */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <p className="text-xs font-bold text-cherry tracking-wide">
                Penawaran Khusus Pelanggan <span aria-hidden="true">·</span> Cravely
              </p>
              <h2 className="font-coquette text-xl sm:text-2xl font-bold text-ink mt-0.5">
                Promo Toko Kue Bulan Ini
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('katalog')}
              className="text-xs font-bold text-burgundy hover:text-cherry underline underline-offset-4 self-start sm:self-auto"
            >
              Lihat Semua Menu →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MONTHLY_PROMOS.map((promo) => (
              <div
                key={promo.kode}
                className="bg-[#FFFDF9] border border-kuningan/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-cherry tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{promo.kode}</span>
                  </span>
                  <h3 className="font-coquette text-base font-bold text-ink leading-snug">
                    {promo.judul}
                  </h3>
                  <p className="text-xs text-ink/78 leading-relaxed">{promo.detail}</p>
                </div>
                <div className="pt-3 border-t border-dashed border-kuningan/50 space-y-2.5">
                  <p className="text-[11px] font-semibold text-ink/60">{promo.berlaku}</p>
                  <button
                    type="button"
                    onClick={() => onNavigate(promo.target)}
                    className="w-full py-2.5 px-4 rounded-xl bg-ivory hover:bg-cherry hover:text-white text-ink border border-kuningan/70 text-xs font-bold transition-colors"
                  >
                    {promo.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rekap Menu Terlaris Bulan Ini */}
        <div className="bg-[#FFFDF9] border border-kuningan/60 rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-kuningan/45">
            <div>
              <h2 className="font-coquette text-base sm:text-lg font-bold text-ink">
                Rekap Kue Paling Banyak Terjual Bulan Ini
              </h2>
              <p className="text-xs text-ink/65 mt-0.5">
                Klik salah satu menu untuk melihat foto detail dan memesan langsung.
              </p>
            </div>
            <span className="text-xs font-bold text-burgundy tabular-nums">
              Total 1.535+ loyang favorit pelanggan
            </span>
          </div>
          <div className="divide-y divide-kuningan/35">
            {BESTSELLER_RECAP.map((item, idx) => (
              <div
                key={item.menuId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-cherry tabular-nums shrink-0">
                    0{idx + 1}.
                  </span>
                  <button
                    type="button"
                    onClick={() => onGoToMenuWithCake(item.menuId)}
                    className="text-left font-bold text-sm text-ink hover:text-cherry transition-colors truncate"
                  >
                    {item.nama}
                  </button>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-7 sm:pl-0 shrink-0">
                  <span className="text-xs font-semibold text-ink/68 tabular-nums">
                    {item.terjual}
                  </span>
                  <span className="font-serif text-base font-bold text-ink tabular-nums">
                    {formatRupiah(item.harga)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onGoToMenuWithCake(item.menuId)}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-cherry hover:text-burgundy underline underline-offset-4 whitespace-nowrap"
                  >
                    <span>Pesan</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Detail Modal */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxItem(null)}
            className="fixed inset-0 z-[85] bg-kayuGelap/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-[#FFFDF9] rounded-3xl border-2 border-dusty overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Tutup detail foto dokumentasi"
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-ivory hover:bg-cherry text-ink hover:text-white border border-dusty flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="aspect-[16/10] bg-blush/30 overflow-hidden">
                <img
                  src={lightboxItem.photo}
                  alt={lightboxItem.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <span className="inline-block text-[11px] font-bold text-cherry uppercase tracking-wider mb-1">
                  {lightboxItem.tag}
                </span>
                <h3 className="font-coquette text-lg font-bold text-ink">{lightboxItem.judul}</h3>
                <p className="text-xs sm:text-sm text-ink/80 mt-1.5 leading-relaxed">
                  {lightboxItem.desc}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

/* ==================== 2. LOKASI TOKO ==================== */
export const LokasiView: React.FC<SharedNavProps> = ({ onNavigate }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ivory pt-28 lg:pt-36 pb-16 px-4 sm:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('toko')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-khaki hover:border-burgundy text-xs sm:text-sm font-bold text-ink shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Home</span>
          </button>
          <span className="text-xs font-bold text-cherry tracking-wide">
            Alamat &amp; Peta Gerai Bandung
          </span>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="font-script text-3xl sm:text-4xl text-cherry block leading-none">
            Visit Our Store
          </span>
          <h1 className="font-coquette text-2xl sm:text-3xl font-bold text-ink mt-1">
            Lokasi Toko Cravely
          </h1>
          <p className="text-xs sm:text-sm text-ink/75 mt-2">
            Kunjungi gerai utama kami di kawasan Citarum, Bandung Wetan untuk memilih kue etalase
            segar langsung atau mengambil pesanan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* Left: Storefront Photo & Practical Location Details */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#FFFDF9] to-[#FAF0E8] border-2 border-dusty/70 rounded-3xl shadow-md overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] bg-blush/40 overflow-hidden">
                {!imgErr ? (
                  <img
                    src="/images/patisserie/umkm_storefront_bandung_1795398164371.jpg"
                    alt="Tampak depan toko Cravely Patisserie Bandung"
                    referrerPolicy="no-referrer"
                    onError={() => setImgErr(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-xs font-bold text-cherry">
                    Fasad Cravely · Jl. Melati Manis No. 18, Bandung
                  </div>
                )}
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-kayuGelap/85 text-ivory text-[11px] font-bold border border-kuningan/70">
                  Tampak Depan Gerai Bandung
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-cherry shrink-0 mt-1" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cherry block">
                      Alamat Lengkap Toko
                    </span>
                    <h2 className="font-coquette text-base font-bold text-ink mt-0.5">
                      Cravely
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/85 mt-1 leading-relaxed">
                      Jl. Melati Manis No. 18, Kel. Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa
                      Barat 40115
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-ivory border border-dusty/60">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-burgundy">
                      <Clock className="w-3 h-3" />
                      <span>Senin – Jumat</span>
                    </span>
                    <span className="text-xs font-bold text-ink mt-1 block tabular-nums">
                      08.00 – 20.00 WIB
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-ivory border border-dusty/60">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-burgundy">
                      <Clock className="w-3 h-3" />
                      <span>Sabtu – Minggu</span>
                    </span>
                    <span className="text-xs font-bold text-ink mt-1 block tabular-nums">
                      08.00 – 21.00 WIB
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blush/35 border border-dusty/60 text-xs text-ink/85 space-y-1.5">
                  <span className="font-bold text-cherry block">
                    Petunjuk Arah &amp; Fasilitas Parkir:
                  </span>
                  <p>• Seberang Taman Melati Heritage, ± 3 menit dari Gedung Sate Bandung.</p>
                  <p>
                    • Ditandai papan kayu <b>Cravely</b> dengan kanopi garis krem-merah muda.
                  </p>
                  <p className="inline-flex items-start gap-1.5 pt-0.5 text-ink/80">
                    <Truck className="w-3.5 h-3.5 text-cherry shrink-0 mt-0.5" />
                    <span>
                      Parkir motor &amp; mobil tersedia di halaman depan + jalur ambil cepat kurir
                      instan.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <a
                href="https://maps.google.com/?q=Citarum+Bandung+Wetan+Kota+Bandung+40115"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-5 rounded-full bg-cherry hover:bg-burgundy text-white font-coquette text-xs font-bold tracking-wider shadow-sm flex items-center justify-center gap-2 transition"
              >
                <span>Buka Petunjuk Arah di Google Maps</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right: Embedded Interactive Google Maps */}
          <div className="lg:col-span-7 bg-[#FFFDF9] border-2 border-dusty/70 rounded-3xl shadow-md overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-6 py-4 bg-[#FFFDF9] border-b border-dusty/50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy block">
                  Peta Lokasi Interaktif
                </span>
                <span className="font-serif text-base font-bold text-ink">
                  Citarum, Kec. Bandung Wetan, Kota Bandung
                </span>
              </div>
              <span className="text-[11px] font-semibold text-ink/70">
                Geser atau zoom peta untuk melihat rute
              </span>
            </div>
            <div className="relative flex-1 min-h-[360px] bg-blush/30">
              <iframe
                title="Peta Lokasi Cravely"
                src="https://maps.google.com/maps?q=Citarum%2C%20Bandung%20Wetan%2C%20Kota%20Bandung&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full min-h-[360px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

/* ==================== 3. PENGADUAN, KRITIK & SARAN ==================== */
export const PengaduanView: React.FC<PengaduanViewProps> = ({ onNavigate, onNotify }) => {
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [kategori, setKategori] = useState<'Saran' | 'Kritik' | 'Pengaduan'>('Saran');
  const [pesan, setPesan] = useState('');
  const [submitted, setSubmitted] = useState<{
    nama: string;
    kategori: string;
    kontak: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !kontak.trim() || !pesan.trim()) return;
    setSubmitted({
      nama: nama.trim(),
      kategori,
      kontak: kontak.trim(),
    });
    onNotify(`Terima kasih, ${kategori.toLowerCase()} Anda sudah kami terima!`);
  };

  const handleReset = () => {
    setNama('');
    setKontak('');
    setKategori('Saran');
    setPesan('');
    setSubmitted(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ivory pt-28 lg:pt-36 pb-16 px-4 sm:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('toko')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-khaki hover:border-burgundy text-xs sm:text-sm font-bold text-ink shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Home</span>
          </button>
          <span className="text-xs font-bold text-cherry tracking-wide">Layanan Pengunjung</span>
        </div>

        <div className="text-center mb-8">
          <span className="font-script text-3xl sm:text-4xl text-cherry block leading-none">
            We Value Your Feedback
          </span>
          <h1 className="font-coquette text-2xl sm:text-3xl font-bold text-ink mt-1">
            Pengaduan, Kritik &amp; Saran
          </h1>
          <p className="text-xs sm:text-sm text-ink/75 mt-2">
            Sampaikan pengaduan, kritik, maupun saran Anda agar Cravely terus menjaga kualitas kue
            dan kenyamanan pelayanan di toko.
          </p>
        </div>

        <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF0E8] border-2 border-dusty/75 rounded-[2rem] shadow-md p-6 sm:p-9">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ks-nama" className="block text-xs font-bold text-ink mb-1.5">
                    Nama Pengunjung <span className="text-cherry">*</span>
                  </label>
                  <input
                    id="ks-nama"
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama Anda"
                    className="w-full px-4 py-3 rounded-2xl bg-ivory/80 border border-dusty/80 text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:border-cherry focus:bg-white transition"
                  />
                </div>
                <div>
                  <label htmlFor="ks-kontak" className="block text-xs font-bold text-ink mb-1.5">
                    Email atau Nomor WhatsApp <span className="text-cherry">*</span>
                  </label>
                  <input
                    id="ks-kontak"
                    type="text"
                    required
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="Contoh: 0812xxxx atau email@domain.com"
                    className="w-full px-4 py-3 rounded-2xl bg-ivory/80 border border-dusty/80 text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:border-cherry focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ks-kategori" className="block text-xs font-bold text-ink mb-1.5">
                  Kategori Pesan <span className="text-cherry">*</span>
                </label>
                <select
                  id="ks-kategori"
                  value={kategori}
                  onChange={(e) =>
                    setKategori(e.target.value as 'Saran' | 'Kritik' | 'Pengaduan')
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-ivory/80 border border-dusty/80 text-sm font-semibold text-ink focus:outline-none focus:border-cherry focus:bg-white transition"
                >
                  <option value="Saran">Saran</option>
                  <option value="Kritik">Kritik</option>
                  <option value="Pengaduan">Pengaduan</option>
                </select>
              </div>

              <div>
                <label htmlFor="ks-pesan" className="block text-xs font-bold text-ink mb-1.5">
                  Pesan atau Deskripsi <span className="text-cherry">*</span>
                </label>
                <textarea
                  id="ks-pesan"
                  rows={4}
                  required
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  placeholder="Tuliskan pesan, keluhan, kritik, atau saran Anda secara lengkap..."
                  className="w-full px-4 py-3 rounded-2xl bg-ivory/80 border border-dusty/80 text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:border-cherry focus:bg-white transition resize-y"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-ink/65">
                  Setiap masukan ditinjau langsung oleh tim pengelola Cravely.
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-cherry hover:bg-burgundy text-white font-coquette text-xs sm:text-sm font-bold tracking-wider shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-blush/45 border border-cherry/35 text-center space-y-3">
              <div className="w-11 h-11 rounded-full bg-cherry text-white mx-auto flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="font-coquette text-lg font-bold text-ink">
                Terima Kasih atas Masukan Anda
              </h2>
              <p className="text-xs sm:text-sm text-ink/85 leading-relaxed max-w-md mx-auto">
                Halo <b>{submitted.nama}</b>, pesan kategori <b>{submitted.kategori}</b> Anda telah
                tercatat. Tim Cravely akan menindaklanjuti melalui <b>{submitted.kontak}</b> apabila
                diperlukan konfirmasi lebih lanjut.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 rounded-full bg-white border border-dusty text-xs font-bold text-ink hover:bg-ivory transition"
                >
                  Kirim Pesan Baru
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

/* ==================== 4. CONTACT PERSON ==================== */
export const ContactView: React.FC<ContactViewProps> = ({ onNavigate, onCopy }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyItem = (key: string, value: string, label: string) => {
    onCopy(value, label);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ivory pt-28 lg:pt-36 pb-16 px-4 sm:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('toko')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-khaki hover:border-burgundy text-xs sm:text-sm font-bold text-ink shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Home</span>
          </button>
          <span className="text-xs font-bold text-cherry tracking-wide">Kontak Resmi Toko</span>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="font-script text-3xl sm:text-4xl text-cherry block leading-none">
            Official Contact
          </span>
          <h1 className="font-coquette text-2xl sm:text-3xl font-bold text-ink mt-1">
            Contact Person Cravely
          </h1>
          <p className="text-xs sm:text-sm text-ink/75 mt-2">
            Hubungi kontak resmi Cravely untuk menanyakan stok etalase harian,
            jadwal pengiriman, maupun konsultasi Custom Cake.
          </p>
        </div>

        <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF0E8] border-2 border-dusty/75 rounded-[2rem] shadow-md p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* WhatsApp */}
            <div className="p-5 rounded-2xl bg-ivory border border-dusty/70 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cherry">
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </span>
                <p className="font-serif text-lg font-bold text-ink mt-1.5 tabular-nums">
                  0812-3456-7890
                </p>
                <p className="text-xs text-ink/70 mt-1">Admin Resmi Kasir (08.00 – 20.00 WIB)</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyItem('wa', '081234567890', 'Nomor WhatsApp')}
                className="inline-flex items-center gap-1.5 text-left text-xs font-bold text-burgundy hover:text-cherry underline underline-offset-4"
              >
                {copiedKey === 'wa' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nomor WA</span>
                  </>
                )}
              </button>
            </div>

            {/* Email */}
            <div className="p-5 rounded-2xl bg-ivory border border-dusty/70 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cherry">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Resmi</span>
                </span>
                <p className="font-serif text-base font-bold text-ink mt-1.5 break-all">
                  halo@cravely.id
                </p>
                <p className="text-xs text-ink/70 mt-1">Kerja sama hampers &amp; acara kantor</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyItem('email', 'halo@cravely.id', 'Alamat Email')}
                className="inline-flex items-center gap-1.5 text-left text-xs font-bold text-burgundy hover:text-cherry underline underline-offset-4"
              >
                {copiedKey === 'email' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Alamat */}
            <div className="p-5 rounded-2xl bg-ivory border border-dusty/70 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cherry">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Alamat Gerai</span>
                </span>
                <p className="font-serif text-base font-bold text-ink mt-1.5 leading-snug">
                  Jl. Melati Manis No. 18
                </p>
                <p className="text-xs text-ink/70 mt-1">Citarum, Bandung Wetan 40115</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('lokasi')}
                className="text-left text-xs font-bold text-burgundy hover:text-cherry underline underline-offset-4"
              >
                Lihat Peta Lokasi →
              </button>
            </div>

            {/* Instagram */}
            <div className="p-5 rounded-2xl bg-ivory border border-dusty/70 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cherry">
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Media Sosial</span>
                </span>
                <p className="font-serif text-lg font-bold text-ink mt-1.5">@cravely.bdg</p>
                <p className="text-xs text-ink/70 mt-1">Info kloter oven &amp; promo terbaru</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyItem('ig', '@cravely.bdg', 'Akun Instagram')}
                className="inline-flex items-center gap-1.5 text-left text-xs font-bold text-burgundy hover:text-cherry underline underline-offset-4"
              >
                {copiedKey === 'ig' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Akun IG</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct WhatsApp CTA Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF9] border border-kuningan/65 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="font-coquette text-base sm:text-lg font-bold text-ink">
                Butuh Balasan Cepat untuk Pesanan Hari Ini?
              </h2>
              <p className="text-xs sm:text-sm text-ink/75 mt-1">
                Tim kasir Cravely siap membantu cek ketersediaan etalase atau menjadwalkan kurir
                berpendingin Bandung Raya.
              </p>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Cravely%20Patisserie%20Bandung%2C%20saya%20ingin%20bertanya%20tentang%20kue%20yang%20tersedia%20hari%20ini."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cherry hover:bg-burgundy text-white font-coquette text-xs sm:text-sm font-bold tracking-wider shadow-md transition whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp Sekarang</span>
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
