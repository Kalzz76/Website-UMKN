import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
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

  const supabase = getSupabaseAdmin();
  const formData = await request.formData();

  let id_pesanan = Number(formData.get("id_pesanan"));
  const kode_pesanan = formData.get("kode_pesanan");
  if (!id_pesanan && kode_pesanan) {
    const { data: p } = await supabase
      .from("pesanan")
      .select("id")
      .eq("kode_pesanan", kode_pesanan)
      .single();
    if (p) id_pesanan = p.id;
  }
  const jenis = formData.get("jenis") || "DP";
  const jumlah = Number(formData.get("jumlah"));
  const metode = formData.get("metode") || "Transfer Bank";
  const fileBukti = formData.get("bukti");

  if (!id_pesanan) {
    return NextResponse.json(
      { pesan: "ID pesanan tidak valid." },
      { status: 400 }
    );
  }

  const { data: pesanan } = await supabase
    .from("pesanan")
    .select("id, id_pelanggan, status_pesanan, status_bayar, total_bayar, jumlah_terbayar")
    .eq("id", id_pesanan)
    .single();

  if (!pesanan) {
    return NextResponse.json(
      { pesan: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: profil } = await supabase
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profil?.role === "admin";
  if (!isAdmin && pesanan.id_pelanggan !== user.id) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Pesanan bukan milik Anda." },
      { status: 403 }
    );
  }

  if (pesanan.status_pesanan === "Dibatalkan") {
    return NextResponse.json(
      { pesan: "Pesanan sudah dibatalkan, tidak dapat menerima pembayaran." },
      { status: 400 }
    );
  }

  if (!["DP", "Pelunasan", "Lunas"].includes(jenis)) {
    return NextResponse.json(
      { pesan: "Jenis pembayaran tidak valid." },
      { status: 400 }
    );
  }

  if (isNaN(jumlah) || jumlah <= 0) {
    return NextResponse.json(
      { pesan: "Jumlah pembayaran harus lebih dari 0." },
      { status: 400 }
    );
  }

  if (!["Transfer Bank", "QRIS", "Tunai di Tempat"].includes(metode)) {
    return NextResponse.json(
      { pesan: "Metode pembayaran tidak valid." },
      { status: 400 }
    );
  }

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("transfer_manual_aktif")
    .eq("id", 1)
    .single();

  if (metode !== "Tunai di Tempat" && !pengaturan?.transfer_manual_aktif) {
    return NextResponse.json(
      { pesan: "Pembayaran transfer manual dengan bukti transfer saat ini dinonaktifkan. Silakan selesaikan pembayaran melalui Midtrans." },
      { status: 400 }
    );
  }

  let bukti_path = null;
  if (metode !== "Tunai di Tempat") {
    if (!fileBukti || typeof fileBukti !== "object" || fileBukti.size === 0) {
      return NextResponse.json(
        { pesan: "File bukti pembayaran wajib diunggah." },
        { status: 400 }
      );
    }

    const tipeValid = ["image/jpeg", "image/jpg", "image/png"];
    if (!tipeValid.includes(fileBukti.type)) {
      return NextResponse.json(
        { pesan: "Format bukti transfer harus JPG, JPEG, atau PNG." },
        { status: 400 }
      );
    }

    if (fileBukti.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { pesan: "Ukuran bukti bayar tidak boleh melebihi 2 MB." },
        { status: 400 }
      );
    }

    const ekstensi = fileBukti.name.split(".").pop() || "jpg";
    const namaFile = `bayar-${pesanan.id}-${Date.now()}.${ekstensi}`;
    const bytes = await fileBukti.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: errUpload } = await supabase.storage
      .from("bukti-bayar")
      .upload(namaFile, buffer, {
        contentType: fileBukti.type,
      });

    if (errUpload) {
      return NextResponse.json(
        { pesan: "Gagal mengunggah bukti bayar: " + errUpload.message },
        { status: 500 }
      );
    }

    bukti_path = namaFile;
  }

  const { error: errInsert } = await supabase.from("pembayaran").insert({
    id_pesanan: pesanan.id,
    jenis,
    jumlah: Math.round(jumlah),
    metode,
    bukti: bukti_path,
    status: "Menunggu Konfirmasi",
  });

  if (errInsert) {
    return NextResponse.json(
      { pesan: "Gagal menyimpan data pembayaran: " + errInsert.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    pesan: "Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.",
  });
}