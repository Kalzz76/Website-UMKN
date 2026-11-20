import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifikasiSignatureKey } from "@/lib/midtrans";
import { formatRupiah } from "@/lib/format";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ pesan: "Data notifikasi tidak lengkap." }, { status: 400 });
    }

    const valid = verifikasiSignatureKey({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    });

    if (!valid) {
      return NextResponse.json({ pesan: "Signature key tidak valid." }, { status: 403 });
    }

    const parts = String(order_id).split("-");
    if (parts.length < 3) {
      return NextResponse.json({ pesan: "Format order_id tidak dikenali." }, { status: 400 });
    }

    const kodePesanan = `${parts[0]}-${parts[1]}`;
    const jenisRaw = parts[2].toUpperCase();

    let jenisBayar = "Lunas";
    if (jenisRaw === "DP") {
      jenisBayar = "DP";
    } else if (jenisRaw === "PELUNASAN") {
      jenisBayar = "Pelunasan";
    }

    const supabase = getSupabaseAdmin();

    const { data: pesanan, error: pError } = await supabase
      .from("pesanan")
      .select("*")
      .eq("kode_pesanan", kodePesanan)
      .single();

    if (pError || !pesanan) {
      return NextResponse.json({ pesan: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    const isSukses =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    if (isSukses) {
      const nominalAngka = Math.round(Number(gross_amount));

      let metodeDb = "Transfer Bank";
      const ptLower = (payment_type || "").toLowerCase();
      if (ptLower.includes("qris") || ptLower.includes("gopay") || ptLower.includes("shopeepay")) {
        metodeDb = "QRIS";
      }

      const { data: existingBayar } = await supabase
        .from("pembayaran")
        .select("id")
        .eq("id_pesanan", pesanan.id)
        .eq("bukti", `midtrans-${order_id}`)
        .maybeSingle();

      if (!existingBayar) {
        await supabase.from("pembayaran").insert({
          id_pesanan: pesanan.id,
          jenis: jenisBayar,
          jumlah: nominalAngka,
          metode: metodeDb,
          bukti: `midtrans-${order_id}`,
          status: "Dikonfirmasi",
        });

        const totalTerbayarBaru = Math.min(
          pesanan.total_bayar,
          (pesanan.jumlah_terbayar || 0) + nominalAngka
        );

        let statusBaru = pesanan.status_bayar;
        if (totalTerbayarBaru >= pesanan.total_bayar) {
          statusBaru = "Lunas";
        } else if (totalTerbayarBaru > 0) {
          statusBaru = "DP Dibayar";
        }

        let statusPesananBaru = pesanan.status_pesanan;
        if (pesanan.status_pesanan === "Menunggu Pembayaran") {
          statusPesananBaru = "Diterima";
        }

        await supabase
          .from("pesanan")
          .update({
            jumlah_terbayar: totalTerbayarBaru,
            status_bayar: statusBaru,
            status_pesanan: statusPesananBaru,
          })
          .eq("id", pesanan.id);

        await supabase.from("riwayat_pesanan").insert({
          id_pesanan: pesanan.id,
          keterangan: `Pembayaran ${jenisBayar} sebesar ${formatRupiah(
            nominalAngka
          )} via Midtrans (${payment_type || "Online"}) berhasil diverifikasi otomatis.`,
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ pesan: err.message }, { status: 500 });
  }
}
