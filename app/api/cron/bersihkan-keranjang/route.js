import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { pesan: "Akses cron ditolak." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: fileList, error } = await supabase.rpc("bersihkan_keranjang", {
    p_hari: 30,
  });

  let fileDihapusCount = 0;

  if (!error && Array.isArray(fileList)) {
    const paths = [];
    for (let i = 0; i < fileList.length; i++) {
      const row = fileList[i];
      if (row.foto_preview) paths.push(row.foto_preview);
      if (row.foto_bentuk_kustom) paths.push(row.foto_bentuk_kustom);
      if (row.foto_gambar_kustom) paths.push(row.foto_gambar_kustom);
    }

    if (paths.length > 0) {
      await supabase.storage.from("referensi-kue").remove(paths);
      fileDihapusCount = paths.length;
    }
  }

  return NextResponse.json({
    pesan: "Pembersihan keranjang lama selesai.",
    file_dihapus: fileDihapusCount,
  });
}
