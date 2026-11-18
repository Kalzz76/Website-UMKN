create table if not exists public.profil (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  no_wa text not null default '',
  role text not null default 'pelanggan' check (role in ('admin', 'staf', 'pelanggan')),
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.pengaturan_toko (
  id bigint primary key default 1 check (id = 1),
  nama_toko text not null default '',
  alamat text not null default '',
  no_wa text not null default '',
  jam_operasional text not null default '',
  jam_buka time not null default '08:00',
  jam_tutup time not null default '20:00',
  kuota_harian integer not null default 5,
  minimal_hari_pesan integer not null default 2,
  mode_pembayaran text not null default 'DP' check (mode_pembayaran in ('DP', 'Lunas')),
  persen_dp integer not null default 50,
  batas_bayar_jam integer not null default 24,
  nama_bank text not null default '',
  no_rekening text not null default '',
  atas_nama text not null default '',
  gambar_qris text
);

create table if not exists public.grup_opsi (
  id bigint generated always as identity primary key,
  nama text not null,
  urutan integer not null default 0,
  wajib boolean not null default false,
  jenis_pilihan text not null default 'satu' check (jenis_pilihan in ('satu', 'banyak')),
  peran_visual text check (peran_visual in ('badan', 'ukuran', 'krim', 'topping') or peran_visual is null)
);

create table if not exists public.opsi_item (
  id bigint generated always as identity primary key,
  id_grup bigint not null references public.grup_opsi(id) on delete cascade,
  nama text not null,
  harga integer not null default 0,
  aktif boolean not null default true,
  urutan integer not null default 0,
  warna text,
  kode_visual text
);

create table if not exists public.zona_ongkir (
  id bigint generated always as identity primary key,
  nama text not null,
  tarif integer not null default 0,
  aktif boolean not null default true
);

create table if not exists public.tanggal_tutup (
  id bigint generated always as identity primary key,
  tanggal date not null unique,
  alasan text not null default ''
);

create sequence if not exists public.pesanan_nomor_seq;

create table if not exists public.pesanan (
  id bigint generated always as identity primary key,
  nomor bigint not null default nextval('public.pesanan_nomor_seq') unique,
  kode_pesanan text unique,
  id_pelanggan uuid references public.profil(id) on delete set null,
  nama_penerima text not null,
  no_wa text not null,
  tulisan_kue text,
  catatan text,
  foto_referensi text,
  tanggal_ambil date not null,
  jam_ambil time not null,
  metode_pengiriman text not null check (metode_pengiriman in ('Ambil', 'Kirim')),
  alamat text,
  id_zona bigint references public.zona_ongkir(id) on delete set null,
  ongkir integer not null default 0,
  total_kue integer not null default 0,
  total_bayar integer not null default 0,
  persen_dp_saat_pesan integer,
  jumlah_dp integer not null default 0,
  jumlah_terbayar integer not null default 0,
  status_pesanan text not null default 'Menunggu Pembayaran' check (status_pesanan in ('Menunggu Pembayaran', 'Diterima', 'Sedang Dibuat', 'Siap', 'Dikirim', 'Selesai', 'Dibatalkan')),
  status_bayar text not null default 'Belum Bayar' check (status_bayar in ('Belum Bayar', 'DP Dibayar', 'Lunas')),
  alasan_batal text,
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.pesanan_pilihan (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  nama_grup text not null,
  nama_item text not null,
  harga integer not null default 0,
  warna text,
  kode_visual text,
  peran_visual text
);

create table if not exists public.pembayaran (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  jenis text not null check (jenis in ('DP', 'Pelunasan', 'Lunas')),
  jumlah integer not null default 0,
  metode text not null check (metode in ('Transfer Bank', 'QRIS', 'Tunai di Tempat')),
  bukti text,
  status text not null default 'Menunggu Konfirmasi' check (status in ('Menunggu Konfirmasi', 'Dikonfirmasi', 'Ditolak')),
  id_pengonfirmasi uuid references public.profil(id) on delete set null,
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.bahan (
  id bigint generated always as identity primary key,
  nama text not null,
  satuan text not null,
  jumlah numeric not null default 0,
  batas_minimum numeric not null default 0
);

create table if not exists public.riwayat_pesanan (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  keterangan text not null,
  id_user uuid references public.profil(id) on delete set null,
  dibuat_pada timestamptz not null default now()
);
