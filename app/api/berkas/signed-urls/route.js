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
  const requestedBucket = body?.bucket;

  if (requestedBucket && requestedBucket !== "referensi-kue") {
    return NextResponse.json(
      { pesan: "Bucket tidak diizinkan." },
      { status: 400 }
    );
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ urls: {} });
  }

  if (paths.length > 30) {
    return NextResponse.json(
      { pesan: "Maksimal 30 berkas per permintaan." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: prof } = await supabase
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdminOrStaf = prof && (prof.role === "admin" || prof.role === "staf");

  let allowedPaths = new Set();

  if (isAdminOrStaf) {
    for (let i = 0; i < paths.length; i++) {
      if (paths[i]) allowedPaths.add(paths[i]);
    }
  } else {
    const { data: keranjangRows } = await supabase
      .from("keranjang_item")
      .select("foto_preview, foto_bentuk_kustom, foto_gambar_kustom")
      .eq("id_pelanggan", user.id);

    if (keranjangRows) {
      for (let i = 0; i < keranjangRows.length; i++) {
        const r = keranjangRows[i];
        if (r.foto_preview) allowedPaths.add(r.foto_preview);
        if (r.foto_bentuk_kustom) allowedPaths.add(r.foto_bentuk_kustom);
        if (r.foto_gambar_kustom) allowedPaths.add(r.foto_gambar_kustom);
      }
    }

    const { data: pesananRows } = await supabase
      .from("pesanan")
      .select("id, foto_referensi, foto_preview, foto_bentuk_kustom, foto_gambar_kustom")
      .eq("id_pelanggan", user.id);

    const pesananIds = [];
    if (pesananRows) {
      for (let i = 0; i < pesananRows.length; i++) {
        const p = pesananRows[i];
        pesananIds.push(p.id);
        if (p.foto_referensi) allowedPaths.add(p.foto_referensi);
        if (p.foto_preview) allowedPaths.add(p.foto_preview);
        if (p.foto_bentuk_kustom) allowedPaths.add(p.foto_bentuk_kustom);
        if (p.foto_gambar_kustom) allowedPaths.add(p.foto_gambar_kustom);
      }
    }

    if (pesananIds.length > 0) {
      const { data: itemRows } = await supabase
        .from("pesanan_item")
        .select("foto_preview, foto_bentuk_kustom, foto_gambar_kustom")
        .in("id_pesanan", pesananIds);

      if (itemRows) {
        for (let i = 0; i < itemRows.length; i++) {
          const it = itemRows[i];
          if (it.foto_preview) allowedPaths.add(it.foto_preview);
          if (it.foto_bentuk_kustom) allowedPaths.add(it.foto_bentuk_kustom);
          if (it.foto_gambar_kustom) allowedPaths.add(it.foto_gambar_kustom);
        }
      }
    }
  }

  const urls = {};
  const pathsToSign = paths.filter((p) => p && allowedPaths.has(p));

  await Promise.all(
    pathsToSign.map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(p, 3600);
      if (signed?.signedUrl) {
        urls[p] = signed.signedUrl;
      }
    })
  );

  return NextResponse.json({ urls });
}
