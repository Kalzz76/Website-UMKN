alter table public.pengaturan_toko add column if not exists slogan text not null default '';
alter table public.pembayaran add column if not exists dikonfirmasi_pada timestamptz;
