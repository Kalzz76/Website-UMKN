import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { cekStatusMidtrans } from "@/lib/midtrans";
import { sinkronkanStatusMidtrans } from "@/lib/midtransSinkron";

export async function POST(request) {
  try {
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
    const kode = body.kode || body.kode_pesanan;

    if (!kode) {
      return NextResponse.json(
        { pesan: "Kode pesanan wajib disertakan." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: pesanan, error: pError } = await supabase
      .from("pesanan")
      .select("*")
      .eq("kode_pesanan", kode)
      .single();

    if (pError || !pesanan) {
      return NextResponse.json(
        { pesan: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data: prof } = await supabase
      .from("profil")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdminOrStaf = prof && (prof.role === "admin" || prof.role === "staf");
    const isOwner = pesanan.id_pelanggan === user.id;

    if (!isAdminOrStaf && !isOwner) {
      return NextResponse.json(
        { pesan: "Akses ditolak. Pesanan ini bukan milik Anda." },
        { status: 403 }
      );
    }

    const { data: daftarMenunggu } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Menunggu");

    if (daftarMenunggu && daftarMenunggu.length > 0) {
      for (const bayar of daftarMenunggu) {
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

    const { data: pesananTerbaru } = await supabase
      .from("pesanan")
      .select("*")
      .eq("id", pesanan.id)
      .single();

    const { data: pembayaranTerbaru } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .order("dibuat_pada", { ascending: false });

    return NextResponse.json({
      sukses: true,
      pesanan: pesananTerbaru,
      pembayaran: pembayaranTerbaru || [],
      status_pesanan: pesananTerbaru?.status_pesanan,
      status_bayar: pesananTerbaru?.status_bayar,
      jumlah_terbayar: pesananTerbaru?.jumlah_terbayar,
    });
  } catch (err) {
    return NextResponse.json(
      { pesan: err.message || "Gagal memeriksa status pembayaran." },
      { status: 500 }
    );
  }
}
