drop policy if exists "Pembayaran dibaca pemilik atau staf admin" on public.pembayaran;
drop policy if exists "Pembayaran dibaca pemilik atau admin" on public.pembayaran;

create policy "Pembayaran dibaca pemilik atau admin"
on public.pembayaran for select
using (
  exists (
    select 1 from public.pesanan
    where pesanan.id = pembayaran.id_pesanan
    and (pesanan.id_pelanggan = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Pembayaran dikelola staf admin" on public.pembayaran;
drop policy if exists "Pembayaran dikelola admin" on public.pembayaran;

create policy "Pembayaran dikelola admin"
on public.pembayaran for all
using (public.is_admin());

drop policy if exists "Profil dibaca pemilik atau staf admin" on public.profil;
drop policy if exists "Profil dibaca pemilik atau admin" on public.profil;

create policy "Profil dibaca pemilik atau admin"
on public.profil for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "Pesanan dikelola staf admin" on public.pesanan;
drop policy if exists "Pesanan diubah staf admin" on public.pesanan;

create policy "Pesanan diubah staf admin"
on public.pesanan for update
using (public.is_staf_or_admin());

drop policy if exists "Pesanan dihapus admin" on public.pesanan;
create policy "Pesanan dihapus admin"
on public.pesanan for delete
using (public.is_admin());
