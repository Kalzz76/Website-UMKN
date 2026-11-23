import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tarif_jarak")
    .select("id, jarak_maks_km, tarif, aktif")
    .order("jarak_maks_km", { ascending: true });

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal memuat tarif jarak: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function POST(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin." },
      { status: 403 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { pesan: "Data request tidak valid." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const aksi = body.aksi || "tambah";

  if (aksi === "ubah") {
    return laksanakanUbah(supabase, body);
  }

  if (aksi === "hapus") {
    return laksanakanHapus(supabase, body);
  }

  return laksanakanTambah(supabase, body);
}

export async function PUT(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin." },
      { status: 403 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { pesan: "Data request tidak valid." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  return laksanakanUbah(supabase, body);
}

export async function DELETE(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin." },
      { status: 403 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    const url = new URL(request.url);
    const qId = url.searchParams.get("id");
    if (qId) body = { id: Number(qId) };
  }

  const supabase = getSupabaseAdmin();
  return laksanakanHapus(supabase, body);
}

async function laksanakanTambah(supabase, body) {
  const jarak_maks_km = Number(body.jarak_maks_km);
  const tarif = Number(body.tarif);
  const aktif = body.aktif === undefined ? true : Boolean(body.aktif);

  if (isNaN(jarak_maks_km) || jarak_maks_km <= 0) {
    return NextResponse.json(
      { pesan: "Batas jarak maksimal harus berupa angka lebih dari 0 km." },
      { status: 400 }
    );
  }

  if (isNaN(tarif) || tarif < 0) {
    return NextResponse.json(
      { pesan: "Tarif ongkir harus berupa angka minimal Rp 0." },
      { status: 400 }
    );
  }

  const { data: ada } = await supabase
    .from("tarif_jarak")
    .select("id")
    .eq("jarak_maks_km", jarak_maks_km)
    .maybeSingle();

  if (ada) {
    return NextResponse.json(
      { pesan: `Tarif untuk jarak maksimal ${jarak_maks_km} km sudah ada.` },
      { status: 400 }
    );
  }

  const { data: baru, error } = await supabase
    .from("tarif_jarak")
    .insert({
      jarak_maks_km,
      tarif: Math.round(tarif),
      aktif,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal menambahkan tarif jarak: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sukses: true,
    pesan: "Tarif jarak berhasil ditambahkan.",
    data: baru,
  });
}

async function laksanakanUbah(supabase, body) {
  const id = Number(body.id);
  const jarak_maks_km = Number(body.jarak_maks_km);
  const tarif = Number(body.tarif);
  const aktif = body.aktif === undefined ? true : Boolean(body.aktif);

  if (!id) {
    return NextResponse.json(
      { pesan: "ID tarif wajib diisi." },
      { status: 400 }
    );
  }

  if (isNaN(jarak_maks_km) || jarak_maks_km <= 0) {
    return NextResponse.json(
      { pesan: "Batas jarak maksimal harus berupa angka lebih dari 0 km." },
      { status: 400 }
    );
  }

  if (isNaN(tarif) || tarif < 0) {
    return NextResponse.json(
      { pesan: "Tarif ongkir harus berupa angka minimal Rp 0." },
      { status: 400 }
    );
  }

  const { data: ada } = await supabase
    .from("tarif_jarak")
    .select("id")
    .eq("jarak_maks_km", jarak_maks_km)
    .neq("id", id)
    .maybeSingle();

  if (ada) {
    return NextResponse.json(
      { pesan: `Tarif untuk jarak maksimal ${jarak_maks_km} km sudah ada.` },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("tarif_jarak")
    .update({
      jarak_maks_km,
      tarif: Math.round(tarif),
      aktif,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal memperbarui tarif jarak: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sukses: true,
    pesan: "Tarif jarak berhasil diperbarui.",
    data: updated,
  });
}

async function laksanakanHapus(supabase, body) {
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json(
      { pesan: "ID tarif wajib diisi untuk menghapus." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("tarif_jarak").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal menghapus tarif jarak: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sukses: true,
    pesan: "Tarif jarak berhasil dihapus.",
  });
}
