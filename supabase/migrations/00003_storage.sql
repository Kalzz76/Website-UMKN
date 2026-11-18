insert into storage.buckets (id, name, public)
values
  ('referensi-kue', 'referensi-kue', false),
  ('bukti-bayar', 'bukti-bayar', false),
  ('publik', 'publik', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Akses publik untuk bucket publik" on storage.objects;
create policy "Akses publik untuk bucket publik"
on storage.objects for select
using (bucket_id = 'publik');
