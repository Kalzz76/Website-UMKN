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
