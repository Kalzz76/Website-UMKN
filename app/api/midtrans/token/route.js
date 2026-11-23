import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { buatSnapToken } from "@/lib/midtrans";

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
    const { kode_pesanan, jenis_bayar = "Lunas" } = body;

    if (!kode_pesanan) {
      return NextResponse.json(
        { pesan: "Kode pesanan wajib disertakan." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: pesanan, error: pError } = await supabase
      .from("pesanan")
      .select("*")
      .eq("kode_pesanan", kode_pesanan)
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

    if (["Selesai", "Dibatalkan"].includes(pesanan.status_pesanan)) {
      return NextResponse.json(
        { pesan: `Pesanan telah ${pesanan.status_pesanan.toLowerCase()} dan tidak dapat dibayar.` },
        { status: 400 }
      );
    }

    if (pesanan.status_bayar === "Lunas") {
      return NextResponse.json(
        { pesan: "Pesanan ini sudah lunas." },
        { status: 400 }
      );
    }

    const sisa = Math.max(0, pesanan.total_bayar - (pesanan.jumlah_terbayar || 0));
    let nominalBayar = 0;
    let labelJenis = "Lunas";

    if (jenis_bayar === "DP") {
      if (pesanan.jumlah_terbayar > 0) {
        return NextResponse.json(
          { pesan: "DP sudah dibayar sebelumnya. Silakan pilih Pelunasan." },
          { status: 400 }
        );
      }
      nominalBayar = pesanan.jumlah_dp || Math.round(pesanan.total_bayar * 0.5);
      labelJenis = "DP";
    } else if (jenis_bayar === "Pelunasan") {
      nominalBayar = sisa;
      labelJenis = "Pelunasan";
    } else {
      nominalBayar = sisa > 0 ? sisa : pesanan.total_bayar;
      labelJenis = pesanan.jumlah_terbayar > 0 ? "Pelunasan" : "Lunas";
    }

    if (nominalBayar <= 0) {
      return NextResponse.json(
        { pesan: "Nominal pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const midtransOrderId = `${pesanan.kode_pesanan}-${labelJenis.toUpperCase()}-${Date.now()}`;

    const snapResult = await buatSnapToken({
      orderId: midtransOrderId,
      grossAmount: nominalBayar,
      nama: pesanan.nama_penerima,
      noWa: pesanan.no_wa,
      itemDetails: [
        {
          id: pesanan.kode_pesanan,
          price: nominalBayar,
          quantity: 1,
          name: `Pesanan ${pesanan.kode_pesanan} (${labelJenis})`,
        },
      ],
    });

    return NextResponse.json({
      sukses: true,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      nominal: nominalBayar,
      jenis_bayar: labelJenis,
      order_id: midtransOrderId,
    });
  } catch (err) {
    return NextResponse.json(
      { pesan: err.message || "Gagal memproses pembayaran Midtrans." },
      { status: 500 }
    );
  }
}
