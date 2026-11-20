import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json({ pesan: "Akses ditolak." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("id_item");

  const supabase = getSupabaseAdmin();

  const { data: daftarBahan } = await supabase
    .from("bahan")
    .select("id, nama, satuan, jumlah")
    .order("nama", { ascending: true });

  let resepItem = [];
  if (itemId) {
    const { data: rList } = await supabase
      .from("resep_item")
      .select("id, id_item, id_bahan, jumlah")
      .eq("id_item", itemId);
    resepItem = rList || [];
  }

  return NextResponse.json({
    bahan: daftarBahan || [],
    resep: resepItem,
  });
}

export async function POST(request) {
  const { profil, diizinkan } = await cekRole(["admin"]);
  if (!diizinkan || !profil || profil.role !== "admin") {
    return NextResponse.json(
      { pesan: "Hanya admin yang boleh mengelola resep bahan." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { id_item, resep } = body;

  if (!id_item) {
    return NextResponse.json(
      { pesan: "ID item tidak valid." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: item } = await supabase
    .from("opsi_item")
    .select("id, nama")
    .eq("id", id_item)
    .single();

  if (!item) {
    return NextResponse.json(
      { pesan: "Item opsi tidak ditemukan." },
      { status: 404 }
    );
  }

  const rowsToInsert = [];
  const bahanSet = new Set();

  if (Array.isArray(resep)) {
    for (let i = 0; i < resep.length; i++) {
      const r = resep[i];
      if (!r || !r.id_bahan) continue;
      const bId = Number(r.id_bahan);
      const jml = Number(r.jumlah);

      if (isNaN(bId) || isNaN(jml) || jml <= 0) {
        continue;
      }

      if (bahanSet.has(bId)) {
        return NextResponse.json(
          { pesan: "Terdapat bahan ganda pada resep. Gabungkan jumlahnya dalam satu baris." },
          { status: 400 }
        );
      }

      bahanSet.add(bId);
      rowsToInsert.push({
        id_item: item.id,
        id_bahan: bId,
        jumlah: jml,
      });
    }
  }

  const { error: errDel } = await supabase
    .from("resep_item")
    .delete()
    .eq("id_item", item.id);

  if (errDel) {
    return NextResponse.json(
      { pesan: "Gagal memperbarui resep: " + errDel.message },
      { status: 500 }
    );
  }

  if (rowsToInsert.length > 0) {
    const { error: errIns } = await supabase
      .from("resep_item")
      .insert(rowsToInsert);

    if (errIns) {
      return NextResponse.json(
        { pesan: "Gagal menyimpan resep: " + errIns.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    pesan: "Resep bahan berhasil disimpan.",
  });
}
