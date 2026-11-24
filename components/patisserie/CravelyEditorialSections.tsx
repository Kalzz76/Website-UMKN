"use client";
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import {
  ArrowUpRight,
  Award,
  Calendar,
  Check,
  Flame,
  Heart,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react';
import { formatRupiah, type ViewType } from './patisserieData';

export interface PopularCakeItem {
  id: number;
  nama: string;
  desc: string;
  harga: number;
  photo?: string | null;
}

interface CravelyEditorialSectionsProps {
  onNavigate: (view: ViewType) => void;
  onGoToMenuWithCake?: (menuId: number) => void;
  onNotify?: (msg: string) => void;
  popularCakes?: PopularCakeItem[];
}

const PHOTOS = {
  counter: '/images/patisserie/umkm_bakery_counter_1795398163126.jpg',
  ordersPacked: '/images/patisserie/umkm_orders_packed_1795398162960.jpg',
  kitchenDecorating: '/images/patisserie/umkm_kitchen_decorating_1795398163081.jpg',
  storefront: '/images/patisserie/umkm_storefront_bandung_1795398164371.jpg',
  ultahCoquette: '/images/patisserie/etalase_ultah_coquette_1795156809819.jpg',
  chiffonStrawberry: '/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg',
  chiffonPandan: '/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg',
  chiffonEarlGrey: '/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg',
  roseGarden: '/images/patisserie/cake_rose_garden_1795148927858.jpg',
  pinkChoc: '/images/patisserie/cake_pink_rose_chocolate_1795148928845.jpg',
};

const TRAIL_IMAGES = [
  PHOTOS.ultahCoquette,
  PHOTOS.chiffonStrawberry,
  PHOTOS.ordersPacked,
  PHOTOS.kitchenDecorating,
  PHOTOS.chiffonPandan,
  PHOTOS.storefront,
  PHOTOS.chiffonEarlGrey,
];

interface TrailItem {
  id: number;
  x: number;
  y: number;
  rotate: number;
  src: string;
}

const STATS_DATA = [
  { target: 12, suffix: '+', label: 'Varian Kue & Chiffon' },
  { target: 3, suffix: '', label: 'Kloter Oven Tiap Hari' },
  { target: 12, suffix: 'K+', label: 'Loyang Terjual' },
  { target: 2018, suffix: '', label: 'Berdiri di Bandung' },
];


const PROCESS_STEPS = [
  {
    step: '01',
    judul: 'Pilih Bahan',
    desc: 'Mentega murni, telur segar, daun pandan suji asli, dan stroberi Lembang pilihan.',
    photo: PHOTOS.chiffonStrawberry,
  },
  {
    step: '02',
    judul: 'Panggang',
    desc: 'Dipanggang perlahan dalam 3 kloter oven harian agar tekstur sponge tetap lembut dan hangat.',
    photo: PHOTOS.chiffonPandan,
  },
  {
    step: '03',
    judul: 'Hias & Poles',
    desc: 'Pemolesan buttercream mulus dan sentuhan pita coquette manual oleh patissier kami.',
    photo: PHOTOS.kitchenDecorating,
  },
  {
    step: '04',
    judul: 'Sajikan',
    desc: 'Dikemas rapi dalam kotak pita klasik atau disajikan segar langsung di etalase Bandung.',
    photo: PHOTOS.ordersPacked,
  },
];

const TESTIMONIALS = [
  {
    inisial: 'NS',
    nama: 'Nadia Salsabila',
    konteks: 'Dago · Kue Ulang Tahun',
    ulasan:
      'Kue ulang tahunnya lembut banget dan manisnya pas, tidak bikin enek! Dekorasi pitanya persis seperti yang aku bayangkan untuk acara kemarin.',
  },
  {
    inisial: 'RP',
    nama: 'Raka Pratama',
    konteks: 'Citarum · Chiffon Pagi',
    ulasan:
      'Pandan Kaya Chiffon-nya selalu jadi rebutan di rumah. Wangi daun suji aslinya kerasa dan masih hangat setiap mampir pagi ke Jl. Melati Manis.',
  },
  {
    inisial: 'AM',
    nama: 'Alya Maharani',
    konteks: 'Riau · Hampers Kantor',
    ulasan:
      'Pesan 15 kotak buat hantaran kantor, semua datang tepat waktu dengan mobil berpendingin. Kemasan kotak pitanya super rapi dan elegan.',
  },
  {
    inisial: 'DW',
    nama: 'Dimas Wijaya',
    konteks: 'Cihampelas · Custom Cake',
    ulasan:
      'Bantu banget bisa preview Custom Cake 3D sebelum pesan. Teteh kasirnya juga ramah menjelaskan pilihan rasa dan ukuran loyang yang cocok.',
  },
  {
    inisial: 'KP',
    nama: 'Keisha Putri',
    konteks: 'Setiabudi · Earl Grey Chiffon',
    ulasan:
      'Suka sekali sama Earl Grey Milk Tea Chiffon-nya! Aroma tehnya halus dan tempat tokonya nyaman banget buat mampir sore bareng teman.',
  },
  {
    inisial: 'FH',
    nama: 'Fajar Hidayat',
    konteks: 'Buah Batu · Perayaan Keluarga',
    ulasan:
      'Sudah langganan sejak 2021 untuk setiap ulang tahun keluarga. Kualitas krim dan teksturnya selalu konsisten dari dulu sampai sekarang.',
  },
];

const VISIT_GALLERY = [
  {
    id: 'storefront',
    photo: PHOTOS.storefront,
    judul: 'Fasad Gerai Jl. Melati Manis No. 18',
    desc: 'Tampak depan toko kue Cravely di kawasan Citarum Bandung yang teduh dan mudah dijangkau.',
  },
  {
    id: 'counter',
    photo: PHOTOS.counter,
    judul: 'Etalase Kaca & Counter Kasir',
    desc: 'Kue ulang tahun dan chiffon fresh bake ditata rapi setiap pagi untuk pilihan langsung.',
  },
  {
    id: 'kitchen',
    photo: PHOTOS.kitchenDecorating,
    judul: 'Dapur Pemolesan Krim Manual',
    desc: 'Setiap loyang dipoles hati-hati menggunakan mentega murni sebelum diberi sentuhan pita.',
  },
  {
    id: 'orders',
    photo: PHOTOS.ordersPacked,
    judul: 'Kotak Pita Pesanan Siap Ambil',
    desc: 'Kemasan kotak krem berpita satin siap menemani momen ulang tahun dan hantaran spesial.',
  },
  {
    id: 'coquette',
    photo: PHOTOS.ultahCoquette,
    judul: 'Signature Coquette Birthday Cake',
    desc: 'Perpaduan sponge vanila lembut, krim mawar ringan, dan stroberi segar Lembang.',
  },
];

/* Animated Count-Up Number */
const AnimatedMetric: React.FC<{ target: number; suffix: string; label: string }> = ({
  target,
  suffix,
  label,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(target === 2018 ? 2000 : 0);

  useEffect(() => {
    if (!isInView) return;
    const startVal = target === 2018 ? 2000 : 0;
    const duration = 1100;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center py-4 px-2">
      <p className="font-serif text-3xl sm:text-4xl font-bold text-ink tabular-nums tracking-tight">
        {display}
        <span className="text-cherry">{suffix}</span>
      </p>
      <p className="text-[11px] sm:text-xs font-semibold text-ink/65 mt-1">{label}</p>
    </div>
  );
};

export const CravelyEditorialSections: React.FC<CravelyEditorialSectionsProps> = ({
  onNavigate,
  onGoToMenuWithCake,
  onNotify,
  popularCakes = [],
}) => {
  // 1. Hero Cursor Photo Trail state (inspired by Arkopi video 0:02-0:04)
  const heroRef = useRef<HTMLElement | null>(null);
  const lastTrailPosRef = useRef<{ x: number; y: number; time: number }>({
    x: -999,
    y: -999,
    time: 0,
  });
  const trailIndexRef = useRef(0);
  const trailIdRef = useRef(0);
  const [trailItems, setTrailItems] = useState<TrailItem[]>([]);

  // 2. Kunjungi Kami Spotlight state (inspired by Arkopi video 0:22-0:25)
  const [spotlightPhoto, setSpotlightPhoto] = useState<(typeof VISIT_GALLERY)[number] | null>(null);

  // 3. Reservasi form state (inspired by Arkopi video 0:28-0:31)
  const [resNama, setResNama] = useState('');
  const [resWa, setResWa] = useState('');
  const [resJumlah, setResJumlah] = useState('');
  const [resTanggal, setResTanggal] = useState('');
  const [resSubmitted, setResSubmitted] = useState(false);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const dx = x - lastTrailPosRef.current.x;
    const dy = y - lastTrailPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 78 || now - lastTrailPosRef.current.time < 95) return;

    lastTrailPosRef.current = { x, y, time: now };
    const id = ++trailIdRef.current;
    const src = TRAIL_IMAGES[trailIndexRef.current % TRAIL_IMAGES.length];
    trailIndexRef.current += 1;
    const rotate = (trailIndexRef.current % 2 === 0 ? 1 : -1) * (4 + (trailIndexRef.current % 5));

    setTrailItems((prev) => [...prev.slice(-6), { id, x, y, rotate, src }]);
    window.setTimeout(() => {
      setTrailItems((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resNama.trim() || !resWa.trim()) return;
    setResSubmitted(true);
    onNotify?.(`Reservasi atas nama ${resNama.trim()} berhasil dicatat!`);
  };

  const scrollToStory = () => {
    const el = document.getElementById('about-us');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative bg-ivory text-ink overflow-x-clip">
      {/* ==================== 1. EDITORIAL HERO BANNER WITH CURSOR PHOTO TRAIL ==================== */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        aria-label="Cerita Istimewa Cravely Patisserie"
        className="relative min-h-[78vh] sm:min-h-[84vh] w-full flex items-center justify-center overflow-hidden border-t-2 border-kuningan/65 bg-kayuGelap"
      >
        {/* Atmospheric Bakery Background Photo */}
        <img
          src={PHOTOS.counter}
          alt="Suasana hangat ruang toko Cravely Patisserie Bandung"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.03] opacity-52"
        />
        {/* Warm Coquette Cocoa Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(44,24,19,0.72) 0%, rgba(58,34,28,0.58) 48%, rgba(44,24,19,0.82) 100%)',
          }}
        />

        {/* Floating Cursor Photo Trail Layer (Desktop Magic) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <AnimatePresence>
            {trailItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.72, rotate: item.rotate * 1.4 }}
                animate={{ opacity: 0.96, scale: 1, rotate: item.rotate }}
                exit={{ opacity: 0, scale: 0.84, y: -14 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="absolute w-32 sm:w-40 aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#FFFDF9]/85 shadow-[0_18px_36px_rgba(24,12,10,0.5)] bg-ivory"
                style={{
                  left: item.x - 76,
                  top: item.y - 56,
                }}
              >
                <img
                  src={item.src}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Centered Editorial Copy */}
        <div className="relative z-20 max-w-3xl mx-auto px-5 sm:px-8 text-center text-ivory space-y-5">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-script text-3xl sm:text-4xl text-blush block leading-none"
          >
            Cravely
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-[#FFFDF9] drop-shadow-[0_4px_18px_rgba(32,16,12,0.45)]"
            style={{ textWrap: 'balance' }}
          >
            Setiap Potongan Merajut Cerita Istimewa
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-xs sm:text-sm md:text-base text-ivory/86 max-w-xl mx-auto leading-relaxed"
          >
            Dari dapur rumahan di jantung Bandung, kami memanggang chiffon lembut, kue ulang tahun
            berpita, dan patisserie segar dengan 100% mentega murni sejak 2018.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => onNavigate('katalog')}
              className="px-6 py-2.5 rounded-full bg-blush hover:bg-white text-kayuGelap font-bold text-xs sm:text-sm shadow-lg transition-colors"
            >
              Lihat Menu
            </button>
            <button
              type="button"
              onClick={scrollToStory}
              className="px-6 py-2.5 rounded-full bg-kayuGelap/55 hover:bg-kayuGelap/80 text-ivory border border-ivory/45 font-bold text-xs sm:text-sm backdrop-blur-sm transition-colors"
            >
              Cerita Kami
            </button>
          </motion.div>
        </div>
      </section>

      {/* ==================== 2. ANIMATED COUNTING STATS STRIP ==================== */}
      <section aria-label="Pencapaian Cravely Bandung" className="bg-[#FAF2E8] border-b border-dusty/45">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-dusty/40">
            {STATS_DATA.map((st) => (
              <AnimatedMetric
                key={st.label}
                target={st.target}
                suffix={st.suffix}
                label={st.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 3. SELAMAT DATANG DI CERITA KAMI (ABOUT US + 3-PHOTO STAGGERED COLLAGE) ==================== */}
      <section
        id="about-us"
        aria-label="Cerita Kami Cravely Patisserie"
        className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FFFDF9]"
      >
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-burgundy">
            Kisah Dapur Cravely
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-ink mt-2">
            Selamat Datang di <span className="italic text-cherry">Cerita Kami</span>
          </h2>

          {/* Overlapping 3-Photo Editorial Collage (Arkopi video 0:07-0:08) */}
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            <motion.button
              type="button"
              onClick={() => onNavigate('dokumentasi')}
              initial={{ opacity: 0, x: -24, rotate: -4 }}
              whileInView={{ opacity: 1, x: 0, rotate: -3 }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 30 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55 }}
              className="relative z-10 w-64 sm:w-56 md:w-64 aspect-[4/3] rounded-2xl overflow-hidden border-4 border-[#FFFDF9] shadow-xl sm:-mr-6 bg-blush/30"
            >
              <img
                src={PHOTOS.storefront}
                alt="Tampak depan toko kue Cravely di Bandung"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onNavigate('dokumentasi')}
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.04, zIndex: 30 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative z-20 w-72 sm:w-64 md:w-76 aspect-[4/3] rounded-2xl overflow-hidden border-4 border-[#FFFDF9] shadow-2xl sm:-translate-y-3 bg-blush/30"
            >
              <img
                src={PHOTOS.counter}
                alt="Suasana ruang dalam dan etalase kaca Cravely Bandung"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onNavigate('dokumentasi')}
              initial={{ opacity: 0, x: 24, rotate: 4 }}
              whileInView={{ opacity: 1, x: 0, rotate: 3 }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 30 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.14 }}
              className="relative z-10 w-64 sm:w-56 md:w-64 aspect-[4/3] rounded-2xl overflow-hidden border-4 border-[#FFFDF9] shadow-xl sm:-ml-6 bg-blush/30"
            >
              <img
                src={PHOTOS.kitchenDecorating}
                alt="Proses pemolesan kue ulang tahun di dapur Cravely"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </motion.button>
          </div>

          {/* Editorial Lead Copy */}
          <div className="mt-10 sm:mt-12 max-w-2xl mx-auto space-y-4">
            <p className="font-serif text-xl sm:text-2xl text-ink leading-snug font-semibold">
              Lahir dari kecintaan pada patisserie rumahan, Cravely bermula dari oven kecil di
              Bandung pada tahun 2018. Kami percaya setiap loyang kue membawa kehangatan,
              kelembutan bahan alami, dan kenangan manis di setiap perayaan.
            </p>
            <p className="text-xs sm:text-sm text-ink/72 leading-relaxed">
              Hari ini kami terus menjaga resep klasik tersebut di Jl. Melati Manis No. 18,
              memadukan teknik pemanggangan lembut dengan estetika pita coquette untuk menciptakan
              pengalaman patisserie yang tulus dan berkesan.
            </p>
          </div>

          {/* 3 Refined Pillar Cards (Arkopi video 0:09-0:10) */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-center">
            {[
              {
                icon: Award,
                judul: '100% Mentega Murni',
                desc: 'Menggunakan mentega pilihan, telur omega, daun pandan suji asli, dan buah stroberi Lembang tanpa pengawet.',
              },
              {
                icon: Flame,
                judul: 'Dipanggang Tiap Pagi',
                desc: 'Tiga kloter oven harian memastikan setiap chiffon dan kue ulang tahun selalu lembut saat sampai ke tangan Anda.',
              },
              {
                icon: Heart,
                judul: 'Pelayanan Hangat',
                desc: 'Menerima pembelian langsung di etalase gerai Bandung maupun konsultasi desain Custom Cake 3D sesuai impian.',
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.judul}
                  className="rounded-2xl bg-[#FAF3EB] border border-dusty/45 p-6 hover:border-cherry/60 hover:-translate-y-1 transition-all duration-300 shadow-xs"
                >
                  <div className="w-9 h-9 rounded-full bg-blush/80 text-cherry mx-auto flex items-center justify-center mb-3">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink">{item.judul}</h3>
                  <p className="text-xs text-ink/72 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 4. MENU POPULER (4-CARD EDITORIAL SHOWCASE) ==================== */}
      {popularCakes && popularCakes.length > 0 && (
        <section
          aria-label="Menu Populer Cravely"
          className="py-16 sm:py-22 px-4 sm:px-8 bg-[#F4E6DA] border-t border-dusty/45"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Menu Populer</h2>
              <p className="text-xs sm:text-sm text-ink/72 mt-2">
                Kue ulang tahun dan chiffon pilihan favorit pelanggan Bandung yang selalu hadir hangat
                di etalase kaca kami.
              </p>
            </div>

            <div
              className={`grid ${
                popularCakes.length === 1
                  ? "grid-cols-1 max-w-sm mx-auto"
                  : popularCakes.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : popularCakes.length === 3
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              } gap-5`}
            >
              {popularCakes.map((cake) => (
                <motion.button
                  key={cake.id}
                  type="button"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.28 }}
                  onClick={() =>
                    onGoToMenuWithCake ? onGoToMenuWithCake(cake.id) : onNavigate('katalog')
                  }
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-kayuGelap text-left shadow-lg border border-kuningan/45 cursor-pointer"
                >
                  {cake.photo ? (
                    <img
                      src={cake.photo}
                      alt={cake.nama}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#281612] text-[#8C6D62]">
                      <span className="font-serif text-sm">Cravely</span>
                    </div>
                  )}
                  {/* Gradasi gelap tipis di bagian bawah kartu agar teks terbaca jelas */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140806]/95 via-[#140806]/60 via-40% to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-ivory flex flex-col gap-1.5 z-10">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg font-bold leading-snug text-[#FFFDF9]">
                        {cake.nama}
                      </h3>
                      <span
                        className="text-xs font-extrabold text-blush tabular-nums shrink-0"
                        style={{ fontVariantNumeric: "lining-nums" }}
                      >
                        {formatRupiah(cake.harga)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-ivory/80 leading-relaxed line-clamp-2">
                      {cake.desc}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-9 text-center">
              <button
                type="button"
                onClick={() => onNavigate('katalog')}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-transparent hover:bg-cherry text-ink hover:text-white border border-kayu/50 hover:border-cherry text-xs font-bold tracking-wide transition-colors cursor-pointer"
              >
                <span>Lihat Menu Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==================== 5. PROSES KAMI (DARK WALNUT 4-STEP CONNECTED JOURNEY) ==================== */}
      <section
        aria-label="Proses Pembuatan Kue Cravely"
        className="py-18 sm:py-24 px-4 sm:px-8 bg-kayuGelap text-ivory border-y-2 border-kuningan/55"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-coquette text-2xl sm:text-3xl font-bold tracking-widest text-[#FFFDF9] uppercase">
              Proses Kami
            </h2>
            <p className="text-xs sm:text-sm text-blush/85 mt-2">
              Dari bahan segar pilihan hingga potongan kue istimewa di meja perayaan Anda.
            </p>
          </div>

          <div className="relative">
            {/* Horizontal Connecting Brass Line (Desktop) */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-14 left-[12%] right-[12%] h-[1.5px] bg-gradient-to-r from-kuningan/25 via-kuningan/80 to-kuningan/25"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6 relative z-10">
              {PROCESS_STEPS.map((step, idx) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="text-center flex flex-col items-center group"
                >
                  <div className="relative w-28 h-28 rounded-full p-1.5 bg-kayuGelap border-2 border-kuningan/75 group-hover:border-blush shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-colors">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img
                        src={step.photo}
                        alt={step.judul}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-cherry text-[#FFFDF9] border border-kuningan text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#FFFDF9] mt-4">
                    {step.judul}
                  </h3>
                  <p className="text-xs text-ivory/72 mt-1.5 leading-relaxed max-w-[210px]">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. DIPERCAYA OLEH PECINTA KUE (INFINITE MARQUEE TESTIMONIALS) ==================== */}
      <section aria-label="Testimoni Pelanggan Cravely" className="py-16 sm:py-22 bg-[#FFFDF9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center mb-10">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
            Dipercaya oleh pecinta kue Bandung
          </h2>
          <p className="text-xs sm:text-sm text-ink/70 mt-2 max-w-lg mx-auto">
            Pengalaman nyata pelanggan setia yang mempercayakan momen manis ulang tahun, hantaran,
            dan kumpul keluarga bersama Cravely.
          </p>
        </div>

        {/* Marquee Strip */}
        <div className="relative overflow-hidden cravely-marquee-group py-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 z-10 bg-gradient-to-r from-[#FFFDF9] to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 z-10 bg-gradient-to-l from-[#FFFDF9] to-transparent"
          />

          <div className="flex w-max gap-5 animate-cravely-marquee px-3">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
              <article
                key={`${t.nama}-${idx}`}
                className="w-[290px] sm:w-[330px] shrink-0 rounded-2xl bg-[#FAF3EB] border border-dusty/45 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blush border border-cherry/35 text-cherry font-coquette text-xs font-bold flex items-center justify-center shrink-0">
                    {t.inisial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{t.nama}</p>
                    <p className="text-[11px] font-semibold text-burgundy truncate">{t.konteks}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-[13px] text-ink/80 leading-relaxed">
                  &ldquo;{t.ulasan}&rdquo;
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 7. KUNJUNGI KAMI (MOSAIC + INTERACTIVE CINEMATIC SPOTLIGHT) ==================== */}
      <section
        aria-label="Galeri Kunjungi Kami Cravely"
        className="py-16 sm:py-22 px-4 sm:px-8 bg-[#FAF2E8] border-t border-dusty/40"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Kunjungi Kami</h2>
            <p className="text-xs sm:text-sm text-ink/70 mt-1.5">
              Mampir dan rasakan kehangatan etalase kue Cravely di Bandung. Klik foto untuk melihat
              tampilan besar.
            </p>
          </div>

          {/* Asymmetric Editorial Mosaic (matches Arkopi video 0:21-0:23) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <button
              type="button"
              onClick={() => setSpotlightPhoto(VISIT_GALLERY[0])}
              className="group md:col-span-5 relative aspect-[4/3] md:aspect-auto md:min-h-[340px] rounded-2xl overflow-hidden shadow-md border border-dusty/50 text-left"
            >
              <img
                src={VISIT_GALLERY[0].photo}
                alt={VISIT_GALLERY[0].judul}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kayuGelap/75 via-transparent to-transparent" />
              <div className="absolute bottom-3.5 left-4 right-4 text-ivory">
                <p className="text-xs font-bold">{VISIT_GALLERY[0].judul}</p>
              </div>
            </button>

            <div className="md:col-span-7 grid grid-cols-2 gap-4">
              {VISIT_GALLERY.slice(1).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSpotlightPhoto(item)}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-dusty/50 text-left"
                >
                  <img
                    src={item.photo}
                    alt={item.judul}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-106"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-kayuGelap/72 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-ivory">
                    <p className="text-[11px] sm:text-xs font-bold leading-snug">{item.judul}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cinematic Spotlight Lightbox Modal */}
        <AnimatePresence>
          {spotlightPhoto && (
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSpotlightPhoto(null)}
              className="fixed inset-0 z-[85] bg-kayuGelap/84 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full bg-[#FFFDF9] rounded-3xl overflow-hidden border-2 border-kuningan/70 shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setSpotlightPhoto(null)}
                  aria-label="Tutup tampilan foto"
                  className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-ivory/95 hover:bg-cherry text-ink hover:text-white border border-dusty flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="aspect-[16/9] bg-kayuGelap overflow-hidden">
                  <img
                    src={spotlightPhoto.photo}
                    alt={spotlightPhoto.judul}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-coquette text-base sm:text-lg font-bold text-ink">
                      {spotlightPhoto.judul}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink/75 mt-1">{spotlightPhoto.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {VISIT_GALLERY.map((thumb) => (
                      <button
                        key={thumb.id}
                        type="button"
                        onClick={() => setSpotlightPhoto(thumb)}
                        className={`w-11 h-8 rounded-lg overflow-hidden border-2 transition ${
                          spotlightPhoto.id === thumb.id
                            ? 'border-cherry scale-105'
                            : 'border-dusty/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={thumb.photo}
                          alt={thumb.judul}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ==================== 8. LOKASI KAMI SPLIT CARD WITH OVERSIZED CRAVELY WATERMARK ==================== */}
      <section aria-label="Lokasi Toko Cravely" className="py-12 sm:py-16 px-4 sm:px-8 bg-[#FAF2E8]">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-[#FFFDF9] border border-dusty/55 shadow-[0_18px_42px_-16px_rgba(90,59,51,0.14)] p-7 sm:p-11">
            {/* Giant Subtle Watermark (Arkopi video 0:26-0:27) */}
            <span
              aria-hidden="true"
              className="pointer-events-none select-none font-coquette font-bold text-6xl sm:text-8xl tracking-widest text-dusty/16 absolute -bottom-3 right-6 leading-none"
            >
              CRAVELY
            </span>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blush/70 text-cherry">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Lokasi Kami</h2>
                <p className="text-sm text-ink/78 leading-relaxed max-w-md">
                  Jl. Melati Manis No. 18, Kel. Citarum, Kec. Bandung Wetan, Kota Bandung 40115 · ±
                  3 menit dari Gedung Sate.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('lokasi')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-kayuGelap hover:bg-cherry text-ivory text-xs font-bold shadow-sm transition-colors"
                  >
                    <span>Petunjuk Arah</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-ivory hover:bg-blush/60 text-ink border border-dusty/70 text-xs font-bold transition-colors"
                  >
                    <span>Hubungi Kasir</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 md:border-l md:border-dusty/45 md:pl-8 space-y-3">
                <h3 className="font-serif text-xl font-bold text-ink">Jam Operasional</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-dusty/45 pb-2">
                    <span className="text-ink/70 font-semibold">Senin – Jumat</span>
                    <span className="font-bold text-ink tabular-nums">08.00 – 20.00 WIB</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pb-1">
                    <span className="text-ink/70 font-semibold">Sabtu – Minggu</span>
                    <span className="font-bold text-ink tabular-nums">08.00 – 21.00 WIB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 9. RESERVASI & PESAN CEPAT (LUXURY BOUTIQUE CARD) ==================== */}
      <section
        aria-label="Reservasi dan Pemesanan Cepat Cravely"
        className="py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-b from-[#2A1814] via-[#3D2520] to-[#241310] text-ivory border-t-2 border-[#C59B62]/60 relative overflow-hidden"
      >
        {/* Subtle Warm Background Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 30%, #E8A5AC 0%, transparent 65%), radial-gradient(ellipse at 50% 100%, #C59B62 0%, transparent 70%)',
          }}
        />

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-[#FFFDF9]/10 border border-[#C59B62]/50 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E5C590] mb-3 backdrop-blur-xs">
              <span>Cravely</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FFFDF9] tracking-tight">
              Reservasi &amp; Pesan Cepat
            </h2>
            <p className="text-xs sm:text-sm text-[#F6DED5] mt-2.5 leading-relaxed">
              Amankan meja dine-in hangat, titip kloter chiffon pagi sebelum kehabisan, atau jadwalkan konsultasi Custom Cake untuk momen istimewa Anda.
            </p>
          </div>

          {!resSubmitted ? (
            <div className="rounded-3xl bg-[#FFFDF9] border-2 border-[#C59B62]/70 shadow-[0_24px_55px_rgba(20,8,6,0.45)] p-6 sm:p-10 text-[#3D2B28]">
              <form onSubmit={handleReservationSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nama Lengkap */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#6B473C] uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#9E3B42]" />
                        <span>Nama Lengkap *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={resNama}
                        onChange={(e) => setResNama(e.target.value)}
                        placeholder="Contoh: Aurelia Putri"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D9B37C]/60 text-sm text-[#3D2B28] placeholder:text-[#A89088] focus:outline-none focus:border-[#9E3B42] focus:ring-2 focus:ring-[#E8A5AC]/40 shadow-xs transition"
                      />
                    </div>

                    {/* Nomor WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#6B473C] uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#9E3B42]" />
                        <span>Nomor WhatsApp *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={resWa}
                        onChange={(e) => setResWa(e.target.value)}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D9B37C]/60 text-sm text-[#3D2B28] placeholder:text-[#A89088] focus:outline-none focus:border-[#9E3B42] focus:ring-2 focus:ring-[#E8A5AC]/40 shadow-xs transition"
                      />
                    </div>

                    {/* Keperluan */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#6B473C] uppercase tracking-wider flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#9E3B42]" />
                        <span>Keperluan Acara</span>
                      </label>
                      <input
                        type="text"
                        value={resJumlah}
                        onChange={(e) => setResJumlah(e.target.value)}
                        placeholder="Misal: Dine-in 2 Orang / Titip 1 Chiffon"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D9B37C]/60 text-sm text-[#3D2B28] placeholder:text-[#A89088] focus:outline-none focus:border-[#9E3B42] focus:ring-2 focus:ring-[#E8A5AC]/40 shadow-xs transition"
                      />
                    </div>

                    {/* Tanggal */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#6B473C] uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#9E3B42]" />
                        <span>Tanggal Kunjungan / Ambil</span>
                      </label>
                      <input
                        type="date"
                        value={resTanggal}
                        onChange={(e) => setResTanggal(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D9B37C]/60 text-sm text-[#3D2B28] focus:outline-none focus:border-[#9E3B42] focus:ring-2 focus:ring-[#E8A5AC]/40 shadow-xs transition"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#9E3B42] via-[#B23A48] to-[#9E3B42] hover:brightness-105 active:scale-[0.99] text-white font-serif font-bold text-sm tracking-wider shadow-[0_8px_22px_rgba(158,59,66,0.38)] border border-[#E8A5AC]/40 flex items-center justify-center transition cursor-pointer"
                    >
                      <span>Kirim Reservasi Sekarang</span>
                    </button>
                    <p className="text-center text-[11px] text-[#8C6D62] mt-2.5">
                      * Tim kami akan segera mengonfirmasi ketersediaan meja &amp; jadwal melalui WhatsApp resmi Cravely.
                    </p>
                  </div>
                </form>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#FFFDF9] border-2 border-[#C59B62]/80 shadow-[0_24px_55px_rgba(20,8,6,0.45)] p-8 sm:p-10 text-center text-[#3D2B28] space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EAF2E1] border-2 border-[#7D9F67] text-[#42662C] mx-auto flex items-center justify-center shadow-sm">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2B28]">
                Reservasi Berhasil Dicatat!
              </h3>
              <p className="text-xs sm:text-sm text-[#6B473C] max-w-md mx-auto leading-relaxed">
                Terima kasih, <b>{resNama}</b>. Rincian pesanan telah kami simpan. Barista &amp; patissier Cravely akan segera menghubungi WhatsApp <b>{resWa}</b> untuk konfirmasi akhir.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResNama('');
                    setResWa('');
                    setResJumlah('');
                    setResTanggal('');
                    setResSubmitted(false);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#F5ECE2] hover:bg-[#EBDDD0] text-[#5A3B33] text-xs font-bold border border-[#D9B37C]/60 transition"
                >
                  Buat Reservasi Lain
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
