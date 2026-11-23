import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("kategori_produk")
    .select("id, nama, urutan, aktif")
    .eq("aktif", true)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal memuat kategori produk: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sukses: true, data: data || [] });
}

export async function POST(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  if (aksi === "tambah") {
    const nama = (body.nama || "").trim();
    const urutan = Number(body.urutan) || 0;
    const aktif = body.aktif !== false;

    if (!nama) {
      return NextResponse.json(
        { pesan: "Nama kategori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const { data: ada } = await supabase
      .from("kategori_produk")
      .select("id")
      .ilike("nama", nama)
      .maybeSingle();

    if (ada) {
      return NextResponse.json(
        { pesan: "Kategori dengan nama ini sudah ada." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("kategori_produk")
      .insert({ nama, urutan, aktif })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambahkan kategori: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sukses: true,
      pesan: "Kategori berhasil ditambahkan.",
      data,
    });
  }

  if (aksi === "ubah") {
    const id = Number(body.id);
    const nama = (body.nama || "").trim();
    const urutan = Number(body.urutan) || 0;
    const aktif = body.aktif !== false;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID kategori tidak valid." },
        { status: 400 }
      );
    }

    if (!nama) {
      return NextResponse.json(
        { pesan: "Nama kategori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const { data: ada } = await supabase
      .from("kategori_produk")
      .select("id")
      .ilike("nama", nama)
      .neq("id", id)
      .maybeSingle();

    if (ada) {
      return NextResponse.json(
        { pesan: "Nama kategori sudah digunakan oleh kategori lain." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("kategori_produk")
      .update({ nama, urutan, aktif })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal memperbarui kategori: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sukses: true,
      pesan: "Kategori berhasil diperbarui.",
      data,
    });
  }

  if (aksi === "urutan") {
    const daftar = body.daftar;
    if (!Array.isArray(daftar)) {
      return NextResponse.json(
        { pesan: "Format data urutan tidak valid." },
        { status: 400 }
      );
    }

    for (let i = 0; i < daftar.length; i++) {
      const item = daftar[i];
      if (item && item.id) {
        await supabase
          .from("kategori_produk")
          .update({ urutan: Number(item.urutan) || 0 })
          .eq("id", Number(item.id));
      }
    }

    return NextResponse.json({
      sukses: true,
      pesan: "Urutan kategori berhasil diperbarui.",
    });
  }

  if (aksi === "hapus") {
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json(
        { pesan: "ID kategori tidak valid." },
        { status: 400 }
      );
    }

    const { data: produkPakai } = await supabase
      .from("produk")
      .select("id")
      .eq("id_kategori", id)
      .limit(1);

    if (produkPakai && produkPakai.length > 0) {
      return NextResponse.json(
        {
          pesan:
            "Kategori masih digunakan oleh produk. Silakan nonaktifkan kategori ini atau pindahkan produk ke kategori lain.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("kategori_produk")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus kategori: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sukses: true,
      pesan: "Kategori berhasil dihapus.",
    });
  }

  return NextResponse.json({ pesan: "Aksi tidak dikenali." }, { status: 400 });
}
