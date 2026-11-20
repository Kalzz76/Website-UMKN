import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getTanggalHariIniJakarta, hitungTanggalMinimal } from "@/lib/format";

export async function GET() {
  const supabase = await getSupabaseServer();

  const { data: toko } = await supabase
    .from("pengaturan_toko")
    .select("jam_buka, jam_tutup, kuota_harian, minimal_hari_pesan")
    .eq("id", 1)
    .single();

  const minimalHari = toko?.minimal_hari_pesan ?? 2;
  const kuotaHarian = toko?.kuota_harian ?? 5;
  const jamBuka = (toko?.jam_buka || "08:00").slice(0, 5);
  const jamTutup = (toko?.jam_tutup || "20:00").slice(0, 5);

  const tanggalMinimal = hitungTanggalMinimal(minimalHari);
  const hariIni = getTanggalHariIniJakarta();

  const { data: listTutup } = await supabase
    .from("tanggal_tutup")
    .select("tanggal, alasan");

  const { data: pesananAktif } = await supabase
    .from("pesanan")
    .select("tanggal_ambil")
    .gte("tanggal_ambil", hariIni)
    .neq("status_pesanan", "Dibatalkan");

  const kuotaPerTanggal = {};
  for (let i = 0; i < (pesananAktif || []).length; i++) {
    const tgl = pesananAktif[i].tanggal_ambil;
    kuotaPerTanggal[tgl] = (kuotaPerTanggal[tgl] || 0) + 1;
  }

  const tanggalPenuh = [];
  for (const tgl in kuotaPerTanggal) {
    if (kuotaPerTanggal[tgl] >= kuotaHarian) {
      tanggalPenuh.push(tgl);
    }
  }

  return NextResponse.json({
    tanggal_minimal: tanggalMinimal,
    tanggal_tutup: listTutup || [],
    tanggal_penuh: tanggalPenuh,
    jam_buka: jamBuka,
    jam_tutup: jamTutup,
    minimal_hari_pesan: minimalHari,
    kuota_harian: kuotaHarian,
  });
}
