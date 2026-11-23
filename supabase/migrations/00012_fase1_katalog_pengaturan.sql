create table if not exists public.kategori_produk (
  id bigint generated always as identity primary key,
  nama text not null unique,
  urutan integer not null default 0,
  aktif boolean not null default true
);

alter table public.kategori_produk enable row level security;

drop policy if exists "Publik baca kategori aktif" on public.kategori_produk;
create policy "Publik baca kategori aktif"
on public.kategori_produk for select
using (aktif = true);

drop policy if exists "Admin staf kelola kategori" on public.kategori_produk;
create policy "Admin staf kelola kategori"
on public.kategori_produk for all
using (
  exists (
    select 1 from public.profil
    where id = auth.uid() and role in ('admin', 'staf')
  )
);

insert into public.kategori_produk (nama, urutan, aktif)
values
  ('Kue Ulang Tahun', 1, true),
  ('Kue Tart', 2, true),
  ('Cupcake', 3, true),
  ('Cookies', 4, true),
  ('Roti Manis', 5, true)
on conflict (nama) do nothing;

alter table public.produk add column if not exists id_kategori bigint references public.kategori_produk(id) on delete set null;
alter table public.produk add column if not exists komposisi text not null default '';
alter table public.produk add column if not exists porsi text not null default '';
alter table public.produk add column if not exists label_teks text not null default '';
alter table public.produk add column if not exists unggulan boolean not null default false;

do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'produk' and column_name = 'kategori'
  ) then
    insert into public.kategori_produk (nama, urutan, aktif)
    select distinct trim(kategori), 10, true
    from public.produk
    where kategori is not null and trim(kategori) <> ''
    on conflict (nama) do nothing;

    update public.produk p
    set id_kategori = kp.id
    from public.kategori_produk kp
    where p.id_kategori is null and p.kategori is not null and trim(p.kategori) = kp.nama;
  end if;
end $$;

alter table public.keranjang_item drop constraint if exists keranjang_item_jenis_check;
alter table public.keranjang_item drop constraint if exists keranjang_item_aturan_jenis_check;

update public.keranjang_item set jenis = 'Katalog' where jenis = 'Siap';

alter table public.keranjang_item add constraint keranjang_item_jenis_check check (jenis in ('Custom', 'Katalog'));
alter table public.keranjang_item add constraint keranjang_item_aturan_jenis_check check (
  (jenis = 'Katalog' and id_produk is not null) or
  (jenis = 'Custom' and pilihan is not null and jumlah = 1)
);

alter table public.pesanan_item drop constraint if exists pesanan_item_jenis_check;

update public.pesanan_item set jenis = 'Katalog' where jenis = 'Siap';

alter table public.pesanan_item add constraint pesanan_item_jenis_check check (jenis in ('Custom', 'Katalog'));

do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'pengaturan_toko' and column_name = 'minimal_hari_siap'
  ) and not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'pengaturan_toko' and column_name = 'minimal_hari_katalog'
  ) then
    alter table public.pengaturan_toko rename column minimal_hari_siap to minimal_hari_katalog;
  else
    alter table public.pengaturan_toko add column if not exists minimal_hari_katalog integer not null default 1;
  end if;
end $$;

alter table public.pengaturan_toko add column if not exists jam_buka_senin_jumat time;
alter table public.pengaturan_toko add column if not exists jam_tutup_senin_jumat time;
alter table public.pengaturan_toko add column if not exists jam_buka_sabtu_minggu time;
alter table public.pengaturan_toko add column if not exists jam_tutup_sabtu_minggu time;

update public.pengaturan_toko
set
  jam_buka_senin_jumat = coalesce(jam_buka_senin_jumat, jam_buka, '08:00'),
  jam_tutup_senin_jumat = coalesce(jam_tutup_senin_jumat, jam_tutup, '20:00'),
  jam_buka_sabtu_minggu = coalesce(jam_buka_sabtu_minggu, jam_buka, '08:00'),
  jam_tutup_sabtu_minggu = coalesce(jam_tutup_sabtu_minggu, jam_tutup, '20:00')
where id = 1;

alter table public.pengaturan_toko alter column jam_buka_senin_jumat set default '08:00';
alter table public.pengaturan_toko alter column jam_tutup_senin_jumat set default '20:00';
alter table public.pengaturan_toko alter column jam_buka_sabtu_minggu set default '08:00';
alter table public.pengaturan_toko alter column jam_tutup_sabtu_minggu set default '20:00';

alter table public.pengaturan_toko add column if not exists email text not null default '';
alter table public.pengaturan_toko add column if not exists instagram text not null default '';
alter table public.pengaturan_toko add column if not exists tautan_peta text not null default '';
alter table public.pengaturan_toko add column if not exists deskripsi_footer text not null default '';

alter table public.pengaturan_toko add column if not exists lat_toko numeric;
alter table public.pengaturan_toko add column if not exists lng_toko numeric;
alter table public.pengaturan_toko add column if not exists faktor_jalan numeric not null default 1.3 check (faktor_jalan >= 1);
alter table public.pengaturan_toko add column if not exists maks_jarak_kirim_km numeric not null default 20 check (maks_jarak_kirim_km > 0);

create table if not exists public.tarif_jarak (
  id bigint generated always as identity primary key,
  jarak_maks_km numeric not null check (jarak_maks_km > 0) unique,
  tarif integer not null check (tarif >= 0),
  aktif boolean not null default true
);

alter table public.tarif_jarak enable row level security;

drop policy if exists "Publik baca tarif jarak aktif" on public.tarif_jarak;
create policy "Publik baca tarif jarak aktif"
on public.tarif_jarak for select
using (aktif = true);

drop policy if exists "Admin staf kelola tarif jarak" on public.tarif_jarak;
create policy "Admin staf kelola tarif jarak"
on public.tarif_jarak for all
using (
  exists (
    select 1 from public.profil
    where id = auth.uid() and role in ('admin', 'staf')
  )
);

insert into public.tarif_jarak (jarak_maks_km, tarif, aktif)
values
  (5, 10000, true),
  (10, 20000, true),
  (15, 30000, true),
  (20, 40000, true)
on conflict (jarak_maks_km) do nothing;

alter table public.pesanan add column if not exists lat_tujuan numeric;
alter table public.pesanan add column if not exists lng_tujuan numeric;
alter table public.pesanan add column if not exists jarak_km numeric;
