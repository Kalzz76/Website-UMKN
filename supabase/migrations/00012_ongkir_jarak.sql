create table if not exists public.tarif_jarak (
  id bigint generated always as identity primary key,
  jarak_maks_km numeric not null check (jarak_maks_km > 0),
  tarif integer not null check (tarif >= 0),
  aktif boolean not null default true,
  constraint tarif_jarak_jarak_maks_km_unique unique (jarak_maks_km)
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

alter table public.pengaturan_toko add column if not exists lat_toko numeric;
alter table public.pengaturan_toko add column if not exists lng_toko numeric;
alter table public.pengaturan_toko add column if not exists faktor_jalan numeric not null default 1.3;
alter table public.pengaturan_toko add column if not exists maks_jarak_kirim_km numeric default 20;

alter table public.pengaturan_toko drop constraint if exists pengaturan_toko_faktor_jalan_check;
alter table public.pengaturan_toko add constraint pengaturan_toko_faktor_jalan_check check (faktor_jalan >= 1);

alter table public.pesanan add column if not exists lat_tujuan numeric;
alter table public.pesanan add column if not exists lng_tujuan numeric;
alter table public.pesanan add column if not exists jarak_km numeric;

insert into public.tarif_jarak (jarak_maks_km, tarif, aktif)
values
  (5, 10000, true),
  (10, 20000, true),
  (15, 30000, true),
  (20, 40000, true)
on conflict (jarak_maks_km) do update set
  tarif = excluded.tarif,
  aktif = excluded.aktif;
