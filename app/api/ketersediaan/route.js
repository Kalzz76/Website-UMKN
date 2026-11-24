import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { getTanggalHariIniJakarta, hitungTanggalMinimal } from "@/lib/format";
import { jamBukaTutupUntukTanggal } from "@/lib/jam";
import { hitungEstimasi } from "@/lib/estimasi";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tanggalParam = searchParams.get("tanggal") || "";
  const metodeParam = searchParams.get("metode") || "Ambil";

  const supabaseUser = await getSupabaseServer();
  const supabase = getSupabaseAdmin();

  const { data: toko } = await supabase
    .from("pengaturan_toko")
    .select("jam_buka, jam_tutup, jam_buka_senin_jumat, jam_tutup_senin_jumat, jam_buka_sabtu_minggu, jam_tutup_sabtu_minggu, kuota_harian, minimal_hari_pesan, minimal_hari_katalog, minimal_hari_siap")
    .eq("id", 1)
    .single();

  const minimalHariCustom = toko?.minimal_hari_pesan ?? 2;
  const minimalHariKatalog = toko?.minimal_hari_katalog ?? toko?.minimal_hari_siap ?? 1;
  const kuotaHarian = toko?.kuota_harian ?? 5;

  let jamBuka = (toko?.jam_buka_senin_jumat || toko?.jam_buka || "08:00").slice(0, 5);
  let jamTutup = (toko?.jam_tutup_senin_jumat || toko?.jam_tutup || "20:00").slice(0, 5);

  if (tanggalParam) {
    const jamKhusus = jamBukaTutupUntukTanggal(tanggalParam, toko);
    jamBuka = jamKhusus.buka;
    jamTutup = jamKhusus.tutup;
  }

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  let adaCustom = false;
  let adaKatalog = false;
  let customCountDiKeranjang = 0;

  if (user) {
    const { data: keranjang } = await supabase
      .from("keranjang_item")
      .select("jenis, jumlah")
      .eq("id_pelanggan", user.id);

    if (keranjang && keranjang.length > 0) {
      for (let i = 0; i < keranjang.length; i++) {
        if (keranjang[i].jenis === "Custom") {
          adaCustom = true;
          customCountDiKeranjang += 1;
        } else {
          adaKatalog = true;
        }
      }
    }
  }

  let minimalHari = minimalHariCustom;
  if (adaCustom && adaKatalog) {
    minimalHari = Math.max(minimalHariCustom, minimalHariKatalog);
  } else if (adaCustom && !adaKatalog) {
    minimalHari = minimalHariCustom;
  } else if (!adaCustom && adaKatalog) {
    minimalHari = minimalHariKatalog;
  }

  const tanggalMinimal = hitungTanggalMinimal(minimalHari);
  const hariIni = getTanggalHariIniJakarta();

  const { data: listTutup } = await supabase
    .from("tanggal_tutup")
    .select("tanggal, alasan");

  const { data: pesananAktif } = await supabase
    .from("pesanan")
    .select("id, tanggal_ambil")
    .gte("tanggal_ambil", hariIni)
    .neq("status_pesanan", "Dibatalkan");

  const pesananIds = (pesananAktif || []).map((p) => p.id);

  let customItemsPerPesanan = new Map();
  if (pesananIds.length > 0) {
    const { data: itemsAktif } = await supabase
      .from("pesanan_item")
      .select("id_pesanan, jenis")
      .in("id_pesanan", pesananIds)
      .eq("jenis", "Custom");

    if (itemsAktif) {
      for (let i = 0; i < itemsAktif.length; i++) {
        const idPes = itemsAktif[i].id_pesanan;
        customItemsPerPesanan.set(idPes, (customItemsPerPesanan.get(idPes) || 0) + 1);
      }
    }
  }

  const customPerTanggal = {};
  for (let i = 0; i < (pesananAktif || []).length; i++) {
    const p = pesananAktif[i];
    const tgl = p.tanggal_ambil;
    const count = customItemsPerPesanan.has(p.id)
      ? customItemsPerPesanan.get(p.id)
      : 1;
    customPerTanggal[tgl] = (customPerTanggal[tgl] || 0) + count;
  }

  const tanggalPenuh = [];
  if (!adaKatalog || adaCustom || !user) {
    const tambahCustom = customCountDiKeranjang > 0 ? customCountDiKeranjang : 1;
    for (const tgl in customPerTanggal) {
      if (customPerTanggal[tgl] + (adaCustom ? tambahCustom - 1 : 0) >= kuotaHarian) {
        tanggalPenuh.push(tgl);
      }
    }
  }

  const hasilEstimasi = hitungEstimasi({
    adaCustom,
    adaKatalog,
    metode: metodeParam,
    tanggalDiminta: tanggalParam,
    hariIni,
    pengaturan: toko,
    tanggalTutup: listTutup || [],
    tanggalPenuh,
  });

  return NextResponse.json({
    tanggal_minimal: tanggalMinimal,
    tanggal_tutup: listTutup || [],
    tanggal_penuh: tanggalPenuh,
    jam_buka: jamBuka,
    jam_tutup: jamTutup,
    jam_buka_senin_jumat: (toko?.jam_buka_senin_jumat || toko?.jam_buka || "08:00").slice(0, 5),
    jam_tutup_senin_jumat: (toko?.jam_tutup_senin_jumat || toko?.jam_tutup || "20:00").slice(0, 5),
    jam_buka_sabtu_minggu: (toko?.jam_buka_sabtu_minggu || toko?.jam_buka || "08:00").slice(0, 5),
    jam_tutup_sabtu_minggu: (toko?.jam_tutup_sabtu_minggu || toko?.jam_tutup || "20:00").slice(0, 5),
    minimal_hari_pesan: minimalHari,
    minimal_hari_custom: minimalHariCustom,
    minimal_hari_katalog: minimalHariKatalog,
    kuota_harian: kuotaHarian,
    ada_custom: adaCustom,
    ada_katalog: adaKatalog,
    ada_siap: adaKatalog,
    estimasi: {
      tanggalAwal: hasilEstimasi.tanggalAwal,
      tanggalAkhir: hasilEstimasi.tanggalAkhir,
      tanggalPasti: hasilEstimasi.tanggalPasti,
      valid: hasilEstimasi.valid,
      pesan: hasilEstimasi.pesan || "",
    },
  });
}
