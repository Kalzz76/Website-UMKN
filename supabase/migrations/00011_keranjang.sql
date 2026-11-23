create table if not exists public.produk (
  id bigint generated always as identity primary key,
  nama text not null,
  deskripsi text not null default '',
  harga integer not null default 0,
  foto text,
  aktif boolean not null default true,
  urutan integer not null default 0,
  dibuat_pada timestamptz not null default now()
);

alter table public.produk enable row level security;

drop policy if exists "Publik baca produk aktif" on public.produk;
create policy "Publik baca produk aktif"
on public.produk for select
using (aktif = true);

drop policy if exists "Admin staf kelola produk" on public.produk;
create policy "Admin staf kelola produk"
on public.produk for all
using (
  exists (
    select 1 from public.profil
    where id = auth.uid() and role in ('admin', 'staf')
  )
);

create table if not exists public.keranjang_item (
  id bigint generated always as identity primary key,
  id_pelanggan uuid not null references public.profil(id) on delete cascade,
  jenis text not null check (jenis in ('Custom', 'Siap')),
  id_produk bigint references public.produk(id) on delete cascade,
  jumlah integer not null default 1 check (jumlah >= 1 and jumlah <= 20),
  pilihan jsonb default '[]'::jsonb,
  tulisan_kue text default '',
  catatan text default '',
  desain_json jsonb,
  foto_preview text,
  foto_bentuk_kustom text,
  foto_gambar_kustom text,
  dibuat_pada timestamptz not null default now(),
  constraint keranjang_item_aturan_jenis_check check (
    (jenis = 'Siap' and id_produk is not null) or
    (jenis = 'Custom' and pilihan is not null and jumlah = 1)
  )
);

create index if not exists idx_keranjang_item_pelanggan on public.keranjang_item(id_pelanggan);

alter table public.keranjang_item enable row level security;

drop policy if exists "Pelanggan baca keranjang sendiri" on public.keranjang_item;
create policy "Pelanggan baca keranjang sendiri"
on public.keranjang_item for select
using (auth.uid() = id_pelanggan);

drop policy if exists "Pelanggan hapus keranjang sendiri" on public.keranjang_item;
create policy "Pelanggan hapus keranjang sendiri"
on public.keranjang_item for delete
using (auth.uid() = id_pelanggan);

create table if not exists public.pesanan_item (
  id bigint generated always as identity primary key,
  id_pesanan bigint not null references public.pesanan(id) on delete cascade,
  jenis text not null check (jenis in ('Custom', 'Siap')),
  id_produk bigint references public.produk(id) on delete set null,
  nama_item text not null,
  harga_satuan integer not null default 0,
  jumlah integer not null default 1,
  subtotal integer not null default 0,
  tulisan_kue text default '',
  catatan text default '',
  desain_json jsonb,
  foto_preview text,
  foto_bentuk_kustom text,
  foto_gambar_kustom text,
  urutan integer not null default 0
);

create index if not exists idx_pesanan_item_pesanan on public.pesanan_item(id_pesanan);

alter table public.pesanan_item enable row level security;

drop policy if exists "Pelanggan baca pesanan_item sendiri" on public.pesanan_item;
create policy "Pelanggan baca pesanan_item sendiri"
on public.pesanan_item for select
using (
  exists (
    select 1 from public.pesanan p
    where p.id = pesanan_item.id_pesanan and (
      p.id_pelanggan = auth.uid() or exists (
        select 1 from public.profil pr
        where pr.id = auth.uid() and pr.role in ('admin', 'staf')
      )
    )
  )
);

alter table public.pesanan_pilihan add column if not exists id_pesanan_item bigint references public.pesanan_item(id) on delete cascade;

alter table public.pengaturan_toko add column if not exists minimal_hari_siap integer not null default 1;

create or replace function public.bersihkan_keranjang(p_hari integer default 30)
returns table (
  foto_preview text,
  foto_bentuk_kustom text,
  foto_gambar_kustom text
)
language plpgsql
security definer
as $$
begin
  return query
  delete from public.keranjang_item
  where dibuat_pada < now() - (p_hari || ' days')::interval
  returning
    public.keranjang_item.foto_preview,
    public.keranjang_item.foto_bentuk_kustom,
    public.keranjang_item.foto_gambar_kustom;
end;
$$;

revoke all on function public.bersihkan_keranjang(integer) from public;
grant execute on function public.bersihkan_keranjang(integer) to service_role;

insert into public.produk (nama, deskripsi, harga, foto, aktif, urutan)
values
  ('Strawberry Shortcake', 'Sponge cake vanilla super lembut dengan chantilly cream manis segar dan stroberi Lembang pilihan.', 110000, 'strawberry_shortcake.jpg', true, 1),
  ('Chocolate Fudge Cake', 'Cokelat Belgia 70% intens dengan ganache lumer berkilau, tekstur fudgy pekat yang meleleh di lidah.', 120000, 'chocolate_fudge_cake.jpg', true, 2),
  ('Red Velvet Rose Cake', 'Red velvet klasik berpadu frosting cream cheese New Zealand yang gurih asam seimbang berhias kelopak mawar.', 125000, 'red_velvet_rose_cake.jpg', true, 3),
  ('Vintage Coquette Cake', 'Kue piping pita Lambeth estetik dengan buttercream mawar ringan, mutiara gula mutiara dan taburan edible glitter.', 110000, 'vintage_coquette_cake.jpg', true, 4),
  ('Vanilla Bliss Earl Grey', 'Infusi seduhan daun teh Earl Grey bergamot dengan krim vanila Madagaskar dan taburan bunga mawar kering.', 100000, 'vanilla_bliss_earlgrey.jpg', true, 5),
  ('Tiramisu Pandan Suji', 'Perpaduan unik mascarpone cream khas Italia dengan chiffon pandan suji asli dari kebun lokal Jawa Barat.', 120000, 'tiramisu_pandan_suji.jpg', true, 6),
  ('Berry Peach Cupcake', 'Cupcake mentega lembut dengan mahkota krim keju, potongan buah persik manis dan buah berry segar.', 45000, 'berry_peach_cupcake.jpg', true, 7),
  ('Cinnamon Mint Cupcake', 'Aroma hangat kayu manis asli berpadu kesegaran mint alami, tekstur basah legit yang harum memikat.', 45000, 'cinnamon_mint_cupcake.jpg', true, 8),
  ('The Rose Garden Tart', 'Kulit pie almond renyah dipadu custard mawar lembut dan tatanan aneka buah berry segar bermandikan madu.', 135000, 'the_rose_garden_tart.jpg', true, 9),
  ('Choco Butter Cookies Box', 'Kue kering butter Wijsman berpadu choco chips leleh, renyah rekah di luar dan gurih wangi mentega asli.', 65000, 'choco_butter_cookies_box.jpg', true, 10),
  ('Artisan Brioche & Roti Manis', 'Roti brioche kaya telur dan mentega Prancis, dipanggang hangat segar setiap pukul 7 pagi di dapur kami.', 38000, 'artisan_brioche_roti_manis.jpg', true, 11),
  ('Sundae Berry & Glazed Donuts', 'Paket donat kentang glaze mawar merah muda ditemani es krim strawberry sundae segar dan cherry maraschino.', 55000, 'sundae_berry_glazed_donuts.jpg', true, 12)
on conflict do nothing;
