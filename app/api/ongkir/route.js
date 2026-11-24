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

  const rawLat = body.lat !== undefined ? body.lat : body.lat_tujuan;
  const rawLng = body.lng !== undefined ? body.lng : body.lng_tujuan;

  if (rawLat === undefined || rawLng === undefined || !validasiKoordinat(rawLat, rawLng)) {
    return NextResponse.json(
      { pesan: "Koordinat lokasi tidak valid atau di luar wilayah Indonesia." },
      { status: 400 }
    );
  }

  const latTujuan = Number(rawLat);
  const lngTujuan = Number(rawLng);

  const supabase = getSupabaseAdmin();
  const { data: toko } = await supabase
    .from("pengaturan_toko")
    .select("lat_toko, lng_toko, faktor_jalan, maks_jarak_kirim_km")
    .eq("id", 1)
    .single();

  const { data: daftarTarif } = await supabase
    .from("tarif_jarak")
    .select("id, jarak_maks_km, tarif, aktif")
    .eq("aktif", true)
    .order("jarak_maks_km", { ascending: true });

  const latToko = toko?.lat_toko !== null && toko?.lat_toko !== undefined ? Number(toko.lat_toko) : null;
  const lngToko = toko?.lng_toko !== null && toko?.lng_toko !== undefined ? Number(toko.lng_toko) : null;
  const tarifAktif = daftarTarif || [];
  const maksKm = toko?.maks_jarak_kirim_km !== null && toko?.maks_jarak_kirim_km !== undefined ? Number(toko.maks_jarak_kirim_km) : null;

  if (latToko === null || lngToko === null || !validasiKoordinat(latToko, lngToko) || tarifAktif.length === 0) {
    return NextResponse.json({
      status: "tokoBelumDiatur",
      pesan: "Lokasi pengiriman toko belum dikonfigurasi oleh admin.",
      jarak_km: 0,
      ongkir: 0,
      maks_km: maksKm,
      maks_jarak_km: maksKm,
      estimasi: true,
    });
  }

  const faktor = toko?.faktor_jalan ? Number(toko.faktor_jalan) : 1.3;
  const jarak_km = hitungJarakJalanKm(latToko, lngToko, latTujuan, lngTujuan, faktor);
  const hasil = cariTarif(jarak_km, tarifAktif, maksKm);

  if (hasil.status === "diluarJangkauan") {
    return NextResponse.json({
      status: "diluarJangkauan",
      jarak_km,
      ongkir: 0,
      maks_km: maksKm,
      maks_jarak_km: maksKm,
      estimasi: true,
      pesan: `Alamat tujuan berada sejauh ${jarak_km} km, di luar jangkauan pengiriman maksimal.`,
    });
  }

  return NextResponse.json({
    status: hasil.status,
    jarak_km,
    ongkir: hasil.tarif,
    maks_km: maksKm,
    maks_jarak_km: maksKm,
    estimasi: true,
  });
}
