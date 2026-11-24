import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { cekStatusMidtrans } from "@/lib/midtrans";
import { sinkronkanStatusMidtrans } from "@/lib/midtransSinkron";

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

      const { data: bayarMenunggu } = await supabase
        .from("pembayaran")
        .select("*")
        .eq("id_pesanan", p.id)
        .eq("status", "Menunggu");

      if (bayarMenunggu && bayarMenunggu.length > 0) {
        for (const bayar of bayarMenunggu) {
          const orderId = bayar.midtrans_order_id || (bayar.bukti?.startsWith("midtrans-") ? bayar.bukti.replace("midtrans-", "") : null);
          if (orderId) {
            try {
              const statusRes = await cekStatusMidtrans(orderId);
              if (statusRes && statusRes.transaction_status) {
                await sinkronkanStatusMidtrans({
                  orderId: statusRes.order_id || orderId,
                  statusCode: statusRes.status_code,
                  grossAmount: statusRes.gross_amount,
                  transactionStatus: statusRes.transaction_status,
                  paymentType: statusRes.payment_type,
                  fraudStatus: statusRes.fraud_status,
                });
              }
            } catch {}
          }
        }
      }

      const { data: pesananTerkini } = await supabase
        .from("pesanan")
        .select("status_pesanan, status_bayar, jumlah_terbayar")
        .eq("id", p.id)
        .single();

      if (
        pesananTerkini &&
        pesananTerkini.status_pesanan === "Menunggu Pembayaran" &&
        pesananTerkini.status_bayar === "Belum Bayar" &&
        Number(pesananTerkini.jumlah_terbayar || 0) === 0
      ) {
        await supabase
          .from("pesanan")
          .update({
            status_pesanan: "Dibatalkan",
            dibatalkan_oleh: "Sistem",
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
  }

  return NextResponse.json({
    pesan: "Pemeriksaan cron pembatalan otomatis selesai.",
    dibatalkan: dibatalkanCount,
  });
}
