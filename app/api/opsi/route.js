import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
  const { profil, diizinkan } = await cekRole(["admin"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin yang boleh mengelola opsi." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  if (aksi === "tambah_grup") {
    const { nama, urutan, wajib, jenis_pilihan, peran_visual } = body;

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama grup tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!["satu", "banyak"].includes(jenis_pilihan)) {
      return NextResponse.json(
        { pesan: "Jenis pilihan harus 'satu' atau 'banyak'." },
        { status: 400 }
      );
    }

    let peran = peran_visual;
    if (peran === "") {
      peran = null;
    }
    if (peran && !["badan", "ukuran", "krim", "topping"].includes(peran)) {
      return NextResponse.json(
        { pesan: "Peran visual tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("grup_opsi").insert({
      nama: nama.trim(),
      urutan: Number(urutan) || 0,
      wajib: Boolean(wajib),
      jenis_pilihan,
      peran_visual: peran,
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambahkan grup opsi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Grup opsi berhasil ditambahkan." });
  }

  if (aksi === "edit_grup") {
    const { id, nama, urutan, wajib, jenis_pilihan, peran_visual } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID grup tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama grup tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!["satu", "banyak"].includes(jenis_pilihan)) {
      return NextResponse.json(
        { pesan: "Jenis pilihan harus 'satu' atau 'banyak'." },
        { status: 400 }
      );
    }

    let peran = peran_visual;
    if (peran === "") {
      peran = null;
    }
    if (peran && !["badan", "ukuran", "krim", "topping"].includes(peran)) {
      return NextResponse.json(
        { pesan: "Peran visual tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("grup_opsi")
      .update({
        nama: nama.trim(),
        urutan: Number(urutan) || 0,
        wajib: Boolean(wajib),
        jenis_pilihan,
        peran_visual: peran,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengubah grup opsi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Grup opsi berhasil diperbarui." });
  }

  if (aksi === "hapus_grup") {
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID grup tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("grup_opsi").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus grup opsi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Grup opsi berhasil dihapus." });
  }

  if (aksi === "tambah_item") {
    const { id_grup, nama, harga, aktif, urutan, warna, kode_visual } = body;

    if (!id_grup) {
      return NextResponse.json(
        { pesan: "Grup opsi harus dipilih." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama opsi item tidak boleh kosong." },
        { status: 400 }
      );
    }

    const hargaAngka = Number(harga);
    if (isNaN(hargaAngka) || hargaAngka < 0) {
      return NextResponse.json(
        { pesan: "Harga harus berupa angka dan tidak boleh kurang dari 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("opsi_item").insert({
      id_grup,
      nama: nama.trim(),
      harga: Math.round(hargaAngka),
      aktif: aktif === undefined ? true : Boolean(aktif),
      urutan: Number(urutan) || 0,
      warna: warna ? warna.trim() : null,
      kode_visual: kode_visual ? kode_visual.trim() : null,
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambahkan item opsi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Item opsi berhasil ditambahkan." });
  }

  if (aksi === "edit_item") {
    const { id, nama, harga, aktif, urutan, warna, kode_visual } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID item tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama opsi item tidak boleh kosong." },
        { status: 400 }
      );
    }

    const hargaAngka = Number(harga);
    if (isNaN(hargaAngka) || hargaAngka < 0) {
      return NextResponse.json(
        { pesan: "Harga harus berupa angka dan tidak boleh kurang dari 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("opsi_item")
      .update({
        nama: nama.trim(),
        harga: Math.round(hargaAngka),
        aktif: Boolean(aktif),
        urutan: Number(urutan) || 0,
        warna: warna ? warna.trim() : null,
        kode_visual: kode_visual ? kode_visual.trim() : null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengubah item opsi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Item opsi berhasil diperbarui." });
  }

  if (aksi === "hapus_item") {
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID item tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("opsi_item").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus item opsi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Item opsi berhasil dihapus." });
  }

  if (aksi === "toggle_aktif_item") {
    const { id, aktif } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID item tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("opsi_item")
      .update({
        aktif: Boolean(aktif),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengubah status item: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Status aktif item berhasil diubah." });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}