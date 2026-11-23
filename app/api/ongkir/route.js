import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { hitungJarakJalanKm, cariTarif, validasiKoordinat } from "@/lib/ongkir";

export async function POST(request) {
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

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { pesan: "Format data request tidak valid." },
      { status: 400 }
    );
  }

  const { lat, lng } = body;

  if (!validasiKoordinat(lat, lng)) {
    return NextResponse.json(
      { pesan: "Koordinat lokasi tidak valid atau di luar wilayah Indonesia." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("lat_toko, lng_toko, faktor_jalan, maks_jarak_kirim_km")
    .eq("id", 1)
    .single();

  const { data: daftarTarif } = await supabase
    .from("tarif_jarak")
    .select("jarak_maks_km, tarif, aktif")
    .eq("aktif", true)
    .order("jarak_maks_km", { ascending: true });

  const latToko = pengaturan?.lat_toko !== null && pengaturan?.lat_toko !== undefined ? Number(pengaturan.lat_toko) : null;
  const lngToko = pengaturan?.lng_toko !== null && pengaturan?.lng_toko !== undefined ? Number(pengaturan.lng_toko) : null;
  const tarifAktif = daftarTarif || [];
  const maksKm = pengaturan?.maks_jarak_kirim_km !== null && pengaturan?.maks_jarak_kirim_km !== undefined ? Number(pengaturan.maks_jarak_kirim_km) : null;

  if (latToko === null || lngToko === null || !validasiKoordinat(latToko, lngToko) || tarifAktif.length === 0) {
    return NextResponse.json({
      jarak_km: 0,
      ongkir: 0,
      status: "tokoBelumDiatur",
      maks_km: maksKm,
    });
  }

  const faktor = pengaturan?.faktor_jalan ? Number(pengaturan.faktor_jalan) : 1.3;
  const jarak_km = hitungJarakJalanKm(latToko, lngToko, Number(lat), Number(lng), faktor);
  const hasil = cariTarif(jarak_km, tarifAktif, maksKm);

  return NextResponse.json({
    jarak_km,
    ongkir: hasil.tarif,
    status: hasil.status,
    maks_km: maksKm,
  });
}
