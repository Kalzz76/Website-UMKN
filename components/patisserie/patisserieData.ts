export type ViewType =
  | 'toko'
  | 'etalase'
  | 'katalog'
  | 'custom'
  | 'kasir'
  | 'dokumentasi'
  | 'lokasi'
  | 'pengaduan'
  | 'contact';

export type DessertCategory = 'semua' | 'chiffon' | 'cupcake' | 'cake' | 'treats';

export type DessertIllustType =
  | 'cupcake-straw'
  | 'cupcake-apple'
  | 'cupcake-mint'
  | 'cupcake-peach'
  | 'cake-raspberry'
  | 'cake-pinkchoc'
  | 'cake-rosegarden'
  | 'donuts'
  | 'bananasplit'
  | 'sundae';

export type IngredientKey =
  | 'sponge_vanila'
  | 'cokelat_belgia'
  | 'red_velvet'
  | 'krim_mawar'
  | 'cream_cheese'
  | 'stroberi'
  | 'raspberry'
  | 'kayu_manis'
  | 'persik'
  | 'es_krim';

export interface IngredientMeta {
  key: IngredientKey;
  label: string;
}

export interface DessertItem {
  id: number;
  baris: 1 | 2 | 3;
  kategori: Exclude<DessertCategory, 'semua'>;
  nama: string;
  desc: string;
  harga: number;
  tipe: DessertIllustType;
  photo: string;
  ingredients: IngredientKey[];
  formula: string;
  servingNote: string;
}

export interface EtalaseCakeItem {
  id: string;
  menuId: number;
  nama: string;
  jenis: 'Kue Ulang Tahun' | 'Chiffon Cake';
  ukuran: string;
  harga: number;
  photo: string;
  fallbackTipe: DessertIllustType;
  desc: string;
  catatanRasa: string;
  tagLabel?: string;
}

export interface CartItem {
  id: string;
  nama: string;
  harga: number;
  qty: number;
  tipe: DessertIllustType;
  catatan?: string;
}

export type CafeZone =
  | null
  | 'plakat'
  | 'hampers'
  | 'menu_papan'
  | 'saklar'
  | 'kasir'
  | 'etalase'
  | 'custom';

export interface CustomCakeOrderPayload {
  nama: string;
  harga: number;
  pemesan: string;
  tanggal: string;
  catatan?: string;
}

export const INGREDIENTS_MATRIX: IngredientMeta[] = [
  { key: 'sponge_vanila', label: 'Sponge Vanila' },
  { key: 'cokelat_belgia', label: 'Cokelat Belgia' },
  { key: 'red_velvet', label: 'Red Velvet' },
  { key: 'krim_mawar', label: 'Krim Mawar' },
  { key: 'cream_cheese', label: 'Cream Cheese' },
  { key: 'stroberi', label: 'Stroberi Segar' },
  { key: 'raspberry', label: 'Raspberry' },
  { key: 'kayu_manis', label: 'Kayu Manis' },
  { key: 'persik', label: 'Glaze Persik' },
  { key: 'es_krim', label: 'Es Krim Artisan' },
];

const PHOTOS = {
  raspberry: '/images/patisserie/cake_raspberry_lemonade_1795148927822.jpg',
  pinkchoc: '/images/patisserie/cake_pink_rose_chocolate_1795148928845.jpg',
  rosegarden: '/images/patisserie/cake_rose_garden_1795148927858.jpg',
  berryPeachCupcake: '/images/patisserie/cupcake_berry_peach_1795148928217.jpg',
  cinnamonMintCupcake: '/images/patisserie/cupcake_cinnamon_mint_1795148928615.jpg',
  donutsSundae: '/images/patisserie/treats_donuts_sundae_1795148927789.jpg',
  chiffonPandan: '/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg',
  chiffonStrawberry: '/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg',
  ultahCoquette: '/images/patisserie/etalase_ultah_coquette_1795156809819.jpg',
  chiffonEarlGrey: '/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg',
};

export const MENU_DESSERTS: DessertItem[] = [
  {
    id: 401,
    baris: 2,
    kategori: 'chiffon',
    nama: 'Vintage Coquette Birthday Cake',
    desc: 'Kue ulang tahun piping pita Lambeth lembut dengan krim vanila, stroberi & mutiara gula.',
    harga: 245000,
    tipe: 'cake-rosegarden',
    photo: PHOTOS.ultahCoquette,
    ingredients: ['sponge_vanila', 'krim_mawar', 'stroberi', 'cream_cheese'],
    formula: 'SPONGE VANILA + BUTTERCREAM MAWAR + STROBERI SEGAR',
    servingNote: 'Kue Ulang Tahun Ø16 cm · Termasuk lilin & kartu ucapan',
  },
  {
    id: 402,
    baris: 2,
    kategori: 'chiffon',
    nama: 'Japanese Strawberry Chiffon',
    desc: 'Chiffon lembut sehalus awan berbalut chantilly cream segar & potongan stroberi Lembang.',
    harga: 165000,
    tipe: 'cake-raspberry',
    photo: PHOTOS.chiffonStrawberry,
    ingredients: ['sponge_vanila', 'stroberi', 'krim_mawar'],
    formula: 'CHIFFON VANILA JEPANG + CHANTILLY CREAM + STROBERI SEGAR',
    servingNote: 'Whole Chiffon Ø18 cm · Manis ringan favorit keluarga',
  },
  {
    id: 403,
    baris: 2,
    kategori: 'chiffon',
    nama: 'Pandan Kaya Chiffon Cake',
    desc: 'Chiffon pandan harum daun suji asli dengan glaze srikaya kelapa & taburan pandan lembut.',
    harga: 138000,
    tipe: 'cake-rosegarden',
    photo: PHOTOS.chiffonPandan,
    ingredients: ['sponge_vanila', 'cream_cheese'],
    formula: 'CHIFFON PANDAN SUJI + GLAZE SRIKAYA KELAPA + KRIM RINGAN',
    servingNote: 'Whole Chiffon Ø18 cm · Dipanggang hangat tiap pagi',
  },
  {
    id: 404,
    baris: 2,
    kategori: 'chiffon',
    nama: 'Earl Grey Milk Tea Chiffon',
    desc: 'Chiffon seduhan daun teh Earl Grey bergamot dengan milk tea cream & kelopak mawar kering.',
    harga: 158000,
    tipe: 'cake-pinkchoc',
    photo: PHOTOS.chiffonEarlGrey,
    ingredients: ['sponge_vanila', 'krim_mawar', 'kayu_manis'],
    formula: 'CHIFFON TEH EARL GREY + MILK TEA CREAM + KELOPAK MAWAR',
    servingNote: 'Whole Chiffon Ø18 cm · Wangi teh elegan & tidak enek',
  },
  {
    id: 101,
    baris: 1,
    kategori: 'cupcake',
    nama: 'Strawberry Red Velvet',
    desc: 'Sponge red velvet lembut dengan krim vanila & mawar stroberi.',
    harga: 38000,
    tipe: 'cupcake-straw',
    photo: PHOTOS.berryPeachCupcake,
    ingredients: ['red_velvet', 'cream_cheese', 'stroberi'],
    formula: 'RED VELVET + CREAM CHEESE + STROBERI SEGAR',
    servingNote: '1 pcs cupcake · Dipanggang hangat tiap pagi',
  },
  {
    id: 102,
    baris: 1,
    kategori: 'cupcake',
    nama: 'Apple Cinnamon',
    desc: 'Cupcake kayu manis hangat berhias mawar apel panggang.',
    harga: 35000,
    tipe: 'cupcake-apple',
    photo: PHOTOS.cinnamonMintCupcake,
    ingredients: ['sponge_vanila', 'kayu_manis'],
    formula: 'SPONGE VANILA + APEL PANGGANG + KAYU MANIS',
    servingNote: '1 pcs cupcake · Cocok ditemani teh hangat',
  },
  {
    id: 103,
    baris: 1,
    kategori: 'cupcake',
    nama: 'Peppermint Candy',
    desc: 'Cupcake cokelat pekat dengan krim peppermint & mawar merah.',
    harga: 36000,
    tipe: 'cupcake-mint',
    photo: PHOTOS.cinnamonMintCupcake,
    ingredients: ['cokelat_belgia', 'krim_mawar', 'raspberry'],
    formula: 'COKELAT BELGIA + KRIM PEPPERMINT + BERRY',
    servingNote: '1 pcs cupcake · Segar manis seimbang',
  },
  {
    id: 104,
    baris: 1,
    kategori: 'cupcake',
    nama: 'Peach Cheesecake',
    desc: 'Cheesecake panggang lembut dengan krim keju & mawar persik.',
    harga: 42000,
    tipe: 'cupcake-peach',
    photo: PHOTOS.berryPeachCupcake,
    ingredients: ['sponge_vanila', 'cream_cheese', 'persik'],
    formula: 'SPONGE VANILA + CREAM CHEESE + GLAZE PERSIK',
    servingNote: '1 pcs cupcake · Lumer lembut di mulut',
  },
  {
    id: 201,
    baris: 2,
    kategori: 'cake',
    nama: 'Raspberry Lemonade Cake',
    desc: 'Cake lemon segar berhias buah raspberry & kelopak mawar.',
    harga: 185000,
    tipe: 'cake-raspberry',
    photo: PHOTOS.raspberry,
    ingredients: ['sponge_vanila', 'krim_mawar', 'raspberry'],
    formula: 'SPONGE VANILA LEMON + KRIM MAWAR + RASPBERRY SEGAR',
    servingNote: 'Whole Cake Ø16 cm · Untuk 6–8 porsi',
  },
  {
    id: 202,
    baris: 2,
    kategori: 'cake',
    nama: 'Pink Rose Chocolate',
    desc: 'Lapisan cokelat pekat berpadu krim mawar merah muda.',
    harga: 195000,
    tipe: 'cake-pinkchoc',
    photo: PHOTOS.pinkchoc,
    ingredients: ['cokelat_belgia', 'krim_mawar', 'raspberry'],
    formula: 'COKELAT BELGIA + KRIM MAWAR + KOMPOT RASPBERRY',
    servingNote: 'Whole Cake Ø16 cm · Favorit perayaan spesial',
  },
  {
    id: 203,
    baris: 2,
    kategori: 'cake',
    nama: 'The Rose Garden',
    desc: 'Cake aroma mawar dengan krim vanila & taburan beri segar.',
    harga: 210000,
    tipe: 'cake-rosegarden',
    photo: PHOTOS.rosegarden,
    ingredients: ['sponge_vanila', 'krim_mawar', 'stroberi', 'raspberry'],
    formula: 'SPONGE VANILA + KRIM MAWAR + STROBERI & RASPBERRY',
    servingNote: 'Whole Cake Ø18 cm · Dekorasi pita & mawar segar',
  },
  {
    id: 301,
    baris: 3,
    kategori: 'treats',
    nama: 'Lovable Donuts',
    desc: 'Paket donat lembut glaze mawar, persik & cokelat putih.',
    harga: 28000,
    tipe: 'donuts',
    photo: PHOTOS.donutsSundae,
    ingredients: ['krim_mawar', 'persik'],
    formula: 'BRIOCHE DONUT + GLAZE MAWAR + GLAZE PERSIK',
    servingNote: 'Isi 2 donat brioche lembut dalam kotak pita',
  },
  {
    id: 302,
    baris: 3,
    kategori: 'treats',
    nama: 'Rose Ice Cream Split',
    desc: 'Sajian es krim mawar & vanila dengan pisang segar & ceri.',
    harga: 48000,
    tipe: 'bananasplit',
    photo: PHOTOS.donutsSundae,
    ingredients: ['krim_mawar', 'stroberi', 'es_krim'],
    formula: 'ES KRIM ARTISAN + KRIM MAWAR + STROBERI SEGAR',
    servingNote: 'Sajian dingin khusus Dine-in & Takeaway cepat',
  },
  {
    id: 303,
    baris: 3,
    kategori: 'treats',
    nama: 'Strawberry Sundae',
    desc: 'Es krim vanila lembut dengan saus stroberi & taburan manis.',
    harga: 45000,
    tipe: 'sundae',
    photo: PHOTOS.donutsSundae,
    ingredients: ['stroberi', 'es_krim'],
    formula: 'ES KRIM VANILA ARTISAN + SAUS STROBERI + WHIPPED CREAM',
    servingNote: 'Gelas sundae klasik dengan potongan stroberi',
  },
];

export const ETALASE_CAKES: EtalaseCakeItem[] = [
  {
    id: 'et-ultah-coquette',
    menuId: 401,
    nama: 'Vintage Coquette Birthday Cake',
    jenis: 'Kue Ulang Tahun',
    ukuran: 'Ø 16 cm · 2 Lapis',
    harga: 245000,
    photo: PHOTOS.ultahCoquette,
    fallbackTipe: 'cake-rosegarden',
    desc: 'Kue ulang tahun klasik bergaya Lambeth dengan piping pita pastel, krim mawar lembut, dan stroberi segar di puncak.',
    catatanRasa: 'Manis lembut · Aroma vanila & mawar',
    tagLabel: 'Best Seller Ultah',
  },
  {
    id: 'et-chiffon-strawberry',
    menuId: 402,
    nama: 'Japanese Strawberry Chiffon',
    jenis: 'Chiffon Cake',
    ukuran: 'Ø 18 cm · Fluffy',
    harga: 165000,
    photo: PHOTOS.chiffonStrawberry,
    fallbackTipe: 'cake-raspberry',
    desc: 'Sponge chiffon ultra-lembut berbalut krim chantilly dingin dan irisan stroberi Lembang pilihan.',
    catatanRasa: 'Ringan seperti awan · Segar manis',
    tagLabel: 'Chiffon Favorit',
  },
  {
    id: 'et-chiffon-pandan',
    menuId: 403,
    nama: 'Pandan Kaya Chiffon Cake',
    jenis: 'Chiffon Cake',
    ukuran: 'Ø 18 cm · Fresh Bake',
    harga: 138000,
    photo: PHOTOS.chiffonPandan,
    fallbackTipe: 'cake-rosegarden',
    desc: 'Chiffon pandan perasan daun suji asli dengan lelehan saus srikaya kelapa gurih dan krim vanila tipis.',
    catatanRasa: 'Wangi pandan alami · Lembut empuk',
    tagLabel: 'Baru Keluar Oven',
  },
  {
    id: 'et-chiffon-earlgrey',
    menuId: 404,
    nama: 'Earl Grey Milk Tea Chiffon',
    jenis: 'Chiffon Cake',
    ukuran: 'Ø 18 cm · Signature',
    harga: 158000,
    photo: PHOTOS.chiffonEarlGrey,
    fallbackTipe: 'cake-pinkchoc',
    desc: 'Sponge chiffon seduhan daun teh Earl Grey bergamot dengan frosting milk tea lembut dan kelopak mawar.',
    catatanRasa: 'Harum teh floral · Tidak terlalu manis',
  },
  {
    id: 'et-ultah-rosegarden',
    menuId: 203,
    nama: 'The Rose Garden Birthday',
    jenis: 'Kue Ulang Tahun',
    ukuran: 'Ø 18 cm · 8–10 Porsi',
    harga: 210000,
    photo: PHOTOS.rosegarden,
    fallbackTipe: 'cake-rosegarden',
    desc: 'Kue ulang tahun bernuansa taman mawar dengan krim vanila, pita satin lembut, dan buah beri segar.',
    catatanRasa: 'Floral manis · Beri asam segar',
  },
  {
    id: 'et-ultah-pinkchoc',
    menuId: 202,
    nama: 'Pink Rose Chocolate Cake',
    jenis: 'Kue Ulang Tahun',
    ukuran: 'Ø 16 cm · Rich Cocoa',
    harga: 195000,
    photo: PHOTOS.pinkchoc,
    fallbackTipe: 'cake-pinkchoc',
    desc: 'Kue cokelat Belgia pekat berpadu buttercream mawar merah muda dan kompot raspberry di dalamnya.',
    catatanRasa: 'Cokelat pekat · Krim mawar lembut',
  },
  {
    id: 'et-ultah-raspberry',
    menuId: 201,
    nama: 'Raspberry Lemonade Cake',
    jenis: 'Kue Ulang Tahun',
    ukuran: 'Ø 16 cm · Zesty',
    harga: 185000,
    photo: PHOTOS.raspberry,
    fallbackTipe: 'cake-raspberry',
    desc: 'Kue ulang tahun lemon segar berhiaskan raspberry utuh, kelopak bunga, dan krim vanila tipis.',
    catatanRasa: 'Segar citrus · Manis seimbang',
  },
];

export const HAMPERS_ITEMS: Array<{
  nama: string;
  desc: string;
  harga: number;
  tipe: DessertIllustType;
}> = [
  {
    nama: 'Toples Choco Chip Butter (350g)',
    desc: 'Cookies mentega renyah dengan keping cokelat Belgia.',
    harga: 85000,
    tipe: 'donuts',
  },
  {
    nama: 'Paket Hampers Pita Klasik',
    desc: 'Kotak bingkisan berpita satin berisi cookies & kartu ucapan.',
    harga: 175000,
    tipe: 'cake-rosegarden',
  },
];

export const ZONE_REACTIONS: Record<
  Exclude<CafeZone, null>,
  { text: string; mood: 'happy' | 'excited' | 'cozy' | 'wave' }
> = {
  etalase: {
    text: 'Intip etalase kaca dari dekat yuk! Ada Kue Ultah & Chiffon Cake yang bisa digeser-geser~',
    mood: 'excited',
  },
  menu_papan: {
    text: 'Mau pesan kue? Klik Papan Menu di sini untuk lihat foto realistis & semua harganya!',
    mood: 'happy',
  },
  custom: {
    text: 'Masuk lewat pintu Kitchen Room untuk racik Custom Cake 3D impianmu~',
    mood: 'excited',
  },
  kasir: {
    text: 'Teteh Kasir sudah siap bantu pembayaran pesanan manismu di meja kasir!',
    mood: 'wave',
  },
  hampers: {
    text: 'Ada cookies butter & hampers pita cantik lho!',
    mood: 'happy',
  },
  saklar: {
    text: 'Klik saklar buat suasana lampu sore yang hangat~',
    mood: 'cozy',
  },
  plakat: {
    text: 'Selamat datang di Cravely sejak 2018!',
    mood: 'wave',
  },
};

export const PATISSIER_CLICK_LINES = [
  'Hehe~ Halo manis! Klik "Pesan Disini" di Papan Menu kiri buat mulai pesan kue ya!',
  'Coba klik Etalase Kaca tengah untuk mengintip Kue Ultah & Chiffon Cake dari dekat~',
  'Lihat pintu Kitchen Room di sebelah kanan? Di dalam sana kamu bisa bikin Custom Cake 3D!',
  'Teteh di meja kasir ramah banget lho, yuk mampir kalau sudah pilih kue~',
  'Terima kasih sudah mampir ke Cravely!',
];

export function formatRupiah(angka?: number | null): string {
  const val = Number(angka) || 0;
  return 'Rp ' + val.toLocaleString('id-ID');
}
