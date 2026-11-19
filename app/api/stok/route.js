import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  const isAdmin = profil.role === "admin";
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  if (aksi === "sesuaikan_jumlah") {
    const { id, perubahan } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID bahan tidak valid." },
        { status: 400 }
      );
    }

    const { data: b } = await supabase
      .from("bahan")
      .select("jumlah")
      .eq("id", id)
      .single();

    if (!b) {
      return NextResponse.json(
        { pesan: "Bahan tidak ditemukan." },
        { status: 404 }
      );
    }

    const nilaiPerubahan = Number(perubahan);
    if (isNaN(nilaiPerubahan)) {
      return NextResponse.json(
        { pesan: "Nilai perubahan harus angka valid." },
        { status: 400 }
      );
    }

    const jumlahBaru = Number(b.jumlah) + nilaiPerubahan;
    if (jumlahBaru < 0) {
      return NextResponse.json(
        { pesan: "Jumlah stok tidak boleh kurang dari 0." },
        { status: 400 }
      );
    }

    await supabase
      .from("bahan")
      .update({ jumlah: jumlahBaru })
      .eq("id", id);

    return NextResponse.json({
      pesan: "Jumlah stok bahan berhasil diperbarui.",
    });
  }

  if (aksi === "tambah_bahan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Hanya admin yang boleh menambah bahan baru." },
        { status: 403 }
      );
    }

    const { nama, satuan, jumlah, batas_minimum } = body;

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!satuan || satuan.trim() === "") {
      return NextResponse.json(
        { pesan: "Satuan bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const j = Number(jumlah);
    const bm = Number(batas_minimum);

    if (isNaN(j) || j < 0) {
      return NextResponse.json(
        { pesan: "Jumlah awal harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    if (isNaN(bm) || bm < 0) {
      return NextResponse.json(
        { pesan: "Batas minimum harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("bahan").insert({
      nama: nama.trim(),
      satuan: satuan.trim(),
      jumlah: j,
      batas_minimum: bm,
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambahkan bahan: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Bahan berhasil ditambahkan.",
    });
  }

  if (aksi === "edit_bahan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Hanya admin yang boleh mengubah informasi bahan." },
        { status: 403 }
      );
    }

    const { id, nama, satuan, batas_minimum } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID bahan tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!satuan || satuan.trim() === "") {
      return NextResponse.json(
        { pesan: "Satuan bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const bm = Number(batas_minimum);
    if (isNaN(bm) || bm < 0) {
      return NextResponse.json(
        { pesan: "Batas minimum harus angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("bahan")
      .update({
        nama: nama.trim(),
        satuan: satuan.trim(),
        batas_minimum: bm,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal memperbarui bahan: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Informasi bahan berhasil diperbarui.",
    });
  }

  if (aksi === "hapus_bahan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Hanya admin yang boleh menghapus bahan." },
        { status: 403 }
      );
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID bahan tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("bahan").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus bahan: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Bahan berhasil dihapus.",
    });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}