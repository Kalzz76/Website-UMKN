import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request, { params }) {
  const { user, profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Anda tidak memiliki izin untuk mengonfirmasi pembayaran." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const idPembayaran = Number(id);

  if (!idPembayaran) {
    return NextResponse.json(
      { pesan: "ID pembayaran tidak valid." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  const { data: bayar } = await supabase
    .from("pembayaran")
    .select("*, pesanan(*)")
    .eq("id", idPembayaran)
    .single();

  if (!bayar) {
    return NextResponse.json(
      { pesan: "Data pembayaran tidak ditemukan." },
      { status: 404 }
    );
  }

  const pesanan = bayar.pesanan;
  const isStaf = profil.role === "staf";

  if (bayar.midtrans_order_id || bayar.snap_token || bayar.bukti?.startsWith("midtrans-")) {
    return NextResponse.json(
      { pesan: "Pembayaran Midtrans diverifikasi otomatis oleh webhook sistem dan tidak dapat dikonfirmasi manual." },
      { status: 400 }
    );
  }

  if (isStaf) {
    if (aksi === "tolak") {
      return NextResponse.json(
        { pesan: "Staf tidak memiliki izin untuk menolak pembayaran." },
        { status: 403 }
      );
    }
    if (bayar.metode !== "Tunai di Tempat" || pesanan?.metode_pengiriman !== "Ambil") {
      return NextResponse.json(
        { pesan: "Staf hanya boleh mengonfirmasi pelunasan tunai di tempat untuk pesanan yang diambil di toko." },
        { status: 403 }
      );
    }
  }

  if (aksi === "konfirmasi") {
    await supabase
      .from("pembayaran")
      .update({
        status: "Dikonfirmasi",
        id_pengonfirmasi: user.id,
      })
      .eq("id", idPembayaran);

    const { data: allConfirmed } = await supabase
      .from("pembayaran")
      .select("jumlah")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Dikonfirmasi");

    let totalTerbayar = 0;
    if (allConfirmed) {
      for (let i = 0; i < allConfirmed.length; i++) {
        totalTerbayar += allConfirmed[i].jumlah || 0;
      }
    }

    let statusBayarBaru = "Belum Bayar";
    if (totalTerbayar >= pesanan.total_bayar) {
      statusBayarBaru = "Lunas";
    } else if (totalTerbayar > 0) {
      statusBayarBaru = "DP Dibayar";
    }

    let statusPesananBaru = pesanan.status_pesanan;
    if (pesanan.status_pesanan === "Menunggu Pembayaran" && totalTerbayar > 0) {
      statusPesananBaru = "Diterima";
    }

    await supabase
      .from("pesanan")
      .update({
        jumlah_terbayar: totalTerbayar,
        status_bayar: statusBayarBaru,
        status_pesanan: statusPesananBaru,
      })
      .eq("id", pesanan.id);

    const peranLabel = isStaf ? "petugas/staf" : "admin";
    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesanan.id,
      keterangan: `Pembayaran ${bayar.jenis} sebesar Rp ${Number(bayar.jumlah).toLocaleString("id-ID")} dikonfirmasi ${peranLabel} (${statusBayarBaru})`,
      id_user: user.id,
    });

    return NextResponse.json({
      pesan: "Pembayaran berhasil dikonfirmasi.",
    });
  }

  if (aksi === "tolak") {
    await supabase
      .from("pembayaran")
      .update({
        status: "Ditolak",
        id_pengonfirmasi: user.id,
      })
      .eq("id", idPembayaran);

    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesanan.id,
      keterangan: `Pembayaran ${bayar.jenis} sebesar Rp ${Number(bayar.jumlah).toLocaleString("id-ID")} ditolak admin`,
      id_user: user.id,
    });

    return NextResponse.json({
      pesan: "Pembayaran berhasil ditolak.",
    });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}
