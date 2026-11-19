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

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("batas_bayar_jam")
    .eq("id", 1)
    .single();

  const batasJam = pengaturan?.batas_bayar_jam ?? 24;
  const batasWaktu = new Date(Date.now() - batasJam * 60 * 60 * 1000).toISOString();

  const { data: pesananKadaluarsa } = await supabase
    .from("pesanan")
    .select("id, kode_pesanan")
    .eq("status_pesanan", "Menunggu Pembayaran")
    .eq("status_bayar", "Belum Bayar")
    .eq("jumlah_terbayar", 0)
    .lt("dibuat_pada", batasWaktu);

  let dibatalkanCount = 0;

  if (pesananKadaluarsa && pesananKadaluarsa.length > 0) {
    for (let i = 0; i < pesananKadaluarsa.length; i++) {
      const p = pesananKadaluarsa[i];
      await supabase
        .from("pesanan")
        .update({
          status_pesanan: "Dibatalkan",
          alasan_batal: "Batas waktu pembayaran telah habis (dibatalkan otomatis oleh sistem)",
        })
        .eq("id", p.id);

      await supabase.from("riwayat_pesanan").insert({
        id_pesanan: p.id,
        keterangan: "Dibatalkan Otomatis oleh Sistem (Batas Bayar Habis)",
        id_user: null,
      });

      dibatalkanCount++;
    }
  }

  return NextResponse.json({
    pesan: "Pemeriksaan cron pembatalan otomatis selesai.",
    dibatalkan: dibatalkanCount,
  });
}