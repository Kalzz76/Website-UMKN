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

  return NextResponse.json({ sukses: true, data: data || [] });
}

export async function POST(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  if (aksi === "tambah") {
    const jarak_maks_km = Number(body.jarak_maks_km);
    const tarif = Number(body.tarif);
    const aktif = body.aktif !== false;

    if (isNaN(jarak_maks_km) || jarak_maks_km <= 0) {
      return NextResponse.json(
        { pesan: "Batas jarak maksimal harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    if (isNaN(tarif) || tarif < 0) {
      return NextResponse.json(
        { pesan: "Tarif ongkir harus berupa angka minimal 0." },
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
        { pesan: `Tarif untuk batas jarak ${jarak_maks_km} km sudah terdaftar.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
        { pesan: "Gagal menambah tarif jarak: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sukses: true,
      pesan: "Tarif jarak berhasil ditambahkan.",
      data,
    });
  }

  if (aksi === "ubah") {
    const id = Number(body.id);
    const jarak_maks_km = Number(body.jarak_maks_km);
    const tarif = Number(body.tarif);
    const aktif = body.aktif !== false;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID tarif jarak tidak valid." },
        { status: 400 }
      );
    }

    if (isNaN(jarak_maks_km) || jarak_maks_km <= 0) {
      return NextResponse.json(
        { pesan: "Batas jarak maksimal harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    if (isNaN(tarif) || tarif < 0) {
      return NextResponse.json(
        { pesan: "Tarif ongkir harus berupa angka minimal 0." },
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
        { pesan: `Batas jarak ${jarak_maks_km} km sudah digunakan pada tier lain.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
      data,
    });
  }

  if (aksi === "hapus") {
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json(
        { pesan: "ID tarif jarak tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tarif_jarak")
      .delete()
      .eq("id", id);

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

  return NextResponse.json({ pesan: "Aksi tidak dikenali." }, { status: 400 });
}
