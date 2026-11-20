insert into public.bahan (nama, satuan, jumlah, batas_minimum)
select v.nama, v.satuan, v.jumlah, v.batas_minimum
from (values
  ('Tepung Terigu', 'kg', 0, 10),
  ('Telur Ayam', 'butir', 0, 30),
  ('Gula Pasir', 'kg', 0, 8),
  ('Mentega', 'kg', 0, 5),
  ('Coklat Bubuk', 'kg', 0, 3),
  ('Whipping Cream', 'liter', 0, 5),
  ('Strawberry Segar', 'kg', 0, 2),
  ('Susu Cair', 'ml', 0, 1000),
  ('Kotak Kue', 'buah', 0, 10),
  ('Pewarna Makanan', 'ml', 0, 50),
  ('Selai Stroberi', 'g', 0, 500),
  ('Cokelat Batang', 'g', 0, 500),
  ('Cream Cheese', 'g', 0, 500),
  ('Buah Beri', 'g', 0, 300),
  ('Fondant', 'g', 0, 300),
  ('Taburan', 'g', 0, 200),
  ('Lilin', 'set', 0, 10)
) as v(nama, satuan, jumlah, batas_minimum)
where not exists (
  select 1 from public.bahan b
  where lower(b.nama) = lower(v.nama)
     or (v.nama = 'Telur Ayam' and lower(b.nama) in ('telur', 'telur ayam'))
     or (v.nama = 'Coklat Bubuk' and lower(b.nama) in ('coklat bubuk', 'cokelat bubuk'))
     or (v.nama = 'Whipping Cream' and lower(b.nama) in ('whipping cream', 'krim kocok'))
     or (v.nama = 'Strawberry Segar' and lower(b.nama) in ('strawberry segar', 'stroberi segar'))
);

with data_resep(nama_grup, kode_visual, nama_bahan, jumlah_asal, satuan_asal) as (
  values
    ('Ukuran', 'mini', 'Tepung Terigu', 60, 'g'),
    ('Ukuran', 'mini', 'Gula Pasir', 45, 'g'),
    ('Ukuran', 'mini', 'Telur', 1, 'butir'),
    ('Ukuran', 'mini', 'Mentega', 45, 'g'),
    ('Ukuran', 'mini', 'Susu Cair', 30, 'ml'),
    ('Ukuran', 'mini', 'Krim Kocok', 100, 'ml'),
    ('Ukuran', 'mini', 'Kotak Kue', 1, 'buah'),

    ('Ukuran', 'small', 'Tepung Terigu', 120, 'g'),
    ('Ukuran', 'small', 'Gula Pasir', 90, 'g'),
    ('Ukuran', 'small', 'Telur', 2, 'butir'),
    ('Ukuran', 'small', 'Mentega', 90, 'g'),
    ('Ukuran', 'small', 'Susu Cair', 60, 'ml'),
    ('Ukuran', 'small', 'Krim Kocok', 180, 'ml'),
    ('Ukuran', 'small', 'Kotak Kue', 1, 'buah'),

    ('Ukuran', 'medium', 'Tepung Terigu', 200, 'g'),
    ('Ukuran', 'medium', 'Gula Pasir', 150, 'g'),
    ('Ukuran', 'medium', 'Telur', 4, 'butir'),
    ('Ukuran', 'medium', 'Mentega', 150, 'g'),
    ('Ukuran', 'medium', 'Susu Cair', 100, 'ml'),
    ('Ukuran', 'medium', 'Krim Kocok', 300, 'ml'),
    ('Ukuran', 'medium', 'Kotak Kue', 1, 'buah'),

    ('Ukuran', 'large', 'Tepung Terigu', 300, 'g'),
    ('Ukuran', 'large', 'Gula Pasir', 225, 'g'),
    ('Ukuran', 'large', 'Telur', 6, 'butir'),
    ('Ukuran', 'large', 'Mentega', 225, 'g'),
    ('Ukuran', 'large', 'Susu Cair', 150, 'ml'),
    ('Ukuran', 'large', 'Krim Kocok', 450, 'ml'),
    ('Ukuran', 'large', 'Kotak Kue', 1, 'buah'),

    ('Rasa', 'choco', 'Cokelat Bubuk', 60, 'g'),
    ('Rasa', 'velvet', 'Cokelat Bubuk', 15, 'g'),
    ('Rasa', 'velvet', 'Pewarna Makanan', 10, 'ml'),
    ('Rasa', 'straw', 'Selai Stroberi', 60, 'g'),

    ('Isian', 'ganache', 'Cokelat Batang', 100, 'g'),
    ('Isian', 'ganache', 'Krim Kocok', 100, 'ml'),
    ('Isian', 'jam', 'Selai Stroberi', 80, 'g'),
    ('Isian', 'cheese', 'Cream Cheese', 120, 'g'),
    ('Isian', 'cheese', 'Gula Pasir', 20, 'g'),

    ('Warna Krim', 'pink', 'Pewarna Makanan', 2, 'ml'),
    ('Warna Krim', 'mint', 'Pewarna Makanan', 2, 'ml'),
    ('Warna Krim', 'kuning', 'Pewarna Makanan', 2, 'ml'),
    ('Warna Krim', 'lavender', 'Pewarna Makanan', 2, 'ml'),
    ('Warna Krim', 'coklat', 'Cokelat Bubuk', 20, 'g'),

    ('Dekorasi', 'drip', 'Cokelat Batang', 60, 'g'),
    ('Dekorasi', 'drip', 'Krim Kocok', 60, 'ml'),
    ('Dekorasi', 'straw', 'Stroberi Segar', 100, 'g'),
    ('Dekorasi', 'berry', 'Buah Beri', 100, 'g'),
    ('Dekorasi', 'flower', 'Fondant', 40, 'g'),
    ('Dekorasi', 'spr', 'Taburan', 15, 'g'),
    ('Dekorasi', 'candle', 'Lilin', 1, 'set'),

    ('Elemen Hiasan', 'bunga', 'Fondant', 15, 'g'),
    ('Elemen Hiasan', 'buah', 'Stroberi Segar', 30, 'g'),
    ('Elemen Hiasan', 'cokelat', 'Cokelat Batang', 20, 'g')
)
insert into public.resep_item (id_item, id_bahan, jumlah)
select
  oi.id as id_item,
  b.id as id_bahan,
  case
    when lower(b.satuan) = 'kg' and d.satuan_asal = 'g' then round((d.jumlah_asal / 1000.0)::numeric, 4)
    when lower(b.satuan) = 'liter' and d.satuan_asal = 'ml' then round((d.jumlah_asal / 1000.0)::numeric, 4)
    else d.jumlah_asal::numeric
  end as jumlah
from data_resep d
join lateral (
  select oi.id
  from public.opsi_item oi
  join public.grup_opsi go on go.id = oi.id_grup
  where lower(go.nama) = lower(d.nama_grup)
    and oi.kode_visual = d.kode_visual
    and oi.aktif = true
  order by oi.id asc
  limit 1
) oi on true
join lateral (
  select b.id, b.satuan
  from public.bahan b
  where lower(b.nama) = lower(d.nama_bahan)
     or (d.nama_bahan = 'Telur' and lower(b.nama) in ('telur ayam', 'telur'))
     or (d.nama_bahan = 'Cokelat Bubuk' and lower(b.nama) in ('coklat bubuk', 'cokelat bubuk'))
     or (d.nama_bahan = 'Krim Kocok' and lower(b.nama) in ('whipping cream', 'krim kocok'))
     or (d.nama_bahan = 'Stroberi Segar' and lower(b.nama) in ('strawberry segar', 'stroberi segar'))
  order by (case when lower(b.nama) = lower(d.nama_bahan) then 0 else 1 end) asc
  limit 1
) b on true
on conflict (id_item, id_bahan) do update set jumlah = excluded.jumlah;

update public.pesanan_pilihan pp
set id_item = oi.id
from public.opsi_item oi
join public.grup_opsi go on go.id = oi.id_grup
where pp.id_item is null
  and lower(trim(pp.nama_grup)) = lower(trim(go.nama))
  and (
    (pp.kode_visual is not null and pp.kode_visual <> '' and lower(trim(pp.kode_visual)) = lower(trim(oi.kode_visual)))
    or lower(trim(pp.nama_item)) = lower(trim(oi.nama))
  );
