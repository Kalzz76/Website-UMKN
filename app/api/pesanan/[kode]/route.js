import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  const unwrapped = await params;
  const kode = unwrapped?.kode;
  if (!kode) {
    return NextResponse.json(
      { pesan: "Kode pesanan wajib diisi." },
      { status: 400 }
    );
  }

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

  const { data: pesanan, error: pError } = await supabase
    .from("pesanan")
    .select("*, zona_ongkir(nama)")
    .eq("kode_pesanan", kode)
    .single();

  if (pError || !pesanan) {
    return NextResponse.json(
      { pesan: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const [pilRes, bayarRes, riwRes] = await Promise.all([
    supabase
      .from("pesanan_pilihan")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .order("id", { ascending: true }),
    supabase
      .from("pembayaran")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("riwayat_pesanan")
      .select("*, profil(nama)")
      .eq("id_pesanan", pesanan.id)
      .order("dibuat_pada", { ascending: false }),
  ]);

  let fotoPrevUrl = null;
  let fotoRefUrl = null;
  let fotoBentukUrl = null;
  let fotoGambarUrl = null;

  if (pesanan.foto_preview) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_preview, 3600);
    if (signed) fotoPrevUrl = signed.signedUrl;
  }

  if (pesanan.foto_referensi) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_referensi, 3600);
    if (signed) fotoRefUrl = signed.signedUrl;
  }

  if (pesanan.foto_bentuk_kustom) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_bentuk_kustom, 3600);
    if (signed) fotoBentukUrl = signed.signedUrl;
  }

  if (pesanan.foto_gambar_kustom) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_gambar_kustom, 3600);
    if (signed) fotoGambarUrl = signed.signedUrl;
  }

  const bayarWithUrl = [];
  const bayarList = bayarRes.data || [];
  for (let i = 0; i < bayarList.length; i++) {
    const item = bayarList[i];
    let url = null;
    if (item.bukti) {
      const { data: signed } = await supabase.storage
        .from("bukti-bayar")
        .createSignedUrl(item.bukti, 3600);
      if (signed) url = signed.signedUrl;
    }
    bayarWithUrl.push({ ...item, buktiUrl: url });
  }

  return NextResponse.json({
    sukses: true,
    pesanan,
    pilihan: pilRes.data || [],
    pembayaran: bayarWithUrl,
    riwayat: riwRes.data || [],
    urls: {
      fotoPreview: fotoPrevUrl,
      fotoReferensi: fotoRefUrl,
      fotoBentukKustom: fotoBentukUrl,
      fotoGambarKustom: fotoGambarUrl,
    },
  });
}
