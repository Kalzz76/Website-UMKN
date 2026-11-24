import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request, { params }) {
  const { user, profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Anda tidak memiliki izin untuk mengubah status." },
      { status: 403 }
    );
  }

  const { kode } = await params;
  const kodePesanan = kode;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const status_baru = body.status_baru || body.status_pesanan;
  const alasan_batal = body.alasan_batal;

  const { data: pesanan } = await supabase
    .from("pesanan")
    .select("*")
    .eq("kode_pesanan", kodePesanan)
    .single();

  if (!pesanan) {
    return NextResponse.json(
      { pesan: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: items } = await supabase
    .from("pesanan_item")
    .select("id, jenis")
    .eq("id_pesanan", pesanan.id);

  const adaCustom = (items || []).some((it) => it.jenis === "Custom") || (items?.length === 0 && Boolean(pesanan.tulisan_kue || pesanan.desain_json));
  const statusLama = pesanan.status_pesanan;
  const isAdmin = profil.role === "admin";

  if (status_baru === "Sedang Dibuat") {
    if (!adaCustom) {
      return NextResponse.json(
        { pesan: "Pesanan yang hanya berisi katalog tidak melalui tahap 'Sedang Dibuat'. Ubah langsung ke 'Siap'." },
        { status: 400 }
      );
    }
    if (statusLama !== "Diterima") {
      return NextResponse.json(
        { pesan: `Status tidak dapat diubah dari "${statusLama}" ke "Sedang Dibuat".` },
        { status: 400 }
      );
    }
  } else if (status_baru === "Siap") {
    if (adaCustom) {
      if (statusLama !== "Sedang Dibuat") {
        return NextResponse.json(
          { pesan: 'Pesanan kue custom harus berstatus "Sedang Dibuat" sebelum dapat ditandai "Siap".' },
          { status: 400 }
        );
      }
    } else {
      if (statusLama !== "Diterima") {
        return NextResponse.json(
          { pesan: 'Pesanan katalog harus berstatus "Diterima" sebelum dapat ditandai "Siap".' },
          { status: 400 }
        );
      }
    }
  } else if (status_baru === "Dikirim") {
    if (statusLama !== "Siap") {
      return NextResponse.json(
        { pesan: "Pesanan harus berstatus 'Siap' sebelum dapat dikirim." },
        { status: 400 }
      );
    }
    if (pesanan.metode_pengiriman !== "Kirim") {
      return NextResponse.json(
        { pesan: "Pesanan ini menggunakan metode Ambil di Toko, bukan Kirim." },
        { status: 400 }
      );
    }
    if (pesanan.status_bayar !== "Lunas") {
      return NextResponse.json(
        { pesan: "Pesanan belum lunas. Tagihan harus dilunasi sebelum kue dikirim." },
        { status: 400 }
      );
    }
  } else if (status_baru === "Selesai") {
    if (pesanan.status_bayar !== "Lunas") {
      return NextResponse.json(
        { pesan: "Pesanan belum lunas. Tagihan harus dilunasi sebelum pesanan diselesaikan." },
        { status: 400 }
      );
    }
    if (pesanan.metode_pengiriman === "Ambil") {
      if (statusLama !== "Siap") {
        return NextResponse.json(
          { pesan: "Pesanan ambil di toko harus berstatus 'Siap' sebelum diselesaikan." },
          { status: 400 }
        );
      }
    } else {
      if (statusLama !== "Dikirim") {
        return NextResponse.json(
          { pesan: "Pesanan kirim harus berstatus 'Dikirim' sebelum diselesaikan." },
          { status: 400 }
        );
      }
    }
  } else if (status_baru === "Dibatalkan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Staf tidak memiliki hak akses untuk membatalkan pesanan." },
        { status: 403 }
      );
    }
    if (!["Menunggu Pembayaran", "Diterima"].includes(statusLama)) {
      return NextResponse.json(
        { pesan: "Pesanan yang sudah atau sedang diproduksi tidak dapat dibatalkan." },
        { status: 400 }
      );
    }
    if (!alasan_batal || alasan_batal.trim() === "") {
      return NextResponse.json(
        { pesan: "Alasan pembatalan wajib diisi." },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { pesan: "Status baru tidak valid." },
      { status: 400 }
    );
  }

  const updateData = { status_pesanan: status_baru };
  if (status_baru === "Dibatalkan") {
    updateData.alasan_batal = alasan_batal.trim();
    updateData.dibatalkan_oleh = "Admin";
  }

  await supabase
    .from("pesanan")
    .update(updateData)
    .eq("id", pesanan.id);

  let ket = `${statusLama} → ${status_baru}`;
  if (status_baru === "Dibatalkan") {
    ket = `Dibatalkan oleh admin (Alasan: ${alasan_batal.trim()})`;
  }

  await supabase.from("riwayat_pesanan").insert({
    id_pesanan: pesanan.id,
    keterangan: ket,
    id_user: user.id,
  });

  return NextResponse.json({
    pesan: `Status pesanan berhasil diubah menjadi ${status_baru}.`,
  });
}
