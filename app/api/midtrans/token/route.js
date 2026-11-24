import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { buatSnapToken } from "@/lib/midtrans";
import { cekRateLimit } from "@/lib/rateLimit";

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

    const { diizinkan, tungguDetik } = cekRateLimit(`snap:${user.id}`, 8, 30000);
    if (!diizinkan) {
      return NextResponse.json(
        { pesan: `Terlalu banyak permintaan token pembayaran. Silakan tunggu ${tungguDetik} detik.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const kode = body.kode || body.kode_pesanan;
    const jenisInput = body.jenis || body.jenis_bayar || "Lunas";

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

    const { data: pengaturan } = await supabase
      .from("pengaturan_toko")
      .select("batas_bayar_jam")
      .eq("id", 1)
      .single();

    const batasJam = Number(pengaturan?.batas_bayar_jam ?? 24);
    const dibuatMs = new Date(pesanan.dibuat_pada).getTime();
    const sisaMenit = Math.floor((dibuatMs + batasJam * 3600000 - Date.now()) / 60000);

    if (sisaMenit <= 0) {
      return NextResponse.json(
        { pesan: "Batas waktu pembayaran telah habis." },
        { status: 400 }
      );
    }

    const sisa = Math.max(0, pesanan.total_bayar - (pesanan.jumlah_terbayar || 0));
    let nominalBayar = 0;
    let labelJenis = "Lunas";

    if (pesanan.status_bayar === "DP Dibayar" || jenisInput === "Pelunasan") {
      nominalBayar = sisa;
      labelJenis = "Pelunasan";
    } else if (jenisInput === "DP") {
      if ((pesanan.jumlah_terbayar || 0) > 0) {
        return NextResponse.json(
          { pesan: "DP sudah dibayar sebelumnya. Silakan pilih Pelunasan." },
          { status: 400 }
        );
      }
      nominalBayar = pesanan.jumlah_dp || pesanan.total_bayar;
      labelJenis = "DP";
    } else {
      nominalBayar = pesanan.total_bayar;
      labelJenis = "Lunas";
    }

    if (nominalBayar <= 0) {
      return NextResponse.json(
        { pesan: "Nominal pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const { data: bayarMenunggu } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Menunggu")
      .eq("jenis", labelJenis)
      .order("dibuat_pada", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bayarMenunggu && bayarMenunggu.snap_token) {
      const dibuatBayarMs = new Date(bayarMenunggu.dibuat_pada).getTime();
      const sisaBayarMenit = Math.floor((dibuatBayarMs + batasJam * 3600000 - Date.now()) / 60000);
      if (sisaBayarMenit > 0) {
        return NextResponse.json({
          sukses: true,
          token: bayarMenunggu.snap_token,
          nominal: Number(bayarMenunggu.jumlah),
          jenis_bayar: labelJenis,
          order_id: bayarMenunggu.midtrans_order_id,
        });
      }
    }

    const { count } = await supabase
      .from("pembayaran")
      .select("id", { count: "exact", head: true })
      .eq("id_pesanan", pesanan.id);

    const nomorUrut = (count || 0) + 1;
    const midtransOrderId = `${pesanan.kode_pesanan}-${labelJenis.toUpperCase()}-${nomorUrut}`;

    const snapResult = await buatSnapToken({
      orderId: midtransOrderId,
      grossAmount: nominalBayar,
      nama: pesanan.nama_penerima,
      noWa: pesanan.no_wa,
      email: user.email,
      customExpiryMinute: sisaMenit,
      itemDetails: [
        {
          id: pesanan.kode_pesanan,
          price: nominalBayar,
          quantity: 1,
          name: `Pesanan ${pesanan.kode_pesanan} (${labelJenis})`,
        },
      ],
    });

    await supabase.from("pembayaran").insert({
      id_pesanan: pesanan.id,
      jenis: labelJenis,
      jumlah: nominalBayar,
      metode: "QRIS",
      bukti: `midtrans-${midtransOrderId}`,
      midtrans_order_id: midtransOrderId,
      snap_token: snapResult.token,
      status: "Menunggu",
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
