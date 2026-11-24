import { getSupabaseAdmin } from "./supabaseServer";
import { cekStatusMidtrans } from "./midtrans";
import { sinkronkanStatusMidtrans } from "./midtransSinkron";

let terakhirCek = 0;
const JEDA_MS = 5 * 60 * 1000;

export async function batalkanKedaluwarsa(force = false) {
  const sekarang = Date.now();
  if (!force && sekarang - terakhirCek < JEDA_MS) {
    return { dibatalkan: 0, lewati: true };
  }
  terakhirCek = sekarang;

  const supabase = getSupabaseAdmin();

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("batas_bayar_jam")
    .eq("id", 1)
    .single();

  const batasJam = Number(pengaturan?.batas_bayar_jam ?? 24);
  const batasWaktu = new Date(sekarang - batasJam * 60 * 60 * 1000).toISOString();

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
          const orderId =
            bayar.midtrans_order_id ||
            (bayar.bukti?.startsWith("midtrans-")
              ? bayar.bukti.replace("midtrans-", "")
              : null);

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
            alasan_batal:
              "Batas waktu pembayaran telah habis (dibatalkan otomatis oleh sistem)",
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

  return { dibatalkan: dibatalkanCount, lewati: false };
}
