alter table public.pesanan_pilihan add column if not exists jumlah integer not null default 1;
alter table public.pesanan add column if not exists foto_preview text;
alter table public.pesanan add column if not exists foto_bentuk_kustom text;
alter table public.pesanan add column if not exists foto_gambar_kustom text;
alter table public.pesanan add column if not exists desain_json jsonb;

alter table public.grup_opsi drop constraint if exists grup_opsi_peran_visual_check;
alter table public.grup_opsi add constraint grup_opsi_peran_visual_check check (peran_visual in ('badan', 'ukuran', 'krim', 'topping', 'bentuk', 'stiker') or peran_visual is null);
