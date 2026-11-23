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
  3. `deskripsi`: Penjelasan rasa dan tekstur.
  4. `komposisi`: Bahan-bahan utama pembuatan (text default '').
  5. `porsi`: Estimasi porsi (contoh: *Whole Cake Ø16 cm · 6–8 Porsi*).
  6. `harga`: Nominal harga pasti (Rupiah).
  7. `foto`: Berkas gambar produk yang tersimpan di storage publik.
  8. `label_teks`: Tag visual singkat (contoh: *"Best Seller"*, *"Signature"*, *"Favorit"*).
  9. `unggulan`: Penanda *boolean* untuk produk yang otomatis tampil di seksi Menu Populer Beranda.
  10. `urutan`: Urutan prioritas tampil di katalog.
  11. `aktif`: Status ketersediaan produk (*boolean*).
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

## 5. Dashboard Khusus Pelanggan
* **Rute Resmi Pelanggan**:
  * `/akun`: Halaman akun pelanggan yang berisi tab **Ringkasan Akun** dan tab **Profil Saya** (ubah nama, no WhatsApp, dan kata sandi).
  * `/pesanan-saya`: Daftar seluruh riwayat pesanan pelanggan.
  * `/pesanan-saya/[kode]`: Detail tiket pesanan digital pelanggan.
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
