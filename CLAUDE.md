# Website Toko Kue Custom (UMKM)

Website pemesanan kue custom untuk UMKM: halaman publik bergaya scroll-storytelling, alur pemesanan bertahap (pilih rasa, ukuran, dan opsi lain, lihat preview kue, pilih tanggal, bayar), serta dashboard untuk admin dan staf produksi (harga dan opsi, pesanan, stok, laporan). Dibangun dengan JavaScript (Next.js) dan Supabase, di-deploy ke Vercel. Ada 3 role: **Admin**, **Staf Produksi**, dan **Pelanggan**. Nama toko diisi lewat menu Pengaturan, jangan ditulis langsung di kode.

## URUTAN KERJA (BACA DULU SEBELUM MENGERJAKAN APA PUN)

1. Baca `CLAUDE.md` ini sampai selesai.
2. **Sebelum membuat atau mengubah halaman publik, buka folder `referensi-desain/`** (video dan tangkapan layar landing page referensi) dan ikuti bagian "Referensi Desain" di bawah. Kalau foldernya belum ada, cukup ikuti deskripsi di bagian itu.
3. Kalau ada folder `referensi/` (kode lama buatan sendiri), baca untuk melihat gaya penulisan kode.
4. Baru tulis kode, mengikuti ATURAN PENULISAN KODE di bawah.

Kalau ada perbedaan antara folder referensi dan `CLAUDE.md`, **`CLAUDE.md` yang jadi acuan final**.

## ATURAN PENULISAN KODE (WAJIB DIPATUHI)

Kode di project ini harus sederhana dan bersih, terlihat ditulis manual oleh pelajar, bukan hasil generate.

1. **DILARANG menulis komentar di dalam kode.** Tidak ada `//`, `/* */`, `{/* */}` (JSX), komentar di CSS, dan komentar di file SQL.
2. **Pakai JavaScript biasa, bukan TypeScript.** File berakhiran `.js`. Tidak ada tipe, interface, atau generic.
3. **Kode harus sederhana.** Tidak boleh ada Repository, Service layer, class buatan sendiri, custom hook yang rumit, Context besar, atau library state management (Redux, Zustand, dll). State cukup dengan `useState`. Logika server cukup di Route Handler.
4. **Hindari sintaks yang terlihat canggih**: `map().filter().reduce()` bertingkat, optional chaining bertumpuk, ternary bersarang, closure kompleks, destructuring bertingkat. Pakai `if`, `for`, `forEach`, dan fungsi biasa.
5. **Yang penting jalan dan tidak error.** Utamakan kode yang lurus dan mudah dibaca daripada kode yang pintar.
6. Nama variabel dan fungsi boleh campur Indonesia/Inggris (`daftarPesanan`, `hitungTotal`, `simpanPesanan`, `statusBayar`).
7. Semua teks untuk pengguna (label, pesan sukses, pesan error, validasi) ditulis dalam Bahasa Indonesia.
8. Validasi dilakukan manual dengan `if` di Route Handler (bukan library validasi), dan mengembalikan pesan Bahasa Indonesia dengan status HTTP yang sesuai (400, 401, 403, 404).
9. **DILARANG mengubah struktur tabel lewat kode aplikasi.** Struktur tabel hanya lewat file SQL di `supabase/migrations/`. Data awal (pengaturan toko, grup opsi contoh, zona ongkir contoh) lewat `supabase/seed.sql`.
10. Query memakai Supabase client (`from().select().eq().insert().update().delete()`). Tidak memakai ORM. Tidak boleh menyambung string SQL dari input pengguna.
11. Tampilan memakai **Next.js App Router + Tailwind CSS + Font Awesome 6.4 (lewat CDN di layout)**. Tidak memakai library komponen (shadcn, MUI, dll).
12. Library yang diizinkan hanya: `next`, `react`, `react-dom`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `gsap` (animasi scroll di landing), `qrcode` (membuat QR tiket), `leaflet` (peta interaktif pemilih lokasi pengantaran dan toko pada komponen client), `chart.js` (dipakai langsung di client component lewat `useEffect`, dihancurkan saat unmount dengan `chart.destroy()`, tanpa `react-chartjs-2`), dan `three` (Three.js diizinkan hanya di `/pesan` dan wajib dimuat secara dinamis). File CSS eksternal studio `app/pesan/cakecraft.css` khusus digunakan di `/pesan`. Library lain tanya dulu.
13. Fitur yang tidak ada di `CLAUDE.md` ini tidak boleh ditambahkan hanya karena ada di referensi. Referensi dipakai untuk **tampilan**, bukan untuk menambah fitur.
14. **DILARANG menghapus file, halaman, atau komponen apa pun** kecuali pengguna menyebut nama filenya secara eksplisit di pesan permintaan. Kalau menurut analisis ada yang perlu dihapus atau tidak dipakai, daftarkan di laporan dan tanyakan terlebih dahulu.
15. **Keputusan Katalog & Keranjang**:
    - Halaman keranjang belanja resmi berada di `/keranjang` dengan memakai desain antarmuka `components/patisserie/KasirView.tsx`.
    - Katalog produk (`/menu`, form admin, API) disederhanakan: tanpa kolom urutan tampil, tanpa porsi, dan tanpa komposisi bahan. Pengurutan produk otomatis terbaru (`dibuat_pada` menurun). Kategori produk diurutkan berdasarkan `id` terlama.
16. **Keputusan Midtrans, Estimasi & Ongkir Jarak (Fase 2B)**:
    - **Midtrans Snap**: Satu-satunya metode bayar pada checkout. Callback Snap mengarahkan ke `/pesanan-saya/[kode]?bayar=1`; status pembayaran diverifikasi mutlak dari server. Webhook (`/api/midtrans/webhook`) dan cek manual (`/api/midtrans/cek`) bersifat idempoten via `lib/midtransSinkron.js`.
    - **Rumus DP Campuran**: DP% hanya berlaku dan dihitung dari subtotal kue Custom. Subtotal Katalog dan Ongkir wajib 100% di awal.
    - **Ongkir Berbasis Jarak**: Untuk metode Kirim, wajib pin koordinat via `PetaLokasi` (Leaflet) dan ongkir dihitung ulang di server via `lib/ongkir.js` berdasarkan tabel `tarif_jarak` dan faktor jalan toko.
    - **Estimasi Pengiriman**: Dihitung via `lib/estimasi.js` dalam zona Asia/Jakarta melewati hari libur (`tanggal_tutup`) dan kuota custom.
    - **Operasional Hari Ini**: Dikelola di `/dashboard/hari-ini` untuk memantau jadwal hari ini, serah terima, dan pelunasan tunai di toko.

Aturan ini berlaku untuk semua perubahan berikutnya, tanpa perlu diingatkan lagi.

## Referensi Desain

Acuan: video landing page sebuah klinik ("nadi.") dengan gaya **scroll-storytelling**: tiap bagian scroll menampilkan satu tahap perjalanan pengguna, dengan ilustrasi isometrik, headline besar (baris kedua berwarna aksen), kartu putih kecil berisi detail tahap itu, dan garis penuntun yang menyambung dari satu tahap ke tahap berikutnya. Bagian akhirnya pop-up booking bertahap yang ditutup dengan tiket QR.

Yang **diambil**:
- Gaya scroll-storytelling dan susunan headline + kartu kecil.
- Navbar melayang berbentuk pil, kartu putih membulat, tipografi tebal.
- Pop-up pemesanan bertahap dengan panel ringkasan di sisi kiri.
- Tiket QR di akhir pemesanan.

Yang **tidak diambil**:
- Isinya (dokter, antrean, lab, resep). Ceritanya diganti perjalanan sebuah kue (lihat "Landing Page").
- Ilustrasi 3D render. Di project ini ilustrasi dibuat **SVG sederhana buatan sendiri** (bentuk isometrik dasar). Tidak ada gambar dari URL luar.
- Fitur apa pun yang tidak ada di `CLAUDE.md` ini.

## Tech Stack

- **Framework**: Next.js (App Router), JavaScript, React
- **Tampilan**: Tailwind CSS (halaman publik) + CSS kustom dashboard (`app/dashboard/dashboard.css` dari desain referensi) + Font Awesome 6.5/6.4 (CDN) + font Plus Jakarta Sans, Caveat, Dancing Script, dan Satisfy (khusus hero dashboard) lewat `next/font/google`
- **Grafik Dashboard**: `chart.js` (langsung di client component lewat `useEffect`, dihancurkan saat unmount dengan `chart.destroy()`, tanpa `react-chartjs-2`)
- **Database, login, penyimpanan file**: Supabase (PostgreSQL, Supabase Auth email + password, Supabase Storage)
- **Animasi landing**: GSAP + ScrollTrigger
- **Preview kue**: komponen SVG berlapis (bukan 3D), lihat bagian "Preview Kue"
- **QR tiket**: library `qrcode`, isi QR hanya `kode_pesanan`
- **Hosting**: Vercel
- **Zona waktu**: server Vercel berjalan di UTC, jadi **semua perhitungan "hari ini", jam, dan batas waktu wajib memakai zona `Asia/Jakarta`**. Format tanggal Indonesia (`Senin, 5 Oktober 2026`) dan rupiah (`Rp 150.000`) lewat `Intl` di `lib/format.js`.

**Catatan penting Vercel:** Vercel bersifat serverless, jadi **tidak ada database file lokal dan tidak ada penyimpanan file permanen**. Semua data di Supabase, semua upload ke Supabase Storage. Batas ukuran body request di fungsi Vercel sekitar 4,5 MB, karena itu batas upload gambar di project ini 2 MB.

**Environment variable** (isi di `.env.local` saat development dan di pengaturan project Vercel):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
MIDTRANS_SERVER_KEY
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
```

`SUPABASE_SERVICE_ROLE_KEY` **hanya boleh dipakai di kode server** (Route Handler dan server component). Dilarang di-import dari file yang memakai `"use client"`, dan dilarang diberi awalan `NEXT_PUBLIC_`. File `.env.local` tidak ikut di-commit.

## Struktur Project

```
toko-kue/
├── app/
│   ├── layout.js
│   ├── page.js                          landing page publik (server component Menu Populer)
│   ├── menu/page.js                     katalog produk dessert & kue (dinamis DB)
│   ├── keranjang/page.js                keranjang belanja (custom + katalog)
│   ├── checkout/page.js                 checkout pesanan terpadu
│   ├── kasir/page.js                    redirect ke /keranjang
│   ├── pesan/page.js                    alur pemesanan bertahap
│   ├── masuk/page.js                    login dengan sanitasi ?ke=
│   ├── daftar/page.js                   registrasi akun
│   ├── pesanan-saya/page.js             daftar pesanan pelanggan
│   ├── pesanan-saya/[kode]/page.js      detail, status, tiket QR
│   ├── dashboard/
│   │   ├── dashboard.css                CSS dashboard referensi (semua class dipertahankan, tanpa komentar)
│   │   ├── layout.js                    sidebar & topbar sesuai role
│   │   ├── page.js                      ringkasan dashboard admin & staf
│   │   ├── katalog-opsi/page.js         admin (opsi custom, produk katalog, kelola kategori)
│   │   ├── pesanan/page.js              admin + staf
│   │   ├── pesanan/[kode]/page.js       admin + staf
│   │   ├── stok/page.js                 admin + staf
│   │   ├── laporan/page.js              admin
│   │   ├── pengaturan/page.js           admin
│   │   └── akun/page.js                 admin
│   └── api/
│       ├── keranjang/route.js           item keranjang (custom & katalog)
│       ├── keranjang/jumlah/route.js    total kuantitas keranjang
│       ├── pesanan/route.js             buat pesanan (harga dihitung di server)
│       ├── pesanan/[kode]/status/route.js
│       ├── pembayaran/route.js          unggah bukti bayar
│       ├── pembayaran/[id]/route.js     konfirmasi atau tolak
│       ├── opsi/route.js                simpan grup dan item opsi
│       ├── produk/route.js              katalog produk kue
│       ├── kategori-produk/route.js     kategori produk katalog
│       ├── tarif-jarak/route.js         tarif ongkir berundak
│       ├── ongkir/route.js              hitung jarak dan ongkir
│       ├── stok/route.js
│       ├── pengaturan/route.js
│       ├── akun/route.js
│       └── cron/batalkan-pesanan/route.js
├── components/                          PreviewKue.js, WizardPesan.js, BadgeStatus.js, dll
├── lib/                                 supabaseBrowser.js, supabaseServer.js, format.js, cekRole.js, jam.js, ongkir.js
├── middleware.js                        arahkan yang belum login dari /dashboard dan /pesanan-saya
├── supabase/
│   ├── migrations/                      file .sql berurutan
│   └── seed.sql
├── public/
│   └── assets/images/                   admin-banner.png, admin-banner2.png
├── referensi-desain/                    tidak ikut di-deploy
└── vercel.json                          jadwal cron
```

## Role dan Hak Akses

| Menu / Fitur                                          | Admin | Staf Produksi | Pelanggan |
| ----------------------------------------------------- | :---: | :-----------: | :-------: |
| Lihat landing page, kustomisasi, dan preview          | Ya    | Ya            | Ya        |
| Membuat pesanan, bayar, lihat pesanan sendiri         | Tidak | Tidak         | Ya        |
| Katalog & Opsi                                        | Ya    | Tidak         | Tidak     |
| Daftar dan detail pesanan semua pelanggan             | Ya    | Ya (terbatas) | Tidak     |
| Ubah status produksi (Sedang Dibuat, Siap)            | Ya    | Ya            | Tidak     |
| Konfirmasi pembayaran, Dikirim, Selesai, Batalkan     | Ya    | Tidak         | Tidak     |
| Lihat harga dan data pembayaran di pesanan            | Ya    | Tidak         | Milik sendiri |
| Stok bahan (lihat dan ubah jumlah)                    | Ya    | Ya            | Tidak     |
| Laporan                                               | Ya    | Tidak         | Tidak     |
| Pengaturan toko dan kelola akun staf                  | Ya    | Tidak         | Tidak     |

- Role disimpan di kolom `role` tabel `profil` dengan nilai `admin`, `staf`, `pelanggan`.
- **Pengecekan role selalu di server** (Route Handler dan server component lewat `lib/cekRole.js`), bukan hanya menyembunyikan menu. Mengetik URL yang bukan haknya harus ditolak (403 atau dialihkan).
- Staf produksi **tidak boleh melihat harga, total, dan data pembayaran**. Ia hanya melihat apa yang perlu untuk membuat kue: preview, komponen, tulisan di kue, foto referensi, catatan, tanggal dan jam, serta cara pengambilan. Data yang dikirim ke halaman staf sudah disaring di server.
- Pendaftaran lewat halaman `/daftar` selalu membuat akun role `pelanggan`. Akun staf hanya dibuat admin lewat menu Akun. Akun admin pertama dibuat manual di Supabase, lalu rolenya diubah lewat SQL.
- Setelah login, arahkan sesuai role: admin dan staf ke `/dashboard`, pelanggan ke `/pesanan-saya`.
- Akun dengan `aktif = false` ditolak saat login dengan pesan jelas.

## Palet Warna dan Tampilan

Seluruh tampilan (baik dashboard admin/staf maupun halaman publik) memakai **palet hijau** yang diambil dari variabel CSS di `referensi-desain/dashboard-admin.html`. Font yang digunakan adalah **Plus Jakarta Sans** (teks utama) ditambah font **Caveat**, **Dancing Script**, dan **Satisfy** (khusus judul/hero dashboard) yang diimpor lewat `next/font/google`.

### Variabel CSS Utama (disimpan di `app/dashboard/dashboard.css`)

```css
:root {
  --bg-page: #eff4ee;
  --bg-sidebar: #17382d;
  --bg-sidebar-active: #eaf0e6;
  --text-sidebar-active: #17382d;
  --text-sidebar: #c2d6ca;

  --card-bg: #ffffff;
  --card-radius: 20px;
  --card-shadow: 0 4px 18px rgba(23, 56, 45, 0.04);
  --card-border: 1px solid rgba(220, 230, 222, 0.75);

  --color-primary: #17382d;
  --color-text-main: #182b23;
  --color-text-muted: #788d80;

  --badge-green-bg: #dcf5e4;
  --badge-green-txt: #26804a;
  --badge-blue-bg: #d7ecfa;
  --badge-blue-txt: #1f76b5;
  --badge-orange-bg: #faeed8;
  --badge-orange-txt: #b47518;
}
```

### Penerapan pada Halaman Publik (Tailwind CSS)

| Elemen                         | Kelas Tailwind                                                           |
| ------------------------------ | ------------------------------------------------------------------------ |
| Latar halaman                  | `bg-[#eff4ee]`, teks `text-[#182b23]`                                    |
| Navbar publik (melayang)       | `bg-white/90 backdrop-blur rounded-full shadow-sm border border-[#dce6de]`, `sticky top-4` |
| Tombol utama                   | `bg-[#17382d] hover:bg-[#265a48] text-white rounded-full font-semibold transition` |
| Tombol sekunder                | `bg-white border border-[#dce6de] text-[#17382d] hover:bg-[#eef5ef] rounded-full` |
| Headline                       | `font-extrabold text-[#182b23]`, baris kedua `text-[#265a48]`           |
| Card                           | `bg-white rounded-3xl shadow-sm border border-[#dce6de] p-6`            |
| Sidebar dashboard              | `position: fixed`, warna polos `var(--bg-sidebar)` (`#17382d`), menu aktif `var(--bg-sidebar-active)` (`#eaf0e6`) teks `var(--text-sidebar-active)` (`#17382d`) |
| Header tabel                   | `bg-[#eff4ee] text-[#17382d] uppercase text-xs font-semibold`, baris `divide-y divide-[#dce6de]` |
| Input                          | `px-4 py-2.5 rounded-xl border border-[#dce6de] outline-none focus:border-[#17382d]` |
| Modal                          | overlay `bg-[#17382d]/60 backdrop-blur-sm`, kotak `bg-white rounded-3xl p-8` |
| Tombol hapus / batalkan        | `text-red-700 hover:text-red-800` atau `bg-red-50 text-red-700`         |

### Badge Status (Palet Hijau Selaras)

Semua badge status pesanan dan status bayar menggunakan warna yang bersumber dari palet hijau yang harmonis:

- **7 Status Pesanan:**
  - `Menunggu Pembayaran`: `bg-[#eaf0eb] text-[#556e5f]` (sage pucat)
  - `Diterima`: `bg-[#dcf5e4] text-[#26804a]` (mint segar)
  - `Sedang Dibuat`: `bg-[#eff5dc] text-[#53702a]` (olive lembut)
  - `Siap`: `bg-[#d7f3e1] text-[#1c6e3d]` (zamrud cerah)
  - `Dikirim`: `bg-[#daf1ec] text-[#1f7366]` (toska lembut)
  - `Selesai`: `bg-[#d8edd9] text-[#17382d]` (hijau daun tua)
  - `Dibatalkan`: `bg-[#fae8e8] text-[#9c3838]` (terracotta lembut)

- **3 Status Bayar:**
  - `Belum Bayar`: `bg-[#fae8e8] text-[#9c3838]` (terracotta lembut)
  - `DP Dibayar`: `bg-[#faeed8] text-[#b47518]` (krem/amber zaitun)
  - `Lunas`: `bg-[#dcf5e4] text-[#26804a]` (mint segar)

- Semua halaman harus rapi di HP (mobile-first), karena kebanyakan pelanggan membuka lewat HP. Dashboard staf produksi juga dipakai di HP atau tablet di dapur.
- Tombol WhatsApp mengambang di halaman publik, nomornya dari Pengaturan Toko.

## Landing Page (`/`)

Memakai gaya scroll-storytelling dari "Referensi Desain". Semua teks toko (nama, slogan, nomor WhatsApp, jam operasional) dari tabel `pengaturan_toko`.

1. **Hero**: headline besar dua baris, paragraf singkat, tombol **Pesan Kue Sekarang** (ke `/pesan`), dan ilustrasi isometrik toko atau dapur kue.
2. **Perjalanan sebuah kue** (inti scroll-storytelling, tiap tahap satu "adegan" dengan ilustrasi SVG, headline, dan satu kartu kecil):
   - Pilih Rasa & Ukuran
   - Atur Hiasan & Tulisan
   - Pilih Tanggal Ambil atau Antar
   - Dibuat di Dapur Kami
   - Siap Diambil atau Diantar
3. **Cara Memesan**: ringkasan 4 langkah dengan tombol ke `/pesan`.
4. **Info Toko**: alamat, jam operasional, kontak.
5. **CTA penutup** dan footer.

- Animasi memakai GSAP ScrollTrigger. Hormati `prefers-reduced-motion` (kalau aktif, tampilkan tanpa animasi).
- Isi adegan boleh berupa array biasa di file komponen (judul, deskripsi, isi kartu). Ini konten tetap landing page, bukan data toko.
- Ilustrasi SVG sederhana dibuat sendiri. Dilarang memakai gambar dari URL luar.

## Alur Pemesanan Pelanggan (`/pesan`)

Halaman pemesanan studio kue interaktif (`app/pesan/page.js`) menghubungkan katalog database langsung ke kanvas 3D Three.js dan ringkasan pesanan real-time. Alur terdiri dari 9 langkah berurutan (Langkah 0 sampai Langkah 8):

1. **Langkah 0: Jenis Kue / Template** (`grup_opsi: Jenis Kue`, peran dashboard `jenis`)
   - Pilihan: Custom Cake (mulai dari awal) atau Template Siap Pakai (Birthday Sweet, Romantic Rose, Choco Delight, Minimalist Mint, dll).
2. **Langkah 1: Ukuran** (`grup_opsi: Ukuran`, peran visual `ukuran`)
   - Pilihan: Mini Ø10 (Rp 85.000), Small Ø14 (Rp 125.000), Medium Ø18 (Rp 165.000), Large Ø22 (Rp 210.000). Mengubah skala geometris kue 3D.
3. **Langkah 2: Bentuk** (`grup_opsi: Bentuk`, peran visual `bentuk`)
   - Pilihan: Lingkaran (Rp 0), Kotak (Rp 0), Hati (Rp 10.000), Bintang (Rp 15.000), Hexagon (Rp 10.000), Buat Sendiri (Rp 25.000). Untuk pilihan "Buat Sendiri", pengguna menggambar titik bentuk kustom di kanvas 2D dan hasilnya disimpan sebagai file snapshot bentuk kustom.
4. **Langkah 3: Rasa Kue** (`grup_opsi: Rasa`, peran visual `badan`, peran dashboard `terlaris`)
   - Pilihan: Vanilla (Rp 0), Cokelat (Rp 10.000), Red Velvet (Rp 15.000), Stroberi (Rp 10.000).
5. **Langkah 4: Isian Kue** (`grup_opsi: Isian`, non-visual)
   - Pilihan: Krim Vanilla (Rp 0), Ganache Cokelat (Rp 8.000), Selai Stroberi (Rp 5.000), Cream Cheese (Rp 12.000).
6. **Langkah 5: Warna Krim** (`grup_opsi: Warna Krim`, peran visual `krim`)
   - Pilihan: Pink, Putih, Cokelat, Mint, Kuning, Lavender (semua Rp 0). Mengubah warna material frosting pada kue 3D.
7. **Langkah 6: Dekorasi** (`grup_opsi: Dekorasi`, peran visual `topping`, jenis pilihan `banyak`)
   - Pilihan: Lelehan Krim (Rp 12.000), Stroberi (Rp 10.000), Mixed Berry (Rp 15.000), Bunga Gula (Rp 8.000), Taburan (Rp 5.000), Lilin (Rp 3.000).
8. **Langkah 7: Custom Desain**
   - Menambahkan elemen interaktif ke permukaan kue:
     - Teks di kue: kustom teks, pilihan font (Caveat, Playfair, Pacifico, Montserrat), ukuran font, warna, dan efek gaya (polos, emas, neon, bayangan, melengkung). Teks gratis dan disimpan di `pesanan.tulisan_kue` serta `desain_json`.
     - Elemen hiasan (`grup_opsi: Elemen Hiasan`, peran visual `stiker`, jenis pilihan `banyak`): Stiker, Topper, Bunga, Buah, Cokelat (harga per buah dari database). Disimpan koordinat posisi, rotasi, skala, dan emojinya ke `desain_json`.
     - Upload Gambar Kustom (`grup_opsi: Desain Kustom`, item Gambar Kustom flat): diunggah oleh pelanggan dan disimpan ke `pesanan.foto_gambar_kustom`.
9. **Langkah 8: Review & Pemesanan**
   - Rincian lengkap pesanan (setiap item, jumlah, harga atau label "Termasuk" untuk item gratis).
   - Pengambilan: pilih tanggal (dari `/api/ketersediaan`), jam per jam (`jam_buka` sampai `jam_tutup`), metode Ambil di Toko atau Kirim ke Alamat (dengan tarif zona ongkir otomatis).
   - Data Pemesan: nama lengkap, nomor WhatsApp, catatan khusus murni.
   - Pembayaran: menampilkan jumlah yang harus dibayar sekarang (DP atau lunas sesuai pengaturan toko), metode Transfer Bank atau QRIS (beserta nomor rekening/gambar QRIS resmi).
   - Saat tombol kirim ditekan, sistem secara otomatis mengambil snapshot kanvas 3D (JPEG max 1000px, kualitas 0.85) dan mengirimkannya ke `POST /api/pesanan` bersama desain_json dan file kustom lainnya.

### Aturan Baku Katalog & Perhitungan Harga
- **Satu Katalog Bersama**: Katalog database sama persis dengan katalog studio 3D. Tidak ada pencocokan nama atau tebakan kode.
- **Penentu Harga Hanya Database**: Ditentukan HANYA oleh `opsi_item.harga` di database. Tidak ada harga yang ditulis langsung di kode.
- **Fungsi Hitung Bersama**: Total harga di `/pesan`, server `POST /api/pesanan`, tiket pelanggan, dan admin dihitung dengan fungsi bersama `lib/hitungHarga.js` (`hitungTotal({ pilihan, daftarItem, ongkir, pengaturanDP })`).
- **Pilihan Awal Hanya Item Gratis**: Dekorasi berbayar, bentuk berbayar, rasa/isian berbayar, dan elemen hiasan tidak boleh terpilih otomatis. Total awal hanya mencakup item gratis dan base ukuran terkecil (Mini Rp 85.000). Teks di kue awalnya kosong.
- **Semua Pilihan Tersimpan**: Setiap pilihan pelanggan (termasuk yang gratis) tersimpan di `pesanan_pilihan` beserta `id_grup` dan `jumlah`. Item gratis ditampilkan dengan label "Termasuk".
- **Kolom Baru Database (Migration 00008)**:
  - `pesanan_pilihan.jumlah` (integer, default 1, subtotal = harga × jumlah).
  - `pesanan.foto_preview`, `pesanan.foto_bentuk_kustom`, `pesanan.foto_gambar_kustom` (text, nama path file di bucket privat `referensi-kue`).
  - `pesanan.desain_json` (jsonb, menyimpan data detail teks, posisi/rotasi elemen stiker, titik bentuk kustom, template).
  - Nilai kolom `peran_visual` di `grup_opsi` mencakup: `badan`, `ukuran`, `krim`, `topping`, `bentuk`, `stiker`.
- **Ketersediaan & Jadwal (`/api/ketersediaan`)**: Mengembalikan `tanggal_minimal`, `tanggal_tutup`, `tanggal_penuh` (kuota harian habis), `jam_buka`, dan `jam_tutup` berbasis zona waktu `Asia/Jakarta`.

## Preview Kue

Halaman `/pesan` menggunakan Studio Kue 3D interaktif berbasis Three.js dengan pencahayaan studio, bayangan lembut, dan kontrol rotasi/zoom orbit. Jika perangkat atau peramban pengguna tidak mendukung WebGL, sistem otomatis beralih menampilkan fallback komponen 2D `components/PreviewKue.js`. Di halaman detail pesanan admin/staf dan tiket pelanggan, snapshot hasil rendering 3D (`foto_preview`) ditampilkan sebagai thumbnail utama, dengan fallback ke `PreviewKue` jika pesanan lama belum memiliki snapshot.

## Dashboard (`/dashboard`)

### Tampilan dan Layout Dashboard (`app/dashboard/layout.js` & `app/dashboard/dashboard.css`)

- Menggunakan CSS khusus yang diambil langsung dari desain referensi (`referensi-desain/dashboard-admin.html`), disimpan di `app/dashboard/dashboard.css` dengan **semua nama class dipertahankan persis**. Tailwind tetap digunakan untuk halaman publik. Semua komentar di file CSS dan HTML referensi dibuang.
- **Aset Gambar**: File gambar latar `admin-sidebar.png`, `admin-banner.png`, dan `admin-banner2.png` disimpan di `public/assets/images/` dan dipanggil dengan path `/assets/images/...`.
- **Sidebar**:
  - Dipindahkan apa adanya sesuai struktur referensi (`.sidebar`, `.sidebar-top-gap`, `.nav-menu`, `.nav-link`, `.sidebar-bottom-gap`). Latar belakang menggunakan `#17382d` dan gambar latar `/assets/images/admin-sidebar.png`.
  - **Menu Navigasi dikembalikan ke menu sebelumnya** (jangan diubah menjadi Produk / Pelanggan):
    - **Menu Admin:** Dashboard (`/dashboard`), Katalog & Opsi (`/dashboard/katalog-opsi`), Pesanan (`/dashboard/pesanan`), Stok (`/dashboard/stok`), Laporan (`/dashboard/laporan`), Pengaturan (`/dashboard/pengaturan`), Akun (`/dashboard/akun`).
    - **Menu Staf Produksi:** Dashboard (`/dashboard`), Pesanan (`/dashboard/pesanan`), Stok (`/dashboard/stok`).
  - **Fitur Buka/Tutup Sidebar**: Saat sidebar ditutup (tombol toggle di topbar diklik), **sidebar jangan tertutup/hilang seluruhnya**. Sidebar menyusut menjadi mode ringkas (collapsed) di mana **ikon menu tetap tampil** sehingga pengguna tetap bisa melihat dan mengeklik menu lewat ikonnya (teks label menu disembunyikan).
- **Topbar**:
  - Dipindahkan apa adanya sesuai referensi (`.topbar`, `.topbar-left`, `.btn-toggle-sidebar`, `.search-wrapper`, `.topbar-user-area`, `.btn-bell-notif`, `.user-profile-btn`).
  - Search input untuk pencarian live dan tombol lonceng notifikasi dengan badge angka.
  - Area profil menampilkan avatar SVG anime dari referensi.
  - **Nama dan role diambil secara dinamis dari akun yang sedang login** (bukan teks statis "Refky" dan "Admin").
  - Dropdown profil dilengkapi tombol **Keluar** (logout) untuk mengakhiri sesi.

### Dashboard (admin)

Halaman ringkasan admin dibangun dengan data nyata dari database Supabase (bukan data dummy), dengan tata letak dan komponen sesuai desain referensi:

1. **Sidebar Murni Kode**:
   - `position: fixed`, tinggi penuh layar (`top: 0`, `bottom: 0`), latar warna polos `var(--bg-sidebar)`. Tanpa gambar latar (`admin-sidebar.png` dihapus).
   - Bagian atas: logo kecil ikon `fa-cake-candles` dan nama toko dari `pengaturan_toko` dengan font `Dancing Script`.
   - Tengah: navigasi menu ber-scrollbar tipis. Menu admin: Dashboard, Katalog & Opsi, Pesanan, Stok, Laporan, Pengaturan, Akun. Menu staf: Dashboard, Pesanan, Stok. Menu aktif memakai `var(--bg-sidebar-active)` dan `var(--text-sidebar-active)`.
   - Bawah: tulisan "Make Life Sweeter" dengan ikon hati, font `Satisfy`, disembunyikan jika tinggi layar terbatas atau sidebar diciutkan.
   - Tombol buka-tutup: saat diciutkan, sidebar mengecil menjadi bar ikon 72px (label dan kutipan bawah disembunyikan, ikon memiliki title tooltip). Konten menyesuaikan lebar dengan transisi dan memicu resize `chart.js`. Status disimpan di `localStorage` dengan blok `try/catch`. Pada layar <= 800px menjadi laci (drawer) dengan overlay.

2. **Header Ringkas**:
   - Kolom pencarian di header dihapus. Kiri: tombol buka-tutup sidebar dan judul halaman aktif (contoh "Dashboard", "Pesanan", teks tebal besar sesuai route).
   - Kanan: lonceng notifikasi dan profil. Lonceng berisi badge jumlah (pembayaran `Menunggu Konfirmasi` + bahan dengan `jumlah <= batas_minimum`; staf hanya stok menipis). Klik membuka dropdown 2 baris ringkasan dengan tautan ke Pesanan dan Stok; jika kosong tampilkan "Tidak ada notifikasi baru" dan sembunyikan badge.
   - Profil: avatar SVG bawaan, nama dan role akun yang login, dropdown berisi "Keluar".

3. **Hero Banner** (`.hero-banner-card`):
   - Menggunakan gambar latar `/assets/images/admin-banner.png`.
   - Hanya berisi sapaan "Selamat Datang di", nama toko dari `pengaturan_toko` dengan tanda seru (font `Dancing Script`, ukuran `clamp` satu baris, lebar maksimal teks ~52%), dan slogan dari `pengaturan_toko`. Tombol "Mulai Kelola Toko" / "Kelola Pesanan" dan ringkasan teks dihapus.
   - Berdampingan sejajar dengan grid 4 kartu metrik (tinggi sama, atas dan bawah sejajar). Di atas hero terdapat pemilih periode tipis rata kanan (default: Bulan Ini).

4. **4 Kartu Metrik Ringkasan** (`.metrics-quad-grid`):
   - Dilengkapi pemilih periode (Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini; default: **Bulan Ini**).
   - Seluruh angka dihitung nyata dari database:
     1. **Total Pesanan**: Jumlah total pesanan non-batal pada periode terpilih, dengan teks kecil di bawah angka "N kue harus dibuat hari ini" (pesanan `Diterima` atau `Sedang Dibuat` dengan `tanggal_ambil` hari ini zona `Asia/Jakarta`). Badge persen pertumbuhan di samping angka hanya muncul jika periode sebelumnya tidak nol.
     2. **Perlu Dikonfirmasi**: Jumlah pembayaran berstatus `Menunggu Konfirmasi` saat ini, dengan teks kecil "bukti bayar" (tanpa persentase pertumbuhan).
     3. **Total Pendapatan**: Total nominal rupiah pembayaran berstatus `Dikonfirmasi` pada periode tersebut (berdasarkan `pembayaran.dikonfirmasi_pada`, zona `Asia/Jakarta`).
     4. **Pelanggan Aktif**: Jumlah pelanggan unik (`id_pelanggan`) yang membuat pesanan pada periode terpilih.
   - Ornamen gelombang SVG (`.metric-wave-svg`) di pojok kartu sebagai dekorasi visual statis.

5. **Grafik Penjualan** (`.chart-canvas-box`):
   - Dibuat menggunakan `chart.js` (line chart) di client component via `useEffect`, dihancurkan saat unmount dengan `chart.destroy()`.
   - Tiga pilihan periode: 7 Hari (harian), 30 Hari (mingguan), 90 Hari (bulanan).
   - Sumbu Y dihitung dinamis dari data pendapatan riil. Titik penjualan tertinggi ditandai dinamis. Tooltip statis hari Jumat dihapus.
   - Menampilkan pesan abu-abu di tengah kartu jika data kosong.

6. **Daftar Terlaris Dinamis** (`{nama grup} Terlaris`):
   - Menampilkan 3 item teratas dari grup opsi yang kolom `peran_dashboard`-nya diset ke `'terlaris'`, dihitung dari `pesanan_pilihan` berdasarkan `id_grup` pada pesanan non-batal periode terpilih.
   - Menampilkan nama item, persentase pangsa pilihan, jumlah kue/porsi terjual, bilah progres, dan **bulatan warna** dari kolom `warna` tabel `opsi_item`.
   - Menampilkan pesan informatif jika belum ada grup yang diset atau pesanan kosong.

7. **Donut Jenis Kue Dinamis** (`Pesanan Berdasarkan {nama grup}`):
   - Dibuat menggunakan `chart.js` (doughnut chart) di client component via `useEffect`, dihancurkan saat unmount.
   - Data dihitung dari item pada grup opsi yang kolom `peran_dashboard`-nya diset ke `'jenis'` dari `pesanan_pilihan` berdasarkan `id_grup` pada pesanan non-batal periode terpilih.
   - Irisan warna dari palet hijau (`#1e4b3c`, `#608d7c`, `#b2cfbe`, `#8fa58f`, `#d9e6dd`). Maksimal 4 item teratas, sisanya digabung "Lainnya".
   - Total pesanan di tengah donat dan legenda di sebelah kanan. Pesan informatif jika belum ada grup atau pesanan kosong.

8. **Pesanan Terbaru** (`.orders-flow-list`):
   - Menampilkan 3 pesanan terbaru: kode pesanan (`kode_pesanan`), waktu pemesanan (format tanggal & jam zona `Asia/Jakarta`), badge status pesanan (palet hijau), total harga rupiah, dan **mini preview kue** menggunakan komponen `PreviewKue`.
   - Mengklik baris pesanan membuka halaman daftar pesanan dengan side drawer detail pesanan (`/dashboard/pesanan?kode=...`).
   - Tautan "Lihat Semua" mengarah ke `/dashboard/pesanan`. Pesan abu-abu di tengah jika kosong.

9. **Kartu Promo Kanan** (`.vertical-promo-card`):
   - Menggunakan gambar latar `/assets/images/admin-banner2.png` tanpa tombol aksi (hanya gambar dan tulisan promosi visual).

10. **Dashboard Staf Produksi**:
    - Khusus operasional staf dapur: hero ringkas, daftar kue yang harus dibuat (`Diterima` dan `Sedang Dibuat` urut tanggal/jam terdekat), dan peringatan stok bahan menipis.
    - Dilarang menampilkan angka uang, total omzet, pendapatan, nominal harga pesanan, maupun grafik penjualan.

11. **Aturan Gambar**:
    - Semua gambar dari URL luar (Unsplash) DILARANG. Foto diganti bulatan warna opsi atau preview SVG (`PreviewKue`). Latar kartu memakai gambar lokal `/assets/images/`.

### Menu Katalog & Opsi (pengaturan produk katalog dan opsi kustomisasi)

Satu halaman, isinya **grup opsi**, dan tiap grup punya daftar item beserta harganya. Tidak ada menu terpisah untuk rasa, ukuran, dan lainnya.

```
Ukuran    : Mini Ø10 85.000 | Small Ø14 125.000 | Medium Ø18 165.000 | Large Ø22 210.000   [+ item]
Bentuk    : Lingkaran 0 | Kotak 0 | Hati 10.000 | Bintang 15.000 ...                       [+ item]
Rasa      : Vanilla 0 | Cokelat 10.000 | Red Velvet 15.000 | Stroberi 10.000               [+ item]
Warna Krim: Pink 0 | Putih 0 | Cokelat 0 | Mint 0 ...                                      [+ item]
Dekorasi  : Lelehan Krim 12.000 | Stroberi 10.000 | Mixed Berry 15.000 ...                 [+ item]
                                                                 [+ grup]
```

- Halaman ini difokuskan khusus untuk mengatur tarif dan **harga** setiap item katalog kustomisasi kue (tanpa fitur CRUD penambahan/penghapusan grup dan item), sehingga struktur 9 grup katalog tetap konsisten dengan studio kustomisasi.
- Admin dapat langsung mengubah harga item dengan mengeklik tombol "Ubah Harga" pada baris item terkait. Perubahan harga tersimpan aman ke database dan langsung berlaku untuk pemesanan baru.
- Jenis kue (ulang tahun, wedding, cupcake, hampers) cukup dibuat sebagai salah satu **grup opsi** (contoh grup "Jenis Kue" dengan harga dasar). Tidak ada tabel produk terpisah.

**Aturan harga (WAJIB):**
- **Total dihitung di server**, bukan di browser. Browser boleh menghitung untuk tampilan, tetapi saat pesanan dibuat server menghitung ulang dari database dan mengabaikan harga dari browser.
- Total kue = jumlah harga semua item terpilih. Server menolak kalau: ada item yang tidak aktif atau tidak ada, grup `wajib` belum dipilih, atau grup `jenis_pilihan = satu` berisi lebih dari satu item.
- Total bayar = total kue + ongkir (kalau dikirim). Ongkir diambil dari tabel `zona_ongkir`, bukan dari input browser.
- **Nama, harga, warna, dan kode visual tiap item disalin ke `pesanan_pilihan` saat pesanan dibuat.** Mengubah harga di Katalog & Opsi tidak boleh mengubah pesanan yang sudah ada.

### Menu Pesanan

**Daftar** (admin dan staf): kolom Kode, Nama Pelanggan, Tanggal & Jam, Pengambilan (Ambil / Kirim), Status Pesanan (badge), Status Bayar (badge, hanya admin). Filter status, filter tanggal, dan pencarian (`?cari=` kode atau nama). Urut default: tanggal ambil/kirim terdekat. Pagination 10 baris.

**Detail pesanan** (side drawer di `/dashboard/pesanan`):
- **Preview kue** dari pilihan pelanggan
- **Komponen** yang dipilih (grup, item), tulisan di kue, catatan, foto referensi
- **Kebutuhan Bahan** (admin dan staf): tabel Bahan, Dibutuhkan, Stok saat ini, Status (Cukup / Kurang). Banner merah jika ada bahan kurang, banner hijau jika cukup. Catatan jika ada pilihan tanpa resep (dengan tautan ke Katalog & Opsi untuk admin). Tombol **Kurangi Stok** manual (aktif pada status Diterima, Sedang Dibuat, Siap, Dikirim, Selesai; nonaktif untuk Menunggu Pembayaran dan Dibatalkan) dengan dialog konfirmasi rincian pemotongan. Setelah dikurangi, menampilkan waktu pemotongan dan nama pemotong, jumlah yang benar-benar dikurangi, serta tombol **Kembalikan Stok** (dengan konfirmasi). Panel ini tidak menampilkan data harga.
- **Rincian harga** per komponen, ongkir, total, jumlah DP, jumlah terbayar, sisa (admin saja)
- **Pembayaran**: daftar pembayaran (jenis, jumlah, metode, bukti, status) dengan tombol **Konfirmasi** dan **Tolak** (admin saja)
- **Pengiriman**: Ambil di Tempat, atau Kirim beserta alamat dan zona
- **Status**: tombol aksi sesuai role dan aturan alur di bawah. Pembatalan pesanan yang `stok_dipotong_pada`-nya sudah terisi memunculkan konfirmasi pengembalian stok dengan tombol Kembalikan dan Lewati.
- **Riwayat**: garis waktu perubahan status (siapa, kapan)

### Menu Stok

Daftar bahan (tepung, telur, coklat, krim, dst): kolom Nama Bahan, Sisa Stok, Dibutuhkan Pesanan Aktif (pesanan berstatus Diterima, Sedang Dibuat, dan Siap yang stoknya belum dipotong), Batas Minimum, Status (Aman, Menipis, atau Kurang untuk Pesanan), Penyesuaian Cepat (+Masuk, -Keluar), dan Aksi (Riwayat, Edit, Hapus). Filter status menyediakan opsi: Semua Status, Kurang untuk Pesanan, Menipis, dan Aman. Terdapat 4 kartu statistik: Total Jenis Bahan, Stok Aman & Mencukupi, Bahan Menipis (Perlu Restok), dan Kurang untuk Pesanan Aktif.

Admin dan staf bisa **menambah atau mengurangi jumlah** lewat tombol Masuk/Keluar (menulis `riwayat_stok` jenis Masuk/Keluar dengan `id_user`). Mengubah jumlah langsung di form edit bahan menulis `riwayat_stok` jenis Koreksi. Hanya admin yang bisa menambah, mengubah nama/satuan/batas, dan menghapus bahan. Tombol **Riwayat** di tiap baris membuka daftar mutasi stok (tanggal, perubahan, stok akhir, jenis, tautan kode pesanan, siapa, keterangan).

Stok **TIDAK PERNAH berkurang otomatis**, termasuk saat status pesanan berubah. Pengurangan stok pesanan dilakukan secara manual oleh staf/admin lewat tombol "Kurangi Stok" pada panel detail pesanan. Lonceng notifikasi dan daftar stok dashboard menghitung bahan yang menipis ATAU kurang untuk pesanan aktif (tiap bahan dihitung satu kali).

### Menu Laporan (admin)

Filter periode (dari tanggal sampai tanggal, default bulan berjalan). Isi:
- **Omzet**: total pembayaran berstatus Dikonfirmasi yang masuk pada periode itu
- **Jumlah pesanan** per status
- **Piutang**: total sisa pembayaran pesanan aktif yang belum lunas
- **Opsi terlaris** per grup (contoh rasa dan ukuran paling banyak dipesan)
- **Ambil vs Kirim**: jumlah pesanan per cara pengambilan
- **Ringkasan pembayaran**: jumlah DP dan jumlah pelunasan
- **Stok menipis**
- **Daftar pesanan** pada periode itu
- Tombol **Cetak** (`window.print()` dengan CSS cetak) dan **Export CSV** (fungsi JavaScript biasa yang menyusun teks CSV, tanpa library)

### Menu Pengaturan (admin)

Form berisi:
- **Info toko**: nama toko, slogan, alamat, nomor WhatsApp, jam operasional (teks)
- **Jadwal pemesanan**: `jam_buka`, `jam_tutup`, `kuota_harian` (jumlah pesanan aktif per tanggal), `minimal_hari_pesan` (default 2)
- **Pembayaran**: `mode_pembayaran` (`DP` atau `Lunas`), `persen_dp` (default 50), `batas_bayar_jam` (default 24), nama bank + nomor rekening + atas nama, unggah gambar QRIS
- **Ongkir berdasarkan jarak**: pemilih koordinat toko pada peta Leaflet (`lat_toko`, `lng_toko`), faktor jalan (`faktor_jalan`, default 1.3), batas jarak maksimal (`maks_jarak_kirim_km`, default 20), tabel tarif jarak berundak (`tarif_jarak`) dengan Tambah, Edit, Hapus, dan simulator perhitungan jarak.
- **Zona ongkir (lama)**: tabel zona lama (nama zona, tarif, aktif) hanya digunakan untuk `/pesan` versi lama.
- **Tanggal tutup**: daftar tanggal libur atau penuh (tanggal + alasan) dengan Tambah dan Hapus

### Menu Akun (admin)

Tabel akun staf dan admin (Nama, Email, Role, Status, Aksi). Modal Tambah: nama, email, password awal, role (`admin` atau `staf`). Edit: nama, role, status; password kosong berarti tidak diganti. Akun yang sedang login tidak boleh dihapus atau dinonaktifkan. Akun pelanggan tidak ditampilkan di sini. Pembuatan akun lewat Route Handler memakai service role (`auth.admin.createUser`).

## Pembayaran

Karena kue custom sulit dijual lagi kalau dibatalkan, pembayaran memakai **mode yang diatur admin** di Pengaturan:

- **Mode DP**: pelanggan membayar `persen_dp` persen dari total bayar saat memesan. Sisanya dilunasi sebelum kue diambil atau dikirim. Jumlah DP dibulatkan dengan `Math.round`.
- **Mode Lunas**: pelanggan langsung membayar penuh saat memesan.

Persen DP yang berlaku **disimpan di pesanan** (`persen_dp_saat_pesan`), jadi mengubah pengaturan tidak mengubah pesanan lama.

**Metode pembayaran** (pilihan pelanggan, tanpa payment gateway):
- **Transfer Bank**: menampilkan nomor rekening dari Pengaturan.
- **QRIS**: menampilkan gambar QRIS dari Pengaturan.
- **Tunai di Tempat**: hanya untuk **pelunasan** pesanan **Ambil di Tempat**; dicatat admin saat pelanggan mengambil kue. Tidak boleh dipakai untuk pembayaran pertama.

**Alur pembayaran manual:**
1. Pelanggan memesan, lalu membayar sesuai jumlah yang tampil (DP atau lunas).
2. Pelanggan **mengunggah bukti bayar** di halaman tiket. Dibuat baris `pembayaran` dengan status `Menunggu Konfirmasi`.
3. Admin memeriksa bukti, lalu menekan **Konfirmasi** (status `Dikonfirmasi`, server mengisi kolom `dikonfirmasi_pada` dengan waktu konfirmasi saat ini) atau **Tolak** (status `Ditolak`, pelanggan bisa unggah ulang).
4. Saat konfirmasi, server memperbarui `jumlah_terbayar`, mencatat `dikonfirmasi_pada`, dan memperbarui `status_bayar` pesanan: kalau `jumlah_terbayar >= total_bayar` menjadi `Lunas`, kalau belum penuh tetapi sudah ada yang terbayar menjadi `DP Dibayar`.
5. Pelunasan (mode DP) dilakukan dengan cara yang sama (unggah bukti lagi), atau dicatat langsung oleh admin sebagai Tunai di Tempat.

Bukti bayar disimpan di bucket **privat** dan ditampilkan lewat signed URL yang dibuat di server, hanya untuk admin dan pemilik pesanan.

## Status Pesanan dan Status Bayar

Dua status **terpisah** supaya tidak bingung:

**Status bayar** (kolom `status_bayar`): `Belum Bayar` → `DP Dibayar` → `Lunas`

**Status pesanan** (kolom `status_pesanan`):

```
Menunggu Pembayaran → Diterima → Sedang Dibuat → Siap
                                                  ├─ Ambil di Tempat → Selesai
                                                  └─ Kirim → Dikirim → Selesai
Dibatalkan (hanya sebelum Sedang Dibuat)
```

| Perubahan                          | Siapa              | Syarat                                                             |
| ---------------------------------- | ------------------ | ------------------------------------------------------------------ |
| Menunggu Pembayaran → Diterima     | Otomatis oleh server | Pembayaran pertama (DP atau lunas) dikonfirmasi admin             |
| Diterima → Sedang Dibuat           | Admin atau staf    | -                                                                  |
| Sedang Dibuat → Siap               | Admin atau staf    | -                                                                  |
| Siap → Dikirim                     | Admin              | Pengambilan = Kirim dan status bayar = Lunas                       |
| Siap → Selesai                     | Admin              | Pengambilan = Ambil di Tempat dan status bayar = Lunas             |
| Dikirim → Selesai                  | Admin              | -                                                                  |
| → Dibatalkan                       | Admin              | Status masih Menunggu Pembayaran atau Diterima; wajib isi alasan   |
| Menunggu Pembayaran → Dibatalkan   | Otomatis (cron)    | Lebih dari `batas_bayar_jam` sejak pesanan dibuat dan belum ada bayar |

- Server menolak perubahan status di luar tabel di atas dengan pesan jelas (contoh: "Pesanan belum lunas, tidak bisa diselesaikan").
- Setiap perubahan status dicatat di tabel `riwayat_pesanan` (siapa, kapan, dari status apa ke status apa).
- Kebijakan DP hangus atau dikembalikan saat pesanan dibatalkan diatur oleh pemilik toko di luar sistem. Sistem hanya mencatat alasan pembatalan.
- Pelanggan melihat status pesanannya sebagai garis waktu di `/pesanan-saya/[kode]`.

**Pembatalan otomatis:** endpoint `/api/cron/batalkan-pesanan` dipanggil oleh Vercel Cron (diatur di `vercel.json`, cukup sekali sehari). Endpoint wajib memeriksa header `Authorization: Bearer {CRON_SECRET}` dan menolak kalau tidak cocok.

## Pengiriman

Dua pilihan cara penerimaan: `Ambil di Tempat` atau `Kirim`.
- **Ambil di Tempat**: tanpa alamat dan ongkir = Rp 0. Kolom lokasi tujuan kosong. Jam ambil dipilih pelanggan.
- **Kirim**: ongkir dihitung otomatis dari jarak toko ke titik pengantaran pelanggan:
  - Pelanggan menandai titik pengantaran pada peta interaktif Leaflet (`components/PetaLokasi.js`) dan mengisi alamat lengkap beserta patokan.
  - Jarak lurus dihitung menggunakan rumus Haversine, lalu dikalikan `faktor_jalan` toko (default 1.3) dan dibulatkan ke atas ke 0,1 km (`lib/ongkir.js`).
  - Tarif dicocokkan dengan tabel `tarif_jarak` aktif pada jarak terdekat yang masih mencakup jarak pengiriman (batas atas inklusif).
  - Jika jarak melebihi batas tarif tertinggi atau `maks_jarak_kirim_km`, status menjadi `diluarJangkauan` dan sistem menolak pengiriman dengan pesan jelas.
  - Jika titik lokasi toko atau tarif aktif belum diatur, status menjadi `tokoBelumDiatur` dan opsi Kirim disembunyikan.
  - Server pada `POST /api/checkout` selalu menghitung ulang jarak dan ongkir secara independen, mengabaikan angka dari browser.
- **Zona Ongkir Lama (`zona_ongkir`)**: hanya digunakan untuk form pesanan versi lama (`/pesan`) dan tetap dipertahankan untuk kompatibilitas ke belakang tanpa merusak alur lama.

## Database

Dibuat lewat **file SQL di `supabase/migrations/`** dan data awal lewat `seed.sql`. Nama tabel dan kolom memakai Bahasa Indonesia, huruf kecil, dipisah garis bawah. Primary key `id` (uuid untuk `profil`, bigint identity untuk tabel lain). Kolom status memakai `text` dengan nilai tetap seperti di dokumen ini. **Row Level Security (RLS) aktif di semua tabel.**

**Aturan Migrasi & Seed:**
- **Migration Baru**: Dilarang mengubah file migration lama. Catat file migration baru (misal `00005_tambah_slogan_dan_dikonfirmasi_pada.sql`) untuk kolom tambahan:
  - `pengaturan_toko.slogan` (`text`, boleh kosong)
  - `pembayaran.dikonfirmasi_pada` (`timestamptz`, diisi saat admin mengonfirmasi pembayaran, boleh kosong)
- **Data Awal (`supabase/seed.sql`)**:
  - `pengaturan_toko`: `nama_toko` disetel `"Cravely Bakery"`, `slogan` disetel `"Buat hari lebih manis dengan kue terbaik kami ♡"`.
  - `grup_opsi` & `opsi_item`: memiliki grup opsi `"Jenis Kue"` (wajib `true`, jenis_pilihan `'satu'`, peran_visual `'badan'`, urutan 1) yang berisi item: `"Custom Cake"`, `"Regular Cake"`, dan `"Cupcake"`.

### profil
`id` (uuid, sama dengan `auth.users.id`), `nama`, `no_wa`, `role` (`admin` / `staf` / `pelanggan`, default `pelanggan`), `aktif` (boolean, default true), `dibuat_pada`. Dibuat otomatis lewat trigger saat ada pendaftaran baru di `auth.users`.

### pengaturan_toko
### pengaturan_toko
Satu baris saja (id selalu 1): `nama_toko`, `slogan` (teks tagline toko), `alamat`, `no_wa`, `jam_operasional`, `jam_buka`, `jam_tutup`, `jam_buka_senin_jumat`, `jam_tutup_senin_jumat`, `jam_buka_sabtu_minggu`, `jam_tutup_sabtu_minggu`, `email`, `instagram`, `tautan_peta`, `deskripsi_footer`, `kuota_harian` (default 5), `minimal_hari_pesan` (default 2), `minimal_hari_siap` (default 1), `minimal_hari_katalog` (default 1), `mode_pembayaran` (`DP` / `Lunas`, default `DP`), `persen_dp` (default 50), `batas_bayar_jam` (default 24), `nama_bank`, `no_rekening`, `atas_nama`, `gambar_qris`, `lat_toko` (numeric, boleh kosong), `lng_toko` (numeric, boleh kosong), `faktor_jalan` (numeric default 1.3), `maks_jarak_kirim_km` (numeric default 20).

### kategori_produk
Kategori produk kue katalog: `id` (bigint identity), `nama` (text, unik), `urutan` (integer, default 0), `aktif` (boolean, default true). RLS: publik membaca kategori aktif, admin mengelola penuh.

### produk
Kue katalog siap pesan: `id` (bigint identity), `nama`, `id_kategori` (FK `kategori_produk` on delete set null), `deskripsi`, `komposisi`, `porsi`, `label_teks`, `unggulan` (boolean, default false), `harga` (integer, rupiah), `foto` (text, path di bucket publik), `aktif` (boolean, default true), `urutan` (integer, default 0), `dibuat_pada`. RLS: publik membaca produk aktif, admin mengelola penuh.

### keranjang_item
Keranjang belanja terpadu di database: `id` (bigint identity), `id_pelanggan` (uuid FK `profil` on delete cascade), `jenis` (`'Custom'` atau `'Katalog'`), `id_produk` (bigint FK `produk` on delete cascade, boleh kosong), `jumlah` (integer default 1, 1-20), `pilihan` (jsonb daftar `{id_item, jumlah}`), `tulisan_kue`, `catatan`, `desain_json` (jsonb), `foto_preview`, `foto_bentuk_kustom`, `foto_gambar_kustom` (path text), `dibuat_pada`. Check: jenis Katalog wajib punya `id_produk`; jenis Custom wajib punya `pilihan` dan `jumlah = 1`. Maksimal 20 baris per pelanggan, maksimal 10 kue custom. RLS: pelanggan membaca dan menghapus barisnya sendiri.

### pesanan_item
Rincian item dalam pesanan: `id` (bigint identity), `id_pesanan` (bigint FK `pesanan` on delete cascade), `jenis` (`'Custom'` atau `'Katalog'`), `id_produk` (bigint FK `produk` on delete set null), `nama_item` dan `harga_satuan` (salinan saat checkout; untuk Custom `harga_satuan = total kue itu`), `jumlah` (integer default 1), `subtotal` (integer), `tulisan_kue`, `catatan`, `desain_json` (jsonb), `foto_preview`, `foto_bentuk_kustom`, `foto_gambar_kustom`, `urutan` (integer default 1). RLS: pelanggan membaca item miliknya.

### tarif_jarak
Tarif ongkos kirim bertingkat berbasis radius jarak: `id` (bigint identity), `jarak_maks_km` (numeric > 0, unik), `tarif` (integer >= 0), `aktif` (boolean, default true). RLS: publik membaca tarif aktif, admin mengelola penuh.

### grup_opsi
`id`, `nama`, `urutan`, `wajib` (boolean), `jenis_pilihan` (`satu` / `banyak`), `peran_visual` (`badan` / `ukuran` / `krim` / `topping` / `bentuk` / `stiker` / kosong), `peran_dashboard` (`jenis` / `terlaris` / null, eksklusif).

### opsi_item
`id`, `id_grup` (FK), `nama`, `harga` (integer, rupiah), `aktif` (boolean, default true), `urutan`, `warna` (hex, boleh kosong), `kode_visual` (boleh kosong).

### zona_ongkir
`id`, `nama`, `tarif` (integer), `aktif` (boolean). Catatan: tabel ini khusus digunakan untuk `/pesan` versi lama; alur baru `/checkout` menggunakan `tarif_jarak` dan koordinat peta.

### tanggal_tutup
`id`, `tanggal` (date, unik), `alasan`.

### pesanan
`id`, `nomor` (bigint identity, unik), `kode_pesanan` (unik, contoh `KUE-0012`, dibuat dari `nomor` dengan `padStart(4, "0")`), `id_pelanggan` (FK `profil`), `nama_penerima`, `no_wa`, `tulisan_kue`, `catatan`, `foto_referensi` (path di Storage, boleh kosong), `foto_preview`, `foto_bentuk_kustom`, `foto_gambar_kustom` (boleh kosong), `desain_json` (jsonb, boleh kosong), `tanggal_ambil` (date), `jam_ambil` (time), `metode_pengiriman` (`Ambil` / `Kirim`), `alamat` (boleh kosong), `id_zona` (FK, boleh kosong, hanya diisi `/pesan` lama), `lat_tujuan` (numeric, titik koordinat pengantaran), `lng_tujuan` (numeric), `jarak_km` (numeric, jarak jalan terhitung dalam km), `ongkir` (integer, default 0), `total_kue`, `total_bayar`, `persen_dp_saat_pesan` (boleh kosong untuk mode Lunas), `jumlah_dp`, `jumlah_terbayar` (default 0), `status_pesanan` (default `Menunggu Pembayaran`), `status_bayar` (default `Belum Bayar`), `alasan_batal` (boleh kosong), `stok_dipotong_pada` (timestamptz, boleh kosong), `dibuat_pada`.

### pesanan_pilihan
Salinan pilihan saat pesan: `id`, `id_pesanan` (FK), `id_pesanan_item` (bigint FK `pesanan_item` on delete cascade, boleh kosong), `id_item` (bigint FK ke `opsi_item(id)` on delete set null, boleh kosong), `id_grup` (bigint FK ke `grup_opsi(id)` on delete set null), `nama_grup`, `nama_item`, `harga`, `jumlah` (integer, default 1), `warna`, `kode_visual`, `peran_visual`.

### resep_item
Komposisi bahan untuk opsi kue: `id`, `id_item` (FK `opsi_item` on delete cascade), `id_bahan` (FK `bahan` on delete cascade), `jumlah` (numeric > 0), unik per `(id_item, id_bahan)`.

### riwayat_stok
Catatan pergerakan inventaris bahan: `id`, `id_bahan` (FK `bahan` on delete cascade), `perubahan` (numeric), `stok_setelah` (numeric), `jenis` (`Masuk` / `Keluar` / `Koreksi` / `Pesanan` / `Pengembalian`), `id_pesanan` (FK `pesanan` on delete set null), `keterangan`, `id_user` (FK `profil`), `dibuat_pada`.

### pembayaran
`id`, `id_pesanan` (FK), `jenis` (`DP` / `Pelunasan` / `Lunas`), `jumlah`, `metode` (`Transfer Bank` / `QRIS` / `Tunai di Tempat`), `bukti` (path di Storage, boleh kosong untuk tunai), `status` (`Menunggu Konfirmasi` / `Dikonfirmasi` / `Ditolak`), `id_pengonfirmasi` (FK `profil`, boleh kosong), `dikonfirmasi_pada` (timestamptz, diisi saat admin mengonfirmasi pembayaran, zona waktu `Asia/Jakarta`/UTC), `dibuat_pada`.

### bahan
`id`, `nama`, `satuan` (contoh `kg`, `butir`), `jumlah` (numeric), `batas_minimum` (numeric).

### riwayat_pesanan
`id`, `id_pesanan` (FK), `keterangan` (contoh `Diterima → Sedang Dibuat`), `id_user` (FK `profil`, boleh kosong untuk aksi otomatis), `dibuat_pada`.

### Storage (Supabase)
- `referensi-kue` (privat): foto snapshot 3D preview, bentuk kustom, dan gambar kustom. Diunggah ke path `keranjang/{id_pelanggan}/...` saat masih di keranjang, lalu dipindahkan ke `pesanan/{kode_pesanan}/...` saat checkout.
- `bukti-bayar` (privat): bukti transfer pelanggan
- `publik` (publik): gambar QRIS toko dan foto produk kue katalog (`produk/...`)

## Alur Keranjang dan Checkout Terpadu

Semua kue (kue katalog siap pesan dan kue custom studio) masuk ke dalam SATU keranjang dan dibayar bersamaan dalam SATU pesanan.

1. **Penyimpanan Keranjang**:
   - Keranjang disimpan di database pada tabel `keranjang_item`, bukan di browser/localStorage.
   - Login wajib saat menambah ke keranjang. Tamu diarahkan ke `/masuk?ke=...`.
   - Kue katalog: jumlah 1 sampai 20. Jika produk yang sama ditambah lagi, jumlahnya digabung otomatis.
   - Kue custom studio: 1 desain = 1 kue (jumlah selalu 1), tidak bisa diedit di keranjang, hanya bisa dihapus.
   - Batas maksimal: 20 baris keranjang dan 10 kue custom per pelanggan.

2. **Aturan Checkout**:
   - Satu tanggal dan jam untuk seluruh pesanan. Tanggal minimal = yang paling lama dari seluruh item di keranjang (kue custom memakai `minimal_hari_pesan`, kue katalog memakai `minimal_hari_katalog`).
   - Kuota harian dapur dihitung per kue custom. Pesanan yang hanya berisi kue katalog tidak memakai kuota harian.
   - Ongkos kirim dihitung dari tarif jarak berundak (`tarif_jarak`) berdasarkan radius dan faktor jalan. Zona ongkir lama dipertahankan untuk kompatibilitas `/pesan`. Rp 0 untuk Ambil di Toko.
   - Mode DP: DP hanya dihitung dari subtotal kue Custom. Kue katalog dan ongkir dibayar penuh 100% di awal.
   - Metode pembayaran hanya Transfer Bank atau QRIS. Tunai di Tempat hanya untuk pelunasan saat ambil di toko.
   - Saat checkout berhasil: file foto dipindahkan dari `keranjang/{id_pelanggan}/` ke `pesanan/{kode_pesanan}/`, data pesanan disimpan ke `pesanan`, `pesanan_item`, `pesanan_pilihan`, dan keranjang dikosongkan. Jika ada kegagalan, rollback dilakukan dan keranjang tidak dikosongkan.

3. **Pembersihan Otomatis**:
   - Cron job `/api/cron/bersihkan-keranjang` menghapus item keranjang yang tidak dicheckout lebih dari 30 hari beserta berkasnya di Storage.

## Kontrak POST /api/keranjang (Untuk Studio Custom Cake)

Endpoint untuk memasukkan kue kustom studio ke keranjang terpadu.

- **URL**: `/api/keranjang`
- **Metode**: `POST`
- **Header**: Wajib login (session cookie Supabase).
- **Format Body**: `multipart/form-data`
  - `jenis`: `"Custom"` (string wajib)
  - `pilihan`: JSON string berupa daftar item opsi terpilih, format: `[{"id_item": 1, "jumlah": 1}, ...]`
  - `tulisan_kue`: string teks tulisan di atas kue (opsional)
  - `catatan`: string catatan khusus pemesan (opsional)
  - `desain_json`: JSON string struktur desain 3D (template, stiker, teks dekorasi)
  - `foto_preview`: File gambar (JPG/PNG, max 2 MB) hasil snapshot 3D kue
  - `foto_bentuk_kustom`: File gambar (JPG/PNG, max 2 MB) jika memilih opsi bentuk kustom
  - `foto_gambar_kustom`: File gambar (JPG/PNG, max 2 MB) jika memilih opsi gambar kustom
- **Respon Sukses (200)**:
  `{ "sukses": true, "pesan": "Kue custom berhasil ditambahkan ke keranjang.", "id_item": 123 }`
- **Respon Error (400/401/409)**:
  `{ "pesan": "Pesan error bahasa Indonesia" }`

Unggahan lewat Route Handler (`FormData`), validasi jenis `jpg`/`jpeg`/`png` dan ukuran maksimal 2 MB, nama file dibuat unik. File lama dihapus saat diganti.

## Keamanan

- **Semua penulisan data (insert, update, delete) lewat Route Handler** yang memeriksa login dan role di server, lalu memakai service role. Browser tidak menulis langsung ke tabel.
- RLS: tabel katalog (`grup_opsi`, `opsi_item` yang aktif, `zona_ongkir` yang aktif, `tanggal_tutup`, dan kolom yang aman dari `pengaturan_toko`) boleh dibaca publik. Pelanggan hanya boleh membaca pesanan, pilihan, dan pembayaran **miliknya sendiri**. Data lain hanya lewat server.
- **Harga selalu dihitung ulang di server.** Nilai `total`, `ongkir`, `jumlah_dp`, `status_bayar`, dan `status_pesanan` dari browser diabaikan.
- Pelanggan selalu dicek kepemilikannya sebelum melihat atau mengunggah ke pesanan tertentu (`id_pelanggan` harus sama dengan user yang login).
- Pesan error teknis (exception) tidak boleh ditampilkan mentah ke pengguna. Tampilkan pesan Bahasa Indonesia yang umum.
- Hapus data selalu dengan konfirmasi (`confirm()`). Data yang masih dipakai (contoh zona ongkir yang dipakai pesanan) tidak boleh menimbulkan error mentah. Tolak dengan pesan jelas atau sarankan menonaktifkan.
- Password dikelola Supabase Auth, tidak pernah disimpan atau dicatat di kode atau log.
- `SUPABASE_SERVICE_ROLE_KEY` dan `CRON_SECRET` hanya di environment variable server.

## Aturan Tabel dan Form

- Tabel: `w-full text-left text-sm`, header `bg-stone-100 text-stone-700 uppercase text-xs`, kontainer `overflow-x-auto`, pagination 10 baris.
- Data kosong: tampilkan pesan ramah ("Belum ada pesanan"), jangan tampilkan tabel kosong.
- Setelah simpan atau hapus, tampilkan pesan lewat **modal pesan** (judul **Berhasil** atau **Informasi**, tombol **Mengerti**). Error validasi ditampilkan sebagai kotak merah (`bg-rose-50 text-rose-700 rounded-xl`) berisi daftar pesan.
- Tombol yang sedang memproses dinonaktifkan supaya tidak terkirim dua kali (penting untuk pembuatan pesanan dan unggah bukti).
- Angka uang selalu diformat rupiah lewat `formatRupiah` di `lib/format.js`. Tanggal selalu diformat lewat fungsi di file yang sama dengan zona `Asia/Jakarta`.

## Urutan Pengerjaan Modul

Kerjakan bertahap. Setelah tiap tahap, pastikan project bisa dijalankan (`npm run dev`) dan build (`npm run build`) tanpa error sebelum lanjut.

1. **Fondasi**: buat project Next.js + Tailwind, hubungkan Supabase, semua file migration dan `seed.sql`, trigger `profil`, bucket Storage, `lib/` dasar (client, format, cek role).
2. **Autentikasi dan kerangka**: halaman masuk dan daftar, `middleware.js`, layout dashboard dengan sidebar per role, modal pesan, akun admin pertama.
3. **Admin: Katalog & Opsi dan Pengaturan**: grup dan item opsi, produk katalog, pengaturan toko, zona ongkir, tanggal tutup.
4. **Preview kue**: komponen `PreviewKue` (versi SVG 2D) dan uji dengan data opsi dari seed.
5. **Alur pemesanan pelanggan**: kustomisasi, tanggal dan kuota, pengiriman, perhitungan harga di server, pembuatan pesanan, tiket QR.
6. **Pembayaran**: unggah bukti, konfirmasi admin, mode DP atau Lunas, status bayar.
7. **Pesanan di dashboard**: daftar, detail, alur status, tampilan terbatas untuk staf, riwayat.
8. **Stok** dan **Dashboard** admin dan staf.
9. **Laporan**: periode, ringkasan, cetak, export CSV.
10. **Landing page**: scroll-storytelling dengan GSAP dan ilustrasi SVG (dikerjakan setelah fitur inti jalan).
11. **Penutup**: Vercel Cron pembatalan otomatis, `vercel.json`, uji alur lengkap dari pesan sampai selesai, deploy ke Vercel.

## Catatan Penting

- Struktur tabel hanya lewat file migration. Kalau perlu kolom baru, buat file migration baru, jangan ubah file migration lama yang sudah dijalankan.
- Semua teks, pesan, dan label dalam Bahasa Indonesia.
- Data toko (nama, alamat, rekening, QRIS, nomor WhatsApp) diisi lewat Pengaturan, jangan ditulis langsung di kode.
- Paket gratis Vercel (Hobby) sepengetahuan saya ditujukan untuk penggunaan non-komersial. Kalau website dipakai UMKM sungguhan yang berjualan, cek ketentuan dan paket terbaru Vercel dan Supabase terlebih dahulu.
- **Belum dikerjakan (ditunda, jangan ditambahkan kecuali diminta):** payment gateway otomatis (Midtrans/Xendit), notifikasi WhatsApp atau email otomatis, pengurangan stok otomatis berdasarkan resep, galeri dan testimoni, scan QR tiket oleh admin, login tanpa email (Google), kupon dan promo, banyak cabang, ubah pesanan oleh pelanggan setelah dibuat, ekspor Excel (.xlsx), aplikasi mobile.