# Panduan Deployment Produksi - Cravely Bakery

Dokumen ini memuat panduan langkah demi langkah untuk melakukan deploy website Cravely Bakery ke Vercel dan menghubungkan seluruh layanan eksternal (Supabase & Midtrans).

---

## 1. Variabel Lingkungan (Environment Variables)

Masukkan variabel lingkungan berikut pada dasbor **Vercel** (**Project Settings** > **Environment Variables**):

| Nama Variabel | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anonim publik Supabase | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci service role privat Supabase (khusus backend) | `eyJhbGci...` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Kunci Client Midtrans Snap | `Mid-client-xxxx` (Production) |
| `MIDTRANS_SERVER_KEY` | Kunci Server Midtrans | `Mid-server-xxxx` (Production) |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | Mode gateway Midtrans | `true` (untuk live) / `false` (sandbox) |
| `CRON_SECRET` | Kunci otentikasi Vercel Cron | String acak aman minimal 32 karakter |
| `NEXT_PUBLIC_BASE_URL` | Domain utama website | `https://cravely.id` atau domain Vercel |

> Pastikan file `.env.local` tidak di-commit ke Git (sudah tercantum di `.gitignore`).

---

## 2. Jadwal Vercel Cron (`vercel.json`)

Proyek ini telah dikonfigurasi dengan `vercel.json`:
* `/api/cron/batalkan-pesanan`: Berjalan setiap hari pukul 00:00 UTC untuk membatalkan pesanan kedaluwarsa yang melewati batas waktu bayar.
* `/api/cron/bersihkan-keranjang`: Berjalan setiap hari pukul 02:00 UTC untuk membersihkan item keranjang usang pelanggan.

> **Catatan Paket Vercel Hobby (Gratis):** Vercel membatasi frekuensi eksekusi cron maksimal 1 kali per hari per rute. Pembatalan pesanan kedaluwarsa juga berjalan secara otomatis secara *lazy* (throttling 5 menit) setiap kali ada pengecekan ketersediaan jadwal atau saat membuka daftar antrean pesanan di dashboard.

---

## 3. Konfigurasi Supabase Auth & Storage

### A. Pengaturan Autentikasi (Authentication Settings)
Buka **Project Settings** > **Authentication** pada dasbor Supabase:
1. **Site URL**: Masukkan domain utama produksi (contoh: `https://cravely.id`).
2. **Redirect URLs**: Daftarkan URL pemulihan kata sandi berikut:
   * `https://cravely.id/atur-ulang-sandi`
   * `https://domain-kamu.vercel.app/atur-ulang-sandi`
3. **Template Email Reset Password**:
   * Buka **Email Templates** > **Reset Password**.
   * Pastikan tombol tindakan mengarah ke `{{ .ConfirmationURL }}`.

### B. Bucket Storage & Kebijakan
Pastikan bucket storage `bukti-transfer` dan `foto-kue` tersedia dengan status:
* `foto-kue`: Public bucket (dapat dibaca oleh umum untuk foto katalog dan preview kue).
* `bukti-transfer`: Private bucket (hanya dapat diakses melalui signed URL oleh pemilik pesanan dan administrator).

---

## 4. Konfigurasi Midtrans Snap (Production)

Saat beralih dari Sandbox ke Production:
1. Masuk ke **Midtrans Merchant Administration Portal (MAP)** dalam mode Production.
2. Buka menu **Settings** > **Access Keys**:
   * Salin **Client Key** ke `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
   * Salin **Server Key** ke `MIDTRANS_SERVER_KEY`.
   * Atur `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`.
3. Buka menu **Settings** > **Configuration**:
   * **Payment Notification URL**: Isi dengan `https://domain-kamu.com/api/midtrans/webhook`.
   * **Finish Redirect URL**: Isi dengan `https://domain-kamu.com/pesanan-saya`.
   * **Unfinish Redirect URL**: Isi dengan `https://domain-kamu.com/pesanan-saya`.
   * **Error Redirect URL**: Isi dengan `https://domain-kamu.com/pesanan-saya`.

---

## 5. Rekomendasi Header Keamanan & Content Security Policy (CSP)

Jika menambahkan header keamanan kustom pada `next.config.js` atau proxy server, pastikan domain berikut diizinkan:
* **Script (`script-src`)**: `'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com`
* **Koneksi (`connect-src`)**: `'self' https://*.supabase.co https://app.midtrans.com https://app.sandbox.midtrans.com https://nominatim.openstreetmap.org`
* **Gambar (`img-src`)**: `'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org`
* **Frame (`frame-src`)**: `'self' https://app.midtrans.com https://app.sandbox.midtrans.com`

---

## 6. Checklist Data Pra-Peluncuran (Pre-Launch Checklist)

Sebelum menerima pesanan riil dari pelanggan:
1. [ ] **Hapus Pesanan & Pembayaran Uji Coba**: Bersihkan transaksi uji coba dari tabel `pesanan`, `pembayaran`, `pesanan_item`, dan `pesanan_pilihan`.
2. [ ] **Konfigurasi Pengaturan Toko** (`/dashboard/pengaturan`):
   * Isi Nama Toko, Alamat Gerai, Nomor WhatsApp resmi kasir, dan Email.
   * Tentukan Jam Operasional Senin–Jumat dan Sabtu–Minggu.
   * Pin koordinat gerai toko di peta Leaflet dan perbarui radius pengantaran maksimal.
   * Tentukan tabel tarif jarak berundak (`tarif_jarak`) dan uji simulator jarak.
   * Periksa saklar transfer manual, nomor rekening bank, dan gambar QRIS.
3. [ ] **Periksa Akun Staf & Admin** (`/dashboard/akun`):
   * Pastikan kata sandi akun admin utama telah diubah dari bawaan seeder.
   * Daftarkan akun staf produksi dapur.
4. [ ] **Katalog & Stok Bahan Baku**:
   * Periksa produk katalog, harga, dan foto kue di `/dashboard/katalog-opsi`.
   * Periksa batas minimum stok bahan baku di `/dashboard/stok`.
5. [ ] **Uji Coba Alur Penuh**:
   * Buat 1 pesanan uji katalog dan 1 pesanan custom cake dari akun pelanggan.
   * Pastikan kalkulasi ongkir jarak berjalan akurat.
   * Uji alur pembayaran Snap Midtrans dan pengunggahan bukti transfer manual.
   * Uji transisi status di halaman antrean staf `/dashboard/hari-ini`.
