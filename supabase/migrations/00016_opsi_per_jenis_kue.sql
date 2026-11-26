update public.opsi_item
set aktif = false
where id_grup in (select id from public.grup_opsi where nama = 'Jenis Kue')
  and kode_visual in ('custom', 'template');

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select g.id, v.nama, v.harga, true, v.urutan, v.warna, v.kode_visual
from public.grup_opsi g
cross join (
  values
    ('Kue Ultah', 130000, 1, '#9E3B42', 'cake'),
    ('Cupcake', 15000, 2, '#C88235', 'cupcake'),
    ('Kue Pie', 60000, 3, '#DCA052', 'tart'),
    ('Donat', 15000, 4, '#CA7C30', 'donut'),
    ('Cookies', 18000, 5, '#A26829', 'cookies')
) as v(nama, harga, urutan, warna, kode_visual)
where g.nama = 'Jenis Kue'
  and not exists (
    select 1 from public.opsi_item oi
    where oi.id_grup = g.id and oi.kode_visual = v.kode_visual
  );

update public.opsi_item oi
set harga = v.harga
from (
  values
    ('Ukuran', 'mini', 0),
    ('Ukuran', 'small', 40000),
    ('Ukuran', 'medium', 80000),
    ('Ukuran', 'large', 125000)
) as v(nama_grup, kode_visual, harga)
join public.grup_opsi g on lower(g.nama) = lower(v.nama_grup)
where oi.id_grup = g.id and oi.kode_visual = v.kode_visual;

insert into public.grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select v.nama, v.urutan, v.wajib, v.jenis_pilihan, v.peran_visual, null
from (
  values
    ('Porsi Cupcake', 10, true, 'satu', 'ukuran'),
    ('Rasa Muffin', 11, true, 'satu', 'badan'),
    ('Topping & Krim', 12, false, 'banyak', 'topping'),
    ('Ukuran Tart', 13, true, 'satu', 'ukuran'),
    ('Rasa Custard', 14, true, 'satu', 'badan'),
    ('Topping Buah', 15, false, 'banyak', 'topping'),
    ('Jumlah Donat', 16, true, 'satu', 'ukuran'),
    ('Rasa Adonan', 17, true, 'satu', 'badan'),
    ('Glaze & Topping', 18, false, 'banyak', 'topping'),
    ('Jumlah Cookies', 19, true, 'satu', 'ukuran'),
    ('Varian Rasa', 20, true, 'satu', 'badan'),
    ('Topping & Extra', 21, false, 'banyak', 'topping')
) as v(nama, urutan, wajib, jenis_pilihan, peran_visual)
where not exists (
  select 1 from public.grup_opsi go where lower(go.nama) = lower(v.nama)
);

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select g.id, v.nama, v.harga, true, v.urutan, v.warna, v.kode_visual
from (
  values
    ('Porsi Cupcake', 'Satuan (1 Pcs)', 0, 1, null, 'mini'),
    ('Porsi Cupcake', 'Paket 2 Pcs', 13000, 2, null, 'small'),
    ('Porsi Cupcake', 'Box 4 Pcs', 40000, 3, null, 'medium'),
    ('Porsi Cupcake', 'Box 6 Pcs', 65000, 4, null, 'large'),

    ('Rasa Muffin', 'Vanilla', 0, 1, '#fbefd5', 'vanilla'),
    ('Rasa Muffin', 'Cokelat', 3000, 2, '#8a5a3c', 'choco'),
    ('Rasa Muffin', 'Red Velvet', 5000, 3, '#c0404e', 'velvet'),
    ('Rasa Muffin', 'Stroberi', 3000, 4, '#f9cdd6', 'straw'),

    ('Topping & Krim', 'Lelehan Krim', 4000, 1, '#451a03', 'drip'),
    ('Topping & Krim', 'Stroberi', 5000, 2, '#ef4444', 'straw'),
    ('Topping & Krim', 'Mixed Berry', 7000, 3, '#4338ca', 'berry'),
    ('Topping & Krim', 'Bunga Gula', 4000, 4, '#f472b6', 'flower'),
    ('Topping & Krim', 'Taburan', 3000, 5, '#f59e0b', 'spr'),

    ('Ukuran Tart', 'Mini Tart (Ø8 cm)', 0, 1, null, 'mini'),
    ('Ukuran Tart', 'Medium Tart (Ø14 cm)', 35000, 2, null, 'small'),
    ('Ukuran Tart', 'Large Tart (Ø18 cm)', 70000, 3, null, 'medium'),
    ('Ukuran Tart', 'Party Tart (Ø22 cm)', 115000, 4, null, 'large'),

    ('Rasa Custard', 'Vanilla', 0, 1, '#fbefd5', 'vanilla'),
    ('Rasa Custard', 'Cokelat', 8000, 2, '#8a5a3c', 'choco'),
    ('Rasa Custard', 'Red Velvet', 10000, 3, '#c0404e', 'velvet'),
    ('Rasa Custard', 'Stroberi', 8000, 4, '#f9cdd6', 'straw'),

    ('Topping Buah', 'Lelehan Cokelat', 8000, 1, '#451a03', 'drip'),
    ('Topping Buah', 'Stroberi', 10000, 2, '#ef4444', 'straw'),
    ('Topping Buah', 'Mixed Berry', 15000, 3, '#4338ca', 'berry'),
    ('Topping Buah', 'Taburan', 5000, 4, '#f59e0b', 'spr'),

    ('Jumlah Donat', 'Satuan (1 Pcs)', 0, 1, null, 'mini'),
    ('Jumlah Donat', 'Paket 3 Pcs', 25000, 2, null, 'small'),
    ('Jumlah Donat', 'Half Dozen (6 Pcs)', 60000, 3, null, 'medium'),
    ('Jumlah Donat', 'One Dozen (12 Pcs)', 125000, 4, null, 'large'),

    ('Rasa Adonan', 'Vanilla', 0, 1, '#fbefd5', 'vanilla'),
    ('Rasa Adonan', 'Cokelat', 3000, 2, '#8a5a3c', 'choco'),
    ('Rasa Adonan', 'Red Velvet', 5000, 3, '#c0404e', 'velvet'),
    ('Rasa Adonan', 'Stroberi', 3000, 4, '#f9cdd6', 'straw'),

    ('Glaze & Topping', 'Glaze Cokelat', 4000, 1, '#451a03', 'drip'),
    ('Glaze & Topping', 'Glaze Stroberi', 4000, 2, '#ef4444', 'straw'),
    ('Glaze & Topping', 'Glaze Berry', 5000, 3, '#4338ca', 'berry'),
    ('Glaze & Topping', 'Glaze Vanilla', 3000, 4, '#f472b6', 'flower'),
    ('Glaze & Topping', 'Taburan Sprinkles', 3000, 5, '#f59e0b', 'spr'),

    ('Jumlah Cookies', '1 Giant Cookie', 0, 1, null, 'mini'),
    ('Jumlah Cookies', 'Paket 3 Cookies', 32000, 2, null, 'small'),
    ('Jumlah Cookies', 'Box 6 Cookies', 72000, 3, null, 'medium'),
    ('Jumlah Cookies', 'Jar / Toples', 107000, 4, null, 'large'),

    ('Varian Rasa', 'Vanilla', 0, 1, '#fbefd5', 'vanilla'),
    ('Varian Rasa', 'Cokelat', 4000, 2, '#8a5a3c', 'choco'),
    ('Varian Rasa', 'Red Velvet', 6000, 3, '#c0404e', 'velvet'),
    ('Varian Rasa', 'Stroberi', 4000, 4, '#f9cdd6', 'straw'),

    ('Topping & Extra', 'Lelehan Cokelat', 5000, 1, '#451a03', 'drip'),
    ('Topping & Extra', 'Taburan Sprinkles', 4000, 2, '#f59e0b', 'spr')
) as v(nama_grup, nama, harga, urutan, warna, kode_visual)
join public.grup_opsi g on lower(g.nama) = lower(v.nama_grup)
where not exists (
  select 1 from public.opsi_item oi
  where oi.id_grup = g.id and oi.kode_visual = v.kode_visual
);

delete from public.resep_item
where id_bahan in (select id from public.bahan where lower(nama) = 'kotak kue')
  and id_item in (
    select oi.id from public.opsi_item oi
    join public.grup_opsi go on go.id = oi.id_grup
    where lower(go.nama) in ('ukuran', 'porsi cupcake', 'ukuran tart', 'jumlah donat', 'jumlah cookies')
  );

with data_resep_pastry(nama_grup, kode_visual, nama_bahan, jumlah_asal, satuan_asal) as (
  values
    ('Jenis Kue', 'cake', 'Kotak Kue', 1, 'buah'),
    ('Jenis Kue', 'cupcake', 'Kotak Kue', 1, 'buah'),
    ('Jenis Kue', 'tart', 'Kotak Kue', 1, 'buah'),
    ('Jenis Kue', 'donut', 'Kotak Kue', 1, 'buah'),
    ('Jenis Kue', 'cookies', 'Kotak Kue', 1, 'buah'),

    ('Rasa', 'vanilla', 'Susu Cair', 20, 'ml'),
    ('Rasa', 'vanilla', 'Gula Pasir', 10, 'g'),
    ('Isian', 'cream', 'Krim Kocok', 80, 'ml'),
    ('Isian', 'cream', 'Gula Pasir', 15, 'g'),
    ('Warna Krim', 'putih', 'Krim Kocok', 50, 'ml'),
    ('Elemen Hiasan', 'stiker', 'Fondant', 15, 'g'),
    ('Elemen Hiasan', 'stiker', 'Pewarna Makanan', 2, 'ml'),
    ('Elemen Hiasan', 'topper', 'Fondant', 25, 'g'),
    ('Desain Kustom', 'gambar_kustom', 'Fondant', 30, 'g'),
    ('Desain Kustom', 'gambar_kustom', 'Pewarna Makanan', 5, 'ml'),

    ('Porsi Cupcake', 'mini', 'Tepung Terigu', 35, 'g'),
    ('Porsi Cupcake', 'mini', 'Gula Pasir', 25, 'g'),
    ('Porsi Cupcake', 'mini', 'Telur', 1, 'butir'),
    ('Porsi Cupcake', 'mini', 'Mentega', 25, 'g'),
    ('Porsi Cupcake', 'mini', 'Susu Cair', 20, 'ml'),
    ('Porsi Cupcake', 'mini', 'Krim Kocok', 30, 'ml'),
    ('Porsi Cupcake', 'small', 'Tepung Terigu', 70, 'g'),
    ('Porsi Cupcake', 'small', 'Gula Pasir', 50, 'g'),
    ('Porsi Cupcake', 'small', 'Telur', 1, 'butir'),
    ('Porsi Cupcake', 'small', 'Mentega', 50, 'g'),
    ('Porsi Cupcake', 'small', 'Susu Cair', 40, 'ml'),
    ('Porsi Cupcake', 'small', 'Krim Kocok', 60, 'ml'),
    ('Porsi Cupcake', 'medium', 'Tepung Terigu', 140, 'g'),
    ('Porsi Cupcake', 'medium', 'Gula Pasir', 100, 'g'),
    ('Porsi Cupcake', 'medium', 'Telur', 2, 'butir'),
    ('Porsi Cupcake', 'medium', 'Mentega', 100, 'g'),
    ('Porsi Cupcake', 'medium', 'Susu Cair', 80, 'ml'),
    ('Porsi Cupcake', 'medium', 'Krim Kocok', 120, 'ml'),
    ('Porsi Cupcake', 'large', 'Tepung Terigu', 210, 'g'),
    ('Porsi Cupcake', 'large', 'Gula Pasir', 150, 'g'),
    ('Porsi Cupcake', 'large', 'Telur', 3, 'butir'),
    ('Porsi Cupcake', 'large', 'Mentega', 150, 'g'),
    ('Porsi Cupcake', 'large', 'Susu Cair', 120, 'ml'),
    ('Porsi Cupcake', 'large', 'Krim Kocok', 180, 'ml'),

    ('Ukuran Tart', 'mini', 'Tepung Terigu', 50, 'g'),
    ('Ukuran Tart', 'mini', 'Mentega', 30, 'g'),
    ('Ukuran Tart', 'mini', 'Gula Pasir', 20, 'g'),
    ('Ukuran Tart', 'mini', 'Telur', 1, 'butir'),
    ('Ukuran Tart', 'mini', 'Susu Cair', 40, 'ml'),
    ('Ukuran Tart', 'small', 'Tepung Terigu', 110, 'g'),
    ('Ukuran Tart', 'small', 'Mentega', 65, 'g'),
    ('Ukuran Tart', 'small', 'Gula Pasir', 45, 'g'),
    ('Ukuran Tart', 'small', 'Telur', 2, 'butir'),
    ('Ukuran Tart', 'small', 'Susu Cair', 90, 'ml'),
    ('Ukuran Tart', 'medium', 'Tepung Terigu', 170, 'g'),
    ('Ukuran Tart', 'medium', 'Mentega', 100, 'g'),
    ('Ukuran Tart', 'medium', 'Gula Pasir', 70, 'g'),
    ('Ukuran Tart', 'medium', 'Telur', 3, 'butir'),
    ('Ukuran Tart', 'medium', 'Susu Cair', 140, 'ml'),
    ('Ukuran Tart', 'large', 'Tepung Terigu', 240, 'g'),
    ('Ukuran Tart', 'large', 'Mentega', 140, 'g'),
    ('Ukuran Tart', 'large', 'Gula Pasir', 100, 'g'),
    ('Ukuran Tart', 'large', 'Telur', 4, 'butir'),
    ('Ukuran Tart', 'large', 'Susu Cair', 200, 'ml'),

    ('Jumlah Donat', 'mini', 'Tepung Terigu', 45, 'g'),
    ('Jumlah Donat', 'mini', 'Gula Pasir', 15, 'g'),
    ('Jumlah Donat', 'mini', 'Mentega', 15, 'g'),
    ('Jumlah Donat', 'mini', 'Telur', 1, 'butir'),
    ('Jumlah Donat', 'mini', 'Susu Cair', 20, 'ml'),
    ('Jumlah Donat', 'small', 'Tepung Terigu', 135, 'g'),
    ('Jumlah Donat', 'small', 'Gula Pasir', 45, 'g'),
    ('Jumlah Donat', 'small', 'Mentega', 45, 'g'),
    ('Jumlah Donat', 'small', 'Telur', 1, 'butir'),
    ('Jumlah Donat', 'small', 'Susu Cair', 60, 'ml'),
    ('Jumlah Donat', 'medium', 'Tepung Terigu', 270, 'g'),
    ('Jumlah Donat', 'medium', 'Gula Pasir', 90, 'g'),
    ('Jumlah Donat', 'medium', 'Mentega', 90, 'g'),
    ('Jumlah Donat', 'medium', 'Telur', 2, 'butir'),
    ('Jumlah Donat', 'medium', 'Susu Cair', 120, 'ml'),
    ('Jumlah Donat', 'large', 'Tepung Terigu', 540, 'g'),
    ('Jumlah Donat', 'large', 'Gula Pasir', 180, 'g'),
    ('Jumlah Donat', 'large', 'Mentega', 180, 'g'),
    ('Jumlah Donat', 'large', 'Telur', 4, 'butir'),
    ('Jumlah Donat', 'large', 'Susu Cair', 240, 'ml'),

    ('Jumlah Cookies', 'mini', 'Tepung Terigu', 50, 'g'),
    ('Jumlah Cookies', 'mini', 'Mentega', 35, 'g'),
    ('Jumlah Cookies', 'mini', 'Gula Pasir', 30, 'g'),
    ('Jumlah Cookies', 'mini', 'Telur', 1, 'butir'),
    ('Jumlah Cookies', 'mini', 'Cokelat Batang', 15, 'g'),
    ('Jumlah Cookies', 'small', 'Tepung Terigu', 130, 'g'),
    ('Jumlah Cookies', 'small', 'Mentega', 90, 'g'),
    ('Jumlah Cookies', 'small', 'Gula Pasir', 80, 'g'),
    ('Jumlah Cookies', 'small', 'Telur', 1, 'butir'),
    ('Jumlah Cookies', 'small', 'Cokelat Batang', 40, 'g'),
    ('Jumlah Cookies', 'medium', 'Tepung Terigu', 240, 'g'),
    ('Jumlah Cookies', 'medium', 'Mentega', 165, 'g'),
    ('Jumlah Cookies', 'medium', 'Gula Pasir', 145, 'g'),
    ('Jumlah Cookies', 'medium', 'Telur', 2, 'butir'),
    ('Jumlah Cookies', 'medium', 'Cokelat Batang', 75, 'g'),
    ('Jumlah Cookies', 'large', 'Tepung Terigu', 350, 'g'),
    ('Jumlah Cookies', 'large', 'Mentega', 240, 'g'),
    ('Jumlah Cookies', 'large', 'Gula Pasir', 210, 'g'),
    ('Jumlah Cookies', 'large', 'Telur', 3, 'butir'),
    ('Jumlah Cookies', 'large', 'Cokelat Batang', 110, 'g'),

    ('Rasa Muffin', 'vanilla', 'Susu Cair', 15, 'ml'),
    ('Rasa Muffin', 'vanilla', 'Gula Pasir', 10, 'g'),
    ('Rasa Muffin', 'choco', 'Cokelat Bubuk', 25, 'g'),
    ('Rasa Muffin', 'velvet', 'Cokelat Bubuk', 10, 'g'),
    ('Rasa Muffin', 'velvet', 'Pewarna Makanan', 5, 'ml'),
    ('Rasa Muffin', 'straw', 'Selai Stroberi', 30, 'g'),
    ('Rasa Custard', 'vanilla', 'Susu Cair', 20, 'ml'),
    ('Rasa Custard', 'vanilla', 'Gula Pasir', 10, 'g'),
    ('Rasa Custard', 'choco', 'Cokelat Bubuk', 35, 'g'),
    ('Rasa Custard', 'velvet', 'Cokelat Bubuk', 10, 'g'),
    ('Rasa Custard', 'velvet', 'Pewarna Makanan', 5, 'ml'),
    ('Rasa Custard', 'straw', 'Selai Stroberi', 45, 'g'),
    ('Rasa Adonan', 'vanilla', 'Susu Cair', 15, 'ml'),
    ('Rasa Adonan', 'vanilla', 'Gula Pasir', 10, 'g'),
    ('Rasa Adonan', 'choco', 'Cokelat Bubuk', 30, 'g'),
    ('Rasa Adonan', 'velvet', 'Cokelat Bubuk', 10, 'g'),
    ('Rasa Adonan', 'velvet', 'Pewarna Makanan', 5, 'ml'),
    ('Rasa Adonan', 'straw', 'Selai Stroberi', 30, 'g'),
    ('Varian Rasa', 'vanilla', 'Susu Cair', 15, 'ml'),
    ('Varian Rasa', 'vanilla', 'Gula Pasir', 10, 'g'),
    ('Varian Rasa', 'choco', 'Cokelat Bubuk', 35, 'g'),
    ('Varian Rasa', 'velvet', 'Cokelat Bubuk', 10, 'g'),
    ('Varian Rasa', 'velvet', 'Pewarna Makanan', 5, 'ml'),
    ('Varian Rasa', 'straw', 'Selai Stroberi', 30, 'g'),

    ('Topping & Krim', 'drip', 'Cokelat Batang', 30, 'g'),
    ('Topping & Krim', 'drip', 'Krim Kocok', 30, 'ml'),
    ('Topping & Krim', 'straw', 'Stroberi Segar', 50, 'g'),
    ('Topping & Krim', 'berry', 'Buah Beri', 50, 'g'),
    ('Topping & Krim', 'flower', 'Fondant', 20, 'g'),
    ('Topping & Krim', 'spr', 'Taburan', 10, 'g'),
    ('Topping Buah', 'drip', 'Cokelat Batang', 45, 'g'),
    ('Topping Buah', 'straw', 'Stroberi Segar', 90, 'g'),
    ('Topping Buah', 'berry', 'Buah Beri', 90, 'g'),
    ('Topping Buah', 'spr', 'Taburan', 12, 'g'),
    ('Glaze & Topping', 'drip', 'Cokelat Batang', 45, 'g'),
    ('Glaze & Topping', 'straw', 'Selai Stroberi', 40, 'g'),
    ('Glaze & Topping', 'berry', 'Buah Beri', 40, 'g'),
    ('Glaze & Topping', 'flower', 'Gula Pasir', 30, 'g'),
    ('Glaze & Topping', 'spr', 'Taburan', 12, 'g'),
    ('Topping & Extra', 'drip', 'Cokelat Batang', 40, 'g'),
    ('Topping & Extra', 'spr', 'Taburan', 12, 'g')
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
from data_resep_pastry d
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
  order by b.id asc
  limit 1
) b on true
on conflict (id_item, id_bahan) do nothing;
