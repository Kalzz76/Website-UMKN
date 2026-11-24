import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { pesan: "Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: pesananTerakhir } = await supabase
    .from("pesanan")
    .select("alamat, patokan, lat_tujuan, lng_tujuan")
    .eq("id_pelanggan", user.id)
    .eq("metode_pengiriman", "Kirim")
    .not("alamat", "is", null)
    .order("dibuat_pada", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    sukses: true,
    data: pesananTerakhir || null,
  });
}
