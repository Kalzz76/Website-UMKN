import { NextResponse } from "next/server";
import { verifikasiSignatureKey } from "@/lib/midtrans";
import { sinkronkanStatusMidtrans } from "@/lib/midtransSinkron";

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

    const hasil = await sinkronkanStatusMidtrans({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      transactionStatus: transaction_status,
      paymentType: payment_type,
      fraudStatus: fraud_status,
    });

    if (!hasil.sukses && !hasil.sudahDiproses) {
      return NextResponse.json({ status: "error", pesan: hasil.pesan }, { status: 400 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ pesan: err.message }, { status: 500 });
  }
}
