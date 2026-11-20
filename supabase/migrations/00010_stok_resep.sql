create table if not exists public.resep_item (
  id bigint generated always as identity primary key,
  id_item bigint not null references public.opsi_item(id) on delete cascade,
  id_bahan bigint not null references public.bahan(id) on delete cascade,
  jumlah numeric not null check (jumlah > 0),
  unique (id_item, id_bahan)
);

create table if not exists public.riwayat_stok (
  id bigint generated always as identity primary key,
  id_bahan bigint not null references public.bahan(id) on delete cascade,
  perubahan numeric not null,
  stok_setelah numeric not null,
  jenis text not null check (jenis in ('Masuk', 'Keluar', 'Koreksi', 'Pesanan', 'Pengembalian')),
  id_pesanan bigint references public.pesanan(id) on delete set null,
  keterangan text,
  id_user uuid references public.profil(id) on delete set null,
  dibuat_pada timestamptz not null default now()
);

alter table public.pesanan_pilihan add column if not exists id_item bigint references public.opsi_item(id) on delete set null;

update public.pesanan_pilihan pp
set id_item = oi.id
from public.opsi_item oi
join public.grup_opsi go on go.id = oi.id_grup
where pp.id_item is null
  and lower(trim(pp.nama_grup)) = lower(trim(go.nama))
  and (
    (pp.kode_visual is not null and pp.kode_visual <> '' and lower(trim(pp.kode_visual)) = lower(trim(oi.kode_visual)))
    or lower(trim(pp.nama_item)) = lower(trim(oi.nama))
  );

alter table public.pesanan add column if not exists stok_dipotong_pada timestamptz;

create or replace function public.kurangi_stok_pesanan(p_id_pesanan bigint, p_id_user uuid)
returns table (
  id_bahan bigint,
  nama text,
  satuan text,
  dibutuhkan numeric,
  dikurangi numeric,
  kurang numeric
)
language plpgsql
security definer
as $$
declare
  v_pesanan record;
  v_kebutuhan record;
  v_stok_sekarang numeric;
  v_dikurangi numeric;
  v_kurang numeric;
  v_stok_setelah numeric;
  v_keterangan text;
begin
  select id, status_pesanan, stok_dipotong_pada
  into v_pesanan
  from public.pesanan
  where id = p_id_pesanan
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_pesanan.stok_dipotong_pada is not null then
    raise exception 'Stok untuk pesanan ini sudah pernah dipotong';
  end if;

  if v_pesanan.status_pesanan in ('Menunggu Pembayaran', 'Dibatalkan') then
    raise exception 'Stok tidak dapat dipotong untuk pesanan berstatus %', v_pesanan.status_pesanan;
  end if;

  for v_kebutuhan in
    select
      b.id as b_id,
      b.nama as b_nama,
      b.satuan as b_satuan,
      sum(ri.jumlah * coalesce(pp.jumlah, 1)) as total_dibutuhkan
    from public.pesanan_pilihan pp
    left join lateral (
      select oi.id
      from public.opsi_item oi
      join public.grup_opsi go on go.id = oi.id_grup
      where lower(trim(go.nama)) = lower(trim(pp.nama_grup))
        and (
          (pp.kode_visual is not null and pp.kode_visual <> '' and lower(trim(pp.kode_visual)) = lower(trim(oi.kode_visual)))
          or lower(trim(pp.nama_item)) = lower(trim(oi.nama))
        )
      limit 1
    ) fb on pp.id_item is null
    join public.resep_item ri on ri.id_item = coalesce(pp.id_item, fb.id)
    join public.bahan b on b.id = ri.id_bahan
    where pp.id_pesanan = p_id_pesanan
    group by b.id, b.nama, b.satuan
    order by b.nama asc
  loop
    select b.jumlah into v_stok_sekarang
    from public.bahan b
    where b.id = v_kebutuhan.b_id
    for update;

    if v_stok_sekarang is null then
      v_stok_sekarang := 0;
    end if;

    v_dikurangi := least(greatest(v_stok_sekarang, 0), v_kebutuhan.total_dibutuhkan);
    v_kurang := v_kebutuhan.total_dibutuhkan - v_dikurangi;
    v_stok_setelah := greatest(v_stok_sekarang - v_dikurangi, 0);

    update public.bahan
    set jumlah = v_stok_setelah
    where id = v_kebutuhan.b_id;

    if v_kurang > 0 then
      v_keterangan := 'Pengurangan stok pesanan (kurang ' || v_kurang || ' ' || v_kebutuhan.b_satuan || ')';
    else
      v_keterangan := 'Pengurangan stok pesanan';
    end if;

    insert into public.riwayat_stok (
      id_bahan,
      perubahan,
      stok_setelah,
      jenis,
      id_pesanan,
      keterangan,
      id_user
    ) values (
      v_kebutuhan.b_id,
      -v_dikurangi,
      v_stok_setelah,
      'Pesanan',
      p_id_pesanan,
      v_keterangan,
      p_id_user
    );

    id_bahan := v_kebutuhan.b_id;
    nama := v_kebutuhan.b_nama;
    satuan := v_kebutuhan.b_satuan;
    dibutuhkan := v_kebutuhan.total_dibutuhkan;
    dikurangi := v_dikurangi;
    kurang := v_kurang;
    return next;
  end loop;

  update public.pesanan
  set stok_dipotong_pada = now()
  where id = p_id_pesanan;

  return;
end;
$$;

create or replace function public.kembalikan_stok_pesanan(p_id_pesanan bigint, p_id_user uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_pesanan record;
  v_riwayat record;
  v_stok_sekarang numeric;
  v_jumlah_kembali numeric;
  v_stok_setelah numeric;
begin
  select id, stok_dipotong_pada
  into v_pesanan
  from public.pesanan
  where id = p_id_pesanan
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_pesanan.stok_dipotong_pada is null then
    return;
  end if;

  for v_riwayat in
    select id_bahan, abs(perubahan) as jumlah_potong
    from public.riwayat_stok
    where id_pesanan = p_id_pesanan and jenis = 'Pesanan'
    order by id asc
  loop
    select b.jumlah into v_stok_sekarang
    from public.bahan b
    where b.id = v_riwayat.id_bahan
    for update;

    if v_stok_sekarang is null then
      v_stok_sekarang := 0;
    end if;

    v_jumlah_kembali := v_riwayat.jumlah_potong;
    v_stok_setelah := v_stok_sekarang + v_jumlah_kembali;

    update public.bahan
    set jumlah = v_stok_setelah
    where id = v_riwayat.id_bahan;

    insert into public.riwayat_stok (
      id_bahan,
      perubahan,
      stok_setelah,
      jenis,
      id_pesanan,
      keterangan,
      id_user
    ) values (
      v_riwayat.id_bahan,
      v_jumlah_kembali,
      v_stok_setelah,
      'Pengembalian',
      p_id_pesanan,
      'Pengembalian stok pesanan',
      p_id_user
    );
  end loop;

  update public.pesanan
  set stok_dipotong_pada = null
  where id = p_id_pesanan;
end;
$$;

revoke all on function public.kurangi_stok_pesanan(bigint, uuid) from public, anon, authenticated;
grant execute on function public.kurangi_stok_pesanan(bigint, uuid) to service_role;

revoke all on function public.kembalikan_stok_pesanan(bigint, uuid) from public, anon, authenticated;
grant execute on function public.kembalikan_stok_pesanan(bigint, uuid) to service_role;

alter table public.resep_item enable row level security;
alter table public.riwayat_stok enable row level security;
