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

insert into public.grup_opsi (nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard)
values
  ('Jenis Kue', 1, true, 'satu', 'badan', 'jenis'),
  ('Ukuran', 2, true, 'satu', 'ukuran', null),
  ('Rasa', 3, true, 'satu', 'badan', 'terlaris'),
  ('Krim', 4, true, 'satu', 'krim', null),
  ('Topping', 5, false, 'banyak', 'topping', null)
on conflict do nothing;

update public.grup_opsi set peran_dashboard = 'jenis' where nama = 'Jenis Kue';
update public.grup_opsi set peran_dashboard = 'terlaris' where nama = 'Rasa';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Custom Cake', 0, true, 1, '#1e4b3c', 'custom'
from public.grup_opsi where nama = 'Jenis Kue';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Regular Cake', 0, true, 2, '#608d7c', 'regular'
from public.grup_opsi where nama = 'Jenis Kue';

insert into public.opsi_item (id_grup, nama, harga, aktif, urutan, warna, kode_visual)
select id, 'Cupcake', 0, true, 3, '#b2cfbe', 'cupcake'
from public.grup_opsi where nama = 'Jenis Kue';

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
