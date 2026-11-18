create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profil (id, nama, no_wa, role, aktif)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'no_wa', new.raw_user_meta_data->>'phone', ''),
    'pelanggan',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_kode_pesanan()
returns trigger as $$
begin
  if new.nomor is null then
    new.nomor := nextval('public.pesanan_nomor_seq');
  end if;
  if new.kode_pesanan is null or new.kode_pesanan = '' then
    new.kode_pesanan := 'KUE-' || lpad(new.nomor::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_pesanan_insert on public.pesanan;
create trigger on_pesanan_insert
  before insert on public.pesanan
  for each row execute procedure public.set_kode_pesanan();
