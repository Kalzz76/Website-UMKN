grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on table public.profil to postgres, service_role, supabase_auth_admin;
grant select, insert, update on table public.profil to anon, authenticated;

drop policy if exists "Profil dibuat saat registrasi" on public.profil;
create policy "Profil dibuat saat registrasi"
on public.profil for insert
with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profil (id, nama, no_wa, role, aktif)
    values (
      new.id,
      coalesce(
        nullif(trim(new.raw_user_meta_data->>'nama'), ''),
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        split_part(coalesce(new.email, 'Pelanggan'), '@', 1)
      ),
      coalesce(
        nullif(trim(new.raw_user_meta_data->>'no_wa'), ''),
        nullif(trim(new.raw_user_meta_data->>'phone'), ''),
        ''
      ),
      'pelanggan',
      true
    )
    on conflict (id) do update set
      nama = case
        when public.profil.nama = '' then excluded.nama
        else public.profil.nama
      end,
      no_wa = case
        when public.profil.no_wa = '' then excluded.no_wa
        else public.profil.no_wa
      end;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
