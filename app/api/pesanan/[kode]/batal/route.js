import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { batalkanTransaksiMidtrans } from "@/lib/midtrans";

export async function POST(request, context) {
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

    const { kode } = await context.params;
    if (!kode) {
      return NextResponse.json(
        { pesan: "Kode pesanan wajib disertakan." },
        { status: 400 }
      );
    }

    let alasan = "";
    try {
      const body = await request.json();
      alasan = (body?.alasan || "").trim();
    } catch {}

    const supabase = getSupabaseAdmin();

    const { data: pesanan, error: pError } = await supabase
      .from("pesanan")
      .select("id, id_pelanggan, kode_pesanan, status_pesanan")
      .eq("kode_pesanan", kode)
      .single();

    if (pError || !pesanan) {
      return NextResponse.json(
        { pesan: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (pesanan.id_pelanggan !== user.id) {
      return NextResponse.json(
        { pesan: "Akses ditolak. Anda hanya dapat membatalkan pesanan milik Anda sendiri." },
        { status: 403 }
      );
    }

    if (pesanan.status_pesanan !== "Menunggu Pembayaran") {
      return NextResponse.json(
        { pesan: `Pesanan tidak dapat dibatalkan karena sudah dalam status ${pesanan.status_pesanan}.` },
        { status: 400 }
      );
    }

    const { data: bayarSukses } = await supabase
      .from("pembayaran")
      .select("id")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Dikonfirmasi")
      .limit(1);

    if (bayarSukses && bayarSukses.length > 0) {
      return NextResponse.json(
        { pesan: "Pesanan tidak dapat dibatalkan karena pembayaran telah dikonfirmasi." },
        { status: 400 }
      );
    }

    const { data: daftarBayarMenunggu } = await supabase
      .from("pembayaran")
      .select("id, midtrans_order_id")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Menunggu");

    if (daftarBayarMenunggu && daftarBayarMenunggu.length > 0) {
      for (let i = 0; i < daftarBayarMenunggu.length; i++) {
        const item = daftarBayarMenunggu[i];
        if (item.midtrans_order_id) {
          await batalkanTransaksiMidtrans(item.midtrans_order_id);
        }
      }

      await supabase
        .from("pembayaran")
        .update({ status: "Gagal" })
        .eq("id_pesanan", pesanan.id)
        .eq("status", "Menunggu");
    }

    const alasanFinal = alasan || "Dibatalkan oleh pelanggan";

    const { error: errUpdate } = await supabase
      .from("pesanan")
      .update({
        status_pesanan: "Dibatalkan",
        dibatalkan_oleh: "Pelanggan",
        alasan_batal: alasanFinal,
      })
      .eq("id", pesanan.id);

    if (errUpdate) {
      return NextResponse.json(
        { pesan: "Gagal membatalkan pesanan: " + errUpdate.message },
        { status: 500 }
      );
    }

    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesanan.id,
      keterangan: `Pesanan dibatalkan oleh pelanggan${alasan ? `: ${alasan}` : ""}`,
      id_user: user.id,
    });

    return NextResponse.json({
      sukses: true,
      pesan: "Pesanan berhasil dibatalkan.",
    });
  } catch (err) {
    return NextResponse.json(
      { pesan: "Terjadi kesalahan internal: " + err.message },
      { status: 500 }
    );
  }
}
