alter table public.pesanan alter column jam_ambil drop not null;

alter table public.pembayaran add column if not exists midtrans_order_id text unique;
alter table public.pembayaran add column if not exists snap_token text;

alter table public.pembayaran drop constraint if exists pembayaran_status_check;
alter table public.pembayaran add constraint pembayaran_status_check check (status in ('Menunggu', 'Menunggu Konfirmasi', 'Dikonfirmasi', 'Ditolak', 'Kedaluwarsa', 'Gagal'));

alter table public.pesanan add column if not exists perlu_refund boolean not null default false;
alter table public.pesanan add column if not exists patokan text;

alter table public.pengaturan_toko add column if not exists transfer_manual_aktif boolean not null default false;

alter table public.pesanan add column if not exists dibatalkan_oleh text check (dibatalkan_oleh is null or dibatalkan_oleh in ('Pelanggan', 'Admin', 'Sistem'));
