import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json({ jumlah: 0 });
  }

  const supabase = getSupabaseAdmin();

  const { data: items, error } = await supabase
    .from("keranjang_item")
    .select("jumlah")
    .eq("id_pelanggan", user.id);

  if (error || !items) {
    return NextResponse.json({ jumlah: 0 });
  }

  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += Number(items[i].jumlah || 1);
  }

  return NextResponse.json({ jumlah: total });
}
