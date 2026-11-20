import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json({ pesan: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const paths = body?.paths;
  const bucket = body?.bucket || "referensi-kue";

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ urls: {} });
  }

  const supabase = getSupabaseAdmin();
  const urls = {};

  await Promise.all(
    paths.map(async (p) => {
      if (!p) return;
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(p, 3600);
      if (signed?.signedUrl) {
        urls[p] = signed.signedUrl;
      }
    })
  );

  return NextResponse.json({ urls });
}
