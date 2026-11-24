# LAPORAN AUDIT MENYELURUH PROYEK CRAVELY (`Website-UMKN`)

Tanggal Audit: 25 November 2026  
Mode Audit: Hanya Baca (Read-Only) — Tidak ada kode proyek, skema database, atau transaksi Midtrans yang diubah.

---

## BAGIAN 9: Ringkasan Eksekutif

### 9.1 Jumlah Temuan per Tingkat Keparahan

| Tingkat Keparahan | Jumlah Temuan | Keterangan Singkat |
| :--- | :---: | :--- |
| **KRITIS** | **5** | Uang, data, atau keamanan terancam, atau alur utama produksi/pembayaran putus total |
| **TINGGI** | **14** | Fitur tidak jalan, salah hitung kuota/pendapatan/ongkir, atau kebocoran hak akses staf |
| **SEDANG** | **19** | Ketidakkonsistenan data/skema, halaman yatim/duplikat, teks/komponen membingungkan |
| **RENDAH** | **12** | Kosmetik, komentar kode tersisa, aksesibilitas minor, peringatan deprecasi build |
| **TOTAL** | **50** | Seluruh temuan tercatat lengkap dengan file, baris, pemicu/dampak, dan saran perbaikan |

---

### 9.2 15 Temuan Paling Penting (Urut Berdasarkan Risiko)

1. **[KRITIS] Alur Produksi Kue Custom Staf Putus Total akibat Query Kolom Tidak Ada di `/dashboard/hari-ini`** — [app/dashboard/hari-ini/page.js](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L85-L93) & [app/dashboard/hari-ini/page.js](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L504)  
   Query `pesanan_item` meminta kolom `catatan_opsi, spesifikasi_singkat` dan `pesanan_pilihan` meminta kolom `teks_pilihan` yang tidak ada di migrasi mana pun. PostgreSQL mengembalikan error `42703 (undefined_column)` yang diabaikan karena `resItems.error` dan `resPilihan.error` tidak diperiksa. Akibatnya `itemsMap` dan `pilihanMap` selalu kosong (`{}`), sehingga semua pesanan kue custom dari `/checkout` dianggap pesanan katalog (`adaCustom === false`), tombol **"Mulai Dibuat"** hilang dan diganti **"Tandai Siap"**, dan saat staf menekan **"Tandai Siap"**, server menolak dengan HTTP 400 (`Pesanan kue custom harus berstatus "Sedang Dibuat" sebelum dapat ditandai "Siap"`).

2. **[KRITIS] Staf Selalu Gagal (HTTP 403) Mencatat Pelunasan Tunai di Tempat** — [app/api/pembayaran/route.js](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L44-L66)  
   Pada baris 44, query tabel `pesanan` hanya mengambil `id, id_pelanggan, status_pesanan, status_bayar, total_bayar, jumlah_terbayar` tanpa `metode_pengiriman`. Pada baris 65, pengecekan `pesanan.metode_pengiriman !== "Ambil"` selalu bernilai `true` (`undefined !== "Ambil"`), sehingga staf tidak pernah bisa mencatat pelunasan tunai di toko dan selalu mendapat error `403 Forbidden`.

3. **[KRITIS] Bypass Autentikasi Endpoint Cron Pembatalan Pesanan & Pembersihan Keranjang jika `CRON_SECRET` Kosong** — [app/api/cron/batalkan-pesanan/route.js](file:///d:/Website-UMKN/app/api/cron/batalkan-pesanan/route.js#L6-L10) & [app/api/cron/bersihkan-keranjang/route.js](file:///d:/Website-UMKN/app/api/cron/bersihkan-keranjang/route.js#L6-L10)  
   Kondisi `if (cronSecret && authHeader !== \`Bearer ${cronSecret}\`)` melewatkan pemeriksaan token apabila environment variable `CRON_SECRET` belum diset atau kosong. Pihak luar dapat memanggil `GET`/`POST` ke kedua route cron tersebut tanpa autentikasi untuk membatalkan pesanan atau menghapus keranjang.

4. **[KRITIS] Konflik Migrasi `minimal_hari_siap` vs `minimal_hari_katalog` Merusak `GET /api/pengaturan` (Mode Admin) dan `PUT /api/pengaturan`** — [supabase/migrations/00012_fase1_katalog_pengaturan.sql](file:///d:/Website-UMKN/supabase/migrations/00012_fase1_katalog_pengaturan.sql#L84-L89) vs [app/api/pengaturan/route.js](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L265) & [lib/tokoPublik.js](file:///d:/Website-UMKN/lib/tokoPublik.js#L59)  
   Migrasi `00012_fase1_katalog_pengaturan.sql` mengubah nama kolom (`RENAME COLUMN minimal_hari_siap TO minimal_hari_katalog`), sehingga hanya salah satu kolom yang ada di database. Namun `GET /api/pengaturan?scope=admin` (baris 265), `PUT /api/pengaturan` (baris 536-537, 673-674), dan `lib/tokoPublik.js` (baris 59) melakukan `SELECT`/`UPDATE` kedua kolom sekaligus (`minimal_hari_katalog, minimal_hari_siap`), yang memicu kegagalan query PostgreSQL `column does not exist`.

5. **[KRITIS] RLS `pengaturan_toko` Mengizinkan `SELECT *` Publik Langsung dari Browser** — [supabase/migrations/00004_rls.sql](file:///d:/Website-UMKN/supabase/migrations/00004_rls.sql#L36-L38) & [components/patisserie/CheckoutView.js](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L179)  
   Policy RLS `"Pengaturan toko dibaca publik"` mengizinkan `SELECT USING (true)` untuk semua kolom `pengaturan_toko` menggunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `CheckoutView.js:179` masih memanggil `supabase.from("pengaturan_toko").select("*")` langsung dari browser.

6. **[TINGGI] Pesanan Hanya Kue Katalog Ikut Memotong Kuota Harian Kue Custom (`kuota_harian`)** — [app/api/ketersediaan/route.js](file:///d:/Website-UMKN/app/api/ketersediaan/route.js#L99-L120), [app/api/checkout/route.js](file:///d:/Website-UMKN/app/api/checkout/route.js#L237-L258), & [app/api/pesanan/route.js](file:///d:/Website-UMKN/app/api/pesanan/route.js#L159-L175)  
   Di `/api/ketersediaan` dan `/api/checkout`, query `pesanan_item` memfilter `.eq("jenis", "Custom")`, lalu untuk setiap pesanan aktif yang tidak ada di `customItemsPerPesanan` (termasuk pesanan murni katalog!) kode menetapkan fallback `: 1`. Di `/api/pesanan`, perhitungan kuota bahkan menghitung `pesananHariItuValid.length` tanpa memeriksa jenis item sama sekali. Ini melanggar `ALUR-SISTEM.md` §3 ("Kue Katalog tidak memotong kuota harian pembuatan kue").

7. **[TINGGI] Konfirmasi Pembayaran Manual oleh Admin Tidak Mengisi `dikonfirmasi_pada`, Menyebabkan Omzet Hilang dari Laporan & Dashboard** — [app/api/pembayaran/[id]/route.js](file:///d:/Website-UMKN/app/api/pembayaran/%5Bid%5D/route.js#L67-L73) vs [app/api/laporan/route.js](file:///d:/Website-UMKN/app/api/laporan/route.js#L39-L40) & [app/dashboard/page.js](file:///d:/Website-UMKN/app/dashboard/page.js#L286)  
   Saat admin mengonfirmasi pembayaran manual (`PATCH /api/pembayaran/[id]`), kolom `dikonfirmasi_pada` tidak diisi (tetap `null`), sedangkan laporan keuangan dan kartu pendapatan dashboard memfilter berdasarkan `.gte("dikonfirmasi_pada", ...)` sehingga seluruh pembayaran yang dikonfirmasi manual tidak masuk perhitungan omzet.

8. **[TINGGI] `POST /api/checkout` Tidak Menyimpan `id_item` dan `id_grup` ke Tabel `pesanan_pilihan`** — [app/api/checkout/route.js](file:///d:/Website-UMKN/app/api/checkout/route.js#L530-L540)  
   Berbeda dengan `POST /api/pesanan` (baris 489-490), `POST /api/checkout` hanya menyimpan `id_pesanan, id_pesanan_item, nama_grup, nama_item, harga` tanpa `id_grup` dan `id_item`. Akibatnya perhitungan resep bahan baku (`resep_item`) dan analitik grup opsi kehilangan relasi foreign key dan bergantung pada pencocokan string nama yang gagal jika admin mengubah nama opsi.

9. **[TINGGI] `GET /api/pengaturan` (Mode Publik) Gagal Mengambil `tanggal_tutup` karena Salah Nama Kolom (`keterangan` vs `alasan`)** — [app/api/pengaturan/route.js](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L136)  
   Baris 136 menjalankan `.from("tanggal_tutup").select("tanggal, keterangan")`, padahal kolom di tabel `tanggal_tutup` ([00001_skema.sql:59](file:///d:/Website-UMKN/supabase/migrations/00001_skema.sql#L59)) adalah `alasan`. Query selalu error sehingga `tanggal_tutup` pada respons publik `/api/pengaturan` selalu berupa array kosong `[]`.

10. **[TINGGI] Endpoint Detail Pesanan (`GET /api/pesanan/[kode]`) Membocorkan Data `pembayaran` dan Signed URL Bukti Bayar ke Role `staf`** — [app/api/pesanan/[kode]/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L47-L55) & [app/api/pesanan/[kode]/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L197-L244)  
    Menggunakan `getSupabaseAdmin()` (melewati RLS `00014_rls_audit.sql` yang membatasi tabel `pembayaran` hanya untuk admin dan pemilik pesanan) dan tetap mengembalikan objek `pembayaran` beserta `buktiUrl` kepada staf.

11. **[TINGGI] Tombol "Akses Cepat" dengan Email & Kata Sandi Hardcoded (`admin@cravely.com` / `password123`) Terpampang di Halaman Login Publik `/masuk`** — [app/masuk/page.js](file:///d:/Website-UMKN/app/masuk/page.js#L175-L206)  
    Menampilkan kredensial admin dan staf secara terbuka di halaman login produksi.

12. **[TINGGI] Hook `usePatisserieCart` Membaca Properti Respons API yang Salah (`json.items` & `total_item`)** — [lib/patisserieCart.js](file:///d:/Website-UMKN/lib/patisserieCart.js#L14-L24) vs [app/api/keranjang/route.js](file:///d:/Website-UMKN/app/api/keranjang/route.js#L91-L102)  
    `/api/keranjang` mengembalikan `{ keranjang, ringkasan: { total_kue, ... } }`, tetapi `usePatisserieCart` membaca `json.items` dan `json.ringkasan?.total_item`, serta tidak mengembalikan `totalPrice`. Akibatnya `cart` selalu `[]` dan `totalQty` selalu `0` pada komponen yang memakai hook tersebut ([DashboardPelangganView.js:66,955](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L66)).

13. **[TINGGI] Nomor Urut Migrasi Ganda (`00011` dan `00012`) di `supabase/migrations/`** — `00011_keranjang.sql` & `00011_perbaikan_daftar_user.sql`, `00012_fase1_katalog_pengaturan.sql` & `00012_ongkir_jarak.sql`  
    Duplikasi prefix nomor migrasi dapat menyebabkan kegagalan atau urutan eksekusi tidak deterministik pada Supabase CLI (`supabase db push` / `migration up`).

14. **[TINGGI] Keranjang Dikuras Sebelum Pembayaran Midtrans Selesai dan Tidak Dipulihkan Saat Pesanan Dibatalkan** — [app/api/checkout/route.js](file:///d:/Website-UMKN/app/api/checkout/route.js#L543-L547) & [app/api/pesanan/[kode]/batal/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/batal/route.js#L1-L82)  
    `POST /api/checkout` langsung menghapus seluruh `keranjang_item` saat pesanan berstatus `"Menunggu Pembayaran"` dibuat. Jika pelanggan gagal membayar atau membatalkan pesanan untuk mengubah item, seluruh racikan kue custom 3D dan item katalog di keranjang sudah hilang dan tidak dikembalikan.

15. **[TINGGI] Pagination `/dashboard/pesanan` Dilakukan di Memori Setelah Fetch Seluruh Tabel & Gagal Sign URL jika Pesanan Custom > 30** — [app/dashboard/pesanan/page.js](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L102-L237) & [app/api/berkas/signed-urls/route.js](file:///d:/Website-UMKN/app/api/berkas/signed-urls/route.js#L29)  
    Query mengambil seluruh baris `pesanan` tanpa `.range()`, lalu mengumpulkan seluruh path foto referensi/preview untuk di-sign sekaligus ke `/api/berkas/signed-urls` (yang menolak dengan HTTP 400 bila `paths.length > 30`), baru memotong 10 baris di sisi klien.

---

### 9.3 Daftar Halaman POLOS, SEBAGIAN, atau PLACEHOLDER / Yatim

1. **[app/uji-preview/page.js](file:///d:/Website-UMKN/app/uji-preview/page.js#L1-L185)** — Status: **PLACEHOLDER / YATIM (Halaman Uji Internal Terbuka untuk Publik)**  
   Halaman tes komponen `PreviewKue` dengan data opsi hardcoded di kode, tidak dilindungi autentikasi/role, dan tidak memiliki tautan masuk dari halaman mana pun.
2. **[app/kasir/page.js](file:///d:/Website-UMKN/app/kasir/page.js#L1-L12)** — Status: **SEBAGIAN (Redirect Murni)** & **Kode Mati di `KasirView.tsx`**  
   `/kasir` hanya melakukan `redirect("/keranjang")`, tetapi komponen [components/patisserie/KasirView.tsx](file:///d:/Website-UMKN/components/patisserie/KasirView.tsx#L154-L257) yang dipakai `/keranjang` masih memuat logika voucher dummy hardcoded (`CRAVELY20`, `MANIS10`, `CAKELY15`) dan modal checkout WhatsApp lama (`handleSendWhatsAppOrder`) yang tidak terhubung ke `/checkout` maupun database.
3. **[app/pesanan-saya/page.js](file:///d:/Website-UMKN/app/pesanan-saya/page.js#L1-L55), [app/profil/page.js](file:///d:/Website-UMKN/app/profil/page.js#L1-L6), [app/role-user/page.js](file:///d:/Website-UMKN/app/role-user/page.js#L1-L6), [app/role-user/[kode]/page.js](file:///d:/Website-UMKN/app/role-user/%5Bkode%5D/page.js#L1-L6)** — Status: **SEBAGIAN (Redirect & Komponen Yatim)**  
   Keempat rute ini sekarang hanya melakukan `redirect` ke `/user` atau `/pesanan-saya/[kode]`, menyebabkan komponen [components/DaftarPesananSayaView.js](file:///d:/Website-UMKN/components/DaftarPesananSayaView.js#L1-L320) menjadi yatim (tidak pernah dirender lagi).
4. **[components/patisserie/StoreProfilePages.tsx](file:///d:/Website-UMKN/components/patisserie/StoreProfilePages.tsx#L1-L965), [components/patisserie/CustomCakeStudio.tsx](file:///d:/Website-UMKN/components/patisserie/CustomCakeStudio.tsx#L1-L1234), [components/patisserie/PromoWelcomeModal.tsx](file:///d:/Website-UMKN/components/patisserie/PromoWelcomeModal.tsx#L1-L187), [components/patisserie/DessertIllustrations.tsx](file:///d:/Website-UMKN/components/patisserie/DessertIllustrations.tsx#L1-L344), [components/WizardPesan.js](file:///d:/Website-UMKN/components/WizardPesan.js#L1-L830), [components/SidebarDashboard.js](file:///d:/Website-UMKN/components/SidebarDashboard.js#L1-L108)** — Status: **YATIM (Tidak Diimpor oleh Halaman Aktif Mana Pun)**  
   Enam file komponen besar penuh data dummy/hardcoded (`Jl. Melati Manis No. 18`, `0812-3456-7890`, `CRAVELY20`) yang tidak dipakai oleh rute halaman mana pun.
5. **Tidak Ada `app/loading.js` di Root** — Hanya ada [app/dashboard/loading.js](file:///d:/Website-UMKN/app/dashboard/loading.js#L1-L40), sehingga navigasi antar halaman publik (`/`, `/menu`, `/toko`, `/syarat-ketentuan`, dll.) tidak memiliki fallback loading tingkat rute Next.js.

---

### 9.4 Hal yang Tidak Bisa Diverifikasi dari Kode

1. **Status Eksekusi Migrasi di Database Supabase Aktif** (`tidak bisa diverifikasi dari kode`):  
   Apakah kolom pada migrasi terbaru (`00011` s/d `00015`, khususnya `profil.lat_alamat`, `profil.lng_alamat`, dan apakah kolom di `pengaturan_toko` saat ini bernama `minimal_hari_siap` atau `minimal_hari_katalog`) sudah dijalankan di instance Supabase produksi/staging tidak bisa diverifikasi tanpa akses ke database.
2. **Konfigurasi Dashboard Midtrans & URL Webhook Aktif** (`tidak bisa diverifikasi dari kode`):  
   Apakah Payment Notification URL di dashboard Midtrans sudah diarahkan ke `/api/midtrans/webhook` dan apakah metode pembayaran tertentu (QRIS, GoPay, VA) sudah diaktifkan di akun Midtrans merchant tidak bisa diverifikasi dari kode.
3. **Konfigurasi Penjadwal Cron Eksternal (Vercel Cron / Supabase pg_cron)** (`tidak bisa diverifikasi dari kode`):  
   Tidak ada file `vercel.json` atau definisi `pg_cron` di repositori; apakah `/api/cron/batalkan-pesanan` dan `/api/cron/bersihkan-keranjang` benar-benar dipanggil secara berkala di server deployment tidak bisa diverifikasi dari kode.
4. **Konfigurasi Bucket & Policy Supabase Storage (`foto-referensi` dan `bukti-bayar`)** (`tidak bisa diverifikasi dari kode`):  
   Pembuatan bucket storage `foto-referensi` dan `bukti-bayar` beserta batas ukuran file dan policy RLS pada skema `storage.objects` tidak terdapat di dalam folder `supabase/migrations/`, sehingga status keamanannya di Supabase tidak bisa diverifikasi dari kode.
5. **Ketersediaan Font Lokal `/fonts/ Aerotis.otf` dan Gambar di Database** (`tidak bisa diverifikasi dari kode`):  
   URL foto produk yang tersimpan di tabel `produk_katalog.foto_url` atau `opsi_item` di database nyata tidak bisa diverifikasi dari kode.

---

### 9.5 Usulan Urutan Perbaikan per Fase (Beserta Estimasi Usaha S / M / L)

#### Fase 1: Kritis & Keamanan (Prioritas Segera)
1. **Perbaiki Query `pesanan_item` dan `pesanan_pilihan` di `/dashboard/hari-ini`** ([app/dashboard/hari-ini/page.js:85-93](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L85-L93)) — Hapus kolom yang tidak ada (`catatan_opsi`, `spesifikasi_singkat`, `teks_pilihan`) dan tambahkan pengecekan error agar alur produksi kue custom staf kembali berjalan. *(Usaha: **S**)*
2. **Tambahkan `metode_pengiriman` pada `SELECT pesanan` di `POST /api/pembayaran`** ([app/api/pembayaran/route.js:44](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L44)) — Agar staf bisa mencatat pelunasan `"Tunai di Tempat"` untuk pesanan `"Ambil"`. *(Usaha: **S**)*
3. **Wajibkan `CRON_SECRET` di Kedua Endpoint Cron** ([app/api/cron/batalkan-pesanan/route.js:8](file:///d:/Website-UMKN/app/api/cron/batalkan-pesanan/route.js#L8), [app/api/cron/bersihkan-keranjang/route.js:8](file:///d:/Website-UMKN/app/api/cron/bersihkan-keranjang/route.js#L8)) — Ubah kondisi menjadi `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)`. *(Usaha: **S**)*
4. **Selesaikan Konflik Kolom `minimal_hari_katalog` vs `minimal_hari_siap` dan `tanggal_tutup.alasan`** ([app/api/pengaturan/route.js:136,265,536,673](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L136), [lib/tokoPublik.js:59](file:///d:/Website-UMKN/lib/tokoPublik.js#L59)) — Gunakan `alasan` untuk `tanggal_tutup` dan selaraskan kolom `minimal_hari_katalog` tanpa menyeleksi kolom yang sudah di-rename. *(Usaha: **S**)*
5. **Hapus Tombol "Akses Cepat" Kredensial Hardcoded di `/masuk`** ([app/masuk/page.js:175-206](file:///d:/Website-UMKN/app/masuk/page.js#L175-L206)) dan **Batasi Data Pembayaran untuk Role `staf` di `GET /api/pesanan/[kode]`** ([app/api/pesanan/[kode]/route.js:47-55,197-244](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L47-L55)). *(Usaha: **S**)*
6. **Ganti Query Browser `pengaturan_toko` di `CheckoutView.js` ke `/api/pengaturan` & Perketat RLS `pengaturan_toko`** ([components/patisserie/CheckoutView.js:179](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L179), [supabase/migrations/00004_rls.sql:36](file:///d:/Website-UMKN/supabase/migrations/00004_rls.sql#L36)). *(Usaha: **M**)*

#### Fase 2: Alur Utama & Perhitungan Bisnis
7. **Perbaiki Perhitungan Kuota Harian (`kuota_harian`) agar Hanya Menghitung Kue Custom** ([app/api/ketersediaan/route.js:117-119](file:///d:/Website-UMKN/app/api/ketersediaan/route.js#L117-L119), [app/api/checkout/route.js:255-257](file:///d:/Website-UMKN/app/api/checkout/route.js#L255-L257), [app/api/pesanan/route.js:159-175](file:///d:/Website-UMKN/app/api/pesanan/route.js#L159-L175)). *(Usaha: **S**)*
8. **Isi `dikonfirmasi_pada` Saat Konfirmasi Pembayaran Manual** ([app/api/pembayaran/[id]/route.js:67-73](file:///d:/Website-UMKN/app/api/pembayaran/%5Bid%5D/route.js#L67-L73)) dan **Simpan `id_grup` & `id_item` Saat Checkout ke `pesanan_pilihan`** ([app/api/checkout/route.js:530-540](file:///d:/Website-UMKN/app/api/checkout/route.js#L530-L540)). *(Usaha: **S**)*
9. **Perbaiki Nama Kolom Salah di Tiket & Drawer Staf (`no_wa_penerima` -> `no_wa`, `alamat_pengiriman` -> `alamat`) serta Estimasi Tiba Melewati `tanggal_tutup`** ([app/pesanan-saya/[kode]/page.js:180-186,262](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L180-L186), [app/dashboard/hari-ini/page.js:1029](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L1029), [lib/estimasi.js:4-8](file:///d:/Website-UMKN/lib/estimasi.js#L4-L8)). *(Usaha: **S**)*
10. **Perbaiki Hook `usePatisserieCart`** ([lib/patisserieCart.js:14-24](file:///d:/Website-UMKN/lib/patisserieCart.js#L14-L24)) dan **Urutkan Kembali Nomor Migrasi `00011`–`00015`**. *(Usaha: **S**)*
11. **Terapkan Server-Side Pagination di `/dashboard/pesanan` & Chunking `/api/berkas/signed-urls`** ([app/dashboard/pesanan/page.js:102-237](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L102-L237)). *(Usaha: **M**)*

#### Fase 3: Halaman Polos, Komponen Yatim & Konsistensi
12. **Amankan atau Nonaktifkan `/uji-preview` di Produksi & Bersihkan Kode Voucher/WA Dummy di `KasirView.tsx`** ([app/uji-preview/page.js](file:///d:/Website-UMKN/app/uji-preview/page.js), [components/patisserie/KasirView.tsx:154-257](file:///d:/Website-UMKN/components/patisserie/KasirView.tsx#L154-L257)). *(Usaha: **S**)*
13. **Ganti Nilai Hardcoded Toko (`Jl. Melati Manis No. 18`, `2018`, dll.) di `CravelyEditorialSections.tsx` dengan Data `toko` dari Server** ([components/patisserie/CravelyEditorialSections.tsx:70,114,150,524](file:///d:/Website-UMKN/components/patisserie/CravelyEditorialSections.tsx#L70)). *(Usaha: **S**)*
14. **Tambahkan `app/loading.js` Global & Selaraskan `.env.example` dengan Seluruh Variabel Environment yang Dipakai Kode**. *(Usaha: **S**)*

#### Fase 4: Kosmetik, Kualitas Kode & Aksesibilitas
15. **Hapus Komentar Kode & `console.error` yang Tersisa, Tambahkan `lining-nums` di Semua Angka Harga, serta Lengkapi `aria-label` & Cleanup WebGL/Timer** ([app/pesan/page.js:4817](file:///d:/Website-UMKN/app/pesan/page.js#L4817), `components/patisserie/*`). *(Usaha: **M**)*

---

## BAGIAN 1: Inventaris Lengkap File Proyek

### 1.1 Halaman (`app/**/page.*`)

| Path File | Akses (Role) | Sumber Data | Status Kelengkapan & Bukti |
| :--- | :--- | :--- | :--- |
| [app/page.js](file:///d:/Website-UMKN/app/page.js#L1-L16) | Publik | Database (`getPopularCatalogCakes`, `getPengaturanTokoPublik`) + teks editorial hardcoded di komponen anak | **LENGKAP** (Server Component mengambil 4 kue populer & pengaturan toko, merender `HomePageClient`) |
| [app/masuk/page.js](file:///d:/Website-UMKN/app/masuk/page.js#L1-L235) | Publik | Supabase Auth (`signInWithPassword`) + `profil.role` + kredensial demo hardcoded di baris 180 & 196 | **LENGKAP** (Form login, validasi `?ke=`, redirect sesuai role; namun masih ada tombol demo Akses Cepat) |
| [app/daftar/page.js](file:///d:/Website-UMKN/app/daftar/page.js#L1-L216) | Publik | API `POST /api/daftar` + Supabase Auth (`signInWithPassword`) | **LENGKAP** (Form pendaftaran pelanggan, auto-login setelah daftar, redirect ke `?ke=` atau `/user`) |
| [app/lupa-sandi/page.js](file:///d:/Website-UMKN/app/lupa-sandi/page.js#L1-L137) | Publik | Supabase Auth (`resetPasswordForEmail`) | **LENGKAP** (Form kirim tautan reset kata sandi ke email dengan redirect `/atur-ulang-sandi`) |
| [app/atur-ulang-sandi/page.js](file:///d:/Website-UMKN/app/atur-ulang-sandi/page.js#L1-L176) | Publik (dengan token recovery) | Supabase Auth (`onAuthStateChange`, `getSession`, `updateUser`) | **LENGKAP** (Memeriksa sesi recovery, form sandi baru + konfirmasi, redirect ke `/masuk`) |
| [app/menu/page.js](file:///d:/Website-UMKN/app/menu/page.js#L1-L148) | Publik (tambah keranjang butuh login) | Database via `GET /api/produk`, `GET /api/kategori-produk`, `POST /api/keranjang` | **LENGKAP** (Katalog kue, filter kategori, pencarian, urut harga, tambah ke keranjang) |
| [app/toko/page.js](file:///d:/Website-UMKN/app/toko/page.js#L1-L141) | Publik | Database via `GET /api/pengaturan` + data etalase hardcoded di `ETALASE_CAKES` ([patisserieData.ts:309](file:///d:/Website-UMKN/components/patisserie/patisserieData.ts#L309)) | **SEBAGIAN** (Interior kafe interaktif memakai info toko dari DB, tetapi daftar kue di `EtalaseShowcaseView` memakai array statis `ETALASE_CAKES`) |
| [app/pesan/page.js](file:///d:/Website-UMKN/app/pesan/page.js#L1-L8094) | Publik (simpan ke keranjang/pesanan butuh login) | Database (`opsi_grup`, `opsi_item`, `pengaturan_toko`, `zona_ongkir`, `tanggal_tutup`, `GET /api/ketersediaan`, `POST /api/keranjang`, `POST /api/pesanan`) | **LENGKAP** (Studio 3D Custom Cake Three.js, pilih komponen, cek kuota, tambah ke keranjang atau buat pesanan) |
| [app/keranjang/page.js](file:///d:/Website-UMKN/app/keranjang/page.js#L1-L157) | Pelanggan (redirect ke `/masuk?ke=/keranjang` di layout) | Database via `GET /api/keranjang`, `PATCH /api/keranjang`, `DELETE /api/keranjang` | **LENGKAP** (Daftar item custom & katalog, ubah jumlah, hapus item tidak tersedia, lanjut ke `/checkout`) |
| [app/kasir/page.js](file:///d:/Website-UMKN/app/kasir/page.js#L1-L12) | Publik / Pelanggan | Tidak ada (hanya `redirect("/keranjang")`) | **SEBAGIAN (Redirect)** (Rute pengalihan ke `/keranjang`) |
| [app/checkout/page.js](file:///d:/Website-UMKN/app/checkout/page.js#L1-L26) | Pelanggan (redirect ke `/masuk?ke=/checkout` di layout) | Database via `GET /api/keranjang`, `GET /api/profil`, `GET /api/pesanan/terakhir-kirim`, `GET /api/ketersediaan`, `POST /api/ongkir`, `POST /api/checkout`, `POST /api/midtrans/token` | **LENGKAP** (Merender `CheckoutView` dengan peta Leaflet, hitung ongkir berundak, cek kuota, rincian DP, dan Midtrans Snap) |
| [app/user/page.js](file:///d:/Website-UMKN/app/user/page.js#L1-L234) | Pelanggan (admin/staf dialihkan ke `/dashboard`) | Database (`profil`, `pesanan`, `pesanan_item`, `pesanan_pilihan`, `pembayaran`, `log_status_pesanan`, `zona_ongkir`, `pengaturan_toko`) + `sinkronkanPesananMenungguPelanggan` | **LENGKAP** (Server Component yang menyinkronkan status Midtrans lalu merender `DashboardPelangganView`) |
| [app/user/[kode]/page.js](file:///d:/Website-UMKN/app/user/%5Bkode%5D/page.js#L1-L7) | Pelanggan | Tidak ada (hanya `redirect(\`/pesanan-saya/${kode}\`)`) | **SEBAGIAN (Redirect)** (Mengalihkan ke halaman tiket kanonik `/pesanan-saya/[kode]`) |
| [app/pesanan-saya/page.js](file:///d:/Website-UMKN/app/pesanan-saya/page.js#L1-L55) | Pelanggan | Tidak ada (hanya `redirect("/user?tab=orders")` setelah memuat `getSupabaseServer`) | **SEBAGIAN (Redirect)** (Mengalihkan ke tab Pesanan Saya di `/user`) |
| [app/pesanan-saya/[kode]/page.js](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L1-L654) | Pemilik Pesanan, Staf, Admin | Database (`pesanan`, `pesanan_item`, `pesanan_pilihan`, `pembayaran`, `log_status_pesanan`, `zona_ongkir`, `pengaturan_toko`) + Signed URL Storage + `sinkronkanSatuPesananMidtrans` | **LENGKAP** (Halaman tiket & invoice kanonik dengan tombol bayar Midtrans Snap, rincian kue, riwayat status, dan cetak struk) |
| [app/profil/page.js](file:///d:/Website-UMKN/app/profil/page.js#L1-L6) | Pelanggan | Tidak ada (`redirect("/user?tab=profile")`) | **SEBAGIAN (Redirect)** (Mengalihkan ke tab Pengaturan Profil di `/user`) |
| [app/role-user/page.js](file:///d:/Website-UMKN/app/role-user/page.js#L1-L6) | Pelanggan | Tidak ada (`redirect("/user")`) | **SEBAGIAN (Redirect)** (Rute kompatibilitas lama) |
| [app/role-user/[kode]/page.js](file:///d:/Website-UMKN/app/role-user/%5Bkode%5D/page.js#L1-L6) | Pelanggan | Tidak ada (`redirect(\`/pesanan-saya/${kode}\`)`) | **SEBAGIAN (Redirect)** (Rute kompatibilitas lama) |
| [app/syarat-ketentuan/page.js](file:///d:/Website-UMKN/app/syarat-ketentuan/page.js#L1-L108) | Publik | Database (`getPengaturanTokoPublik`) | **LENGKAP** (Halaman kebijakan dinamis sesuai `persen_dp`, `minimal_hari_pesan`, `maks_jarak_kirim_km` toko) |
| [app/kebijakan-privasi/page.js](file:///d:/Website-UMKN/app/kebijakan-privasi/page.js#L1-L97) | Publik | Database (`getPengaturanTokoPublik`) | **LENGKAP** (Halaman kebijakan privasi dengan kontak toko dari database) |
| [app/kebijakan-pembatalan/page.js](file:///d:/Website-UMKN/app/kebijakan-pembatalan/page.js#L1-L101) | Publik | Database (`getPengaturanTokoPublik`) | **LENGKAP** (Halaman kebijakan pembatalan & refund dinamis) |
| [app/uji-preview/page.js](file:///d:/Website-UMKN/app/uji-preview/page.js#L1-L185) | Publik (Tanpa proteksi) | Hardcoded di kode (`GRUP_CONTOH`) | **PLACEHOLDER / YATIM** (Halaman uji internal komponen SVG `PreviewKue` dengan data contoh statis) |
| [app/dashboard/page.js](file:///d:/Website-UMKN/app/dashboard/page.js#L1-L407) | Admin (Staf di-redirect ke `/dashboard/hari-ini`) | Database (`pesanan`, `pesanan_pilihan`, `pembayaran`, `opsi_grup`, `opsi_item`, `bahan_stok`) | **LENGKAP** (Ringkasan KPI, grafik pendapatan, pesanan perlu tindakan, analitik rasa/ukuran, peringatan stok) |
| [app/dashboard/hari-ini/page.js](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L1-L1141) | Admin, Staf | Database (`pesanan`, `pesanan_item`, `pesanan_pilihan`, `zona_ongkir`, `pengaturan_toko`) + API `/api/pesanan/[kode]`, `/api/pesanan/[kode]/status`, `/api/pembayaran` | **SEBAGIAN (Bug Kritis)** (UI lengkap, namun query `pesanan_item` & `pesanan_pilihan` gagal karena meminta kolom yang tidak ada di DB) |
| [app/dashboard/pesanan/page.js](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L1-L2087) | Admin, Staf | Database (`pesanan`, `pesanan_item`, `pesanan_pilihan`, `zona_ongkir`, `pengaturan_toko`) + API `/api/pesanan/[kode]/*`, `/api/pembayaran`, `/api/berkas/signed-urls` | **LENGKAP** (Tabel pesanan, filter, drawer detail, ubah status, serah terima, pelunasan tunai, tambah pembayaran manual, kurangi stok) |
| [app/dashboard/katalog-opsi/page.js](file:///d:/Website-UMKN/app/dashboard/katalog-opsi/page.js#L1-L1582) | Admin | Database via `/api/opsi`, `/api/opsi/resep`, `/api/stok`, `/api/produk`, `/api/kategori-produk` | **LENGKAP** (CRUD grup & item opsi custom, resep bahan per opsi, CRUD produk katalog & kategori, unggah foto) |
| [app/dashboard/stok/page.js](file:///d:/Website-UMKN/app/dashboard/stok/page.js#L1-L865) | Admin, Staf | Database via `/api/stok`, `/api/stok/riwayat` + query `pesanan`, `pesanan_pilihan`, `resep_item`, `opsi_item` | **LENGKAP** (Daftar bahan baku, tambah/kurangi stok, CRUD bahan untuk admin, hitung kebutuhan bahan harian, riwayat mutasi stok) |
| [app/dashboard/laporan/page.js](file:///d:/Website-UMKN/app/dashboard/laporan/page.js#L1-L654) | Admin | Database via `GET /api/laporan` | **LENGKAP** (Laporan omzet, piutang, metode bayar, pengiriman, rincian transaksi, ekspor CSV) |
| [app/dashboard/pengaturan/page.js](file:///d:/Website-UMKN/app/dashboard/pengaturan/page.js#L1-L2479) | Admin | Database via `/api/pengaturan` | **LENGKAP** (Profil toko, lokasi peta & simulasi ongkir berundak, jam buka, kuota & minimal hari, aturan DP, tanggal tutup) |
| [app/dashboard/akun/page.js](file:///d:/Website-UMKN/app/dashboard/akun/page.js#L1-L883) | Admin | Database via `/api/akun` | **LENGKAP** (Daftar akun pelanggan/staf/admin, tambah akun staf/admin, ubah role/nama/WA, reset sandi, hapus akun) |
| [app/dashboard/profil/page.js](file:///d:/Website-UMKN/app/dashboard/profil/page.js#L1-L598) | Admin, Staf | Database via `/api/profil` | **LENGKAP** (Ubah nama, nomor WA, dan kata sandi akun staf/admin yang sedang login) |

---

### 1.2 Layout, Error, Not-Found, dan Loading (`app/**/layout.*`, `error.js`, `not-found.js`, `loading.js`)

| Path File | Akses (Role) | Fungsi & Status |
| :--- | :--- | :--- |
| [app/layout.js](file:///d:/Website-UMKN/app/layout.js#L1-L55) | Publik | **LENGKAP** (Root layout, memuat font Google & `globals.css`, metadata dinamis dari `getPengaturanTokoPublik`) |
| [app/error.js](file:///d:/Website-UMKN/app/error.js#L1-L40) | Publik | **LENGKAP** (Error boundary global bergaya coquette/editorial dengan tombol "Coba Muat Ulang" dan "Kembali ke Beranda") |
| [app/not-found.js](file:///d:/Website-UMKN/app/not-found.js#L1-L34) | Publik | **LENGKAP** (Halaman 404 bergaya coquette/editorial dengan tautan ke `/` dan `/menu`) |
| `app/loading.js` | - | **TIDAK ADA** (Belum dibuat di root `app/`) |
| [app/masuk/layout.js](file:///d:/Website-UMKN/app/masuk/layout.js#L1-L8) | Publik | **LENGKAP** (Metadata halaman masuk) |
| [app/daftar/layout.js](file:///d:/Website-UMKN/app/daftar/layout.js#L1-L8) | Publik | **LENGKAP** (Metadata halaman daftar) |
| [app/menu/layout.js](file:///d:/Website-UMKN/app/menu/layout.js#L1-L8) | Publik | **LENGKAP** (Metadata halaman menu) |
| [app/keranjang/layout.js](file:///d:/Website-UMKN/app/keranjang/layout.js#L1-L16) | Pelanggan (Login) | **LENGKAP** (Memeriksa `cekRole(["pelanggan", "admin", "staf"])`, redirect ke `/masuk?ke=/keranjang` jika belum login) |
| [app/checkout/layout.js](file:///d:/Website-UMKN/app/checkout/layout.js#L1-L16) | Pelanggan (Login) | **LENGKAP** (Memeriksa `cekRole(["pelanggan", "admin", "staf"])`, redirect ke `/masuk?ke=/checkout` jika belum login) |
| [app/dashboard/layout.js](file:///d:/Website-UMKN/app/dashboard/layout.js#L1-L55) | Admin, Staf | **LENGKAP** (Memeriksa `cekRole(["admin", "staf"])`, menghitung badge pesanan perlu tindakan & stok menipis, merender `DashboardShell`) |
| [app/dashboard/loading.js](file:///d:/Website-UMKN/app/dashboard/loading.js#L1-L40) | Admin, Staf | **LENGKAP** (Skeleton loading bergaya dashboard hijau/krem) |
| [app/dashboard/hari-ini/layout.js](file:///d:/Website-UMKN/app/dashboard/hari-ini/layout.js#L1-L10) | Admin, Staf | **LENGKAP** (Guard server `cekRole(["admin", "staf"])`) |
| [app/dashboard/pesanan/layout.js](file:///d:/Website-UMKN/app/dashboard/pesanan/layout.js#L1-L10) | Admin, Staf | **LENGKAP** (Guard server `cekRole(["admin", "staf"])`) |
| [app/dashboard/stok/layout.js](file:///d:/Website-UMKN/app/dashboard/stok/layout.js#L1-L10) | Admin, Staf | **LENGKAP** (Guard server `cekRole(["admin", "staf"])`) |
| [app/dashboard/profil/layout.js](file:///d:/Website-UMKN/app/dashboard/profil/layout.js#L1-L10) | Admin, Staf | **LENGKAP** (Guard server `cekRole(["admin", "staf"])`) |
| [app/dashboard/katalog-opsi/layout.js](file:///d:/Website-UMKN/app/dashboard/katalog-opsi/layout.js#L1-L10) | Admin | **LENGKAP** (Guard server `cekRole(["admin"])`, redirect staf ke `/dashboard/hari-ini`) |
| [app/dashboard/laporan/layout.js](file:///d:/Website-UMKN/app/dashboard/laporan/layout.js#L1-L10) | Admin | **LENGKAP** (Guard server `cekRole(["admin"])`, redirect staf ke `/dashboard/hari-ini`) |
| [app/dashboard/pengaturan/layout.js](file:///d:/Website-UMKN/app/dashboard/pengaturan/layout.js#L1-L10) | Admin | **LENGKAP** (Guard server `cekRole(["admin"])`, redirect staf ke `/dashboard/hari-ini`) |
| [app/dashboard/akun/layout.js](file:///d:/Website-UMKN/app/dashboard/akun/layout.js#L1-L10) | Admin | **LENGKAP** (Guard server `cekRole(["admin"])`, redirect staf ke `/dashboard/hari-ini`) |

---

### 1.3 Route API (`app/api/**/route.js`)

| Path Route API | Method | Akses (Role) | Pemanggil di Kode | Status |
| :--- | :--- | :--- | :--- | :--- |
| [app/api/akun/route.js](file:///d:/Website-UMKN/app/api/akun/route.js#L1-L343) | `GET`, `POST`, `PUT`, `DELETE` | Admin (`cekRole(["admin"])`) | `app/dashboard/akun/page.js` | **LENGKAP** |
| [app/api/berkas/signed-urls/route.js](file:///d:/Website-UMKN/app/api/berkas/signed-urls/route.js#L1-L109) | `POST` | Pelanggan (hanya file miliknya), Staf, Admin | `app/dashboard/pesanan/page.js:206` | **LENGKAP** |
| [app/api/cari-alamat/route.js](file:///d:/Website-UMKN/app/api/cari-alamat/route.js#L1-L82) | `GET` | Login (`cekRole(["pelanggan", "admin", "staf"])`) | `components/patisserie/CheckoutView.js:307` | **LENGKAP** (Proxy Nominatim OpenStreetMap) |
| [app/api/checkout/route.js](file:///d:/Website-UMKN/app/api/checkout/route.js#L1-L595) | `POST` | Login (`cekRole(["pelanggan", "admin", "staf"])`) | `components/patisserie/CheckoutView.js:494` | **SEBAGIAN** (Bug kuota katalog & tidak menyimpan `id_item`/`id_grup` di `pesanan_pilihan`) |
| [app/api/cron/batalkan-pesanan/route.js](file:///d:/Website-UMKN/app/api/cron/batalkan-pesanan/route.js#L1-L26) | `GET`, `POST` | Cron (`Bearer CRON_SECRET`) | Eksternal (Cron job) | **SEBAGIAN** (Bug bypass jika `CRON_SECRET` kosong) |
| [app/api/cron/bersihkan-keranjang/route.js](file:///d:/Website-UMKN/app/api/cron/bersihkan-keranjang/route.js#L1-L31) | `GET`, `POST` | Cron (`Bearer CRON_SECRET`) | Eksternal (Cron job) | **SEBAGIAN** (Bug bypass jika `CRON_SECRET` kosong) |
| [app/api/daftar/route.js](file:///d:/Website-UMKN/app/api/daftar/route.js#L1-L133) | `POST` | Publik (dengan rate limit IP) | `app/daftar/page.js:51` | **LENGKAP** |
| [app/api/kategori-produk/route.js](file:///d:/Website-UMKN/app/api/kategori-produk/route.js#L1-L198) | `GET`, `POST`, `PATCH`, `DELETE` | `GET` Publik (`all=1` Admin); `POST`/`PATCH`/`DELETE` Admin | `app/menu/page.js`, `app/dashboard/katalog-opsi/page.js` | **LENGKAP** |
| [app/api/keranjang/route.js](file:///d:/Website-UMKN/app/api/keranjang/route.js#L1-L353) | `GET`, `POST`, `PATCH`, `DELETE` | Login (`cekRole(["pelanggan", "admin", "staf"])`) | `app/keranjang/page.js`, `app/menu/page.js`, `app/pesan/page.js`, `CheckoutView.js`, `patisserieCart.js` | **LENGKAP** |
| [app/api/keranjang/jumlah/route.js](file:///d:/Website-UMKN/app/api/keranjang/jumlah/route.js#L1-L30) | `GET` | Publik / Login (mengembalikan `0` jika belum login) | `DynamicIslandNavbar.jsx:64`, `DashboardPelangganView.js:139` | **LENGKAP** |
| [app/api/ketersediaan/route.js](file:///d:/Website-UMKN/app/api/ketersediaan/route.js#L1-L176) | `GET` | Publik | `app/pesan/page.js:3978`, `CheckoutView.js:193` | **SEBAGIAN** (Bug pesanan katalog ikut dihitung memotong kuota custom) |
| [app/api/laporan/route.js](file:///d:/Website-UMKN/app/api/laporan/route.js#L1-L321) | `GET` | Admin (`cekRole(["admin"])`) | `app/dashboard/laporan/page.js:65` | **LENGKAP** |
| [app/api/midtrans/cek/route.js](file:///d:/Website-UMKN/app/api/midtrans/cek/route.js#L1-L58) | `POST` | Pemilik Pesanan, Staf, Admin | `components/TombolBayarMidtrans.js:93,122` | **LENGKAP** |
| [app/api/midtrans/token/route.js](file:///d:/Website-UMKN/app/api/midtrans/token/route.js#L1-L266) | `POST` | Pemilik Pesanan atau Admin | `CheckoutView.js:516`, `TombolBayarMidtrans.js:171` | **LENGKAP** |
| [app/api/midtrans/webhook/route.js](file:///d:/Website-UMKN/app/api/midtrans/webhook/route.js#L1-L262) | `POST` | Midtrans Server (verifikasi SHA-512 `signature_key`) | Eksternal (Midtrans Webhook) | **LENGKAP** |
| [app/api/ongkir/route.js](file:///d:/Website-UMKN/app/api/ongkir/route.js#L1-L107) | `POST` | Publik | `CheckoutView.js:261` | **LENGKAP** |
| [app/api/opsi/route.js](file:///d:/Website-UMKN/app/api/opsi/route.js#L1-L189) | `POST`, `PUT`, `DELETE` | Admin (`cekRole(["admin"])`) | `app/dashboard/katalog-opsi/page.js:180` | **LENGKAP** |
| [app/api/opsi/resep/route.js](file:///d:/Website-UMKN/app/api/opsi/resep/route.js#L1-L115) | `GET`, `PUT` | Admin (`cekRole(["admin"])`) | `app/dashboard/katalog-opsi/page.js:225,268` | **LENGKAP** |
| [app/api/pembayaran/route.js](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L1-L214) | `POST` | Pemilik Pesanan, Staf (khusus Tunai Ambil), Admin | `app/dashboard/hari-ini/page.js:234`, `app/dashboard/pesanan/page.js:544`, `TombolBayarMidtrans.js:292` | **SEBAGIAN (Bug Kritis)** (Staf selalu 403 karena `metode_pengiriman` lupa di-select) |
| [app/api/pembayaran/[id]/route.js](file:///d:/Website-UMKN/app/api/pembayaran/%5Bid%5D/route.js#L1-L148) | `PATCH` | Admin (`cekRole(["admin"])`) | `app/dashboard/pesanan/page.js:496` | **SEBAGIAN** (Tidak mengisi `dikonfirmasi_pada`) |
| [app/api/pengaturan/route.js](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L1-L1079) | `GET`, `PUT`, `POST`, `DELETE` | `GET` Publik (`?scope=admin` untuk Admin); `PUT`/`POST`/`DELETE` Admin | `app/dashboard/pengaturan/page.js`, `DynamicIslandNavbar.jsx`, `PatisserieFooter.tsx`, `KasirView.tsx` | **SEBAGIAN** (Bug `tanggal_tutup.keterangan` dan konflik `minimal_hari_siap`) |
| [app/api/pesanan/route.js](file:///d:/Website-UMKN/app/api/pesanan/route.js#L1-L523) | `POST` | Login (`cekRole(["pelanggan", "admin", "staf"])`) | `app/pesan/page.js:5921`, `components/WizardPesan.js:246` | **SEBAGIAN** (Kuota menghitung semua pesanan tanpa filter custom) |
| [app/api/pesanan/terakhir-kirim/route.js](file:///d:/Website-UMKN/app/api/pesanan/terakhir-kirim/route.js#L1-L39) | `GET` | Login (`cekRole(["pelanggan", "admin", "staf"])`) | `CheckoutView.js:228` | **LENGKAP** |
| [app/api/pesanan/[kode]/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L1-L248) | `GET` | Pemilik Pesanan, Staf, Admin | `app/dashboard/hari-ini/page.js:144`, `app/dashboard/pesanan/page.js:270` | **SEBAGIAN** (Mengirim data `pembayaran` & `buktiUrl` ke staf) |
| [app/api/pesanan/[kode]/batal/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/batal/route.js#L1-L82) | `POST` | Pemilik Pesanan (ketika Menunggu Pembayaran & belum ada bayar Dikonfirmasi) | `DashboardPelangganView.js:106`, `TombolBayarMidtrans.js:225` | **LENGKAP** |
| [app/api/pesanan/[kode]/status/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/status/route.js#L1-L237) | `PATCH` | Admin, Staf (staf dilarang `Dibatalkan`) | `app/dashboard/hari-ini/page.js:172`, `app/dashboard/pesanan/page.js:322,386,457` | **LENGKAP** |
| [app/api/pesanan/[kode]/stok/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/stok/route.js#L1-L162) | `POST` | Admin, Staf | `app/dashboard/pesanan/page.js:424` | **LENGKAP** |
| [app/api/produk/route.js](file:///d:/Website-UMKN/app/api/produk/route.js#L1-L315) | `GET`, `POST`, `PATCH`, `DELETE` | `GET` Publik (`?all=1` Admin); `POST`/`PATCH`/`DELETE` Admin | `app/menu/page.js:27`, `app/dashboard/katalog-opsi/page.js` | **LENGKAP** |
| [app/api/profil/route.js](file:///d:/Website-UMKN/app/api/profil/route.js#L1-L227) | `GET`, `PUT` | Login (`cekRole(["pelanggan", "admin", "staf"])`) | `DashboardPelangganView.js`, `app/dashboard/profil/page.js`, `CheckoutView.js`, `DynamicIslandNavbar.jsx` | **LENGKAP** |
| [app/api/stok/route.js](file:///d:/Website-UMKN/app/api/stok/route.js#L1-L194) | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | `GET`/`PATCH` Admin & Staf; `POST`/`PUT`/`DELETE` Admin | `app/dashboard/stok/page.js`, `app/dashboard/katalog-opsi/page.js` | **LENGKAP** |
| [app/api/stok/riwayat/route.js](file:///d:/Website-UMKN/app/api/stok/riwayat/route.js#L1-L40) | `GET` | Admin, Staf (`cekRole(["admin", "staf"])`) | `app/dashboard/stok/page.js:111` | **LENGKAP** |
| [app/api/tarif-jarak/route.js](file:///d:/Website-UMKN/app/api/tarif-jarak/route.js#L1-L170) | `GET`, `POST`, `PUT`, `DELETE` | `GET` Publik (`?all=1` Admin); `POST`/`PUT`/`DELETE` Admin | **TIDAK DIPANGGIL DI MANA PUN** (Digantikan oleh `/api/pengaturan` dengan `tipe: "tarif_jarak"`) | **YATIM (Route API Tidak Dipanggil)** |

---

### 1.4 Komponen (`components/**`)

| Path Komponen | Dipakai Oleh | Sumber Data | Status |
| :--- | :--- | :--- | :--- |
| [components/BadgeStatus.js](file:///d:/Website-UMKN/components/BadgeStatus.js#L1-L58) | `app/pesanan-saya/[kode]/page.js`, `app/dashboard/**`, `DaftarPesananSayaView.js` | Props `status`, `tipe` | **LENGKAP** |
| [components/DaftarPesananSayaView.js](file:///d:/Website-UMKN/components/DaftarPesananSayaView.js#L1-L320) | **TIDAK ADA** (Dulunya dipakai `app/pesanan-saya/page.js` sebelum diganti redirect ke `/user?tab=orders`) | Props `daftarPesanan` | **YATIM** |
| [components/DashboardAdminView.js](file:///d:/Website-UMKN/components/DashboardAdminView.js#L1-L725) | `app/dashboard/page.js` | Props dari server component `app/dashboard/page.js` | **LENGKAP** |
| [components/DashboardPelangganView.js](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L1-L2624) | `app/user/page.js` | Props dari `app/user/page.js` + API `/api/profil`, `/api/keranjang/jumlah`, `/api/pesanan/[kode]/batal` | **LENGKAP** |
| [components/DashboardShell.js](file:///d:/Website-UMKN/components/DashboardShell.js#L1-L220) | `app/dashboard/layout.js` | Props `role`, `nama`, `email`, `jumlahTindakan`, `jumlahStokMenipis` | **LENGKAP** |
| [components/DashboardStafView.js](file:///d:/Website-UMKN/components/DashboardStafView.js#L1-L320) | `app/dashboard/page.js` (sebagai fallback jika role `staf` tidak ter-redirect) | Props dari `app/dashboard/page.js` | **SEBAGIAN (Tak Terjangkau)** (`app/dashboard/page.js:13` langsung me-redirect `staf` ke `/dashboard/hari-ini`, sehingga komponen ini praktis tidak pernah dirender) |
| [components/ModalPesan.js](file:///d:/Website-UMKN/components/ModalPesan.js#L1-L95) | `app/dashboard/**` (6 halaman dashboard) | Props `terbuka`, `judul`, `pesan`, `tipe`, `onTutup`, `onKonfirmasi` | **LENGKAP** |
| [components/PetaLokasi.js](file:///d:/Website-UMKN/components/PetaLokasi.js#L1-L169) | `CheckoutView.js`, `DashboardPelangganView.js`, `app/dashboard/pengaturan/page.js` | Leaflet + OpenStreetMap tiles | **LENGKAP** |
| [components/PortalLedge.js](file:///d:/Website-UMKN/components/PortalLedge.js#L1-L108) | `app/pesan/page.js` | Props `step`, `totalSteps`, `onPrev`, `onNext` | **LENGKAP** |
| [components/PreviewKue.js](file:///d:/Website-UMKN/components/PreviewKue.js#L1-L270) | `app/pesan/page.js`, `app/pesanan-saya/[kode]/page.js`, `app/dashboard/hari-ini/page.js`, `app/dashboard/pesanan/page.js`, `app/uji-preview/page.js`, `WizardPesan.js` | Props `pilihan`, `tulisan` | **LENGKAP** |
| [components/SidebarDashboard.js](file:///d:/Website-UMKN/components/SidebarDashboard.js#L1-L108) | **TIDAK ADA** (Digantikan oleh `DashboardShell.js`) | Props `role`, `nama` | **YATIM** |
| [components/TombolBayarMidtrans.js](file:///d:/Website-UMKN/components/TombolBayarMidtrans.js#L1-L398) | `app/pesanan-saya/[kode]/page.js`, `DashboardPelangganView.js` | API `/api/midtrans/token`, `/api/midtrans/cek`, `/api/pesanan/[kode]/batal`, `/api/pembayaran` | **LENGKAP** |
| [components/TombolKeluar.js](file:///d:/Website-UMKN/components/TombolKeluar.js#L1-L25) | `DashboardPelangganView.js`, `DaftarPesananSayaView.js`, `SidebarDashboard.js` | `supabaseBrowser.auth.signOut()` | **LENGKAP** |
| [components/WizardPesan.js](file:///d:/Website-UMKN/components/WizardPesan.js#L1-L830) | **TIDAK ADA** (Digantikan oleh studio 3D di `app/pesan/page.js`) | Props `pengaturan`, `daftarGrup`, `daftarZona`, `daftarTutup` | **YATIM** |
| [components/patisserie/BotanicalBranchDecor.tsx](file:///d:/Website-UMKN/components/patisserie/BotanicalBranchDecor.tsx#L1-L356) | `app/menu/page.js` | SVG dekoratif murni | **LENGKAP** |
| [components/patisserie/CafeScene.tsx](file:///d:/Website-UMKN/components/patisserie/CafeScene.tsx#L1-L1528) | `HomePageClient.jsx`, `app/toko/page.js` | Props `toko` + SVG kafe interaktif | **LENGKAP** |
| [components/patisserie/CafeStoryShowcase.tsx](file:///d:/Website-UMKN/components/patisserie/CafeStoryShowcase.tsx#L1-L1008) | `HomePageClient.jsx` | Props `popularCakes`, `toko` | **LENGKAP** |
| [components/patisserie/CheckoutView.js](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L1-L1472) | `app/checkout/page.js` | API `/api/keranjang`, `/api/profil`, `/api/pesanan/terakhir-kirim`, `/api/ketersediaan`, `/api/ongkir`, `/api/cari-alamat`, `/api/checkout`, `/api/midtrans/token` + `supabaseBrowser.from("pengaturan_toko")` | **LENGKAP** |
| [components/patisserie/CravelyEditorialSections.tsx](file:///d:/Website-UMKN/components/patisserie/CravelyEditorialSections.tsx#L1-L1117) | `CafeStoryShowcase.tsx` | Props `popularCakes`, `toko` + teks cerita/testimoni/galeri hardcoded | **SEBAGIAN** (Masih ada alamat `Jl. Melati Manis No. 18` & tahun `2018` hardcoded di cerita/galeri) |
| [components/patisserie/CustomCakeStudio.tsx](file:///d:/Website-UMKN/components/patisserie/CustomCakeStudio.tsx#L1-L1234) | **TIDAK ADA** (`app/pesan/page.js` punya implementasi Three.js sendiri) | Data opsi hardcoded (`SIZES`, `SHAPES`, `FLAVORS`, dll.) | **YATIM** |
| [components/patisserie/DessertIllustrations.tsx](file:///d:/Website-UMKN/components/patisserie/DessertIllustrations.tsx#L1-L344) | **TIDAK ADA** | SVG ilustrasi statis | **YATIM** |
| [components/patisserie/DessertsMenuView.tsx](file:///d:/Website-UMKN/components/patisserie/DessertsMenuView.tsx#L1-L659) | `app/menu/page.js` | Props `items`, `kategoriList` dari `/api/produk` & `/api/kategori-produk` | **LENGKAP** |
| [components/patisserie/DynamicIslandNavbar.jsx](file:///d:/Website-UMKN/components/patisserie/DynamicIslandNavbar.jsx#L1-L518) | `HomePageClient.jsx`, `app/menu/page.js`, `app/toko/page.js`, `app/keranjang/page.js`, `app/checkout/page.js`, `app/pesan/page.js` | Props `toko` + API `/api/pengaturan`, `/api/keranjang/jumlah`, `/api/profil` | **LENGKAP** |
| [components/patisserie/EtalaseShowcaseView.tsx](file:///d:/Website-UMKN/components/patisserie/EtalaseShowcaseView.tsx#L1-L575) | `app/toko/page.js` | Data konstan `ETALASE_CAKES` dari `patisserieData.ts` | **SEBAGIAN** (Kue etalase berasal dari konstanta statis `ETALASE_CAKES`, bukan dari tabel `produk_katalog`) |
| [components/patisserie/HomePageClient.jsx](file:///d:/Website-UMKN/components/patisserie/HomePageClient.jsx#L1-L87) | `app/page.js` | Props `popularCakes`, `toko` | **LENGKAP** |
| [components/patisserie/KasirView.tsx](file:///d:/Website-UMKN/components/patisserie/KasirView.tsx#L1-L979) | `app/keranjang/page.js` | Props `keranjang`, `ringkasan` dari `/api/keranjang` + voucher/modal WA hardcoded (tidak terpakai di UI utama tetapi masih ada di kode) | **SEBAGIAN** |
| [components/patisserie/PatisserieFooter.tsx](file:///d:/Website-UMKN/components/patisserie/PatisserieFooter.tsx#L1-L283) | `HomePageClient.jsx`, `app/menu/page.js`, `app/toko/page.js`, `app/keranjang/page.js`, `app/checkout/page.js`, `app/syarat-ketentuan/page.js`, `app/kebijakan-privasi/page.js`, `app/kebijakan-pembatalan/page.js` | Props `toko` atau fetch `/api/pengaturan` | **LENGKAP** |
| [components/patisserie/PipingBagCursor.tsx](file:///d:/Website-UMKN/components/patisserie/PipingBagCursor.tsx#L1-L101) | `HomePageClient.jsx`, `app/menu/page.js`, `app/toko/page.js`, `app/keranjang/page.js`, `app/checkout/page.js` | Event mouse browser | **LENGKAP** |
| [components/patisserie/PromoWelcomeModal.tsx](file:///d:/Website-UMKN/components/patisserie/PromoWelcomeModal.tsx#L1-L187) | **TIDAK ADA** | Voucher hardcoded `CRAVELY20` | **YATIM** |
| [components/patisserie/StoreProfilePages.tsx](file:///d:/Website-UMKN/components/patisserie/StoreProfilePages.tsx#L1-L965) | **TIDAK ADA** | Data hardcoded (`DOC_ITEMS`, `MONTHLY_PROMOS`, `0812-3456-7890`, `Jl. Melati Manis No. 18`) | **YATIM** |
| [components/patisserie/WalkingPatissier.tsx](file:///d:/Website-UMKN/components/patisserie/WalkingPatissier.tsx#L1-L874) | `CafeScene.tsx` | Animasi karakter SVG + dialog `PATISSIER_CLICK_LINES` | **LENGKAP** |
| [components/patisserie/patisserieData.ts](file:///d:/Website-UMKN/components/patisserie/patisserieData.ts#L1-L464) | `CafeScene.tsx`, `WalkingPatissier.tsx`, `EtalaseShowcaseView.tsx`, `DessertsMenuView.tsx`, `KasirView.tsx`, `CravelyEditorialSections.tsx`, `PatisserieFooter.tsx` | Konstanta tipe, `ETALASE_CAKES`, `MENU_DESSERTS`, `formatRupiah` | **LENGKAP** |
| [components/patisserie/etalase3d/DimensionalCakes.tsx](file:///d:/Website-UMKN/components/patisserie/etalase3d/DimensionalCakes.tsx#L1-L538) | `EtalaseShowcaseView.tsx` | SVG kue 2.5D berdasarkan `cakeId` | **LENGKAP** |

---

### 1.5 Pustaka & Utilitas (`lib/*`)

| Path File | Dipakai Oleh | Fungsi & Status |
| :--- | :--- | :--- |
| [lib/cekRole.js](file:///d:/Website-UMKN/lib/cekRole.js#L1-L65) | Semua layout dashboard, semua API terproteksi | **LENGKAP** (Autentikasi pengguna via Supabase Server & query `profil.role`) |
| [lib/estimasi.js](file:///d:/Website-UMKN/lib/estimasi.js#L1-L60) | `CheckoutView.js`, `DashboardPelangganView.js` | **SEBAGIAN** (Baris 7 menggunakan `dt.toISOString().slice(0, 10)` yang berbasis UTC) |
| [lib/format.js](file:///d:/Website-UMKN/lib/format.js#L1-L263) | Hampir seluruh halaman & API | **LENGKAP** (Format Rupiah, tanggal Indonesia Asia/Jakarta, validasi WA, link WA tiket) |
| [lib/hitungHarga.js](file:///d:/Website-UMKN/lib/hitungHarga.js#L1-L97) | `app/pesan/page.js`, `CheckoutView.js`, `app/api/checkout/route.js`, `app/api/pesanan/route.js` | **LENGKAP** (Rumus tunggal `hitungTotal` dan `hitungRincianKeranjang`) |
| [lib/jam.js](file:///d:/Website-UMKN/lib/jam.js#L1-L132) | `app/pesan/page.js`, `CheckoutView.js`, `DashboardPelangganView.js`, `app/api/checkout/route.js`, `app/api/pesanan/route.js`, `app/api/ketersediaan/route.js`, `app/api/pengaturan/route.js` | **LENGKAP** (Perhitungan jam buka/tutup per kelompok hari Senin-Jumat vs Sabtu-Minggu di zona `Asia/Jakarta`) |
| [lib/kedaluwarsa.js](file:///d:/Website-UMKN/lib/kedaluwarsa.js#L1-L93) | `app/api/cron/batalkan-pesanan/route.js`, `app/api/ketersediaan/route.js`, `app/api/checkout/route.js`, `app/api/pesanan/route.js`, `app/dashboard/pesanan/page.js` | **LENGKAP** (Pembatalan otomatis pesanan `"Menunggu Pembayaran"` yang melewati `batas_bayar` atau `24 jam`) |
| [lib/menuPopuler.js](file:///d:/Website-UMKN/lib/menuPopuler.js#L1-L67) | `app/page.js` | **LENGKAP** (Mengambil 4 produk katalog aktif unggulan untuk landing page) |
| [lib/midtrans.js](file:///d:/Website-UMKN/lib/midtrans.js#L1-L163) | `app/api/midtrans/token/route.js`, `app/api/midtrans/webhook/route.js`, `lib/midtransSinkron.js` | **LENGKAP** (Integrasi Snap API, Status API, dan verifikasi SHA-512 signature Midtrans) |
| [lib/midtransSinkron.js](file:///d:/Website-UMKN/lib/midtransSinkron.js#L1-L264) | `app/api/midtrans/cek/route.js`, `app/pesanan-saya/[kode]/page.js`, `app/user/page.js` | **LENGKAP** (Sinkronisasi status transaksi Midtrans ke tabel `pembayaran` dan `pesanan`) |
| [lib/ongkir.js](file:///d:/Website-UMKN/lib/ongkir.js#L1-L148) | `app/api/ongkir/route.js`, `app/api/checkout/route.js`, `app/api/pengaturan/route.js`, `app/api/tarif-jarak/route.js`, `app/dashboard/pengaturan/page.js` | **LENGKAP** (Rumus Haversine, validasi koordinat Indonesia, pencocokan tarif berundak, estimasi durasi kirim) |
| [lib/patisserieCart.js](file:///d:/Website-UMKN/lib/patisserieCart.js#L1-L65) | `DashboardPelangganView.js`, `DynamicIslandNavbar.jsx` (diimpor tapi tidak dipanggil di navbar) | **SEBAGIAN (Bug)** (Membaca properti `json.items` dan `ringkasan.total_item` yang tidak ada di respons `/api/keranjang`) |
| [lib/rateLimit.js](file:///d:/Website-UMKN/lib/rateLimit.js#L1-L39) | `app/api/daftar/route.js`, `app/api/cari-alamat/route.js` | **LENGKAP** (In-memory sliding window rate limiter per key/IP) |
| [lib/supabaseBrowser.js](file:///d:/Website-UMKN/lib/supabaseBrowser.js#L1-L16) | Komponen client (`masuk`, `daftar`, `lupa-sandi`, `atur-ulang-sandi`, `pesan`, `CheckoutView`, `DashboardPelangganView`, `app/dashboard/**`) | **LENGKAP** (Singleton browser client `@supabase/ssr`) |
| [lib/supabaseServer.js](file:///d:/Website-UMKN/lib/supabaseServer.js#L1-L40) | Server Components & API Routes | **LENGKAP** (`getSupabaseServer` dengan cookies & `getSupabaseAdmin` dengan `SUPABASE_SERVICE_ROLE_KEY`) |
| [lib/tokoPublik.js](file:///d:/Website-UMKN/lib/tokoPublik.js#L1-L157) | `app/layout.js`, `app/page.js`, `app/syarat-ketentuan/page.js`, `app/kebijakan-privasi/page.js`, `app/kebijakan-pembatalan/page.js` | **SEBAGIAN** (Baris 59 meminta kolom `minimal_hari_katalog` dan `minimal_hari_siap` sekaligus) |

---

### 1.6 Ringkasan File Yatim & Route API Tidak Dipanggil

- **Komponen Yatim (Tidak diimpor di halaman aktif mana pun)**:
  1. [components/DaftarPesananSayaView.js](file:///d:/Website-UMKN/components/DaftarPesananSayaView.js)
  2. [components/SidebarDashboard.js](file:///d:/Website-UMKN/components/SidebarDashboard.js)
  3. [components/WizardPesan.js](file:///d:/Website-UMKN/components/WizardPesan.js)
  4. [components/patisserie/CustomCakeStudio.tsx](file:///d:/Website-UMKN/components/patisserie/CustomCakeStudio.tsx)
  5. [components/patisserie/DessertIllustrations.tsx](file:///d:/Website-UMKN/components/patisserie/DessertIllustrations.tsx)
  6. [components/patisserie/PromoWelcomeModal.tsx](file:///d:/Website-UMKN/components/patisserie/PromoWelcomeModal.tsx)
  7. [components/patisserie/StoreProfilePages.tsx](file:///d:/Website-UMKN/components/patisserie/StoreProfilePages.tsx)
- **Halaman Yatim (Tidak ada tautan masuk dari seluruh aplikasi)**:
  1. [app/uji-preview/page.js](file:///d:/Website-UMKN/app/uji-preview/page.js)
  2. [app/role-user/page.js](file:///d:/Website-UMKN/app/role-user/page.js) & [app/role-user/[kode]/page.js](file:///d:/Website-UMKN/app/role-user/%5Bkode%5D/page.js) (hanya redirect kompatibilitas)
- **Route API Tidak Dipanggil oleh Kode Frontend/Server Mana Pun**:
  1. [app/api/tarif-jarak/route.js](file:///d:/Website-UMKN/app/api/tarif-jarak/route.js) — Seluruh CRUD tarif jarak di `app/dashboard/pengaturan/page.js` memanggil `/api/pengaturan` (`tipe: "tarif_jarak"`), sehingga `/api/tarif-jarak` tidak pernah dipanggil.
  2. *(Catatan: `/api/midtrans/webhook`, `/api/cron/batalkan-pesanan`, dan `/api/cron/bersihkan-keranjang` memang dirancang untuk dipanggil dari luar aplikasi oleh Midtrans / Cron).*

---

## BAGIAN 2: Halaman Polos, Belum Selesai, atau Berisi Nilai Hardcoded

### Temuan 2.1 — Halaman Uji Internal `/uji-preview` Terbuka untuk Publik dengan Data Hardcoded
- **File & Baris**: [app/uji-preview/page.js:1-185](file:///d:/Website-UMKN/app/uji-preview/page.js#L1-L185)
- **Apa yang Salah**: Halaman `/uji-preview` berisi harness pengujian komponen `PreviewKue` dengan data dummy tertulis di kode (`GRUP_CONTOH`, baris 6-81), tanpa autentikasi, dan tanpa tautan kembali ke aplikasi.
- **Pemicu / Dampak**: Pengunjung publik yang membuka `/uji-preview` akan melihat halaman internal pengujian komponen SVG kue.
- **Saran Perbaikan**: Batasi halaman ini hanya untuk mode development (`if (process.env.NODE_ENV === "production") notFound()`) atau lindungi dengan `cekRole(["admin"])`.
- **Tingkat**: **SEDANG**

### Temuan 2.2 — Tombol "Akses Cepat" dengan Kredensial Admin & Petugas Hardcoded di Halaman Login `/masuk`
- **File & Baris**: [app/masuk/page.js:175-206](file:///d:/Website-UMKN/app/masuk/page.js#L175-L206)
- **Apa yang Salah**: Terdapat blok UI `"Akses Cepat (Uji Coba Role)"` di halaman login publik yang menuliskan secara eksplisit `setEmail("admin@cravely.com"); setKataSandi("password123");` (baris 180-181) dan `setEmail("staf@cravely.com"); setKataSandi("password123");` (baris 196-197).
- **Pemicu / Dampak**: Siapa pun yang membuka `/masuk` dapat melihat email dan kata sandi akun admin serta staf dengan sekali klik. Jika akun seeder tersebut ada di database produksi, pengunjung publik dapat mengambil alih dashboard admin.
- **Saran Perbaikan**: Hapus blok tombol "Akses Cepat" dari `app/masuk/page.js`.
- **Tingkat**: **TINGGI**

### Temuan 2.3 — Sistem Voucher Dummy & Modal Checkout WhatsApp Hardcoded di `KasirView.tsx`
- **File & Baris**: [components/patisserie/KasirView.tsx:116-129, 154-257, 795-975](file:///d:/Website-UMKN/components/patisserie/KasirView.tsx#L154-L257)
- **Apa yang Salah**: Di dalam `KasirView.tsx` (komponen keranjang `/keranjang`), masih terdapat fungsi `handleApplyVoucher` dengan kode voucher hardcoded (`CRAVELY20`, `PROMO20`, `MANIS10`, `DISKON10`, `CAKELY15`, `GRATISONGKIR` pada baris 162-177) serta modal checkout WhatsApp lama (`handleSendWhatsAppOrder`, baris 196-257 dan 795-975) yang menulis header `"KONFIRMASI PESANAN - CAKELY PATISSERIE"` dan meminta nomor rekening transfer manual. Selain itu terdapat peta foto & deskripsi hardcoded `CAKE_PHOTO_MAP` dan `CAKE_DESC_MAP` (baris 50-95).
- **Pemicu / Dampak**: Meskipun tombol utama `"Lanjut ke Checkout"` sudah mengarah ke `/checkout` (baris 189-194), state modal `isCheckoutModalOpen` dan logika diskon voucher membebani bundle klien dan berisiko membingungkan bila terpicu.
- **Saran Perbaikan**: Bersihkan state voucher dummy dan modal WhatsApp lama dari `KasirView.tsx`, serta gunakan foto/deskripsi dari data produk database.
- **Tingkat**: **SEDANG**

### Temuan 2.4 — Alamat `"Jl. Melati Manis No. 18"`, Tahun `"2018"`, dan Statistik Hardcoded di Seksi Editorial Landing Page
- **File & Baris**: [components/patisserie/CravelyEditorialSections.tsx:66-71, 101-177, 524](file:///d:/Website-UMKN/components/patisserie/CravelyEditorialSections.tsx#L66-L177)
- **Apa yang Salah**: Seksi editorial di halaman utama (`/`) menampilkan metrik hardcoded (`12+ Varian`, `3 Kloter Oven`, `12K+ Loyang Terjual`, `2018 Berdiri di Bandung` di baris 66-71), cerita toko hardcoded `"Hari ini kami terus menjaga resep klasik tersebut di Jl. Melati Manis No. 18"` (baris 524), galeri `"Fasad Gerai Jl. Melati Manis No. 18"` (baris 150), dan 6 testimoni hardcoded (baris 101-144).
- **Pemicu / Dampak**: Saat admin mengubah alamat toko di `/dashboard/pengaturan`, alamat di bagian Konten Cerita dan Galeri di landing page tetap menampilkan `"Jl. Melati Manis No. 18"`.
- **Saran Perbaikan**: Gunakan `toko?.alamat` dan `toko?.nama_toko` yang sudah diteruskan melalui prop `toko` ke `CravelyEditorialSections`.
- **Tingkat**: **SEDANG**

### Temuan 2.5 — Rak Etalase di `/toko` (`EtalaseShowcaseView.tsx`) Memakai Data Statis `ETALASE_CAKES`, Bukan Database
- **File & Baris**: [components/patisserie/EtalaseShowcaseView.tsx:32-33](file:///d:/Website-UMKN/components/patisserie/EtalaseShowcaseView.tsx#L32-L33) & [components/patisserie/patisserieData.ts:309-396](file:///d:/Website-UMKN/components/patisserie/patisserieData.ts#L309-L396)
- **Apa yang Salah**: Saat pengunjung mengklik etalase kaca di `/toko`, `EtalaseShowcaseView` menampilkan 6 kue dari konstanta `ETALASE_CAKES` dengan harga dan `menuId` hardcoded (`401`, `402`, `403`, `404`, `202`, `201`). Ketika tombol `"Lihat di Menu & Pesan"` diklik (baris 549), pengunjung diarahkan ke `/menu?id=401`, padahal ID produk di tabel `produk_katalog` database adalah serial `1, 2, 3...`, bukan `401`.
- **Pemicu / Dampak**: Produk yang ditambahkan atau diubah harganya oleh admin di `/dashboard/katalog-opsi` tidak pernah tercermin di etalase kaca `/toko`, dan klik `"Lihat di Menu & Pesan"` dari etalase gagal menyorot produk yang dimaksud di `/menu`.
- **Saran Perbaikan**: Ambil daftar kue etalase dari `/api/produk` atau cocokkan berdasarkan nama/ID produk katalog yang sebenarnya.
- **Tingkat**: **SEDANG**

### Temuan 2.6 — Callback Kosong `onOpenInfo={() => {}}` dan `onOpenHampers={() => {}}` di `HomePageClient.jsx`
- **File & Baris**: [components/patisserie/HomePageClient.jsx:51, 65](file:///d:/Website-UMKN/components/patisserie/HomePageClient.jsx#L51) & [components/patisserie/CafeScene.tsx:1013, 1044](file:///d:/Website-UMKN/components/patisserie/CafeScene.tsx#L1013)
- **Apa yang Salah**: Di `HomePageClient.jsx`, prop `onOpenInfo` pada `CafeScene` diisi fungsi kosong `() => {}` (baris 51), berbeda dengan `app/toko/page.js:64` yang membuka modal informasi toko (`setShowInfoModal(true)`). Akibatnya, saat pengunjung berada di halaman utama (`/`) dan mengklik zona **Plakat Dinding Cravely** (`CafeScene.tsx:1013`) atau **Rak Hampers & Kue Kering** (`CafeScene.tsx:1044`), tidak terjadi apa-apa.
- **Pemicu / Dampak**: Dua zona interaktif di dalam ilustrasi kafe pada halaman utama (`/`) memiliki efek hover dan kursor klik, tetapi ketika diklik tidak membuka informasi apa pun.
- **Saran Perbaikan**: Tambahkan state modal info atau arahkan `onOpenInfo` di `HomePageClient.jsx` ke bagian `#visit-us` / `/toko`.
- **Tingkat**: **SEDANG**

### Temuan 2.7 — Keadaan Memuat (Loading), Kosong, Error, & Gambar Fallback
- **File & Baris**: Root `app/` (tidak ada `app/loading.js`), [app/pesanan-saya/[kode]/page.js:354-362, 419-424](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L354-L362), [app/dashboard/hari-ini/page.js:972-976](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L972-L976)
- **Apa yang Salah**:
  1. `app/error.js` dan `app/not-found.js` sudah tersedia dan memakai gaya visual coquette/editorial (`bg-ivory`, `text-ink`, `border-kuningan`), serta `app/dashboard/loading.js` sudah tersedia dengan gaya dashboard hijau/krem. Namun **tidak ada `app/loading.js` di root** untuk transisi halaman publik dan pelanggan.
  2. Pada `app/pesanan-saya/[kode]/page.js:356` dan `421`, elemen `<img src={urlRefItem} alt="Referensi" />` dan `<img src={fotoReferensiUrl} alt="Foto referensi kue" />` tidak memiliki handler `onError` atau fallback visual apabila signed URL gagal dimuat atau kedaluwarsa.
- **Pemicu / Dampak**: Jika gambar referensi gagal dimuat pada halaman tiket, browser menampilkan ikon broken image standar.
- **Saran Perbaikan**: Tambahkan `app/loading.js` di root dan fallback `onError` pada gambar referensi di halaman tiket.
- **Tingkat**: **RENDAH**

---

## BAGIAN 3: Kesesuaian dengan Alur (`ALUR-SISTEM.md` & `CLAUDE.md`)

### 3.1 Tabel Evaluasi Setiap Keputusan di `ALUR-SISTEM.md` & `CLAUDE.md`

| No | Bagian / Keputusan di `ALUR-SISTEM.md` & `CLAUDE.md` | Status | Bukti File & Baris |
| :---: | :--- | :---: | :--- |
| 1 | **§1.1 Jenis Produk**: Istilah produk di kode & tampilan adalah `"Kue Custom"` (`jenis = "Custom"`) dan `"Kue Katalog"` (`jenis = "Katalog"`), tidak lagi menggunakan `"Siap"` di UI. | **Sebagian** | UI dan tabel `keranjang_item`/`pesanan_item` sudah memakai `"Custom"` & `"Katalog"` ([00011_keranjang.sql:7,35](file:///d:/Website-UMKN/supabase/migrations/00011_keranjang.sql#L7)). Namun di kode server masih ada referensi kolom `minimal_hari_siap` ([app/api/pengaturan/route.js:265,537,674](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L265), [lib/tokoPublik.js:59](file:///d:/Website-UMKN/lib/tokoPublik.js#L59)). |
| 2 | **§1.2 Pembayaran**: Semua pembayaran baru memakai Midtrans Snap (DP maupun pelunasan), uang tidak langsung masuk ke toko saat pesanan dibuat. | **Ya** | [components/patisserie/CheckoutView.js:516-565](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L516-L565), [components/TombolBayarMidtrans.js:167-218](file:///d:/Website-UMKN/components/TombolBayarMidtrans.js#L167-L218), [app/api/midtrans/token/route.js:110-258](file:///d:/Website-UMKN/app/api/midtrans/token/route.js#L110-L258). |
| 3 | **§1.2 Pelunasan Tunai**: Pelunasan tunai di toko tetap didukung untuk pesanan `"Ambil"` yang bayar DP dan dicatat staf/admin saat serah terima. | **Tidak (Bug Kritis)** | UI staf memiliki tombol pelunasan tunai ([app/dashboard/hari-ini/page.js:234](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L234)), tetapi [app/api/pembayaran/route.js:44,65](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L44) lupa menyeleksi `metode_pengiriman` sehingga staf selalu ditolak dengan HTTP 403. |
| 4 | **§1.3 Keranjang & Checkout**: Pelanggan harus masuk sebelum menambah ke keranjang; bisa menggabungkan Kue Custom dan Kue Katalog dalam satu pesanan (satu kode `CRV-...`, satu tanggal/jam, satu metode pengiriman). | **Ya** | [app/menu/page.js:68-74](file:///d:/Website-UMKN/app/menu/page.js#L68-L74), [app/pesan/page.js:5855-5862](file:///d:/Website-UMKN/app/pesan/page.js#L5855-L5862), [app/api/keranjang/route.js:110-241](file:///d:/Website-UMKN/app/api/keranjang/route.js#L110-L241), [app/api/checkout/route.js:76-590](file:///d:/Website-UMKN/app/api/checkout/route.js#L76-L590). |
| 5 | **§1.4 Ongkir & Lokasi**: Pelanggan meletakkan pin di peta + cari alamat + GPS + alamat lengkap + patokan; ongkir dihitung otomatis berdasarkan jarak garis lurus (Haversine) dan `tarif_jarak` berundak; ditolak jika `> maks_jarak_kirim_km`. | **Ya** | [components/PetaLokasi.js:1-169](file:///d:/Website-UMKN/components/PetaLokasi.js#L1-L169), [lib/ongkir.js:4-114](file:///d:/Website-UMKN/lib/ongkir.js#L4-L114), [app/api/ongkir/route.js:12-104](file:///d:/Website-UMKN/app/api/ongkir/route.js#L12-L104), [app/api/checkout/route.js:285-351](file:///d:/Website-UMKN/app/api/checkout/route.js#L285-L351). |
| 6 | **§1.5 Estimasi Pengiriman**: Rentang tanggal = `tanggal_ambil` s/d hari operasional berikutnya (melewati `tanggal_tutup`); rentang jam = `jam_ambil` s/d `jam_ambil + durasi_kirim` (30/60/90 menit sesuai jarak). | **Sebagian** | Di [lib/estimasi.js:23-39](file:///d:/Website-UMKN/lib/estimasi.js#L23-L39) fungsi `hitungTanggalOperasionalBerikutnya` melewati `tanggal_tutup`, namun fungsi `tambahHariTanggal` di [lib/estimasi.js:4-8](file:///d:/Website-UMKN/lib/estimasi.js#L4-L8) memakai `dt.toISOString().slice(0, 10)` (UTC), dan di [app/pesanan-saya/[kode]/page.js:180-186](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L180-L186) serta [app/api/pesanan/[kode]/route.js:226-232](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L226-L232) estimasi hanya menambah `+1` hari kalender tanpa memeriksa `tanggal_tutup`. |
| 7 | **§1.6 Pembagian Peran**: Admin penuh; Staf hanya `Hari Ini`, `Pesanan`, `Stok`, `Profil` (tidak boleh membatalkan pesanan, tidak boleh konfirmasi pembayaran manual, tidak boleh melihat laporan/pengaturan/akun); Pelanggan hanya miliknya. | **Sebagian** | Guard halaman dan aksi mutasi sudah dijaga di server ([app/api/pesanan/[kode]/status/route.js:48-53](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/status/route.js#L48-L53), [app/api/laporan/route.js:9](file:///d:/Website-UMKN/app/api/laporan/route.js#L9)), namun [app/api/pesanan/[kode]/route.js:47-55,243](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L47-L55) masih mengirim daftar `pembayaran` dan `buktiUrl` ke role `staf`. |
| 8 | **§2.1 Landing Page (`/`)**: 4 kue populer dari `produk_katalog` (`unggulan=true, aktif=true`), teks tombol/label tanpa harga statis, info toko dari `pengaturan_toko`, form reservasi membuat link `wa.me`. | **Sebagian** | `getPopularCatalogCakes(4)` ([lib/menuPopuler.js:12-66](file:///d:/Website-UMKN/lib/menuPopuler.js#L12-L66)) dan form reservasi WA ([CravelyEditorialSections.tsx:271-313](file:///d:/Website-UMKN/components/patisserie/CravelyEditorialSections.tsx#L271-L313)) sudah sesuai, tetapi teks cerita & galeri di `CravelyEditorialSections.tsx:114,150,524` masih hardcoded `"Jl. Melati Manis No. 18"`. |
| 9 | **§2.2 Ruang Toko (`/toko`)**: Interior interaktif dan etalase, info toko dari `pengaturan_toko`. | **Sebagian** | Info modal memakai `/api/pengaturan` ([app/toko/page.js:16-51](file:///d:/Website-UMKN/app/toko/page.js#L16-L51)), tetapi kue di dalam etalase (`EtalaseShowcaseView.tsx:32-33`) memakai array statis `ETALASE_CAKES`. |
| 10 | **§2.3 Menu Katalog (`/menu`)**: Semua produk dari `produk_katalog` (`aktif = true`) dan `kategori_produk` (`aktif = true`), tombol `"+ Masukkan Keranjang"` menyimpan ke `keranjang_item` (`jenis = "Katalog"`). | **Ya** | [app/menu/page.js:25-115](file:///d:/Website-UMKN/app/menu/page.js#L25-L115), [app/api/produk/route.js:34-67](file:///d:/Website-UMKN/app/api/produk/route.js#L34-L67), [app/api/keranjang/route.js:119-185](file:///d:/Website-UMKN/app/api/keranjang/route.js#L119-L185). |
| 11 | **§2.4 Cake Studio (`/pesan`)**: Grup & item dari `opsi_grup` dan `opsi_item` (`aktif = true`), tambah ke keranjang (`jenis = "Custom"`) dengan `desain_json` dan `pilihan_json`, foto referensi dan pratinjau 3D disimpan di `foto-referensi`. | **Ya** | [app/pesan/page.js:3870-3965, 5850-5995](file:///d:/Website-UMKN/app/pesan/page.js#L5850-L5995), [app/api/keranjang/route.js:186-235](file:///d:/Website-UMKN/app/api/keranjang/route.js#L186-L235). |
| 12 | **§2.5 Keranjang (`/keranjang` & `/kasir`)**: `/kasir` dialihkan ke `/keranjang`; menampilkan kue custom & katalog; cek ketersediaan ulang saat dibuka; item yang dinonaktifkan ditandai `"Tidak tersedia saat ini"` dan memblokir tombol checkout. | **Ya** | [app/kasir/page.js:11](file:///d:/Website-UMKN/app/kasir/page.js#L11), [app/api/keranjang/route.js:46-88](file:///d:/Website-UMKN/app/api/keranjang/route.js#L46-L88), [components/patisserie/KasirView.tsx:148-150, 276-297](file:///d:/Website-UMKN/components/patisserie/KasirView.tsx#L276-L297). |
| 13 | **§2.6 Checkout (`/checkout`)**: Mengisi otomatis alamat/pin/patokan dari profil atau pesanan Kirim terakhir; menghitung ulang seluruh harga & ongkir di server; mengosongkan keranjang; memanggil Midtrans Snap. | **Ya** | [components/patisserie/CheckoutView.js:205-248, 490-575](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L205-L248), [app/api/checkout/route.js:76-590](file:///d:/Website-UMKN/app/api/checkout/route.js#L76-L590). |
| 14 | **§2.7 Tiket Pesanan (`/pesanan-saya/[kode]`)**: Rute tiket kanonik; `/user/[kode]` dan `/role-user/[kode]` dialihkan ke sini; menampilkan rincian item, estimasi, riwayat status, tombol bayar Midtrans, tombol batalkan, dan cetak struk. | **Ya** | [app/pesanan-saya/[kode]/page.js:1-654](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L1-L654), [app/user/[kode]/page.js:6](file:///d:/Website-UMKN/app/user/%5Bkode%5D/page.js#L6), [app/role-user/[kode]/page.js:5](file:///d:/Website-UMKN/app/role-user/%5Bkode%5D/page.js#L5). |
| 15 | **§2.8 Dashboard Pelanggan (`/user`)**: Rute utama pelanggan; `/pesanan-saya`, `/profil`, `/role-user` dialihkan ke `/user`; tab Beranda, Pesanan Saya, Riwayat Transaksi, Pengaturan Profil (dengan PetaLokasi), Pusat Bantuan. | **Ya** | [app/user/page.js:1-234](file:///d:/Website-UMKN/app/user/page.js#L1-L234), [components/DashboardPelangganView.js:1-2624](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L1-L2624). |
| 16 | **§3 Rumus Pembayaran Campuran**: `Subtotal Custom` dapat dibayar DP (`Math.round(subtotalCustom * persenDp / 100)`), `Subtotal Katalog` dan `Ongkir` selalu dibayar 100% di awal; `Bayar Sekarang = DP Custom + Subtotal Katalog + Ongkir`; `Sisa Pelunasan = Total Bayar - Bayar Sekarang`. | **Ya** | [lib/hitungHarga.js:51-96](file:///d:/Website-UMKN/lib/hitungHarga.js#L51-L96), dipakai baik di `CheckoutView.js:353-364` maupun di `app/api/checkout/route.js:393-402`. |
| 17 | **§3 Kuota Harian**: `kuota_harian` hanya membatasi jumlah Kue Custom per tanggal pengambilan; Kue Katalog tidak memotong kuota harian; pesanan `"Menunggu Pembayaran"` yang belum kedaluwarsa ikut menahan slot. | **Tidak (Bug Tinggi)** | [app/api/ketersediaan/route.js:117-119](file:///d:/Website-UMKN/app/api/ketersediaan/route.js#L117-L119), [app/api/checkout/route.js:255-257](file:///d:/Website-UMKN/app/api/checkout/route.js#L255-L257), dan [app/api/pesanan/route.js:175](file:///d:/Website-UMKN/app/api/pesanan/route.js#L175) masih menghitung pesanan yang hanya berisi Kue Katalog sebagai `1` slot kuota harian. |
| 18 | **§3 Minimal Hari Pemesanan**: Jika pesanan mengandung Kue Custom gunakan `minimal_hari_pesan`; jika hanya Kue Katalog gunakan `minimal_hari_katalog`. | **Ya** | [app/api/checkout/route.js:167-182](file:///d:/Website-UMKN/app/api/checkout/route.js#L167-L182), [components/patisserie/CheckoutView.js:154-169](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L154-L169). |
| 19 | **§3 Kedaluwarsa & Pembatalan Otomatis**: Pesanan `"Menunggu Pembayaran"` memiliki `batas_bayar = dibuat_pada + 24 jam`; jika lewat tanpa pembayaran terkonfirmasi maka otomatis dibatalkan (`status_pesanan = "Dibatalkan"`, `status_bayar = "Kedaluwarsa"`). | **Ya** | [lib/kedaluwarsa.js:4-92](file:///d:/Website-UMKN/lib/kedaluwarsa.js#L4-L92), [app/api/checkout/route.js:433](file:///d:/Website-UMKN/app/api/checkout/route.js#L433), [app/api/pesanan/route.js:420](file:///d:/Website-UMKN/app/api/pesanan/route.js#L420). |
| 20 | **§3 Pembayaran Masuk Setelah Dibatalkan (`perlu_refund`)**: Jika webhook settlement/capture masuk setelah pesanan berstatus `"Dibatalkan"`, pesanan TIDAK diaktifkan kembali untuk menjaga kuota harian, tetapi pembayaran dicatat `"Dikonfirmasi"` dan `pesanan.perlu_refund = true`. | **Ya** | [app/api/midtrans/webhook/route.js:141-177](file:///d:/Website-UMKN/app/api/midtrans/webhook/route.js#L141-L177), [lib/midtransSinkron.js:103-138](file:///d:/Website-UMKN/lib/midtransSinkron.js#L103-L138). |
| 21 | **§4 Status Pesanan**: Pesanan baru setelah checkout berstatus `"Menunggu Pembayaran"` dan belum masuk antrean dapur (`Diterima`) sampai webhook Midtrans mengonfirmasi pembayaran. Pesanan hanya Katalog boleh langsung `Diterima -> Siap`. | **Sebagian** | API `/api/pesanan/[kode]/status` ([route.js:80-112](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/status/route.js#L80-L112)) sudah menerapkan aturan transisi dengan benar, tetapi bug query di `/dashboard/hari-ini` ([page.js:85-93](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L85-L93)) membuat pesanan Custom terbaca sebagai Katalog di layar staf. |

---

### 3.2 Penelusuran 10 Skenario End-to-End

#### Skenario 1: Pelanggan daftar -> masuk -> lihat menu -> tambah katalog ke keranjang -> ubah jumlah -> checkout Ambil di Toko -> bayar lewat Midtrans -> tiket -> status berubah -> serah terima -> Selesai
1. **Daftar (`/daftar` -> `POST /api/daftar`)**: Berjalan baik. Rate limit 5x/10 menit per IP, validasi email, WA Indonesia, sandi >= 6 karakter, membuat user via `supabaseAdmin.auth.admin.createUser` dan `upsert` ke `profil` dengan `role: "pelanggan"`, lalu auto-login di browser.
2. **Masuk (`/masuk`)**: Berjalan baik. Mengecek `profil.role` dan mengarahkan pelanggan ke `?ke=` (jika path internal valid) atau `/user`.
3. **Lihat Menu (`/menu` -> `GET /api/produk` & `GET /api/kategori-produk`)**: Berjalan baik. Menampilkan produk katalog aktif dan kategori aktif.
4. **Tambah ke Keranjang (`POST /api/keranjang`)**: Berjalan baik. Jika `id_produk` katalog yang sama sudah ada di `keranjang_item` pelanggan, jumlahnya digabungkan (`jumlahBaru <= 20`).
5. **Ubah Jumlah di `/keranjang` (`PATCH /api/keranjang`)**: Berjalan baik.
6. **Checkout Ambil di Toko (`/checkout` -> `POST /api/checkout`)**:
   - **Titik Putus 1 (Bug Kuota — TINGGI)**: Di [app/api/checkout/route.js:237-258](file:///d:/Website-UMKN/app/api/checkout/route.js#L237-L258) dan [app/api/ketersediaan/route.js:99-120](file:///d:/Website-UMKN/app/api/ketersediaan/route.js#L99-L120), pesanan murni Katalog pada tanggal yang sama ikut dihitung `1` slot karena fallback `: 1` saat `!customItemsPerPesanan.has(p.id)`. Selain itu, di [components/patisserie/CheckoutView.js:193-201](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L193-L201), frontend memblokir pemilihan tanggal jika `ketersediaan.penuh === true` bahkan ketika keranjang pelanggan **hanya berisi Kue Katalog**! Padahal `ALUR-SISTEM.md` §3 menetapkan kue katalog tidak dibatasi kuota harian kue custom.
7. **Bayar via Midtrans (`POST /api/midtrans/token` -> Snap Popup -> `/api/midtrans/webhook` atau `/api/midtrans/cek`)**: Berjalan baik. Membuat baris `pembayaran` (`jenis: "Lunas"`, `status: "Menunggu"`), dan saat settlement mengubah `status_bayar: "Lunas"` dan `status_pesanan: "Diterima"`, serta mencatat `log_status_pesanan`.
8. **Tiket (`/pesanan-saya/[kode]`)**:
   - **Titik Putus 2 (Kolom WA Salah — SEDANG)**: Di [app/pesanan-saya/[kode]/page.js:262](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L262), halaman tiket menampilkan `{pesanan.no_wa_penerima}`, padahal nama kolom di tabel `pesanan` adalah `no_wa`. Nomor WhatsApp penerima tidak pernah tampil di kartu informasi penerima tiket.
9. **Status Berubah -> Serah Terima -> Selesai (`PATCH /api/pesanan/[kode]/status`)**: Untuk pesanan hanya katalog, staf/admin dapat mengubah `Diterima -> Siap -> Selesai` (dengan wajib mengisi `penerima_serah_terima` untuk metode `"Ambil"`). Berjalan baik.

#### Skenario 2: Kirim: pin peta, jarak dan ongkir, estimasi tiba, DP campuran (custom dan katalog dalam satu pesanan), bayar sisa
1. **Pin Peta & Ongkir (`/checkout` -> `PetaLokasi.js` -> `POST /api/ongkir`)**: Berjalan baik. Menghitung jarak Haversine dari `(lat_toko, lng_toko)` ke `(lat, lng)` pelanggan, mencocokkan ke tier `tarif_jarak` terkecil yang `>= jarak_km`, atau menolak jika `> maks_jarak_kirim_km`.
2. **DP Campuran (`hitungRincianKeranjang` di `lib/hitungHarga.js:51-96`)**: Berjalan baik. `jumlah_dp = Math.round((subtotalCustom * persen) / 100)`, `bayar_sekarang = jumlahDp + subtotalKatalog + ongkir`, `sisa_bayar = totalBayar - bayarSekarang`.
3. **Proses Dapur Staf untuk Pesanan Campuran/Custom**:
   - **Titik Putus 1 (Alur Produksi `/dashboard/hari-ini` Putus — KRITIS)**: Di [app/dashboard/hari-ini/page.js:85-93](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L85-L93), query `pesanan_item` dan `pesanan_pilihan` gagal karena meminta kolom `catatan_opsi`, `spesifikasi_singkat`, dan `teks_pilihan` yang tidak ada di database. Akibatnya pesanan campuran/custom dianggap tidak punya item custom (`adaCustom === false` di baris 504), tombol `"Mulai Dibuat"` tidak muncul, dan tombol `"Tandai Siap"` ditolak server dengan HTTP 400.
   - **Titik Putus 2 (Alamat Tidak Tampil di Drawer `/dashboard/hari-ini` — SEDANG)**: Di [app/dashboard/hari-ini/page.js:1029](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L1029), drawer mengecek `detailPesanan.pesanan.alamat_pengiriman`, padahal kolom di database adalah `alamat`. Alamat pengiriman tidak pernah tampil di drawer detail `/dashboard/hari-ini`.
4. **Estimasi Tiba**:
   - **Titik Putus 3 (Estimasi di Tiket & `lib/estimasi.js` — SEDANG)**: Di [app/pesanan-saya/[kode]/page.js:181-185](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L181-L185) dan [app/api/pesanan/[kode]/route.js:227-231](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L227-L231), `tglAkhir` dihitung dengan menambah `+ 1` hari (`dtAkhir.setUTCDate(dtAkhir.getUTCDate() + 1)`) tanpa melewati `tanggal_tutup` toko. Кроме itu, [components/DashboardPelangganView.js:37-39](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L37-L39) membaca properti `p.tanggal_pasti_kirim`, `p.estimasi_kirim_awal`, `p.estimasi_kirim_akhir` yang tidak ada di tabel `pesanan` (meskipun memiliki fallback ke `hitungEstimasiPengiriman`).
5. **Bayar Sisa Pelunasan (`POST /api/midtrans/token`)**: Berjalan baik untuk pembayaran via Midtrans Snap (`jenisBayar = "Pelunasan"`, `nominalTagihan = sisaTagihan`).

#### Skenario 3: Kue custom dari `/pesan` lama (`POST /api/pesanan`) sampai tiket dan admin
1. **Pembuatan Pesanan (`POST /api/pesanan`)**:
   - `app/pesan/page.js` memiliki dua jalur: tombol utama `"Tambah ke Keranjang"` (`handleAddToCart`, baris 5850 -> `POST /api/keranjang`) dan fungsi `handleSubmitOrder` (baris 5921 -> `POST /api/pesanan`).
   - **Titik Putus 1 (Redirect Setelah `POST /api/pesanan` — SEDANG)**: Di [app/pesan/page.js:5948](file:///d:/Website-UMKN/app/pesan/page.js#L5948), kode mengarahkan ke `router.push(\`/pesanan-saya/${data.kode_pesanan}\`)`, sedangkan di [components/WizardPesan.js:259](file:///d:/Website-UMKN/components/WizardPesan.js#L259) mengarahkan ke `/user/${data.kode_pesanan}` (yang me-redirect lagi ke `/pesanan-saya/${kode}`).
   - **Titik Putus 2 (Ongkir Zona Lama vs Tarif Jarak — SEDANG)**: `POST /api/pesanan` ([app/api/pesanan/route.js:304-322](file:///d:/Website-UMKN/app/api/pesanan/route.js#L304-L322)) masih menggunakan `id_zona` dari tabel `zona_ongkir` (bukan koordinat peta & `tarif_jarak`) serta tidak menyimpan baris ke `pesanan_item` (hanya ke `pesanan` dan `pesanan_pilihan`).

#### Skenario 4: Pembatalan oleh pelanggan, pembatalan otomatis kedaluwarsa, pembayaran masuk setelah dibatalkan (`perlu_refund`)
1. **Pembatalan oleh Pelanggan (`POST /api/pesanan/[kode]/batal`)**:
   - Memeriksa kepemilikan (`pesanan.id_pelanggan !== user.id`), memastikan `status_pesanan === "Menunggu Pembayaran"` dan `status_bayar === "Belum Bayar"`, serta tidak ada pembayaran `"Dikonfirmasi"`. Mengubah `status_pesanan: "Dibatalkan"`, membatalkan baris `pembayaran` yang masih `"Menunggu"` menjadi `"Gagal"`, dan mencatat `log_status_pesanan`.
   - **Titik Putus 1 (Keranjang Tidak Dipulihkan Saat Batal — TINGGI)**: Item keranjang sudah dihapus saat `POST /api/checkout` (baris 543-547). Ketika pelanggan membatalkan pesanan yang belum dibayar, item tidak dikembalikan ke keranjang.
2. **Pembatalan Otomatis Kedaluwarsa (`batalkanPesananKedaluwarsa` di `lib/kedaluwarsa.js`)**:
   - Dipanggil oleh `/api/cron/batalkan-pesanan`, `/api/ketersediaan`, `/api/checkout`, `/api/pesanan`, dan `/dashboard/pesanan`.
   - **Titik Putus 2 (Bypass Auth Cron — KRITIS)**: Endpoint `/api/cron/batalkan-pesanan` tidak menolak request bila `process.env.CRON_SECRET` belum diset.
3. **Pembayaran Masuk Setelah Dibatalkan (`perlu_refund`)**:
   - Ditangani di [app/api/midtrans/webhook/route.js:141-177](file:///d:/Website-UMKN/app/api/midtrans/webhook/route.js#L141-L177) dan [lib/midtransSinkron.js:103-138](file:///d:/Website-UMKN/lib/midtransSinkron.js#L103-L138): `pembayaran.status` menjadi `"Dikonfirmasi"`, `pesanan.status_pesanan` tetap `"Dibatalkan"`, `pesanan.perlu_refund` diset `true`, dan peringatan refund ditampilkan di `/user` (`DashboardPelangganView.js:235, 1003, 1301`), `/pesanan-saya/[kode]` (baris 220), `/dashboard/hari-ini` (baris 563), dan `/dashboard/pesanan` (baris 884).

#### Skenario 5: Klik ganda tombol bayar atau buat pesanan, webhook Midtrans ganda, nominal tidak cocok, status pending lalu sukses
1. **Klik Ganda Tombol Bayar (`POST /api/midtrans/token`)**:
   - Menggunakan penggunaan ulang token Snap (`reuseToken` di [app/api/midtrans/token/route.js:110-124](file:///d:/Website-UMKN/app/api/midtrans/token/route.js#L110-L124)) jika baris `pembayaran` masih `"Menunggu"`, nominal sama, dibuat `< 20 jam` lalu, dan bukan `ganti_metode`.
   - **Titik Putus 1 (Race Condition Klik Ganda Paralel — SEDANG)**: Jika dua request `POST /api/midtrans/token` masuk bersamaan sebelum request pertama selesai menyimpan `snap_token`, keduanya melihat tidak ada token aktif dan membuat dua `midtrans_order_id` berbeda di Midtrans.
2. **Klik Ganda Buat Pesanan (`POST /api/checkout`)**:
   - **Titik Putus 2 (Race Condition Dua Tab Checkout — TINGGI)**: `POST /api/checkout` membaca `keranjang_item` di baris 94, lalu baru menghapus `keranjang_item` di baris 544 setelah `insert` pesanan selesai. Jika pelanggan menekan `"Buat Pesanan"` di dua tab secara bersamaan, kedua request membaca isi keranjang yang sama dan membuat **dua pesanan identik** di database.
3. **Webhook Midtrans Ganda & Nominal Tidak Cocok (`/api/midtrans/webhook`)**:
   - Verifikasi SHA-512 signature (`verifikasiSignatureMidtrans`), cek kecocokan nominal `Math.round(grossAmount) !== Math.round(Number(pembayaran.jumlah))` (baris 84 -> HTTP 400), dan idempotensi `if (pembayaran.status === "Dikonfirmasi") return NextResponse.json({ sukses: true, pesan: "Sudah diproses sebelumnya." })` (baris 91-97). Namun update `pembayaran` dan `pesanan` belum memakai atomic lock (`UPDATE ... WHERE status != 'Dikonfirmasi'`), sehingga dua webhook identik pada milidetik yang sama dapat menulis `log_status_pesanan` ganda.
4. **Status Pending lalu Sukses**:
   - Saat webhook `pending` masuk, status tetap `"Menunggu"` dan metode bayar diperbarui; saat webhook `settlement`/`capture` menyusul, status berubah menjadi `"Dikonfirmasi"` dan pesanan naik ke `"Diterima"`.

#### Skenario 6: Admin: tambah produk katalog dan kategori, tandai unggulan, muncul di landing dan menu; ubah harga dan nonaktifkan; ubah pengaturan toko dan lihat di landing; grup dan opsi kue custom tampil di `/pesan`
1. **CRUD Produk & Kategori (`/dashboard/katalog-opsi` -> `/api/produk` & `/api/kategori-produk`)**: Berjalan baik. Produk dengan `unggulan = true` dan `aktif = true` diambil oleh `getPopularCatalogCakes(4)` di `app/page.js` (memiliki `export const revalidate = 60`).
2. **Ubah Harga & Nonaktifkan Produk**: Saat produk dinonaktifkan (`aktif = false`), produk hilang dari `/menu` dan item di keranjang pelanggan langsung ditandai `tersedia: false` oleh `GET /api/keranjang` (baris 55-58).
3. **Ubah Pengaturan Toko & Lihat di Landing (`/dashboard/pengaturan` -> `PUT /api/pengaturan`)**:
   - **Titik Putus 1 (Konflik Kolom `minimal_hari_siap` — KRITIS)**: [app/api/pengaturan/route.js:536-537, 673-674](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L536-L537) mengirim `minimal_hari_katalog` dan `minimal_hari_siap` sekaligus pada payload `UPDATE pengaturan_toko`. Jika migrasi `00012_fase1_katalog_pengaturan.sql:85` telah me-rename `minimal_hari_siap` menjadi `minimal_hari_katalog`, query `UPDATE` dan `SELECT` gagal sampai jatuh ke fallback.
   - **Titik Putus 2 (`GET /api/pengaturan` Publik Gagal Membaca `tanggal_tutup` — TINGGI)**: Baris 136 meminta kolom `keterangan` yang tidak ada (seharusnya `alasan`).
4. **Grup & Opsi Kue Custom Tampil di `/pesan`**: `app/pesan/page.js:3875-3890` mengambil `opsi_grup` dan `opsi_item` dengan `.eq("aktif", true)`. Berjalan baik.

#### Skenario 7: Staf: hanya yang diizinkan (Hari Ini, Pesanan, Stok), serah terima, pelunasan tunai, tidak bisa membatalkan, tidak bisa membuka laporan, pengaturan, akun (periksa di SERVER, bukan hanya tampilan)
1. **Proteksi Halaman & API Admin-Only di Server**:
   - Layout server `/dashboard/katalog-opsi/layout.js`, `/dashboard/laporan/layout.js`, `/dashboard/pengaturan/layout.js`, `/dashboard/akun/layout.js` semuanya memanggil `cekRole(["admin"])` dan me-redirect `staf` ke `/dashboard/hari-ini`.
   - API `/api/laporan`, `/api/akun`, `/api/opsi`, `/api/opsi/resep`, dan mutasi `/api/produk`, `/api/kategori-produk`, `/api/pengaturan` semuanya memeriksa `cekRole(["admin"])` di server.
2. **Pembatalan oleh Staf**: Ditolak di server pada [app/api/pesanan/[kode]/status/route.js:48-53](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/status/route.js#L48-L53) (`if (profil.role === "staf" && status_baru === "Dibatalkan")` -> HTTP 403).
3. **Pelunasan Tunai oleh Staf**:
   - **Titik Putus 1 (Selalu Gagal HTTP 403 — KRITIS)**: Di [app/api/pembayaran/route.js:44,65](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L44), `pesanan.metode_pengiriman` tidak ikut di-select sehingga bernilai `undefined`, membuat staf selalu ditolak dengan 403.
4. **Data Pembayaran Bocor ke Staf di Endpoint Detail Pesanan**:
   - **Titik Putus 2 (Kebocoran Data Pembayaran ke Staf — TINGGI)**: Di [app/api/pesanan/[kode]/route.js:47-55,197-244](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L47-L55), server menggunakan `getSupabaseAdmin()` dan tetap mengirimkan array `pembayaran` serta `buktiUrl` ketika diakses oleh role `staf`.

#### Skenario 8: Stok: resep, kebutuhan bahan hanya dari kue custom, kurangi dan kembalikan stok, riwayat
1. **Resep & Kebutuhan Bahan (`/dashboard/stok` & `POST /api/pesanan/[kode]/stok`)**:
   - Perhitungan kebutuhan bahan membaca `pesanan_pilihan` yang terhubung ke `resep_item`. Karena Kue Katalog tidak memiliki baris di `pesanan_pilihan`, hanya Kue Custom yang dihitung kebutuhan bahannya.
   - **Titik Putus 1 (`id_item` Kosong pada Pesanan dari `/checkout` — TINGGI)**: Karena `POST /api/checkout` ([route.js:530-540](file:///d:/Website-UMKN/app/api/checkout/route.js#L530-L540)) tidak menyimpan `id_item` ke `pesanan_pilihan`, `/api/pesanan/[kode]/stok` (baris 49-65) dan `/dashboard/stok/page.js` (baris 55-68) terpaksa mencocokkan berdasarkan string `nama_item.toLowerCase()`. Jika admin mengubah nama opsi di Katalog & Opsi (misal `"Vanilla"` menjadi `"Vanilla Sponge"`), seluruh pesanan aktif yang dibuat lewat `/checkout` gagal mencocokkan resep dan tidak mengurangi stok!
   - **Titik Putus 2 (Tidak Ada Fitur "Kembalikan Stok" Saat Pesanan Dibatalkan — SEDANG)**: Di [app/api/pesanan/[kode]/status/route.js:116-190](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/status/route.js#L116-L190) maupun [app/api/pesanan/[kode]/stok/route.js](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/stok/route.js), jika sebuah pesanan sudah dikurangi stoknya (`stok_dikurangi = true`) lalu dibatalkan oleh admin (`status_baru === "Dibatalkan"`), stok bahan baku tidak dikembalikan secara otomatis dan tidak ada endpoint untuk membalikkan (`rollback`) pengurangan stok pesanan tersebut.

#### Skenario 9: Lupa kata sandi dan ganti kata sandi, alur login dan parameter `ke` (termasuk keamanan open redirect)
1. **Lupa Kata Sandi (`/lupa-sandi` -> `/atur-ulang-sandi`)**: Berjalan baik. Menggunakan `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/atur-ulang-sandi\` })` dan `supabase.auth.updateUser({ password })`.
2. **Ganti Kata Sandi (`/user?tab=profile` & `/dashboard/profil` -> `PUT /api/profil`)**: Berjalan baik. Memverifikasi `sandi_lama` terlebih dahulu menggunakan client anon terpisah (`signInWithPassword`) di [app/api/profil/route.js:195-210](file:///d:/Website-UMKN/app/api/profil/route.js#L195-L210) sebelum memanggil `supabase.auth.updateUser({ password: body.sandi_baru })`.
3. **Parameter `ke` & Open Redirect (`/masuk` dan `/daftar`)**:
   - Di [app/masuk/page.js:15-21](file:///d:/Website-UMKN/app/masuk/page.js#L15-L21) dan [app/daftar/page.js:14-20](file:///d:/Website-UMKN/app/daftar/page.js#L14-L20), fungsi `bersihkanTujuanRedirect(raw)` memeriksa `tujuan.startsWith("/") && !tujuan.startsWith("//") && !tujuan.includes("://")`.
   - **Titik Putus (Bypass Open Redirect dengan Backslash `/\evil.com` — SEDANG)**: Pengecekan `!tujuan.startsWith("//")` belum menolak karakter backslash di posisi kedua (`/\evil.com`), yang oleh browser modern dinormalisasi menjadi `//evil.com` (protocol-relative external redirect).

#### Skenario 10: Rumus Harga, DP, Kuota, Minimal Hari, Tanggal Tutup, Jam Buka, Zona `Asia/Jakarta`, Pembulatan Uang
1. **Rumus Harga & Pembulatan (`lib/hitungHarga.js`)**:
   - `CheckoutView.js` dan `POST /api/checkout` memakai fungsi yang sama (`hitungRincianKeranjang` dari `lib/hitungHarga.js`), dengan pembulatan `Math.round((subtotalCustom * persen) / 100)`.
   - **Titik Putus 1 (`WizardPesan.js` & `/api/laporan` Tidak Memakai `lib/hitungHarga.js` — RENDAH)**: Komponen yatim `WizardPesan.js:140-147` menghitung manual, dan `/api/laporan` menjumlahkan kolom `total_bayar` / `jumlah_terbayar` yang sudah tersimpan di tabel `pesanan` / `pembayaran`.
2. **Zona Waktu `Asia/Jakarta`**:
   - `lib/format.js`, `lib/jam.js`, `app/api/ketersediaan/route.js`, `app/api/checkout/route.js`, `app/api/laporan/route.js`, dan `app/dashboard/page.js` sudah menggunakan `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" })` atau offset `+07:00`.
   - **Titik Putus 2 (Penggunaan `toISOString().slice(0, 10)` di `lib/estimasi.js`, `app/pesanan-saya/[kode]/page.js`, dan `app/api/pesanan/[kode]/route.js` — SEDANG)**: Ketiga file tersebut memanipulasi objek `Date` yang diinisialisasi dengan `+07:00` menggunakan `setUTCDate(getUTCDate() + 1)` lalu mengambil `toISOString().slice(0, 10)`. Karena `"YYYY-MM-DDT00:00:00+07:00"` dalam UTC adalah `"YYYY-MM-(DD-1)T17:00:00.000Z"`, penambahan `+ 1` hari pada `UTCDate` menghasilkan tanggal UTC hari `DD` (yaitu tanggal yang **sama** dengan `tanggal_ambil`, bukan `H+1`!). Ini menyebabkan `tglAkhir` estimasi pengiriman meleset 1 hari (sama dengan `tglAwal`)!

---

## BAGIAN 4: Bug Sistematis

### Temuan 4.1 — Query Kolom Tidak Ada di `/dashboard/hari-ini` yang Error-nya Diabaikan dan Memutus Alur Dapur Staf
- **File & Baris**: [app/dashboard/hari-ini/page.js:85-109, 504](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L85-L109)
- **Apa yang Salah**:
  - Baris 86-88: `supabase.from("pesanan_item").select("id, id_pesanan, jenis, nama, jumlah, harga_satuan, subtotal, tulisan_kue, desain_json, catatan_opsi, spesifikasi_singkat")` — Kolom `catatan_opsi` dan `spesifikasi_singkat` tidak ada di tabel `pesanan_item` ([00011_keranjang.sql:32-47](file:///d:/Website-UMKN/supabase/migrations/00011_keranjang.sql#L32-L47)).
  - Baris 90-92: `supabase.from("pesanan_pilihan").select("id, id_pesanan, id_pesanan_item, id_grup, id_item, nama_grup, nama_item, harga, teks_pilihan")` — Kolom `teks_pilihan` tidak ada di tabel `pesanan_pilihan` ([00001_skema.sql:102-111](file:///d:/Website-UMKN/supabase/migrations/00001_skema.sql#L102-L111)).
  - Baris 95 & 103: `resItems.error` dan `resPilihan.error` sama sekali tidak diperiksa; kode hanya memeriksa `if (resItems.data)`.
- **Pemicu / Dampak**: Saat staf atau admin membuka `/dashboard/hari-ini`, kedua query tersebut gagal dengan error PostgreSQL `42703`, sehingga `itemsMap` dan `pilihanMap` kosong (`{}`). Akibatnya, variabel `adaCustom` di baris 504 bernilai `false` untuk semua pesanan dari `/checkout`. Pesanan Kue Custom ditampilkan sebagai `"Produk Katalog: Kue Katalog"` dengan tombol `"Tandai Siap"`. Ketika staf menekan `"Tandai Siap"`, endpoint `PATCH /api/pesanan/[kode]/status` menolak dengan HTTP 400 (`Pesanan kue custom harus berstatus "Sedang Dibuat" sebelum dapat ditandai "Siap"`), sehingga pesanan kue custom tidak bisa diproses sama sekali dari halaman Hari Ini.
- **Saran Perbaikan**: Hapus `catatan_opsi, spesifikasi_singkat` dari query `pesanan_item` dan hapus `teks_pilihan` dari query `pesanan_pilihan` (sama seperti query di [app/dashboard/pesanan/page.js:158-167](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L158-L167)), serta periksa `resItems.error` dan `resPilihan.error`.
- **Tingkat**: **KRITIS**

### Temuan 4.2 — Kolom `metode_pengiriman` Tidak Diambil di `POST /api/pembayaran`, Memblokir Staf Mencatat Pelunasan Tunai
- **File & Baris**: [app/api/pembayaran/route.js:43-47, 64-69](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L43-L69)
- **Apa yang Salah**: Pada baris 44, query `pesanan` hanya melakukan `.select("id, id_pelanggan, status_pesanan, status_bayar, total_bayar, jumlah_terbayar")` tanpa menyertakan `metode_pengiriman`. Pada baris 65, kode memeriksa `if (metode !== "Tunai di Tempat" || pesanan.metode_pengiriman !== "Ambil")`.
- **Pemicu / Dampak**: Karena `pesanan.metode_pengiriman` selalu bernilai `undefined`, ekspresi `undefined !== "Ambil"` selalu `true`. Setiap kali pengguna dengan role `staf` mencoba mencatat pelunasan tunai di `/dashboard/hari-ini` atau `/dashboard/pesanan`, server selalu menolak dengan HTTP 403 (`"Petugas hanya dapat mencatat pelunasan Tunai di Tempat untuk pesanan Ambil di Toko."`).
- **Saran Perbaikan**: Tambahkan `metode_pengiriman` ke dalam daftar kolom `.select(...)` di baris 44.
- **Tingkat**: **KRITIS**

### Temuan 4.3 — Bug Perhitungan Tanggal UTC (`new Date(tgl + "T00:00:00+07:00")` + `getUTCDate() + 1` + `toISOString()`) Menghasilkan Tanggal Hari yang Sama (`H+0` Bukan `H+1`)
- **File & Baris**: [lib/estimasi.js:4-8](file:///d:/Website-UMKN/lib/estimasi.js#L4-L8), [app/pesanan-saya/[kode]/page.js:182-184](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L182-L184), [app/api/pesanan/[kode]/route.js:228-230](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L228-L230)
- **Apa yang Salah**: Ketiga lokasi tersebut menjalankan pola berikut:
  ```js
  const dt = new Date(`${tanggalStr}T00:00:00+07:00`);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
  ```
  Untuk `tanggalStr = "2026-11-25"`, `"2026-11-25T00:00:00+07:00"` dalam waktu UTC adalah `"2026-11-24T17:00:00.000Z"`. Memanggil `dt.getUTCDate()` mengembalikan `24` (bukan `25`!). Menambah `+ 1` mengubah tanggal UTC menjadi `25` (`"2026-11-25T17:00:00.000Z"`), sehingga `dt.toISOString().slice(0, 10)` mengembalikan `"2026-11-25"` — **tanggal yang persis sama dengan input awal**!
- **Pemicu / Dampak**:
  1. Di `lib/estimasi.js:23-39`, `hitungTanggalOperasionalBerikutnya("2026-11-25")` pada iterasi pertama (`i = 0`) menghasilkan `kandidat = "2026-11-25"` (hari yang sama) dan langsung mengembalikannya sebagai `"hari operasional berikutnya"`.
  2. Di `/pesanan-saya/[kode]` dan `/api/pesanan/[kode]`, rentang tanggal estimasi tiba (`tglAwal` s/d `tglAkhir`) selalu menampilkan tanggal yang sama (misal `"25 November 2026"` bukannya `"25 November 2026 – 26 November 2026"`).
- **Saran Perbaikan**: Gunakan `new Date(\`${tanggalStr}T00:00:00Z\`)` (UTC murni untuk aritmetika kalender `YYYY-MM-DD`) ketika memakai `getUTCDate()` dan `toISOString().slice(0, 10)`.
- **Tingkat**: **TINGGI**

### Temuan 4.4 — Konfirmasi Pembayaran Manual Tidak Mengisi `dikonfirmasi_pada`
- **File & Baris**: [app/api/pembayaran/[id]/route.js:67-73](file:///d:/Website-UMKN/app/api/pembayaran/%5Bid%5D/route.js#L67-L73)
- **Apa yang Salah**: Saat admin mengonfirmasi pembayaran manual (`aksi === "konfirmasi"`), kode hanya melakukan `.update({ status: "Dikonfirmasi", id_pengonfirmasi: user.id })` tanpa mengisi `dikonfirmasi_pada: new Date().toISOString()`.
- **Pemicu / Dampak**: `app/api/laporan/route.js:39-40` dan `app/dashboard/page.js:286` memfilter pembayaran terkonfirmasi menggunakan `.gte("dikonfirmasi_pada", ...)` dan `.lte("dikonfirmasi_pada", ...)`. Karena `dikonfirmasi_pada` bernilai `null`, semua pembayaran manual yang dikonfirmasi lewat `PATCH /api/pembayaran/[id]` hilang dari laporan omzet dan grafik pendapatan dashboard.
- **Saran Perbaikan**: Tambahkan `dikonfirmasi_pada: new Date().toISOString()` pada `.update(...)` di baris 69-72.
- **Tingkat**: **TINGGI**

### Temuan 4.5 — `POST /api/checkout` Tidak Menyimpan `id_grup` dan `id_item` ke `pesanan_pilihan`
- **File & Baris**: [app/api/checkout/route.js:530-540](file:///d:/Website-UMKN/app/api/checkout/route.js#L530-L540)
- **Apa yang Salah**: Saat menyalin opsi kue custom dari `keranjang_item.pilihan_json` ke tabel `pesanan_pilihan`, objek yang di-insert hanya berisi `{ id_pesanan, id_pesanan_item, nama_grup, nama_item, harga }` tanpa menyertakan `id_grup: pil.id_grup` dan `id_item: pil.id_item` (padahal `pil` yang diverifikasi di baris 141-161 memiliki `id_item` dan `id_grup`).
- **Pemicu / Dampak**: `id_grup` dan `id_item` di tabel `pesanan_pilihan` selalu `NULL` untuk semua pesanan yang dibuat melalui `/checkout`. Perhitungan pengurangan stok bahan (`POST /api/pesanan/[kode]/stok`) dan perhitungan kebutuhan bahan harian (`/dashboard/stok`) kehilangan relasi ID dan akan gagal mencocokkan resep jika nama opsi pernah diedit oleh admin.
- **Saran Perbaikan**: Sertakan `id_grup: pil.id_grup || null` dan `id_item: pil.id_item || null` di `barisPilihan.push(...)` pada `app/api/checkout/route.js:531-537`.
- **Tingkat**: **TINGGI**

### Temuan 4.6 — Pesanan Hanya Katalog Ikut Memotong Kuota Harian Kue Custom (`kuota_harian`)
- **File & Baris**: [app/api/ketersediaan/route.js:99-120](file:///d:/Website-UMKN/app/api/ketersediaan/route.js#L99-L120), [app/api/checkout/route.js:237-258](file:///d:/Website-UMKN/app/api/checkout/route.js#L237-L258), [app/api/pesanan/route.js:159-175](file:///d:/Website-UMKN/app/api/pesanan/route.js#L159-L175), [components/patisserie/CheckoutView.js:193-201](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L193-L201)
- **Apa yang Salah**:
  1. Di `/api/ketersediaan` (baris 101-104) dan `/api/checkout` (baris 239-242), query `pesanan_item` memfilter `.eq("jenis", "Custom")`. Untuk pesanan yang hanya berisi Kue Katalog, tidak ada baris yang kembali, sehingga `customItemsPerPesanan.has(p.id)` bernilai `false`. Namun baris 117 / 255 menulis: `const count = customItemsPerPesanan.has(p.id) ? customItemsPerPesanan.get(p.id) : 1;`. Fallback `: 1` (yang dimaksudkan untuk pesanan `/pesan` lama tanpa `pesanan_item`) menyebabkan **setiap pesanan Kue Katalog dihitung memakai 1 slot kuota harian Kue Custom**!
  2. Di `/api/pesanan` (baris 175), `terpakai = pesananHariItuValid.length` menghitung semua pesanan aktif pada tanggal tersebut tanpa memeriksa apakah pesanan tersebut custom atau katalog.
  3. Di `CheckoutView.js:193-201`, status `ketersediaan.penuh` tetap memblokir checkout meskipun keranjang pelanggan hanya berisi Kue Katalog (`adaCustom === false`).
- **Pemicu / Dampak**: Jika `kuota_harian = 5` dan ada 5 pelanggan membeli 1 potong cupcake katalog pada tanggal tersebut, kuota hari itu langsung dianggap PENUH (`5/5`) dan tidak ada pelanggan yang bisa memesan kue custom maupun katalog lagi pada tanggal tersebut.
- **Saran Perbaikan**: Ambil semua `pesanan_item` (tanpa `.eq("jenis", "Custom")`) untuk membedakan pesanan yang punya baris `pesanan_item` berjenis `"Katalog"` (`count = 0`) vs pesanan legacy tanpa `pesanan_item` sama sekali (`count = 1`), dan di `CheckoutView.js` hanya terapkan blokir `ketersediaan.penuh` jika keranjang mengandung item `"Custom"`.
- **Tingkat**: **TINGGI**

### Temuan 4.7 — Hook `usePatisserieCart` Membaca Field Respons API yang Salah
- **File & Baris**: [lib/patisserieCart.js:14-24, 56-64](file:///d:/Website-UMKN/lib/patisserieCart.js#L14-L24) vs [components/DashboardPelangganView.js:66, 955](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L66)
- **Apa yang Salah**: `GET /api/keranjang` mengembalikan `{ sukses: true, keranjang: [...], ringkasan: { subtotal_custom, subtotal_katalog, total_kue } }`. Namun `usePatisserieCart` membaca `Array.isArray(json.items) ? json.items : []` (selalu `[]`), `Number(json.ringkasan?.total_item ?? ...)` (selalu `0`), dan return value hook tidak menyertakan `totalPrice` maupun `clearCart` yang didestructure di `DashboardPelangganView.js:66`.
- **Pemicu / Dampak**: Banner keranjang mengambang di `DashboardPelangganView.js:955` (`{totalQty > 0 && ...}`) tidak pernah tampil karena `totalQty` dari `usePatisserieCart()` selalu `0`, dan `formatRupiah(totalPrice)` akan menerima `undefined` jika kondisi tersebut terpenuhi.
- **Saran Perbaikan**: Ubah `lib/patisserieCart.js` agar membaca `json.keranjang`, `json.ringkasan?.total_kue`, dan mengembalikan `totalPrice: Number(json.ringkasan?.total_kue || 0)`.
- **Tingkat**: **TINGGI**

### Temuan 4.8 — Race Condition Checkout Ganda & Keranjang Dikuras Sebelum Pembayaran Selesai
- **File & Baris**: [app/api/checkout/route.js:90-98, 543-547](file:///d:/Website-UMKN/app/api/checkout/route.js#L90-L98)
- **Apa yang Salah**:
  1. Pembacaan `keranjang_item` (baris 90) dan penghapusan `keranjang_item` (baris 543) tidak berada dalam transaksi database atomik / row lock.
  2. Seluruh isi `keranjang_item` langsung dihapus pada saat pesanan `"Menunggu Pembayaran"` dibuat, sebelum pelanggan menyelesaikan pembayaran di Midtrans Snap.
- **Pemicu / Dampak**:
  1. Jika pelanggan membuka 2 tab `/checkout` dan menekan tombol bayar bersamaan, kedua request membaca keranjang yang sama dan membuat 2 pesanan kembar.
  2. Jika pelanggan membatalkan pesanan karena ingin mengubah salah satu item, seluruh keranjang (termasuk desain 3D kue custom) sudah terhapus.
- **Saran Perbaikan**: Gunakan RPC PostgreSQL atomik untuk checkout atau klaim `keranjang_item` dengan `DELETE ... RETURNING *` di awal setelah validasi, dan sediakan aksi `"Salin kembali ke keranjang"` saat pesanan dibatalkan.
- **Tingkat**: **TINGGI**

### Temuan 4.9 — Pembaruan Stok Bahan Tidak Atomik (Read-Modify-Write di JavaScript)
- **File & Baris**: [app/api/pesanan/[kode]/stok/route.js:116-135](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/stok/route.js#L116-L135) & [app/api/stok/route.js:118-137](file:///d:/Website-UMKN/app/api/stok/route.js#L118-L137)
- **Apa yang Salah**: Pengurangan stok pesanan (`POST /api/pesanan/[kode]/stok`) dan penyesuaian stok manual (`PATCH /api/stok`) membaca `jumlah_stok` ke memori Node.js, menghitung `stokBaru = stokSekarang - item.jumlah_butuh`, lalu melakukan `.update({ jumlah_stok: stokBaru })` dan `.update({ stok_dikurangi: true })` secara berurutan tanpa transaksi atau `WHERE stok_dikurangi = false`.
- **Pemicu / Dampak**: Jika dua staf menekan tombol `"Kurangi Stok Sesuai Resep"` pada waktu bersamaan untuk pesanan yang sama atau dua pesanan berbeda yang memakai bahan yang sama, stok bahan dapat terkurangi dua kali atau mengalami lost update.
- **Saran Perbaikan**: Buat fungsi RPC PostgreSQL atomik (`kurangi_stok_pesanan`) yang mengunci baris `pesanan` (`FOR UPDATE`) dan memperbarui `bahan_stok` dengan `jumlah_stok = jumlah_stok - kebutuhan` dalam satu transaksi.
- **Tingkat**: **SEDANG**

### Temuan 4.10 — Nama Kolom Salah di Halaman Tiket (`no_wa_penerima`) dan Drawer Hari Ini (`alamat_pengiriman`)
- **File & Baris**: [app/pesanan-saya/[kode]/page.js:262](file:///d:/Website-UMKN/app/pesanan-saya/%5Bkode%5D/page.js#L262) & [app/dashboard/hari-ini/page.js:1029](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L1029)
- **Apa yang Salah**:
  1. `app/pesanan-saya/[kode]/page.js:262` merender `<p className="text-xs text-ink/70 mt-0.5">{pesanan.no_wa_penerima}</p>`, padahal kolom di tabel `pesanan` adalah `no_wa`.
  2. `app/dashboard/hari-ini/page.js:1029` memeriksa `{detailPesanan.pesanan.alamat_pengiriman && (...)}`, padahal kolom di tabel `pesanan` adalah `alamat`.
- **Pemicu / Dampak**: Nomor WhatsApp penerima selalu kosong di bagian atas halaman tiket `/pesanan-saya/[kode]`, dan alamat pengiriman selalu kosong di drawer detail pesanan pada `/dashboard/hari-ini`.
- **Saran Perbaikan**: Ganti `pesanan.no_wa_penerima` menjadi `pesanan.no_wa`, dan ganti `detailPesanan.pesanan.alamat_pengiriman` menjadi `detailPesanan.pesanan.alamat`.
- **Tingkat**: **SEDANG**

### Temuan 4.11 — Pagination di `/dashboard/pesanan` Memuat Seluruh Tabel ke Memori & Gagal Sign URL Bila Pesanan Custom > 30
- **File & Baris**: [app/dashboard/pesanan/page.js:102-125, 200-237](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L102-L237) vs [app/api/berkas/signed-urls/route.js:29-34](file:///d:/Website-UMKN/app/api/berkas/signed-urls/route.js#L29-L34)
- **Apa yang Salah**: Fungsi `muatPesanan` mengambil semua baris tabel `pesanan` tanpa `.range(dari, sampai)`, mengambil semua `pesanan_item` dan `pesanan_pilihan` untuk seluruh pesanan tersebut, lalu mengumpulkan semua path `foto_referensi_url` dan `desain_json.preview_url` ke dalam `pathsToSign` dan mengirimkannya sekaligus ke `POST /api/berkas/signed-urls`. Padahal `/api/berkas/signed-urls` menolak dengan HTTP 400 apabila `paths.length > 30` (`"Maksimal 30 berkas per permintaan."`).
- **Pemicu / Dampak**: Begitu toko memiliki lebih dari 15–30 pesanan kue custom di database, panggilan `/api/berkas/signed-urls` di `/dashboard/pesanan` akan selalu gagal dengan HTTP 400 sehingga seluruh foto referensi dan preview 3D kue tidak muncul di dashboard pesanan.
- **Saran Perbaikan**: Terapkan pagination `.range()` di query Supabase atau hanya minta signed URL untuk 10 pesanan pada halaman aktif (`halaman`).
- **Tingkat**: **TINGGI**

### Temuan 4.12 — Kebocoran Memori (Memory Leak) Geometry/Material/Texture Three.js di `app/pesan/page.js`
- **File & Baris**: [app/pesan/page.js:4825-4915](file:///d:/Website-UMKN/app/pesan/page.js#L4825-L4915)
- **Apa yang Salah**: Saat membangun ulang mesh kue 3D (`buildCake`), child mesh lama dihapus dari `cakeGroup` (`while (cakeGroup.children.length) cakeGroup.remove(cakeGroup.children[0])`), tetapi `geometry.dispose()`, `material.dispose()`, dan `CanvasTexture.dispose()` untuk tekstur tulisan/topper tidak selalu dipanggil pada seluruh sub-group dan tekstur kanvas dinamis.
- **Pemicu / Dampak**: Ketika pelanggan menggeser slider, mengganti warna, atau mengetik tulisan kue berulang-ulang di `/pesan`, memori GPU/WebGL terus bertambah dan dapat memicu `WebGL context lost` pada perangkat mobile.
- **Saran Perbaikan**: Lakukan traversal rekursif pada `cakeGroup` sebelum `remove` untuk memanggil `.dispose()` pada setiap `geometry`, `material`, dan `material.map`.
- **Tingkat**: **SEDANG**

---

## BAGIAN 5: Keamanan

### 5.1 Audit Keamanan per Route API (`app/api/**/route.js`)

| Route API | Cek Login & Role Server | Validasi Input | Cek Kepemilikan | Kolom Internal Aman? | Catatan Temuan |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/akun` | Ya (`admin`) | Ya | N/A (Admin) | Ya | Aman. Melindungi agar admin tidak menghapus/menurunkan role dirinya sendiri. |
| `/api/berkas/signed-urls` | Ya (`pelanggan`, `staf`, `admin`) | Ya (`bucket`, maks 30 path) | Ya (Pelanggan dicek ke `pesanan`, `pesanan_item`, `keranjang_item`, `pembayaran`) | Ya | Aman. Mencegah path traversal (`..`). |
| `/api/cari-alamat` | Ya (`pelanggan`, `staf`, `admin`) | Ya (`q` 3-120 karakter, rate limit 20/menit) | N/A | Ya | Aman. |
| `/api/checkout` | Ya (`pelanggan`, `staf`, `admin`) | Ya (Nama, WA Indo, tanggal, jam, koordinat, hitung ulang harga di server) | Ya (`keranjang_item.id_pelanggan = user.id`) | Ya | Aman dari manipulasi harga klien; namun belum ada lock anti-race-condition dua tab. |
| `/api/cron/batalkan-pesanan` | **Tidak Aman jika `CRON_SECRET` kosong** | N/A | N/A | Ya | **[KRITIS]** `if (cronSecret && ...)` terlewati bila env `CRON_SECRET` kosong. |
| `/api/cron/bersihkan-keranjang` | **Tidak Aman jika `CRON_SECRET` kosong** | N/A | N/A | Ya | **[KRITIS]** `if (cronSecret && ...)` terlewati bila env `CRON_SECRET` kosong. |
| `/api/daftar` | Publik (Rate limit 5/10m per IP) | Ya (Nama, Email, WA Indo, Sandi >= 6) | N/A | Ya (`role: "pelanggan"` dipaksa di server) | Aman. Pesan error registrasi telah disanitasi. |
| `/api/kategori-produk` | `GET` Publik (`all=1` cek `admin`); Mutasi cek `admin` | Ya | N/A | Ya | Aman. |
| `/api/keranjang` | Ya (`pelanggan`, `staf`, `admin`) | Ya (Jenis, jumlah 1-20, verifikasi harga ke DB) | Ya (`id_pelanggan = user.id`) | Ya | Aman. |
| `/api/keranjang/jumlah` | Ya (Tanpa sesi -> `0`) | N/A | Ya (`id_pelanggan = user.id`) | Ya | Aman. |
| `/api/ketersediaan` | Publik | Ya (Format `YYYY-MM-DD`) | N/A | Ya | Aman (hanya mengembalikan angka kuota & jam buka). |
| `/api/laporan` | Ya (`admin`) | Ya (Filter rentang tanggal) | N/A | Ya | Aman. |
| `/api/midtrans/cek` | Ya (`pelanggan`, `staf`, `admin`) | Ya (`kode_pesanan`) | Ya (Pelanggan wajib pemilik pesanan) | Ya | Aman. |
| `/api/midtrans/token` | Ya (`pelanggan`, `admin`) | Ya (`kode_pesanan`, `ganti_metode`) | Ya (Pelanggan wajib pemilik pesanan) | Ya | Aman. Nominal dihitung murni dari database server. |
| `/api/midtrans/webhook` | Ya (Verifikasi SHA-512 `signature_key`) | Ya (Pencocokan `gross_amount` vs `pembayaran.jumlah`) | N/A | Ya | Aman. Menolak signature palsu (403) dan nominal tidak cocok (400). |
| `/api/ongkir` | Publik | Ya (Validasi koordinat Indonesia) | N/A | Ya | Aman. |
| `/api/opsi` | Ya (`admin`) | Ya | N/A | Ya | Aman. |
| `/api/opsi/resep` | Ya (`admin`) | Ya | N/A | Ya | Aman. |
| `/api/pembayaran` | Ya (`pelanggan`, `staf`, `admin`) | Ya (Jenis, metode, ukuran & MIME file bukti) | Ya | Ya | **[KRITIS]** Bug `metode_pengiriman` tidak di-select menyebabkan staf selalu 403. |
| `/api/pembayaran/[id]` | Ya (`admin`) | Ya (`aksi: konfirmasi \| tolak`) | N/A | Ya | **[TINGGI]** Tidak mengisi `dikonfirmasi_pada`. |
| `/api/pengaturan` | `GET` Publik (`scope=admin` cek `admin`); Mutasi cek `admin` | Ya (Koordinat, jam, DP, kuota, tier jarak) | N/A | Ya (`GET` publik hanya mengirim kolom aman) | **[KRITIS/TINGGI]** Bug `minimal_hari_siap` dan `tanggal_tutup.keterangan`. |
| `/api/pesanan` | Ya (`pelanggan`, `staf`, `admin`) | Ya (Hitung ulang harga dari `opsi_item`, validasi file foto) | Ya (`id_pelanggan = user.id`) | Ya | Aman dari manipulasi harga. |
| `/api/pesanan/terakhir-kirim` | Ya (`pelanggan`, `staf`, `admin`) | N/A | Ya (`id_pelanggan = user.id`) | Ya | Aman. |
| `/api/pesanan/[kode]` | Ya (`pelanggan`, `staf`, `admin`) | Ya (`kode`) | Ya (Pelanggan wajib pemilik) | **Tidak** | **[TINGGI]** Mengirim data `pembayaran` & `buktiUrl` ke role `staf`. |
| `/api/pesanan/[kode]/batal` | Ya (`pelanggan`, `staf`, `admin`) | Ya | Ya (`pesanan.id_pelanggan === user.id`) | Ya | Aman. |
| `/api/pesanan/[kode]/status` | Ya (`admin`, `staf`) | Ya (Matriks transisi status) | N/A | Ya | Aman. Staf diblokir dari status `"Dibatalkan"`. |
| `/api/pesanan/[kode]/stok` | Ya (`admin`, `staf`) | Ya | N/A | Ya | Aman dari sisi role, namun update stok belum atomik. |
| `/api/produk` | `GET` Publik (`all=1` cek `admin`); Mutasi cek `admin` | Ya (Validasi harga, kategori, unggah foto maks 5MB) | N/A | Ya | Aman. |
| `/api/profil` | Ya (`pelanggan`, `staf`, `admin`) | Ya (Nama, WA Indo, koordinat Indo, verifikasi `sandi_lama`) | Ya (`id = user.id`) | Ya (Tidak bisa mengubah `role`) | Aman. |
| `/api/stok` | `GET`/`PATCH` (`admin`, `staf`); `POST`/`PUT`/`DELETE` (`admin`) | Ya | N/A | Ya | Aman. |
| `/api/stok/riwayat` | Ya (`admin`, `staf`) | Ya (`id_bahan`) | N/A | Ya | Aman. |
| `/api/tarif-jarak` | `GET` Publik (`all=1` cek `admin`); Mutasi cek `admin` | Ya | N/A | Ya | Route API yatim (tidak dipanggil). |

---

### 5.2 Temuan Keamanan Spesifik

### Temuan 5.1 — Bypass Autentikasi Endpoint Cron Apabila `CRON_SECRET` Tidak Diset
- **File & Baris**: [app/api/cron/batalkan-pesanan/route.js:6-10](file:///d:/Website-UMKN/app/api/cron/batalkan-pesanan/route.js#L6-L10) & [app/api/cron/bersihkan-keranjang/route.js:6-10](file:///d:/Website-UMKN/app/api/cron/bersihkan-keranjang/route.js#L6-L10)
- **Apa yang Salah**: Kedua file menulis:
  ```js
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ pesan: "Tidak diizinkan." }, { status: 401 });
  }
  ```
  Karena memakai `if (cronSecret && ...)`, jika `CRON_SECRET` lupa diatur di environment server produksi, kondisi bernilai `false` dan endpoint dapat dipanggil secara bebas tanpa header `Authorization`.
- **Pemicu / Dampak**: Pihak luar dapat memicu eksekusi cron secara berulang tanpa autentikasi.
- **Saran Perbaikan**: Ubah menjadi `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)`.
- **Tingkat**: **KRITIS**

### Temuan 5.2 — Policy RLS `pengaturan_toko` Mengizinkan `SELECT *` Publik dari Browser & Dipakai Langsung di `CheckoutView.js`
- **File & Baris**: [supabase/migrations/00004_rls.sql:36-38](file:///d:/Website-UMKN/supabase/migrations/00004_rls.sql#L36-L38) & [components/patisserie/CheckoutView.js:179](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L179)
- **Apa yang Salah**: Di `00004_rls.sql:36-38`, policy `"Pengaturan toko dibaca publik"` dibuat dengan `FOR SELECT USING (true)` tanpa pembatasan kolom, dan belum dicabut di `00014_rls_audit.sql`. Selain itu, `CheckoutView.js:179` masih memanggil `supabase.from("pengaturan_toko").select("*").eq("id", 1).single()` dari browser menggunakan anon key.
- **Pemicu / Dampak**: Meskipun `GET /api/pengaturan` telah memfilter kolom publik (`KOLOM_PENGATURAN_PUBLIK`), pengunjung siapa pun dapat menjalankan `supabase.from("pengaturan_toko").select("*")` dari DevTools browser untuk membaca seluruh kolom `pengaturan_toko` (termasuk `nama_bank`, `no_rekening`, `atas_nama`, `qris_url`).
- **Saran Perbaikan**: Ubah `CheckoutView.js:179` agar mengambil pengaturan dari `fetch("/api/pengaturan")`, dan ubah policy RLS `pengaturan_toko` menjadi `using (public.is_admin())` karena pembacaan publik sudah dilayani oleh server (`lib/tokoPublik.js` dan `GET /api/pengaturan`).
- **Tingkat**: **KRITIS**

### Temuan 5.3 — Kebocoran Data `pembayaran` dan `buktiUrl` kepada Role `staf` di `GET /api/pesanan/[kode]`
- **File & Baris**: [app/api/pesanan/[kode]/route.js:47-55, 197-209, 243](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/route.js#L47-L55)
- **Apa yang Salah**:Migrasi `00014_rls_audit.sql:10-20` sudah mencabut akses staf ke tabel `pembayaran` (`pembayaran_select_policy` hanya mengizinkan `is_admin()` atau pemilik pesanan). Namun `GET /api/pesanan/[kode]` menggunakan `getSupabaseAdmin()` (service role yang mem-bypass RLS) dan mengembalikan `pembayaran: resPembayaran.data || []` serta `buktiUrl` kepada pengguna dengan role `staf`.
- **Pemicu / Dampak**: Staf yang memanggil `GET /api/pesanan/[kode]` (atau membuka drawer detail pesanan di `/dashboard/hari-ini` dan `/dashboard/pesanan`) tetap menerima seluruh rincian baris tabel `pembayaran` beserta signed URL bukti bayar pelanggan.
- **Saran Perbaikan**: Hanya ambil dan kembalikan `pembayaran` serta `buktiUrl` di `GET /api/pesanan/[kode]` jika `profil.role === "admin" || pesanan.id_pelanggan === user.id`.
- **Tingkat**: **TINGGI**

### Temuan 5.4 — Potensi Bypass Open Redirect dengan Karakter Backslash (`/\domain.com`) pada Parameter `?ke=`
- **File & Baris**: [app/masuk/page.js:15-21](file:///d:/Website-UMKN/app/masuk/page.js#L15-L21) & [app/daftar/page.js:14-20](file:///d:/Website-UMKN/app/daftar/page.js#L14-L20)
- **Apa yang Salah**: Fungsi `bersihkanTujuanRedirect(raw)` memvalidasi `tujuan.startsWith("/") && !tujuan.startsWith("//") && !tujuan.includes("://")`, tetapi tidak menolak karakter backslash (`\`) seperti `/\evil.com`.
- **Pemicu / Dampak**: Jika pengguna membuka `/masuk?ke=/\evil.com`, string tersebut lolos validasi karena dimulai dengan `/` dan bukan `//`, namun browser dapat menafsirkannya sebagai `//evil.com` saat navigasi.
- **Saran Perbaikan**: Tambahkan `!tujuan.startsWith("/\\") && !tujuan.includes("\\")` pada `bersihkanTujuanRedirect`.
- **Tingkat**: **SEDANG**

### Temuan 5.5 — Verifikasi Kunci Rahasia, XSS, Upload File, & RLS Browser
- **Hasil Pemeriksaan**:
  1. **Kunci Rahasia Server (`SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, `CRON_SECRET`)**: Hanya diakses di kode server (`lib/supabaseServer.js`, `lib/midtrans.js`, `app/api/cron/**`). Tidak ada komponen `"use client"` yang mengimpor file-file tersebut, dan ketiganya tidak menggunakan prefix `NEXT_PUBLIC_`.
  2. **XSS (`dangerouslySetInnerHTML`)**: Tidak ditemukan penggunaan `dangerouslySetInnerHTML` di seluruh repositori (0 kemunculan).
  3. **Validasi Upload File**:
     - `POST /api/produk` ([route.js:14-21](file:///d:/Website-UMKN/app/api/produk/route.js#L14-L21)): Memvalidasi MIME type (`image/jpeg`, `image/png`, `image/webp`) dan ukuran maksimal `5 MB`.
     - `POST /api/pesanan` ([route.js:343-358](file:///d:/Website-UMKN/app/api/pesanan/route.js#L343-L358)): Memvalidasi MIME type (`image/jpeg`, `image/png`, `image/webp`) dan ukuran maksimal `5 MB`.
     - `POST /api/pembayaran` ([route.js:109-125](file:///d:/Website-UMKN/app/api/pembayaran/route.js#L109-L125)): Memvalidasi MIME type (`image/jpeg`, `image/png`, `image/webp`) dan ukuran maksimal `5 MB`.
     - **Celah Upload Langsung dari Browser di `/pesan` ([app/pesan/page.js:5826-5843](file:///d:/Website-UMKN/app/pesan/page.js#L5826-L5843))**: Saat pelanggan menambahkan kue custom ke keranjang, `unggahBerkasReferensi` mengunggah file langsung dari browser ke bucket `foto-referensi` menggunakan `supabaseBrowser.storage.from("foto-referensi").upload(...)`. Di sisi klien hanya ada pengecekan `accept="image/*"` pada input HTML tanpa validasi ukuran maksimal 5 MB di JavaScript sebelum upload (status policy bucket di Supabase `tidak bisa diverifikasi dari kode`).
  4. **Query `supabaseBrowser` Langsung dari Komponen Client vs RLS**:
     - `app/dashboard/hari-ini/page.js`, `app/dashboard/pesanan/page.js`, `app/dashboard/stok/page.js`: Menggunakan `supabaseBrowser` untuk membaca `pesanan`, `pesanan_item`, `pesanan_pilihan`, `zona_ongkir`, `pengaturan_toko`, `bahan_stok`, `resep_item`, `opsi_item`. Seluruh tabel tersebut memiliki policy RLS `SELECT` yang mengizinkan `is_admin() OR is_staf()`.
     - `app/pesan/page.js`: Menggunakan `supabaseBrowser` untuk membaca `opsi_grup`, `opsi_item`, `pengaturan_toko`, `zona_ongkir`, `tanggal_tutup`, `profil`. Semua tabel tersebut diizinkan oleh RLS (namun `pengaturan_toko` terlalu terbuka sebagaimana dicatat pada Temuan 5.2).

---

## BAGIAN 6: Skema Database vs Kode & Environment Variables

### 6.1 Perbandingan Tabel, Kolom, Constraint, dan RPC di Kode vs `supabase/migrations/*.sql`

| Tabel / Objek | Kolom / Constraint di Migrasi | Pemakaian di Kode | Status & Temuan |
| :--- | :--- | :--- | :--- |
| `profil` | `id, nama, no_wa, role, dibuat_pada` (`00001`), `alamat, patokan, id_zona` (`00008`), `lat_alamat, lng_alamat` (`00015`) | `/api/profil`, `/api/akun`, `/api/daftar`, `/user`, `/checkout` | **Sesuai** (memiliki fallback aman jika `00015` belum dijalankan). Kolom `id_zona` sudah tidak ditampilkan di UI profil tetapi tetap ada di skema. |
| `pengaturan_toko` | `id, nama_toko, alamat, no_wa, jam_buka, jam_tutup, kuota_harian, minimal_hari_pesan, mode_pembayaran, persen_dp, nama_bank, no_rekening, atas_nama, qris_url` (`00001`), `minimal_hari_siap` (`00007`) -> **di-rename menjadi `minimal_hari_katalog`** (`00012_fase1:85`), `email, instagram, deskripsi_singkat, deskripsi_footer, tautan_peta, jam_buka_senin_jumat, jam_tutup_senin_jumat, jam_buka_sabtu_minggu, jam_tutup_sabtu_minggu` (`00012_fase1`), `lat_toko, lng_toko, maks_jarak_kirim_km` (`00012_ongkir`) | `lib/tokoPublik.js`, `app/api/pengaturan/route.js`, `CheckoutView.js`, `app/pesan/page.js` | **[KRITIS]** `app/api/pengaturan/route.js:265,536-537,673-674` dan `lib/tokoPublik.js:59` memilih/mengupdate `minimal_hari_katalog` DAN `minimal_hari_siap` sekaligus, padahal `00012_fase1` me-rename `minimal_hari_siap` menjadi `minimal_hari_katalog`. |
| `zona_ongkir` | `id, nama, keterangan, tarif, estimasi_waktu, aktif` (`00001`) | `app/pesan/page.js`, `/api/pesanan`, `/api/pengaturan` | **Sesuai** (Masih dipakai sebagai kompatibilitas pesanan lama dan `/pesan`). |
| `tarif_jarak` | `id, batas_km, tarif, aktif, urutan` (`00012_ongkir`) | `/api/ongkir`, `/api/checkout`, `/api/pengaturan`, `/api/tarif-jarak` | **Sesuai**. |
| `tanggal_tutup` | `id, tanggal, alasan` (`00001:59`) | `/api/pengaturan`, `/api/ketersediaan`, `/api/checkout`, `/api/pesanan` | **[TINGGI]** `app/api/pengaturan/route.js:136` melakukan `.select("tanggal, keterangan")`, padahal nama kolom di skema adalah `alasan`. |
| `opsi_grup` & `opsi_item` | `opsi_grup`: `id, nama, slug, urutan, wajib, jenis_pilihan, peran_visual, aktif`; `opsi_item`: `id, id_grup, nama, deskripsi, harga, kode_visual, warna, urutan, aktif` (`00001`) | `/pesan`, `/dashboard/katalog-opsi`, `/api/opsi`, `/api/keranjang`, `/api/checkout`, `/api/pesanan` | **Sesuai**. |
| `kategori_produk` & `produk_katalog` | `kategori_produk`: `id, nama, urutan, aktif` (`00012_fase1`); `produk_katalog`: `id, nama, deskripsi, komposisi, harga, porsi, foto_url, label_teks, aktif, urutan` (`00010`), `id_kategori, unggulan` (`00012_fase1`) | `/menu`, `/`, `/dashboard/katalog-opsi`, `/api/produk`, `/api/kategori-produk` | **Sesuai**. |
| `keranjang_item` | `id, id_pelanggan, jenis, id_produk, nama, jumlah, harga_satuan, tulisan_kue, catatan_item, foto_referensi_url, desain_json, pilihan_json, dibuat_pada, diperbarui_pada` (`00011_keranjang`) | `/api/keranjang`, `/api/keranjang/jumlah`, `/api/checkout`, `/api/cron/bersihkan-keranjang` | **Sesuai**. |
| `pesanan` | `id, kode_pesanan, id_pelanggan, nama_penerima, no_wa, tanggal_ambil, jam_ambil, metode_pengiriman, alamat, id_zona, ongkir, tulisan_kue, catatan, foto_referensi_url, total_kue, total_bayar, mode_pembayaran, persen_dp, jumlah_dp, jumlah_terbayar, sisa_bayar, status_bayar, status_pesanan, catatan_admin, dibuat_pada, diperbarui_pada` (`00001`), `stok_dikurangi` (`00006`), `jenis_pesanan, id_produk, nama_produk, jumlah_produk, patokan` (`00007`), `desain_json` (`00009`), `batas_bayar` (`00011_keranjang`), `lat_kirim, lng_kirim, jarak_km` (`00012_ongkir`), `penerima_serah_terima, waktu_serah_terima, perlu_refund` (`00013`) | Seluruh halaman & API pesanan | **[SEDANG]** Kode di `app/pesanan-saya/[kode]/page.js:262` membaca `pesanan.no_wa_penerima` (tidak ada), `app/dashboard/hari-ini/page.js:1029` membaca `pesanan.alamat_pengiriman` (tidak ada), dan `DashboardPelangganView.js:37-39` membaca `tanggal_pasti_kirim, estimasi_kirim_awal, estimasi_kirim_akhir` (tidak ada). |
| `pesanan_item` | `id, id_pesanan, jenis, id_produk, nama, jumlah, harga_satuan, subtotal, tulisan_kue, catatan_item, foto_referensi_url, desain_json, dibuat_pada` (`00011_keranjang:32-47`) | `/api/checkout`, `/user`, `/pesanan-saya/[kode]`, `/dashboard/pesanan`, `/dashboard/hari-ini` | **[KRITIS]** `app/dashboard/hari-ini/page.js:87` melakukan `.select("..., catatan_opsi, spesifikasi_singkat")` yang tidak ada di `pesanan_item`. |
| `pesanan_pilihan` | `id, id_pesanan, id_grup, id_item, nama_grup, nama_item, harga` (`00001:102-111`), `id_pesanan_item` (`00011_keranjang:52`) | `/api/checkout`, `/api/pesanan`, `/dashboard/**` | **[KRITIS]** `app/dashboard/hari-ini/page.js:91` melakukan `.select("..., teks_pilihan")` yang tidak ada di `pesanan_pilihan`. |
| `pembayaran` | `id, id_pesanan, jenis, metode, jumlah, bukti_url, status, catatan, id_pengonfirmasi, dikonfirmasi_pada, dibuat_pada` (`00001`), `midtrans_order_id, snap_token, snap_redirect_url, midtrans_transaction_id, midtrans_payment_type, midtrans_response` (`00013`) | `/api/midtrans/*`, `/api/pembayaran/*`, `/api/laporan`, `/user`, `/pesanan-saya/[kode]` | **Sesuai** (`00013_midtrans_dan_status.sql` telah memperluas `CHECK` constraint `metode` dan `status`). |
| `bahan_stok`, `resep_item`, `riwayat_stok` | `00006_stok_dan_perbaikan.sql` | `/api/stok/*`, `/api/opsi/resep`, `/api/pesanan/[kode]/stok`, `/dashboard/stok` | **Sesuai**. |
| Fungsi RPC | `is_admin()`, `is_staf()`, `handle_user_baru()` (`00001`, `00011_perbaikan_daftar_user`) | Dipakai di policy RLS & trigger `auth.users` | **Sesuai** (Tidak ada pemanggilan `.rpc(...)` dari kode JavaScript). |

---

### 6.2 Temuan Skema, Migrasi & Environment Variables

### Temuan 6.1 — Konflik Migrasi Rename `minimal_hari_siap` -> `minimal_hari_katalog` dengan Query `SELECT` / `UPDATE` di Kode Server
- **File & Baris**: [supabase/migrations/00012_fase1_katalog_pengaturan.sql:84-89](file:///d:/Website-UMKN/supabase/migrations/00012_fase1_katalog_pengaturan.sql#L84-L89) vs [app/api/pengaturan/route.js:265, 536-537, 673-674](file:///d:/Website-UMKN/app/api/pengaturan/route.js#L265) & [lib/tokoPublik.js:59](file:///d:/Website-UMKN/lib/tokoPublik.js#L59)
- **Apa yang Salah**: Migrasi `00012_fase1_katalog_pengaturan.sql` menjalankan `ALTER TABLE public.pengaturan_toko RENAME COLUMN minimal_hari_siap TO minimal_hari_katalog;`. Artinya, di database hanya akan ada satu kolom (`minimal_hari_katalog`), bukan keduanya. Namun:
  1. `app/api/pengaturan/route.js:265` (`KOLOM_PENGATURAN_ADMIN`) menyeleksi `"..., minimal_hari_katalog, minimal_hari_siap, ..."`.
  2. `app/api/pengaturan/route.js:536-537` dan `673-674` (`PUT /api/pengaturan`) mengirim `minimal_hari_katalog: minKatalog, minimal_hari_siap: minKatalog` dalam satu objek `.update(...)`.
  3. `lib/tokoPublik.js:59` menyeleksi `"..., minimal_hari_katalog, minimal_hari_siap, ..."`.
- **Pemicu / Dampak**: Query utama `GET /api/pengaturan?scope=admin`, `PUT /api/pengaturan`, dan `getPengaturanTokoPublik()` selalu gagal dengan error PostgreSQL `column "minimal_hari_siap" does not exist`! Di `PUT /api/pengaturan`, kegagalan `attempt1` memaksa kode jatuh ke `attempt2` (`payloadDasar` di baris 546-556) yang **hanya menyimpan kolom dasar dan membuang perubahan `email`, `instagram`, `tautan_peta`, `deskripsi_footer`, `jam_buka_senin_jumat`, `lat_toko`, `lng_toko`, dan `maks_jarak_kirim_km`**!
- **Saran Perbaikan**: Hapus `minimal_hari_siap` dari `KOLOM_PENGATURAN_ADMIN`, `payloadLengkap`, `payloadOperasional`, dan `lib/tokoPublik.js:59` (cukup gunakan `minimal_hari_katalog`).
- **Tingkat**: **KRITIS**

### Temuan 6.2 — Nomor Urut File Migrasi Ganda (`00011` dan `00012`)
- **File & Baris**:
  - `supabase/migrations/00011_keranjang.sql` & `supabase/migrations/00011_perbaikan_daftar_user.sql`
  - `supabase/migrations/00012_fase1_katalog_pengaturan.sql` & `supabase/migrations/00012_ongkir_jarak.sql`
- **Apa yang Salah**: Terdapat dua pasang file migrasi dengan prefix nomor urut yang sama (`00011` dan `00012`).
- **Pemicu / Dampak**: Supabase CLI (`supabase db reset` / `supabase db push`) menggunakan prefix angka/timestamp sebagai kunci primer tabel `supabase_migrations.schema_migrations` pada beberapa versi CLI dan akan menolak duplikasi versi.
- **Saran Perbaikan**: Beri nomor urut unik secara berurutan atau tambahkan migrasi konsolidasi jika migrasi lama sudah tercatat.
- **Tingkat**: **TINGGI**

### Temuan 6.3 — Variabel Environment di Kode vs `.env.example` Tidak Sinkron
- **File & Baris**: [.env.example:1-13](file:///d:/Website-UMKN/.env.example#L1-L13) vs `app/api/cron/**/route.js:6` & `app/layout.js:9`
- **Apa yang Salah**:
  1. Kode menggunakan `process.env.CRON_SECRET` ([app/api/cron/batalkan-pesanan/route.js:6](file:///d:/Website-UMKN/app/api/cron/batalkan-pesanan/route.js#L6), [app/api/cron/bersihkan-keranjang/route.js:6](file:///d:/Website-UMKN/app/api/cron/bersihkan-keranjang/route.js#L6)) dan `process.env.NEXT_PUBLIC_BASE_URL` ([app/layout.js:9](file:///d:/Website-UMKN/app/layout.js#L9)), tetapi **keduanya tidak tercantum di `.env.example`**.
  2. `.env.example` mencantumkan `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (baris 8), tetapi kode di `app/layout.js:9` justru membaca `NEXT_PUBLIC_BASE_URL` (sehingga `NEXT_PUBLIC_SITE_URL` tidak pernah dipakai di mana pun).
- **Pemicu / Dampak**: Saat deployment baru mengikuti `.env.example`, `CRON_SECRET` tidak akan diset (memicu kerentanan bypass autentikasi cron pada Temuan 5.1) dan `metadataBase` di `app/layout.js` selalu jatuh ke `http://localhost:3000`.
- **Saran Perbaikan**: Tambahkan `CRON_SECRET=` ke `.env.example` dan samakan nama variabel URL situs (`NEXT_PUBLIC_BASE_URL` atau `NEXT_PUBLIC_SITE_URL`).
- **Tingkat**: **SEDANG**

---

## BAGIAN 7: Konsistensi, Kualitas Kode, Responsivitas & Aksesibilitas

### Temuan 7.1 — Ketidakkonsistenan Format Angka (`lining-nums`) & Duplikasi Fungsi `formatRupiah`
- **File & Baris**: [components/patisserie/patisserieData.ts:457-463](file:///d:/Website-UMKN/components/patisserie/patisserieData.ts#L457-L463) vs [lib/format.js:4-8](file:///d:/Website-UMKN/lib/format.js#L4-L8); [components/WizardPesan.js:291-319](file:///d:/Website-UMKN/components/WizardPesan.js#L291-L319), [components/patisserie/EtalaseShowcaseView.tsx:149](file:///d:/Website-UMKN/components/patisserie/EtalaseShowcaseView.tsx#L149)
- **Apa yang Salah**:
  1. Terdapat dua implementasi `formatRupiah`: satu di `lib/format.js:4` (`Rp ${num.toLocaleString("id-ID")}`) dan satu lagi di `components/patisserie/patisserieData.ts:457` (`Intl.NumberFormat('id-ID', ...)`).
  2. Sesuai `CLAUDE.md` ("Angka harga dan ukuran selalu memakai `font-variant-numeric: lining-nums` agar tidak turun-naik pada Cormorant Garamond"), halaman `/menu` (`DessertsMenuView.tsx:279`) dan `/keranjang` (`KasirView.tsx`) sudah memasang `style={{ fontVariantNumeric: "lining-nums" }}`, tetapi harga di `EtalaseShowcaseView.tsx:149`, `CravelyEditorialSections.tsx:464`, dan `/pesanan-saya/[kode]/page.js:368,383,448,475` hanya memakai `tabular-nums` tanpa `lining-nums` pada font `font-serif` (Cormorant Garamond).
- **Pemicu / Dampak**: Angka harga yang memakai `font-serif` (Cormorant Garamond) tanpa `lining-nums` menampilkan oldstyle figures yang turun-naik (angka `3, 4, 5, 7, 9` menggantung di bawah baseline).
- **Saran Perbaikan**: Tambahkan `lining-nums` pada aturan CSS `.font-serif.tabular-nums` di `app/globals.css` dan satukan `formatRupiah` ke `@/lib/format`.
- **Tingkat**: **RENDAH**

### Temuan 7.2 — Duplikasi Konstanta Status Pesanan & Pembayaran di Banyak File
- **File & Baris**: [app/dashboard/pesanan/page.js:11-28](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L11-L28), [app/dashboard/hari-ini/page.js:23-39](file:///d:/Website-UMKN/app/dashboard/hari-ini/page.js#L23-L39), [app/api/pesanan/[kode]/status/route.js:6-35](file:///d:/Website-UMKN/app/api/pesanan/%5Bkode%5D/status/route.js#L6-L35), [components/DashboardPelangganView.js:18-32](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L18-L32), [components/BadgeStatus.js:3-24](file:///d:/Website-UMKN/components/BadgeStatus.js#L3-L24)
- **Apa yang Salah**: Daftar status pesanan (`STATUS_PESANAN`), status aktif (`STATUS_PESANAN_AKTIF`), dan matriks transisi status (`TRANSISI_VALID`) didefinisikan berulang-ulang secara terpisah di 5+ file berbeda.
- **Pemicu / Dampak**: Berisiko tidak sinkron apabila ada penambahan atau perubahan aturan status di masa depan.
- **Saran Perbaikan**: Ekstrak konstanta status dan fungsi bantu transisi ke satu file terpusat (misal `lib/statusPesanan.js`).
- **Tingkat**: **RENDAH**

### Temuan 7.3 — Komentar Kode & `console.error` yang Masih Tersisa (Melanggar Aturan Tanpa Komentar)
- **File & Baris**:
  - `console.error(e)` di [app/pesan/page.js:4817](file:///d:/Website-UMKN/app/pesan/page.js#L4817)
  - Komentar kode (`//`, `/* */`, `{/* */}`) di 17 file: `app/pesan/page.js` (50 baris), `app/toko/page.js` (6 baris), `app/globals.css` (6 baris), `app/dashboard/dashboard.css` (23 baris), `app/pesan/cakecraft.css` (20 baris), `components/patisserie/CafeScene.tsx` (119 baris), `WalkingPatissier.tsx` (77 baris), `DimensionalCakes.tsx` (51 baris), `CafeStoryShowcase.tsx` (48 baris), `EtalaseShowcaseView.tsx` (36 baris), `BotanicalBranchDecor.tsx` (31 baris), `CustomCakeStudio.tsx` (25 baris), `CravelyEditorialSections.tsx` (24 baris), `StoreProfilePages.tsx` (16 baris), `DessertIllustrations.tsx` (7 baris), `DessertsMenuView.tsx` (5 baris), `PromoWelcomeModal.tsx` (5 baris).
- **Apa yang Salah**: Aturan proyek mewajibkan kode bersih tanpa komentar dan tanpa `console.log`/`console.error` sisa debugging.
- **Pemicu / Dampak**: Melanggar standar kode repositori.
- **Saran Perbaikan**: Bersihkan komentar dan `console.error` pada file-file tersebut.
- **Tingkat**: **RENDAH**

### Temuan 7.4 — Ukuran File Sangat Besar (> 1.500 Baris) Menyulitkan Pemeliharaan
- **File & Baris**:
  1. [app/pesan/page.js](file:///d:/Website-UMKN/app/pesan/page.js) — **8.094 baris**
  2. [components/DashboardPelangganView.js](file:///d:/Website-UMKN/components/DashboardPelangganView.js) — **2.624 baris**
  3. [app/dashboard/pengaturan/page.js](file:///d:/Website-UMKN/app/dashboard/pengaturan/page.js) — **2.479 baris**
  4. [app/dashboard/pesanan/page.js](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js) — **2.087 baris**
  5. [app/pesan/cakecraft.css](file:///d:/Website-UMKN/app/pesan/cakecraft.css) — **2.065 baris**
  6. [app/dashboard/dashboard.css](file:///d:/Website-UMKN/app/dashboard/dashboard.css) — **1.904 baris**
  7. [app/dashboard/katalog-opsi/page.js](file:///d:/Website-UMKN/app/dashboard/katalog-opsi/page.js) — **1.582 baris**
  8. [components/patisserie/CafeScene.tsx](file:///d:/Website-UMKN/components/patisserie/CafeScene.tsx) — **1.528 baris**
- **Apa yang Salah**: Delapan file melebihi 1.500 baris (terutama `app/pesan/page.js` dengan >8.000 baris dalam satu komponen).
- **Pemicu / Dampak**: Waktu kompilasi HMR lambat, risiko regresi tinggi saat menyunting state, dan sulit diuji per modul.
- **Saran Perbaikan**: Pecah sub-komponen tab/modal secara bertahap tanpa mengubah desain dan perilaku.
- **Tingkat**: **RENDAH**

### Temuan 7.5 — Pemeriksaan Responsivitas (`375px`, `768px`, `1280px`) & 3 Gaya Visual
- **File & Baris**: [components/patisserie/DynamicIslandNavbar.jsx:285-336](file:///d:/Website-UMKN/components/patisserie/DynamicIslandNavbar.jsx#L285-L336), [app/dashboard/pesanan/page.js:840-960](file:///d:/Website-UMKN/app/dashboard/pesanan/page.js#L840-L960)
- **Apa yang Salah**:
  1. **3 Gaya Visual**: Sudah terjaga konsistensinya sesuai wilayahnya:
     - Halaman publik/toko (`/`, `/toko`, `/menu`, `/keranjang`, `/checkout`, `/pesanan-saya/[kode]`): gaya coquette/editorial (`#FDF6EC`, `#9E3B42`, `#C59B62`).
     - Dashboard pelanggan (`/user`): gaya clean stone/rose (`bg-[#FAF9F6]`, `text-stone-900`, `rose-600`).
     - Dashboard internal (`/dashboard/**`): gaya bakery green/cream (`#2F4F3E`, `#F6EFE6`, `#C83E3B`).
  2. **Potensi Overflow Horizontal pada `DynamicIslandNavbar` di Layar Sempit (`375px`)**: Pada `DynamicIslandNavbar.jsx:291`, kondisi expanded menggunakan `flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap` tanpa `overflow-x-auto` pada kontainer dalamnya, sedangkan di dalamnya terdapat Brand + 3 link navigasi (`Home`, `Toko`, `Menu`) + tombol `Cake Studio` + tombol `Keranjang` + tombol `Akun` + tombol `Ciutkan`. Pada layar `375px`, total lebar elemen melebihi `351px` (`calc(100vw - 1.5rem)`), sehingga ujung kanan kapsul navbar terpotong keluar viewport pada perangkat mobile kecil.
- **Pemicu / Dampak**: Pengguna HP berlayar `375px` yang membuka `DynamicIslandNavbar` dapat mengalami tombol `Akun` atau `Ciutkan` terpotong di sisi kanan.
- **Saran Perbaikan**: Tambahkan `flex-wrap justify-center rounded-3xl sm:rounded-full` atau `overflow-x-auto max-w-[calc(100vw-1.5rem)]` pada mode expanded `DynamicIslandNavbar.jsx:291`.
- **Tingkat**: **SEDANG**

### Temuan 7.6 — Aksesibilitas Dasar (Label Form, Alt Gambar, Kontras, & Navigasi Keyboard)
- **File & Baris**: [app/dashboard/pengaturan/page.js:1010-1280](file:///d:/Website-UMKN/app/dashboard/pengaturan/page.js#L1010-L1280), [components/DashboardPelangganView.js:1840-1910](file:///d:/Website-UMKN/components/DashboardPelangganView.js#L1840-L1910), [components/patisserie/CheckoutView.js:730-810](file:///d:/Website-UMKN/components/patisserie/CheckoutView.js#L730-L810)
- **Apa yang Salah**: Sebagian besar elemen `<label>` dan `<input>` di form pengaturan, profil, dan checkout tidak dihubungkan dengan atribut `htmlFor` dan `id` (melainkan diletakkan bersebelahan di dalam `<div>`). Selain itu, beberapa tombol ikon di tabel dashboard menggunakan `title="..."` tanpa `aria-label="..."`.
- **Pemicu / Dampak**: Screen reader tidak dapat mengasosiasikan label teks secara otomatis saat fokus berada pada elemen `<input>`.
- **Saran Perbaikan**: Tambahkan pasangan `htmlFor` dan `id` (atau bungkus `<input>` di dalam `<label>`) serta lengkapi `aria-label` pada seluruh tombol ikon.
- **Tingkat**: **RENDAH**

---

## BAGIAN 8: Build dan Alat Pemeriksa

### 8.1 Hasil `npm run build` (Next.js 16.4.6 Turbopack)

- **Perintah**: `npm run build`
- **Status Keluar (Exit Code)**: `0` (**BERHASIL**)
- **Waktu Kompilasi**: `7.3s` (TypeScript check selesai dalam `43ms`, static page generation `54/54` halaman selesai dalam `4.9s`).
- **Daftar Peringatan (Warnings)**:
  1. **Deprecasi Konvensi `middleware.js` di Next.js 16.4.6**:
     ```text
     ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
       To migrate automatically, run:
       npx @next/codemod@canary middleware-to-proxy .
       Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
     ```
     - **File**: [middleware.js:1-46](file:///d:/Website-UMKN/middleware.js#L1-L46)
     - **Tingkat**: **RENDAH** (Masih berjalan normal sebagai `ƒ Proxy (Middleware)` pada Next.js 16.4.6, namun direkomendasikan migrasi ke `proxy.js` sesuai panduan Next.js 16).

### 8.2 Pemeriksaan Skrip Alat di `package.json`
- **File**: [package.json:5-9](file:///d:/Website-UMKN/package.json#L5-L9)
- **Temuan**: `package.json` hanya mendefinisikan 3 skrip: `"dev"`, `"build"`, dan `"start"`. Tidak ada skrip `"lint"` atau `"typecheck"` terpisah di `package.json` (meskipun `next build` sudah menjalankan pemeriksaan TypeScript secara otomatis).
- **Tingkat**: **RENDAH**
