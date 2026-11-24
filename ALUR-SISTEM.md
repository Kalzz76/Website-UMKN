# ALUR SISTEM & SUMBER KEBENARAN BISNIS
**Cravely Bakery & Patisserie**
*Dokumen ini merupakan Sumber Kebenaran Tunggal (Single Source of Truth) untuk seluruh pengembangan dan perbaikan sistem.*

---

## 1. Struktur Item Pesanan & Siklus Status (Order Lifecycle)
* **Satu Pesanan Multi-Item**: Satu pesanan (`pesanan`) dapat berisi banyak item (`pesanan_item`) sekaligus, baik kombinasi kue **Custom** (hasil rancangan Cake Studio) maupun kue **Katalog** (produk siap pilih), yang dibayar bersamaan dalam satu transaksi pembayaran.
* **Nilai Jenis Item**: Baku menggunakan `'Custom'` dan `'Katalog'`.
* **Alur Status Pesanan Berisi Custom (atau Campuran)**:
  $$\text{Menunggu Pembayaran} \longrightarrow \text{Diterima} \longrightarrow \text{Sedang Dibuat} \longrightarrow \text{Siap} \longrightarrow \text{Dikirim / Selesai}$$
  *Pembatalan (`Dibatalkan`) hanya dapat dilakukan sebelum pesanan masuk ke tahap `Sedang Dibuat`.*
* **Alur Status Pesanan Hanya Katalog**:
  $$\text{Menunggu Pembayaran} \longrightarrow \text{Diterima} \longrightarrow \text{Siap} \longrightarrow \text{Dikirim / Selesai}$$
  *Pesanan yang seluruh isinya adalah kue katalog secara otomatis **melewati tahap `Sedang Dibuat`** karena tidak memerlukan siklus produksi dekorasi khusus di dapur.*

---

## 2. Manajemen Produk Katalog
* **Struktur Tabel**: Dikelola melalui tabel `produk` dan tabel `kategori_produk` yang diatur penuh oleh Admin.
* **Atribut Produk**:
  1. `nama`: Nama produk kue/dessert.
  2. `id_kategori`: Relasi foreign key ke tabel `kategori_produk(id)` on delete set null.
  3. `deskripsi`: Penjelasan rasa, keunggulan, serta informasi penting seperti alergen (kacang, susu, gluten).
  4. `harga`: Nominal harga pasti (Rupiah).
  5. `foto`: Berkas gambar produk yang tersimpan di storage publik.
  6. `label_teks`: Tag visual singkat (contoh: *"Best Seller"*, *"Signature"*, *"Favorit"*), maksimal 24 karakter.
  7. `unggulan`: Penanda *boolean* untuk produk yang otomatis tampil di seksi Menu Populer Beranda (maksimal 4 produk).
  8. `aktif`: Status ketersediaan produk (*boolean*).
* **Penyederhanaan Katalog**:
  * Produk katalog **tidak memakai urutan tampil, porsi, dan komposisi bahan** di form admin maupun antarmuka pengguna.
  * Pengurutan katalog secara baku mengikuti waktu pembuatan produk (`dibuat_pada` menurun / terbaru).
  * Kategori produk diurutkan berdasarkan waktu pembuatan (`id` terlama dulu agar chip kategori stabil).
* **Tanpa Manajemen Stok & Resep**: Produk katalog **tidak memakai tabel stok bahan maupun resep item**. Apabila suatu produk katalog habis di toko fisik, Admin cukup menonaktifkannya (`aktif = false`).
* **Rating Dihapus dari UI**: Semua angka rating statis (seperti "4.9") dan badge terjual dummy dihapus dari antarmuka menu hingga fitur ulasan terverifikasi pelanggan diimplementasikan di kemudian hari.

---

## 3. Skema Pembayaran, Down Payment (DP), & Kuota Harian
* **Ketentuan Down Payment (DP)**:
  * DP **hanya berlaku dan dihitung dari subtotal kue Custom**.
  * Kue Katalog dan Biaya Ongkos Kirim (Ongkir) **wajib dibayar penuh 100% di awal**.
  * **Rumus Nominal Bayar di Awal (Bayar Sekarang)**:
    $$\text{Bayar Sekarang} = (\text{Persen DP} \times \text{Subtotal Custom}) + \text{Subtotal Katalog} + \text{Ongkir}$$
  * **Rumus Sisa Pelunasan**:
    $$\text{Sisa Pelunasan} = (100\% - \text{Persen DP}) \times \text{Subtotal Custom}$$
* **Metode Pembayaran**:
  * **Pembayaran Awal**: Mendukung **Transfer Bank** (verifikasi bukti manual) dan **QRIS** (Midtrans / QRIS Statis).
  * **Pelunasan**: Pelunasan sisa tagihan untuk pesanan yang diambil di toko fisik dapat menggunakan **Tunai di Tempat** pada saat serah terima, atau transfer sebelum barang diserahkan.
* **Perhitungan Kuota Harian**:
  * Kuota kapasitas harian toko **hanya menghitung jumlah kue Custom**.
  * Kue Katalog tidak memotong kuota harian pembuatan kue.

---

## 4. Alur Interaksi Pengguna (User Flow) & Navigasi
1. **Pemilihan Menu / Perancangan**:
   * Pelanggan memilih produk di **Katalog Menu** (`/menu`) atau merancang di **Cake Studio** (`/pesan`).
   * Tombol **"Tambah ke Keranjang"** menambahkan item ke keranjang pelanggan di database dan **tetap berada di halaman aktif** (disertai feedback visual / toast notification, tanpa redirect paksa).
2. **Pemeriksaan Keranjang**:
   * Pelanggan membuka halaman **Keranjang Belanja** (`/keranjang`) untuk meninjau daftar item, mengatur kuantitas, atau menghapus item.
3. **Pemesanan (Checkout)**:
   * Pelanggan melanjutkan ke halaman **Checkout** (`/checkout`) untuk mengisi data penerima, memilih metode (Ambil di Toko / Kirim), memilih tanggal & jam, serta metode pembayaran.
4. **Penerbitan Tiket Pesanan**:
   * Klik tombol **"Buat Pesanan"** langsung mengarahkan pelanggan ke **Tiket Digital Pesanan** (`/pesanan-saya/[kode]`).
   * Halaman tiket menampilkan: ringkasan pesanan, rincian pembayaran (DP/Lunas), instruksi & nomor rekening / barcode QRIS, form unggah bukti transfer, serta badge status terkini.
5. **Autentikasi & Redirection Guard**:
   * Pengguna yang belum masuk (*guest*) yang mengakses fitur berautentikasi diarahkan ke `/masuk?ke=[rute_asal]`.
   * Setelah sukses login:
     * **Pelanggan** diarahkan kembali ke rute asal (`ke`), atau default ke Beranda (`/`).
     * **Admin & Petugas (Staf)** langsung diarahkan ke `/dashboard`.

---

## 5. Dashboard Khusus Pelanggan & Tiket Kanonik
* **Rute Resmi Pelanggan**:
  * `/user`: Halaman dashboard pelanggan terpadu yang memuat tab: **Beranda** (ringkasan aktivitas, pelacakan langsung, 5 transaksi terakhir), **Pesanan Saya** (filter Semua, Aktif, Pending, Diproses Petugas, Siap/Dikirim, Selesai, Dibatalkan, serta pencarian), **Riwayat Transaksi** (semua pembayaran dan struk), **Pengaturan Profil & Alamat** (nama, nomor WA format Indonesia valid, alamat pengiriman, dan ganti kata sandi minimal 8 karakter), serta **Pusat Bantuan** (tiket bantuan dinamis dan kontak toko resmi dari `pengaturan_toko`). Rute `/akun` dihapus dan dilebur ke `/user`.
  * `/pesanan-saya/[kode]`: Satu-satunya halaman tiket digital resmi (kanonik) dengan rincian komponen kue custom, item katalog, QR Code, countdown batas bayar Midtrans, tombol bayar Snap Midtrans, dan cetak struk/invoice. Rute `/user/[kode]` dialihkan secara kanonik ke `/pesanan-saya/[kode]`.
  * `/pesanan-saya`: Dialihkan di server ke `/user?tab=pesanan`.
  * `/profil`: Dialihkan di server ke `/user?tab=profil` untuk pelanggan, dan ke `/dashboard/profil` untuk admin/staf.
* **Aturan Penemuan Sebelum Pembuatan**:
  Sebelum membuat halaman, rute, atau komponen baru, wajib mencari terlebih dahulu yang sudah ada dengan fungsi serupa di `app/` atau `components/`. Dilarang membuat rute paralel yang menduplikasi fungsi yang telah tersedia.
* **Larangan Konten pada Halaman Pelanggan**:
  Halaman area pelanggan **tidak boleh** memuat elemen: katalog belanja, customizer studio, keranjang belanja, formulir checkout, banner promo, grafik statistik keuangan/pesanan, daftar favorit, rating bintang, maupun formulir reservasi.

---

## 6. Hak Akses & Peran Petugas (Role Staf)
* **Halaman Kerja Utama**: Petugas bekerja pada halaman operasional **Hari Ini** (`/dashboard/hari-ini`).
* **Fitur Halaman Hari Ini**:
  * Memantau pesanan yang dijadwalkan **Siap Diambil** atau **Siap Diantar** pada tanggal hari ini.
  * Memantau daftar pesanan yang **Menunggu Pelunasan**.
  * Fitur pencarian instan berdasarkan **Kode Pesanan** atau **Nomor WhatsApp Pelanggan**.
  * Peringatan dini ketersediaan stok bahan baku.
* **Hak Akses Petugas**:
  * **DIPERBOLEHKAN**: Mengubah status produksi pesanan (`Sedang Dibuat` $\rightarrow$ `Siap`), mengonfirmasi pembayaran, mencatat pelunasan tunai di toko, melakukan serah terima (`Dikirim` / `Selesai`), serta melihat total nominal tagihan dan status bayar setiap pesanan.
  * **DILARANG**: Membatalkan pesanan, mengubah harga item, mengelola katalog dan opsi kue, mengubah pengaturan toko, mengelola akun pengguna, serta mengakses laporan keuangan dan omzet.
* **Audit Trail**: Setiap perubahan status, konfirmasi, dan serah terima oleh Petugas wajib tercatat di tabel `riwayat_pesanan` beserta ID petugas yang bertindak.

---

## 7. Struktur Pengaturan Toko (4 Tab Terpadu)
Pengaturan toko diakses oleh Admin melalui `/dashboard/pengaturan` yang terbagi rapi menjadi 4 tab:
1. **Tab Toko**:
   * Nama Toko, Nomor WhatsApp Resmi, Email Resmi, Akun Instagram, Alamat Lengkap, Tautan Google Maps, Deskripsi Teks Footer.
   * **Jam Operasional Terkelompok**:
     * `jam_buka_senin_jumat` dan `jam_tutup_senin_jumat` (Senin – Jumat).
     * `jam_buka_sabtu_minggu` dan `jam_tutup_sabtu_minggu` (Sabtu – Minggu).
     * *Catatan*: Kolom lama `jam_buka` dan `jam_tutup` tetap ada di database dan secara otomatis disinkronkan sama dengan nilai jam Senin–Jumat setiap kali pengaturan disimpan agar kompatibilitas `/pesan` lama tetap terjaga. Kolom `jam_operasional` dibiarkan di database namun tidak dipakai lagi di UI.
2. **Tab Pemesanan**:
   * Kuota Harian Kue Custom (`kuota_harian`).
   * Minimal Hari Pemesanan Kue Custom (`minimal_hari_pesan`).
   * Minimal Hari Pemesanan Kue Katalog (`minimal_hari_katalog`, default 1).
   * Kalender Hari Libur Toko (tetap menggunakan tabel `tanggal_tutup`).
3. **Tab Pembayaran**:
   * Mode Pembayaran Utama (DP / Lunas).
   * Persentase Minimal DP kue Custom (`persen_dp`).
   * Batas Waktu Pembayaran (`batas_bayar_jam`).
   * Data Rekening Bank (Nama Bank, Nomor Rekening, Atas Nama).
   * Gambar QRIS Toko.
4. **Tab Ongkir Jarak Berundak**:
   * Koordinat Pin Toko: `lat_toko` dan `lng_toko` (numeric).
   * Faktor Jalan: `faktor_jalan` (default 1.3, minimal 1).
   * Jarak Pengiriman Maksimal: `maks_jarak_kirim_km` (default 20 km).
   * **Tabel Tarif Jarak Berundak (`tarif_jarak`)**: Daftar tier jarak maksimal (`jarak_maks_km`, unik, > 0) dan nominal tarif (`tarif` >= 0) yang aktif.
   * *Catatan*: Tabel `zona_ongkir` lama dipertahankan hanya untuk kompatibilitas halaman `/pesan` lama.

---

## 8. Integrasi Landing Page dengan Database
* **Sumber Data Dinamis**:
  * Informasi Nama Toko, Alamat, WhatsApp, Instagram, Email, dan Jam Buka-Tutup dibaca langsung dari `pengaturan_toko`.
  * Informasi tenggat pesan pada banner/teks edukasi (misal *"H-2"*) dibaca dinamis dari nilai `minimal_hari_pesan` kue custom.
  * Informasi jangkauan pengiriman dibaca dinamis dari nilai `maks_jarak_kirim_km`.
  * Seksi **Menu Populer** menampilkan kartu produk yang dibaca dari tabel `produk` yang memiliki tanda `unggulan = true`.
* **Reservasi Meja / Event**:
  * Form reservasi langsung mengarahkan pengguna ke **WhatsApp resmi toko** dengan pesan teks yang otomatis terisi (*pre-filled message* memuat Nama, Tanggal, Jam, dan Jumlah Tamu) tanpa memerlukan tabel database baru.
* **Aset Statis**:
  * Banner hero visual, ornamen ilustrasi, dan galeri foto suasana interior butik tetap tersimpan statis pada kode.

---

## 9. Penyesuaian Dashboard & Laporan untuk Multi-Item
* **Perhitungan Menyeluruh**:
  * Metrik Total Pesanan dan Total Pendapatan menghitung seluruh pesanan masuk (Kue Custom maupun Katalog).
  * **Pemisahan Terlaris**: Menampilkan daftar **Rasa Terlaris** (berdasarkan pilihan adonan/krim kue Custom) dan **Produk Terlaris** (berdasarkan kuantitas penjualan kue Katalog).
  * **Grafik Jenis (Donut Chart)**: Menampilkan proporsi penjualan kategori Kue Custom vs kategori-kategori produk Katalog.
  * **Pemisahan Omzet**: Laporan finansial menyajikan breakdown pendapatan: Omzet Kue Custom vs Omzet Kue Katalog.
* **Daftar Pesanan Admin**:
  * Menyediakan kolom **"Isi"** pada tabel daftar pesanan yang merangkum item-item di dalam pesanan (contoh: *1x Custom Birthday Cake, 2x Choco Cookies*).
* **Kebutuhan Bahan Baku**:
  * Perhitungan kebutuhan bahan dapur hanya dikalkulasikan dari resep kue Custom.

---

## 10. Ketentuan Format Angka & Waktu Pengambilan
* **Jam Pengambilan**: Pilihan slot jam pengambilan/pengiriman pada formulir checkout divalidasi oleh fungsi `jamBukaTutupUntukTanggal` di `lib/jam.js` menyesuaikan batasan jam buka dan tutup dari kelompok hari tanggal yang dipilih pelanggan (Senin–Jumat atau Sabtu–Minggu).
* **Tipografi Angka Rupiah**: Seluruh tampilan nominal mata uang Rupiah wajib menggunakan kelas utilitas `lining-nums` (serta `tabular-nums` pada tabel/rincian) agar angka tidak bertingkat atau memiliki ekor kebawah (*oldstyle figures*), menghasilkan tampilan angka yang rata dan rapi.

---

## 11. Catatan Implementasi & Perbaikan Fase 2A
1. **Aturan Integritas Berkas**:
   * **DILARANG menghapus berkas, halaman, atau komponen apa pun** tanpa persetujuan eksplisit dari pengguna. Komponen yang tidak dipakai wajib dilaporkan dan ditanyakan terlebih dahulu.
2. **Halaman & Komponen Dibuat/Diperbarui**:
   * `components/patisserie/KasirView.tsx`: Dipulihkan dan dijadikan desain antarmuka resmi halaman `/keranjang` dengan mempertahankan seluruh kelas styling, warna, tipografi, dan animasi aslinya. Sumber data dihubungkan ke `GET /api/keranjang` (dua kelompok Custom dan Katalog, kontrol kuantitas 1–20, hapus item, penanda item tidak tersedia, dan event `cravely_cart_updated`). Bagian yang belum memiliki dasar sistem (voucher dan modal simulasi WhatsApp) dipertahankan di dalam kode tanpa dirender (`false && (...)`).
   * `app/keranjang/page.js`: Merender komponen `KasirView` secara dinamis, mengelola data keranjang dari server, serta memproteksi autentikasi (redirect ke `/masuk?ke=/keranjang` jika unauthenticated).
   * `app/menu/page.js` & `components/patisserie/DessertsMenuView.tsx`: Tampilan katalog dinamis dari database tanpa dummy data `MENU_ITEMS`, tanpa rating, tanpa opsi "Urutan Toko" (hanya Terbaru, Harga Terendah, Harga Tertinggi). Panel pratinjau kiri disederhanakan tanpa porsi dan komposisi bahan. Pencarian memeriksa nama dan deskripsi.
   * `app/dashboard/katalog-opsi/page.js`: Form produk disederhanakan tanpa field urutan tampil, tanpa porsi, dan tanpa komposisi bahan. Harga diawali kosong dengan placeholder (tanpa default 100000). Deskripsi dilengkapi bantuan info alergen. Modal "Kelola Kategori" disederhanakan tanpa input urutan.
   * `lib/menuPopuler.js`: Menu Populer pada landing page dibaca dari database (`aktif = true` dan `unggulan = true`, maksimal 4 item) diurutkan berdasarkan `dibuat_pada` menurun.
   * `app/kasir/page.js`: Dialihkan (*redirect*) permanen ke `/keranjang`. Seluruh tautan kasir di footer, toko, dan dashboard pelanggan telah dialihkan ke `/keranjang`.
3. **Autentikasi & Navigasi**:
   * Standardisasi parameter redirect login menggunakan `?ke=` pada `middleware.js`, `app/masuk/page.js`, dan `app/daftar/page.js`. Sanitasi URL diterapkan ketat (hanya single leading slash `/` dan mencegah open redirect).
   * Indikator keranjang belanja pada `DynamicIslandNavbar` terhubung ke API `/api/keranjang/jumlah` dan merespons event `cravely_cart_updated`.
4. **Keamanan API Pengaturan**:
   * Endpoint publik `GET /api/pengaturan` dibatasi hanya mengembalikan kolom-kolom aman toko, jam operasional, parameter jarak, dan informasi publik rekening/QRIS tanpa mengekspos data internal/sensitif.

---

## 12. Ketentuan & Arsitektur Fase 2B (Midtrans, Estimasi, Ongkir Jarak)
1. **Aturan Mutlak Integritas Berkas**:
   * **DILARANG MENGHAPUS berkas, halaman, atau komponen apa pun** tanpa instruksi eksplisit pengguna dengan menyebut nama filenya.
2. **Integrasi Midtrans Snap**:
   * Midtrans digunakan sebagai **satu-satunya gerbang pembayaran pada saat checkout**.
   * Form bank manual dan gambar QRIS manual di checkout dihapus dari alur checkout dan dialihkan menjadi cadangan operasional toko pada dashboard admin.
   * Tombol "Bayar Sekarang" di `/checkout` membuat pesanan via `POST /api/checkout`, meminta snap token via `POST /api/midtrans/token`, lalu membuka jendela pop-up Snap.
   * Seluruh callback Snap (`onSuccess`, `onPending`, `onClose`) mengarahkan pelanggan ke `/pesanan-saya/[kode]?bayar=1`. Status pembayaran **selalu bersumber dari server**, bukan mempercayai callback browser.
   * Sinkronisasi status dilakukan idempotensial lewat `lib/midtransSinkron.js` yang digunakan bersama oleh Webhook (`/api/midtrans/webhook`) dan pengecekan manual (`/api/midtrans/cek`).
   * Jika pelanggan membayar setelah pesanan kedaluwarsa/dibatalkan, pesanan ditandai `perlu_refund = true` untuk ditindaklanjuti toko secara manual tanpa mengubah status pesanan yang telah dibatalkan.
3. **Rumus Perhitungan DP Campuran (Hitung Harga)**:
   * Rumus baku:
     $$\text{Bayar Sekarang} = (\text{Persen DP} \times \text{Subtotal Custom}) + \text{Subtotal Katalog} + \text{Ongkir}$$
     $$\text{Sisa Pelunasan} = (100\% - \text{Persen DP}) \times \text{Subtotal Custom}$$
   * Jika mode pembayaran toko disetel `Lunas`, maka $\text{Bayar Sekarang} = \text{Total Tagihan}$ dan $\text{Sisa Pelunasan} = 0$.
4. **Perhitungan Ongkir Berbasis Jarak**:
   * Checkout metode `Kirim` mewajibkan pin lokasi pada `PetaLokasi` (Leaflet dinamis + OpenStreetMap) dan alamat lengkap.
   * Ongkir dihitung ulang secara mutlak di server lewat `lib/ongkir.js` berdasarkan koordinat pin toko, koordinat tujuan, `faktor_jalan` (default 1.3), dan batas tier jarak `tarif_jarak`.
   * Pilihan zona tarif manual lama dinonaktifkan dari checkout dan dilabeli khusus untuk rute lama `/pesan`.
   * Pencarian alamat menggunakan proxy server `/api/cari-alamat` ke Nominatim OpenStreetMap dengan header identifikasi aplikasi dan pembatasan negara Indonesia.
5. **Estimasi Pengiriman & Pengambilan (`lib/estimasi.js`)**:
   * Untuk `Kirim`: tanggal paling awal dihitung dari `hariIni + max(hari_persiapan)`, melewati tanggal libur/tutup toko dan tanggal kuota custom penuh. Sistem menampilkan rentang estimasi tiba "tanggalAwal sampai tanggalAkhir" (hari kalender berikutnya yang juga melewati libur) tanpa jam ambil. Pelanggan dapat memilih opsi tiba pada tanggal pasti.
   * Untuk `Ambil`: pelanggan memilih tanggal pengambilan dan jam pengambilan yang divalidasi ketat terhadap jam buka-tutup operasional hari tersebut.
6. **Dashboard Operasional Hari Ini (`/dashboard/hari-ini`)**:
   * Memantau antrean pesanan yang dijadwalkan diserahkan hari ini dan pesanan yang menunggu pelunasan.
   * Mendukung pencarian instan berdasarkan kode pesanan, nama, dan nomor WhatsApp.
   * Menyediakan tindakan serah terima cepat ("Kirim", "Siap", "Selesai") serta pencatatan pelunasan tunai di toko (`pembayaran` metode Tunai).
   * Menampilkan peringatan dini stok menipis dari tabel `bahan`.

---

## 13. Penyempurnaan Hak Akses Petugas (Staf), Kedaluwarsa Pesanan, dan Pelaporan Terpadu
1. **Hak Akses Staf & Validasi Transisi Status di Server**:
   * **Aturan Transisi Status**:
     * Pesanan berisi minimal 1 item Custom: `Diterima` $\longrightarrow$ `Sedang Dibuat` $\longrightarrow$ `Siap` $\longrightarrow$ `Dikirim` (jika Kirim) / `Selesai`.
     * Pesanan hanya berisi Katalog: `Diterima` langsung ke `Siap` (melewati `Sedang Dibuat`) $\longrightarrow$ `Dikirim` (jika Kirim) / `Selesai`.
     * Transisi ke `Dikirim` atau `Selesai` mewajibkan `status_bayar === 'Lunas'`.
     * Petugas (Staf) **DILARANG membatalkan pesanan** (server mengembalikan respons 403 Forbidden). Pembatalan hanya dapat dilakukan oleh Admin.
     * Setiap perubahan status mencatat `id_user` petugas pelaksana ke `riwayat_pesanan`.
   * **Pembayaran Staf**:
     * Staf hanya diizinkan mencatat dan mengonfirmasi **pelunasan tunai** (metode Tunai di Tempat, khusus pesanan dengan metode Ambil).
     * Staf **dilarang mengonfirmasi atau menolak transfer manual** dengan bukti transfer (wewenang khusus Admin).
   * **Antarmuka Staf**:
     * Menyembunyikan menu Laporan, Pengaturan, Akun, dan kolom pengelolaan harga.
     * Tombol "Batalkan" disembunyikan untuk Staf.
2. **Daftar & Detail Pesanan Terpadu**:
   * **Laci Drawer Detail Pesanan**:
     * Detail pesanan terbuka sebagai laci kanan overlay (maksimal lebar 560px, tinggi penuh) agar tabel pesanan tetap lebar penuh dan filter "Semua Status" tidak terpotong.
   * **Kolom Tabel Pesanan**:
     * Kolom **Isi** ringkas (contoh: *"2 Custom, 3 Katalog"*), thumbnail kue pertama, badge metode pengiriman (Ambil / Kirim), kolom Jadwal (Ambil: tanggal & jam; Kirim: tanggal estimasi atau tanggal pasti tanpa jam), filter jenis (Semua, Custom, Katalog, Campuran), dan pencarian instan (kode, nama, no WA).
   * **Konten Detail Laci**:
     * Satu kartu per `pesanan_item` (Custom: preview visual, opsi per grup dengan label "Termasuk" untuk harga 0, tulisan kue, elemen desain JSON, gambar kustom; Katalog: foto, nama, jumlah, harga satuan, subtotal).
     * Rincian tagihan (subtotal item, ongkir, total tagihan, bayar sekarang/DP, terbayar, sisa tagihan, serta peringatan merah bila subtotal item $\neq$ `total_kue`).
     * Informasi pengiriman dengan tautan langsung Google Maps, riwayat status, daftar pembayaran (Midtrans berlabel *"Dikonfirmasi otomatis"*), serta badge penanda *"Perlu Refund"*.
3. **Manajemen Kuota & Pembatalan Kedaluwarsa**:
   * Pesanan berstatus `Menunggu Pembayaran` yang telah melampaui batas bayar (`dibuat_pada + batas_bayar_jam`) **TIDAK dihitung dalam kuota harian**, baik di `/api/ketersediaan` maupun validasi kuota `/api/checkout` dan `/api/pesanan`.
   * Modul `lib/kedaluwarsa.js`: fungsi `batalkanKedaluwarsa()` berjalan via cron dan dipanggil secara *lazy* (dibatasi throttling 5 menit) dari `/api/ketersediaan` dan daftar pesanan. Sebelum pembatalan, status pembayaran Midtrans dicek terlebih dahulu (pesanan yang sudah dibayar disinkronkan dan tidak dibatalkan). Pembatalan sistem mencatat `dibatalkan_oleh = 'Sistem'`.
   * Webhook Midtrans: jika `gross_amount` tidak cocok, server merespons HTTP 200, tidak memodifikasi pembayaran, dan mencatat peringatan ke `riwayat_pesanan`.
4. **Dashboard & Laporan Menyeluruh**:
   * **Dashboard Admin**: Total Pesanan & Total Pendapatan menghitung seluruh jenis pesanan (Pendapatan = pembayaran Dikonfirmasi berdasarkan `dikonfirmasi_pada` zona Asia/Jakarta). Kartu kedua *"Perlu Diproses"* (pesanan Diterima). Kartu Total Pesanan memuat teks *"N kue custom harus dibuat hari ini"*. Kartu Terlaris memiliki 2 tab kecil (Rasa untuk Custom dan Produk untuk Katalog). Donut chart menampilkan Custom Cake dan kategori produk teratas.
   * **Dashboard Staf**: Memuat 5 kartu metrik operasional (Perlu Diproses, Kue Custom Hari Ini, Siap Hari Ini, Menunggu Pelunasan, Stok Menipis).
   * **Lonceng Notifikasi**: Mengagregasi 4 sumber (pembayaran manual menunggu, perlu refund, pesanan diterima belum diproses, stok bahan menipis) dengan dropdown interaktif bertautan langsung.
   * **Laporan Keuangan**: Menampilkan Omzet Kas Masuk, kartu Nilai Penjualan terpisah (Custom, Katalog, Ongkir), Produk Katalog Terlaris berdampingan dengan Opsi Custom Terlaris, kolom Jenis dan Isi pada tabel & export CSV, metrik Perlu Refund, dan angka Rupiah rapi dengan `lining-nums tabular-nums`.
   * **Stok Bahan Baku**: Panel kebutuhan bahan dan tombol kurangi stok hanya muncul dan dihitung untuk pesanan yang memuat item Custom. Pesanan katalog murni tidak memotong atau memproses bahan baku.

---

## 14. Integrasi Sumber Data Publik & Pengaturan Terpadu Fase 4
1. **Sumber Data Publik Terpadu (`lib/tokoPublik.js`)**:
   * Menggunakan `ambilTokoPublik()` dengan caching Next.js `unstable_cache` revalidate 60 detik dan tag cache `pengaturan_toko`.
   * Mengembalikan kolom-kolom aman publik dari `pengaturan_toko`: `nama_toko`, `alamat`, `no_wa`, `wa_link` (normalisasi `wa.me/62...`), `email`, `instagram_handle`, `instagram_url`, `tautan_peta` (diawali `https://`), `deskripsi_footer`, `jam` (kelompok Senin–Jumat dan Sabtu–Minggu dengan format tampil `HH.MM – HH.MM WIB`), `minimal_hari_pesan`, `minimal_hari_katalog`, `maks_jarak_kirim_km`, dan `pengiriman_aktif` (`true` jika koordinat toko dan minimal satu tarif jarak aktif tersedia).
   * Jika database tidak terjangkau atau sebuah kolom kosong, nilai dikembalikan kosong/null tanpa teks pengganti tertulis di kode, dan komponen menyembunyikan baris/elemen terkait secara rapi.
2. **Integrasi Landing Page Publik**:
   * Komponen `Footer`, bagian `Lokasi`, papan jam di `CafeScene`, `navbar`, dan teks toko membaca data toko via props dari server component (`app/page.js`) tanpa Context besar.
   * Metadata halaman (`title` dan `description`) dibentuk dinamis melalui `generateMetadata` dengan membaca nama toko dan deskripsi footer dari `ambilTokoPublik()`.
   * Formulir **Reservasi & Pesan Cepat**: membuka WhatsApp (`wa_link`) dengan pesan terisi (nama, nomor WA pelanggan, keperluan acara, dan tanggal format Indonesia) tanpa menulis ke database. Validasi nama wajib, nomor WhatsApp Indonesia, tanggal tidak boleh lewat. Tombol dinonaktifkan otomatis bila nomor WhatsApp toko belum diatur. Setelah submit menampilkan pesan "Lanjutkan di WhatsApp".
   * Peningkatan kontras teks pada navbar dan footer di atas latar belakang gelap untuk menjamin keterbacaan tinggi.
   * Penataan kartu Menu Populer agar teks nama produk dan harga tidak saling bertumpuk, dengan tipografi angka Rupiah seragam menggunakan `lining-nums tabular-nums`.
3. **Restrukturisasi 4 Tab Pengaturan (`/dashboard/pengaturan`)**:
   * **Tab Toko**: Nama Toko, Nomor WhatsApp (normalisasi & validasi), Email, Instagram, Alamat Lengkap, Tautan Google Maps (harus `https://`), Deskripsi Singkat Footer (maksimal 300 karakter), Jam Operasional Senin–Jumat dan Sabtu–Minggu. Kolom "Teks Jam Operasional" bebas dihapus dari antarmuka.
   * **Tab Pemesanan**: Kuota Kue Custom per Hari (1–100), Minimal Hari Pesan Custom (0–30), Minimal Hari Pesan Katalog (0–30), dan Kalender Hari Libur (`tanggal_tutup`).
   * **Tab Pembayaran**: Mode Pembayaran (DP / Lunas), Persentase DP (1–100%), Batas Waktu Bayar (1–168 jam), Indikator Read-only Status Midtrans dari Environment Variable (Sandbox / Production / Belum Terhubung tanpa membocorkan kunci privat), Saklar Transfer Manual dengan Bukti, serta Blok Rekening Bank dan QRIS yang aktif hanya jika saklar transfer manual menyala.
   * **Tab Ongkir**: Pin koordinat toko pada peta interaktif Leaflet, faktor kelokan jalan (minimal 1.0), radius jarak maksimal kirim, tabel tarif jarak berundak (`tarif_jarak`), simulator interaktif "Coba jarak ___ km", dan akordeon lipat zona lama khusus kompatibilitas halaman `/pesan`.
   * **Penyimpanan Terisolasi**: Setiap tab memiliki tombol Simpan sendiri, indikator visual perubahan yang belum disimpan, dan Route Handler `/api/pengaturan` hanya memvalidasi serta memperbarui kolom milik tab yang disimpan tanpa menimpa konfigurasi tab lain. Jam operasional lama `jam_buka` dan `jam_tutup` otomatis disinkronkan dari jam Senin–Jumat. Cache publik `pengaturan_toko` otomatis di-invalidaikan seketika saat pengaturan disimpan.

---

## 15. Akun Pelanggan, Pemulihan Sandi & Antrean Dapur Hari Ini Fase 5
1. **Halaman Akun Pelanggan (`/akun`)**:
   * Halaman khusus pelanggan dengan server-side role check (`cekRole(["pelanggan"])`), mengalihkan staf/admin ke `/dashboard`.
   * Memiliki 2 tab:
     * **Ringkasan**: Pesanan aktif (belum Selesai dan belum Dibatalkan) dalam bentuk kartu informatif (kode pesanan, isi singkat, status, jadwal ambil/kirim, sisa tagihan, tombol "Bayar Sekarang" jika belum lunas, dan tautan "Lihat Tiket"). Di bawahnya menampilkan 3 pesanan selesai terakhir dengan tautan "Lihat Semua Pesanan" ke `/pesanan-saya`. State kosong menampilkan pesan ramah dengan tautan ke `/menu` dan `/pesan`.
     * **Profil Saya**: Nama lengkap, nomor WhatsApp (validasi format nomor Indonesia), email (read-only), dan formulir ganti kata sandi (kata sandi lama, kata sandi baru minimal 8 karakter, konfirmasi).
   * Bersih dari elemen yang dilarang (katalog, studio, keranjang, checkout, promo, voucher, statistik belanja, favorit, rating, dan reservasi).
   * URL `/profil` dialihkan (redirect 307/308) ke `/akun`.
2. **Navigasi Navbar Akun (`DynamicIslandNavbar`)**:
   * Status belum login: tautan masuk ke `/masuk?ke=...`.
   * Pengguna login peran staf atau admin: avatar mengarah langsung ke `/dashboard`.
   * Pengguna login peran pelanggan: avatar membuka menu dropdown: "Akun Saya" (`/akun`), "Pesanan Saya" (`/pesanan-saya`), dan "Keluar" (memanggil `supabase.auth.signOut()` lalu mengarahkan ke `/masuk`).
   * Halaman `/pesanan-saya`: daftar pesanan pelanggan dengan ringkasan isi item dan empty state netral *"Belum ada pesanan"*.
3. **Fitur Pemulihan Kata Sandi**:
   * `/lupa-sandi`: formulir input email yang memanggil `supabase.auth.resetPasswordForEmail` dengan `redirectTo` ke `${origin}/atur-ulang-sandi`. Menampilkan pesan netral yang identik baik email terdaftar maupun tidak terdaftar untuk mencegah enumerasi akun, serta dilengkapi jeda cooldown 60 detik sebelum tombol kirim ulang aktif. Tautan *"Lupa kata sandi?"* disematkan pada halaman `/masuk`.
   * `/atur-ulang-sandi`: formulir pengaturan kata sandi baru dari sesi pemulihan email (minimal 8 karakter) via `supabase.auth.updateUser`.
4. **Halaman Petugas Dapur (`/dashboard/hari-ini`)**:
   * Menu staf di `DashboardShell` ditata menjadi: **Hari Ini** (halaman awal staf), **Pesanan**, **Stok**, dan **Ke Website**. URL `/dashboard` untuk peran staf dialihkan langsung ke `/dashboard/hari-ini`. Admin dapat membuka halaman ini via menu atau tautan navigasi.
   * Di bagian atas dipertahankan metrik ringkas: Perlu Diproses, Kue Custom Hari Ini/Besok, Siap Hari Ini/Besok, Menunggu Pelunasan, dan Peringatan Stok Menipis.
   * Pemilih tanggal: **Hari Ini** dan **Besok** (waktu Jakarta `Asia/Jakarta`).
   * Pencarian cepat: mencari kode pesanan atau nomor WhatsApp dan langsung membuka laci detail pesanan.
   * Pembaruan otomatis antrean setiap 60 detik serta tombol manual *"Muat Ulang"*.
   * Tiga seksi tugas:
     1. **Perlu Dibuat**: Pesanan berisi custom cake (atau katalog) berstatus `Diterima` atau `Sedang Dibuat` dengan jadwal target hari terpilih, mini preview kue (`PreviewKue`), ringkasan spesifikasi, dan tombol *"Mulai Dibuat"* serta *"Tandai Siap"*.
     2. **Siap Diambil atau Diantar**: Pesanan berstatus `Siap`. Untuk metode Ambil: tombol *"Serah Terima"* (aktif jika Lunas, jika belum lunas muncul tombol *"Catat Pelunasan Tunai"*). Untuk metode Kirim: tombol *"Tandai Dikirim"* lalu *"Selesai"* (syarat Lunas).
     3. **Menunggu Pelunasan**: Pesanan aktif yang masih memiliki sisa tagihan pada hari terpilih, dilengkapi tautan WhatsApp langsung untuk konfirmasi ke pelanggan.
   * Seluruh perubahan status dan pelunasan kasir memanggil API yang sudah ada (`POST /api/pesanan/[kode]/status` dan `POST /api/pembayaran`) sehingga hak akses terjamin dan riwayat tercatat dengan `id_user`.

---

## 16. Pengamanan, Pembersihan & Kesiapan Deploy Fase 6
1. **Pengamanan Akses Server-Side (`cekRole`)**:
   * Setiap sub-rute dashboard kini dibungkus Server Layout mandiri:
     * Khusus Admin: `app/dashboard/laporan/layout.js`, `app/dashboard/pengaturan/layout.js`, `app/dashboard/akun/layout.js`, `app/dashboard/katalog-opsi/layout.js`. Akses staf dialihkan otomatis ke `/dashboard/hari-ini`.
     * Admin & Staf: `app/dashboard/stok/layout.js`, `app/dashboard/pesanan/layout.js`, `app/dashboard/hari-ini/layout.js`, `app/dashboard/profil/layout.js`.
     * Khusus Pelanggan: `app/keranjang/layout.js`, `app/checkout/layout.js`, `app/akun/page.js`, `app/pesanan-saya/page.js`. Staf dan admin dialihkan ke `/dashboard`.
   * Endpoint server khusus `GET /api/laporan` (terproteksi `cekRole(["admin"])`) menggantikan seluruh pembacaan data keuangan via query langsung Supabase client di browser.
2. **Rate Limiting In-Memory (`lib/rateLimit.js`)**:
   * Pembatasan frekuensi permintaan tanpa dependensi eksternal diterapkan pada rute:
     * `/api/cari-alamat`: maksimal 12 permintaan per 10 detik per IP untuk melindungi kuota Nominatim OpenStreetMap.
     * `/api/ongkir`: maksimal 20 permintaan per 10 detik per user.
     * `/api/midtrans/token`: maksimal 8 permintaan pembuatan token pembayaran per 30 detik per user.
3. **Audit Kebijakan Row Level Security (RLS)**:
   * Disusun migrasi idempotent `supabase/migrations/00014_rls_audit.sql` (tanpa komentar) untuk memperketat pembacaan tabel `pembayaran` (hanya admin dan pemilik pesanan), `profil` (hanya admin dan pemilik akun), serta operasi penghapusan `pesanan` (khusus admin).
4. **Pembersihan & Kualitas Tampilan**:
   * Seluruh angka dan mata uang Rupiah dikonfigurasi menggunakan `font-variant-numeric: lining-nums tabular-nums` melalui layer `@layer base` di `app/globals.css`.
   * Halaman 404 (`app/not-found.js`), penangan error global (`app/error.js`), dan animasi pemuatan root (`app/loading.js`) dirancang senada dengan tema visual toko tanpa mengekspos pesan teknis.
   * Metadata lengkap (judul, deskripsi, favicon, OpenGraph) diterapkan pada seluruh halaman utama via layout.
5. **Kesiapan Dokumen & Kebijakan Hukum**:
   * Halaman kebijakan publik: `/syarat-ketentuan`, `/kebijakan-privasi`, dan `/kebijakan-pembatalan` (pembatalan sebelum bayar, kue custom tidak bisa dibatalkan setelah diproses, refund manual Midtrans, DP khusus custom) yang ditautkan pada footer dan formulir checkout.
   * Templat variabel lingkungan `.env.example` dan panduan produksi komprehensif `DEPLOY.md`.
318: 
319: ---
320: 
321: ## 17. Perbaikan Dashboard Pelanggan `/user` Fase 5B
322: 1. **Penyelarasan Teks & Logika Midtrans**:
323:    * **Beranda**: Kartu Pesanan Aktif dan filter "Aktif" di tab Pesanan Saya menghitung pesanan yang sudah dibayar (`Diterima`, `Sedang Dibuat`, `Siap`, `Dikirim`), terpisah dari `Menunggu Pembayaran`. Kartu Total Belanja menampilkan total pembayaran terkonfirmasi, dan pemberitahuan `perlu_refund` tampil pada kartu pesanan maupun Beranda.
324:    * **Penanggung Jawab Saat Ini**: Menggunakan kalimat tunggal tanpa teks `ROLE:`, serta menampilkan nominal `bayar_sekarang` dari server (`jumlah_dp` yang sudah termasuk ongkir dan katalog) sebelum batas bayar.
325:    * **Tabel & Kartu Pesanan**: Satu tombol bayar per kartu, tombol `Struk` hanya tampil setelah ada pembayaran Dikonfirmasi, dan tab Riwayat Transaksi menampilkan daftar invoice serta tabel **Riwayat Pembayaran** milik pelanggan dari server.
326: 2. **Lokasi Pengiriman Utama & Profil**:
327:    * Zona Pengiriman Default dihapus dari UI profil dan diganti **Lokasi Pengiriman Utama** menggunakan komponen `PetaLokasi` (`posisiToko`, `posisiTujuan`, `onUbahTujuan`), alamat lengkap, dan patokan.
328:    * Kolom database disiapkan via migrasi idempotent `supabase/migrations/00015_profil_lokasi.sql` (`lat_alamat`, `lng_alamat`, `alamat`, `patokan`). `/api/profil` memvalidasi koordinat Indonesia serta fallback aman bila kolom lokasi belum dimigrasi.
329:    * `CheckoutView` mengisi otomatis lokasi dari profil terlebih dahulu, lalu fallback ke pesanan `Kirim` terakhir (`/api/pesanan/terakhir-kirim`). Peringatan kuning tampil di profil maupun checkout jika nomor WhatsApp tersimpan belum sesuai format Indonesia.
330: 3. **Pusat Bantuan**:
331:    * Kontak Operasional membaca sumber publik `ambilTokoPublik()` (`lib/tokoPublik.js`) dengan dua baris jam operasional (Senin–Jumat dan Sabtu–Minggu) yang disembunyikan jika kosong, WhatsApp `wa.me`, alamat, dan tautan peta; blok rekening hanya tampil jika `transfer_manual_aktif = true`.
332:    * Form bantuan membuka WhatsApp dengan detail pesanan terisi otomatis (tanpa menulis ke database) dan menonaktifkan tombol disertai keterangan jika nomor WhatsApp toko kosong. FAQ diperbarui sesuai alur Midtrans, jadwal produksi, syarat lunas serah terima, estimasi tiba, ongkir jarak, dan aturan pembatalan.


