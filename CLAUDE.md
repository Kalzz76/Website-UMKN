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
12. Library yang diizinkan hanya: `next`, `react`, `react-dom`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `gsap` (animasi scroll di landing), dan `qrcode` (membuat QR tiket). Library lain, termasuk Three.js, tanya dulu.
13. Fitur yang tidak ada di `CLAUDE.md` ini tidak boleh ditambahkan hanya karena ada di referensi. Referensi dipakai untuk **tampilan**, bukan untuk menambah fitur.

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
- **Tampilan**: Tailwind CSS (lewat npm, bukan CDN) + Font Awesome 6.4 (CDN) + font Plus Jakarta Sans (`next/font/google`)
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
```

`SUPABASE_SERVICE_ROLE_KEY` **hanya boleh dipakai di kode server** (Route Handler dan server component). Dilarang di-import dari file yang memakai `"use client"`, dan dilarang diberi awalan `NEXT_PUBLIC_`. File `.env.local` tidak ikut di-commit.

## Struktur Project

```
toko-kue/
├── app/
│   ├── layout.js
│   ├── page.js                          landing page publik
│   ├── pesan/page.js                    alur pemesanan bertahap
│   ├── masuk/page.js
│   ├── daftar/page.js
│   ├── pesanan-saya/page.js             daftar pesanan pelanggan
│   ├── pesanan-saya/[kode]/page.js      detail, status, tiket QR
│   ├── dashboard/
│   │   ├── layout.js                    sidebar sesuai role
│   │   ├── page.js                      ringkasan
│   │   ├── harga-opsi/page.js           admin
│   │   ├── pesanan/page.js              admin + staf
│   │   ├── pesanan/[kode]/page.js       admin + staf
│   │   ├── stok/page.js                 admin + staf
│   │   ├── laporan/page.js              admin
│   │   ├── pengaturan/page.js           admin
│   │   └── akun/page.js                 admin
│   └── api/
│       ├── pesanan/route.js             buat pesanan (harga dihitung di server)
│       ├── pesanan/[kode]/status/route.js
│       ├── pembayaran/route.js          unggah bukti bayar
│       ├── pembayaran/[id]/route.js     konfirmasi atau tolak
│       ├── opsi/route.js                simpan grup dan item opsi
│       ├── stok/route.js
│       ├── pengaturan/route.js
│       ├── akun/route.js
│       └── cron/batalkan-pesanan/route.js
├── components/                          PreviewKue.js, WizardPesan.js, BadgeStatus.js, dll
├── lib/                                 supabaseBrowser.js, supabaseServer.js, format.js, cekRole.js
├── middleware.js                        arahkan yang belum login dari /dashboard dan /pesanan-saya
├── supabase/
│   ├── migrations/                      file .sql berurutan
│   └── seed.sql
├── public/
├── referensi-desain/                    tidak ikut di-deploy
└── vercel.json                          jadwal cron
```

## Role dan Hak Akses

| Menu / Fitur                                          | Admin | Staf Produksi | Pelanggan |
| ----------------------------------------------------- | :---: | :-----------: | :-------: |
| Lihat landing page, kustomisasi, dan preview          | Ya    | Ya            | Ya        |
| Membuat pesanan, bayar, lihat pesanan sendiri         | Tidak | Tidak         | Ya        |
| Harga & Opsi                                          | Ya    | Tidak         | Tidak     |
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

| Elemen                         | Kelas Tailwind                                                           |
| ------------------------------ | ------------------------------------------------------------------------ |
| Latar halaman                  | `bg-amber-50`, teks `text-stone-800`                                     |
| Navbar publik (melayang)       | `bg-white/90 backdrop-blur rounded-full shadow-sm`, `sticky top-4`       |
| Tombol utama                   | `bg-rose-600 hover:bg-rose-500 text-white rounded-full font-semibold`    |
| Tombol sekunder                | `bg-white border border-stone-200 text-stone-700 rounded-full`           |
| Headline                       | `font-extrabold text-stone-900`, baris kedua `text-rose-600`             |
| Card                           | `bg-white rounded-3xl shadow-sm border border-stone-100 p-6`             |
| Sidebar dashboard              | `bg-stone-900 text-stone-300`, menu aktif `bg-rose-600 text-white`, hover `hover:bg-stone-800` |
| Header tabel                   | `bg-stone-100 text-stone-700 uppercase text-xs`, baris `divide-y divide-stone-100` |
| Input                          | `px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400` |
| Modal                          | overlay `bg-stone-950/60 backdrop-blur-sm`, kotak `bg-white rounded-3xl p-8` |
| Tombol hapus / batalkan        | `text-rose-600` atau `bg-rose-50 text-rose-600`                          |

**Badge status pesanan:** Menunggu Pembayaran `bg-stone-100 text-stone-700`, Diterima `bg-sky-100 text-sky-800`, Sedang Dibuat `bg-amber-100 text-amber-800`, Siap `bg-emerald-100 text-emerald-800`, Dikirim `bg-indigo-100 text-indigo-800`, Selesai `bg-green-100 text-green-800`, Dibatalkan `bg-rose-100 text-rose-800`.

**Badge status bayar:** Belum Bayar `bg-rose-100 text-rose-800`, DP Dibayar `bg-amber-100 text-amber-800`, Lunas `bg-emerald-100 text-emerald-800`.

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

Pop-up atau halaman bertahap dengan panel ringkasan di sisi kiri (preview kue + total berjalan) dan langkah di kanan:

1. **Kustomisasi**: tiap grup opsi tampil sebagai langkah atau bagian (Rasa, Ukuran, Krim, Topping, dst, sesuai data admin). Preview kue berubah langsung dan total harga ikut berubah. Ada kolom **Tulisan di Kue**, **Catatan**, dan unggah **Foto Referensi** (opsional).
2. **Tanggal & Pengambilan**: pilih tanggal (hanya tanggal yang tersedia), pilih jam, pilih **Ambil di Tempat** atau **Kirim**. Kalau Kirim: isi alamat dan pilih zona ongkir.
3. **Data Penerima**: nama, nomor WhatsApp (terisi otomatis dari profil kalau sudah ada).
4. **Ringkasan & Pembayaran**: rincian harga, ongkir, total, jumlah yang harus dibayar sekarang (DP atau lunas, sesuai pengaturan), pilihan metode pembayaran, dan petunjuk bayar.
5. **Tiket Pesanan**: kode pesanan + QR, status, dan tombol unggah bukti bayar.

- Pelanggan boleh mencoba kustomisasi **tanpa login**. Pilihannya disimpan sementara di `sessionStorage`. Saat menekan **Pesan**, kalau belum login arahkan ke `/masuk`, lalu kembali ke `/pesan` dengan pilihan yang masih tersimpan.
- Tanggal yang tersedia: minimal `minimal_hari_pesan` hari dari hari ini (zona Jakarta), tidak termasuk tanggal di tabel `tanggal_tutup`, dan tidak termasuk tanggal yang jumlah pesanan aktifnya sudah mencapai `kuota_harian`. Pesanan berstatus **Dibatalkan** tidak dihitung ke kuota. **Pengecekan ini diulang di server saat pesanan dibuat.**
- Jam yang bisa dipilih dibuat per jam dari `jam_buka` sampai `jam_tutup`.
- Setelah pesanan dibuat, pelanggan **tidak bisa mengubah** komponen kue. Perubahan lewat chat WhatsApp ke toko, lalu admin membatalkan dan pelanggan memesan ulang kalau perlu.

## Preview Kue

Komponen `components/PreviewKue.js` menerima daftar pilihan (nama grup, nama item, warna, kode visual, peran visual) dan teks tulisan, lalu menggambar kue dengan **SVG berlapis**. Komponen yang sama dipakai di alur pemesanan, detail pesanan admin dan staf, dan tiket pelanggan.

Setiap grup opsi punya `peran_visual`, setiap item opsi punya `warna` dan `kode_visual`:

| peran_visual | Efek pada gambar                                                                |
| ------------ | ------------------------------------------------------------------------------- |
| `badan`      | Warna badan kue diambil dari `warna` item (contoh rasa coklat: coklat tua, strawberry: merah muda) |
| `ukuran`     | `kode_visual` (`kecil`, `sedang`, `besar`) mengatur skala dan jumlah tingkat kue |
| `krim`       | Warna lapisan krim di atas dan sisi kue dari `warna` item                       |
| `topping`    | `kode_visual` memilih bentuk SVG yang ditempel di atas kue (contoh `strawberry`, `coklat_chip`, `buah`, `lilin`) |
| kosong       | Tidak mempengaruhi gambar (hanya mempengaruhi harga)                            |

- Teks **Tulisan di Kue** ditampilkan di atas permukaan kue.
- Kalau `kode_visual` tidak dikenal komponen, abaikan tanpa error (kue tetap tampil).
- Preview ini **2D berlapis, bukan 3D**. Three.js tidak dipakai dan tidak boleh ditambahkan kecuali diminta. Komponen dibuat menerima props yang sama supaya bisa diganti versi 3D nanti.

## Dashboard (`/dashboard`)

Layout `app/dashboard/layout.js`: sidebar kiri (di HP menjadi menu di atas) berisi nama toko, daftar menu sesuai role, dan tombol **Keluar**.

**Menu Admin:** Dashboard, Harga & Opsi, Pesanan, Stok, Laporan, Pengaturan, Akun.
**Menu Staf Produksi:** Dashboard, Pesanan, Stok.

**Dashboard (admin):** kartu jumlah pesanan hari ini, pesanan yang belum dibayar, pesanan menunggu konfirmasi bayar, omzet bulan ini, dan peringatan stok menipis. Di bawahnya daftar pesanan terdekat (urut tanggal ambil/kirim).
**Dashboard (staf):** hanya daftar kue yang harus dibuat (status Diterima dan Sedang Dibuat) diurut tanggal dan jam terdekat, plus peringatan stok menipis. Tanpa angka uang.

### Menu Harga & Opsi (satu menu untuk semua pengaturan harga)

Satu halaman, isinya **grup opsi**, dan tiap grup punya daftar item beserta harganya. Tidak ada menu terpisah untuk rasa, ukuran, dan lainnya.

```
Rasa      : Strawberry 40.000 | Coklat 40.000 | Vanilla 35.000   [+ item]
Ukuran    : Kecil 80.000 | Medium 150.000 | Besar 250.000        [+ item]
Krim      : ...
Topping   : ...
                                                                 [+ grup]
```

- Tiap **grup** punya: nama, urutan, `wajib` (pelanggan harus memilih), `jenis_pilihan` (`satu` atau `banyak`), dan `peran_visual`. Grup bisa ditambah, diubah, dan dihapus oleh admin.
- Tiap **item** punya: nama, harga, `aktif` (nonaktif berarti tidak muncul untuk pelanggan, misalnya bahan lagi habis), urutan, `warna` (kode hex, untuk preview), dan `kode_visual`.
- Grup dan item memakai tombol **Tambah, Edit, Hapus** lewat modal. Hapus memakai konfirmasi.
- Grup atau item yang sudah dipakai pesanan boleh dihapus karena pesanan menyimpan salinan (lihat aturan harga). Tapi sarankan **nonaktifkan** lewat pesan konfirmasi.
- Jenis kue (ulang tahun, wedding, cupcake, hampers) cukup dibuat sebagai salah satu **grup opsi** (contoh grup "Jenis Kue" dengan harga dasar). Tidak ada tabel produk terpisah.

**Aturan harga (WAJIB):**
- **Total dihitung di server**, bukan di browser. Browser boleh menghitung untuk tampilan, tetapi saat pesanan dibuat server menghitung ulang dari database dan mengabaikan harga dari browser.
- Total kue = jumlah harga semua item terpilih. Server menolak kalau: ada item yang tidak aktif atau tidak ada, grup `wajib` belum dipilih, atau grup `jenis_pilihan = satu` berisi lebih dari satu item.
- Total bayar = total kue + ongkir (kalau dikirim). Ongkir diambil dari tabel `zona_ongkir`, bukan dari input browser.
- **Nama, harga, warna, dan kode visual tiap item disalin ke `pesanan_pilihan` saat pesanan dibuat.** Mengubah harga di Harga & Opsi tidak boleh mengubah pesanan yang sudah ada.

### Menu Pesanan

**Daftar** (admin dan staf): kolom Kode, Nama Pelanggan, Tanggal & Jam, Pengambilan (Ambil / Kirim), Status Pesanan (badge), Status Bayar (badge, hanya admin). Filter status, filter tanggal, dan pencarian (`?cari=` kode atau nama). Urut default: tanggal ambil/kirim terdekat. Pagination 10 baris.

**Detail pesanan** (`/dashboard/pesanan/[kode]`):
- **Preview kue** dari pilihan pelanggan
- **Komponen** yang dipilih (grup, item), tulisan di kue, catatan, foto referensi
- **Rincian harga** per komponen, ongkir, total, jumlah DP, jumlah terbayar, sisa (admin saja)
- **Pembayaran**: daftar pembayaran (jenis, jumlah, metode, bukti, status) dengan tombol **Konfirmasi** dan **Tolak** (admin saja)
- **Pengiriman**: Ambil di Tempat, atau Kirim beserta alamat dan zona
- **Status**: tombol aksi sesuai role dan aturan alur di bawah
- **Riwayat**: garis waktu perubahan status (siapa, kapan)

### Menu Stok

Daftar bahan (tepung, telur, coklat, krim, dst): kolom Nama Bahan, Jumlah, Satuan, Batas Minimum, Status. Bahan yang `jumlah <= batas_minimum` ditandai peringatan (badge merah "Menipis") dan muncul di Dashboard. Admin dan staf bisa **menambah atau mengurangi jumlah** (modal berisi jumlah +/-). Hanya admin yang bisa menambah, mengubah nama/satuan/batas, dan menghapus bahan.

Stok **tidak berkurang otomatis** dari pesanan. Pengurangan stok otomatis berdasarkan resep ditunda (lihat "Belum dikerjakan").

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
- **Info toko**: nama toko, alamat, nomor WhatsApp, jam operasional (teks)
- **Jadwal pemesanan**: `jam_buka`, `jam_tutup`, `kuota_harian` (jumlah pesanan aktif per tanggal), `minimal_hari_pesan` (default 2)
- **Pembayaran**: `mode_pembayaran` (`DP` atau `Lunas`), `persen_dp` (default 50), `batas_bayar_jam` (default 24), nama bank + nomor rekening + atas nama, unggah gambar QRIS
- **Zona ongkir**: tabel zona (nama zona, tarif, aktif) dengan Tambah, Edit, Hapus
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
3. Admin memeriksa bukti, lalu menekan **Konfirmasi** (status `Dikonfirmasi`) atau **Tolak** (status `Ditolak`, pelanggan bisa unggah ulang).
4. Saat konfirmasi, server memperbarui `jumlah_terbayar` dan `status_bayar` pesanan: kalau `jumlah_terbayar >= total_bayar` menjadi `Lunas`, kalau belum penuh tetapi sudah ada yang terbayar menjadi `DP Dibayar`.
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

Dua pilihan di pesanan: `Ambil di Tempat` atau `Kirim`.
- **Ambil di Tempat**: tanpa alamat dan tanpa ongkir. Jam ambil dipilih pelanggan.
- **Kirim**: pelanggan mengisi alamat lengkap dan memilih **zona ongkir** dari daftar di Pengaturan. Ongkir dihitung dari tarif zona itu. Kalau tidak ada zona yang aktif, pilihan Kirim disembunyikan.

## Database

Dibuat lewat **file SQL di `supabase/migrations/`** dan data awal lewat `seed.sql`. Nama tabel dan kolom memakai Bahasa Indonesia, huruf kecil, dipisah garis bawah. Primary key `id` (uuid untuk `profil`, bigint identity untuk tabel lain). Kolom status memakai `text` dengan nilai tetap seperti di dokumen ini. **Row Level Security (RLS) aktif di semua tabel.**

### profil
`id` (uuid, sama dengan `auth.users.id`), `nama`, `no_wa`, `role` (`admin` / `staf` / `pelanggan`, default `pelanggan`), `aktif` (boolean, default true), `dibuat_pada`. Dibuat otomatis lewat trigger saat ada pendaftaran baru di `auth.users`.

### pengaturan_toko
Satu baris saja (id selalu 1): `nama_toko`, `alamat`, `no_wa`, `jam_operasional`, `jam_buka`, `jam_tutup`, `kuota_harian` (default 5), `minimal_hari_pesan` (default 2), `mode_pembayaran` (`DP` / `Lunas`, default `DP`), `persen_dp` (default 50), `batas_bayar_jam` (default 24), `nama_bank`, `no_rekening`, `atas_nama`, `gambar_qris`.

### grup_opsi
`id`, `nama`, `urutan`, `wajib` (boolean), `jenis_pilihan` (`satu` / `banyak`), `peran_visual` (`badan` / `ukuran` / `krim` / `topping` / kosong).

### opsi_item
`id`, `id_grup` (FK), `nama`, `harga` (integer, rupiah), `aktif` (boolean, default true), `urutan`, `warna` (hex, boleh kosong), `kode_visual` (boleh kosong).

### zona_ongkir
`id`, `nama`, `tarif` (integer), `aktif` (boolean).

### tanggal_tutup
`id`, `tanggal` (date, unik), `alasan`.

### pesanan
`id`, `nomor` (bigint identity, unik), `kode_pesanan` (unik, contoh `KUE-0012`, dibuat dari `nomor` dengan `padStart(4, "0")`), `id_pelanggan` (FK `profil`), `nama_penerima`, `no_wa`, `tulisan_kue`, `catatan`, `foto_referensi` (path di Storage, boleh kosong), `tanggal_ambil` (date), `jam_ambil` (time), `metode_pengiriman` (`Ambil` / `Kirim`), `alamat` (boleh kosong), `id_zona` (FK, boleh kosong), `ongkir` (integer, default 0), `total_kue`, `total_bayar`, `persen_dp_saat_pesan` (boleh kosong untuk mode Lunas), `jumlah_dp`, `jumlah_terbayar` (default 0), `status_pesanan` (default `Menunggu Pembayaran`), `status_bayar` (default `Belum Bayar`), `alasan_batal` (boleh kosong), `dibuat_pada`.

### pesanan_pilihan
Salinan pilihan saat pesan: `id`, `id_pesanan` (FK), `nama_grup`, `nama_item`, `harga`, `warna`, `kode_visual`, `peran_visual`.

### pembayaran
`id`, `id_pesanan` (FK), `jenis` (`DP` / `Pelunasan` / `Lunas`), `jumlah`, `metode` (`Transfer Bank` / `QRIS` / `Tunai di Tempat`), `bukti` (path di Storage, boleh kosong untuk tunai), `status` (`Menunggu Konfirmasi` / `Dikonfirmasi` / `Ditolak`), `id_pengonfirmasi` (FK `profil`, boleh kosong), `dibuat_pada`.

### bahan
`id`, `nama`, `satuan` (contoh `kg`, `butir`), `jumlah` (numeric), `batas_minimum` (numeric).

### riwayat_pesanan
`id`, `id_pesanan` (FK), `keterangan` (contoh `Diterima → Sedang Dibuat`), `id_user` (FK `profil`, boleh kosong untuk aksi otomatis), `dibuat_pada`.

### Storage (Supabase)
- `referensi-kue` (privat): foto referensi pelanggan
- `bukti-bayar` (privat): bukti pembayaran
- `publik` (publik): gambar QRIS

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
3. **Admin: Harga & Opsi dan Pengaturan**: grup dan item opsi, pengaturan toko, zona ongkir, tanggal tutup.
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
- **Belum dikerjakan (ditunda, jangan ditambahkan kecuali diminta):** payment gateway otomatis (Midtrans/Xendit), notifikasi WhatsApp atau email otomatis, preview kue 3D (Three.js), pengurangan stok otomatis berdasarkan resep, galeri dan testimoni, scan QR tiket oleh admin, login tanpa email (Google), kupon dan promo, banyak cabang, ubah pesanan oleh pelanggan setelah dibuat, ekspor Excel (.xlsx), aplikasi mobile.