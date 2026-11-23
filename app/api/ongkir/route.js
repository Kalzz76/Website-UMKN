import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import {
  hitungJarakJalan,
  validasiKoordinat,
  cariTarifJarak,
} from "@/lib/ongkir";

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

  const body = await request.json();
  const latTujuan = Number(body.lat_tujuan);
  const lngTujuan = Number(body.lng_tujuan);

  if (!validasiKoordinat(latTujuan, lngTujuan)) {
    return NextResponse.json(
      { pesan: "Koordinat tujuan tidak valid untuk wilayah Indonesia." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: toko } = await supabase
    .from("pengaturan_toko")
    .select("lat_toko, lng_toko, faktor_jalan, maks_jarak_kirim_km")
    .eq("id", 1)
    .single();

  if (!toko || toko.lat_toko === null || toko.lng_toko === null) {
    return NextResponse.json({
      status: "tokoBelumDiatur",
      pesan: "Lokasi pengiriman toko belum dikonfigurasi oleh admin.",
    });
  }

  const latToko = Number(toko.lat_toko);
  const lngToko = Number(toko.lng_toko);
  const faktorJalan = Number(toko.faktor_jalan) || 1.3;
  const maksJarak = Number(toko.maks_jarak_kirim_km) || 20;

  if (!validasiKoordinat(latToko, lngToko)) {
    return NextResponse.json({
      status: "tokoBelumDiatur",
      pesan: "Koordinat lokasi toko tidak valid.",
    });
  }

  const jarakJalanKm = hitungJarakJalan(latToko, lngToko, latTujuan, lngTujuan, faktorJalan);

  if (jarakJalanKm > maksJarak) {
    return NextResponse.json({
      status: "diluarJangkauan",
      jarak_km: jarakJalanKm,
      maks_jarak_km: maksJarak,
      pesan: `Alamat tujuan berada sejauh ${jarakJalanKm} km, melebihi batas jangkauan maksimal pengiriman toko (${maksJarak} km).`,
    });
  }

  const { data: daftarTarif } = await supabase
    .from("tarif_jarak")
    .select("id, jarak_maks_km, tarif, aktif")
    .eq("aktif", true)
    .order("jarak_maks_km", { ascending: true });

  const tarifOngkir = cariTarifJarak(jarakJalanKm, daftarTarif || [], maksJarak);

  if (tarifOngkir === null) {
    return NextResponse.json({
      status: "diluarJangkauan",
      jarak_km: jarakJalanKm,
      maks_jarak_km: maksJarak,
      pesan: `Tidak ditemukan tier tarif ongkir untuk jarak ${jarakJalanKm} km.`,
    });
  }

  return NextResponse.json({
    status: "ok",
    jarak_km: jarakJalanKm,
    ongkir: tarifOngkir,
    estimasi: true,
  });
}
