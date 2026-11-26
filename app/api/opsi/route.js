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
    const { nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard } = body;

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
    if (peran && !["badan", "ukuran", "krim", "topping", "bentuk", "stiker"].includes(peran)) {
      return NextResponse.json(
        { pesan: "Peran visual tidak valid." },
        { status: 400 }
      );
    }

    let peranDash = peran_dashboard;
    if (peranDash === "") {
      peranDash = null;
    }
    if (peranDash && !["jenis", "terlaris"].includes(peranDash)) {
      return NextResponse.json(
        { pesan: "Peran dashboard tidak valid." },
        { status: 400 }
      );
    }

    if (peranDash) {
      await supabase
        .from("grup_opsi")
        .update({ peran_dashboard: null })
        .eq("peran_dashboard", peranDash);
    }

    const { error } = await supabase.from("grup_opsi").insert({
      nama: nama.trim(),
      urutan: Number(urutan) || 0,
      wajib: Boolean(wajib),
      jenis_pilihan,
      peran_visual: peran,
      peran_dashboard: peranDash,
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
    const { id, nama, urutan, wajib, jenis_pilihan, peran_visual, peran_dashboard } = body;

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
    if (peran && !["badan", "ukuran", "krim", "topping", "bentuk", "stiker"].includes(peran)) {
      return NextResponse.json(
        { pesan: "Peran visual tidak valid." },
        { status: 400 }
      );
    }

    let peranDash = peran_dashboard;
    if (peranDash === "") {
      peranDash = null;
    }
    if (peranDash && !["jenis", "terlaris"].includes(peranDash)) {
      return NextResponse.json(
        { pesan: "Peran dashboard tidak valid." },
        { status: 400 }
      );
    }

    if (peranDash) {
      await supabase
        .from("grup_opsi")
        .update({ peran_dashboard: null })
        .eq("peran_dashboard", peranDash);
    }

    const { error } = await supabase
      .from("grup_opsi")
      .update({
        nama: nama.trim(),
        urutan: Number(urutan) || 0,
        wajib: Boolean(wajib),
        jenis_pilihan,
        peran_visual: peran,
        peran_dashboard: peranDash,
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

  if (aksi === "ubah_harga") {
    const { id, harga } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID item tidak valid." },
        { status: 400 }
      );
    }

    const hargaAngka = Number(harga);
    if (isNaN(hargaAngka) || hargaAngka < 0) {
      return NextResponse.json(
        { pesan: "Harga harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("opsi_item")
      .update({
        harga: Math.round(hargaAngka),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengubah harga item: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Harga item berhasil diperbarui." });
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

  if (aksi === "sinkron_jenis_kue") {
    const { id_grup } = body;
    if (!id_grup) {
      return NextResponse.json({ pesan: "ID grup tidak valid." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("opsi_item")
      .select("*")
      .eq("id_grup", id_grup)
      .order("urutan", { ascending: true });

    const targetList = [
      { urutan: 1, nama: "Kue Ultah", kode_visual: "cake", warna: "#1e4b3c" },
      { urutan: 2, nama: "Cupcake", kode_visual: "cupcake", warna: "#608d7c" },
      { urutan: 3, nama: "Kue Pie", kode_visual: "tart", warna: "#b2cfbe" },
      { urutan: 4, nama: "Donat", kode_visual: "donut", warna: "#8fa58f" },
      { urutan: 5, nama: "Cookies", kode_visual: "cookies", warna: "#d97706" },
    ];

    const listAda = existing || [];
    for (let i = 0; i < targetList.length; i++) {
      const tgt = targetList[i];
      const byKode = listAda.find((x) => x.kode_visual === tgt.kode_visual);
      const legacyRow = !byKode && i < listAda.length ? listAda[i] : null;
      const rowToUpdate = byKode || legacyRow;

      if (rowToUpdate) {
        await supabase
          .from("opsi_item")
          .update({
            nama: tgt.nama,
            kode_visual: tgt.kode_visual,
            urutan: tgt.urutan,
            warna: rowToUpdate.warna || tgt.warna,
            aktif: true,
          })
          .eq("id", rowToUpdate.id);
      } else {
        await supabase.from("opsi_item").insert({
          id_grup,
          nama: tgt.nama,
          kode_visual: tgt.kode_visual,
          harga: 0,
          urutan: tgt.urutan,
          warna: tgt.warna,
          aktif: true,
        });
      }
    }

    return NextResponse.json({ pesan: "Opsi Jenis Kue berhasil disinkronkan." });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}