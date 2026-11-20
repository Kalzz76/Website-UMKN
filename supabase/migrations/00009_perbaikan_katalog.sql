alter table pesanan_pilihan add column if not exists jumlah integer not null default 1;
alter table pesanan add column if not exists foto_preview text;
alter table pesanan add column if not exists foto_bentuk_kustom text;
alter table pesanan add column if not exists foto_gambar_kustom text;
alter table pesanan add column if not exists desain_json jsonb;

alter table grup_opsi drop constraint if exists grup_opsi_peran_visual_check;
alter table grup_opsi add constraint grup_opsi_peran_visual_check check (peran_visual in ('badan', 'ukuran', 'krim', 'topping', 'bentuk', 'stiker'));

update grup_opsi set peran_visual = null where nama = 'Topping';
update opsi_item set aktif = false where id_grup in (select id from grup_opsi where nama = 'Topping');

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Jenis Kue', 1, true, 'satu', null, 'jenis'
where not exists (select 1 from grup_opsi where nama = 'Jenis Kue');

update grup_opsi set urutan = 1, wajib = true, jenis_pilihan = 'satu', peran_visual = null, peran_dashboard = 'jenis' where nama = 'Jenis Kue';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Ukuran', 2, true, 'satu', 'ukuran', null
where not exists (select 1 from grup_opsi where nama = 'Ukuran');

update grup_opsi set urutan = 2, wajib = true, jenis_pilihan = 'satu', peran_visual = 'ukuran', peran_dashboard = null where nama = 'Ukuran';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Bentuk', 3, true, 'satu', 'bentuk', null
where not exists (select 1 from grup_opsi where nama = 'Bentuk');

update grup_opsi set urutan = 3, wajib = true, jenis_pilihan = 'satu', peran_visual = 'bentuk', peran_dashboard = null where nama = 'Bentuk';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Rasa', 4, true, 'satu', 'badan', 'terlaris'
where not exists (select 1 from grup_opsi where nama = 'Rasa');

update grup_opsi set urutan = 4, wajib = true, jenis_pilihan = 'satu', peran_visual = 'badan', peran_dashboard = 'terlaris' where nama = 'Rasa';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Isian', 5, true, 'satu', null, null
where not exists (select 1 from grup_opsi where nama = 'Isian');

update grup_opsi set urutan = 5, wajib = true, jenis_pilihan = 'satu', peran_visual = null, peran_dashboard = null where nama = 'Isian';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Warna Krim', 6, true, 'satu', 'krim', null
where not exists (select 1 from grup_opsi where nama = 'Warna Krim');

update grup_opsi set urutan = 6, wajib = true, jenis_pilihan = 'satu', peran_visual = 'krim', peran_dashboard = null where nama = 'Warna Krim';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Dekorasi', 7, false, 'banyak', 'topping', null
where not exists (select 1 from grup_opsi where nama = 'Dekorasi');

update grup_opsi set urutan = 7, wajib = false, jenis_pilihan = 'banyak', peran_visual = 'topping', peran_dashboard = null where nama = 'Dekorasi';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Elemen Hiasan', 8, false, 'banyak', 'stiker', null
where not exists (select 1 from grup_opsi where nama = 'Elemen Hiasan');

update grup_opsi set urutan = 8, wajib = false, jenis_pilihan = 'banyak', peran_visual = 'stiker', peran_dashboard = null where nama = 'Elemen Hiasan';

insert into grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
select 'Desain Kustom', 9, false, 'banyak', null, null
where not exists (select 1 from grup_opsi where nama = 'Desain Kustom');

update grup_opsi set urutan = 9, wajib = false, jenis_pilihan = 'banyak', peran_visual = null, peran_dashboard = null where nama = 'Desain Kustom';

update opsi_item set aktif = false where nama in (
  'Kecil (15 cm)',
  'Sedang (20 cm)',
  'Coklat',
  'Strawberry',
  'Matcha',
  'Buttercream Putih',
  'Buttercream Pink',
  'Buttercream Coklat',
  'Strawberry Segar',
  'Coklat Chip',
  'Aneka Buah',
  'Lilin Ulang Tahun',
  'Regular Cake',
  'Cupcake'
);

update opsi_item set aktif = false where nama = 'Cream Cheese' and id_grup in (select id from grup_opsi where nama = 'Warna Krim');

insert into opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select g.id, v.nama, v.harga, true, v.urutan, v.warna, v.kode_visual
from grup_opsi g
cross join (values
  ('Lingkaran', 0, 1, null, 'round'),
  ('Kotak', 0, 2, null, 'square'),
  ('Hati', 10000, 3, null, 'heart'),
  ('Bintang', 15000, 4, null, 'star'),
  ('Hexagon', 10000, 5, null, 'hex'),
  ('Buat Sendiri', 25000, 6, null, 'custom')
) as v(nama, harga, urutan, warna, kode_visual)
where g.nama = 'Bentuk'
and not exists (
  select 1 from opsi_item oi where oi.id_grup = g.id and oi.kode_visual = v.kode_visual
);

update opsi_item set
  nama = v.nama,
  harga = v.harga,
  aktif = true,
  urutan = v.urutan,
  warna = v.warna
from (values
  ('Lingkaran', 0, 1, null, 'round'),
  ('Kotak', 0, 2, null, 'square'),
  ('Hati', 10000, 3, null, 'heart'),
  ('Bintang', 15000, 4, null, 'star'),
  ('Hexagon', 10000, 5, null, 'hex'),
  ('Buat Sendiri', 25000, 6, null, 'custom')
) as v(nama, harga, urutan, warna, kode_visual)
join grup_opsi g on g.nama = 'Bentuk'
where opsi_item.id_grup = g.id and opsi_item.kode_visual = v.kode_visual;

insert into opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select g.id, v.nama, v.harga, true, v.urutan, v.warna, v.kode_visual
from grup_opsi g
cross join (values
  ('Stiker', 5000, 1, null, 'stiker'),
  ('Topper', 5000, 2, null, 'topper'),
  ('Bunga', 5000, 3, null, 'bunga'),
  ('Buah', 5000, 4, null, 'buah'),
  ('Cokelat', 5000, 5, null, 'cokelat')
) as v(nama, harga, urutan, warna, kode_visual)
where g.nama = 'Elemen Hiasan'
and not exists (
  select 1 from opsi_item oi where oi.id_grup = g.id and oi.kode_visual = v.kode_visual
);

update opsi_item set
  nama = v.nama,
  harga = v.harga,
  aktif = true,
  urutan = v.urutan,
  warna = v.warna
from (values
  ('Stiker', 5000, 1, null, 'stiker'),
  ('Topper', 5000, 2, null, 'topper'),
  ('Bunga', 5000, 3, null, 'bunga'),
  ('Buah', 5000, 4, null, 'buah'),
  ('Cokelat', 5000, 5, null, 'cokelat')
) as v(nama, harga, urutan, warna, kode_visual)
join grup_opsi g on g.nama = 'Elemen Hiasan'
where opsi_item.id_grup = g.id and opsi_item.kode_visual = v.kode_visual;

insert into opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select g.id, 'Gambar Kustom', 20000, true, 1, null, 'gambar_kustom'
from grup_opsi g
where g.nama = 'Desain Kustom'
and not exists (
  select 1 from opsi_item oi where oi.id_grup = g.id and oi.nama = 'Gambar Kustom'
);

update opsi_item set
  harga = 20000,
  aktif = true,
  kode_visual = 'gambar_kustom'
where nama = 'Gambar Kustom' and id_grup in (select id from grup_opsi where nama = 'Desain Kustom');
