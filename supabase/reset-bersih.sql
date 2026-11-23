create sequence if not exists public.pesanan_nomor_seq;

create table if not exists public.profil (
  id uuid references auth.users(id) on delete cascade primary key,
  nama text not null,
  role text not null check (role in ('admin', 'petugas')),
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.pengaturan_toko (
  id bigint generated always as identity primary key,
  nama_toko text not null default 'Cravely Bakery',
  slogan text,
  alamat text not null default 'Alamat Toko',
  no_wa text not null default '081234567890',
  jam_operasional text not null default '08.00 - 20.00',
  jam_buka time not null default '08:00:00',
  jam_tutup time not null default '20:00:00',
  kuota_harian integer not null default 5,
  minimal_hari_pesan integer not null default 2,
  mode_pembayaran text not null check (mode_pembayaran in ('DP', 'Lunas')) default 'DP',
  persen_dp integer not null default 50,
  batas_bayar_jam integer not null default 24,
  nama_bank text,
  no_rekening text,
  atas_nama text,
  gambar_qris text,
  diperbarui_pada timestamptz not null default now()
);

create table if not exists public.grup_opsi (
  id bigint generated always as identity primary key,
  nama text not null,
  urutan integer not null default 0,
  wajib boolean not null default true,
  jenis_pilihan text not null check (jenis_pilihan in ('satu', 'banyak')) default 'satu',
  peran_visual text check (peran_visual in ('badan', 'ukuran', 'krim', 'topping', 'bentuk', 'stiker') or peran_visual is null),
  peran_dashboard text check (peran_dashboard in ('jenis', 'terlaris') or peran_dashboard is null)
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
  alasan text not null default 'Tutup Toko',
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.pesanan (
  id bigint generated always as identity primary key,
  kode_pesanan text not null unique,
  id_pelanggan uuid references auth.users(id) on delete set null,
  nama_penerima text not null,
  no_wa text not null,
  alamat text,
  id_zona_ongkir bigint references public.zona_ongkir(id) on delete set null,
  ongkir integer not null default 0,
  metode_pengiriman text not null check (metode_pengiriman in ('Ambil', 'Kirim')),
  tanggal_ambil date not null,
  jam_ambil time not null,
  tulisan_kue text,
  catatan text,
  foto_referensi text,
  foto_preview text,
  foto_bentuk_kustom text,
  foto_gambar_kustom text,
  desain_json jsonb,
  total_kue integer not null default 0,
  total_bayar integer not null default 0,
  jumlah_dp integer not null default 0,
  persen_dp_saat_pesan integer,
  status_pesanan text not null check (status_pesanan in ('Menunggu Pembayaran', 'Menunggu Konfirmasi', 'Diproses', 'Siap Diambil', 'Sedang Dikirim', 'Selesai', 'Dibatalkan')) default 'Menunggu Pembayaran',
  status_pembayaran text not null check (status_pembayaran in ('Belum Bayar', 'DP Terbayar', 'Lunas')) default 'Belum Bayar',
  batas_pembayaran timestamptz not null,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create table if not exists public.pesanan_pilihan (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  id_item bigint references public.opsi_item(id) on delete set null,
  id_grup bigint references public.grup_opsi(id) on delete set null,
  nama_grup text not null,
  nama_item text not null,
  harga integer not null default 0,
  jumlah integer not null default 1,
  warna text,
  kode_visual text,
  peran_visual text
);

create table if not exists public.pembayaran (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  metode text not null check (metode in ('Transfer Bank', 'QRIS')),
  tipe text not null check (tipe in ('DP', 'Pelunasan', 'Penuh')),
  jumlah integer not null default 0,
  bukti_transfer text,
  status text not null check (status in ('Menunggu Verifikasi', 'Diterima', 'Ditolak')) default 'Menunggu Verifikasi',
  catatan_petugas text,
  diverifikasi_oleh uuid references auth.users(id) on delete set null,
  dibuat_pada timestamptz not null default now(),
  dikonfirmasi_pada timestamptz
);

create table if not exists public.bahan (
  id bigint generated always as identity primary key,
  nama text not null,
  satuan text not null,
  jumlah numeric(12, 2) not null default 0,
  batas_minimum numeric(12, 2) not null default 0,
  diperbarui_pada timestamptz not null default now()
);

create table if not exists public.riwayat_pesanan (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  status text,
  keterangan text not null,
  dibuat_oleh uuid references auth.users(id) on delete set null,
  dibuat_pada timestamptz not null default now()
);

alter table public.grup_opsi add column if not exists peran_visual text;
alter table public.grup_opsi drop constraint if exists grup_opsi_peran_visual_check;
alter table public.grup_opsi add constraint grup_opsi_peran_visual_check check (peran_visual in ('badan', 'ukuran', 'krim', 'topping', 'bentuk', 'stiker') or peran_visual is null);

alter table public.grup_opsi add column if not exists peran_dashboard text;
alter table public.grup_opsi drop constraint if exists grup_opsi_peran_dashboard_check;
alter table public.grup_opsi add constraint grup_opsi_peran_dashboard_check check (peran_dashboard in ('jenis', 'terlaris') or peran_dashboard is null);

alter table public.pesanan_pilihan add column if not exists jumlah integer not null default 1;
alter table public.pesanan_pilihan add column if not exists id_grup bigint references public.grup_opsi(id) on delete set null;

alter table public.pesanan add column if not exists foto_preview text;
alter table public.pesanan add column if not exists foto_bentuk_kustom text;
alter table public.pesanan add column if not exists foto_gambar_kustom text;
alter table public.pesanan add column if not exists desain_json jsonb;

alter table public.pembayaran add column if not exists dikonfirmasi_pada timestamptz;

alter table public.pengaturan_toko add column if not exists slogan text;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  total_pengguna integer;
  role_baru text;
begin
  select count(*) into total_pengguna from public.profil;
  if total_pengguna = 0 then
    role_baru := 'admin';
  else
    role_baru := 'petugas';
  end if;

  insert into public.profil (id, nama, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(coalesce(new.email, 'Pengguna'), '@', 1)),
    role_baru
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_kode_pesanan()
returns trigger as $$
declare
  tgl text;
  seq integer;
begin
  if new.kode_pesanan is null or new.kode_pesanan = '' then
    tgl := to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD');
    seq := nextval('public.pesanan_nomor_seq');
    new.kode_pesanan := 'KUE-' || tgl || '-' || lpad((seq % 10000)::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_set_kode_pesanan on public.pesanan;
create trigger trigger_set_kode_pesanan
  before insert on public.pesanan
  for each row execute function public.set_kode_pesanan();

alter table public.profil enable row level security;
alter table public.pengaturan_toko enable row level security;
alter table public.grup_opsi enable row level security;
alter table public.opsi_item enable row level security;
alter table public.zona_ongkir enable row level security;
alter table public.tanggal_tutup enable row level security;
alter table public.pesanan enable row level security;
alter table public.pesanan_pilihan enable row level security;
alter table public.pembayaran enable row level security;
alter table public.bahan enable row level security;
alter table public.riwayat_pesanan enable row level security;

drop policy if exists "publik_baca_grup_opsi" on public.grup_opsi;
create policy "publik_baca_grup_opsi" on public.grup_opsi for select using (true);

drop policy if exists "publik_baca_opsi_item" on public.opsi_item;
create policy "publik_baca_opsi_item" on public.opsi_item for select using (aktif = true);

drop policy if exists "publik_baca_zona_ongkir" on public.zona_ongkir;
create policy "publik_baca_zona_ongkir" on public.zona_ongkir for select using (aktif = true);

drop policy if exists "publik_baca_tanggal_tutup" on public.tanggal_tutup;
create policy "publik_baca_tanggal_tutup" on public.tanggal_tutup for select using (true);

drop policy if exists "publik_baca_pengaturan_toko" on public.pengaturan_toko;
create policy "publik_baca_pengaturan_toko" on public.pengaturan_toko for select using (true);

insert into storage.buckets (id, name, public) values ('referensi-kue', 'referensi-kue', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('bukti-bayar', 'bukti-bayar', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('publik', 'publik', true) on conflict (id) do update set public = true;

drop policy if exists "Akses Publik Bucket Publik" on storage.objects;
create policy "Akses Publik Bucket Publik" on storage.objects for select using (bucket_id = 'publik');

begin;

create table if not exists public.cadangan_riwayat_pesanan_20261119 as select * from public.riwayat_pesanan;
create table if not exists public.cadangan_pembayaran_20261119 as select * from public.pembayaran;
create table if not exists public.cadangan_pesanan_pilihan_20261119 as select * from public.pesanan_pilihan;
create table if not exists public.cadangan_pesanan_20261119 as select * from public.pesanan;
create table if not exists public.cadangan_opsi_item_20261119 as select * from public.opsi_item;
create table if not exists public.cadangan_grup_opsi_20261119 as select * from public.grup_opsi;

delete from public.riwayat_pesanan;
delete from public.pembayaran;
delete from public.pesanan_pilihan;
delete from public.pesanan;
delete from public.opsi_item;
delete from public.grup_opsi;

alter sequence if exists public.pesanan_nomor_seq restart with 1;
alter table public.pesanan alter column id restart with 1;
alter table public.pesanan_pilihan alter column id restart with 1;
alter table public.pembayaran alter column id restart with 1;
alter table public.riwayat_pesanan alter column id restart with 1;
alter table public.grup_opsi alter column id restart with 1;
alter table public.opsi_item alter column id restart with 1;

commit;

insert into public.grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
values
  ('Jenis Kue', 1, true, 'satu', null, 'jenis'),
  ('Ukuran', 2, true, 'satu', 'ukuran', null),
  ('Bentuk', 3, true, 'satu', 'bentuk', null),
  ('Rasa', 4, true, 'satu', 'badan', 'terlaris'),
  ('Isian', 5, true, 'satu', null, null),
  ('Warna Krim', 6, true, 'satu', 'krim', null),
  ('Dekorasi', 7, false, 'banyak', 'topping', null),
  ('Elemen Hiasan', 8, false, 'banyak', 'stiker', null),
  ('Desain Kustom', 9, false, 'banyak', null, null);

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Custom Cake', 0, true, 1, null, 'custom' from public.grup_opsi where nama = 'Jenis Kue'
union all
select id, 'Template Siap Pakai', 0, true, 2, null, 'template' from public.grup_opsi where nama = 'Jenis Kue';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Mini 10', 85000, true, 1, null, 'mini' from public.grup_opsi where nama = 'Ukuran'
union all
select id, 'Small 14', 125000, true, 2, null, 'small' from public.grup_opsi where nama = 'Ukuran'
union all
select id, 'Medium 18', 165000, true, 3, null, 'medium' from public.grup_opsi where nama = 'Ukuran'
union all
select id, 'Large 22', 210000, true, 4, null, 'large' from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lingkaran', 0, true, 1, null, 'round' from public.grup_opsi where nama = 'Bentuk'
union all
select id, 'Kotak', 0, true, 2, null, 'square' from public.grup_opsi where nama = 'Bentuk'
union all
select id, 'Hati', 10000, true, 3, null, 'heart' from public.grup_opsi where nama = 'Bentuk'
union all
select id, 'Bintang', 15000, true, 4, null, 'star' from public.grup_opsi where nama = 'Bentuk'
union all
select id, 'Hexagon', 10000, true, 5, null, 'hex' from public.grup_opsi where nama = 'Bentuk'
union all
select id, 'Buat Sendiri', 25000, true, 6, null, 'custom' from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Vanilla', 0, true, 1, '#fbefd5', 'vanilla' from public.grup_opsi where nama = 'Rasa'
union all
select id, 'Cokelat', 10000, true, 2, '#8a5a3c', 'choco' from public.grup_opsi where nama = 'Rasa'
union all
select id, 'Red Velvet', 15000, true, 3, '#c0404e', 'velvet' from public.grup_opsi where nama = 'Rasa'
union all
select id, 'Stroberi', 10000, true, 4, '#f9cdd6', 'straw' from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Krim Vanilla', 0, true, 1, '#fffaf0', 'cream' from public.grup_opsi where nama = 'Isian'
union all
select id, 'Ganache Cokelat', 8000, true, 2, '#5b3322', 'ganache' from public.grup_opsi where nama = 'Isian'
union all
select id, 'Selai Stroberi', 5000, true, 3, '#d6304a', 'jam' from public.grup_opsi where nama = 'Isian'
union all
select id, 'Cream Cheese', 12000, true, 4, '#fff0c9', 'cheese' from public.grup_opsi where nama = 'Isian';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Pink', 0, true, 1, '#f6b4c2', 'pink' from public.grup_opsi where nama = 'Warna Krim'
union all
select id, 'Putih', 0, true, 2, '#FFF8F0', 'putih' from public.grup_opsi where nama = 'Warna Krim'
union all
select id, 'Cokelat', 0, true, 3, '#6b3d2a', 'coklat' from public.grup_opsi where nama = 'Warna Krim'
union all
select id, 'Mint', 0, true, 4, '#bfe8d8', 'mint' from public.grup_opsi where nama = 'Warna Krim'
union all
select id, 'Kuning', 0, true, 5, '#fbe39a', 'kuning' from public.grup_opsi where nama = 'Warna Krim'
union all
select id, 'Lavender', 0, true, 6, '#d8c7f0', 'lavender' from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lelehan Krim', 12000, true, 1, '#451a03', 'drip' from public.grup_opsi where nama = 'Dekorasi'
union all
select id, 'Stroberi', 10000, true, 2, '#ef4444', 'straw' from public.grup_opsi where nama = 'Dekorasi'
union all
select id, 'Mixed Berry', 15000, true, 3, '#4338ca', 'berry' from public.grup_opsi where nama = 'Dekorasi'
union all
select id, 'Bunga Gula', 8000, true, 4, '#f472b6', 'flower' from public.grup_opsi where nama = 'Dekorasi'
union all
select id, 'Taburan', 5000, true, 5, '#f59e0b', 'spr' from public.grup_opsi where nama = 'Dekorasi'
union all
select id, 'Lilin', 3000, true, 6, '#fbbf24', 'candle' from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Stiker', 3000, true, 1, null, 'stiker' from public.grup_opsi where nama = 'Elemen Hiasan'
union all
select id, 'Topper', 8000, true, 2, null, 'topper' from public.grup_opsi where nama = 'Elemen Hiasan'
union all
select id, 'Bunga', 2000, true, 3, null, 'bunga' from public.grup_opsi where nama = 'Elemen Hiasan'
union all
select id, 'Buah', 2500, true, 4, null, 'buah' from public.grup_opsi where nama = 'Elemen Hiasan'
union all
select id, 'Cokelat', 3000, true, 5, null, 'cokelat' from public.grup_opsi where nama = 'Elemen Hiasan';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Gambar Kustom', 15000, true, 1, null, 'gambar_kustom' from public.grup_opsi where nama = 'Desain Kustom';

insert into public.pengaturan_toko (
  id,
  nama_toko,
  slogan,
  alamat,
  no_wa,
  jam_operasional,
  jam_buka,
  jam_tutup,
  kuota_harian,
  minimal_hari_pesan,
  mode_pembayaran,
  persen_dp,
  batas_bayar_jam
) values (
  1,
  'Cravely Bakery',
  'Buat hari lebih manis dengan kue terbaik kami ♡',
  'Toko Cravely Bakery',
  '081234567890',
  '08.00 - 20.00',
  '08:00:00',
  '20:00:00',
  5,
  2,
  'DP',
  50,
  24
)
on conflict (id) do update set
  nama_toko = excluded.nama_toko,
  slogan = excluded.slogan;
