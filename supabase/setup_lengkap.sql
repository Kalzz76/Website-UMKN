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

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profil (id, nama, no_wa, role, aktif)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'no_wa', new.raw_user_meta_data->>'phone', ''),
    'pelanggan',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_kode_pesanan()
returns trigger as $$
begin
  if new.nomor is null then
    new.nomor := nextval('public.pesanan_nomor_seq');
  end if;
  if new.kode_pesanan is null or new.kode_pesanan = '' then
    new.kode_pesanan := 'KUE-' || lpad(new.nomor::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_pesanan_insert on public.pesanan;
create trigger on_pesanan_insert
  before insert on public.pesanan
  for each row execute procedure public.set_kode_pesanan();

insert into storage.buckets (id, name, public)
values
  ('referensi-kue', 'referensi-kue', false),
  ('bukti-bayar', 'bukti-bayar', false),
  ('publik', 'publik', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Akses publik untuk bucket publik" on storage.objects;
create policy "Akses publik untuk bucket publik"
on storage.objects for select
using (bucket_id = 'publik');

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profil
    where id = auth.uid() and role = 'admin' and aktif = true
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_staf_or_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profil
    where id = auth.uid() and role in ('admin', 'staf') and aktif = true
  );
end;
$$ language plpgsql security definer;

alter table public.profil enable row level security;

drop policy if exists "Profil dibaca pemilik atau staf admin" on public.profil;
create policy "Profil dibaca pemilik atau staf admin"
on public.profil for select
using (auth.uid() = id or public.is_staf_or_admin());

drop policy if exists "Profil diubah pemilik atau admin" on public.profil;
create policy "Profil diubah pemilik atau admin"
on public.profil for update
using (auth.uid() = id or public.is_admin());

alter table public.pengaturan_toko enable row level security;

drop policy if exists "Pengaturan toko dibaca publik" on public.pengaturan_toko;
create policy "Pengaturan toko dibaca publik"
on public.pengaturan_toko for select
using (true);

drop policy if exists "Pengaturan toko diubah admin" on public.pengaturan_toko;
create policy "Pengaturan toko diubah admin"
on public.pengaturan_toko for all
using (public.is_admin());

alter table public.grup_opsi enable row level security;

drop policy if exists "Grup opsi dibaca publik" on public.grup_opsi;
create policy "Grup opsi dibaca publik"
on public.grup_opsi for select
using (true);

drop policy if exists "Grup opsi dikelola admin" on public.grup_opsi;
create policy "Grup opsi dikelola admin"
on public.grup_opsi for all
using (public.is_admin());

alter table public.opsi_item enable row level security;

drop policy if exists "Opsi item aktif dibaca publik atau staf admin" on public.opsi_item;
create policy "Opsi item aktif dibaca publik atau staf admin"
on public.opsi_item for select
using (aktif = true or public.is_staf_or_admin());

drop policy if exists "Opsi item dikelola admin" on public.opsi_item;
create policy "Opsi item dikelola admin"
on public.opsi_item for all
using (public.is_admin());

alter table public.zona_ongkir enable row level security;

drop policy if exists "Zona ongkir aktif dibaca publik atau staf admin" on public.zona_ongkir;
create policy "Zona ongkir aktif dibaca publik atau staf admin"
on public.zona_ongkir for select
using (aktif = true or public.is_staf_or_admin());

drop policy if exists "Zona ongkir dikelola admin" on public.zona_ongkir;
create policy "Zona ongkir dikelola admin"
on public.zona_ongkir for all
using (public.is_admin());

alter table public.tanggal_tutup enable row level security;

drop policy if exists "Tanggal tutup dibaca publik" on public.tanggal_tutup;
create policy "Tanggal tutup dibaca publik"
on public.tanggal_tutup for select
using (true);

drop policy if exists "Tanggal tutup dikelola admin" on public.tanggal_tutup;
create policy "Tanggal tutup dikelola admin"
on public.tanggal_tutup for all
using (public.is_admin());

alter table public.pesanan enable row level security;

drop policy if exists "Pesanan dibaca pemilik atau staf admin" on public.pesanan;
create policy "Pesanan dibaca pemilik atau staf admin"
on public.pesanan for select
using (id_pelanggan = auth.uid() or public.is_staf_or_admin());

drop policy if exists "Pesanan dikelola staf admin" on public.pesanan;
create policy "Pesanan dikelola staf admin"
on public.pesanan for all
using (public.is_staf_or_admin());

alter table public.pesanan_pilihan enable row level security;

drop policy if exists "Pesanan pilihan dibaca pemilik atau staf admin" on public.pesanan_pilihan;
create policy "Pesanan pilihan dibaca pemilik atau staf admin"
on public.pesanan_pilihan for select
using (
  exists (
    select 1 from public.pesanan
    where pesanan.id = pesanan_pilihan.id_pesanan
    and (pesanan.id_pelanggan = auth.uid() or public.is_staf_or_admin())
  )
);

drop policy if exists "Pesanan pilihan dikelola staf admin" on public.pesanan_pilihan;
create policy "Pesanan pilihan dikelola staf admin"
on public.pesanan_pilihan for all
using (public.is_staf_or_admin());

alter table public.pembayaran enable row level security;

drop policy if exists "Pembayaran dibaca pemilik atau staf admin" on public.pembayaran;
create policy "Pembayaran dibaca pemilik atau staf admin"
on public.pembayaran for select
using (
  exists (
    select 1 from public.pesanan
    where pesanan.id = pembayaran.id_pesanan
    and (pesanan.id_pelanggan = auth.uid() or public.is_staf_or_admin())
  )
);

drop policy if exists "Pembayaran dikelola staf admin" on public.pembayaran;
create policy "Pembayaran dikelola staf admin"
on public.pembayaran for all
using (public.is_staf_or_admin());

alter table public.bahan enable row level security;

drop policy if exists "Bahan dibaca staf admin" on public.bahan;
create policy "Bahan dibaca staf admin"
on public.bahan for select
using (public.is_staf_or_admin());

drop policy if exists "Bahan dikelola staf admin" on public.bahan;
create policy "Bahan dikelola staf admin"
on public.bahan for all
using (public.is_staf_or_admin());

alter table public.riwayat_pesanan enable row level security;

drop policy if exists "Riwayat pesanan dibaca pemilik atau staf admin" on public.riwayat_pesanan;
create policy "Riwayat pesanan dibaca pemilik atau staf admin"
on public.riwayat_pesanan for select
using (
  exists (
    select 1 from public.pesanan
    where pesanan.id = riwayat_pesanan.id_pesanan
    and (pesanan.id_pelanggan = auth.uid() or public.is_staf_or_admin())
  )
);

drop policy if exists "Riwayat pesanan dikelola staf admin" on public.riwayat_pesanan;
create policy "Riwayat pesanan dikelola staf admin"
on public.riwayat_pesanan for all
using (public.is_staf_or_admin());

insert into public.pengaturan_toko (
  id,
  nama_toko,
  alamat,
  no_wa,
  jam_operasional,
  jam_buka,
  jam_tutup,
  kuota_harian,
  minimal_hari_pesan,
  mode_pembayaran,
  persen_dp,
  batas_bayar_jam,
  nama_bank,
  no_rekening,
  atas_nama,
  gambar_qris
) values (
  1,
  'Dapur Manis Custom Cake',
  'Jl. Melati No. 12, Jakarta Selatan',
  '081234567890',
  'Senin - Minggu: 08.00 - 20.00',
  '08:00',
  '20:00',
  5,
  2,
  'DP',
  50,
  24,
  'BCA',
  '1234567890',
  'Dapur Manis',
  null
) on conflict (id) do nothing;

insert into public.grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual)
values
  ('Ukuran', 1, true, 'satu', 'ukuran'),
  ('Rasa', 2, true, 'satu', 'badan'),
  ('Krim', 3, true, 'satu', 'krim'),
  ('Topping', 4, false, 'banyak', 'topping');

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Kecil (15 cm)', 80000, true, 1, null, 'kecil'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Sedang (20 cm)', 150000, true, 2, null, 'sedang'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Besar (25 cm)', 250000, true, 3, null, 'besar'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Coklat', 40000, true, 1, '#5c3a21', 'coklat'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Vanilla', 35000, true, 2, '#fbf0d9', 'vanilla'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Strawberry', 40000, true, 3, '#f472b6', 'strawberry'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Red Velvet', 45000, true, 4, '#991b1b', 'red_velvet'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Matcha', 45000, true, 5, '#4d7c0f', 'matcha'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Buttercream Putih', 20000, true, 1, '#ffffff', 'putih'
from public.grup_opsi where nama = 'Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Buttercream Pink', 25000, true, 2, '#fbcfe8', 'pink'
from public.grup_opsi where nama = 'Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Buttercream Coklat', 25000, true, 3, '#78350f', 'coklat'
from public.grup_opsi where nama = 'Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Cream Cheese', 30000, true, 4, '#fef3c7', 'cream_cheese'
from public.grup_opsi where nama = 'Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Strawberry Segar', 20000, true, 1, '#ef4444', 'strawberry'
from public.grup_opsi where nama = 'Topping';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Coklat Chip', 15000, true, 2, '#451a03', 'coklat_chip'
from public.grup_opsi where nama = 'Topping';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Aneka Buah', 25000, true, 3, '#f59e0b', 'buah'
from public.grup_opsi where nama = 'Topping';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lilin Ulang Tahun', 10000, true, 4, '#fbbf24', 'lilin'
from public.grup_opsi where nama = 'Topping';

insert into public.zona_ongkir (nama, tarif, aktif)
values
  ('Zona 1 (Radius 0 - 5 km)', 15000, true),
  ('Zona 2 (Radius 5 - 10 km)', 30000, true),
  ('Zona 3 (Radius 10 - 20 km)', 50000, true);

insert into public.bahan (nama, satuan, jumlah, batas_minimum)
values
  ('Tepung Terigu', 'kg', 50, 10),
  ('Telur Ayam', 'butir', 200, 30),
  ('Gula Pasir', 'kg', 40, 8),
  ('Mentega', 'kg', 25, 5),
  ('Coklat Bubuk', 'kg', 15, 3),
  ('Whipping Cream', 'liter', 20, 5),
  ('Strawberry Segar', 'kg', 10, 2);
