import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("produk")
    .select("id, nama, deskripsi, harga, foto, aktif, id_kategori, label_teks, unggulan, dibuat_pada, kategori_produk(nama)")
    .order("dibuat_pada", { ascending: false });

  if (error) {
    return NextResponse.json({ pesan: "Gagal memuat produk: " + error.message }, { status: 500 });
  }

  const { data: storageData } = supabase.storage.from("publik").getPublicUrl("");
  const baseUrl = storageData?.publicUrl ? storageData.publicUrl.replace(/\/+$/, "") : "";

  const daftar = (data || []).map((p) => {
    let fotoUrl = null;
    if (p.foto) {
      if (p.foto.startsWith("http://") || p.foto.startsWith("https://")) {
        fotoUrl = p.foto;
      } else {
        const cleanPath = p.foto.replace(/^\/+/, "");
        fotoUrl = `${baseUrl}/${cleanPath}`;
      }
    }
    return {
      id: p.id,
      nama: p.nama,
      deskripsi: p.deskripsi,
      harga: p.harga,
      foto: p.foto,
      fotoUrl,
      aktif: p.aktif,
      id_kategori: p.id_kategori || null,
      kategori: p.kategori_produk?.nama || "",
      label_teks: p.label_teks || "",
      unggulan: Boolean(p.unggulan),
      dibuat_pada: p.dibuat_pada,
    };
  });

  return NextResponse.json({ sukses: true, data: daftar });
}

export async function POST(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json({ pesan: "Akses ditolak. Hanya admin." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  const supabase = getSupabaseAdmin();

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const id = formData.get("id");
    const nama = formData.get("nama");
    const deskripsi = formData.get("deskripsi") || "";
    const harga = Number(formData.get("harga"));
    const aktif = formData.get("aktif") !== "false";
    const file = formData.get("foto");

    const idKategoriRaw = formData.get("id_kategori");
    const id_kategori = idKategoriRaw && !isNaN(Number(idKategoriRaw)) ? Number(idKategoriRaw) : null;
    const label_teks = (formData.get("label_teks") || "").trim();
    const unggulan = formData.get("unggulan") === "true" || formData.get("unggulan") === true;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ pesan: "Nama produk wajib diisi." }, { status: 400 });
    }
    if (isNaN(harga) || harga < 0) {
      return NextResponse.json({ pesan: "Harga harus berupa angka valid." }, { status: 400 });
    }
    if (label_teks.length > 24) {
      return NextResponse.json({ pesan: "Label teks maksimal 24 karakter." }, { status: 400 });
    }

    if (unggulan) {
      let q = supabase.from("produk").select("id", { count: "exact" }).eq("unggulan", true);
      if (id) {
        q = q.neq("id", id);
      }
      const { count: jmlUnggulan } = await q;
      if ((jmlUnggulan || 0) >= 4) {
        return NextResponse.json({ pesan: "Maksimal 4 produk unggulan untuk Beranda." }, { status: 400 });
      }
    }

    let fotoPath = null;
    if (file && typeof file === "object" && file.size > 0) {
      const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowed.includes(file.type)) {
        return NextResponse.json({ pesan: "Format foto harus JPG atau PNG." }, { status: 400 });
      }
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ pesan: "Ukuran foto maksimal 2 MB." }, { status: 400 });
      }

      const ext = file.name ? file.name.split(".").pop().toLowerCase() : "jpg";
      const fileName = `produk/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: upErr } = await supabase.storage
        .from("publik")
        .upload(fileName, buffer, { contentType: file.type, upsert: true });

      if (upErr) {
        return NextResponse.json({ pesan: "Gagal mengunggah foto: " + upErr.message }, { status: 500 });
      }
      fotoPath = fileName;
    }

    if (id) {
      const updateData = {
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        harga: Math.round(harga),
        aktif: Boolean(aktif),
        id_kategori,
        label_teks,
        unggulan,
      };
      if (fotoPath) {
        updateData.foto = fotoPath;
      }
      const { error } = await supabase.from("produk").update(updateData).eq("id", id);
      if (error) {
        return NextResponse.json({ pesan: "Gagal memperbarui produk: " + error.message }, { status: 500 });
      }
      return NextResponse.json({ sukses: true, pesan: "Produk berhasil diperbarui." });
    } else {
      const insertData = {
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        harga: Math.round(harga),
        aktif: Boolean(aktif),
        foto: fotoPath,
        id_kategori,
        label_teks,
        unggulan,
      };
      const { error } = await supabase.from("produk").insert(insertData);
      if (error) {
        return NextResponse.json({ pesan: "Gagal menambah produk: " + error.message }, { status: 500 });
      }
      return NextResponse.json({ sukses: true, pesan: "Produk berhasil ditambahkan." });
    }
  }

  const body = await request.json();
  const { aksi, id } = body;

  if (aksi === "hapus" && id) {
    const { data: p } = await supabase.from("produk").select("foto").eq("id", id).maybeSingle();
    if (p?.foto) {
      try {
        await supabase.storage.from("publik").remove([p.foto]);
      } catch {}
    }
    const { error } = await supabase.from("produk").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ pesan: "Gagal menghapus produk: " + error.message }, { status: 500 });
    }
    return NextResponse.json({ sukses: true, pesan: "Produk berhasil dihapus." });
  }

  return NextResponse.json({ pesan: "Aksi tidak dikenali." }, { status: 400 });
}
