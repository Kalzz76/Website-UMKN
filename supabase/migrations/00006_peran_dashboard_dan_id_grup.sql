alter table public.grup_opsi add column if not exists peran_dashboard text check (peran_dashboard in ('jenis', 'terlaris') or peran_dashboard is null);
alter table public.pesanan_pilihan add column if not exists id_grup bigint references public.grup_opsi(id) on delete set null;
