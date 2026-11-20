import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json({ pesan: "Akses ditolak." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const idBahan = searchParams.get("id_bahan");

  if (!idBahan) {
    return NextResponse.json({ pesan: "ID bahan tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: riwayat, error } = await supabase
    .from("riwayat_stok")
    .select(`
      id,
      id_bahan,
      perubahan,
      stok_setelah,
      jenis,
      id_pesanan,
      keterangan,
      dibuat_pada,
      profil:id_user (nama),
      pesanan:id_pesanan (kode_pesanan)
    `)
    .eq("id_bahan", idBahan)
    .order("dibuat_pada", { ascending: false });

  if (error) {
    return NextResponse.json({ pesan: error.message }, { status: 500 });
  }

  return NextResponse.json({
    riwayat: riwayat || [],
  });
}
