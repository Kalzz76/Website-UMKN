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
  batas_bayar_jam,
  nama_bank,
  no_rekening,
  atas_nama,
  gambar_qris
) values (
  1,
  'Cravely Bakery',
  'Buat hari lebih manis dengan kue terbaik kami ♡',
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
  'Cravely Bakery',
  null
) on conflict (id) do update set
  nama_toko = excluded.nama_toko,
  slogan = excluded.slogan;

update public.grup_opsi set nama = 'Warna Krim' where nama = 'Krim';
update public.grup_opsi set nama = 'Elemen Hiasan' where nama = 'Stiker & Topper';

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
  ('Desain Kustom', 9, false, 'banyak', null, null)
on conflict (id) do nothing;

update public.grup_opsi set urutan = 1, wajib = true, jenis_pilihan = 'satu', peran_visual = null, peran_dashboard = 'jenis' where nama = 'Jenis Kue';
update public.grup_opsi set urutan = 2, wajib = true, jenis_pilihan = 'satu', peran_visual = 'ukuran', peran_dashboard = null where nama = 'Ukuran';
update public.grup_opsi set urutan = 3, wajib = true, jenis_pilihan = 'satu', peran_visual = 'bentuk', peran_dashboard = null where nama = 'Bentuk';
update public.grup_opsi set urutan = 4, wajib = true, jenis_pilihan = 'satu', peran_visual = 'badan', peran_dashboard = 'terlaris' where nama = 'Rasa';
update public.grup_opsi set urutan = 5, wajib = true, jenis_pilihan = 'satu', peran_visual = null, peran_dashboard = null where nama = 'Isian';
update public.grup_opsi set urutan = 6, wajib = true, jenis_pilihan = 'satu', peran_visual = 'krim', peran_dashboard = null where nama = 'Warna Krim';
update public.grup_opsi set urutan = 7, wajib = false, jenis_pilihan = 'banyak', peran_visual = 'topping', peran_dashboard = null where nama = 'Dekorasi';
update public.grup_opsi set urutan = 8, wajib = false, jenis_pilihan = 'banyak', peran_visual = 'stiker', peran_dashboard = null where nama = 'Elemen Hiasan';
update public.grup_opsi set urutan = 9, wajib = false, jenis_pilihan = 'banyak', peran_visual = null, peran_dashboard = null where nama = 'Desain Kustom';

update public.opsi_item set aktif = false where nama in (
  'Regular Cake', 'Cupcake',
  'Kecil (15 cm)', 'Sedang (20 cm)', 'Besar (25 cm)',
  'Mini (10 cm, 1-2 orang)', 'Kecil (14 cm, 3-5 orang)', 'Sedang (18 cm, 6-10 orang)', 'Besar (22 cm, 10-15 orang)',
  'Kucing Custom',
  'Matcha',
  'Buttercream Putih', 'Buttercream Pink', 'Buttercream Coklat',
  'Stroberi Segar', 'Taburan Sprinkles', 'Lilin Ulang Tahun', 'Coklat Chip', 'Aneka Buah',
  'Stiker Karakter', 'Topper Kue', 'Hiasan Bunga', 'Buah Mini', 'Cokelat Mini', 'Aksesoris Lainnya'
);

delete from public.opsi_item where nama in (
  'Custom Cake', 'Template Siap Pakai',
  'Mini Ø10', 'Small Ø14', 'Medium Ø18', 'Large Ø22',
  'Lingkaran', 'Kotak', 'Hati', 'Bintang', 'Hexagon', 'Buat Sendiri',
  'Vanilla', 'Cokelat', 'Red Velvet', 'Stroberi',
  'Krim Vanilla', 'Ganache Cokelat', 'Selai Stroberi', 'Cream Cheese',
  'Pink', 'Putih', 'Mint', 'Kuning', 'Lavender',
  'Lelehan Krim', 'Mixed Berry', 'Bunga Gula', 'Taburan', 'Lilin',
  'Stiker', 'Topper', 'Bunga', 'Buah', 'Cokelat', 'Lainnya',
  'Gambar Kustom'
) and id not in (select coalesce(id_grup, 0) from public.pesanan_pilihan);

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Custom Cake', 0, true, 1, '#1e4b3c', 'custom'
from public.grup_opsi where nama = 'Jenis Kue';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Template Siap Pakai', 0, true, 2, '#608d7c', 'template'
from public.grup_opsi where nama = 'Jenis Kue';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Mini Ø10', 85000, true, 1, null, 'mini'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Small Ø14', 125000, true, 2, null, 'small'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Medium Ø18', 165000, true, 3, null, 'medium'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Large Ø22', 210000, true, 4, null, 'large'
from public.grup_opsi where nama = 'Ukuran';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lingkaran', 0, true, 1, null, 'round'
from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Kotak', 0, true, 2, null, 'square'
from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Hati', 10000, true, 3, null, 'heart'
from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Bintang', 15000, true, 4, null, 'star'
from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Hexagon', 10000, true, 5, null, 'hex'
from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Buat Sendiri', 25000, true, 6, null, 'custom'
from public.grup_opsi where nama = 'Bentuk';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Vanilla', 0, true, 1, '#fbefd5', 'vanilla'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Cokelat', 10000, true, 2, '#8a5a3c', 'choco'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Red Velvet', 15000, true, 3, '#c0404e', 'velvet'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Stroberi', 10000, true, 4, '#f9cdd6', 'straw'
from public.grup_opsi where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Krim Vanilla', 0, true, 1, '#fffaf0', 'cream'
from public.grup_opsi where nama = 'Isian';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Ganache Cokelat', 8000, true, 2, '#5b3322', 'ganache'
from public.grup_opsi where nama = 'Isian';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Selai Stroberi', 5000, true, 3, '#d6304a', 'jam'
from public.grup_opsi where nama = 'Isian';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Cream Cheese', 12000, true, 4, '#fff0c9', 'cheese'
from public.grup_opsi where nama = 'Isian';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Pink', 0, true, 1, '#f6b4c2', 'pink'
from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Putih', 0, true, 2, '#FFF8F0', 'putih'
from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Cokelat', 0, true, 3, '#6b3d2a', 'coklat'
from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Mint', 0, true, 4, '#bfe8d8', 'mint'
from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Kuning', 0, true, 5, '#fbe39a', 'kuning'
from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lavender', 0, true, 6, '#d8c7f0', 'lavender'
from public.grup_opsi where nama = 'Warna Krim';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lelehan Krim', 12000, true, 1, '#451a03', 'drip'
from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Stroberi', 10000, true, 2, '#ef4444', 'straw'
from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Mixed Berry', 15000, true, 3, '#4338ca', 'berry'
from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Bunga Gula', 8000, true, 4, '#f472b6', 'flower'
from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Taburan', 5000, true, 5, '#f59e0b', 'spr'
from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Lilin', 3000, true, 6, '#fbbf24', 'candle'
from public.grup_opsi where nama = 'Dekorasi';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Stiker', 5000, true, 1, null, 'stiker'
from public.grup_opsi where nama = 'Elemen Hiasan';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Topper', 5000, true, 2, null, 'topper'
from public.grup_opsi where nama = 'Elemen Hiasan';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Bunga', 5000, true, 3, null, 'bunga'
from public.grup_opsi where nama = 'Elemen Hiasan';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Buah', 5000, true, 4, null, 'buah'
from public.grup_opsi where nama = 'Elemen Hiasan';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Cokelat', 5000, true, 5, null, 'cokelat'
from public.grup_opsi where nama = 'Elemen Hiasan';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Gambar Kustom', 20000, true, 1, null, 'gambar_kustom'
from public.grup_opsi where nama = 'Desain Kustom';

insert into public.zona_ongkir (nama, tarif, aktif)
values
  ('Zona 1 (Radius 0 - 5 km)', 15000, true),
  ('Zona 2 (Radius 5 - 10 km)', 30000, true),
  ('Zona 3 (Radius 10 - 20 km)', 50000, true)
on conflict do nothing;

insert into public.bahan (nama, satuan, jumlah, batas_minimum)
values
  ('Tepung Terigu', 'kg', 50, 10),
  ('Telur Ayam', 'butir', 200, 30),
  ('Gula Pasir', 'kg', 40, 8),
  ('Mentega', 'kg', 25, 5),
  ('Coklat Bubuk', 'kg', 15, 3),
  ('Whipping Cream', 'liter', 20, 5),
  ('Strawberry Segar', 'kg', 10, 2)
on conflict do nothing;
