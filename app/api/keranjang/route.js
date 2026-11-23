import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { hitungPesanan } from "@/lib/hitungHarga";

export async function GET() {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { pesan: "Silakan masuk terlebih dahulu untuk melihat keranjang." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: profil } = await supabase
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profil || profil.role !== "pelanggan") {
    return NextResponse.json(
      { pesan: "Hanya pelanggan yang dapat mengakses keranjang belanja." },
      { status: 403 }
    );
  }

  const { data: items, error } = await supabase
    .from("keranjang_item")
    .select("*")
    .eq("id_pelanggan", user.id)
    .order("dibuat_pada", { ascending: true });

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal mengambil data keranjang belanja." },
      { status: 500 }
    );
  }

  const { data: daftarItem } = await supabase
    .from("opsi_item")
    .select("*");

  const { data: daftarProduk } = await supabase
    .from("produk")
    .select("*");

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const hasilHitung = hitungPesanan(items || [], daftarItem || [], daftarProduk || [], 0, pengaturan);

  for (let i = 0; i < hasilHitung.rincian.length; i++) {
    const item = hasilHitung.rincian[i];
    if (item.jenis === "Custom") {
      if (item.foto_preview) {
        const { data: signed } = await supabase.storage
          .from("referensi-kue")
          .createSignedUrl(item.foto_preview, 3600);
        if (signed?.signedUrl) item.foto_preview_url = signed.signedUrl;
      }
      if (item.foto_bentuk_kustom) {
        const { data: signed } = await supabase.storage
          .from("referensi-kue")
          .createSignedUrl(item.foto_bentuk_kustom, 3600);
        if (signed?.signedUrl) item.foto_bentuk_kustom_url = signed.signedUrl;
      }
      if (item.foto_gambar_kustom) {
        const { data: signed } = await supabase.storage
          .from("referensi-kue")
          .createSignedUrl(item.foto_gambar_kustom, 3600);
        if (signed?.signedUrl) item.foto_gambar_kustom_url = signed.signedUrl;
      }
    } else if (item.foto) {
      const { data: publicUrlData } = supabase.storage
        .from("publik")
        .getPublicUrl(item.foto);
      item.foto_url = publicUrlData?.publicUrl || null;
    }
  }

  return NextResponse.json({
    keranjang: hasilHitung.rincian,
    ringkasan: {
      subtotal_custom: hasilHitung.subtotal_custom,
      subtotal_katalog: hasilHitung.subtotal_katalog,
      total_kue: hasilHitung.total_kue,
      jumlah_dp: hasilHitung.jumlah_dp,
      sisa: hasilHitung.sisa,
      mode_pembayaran: hasilHitung.mode_pembayaran,
      persen_dp: hasilHitung.persen_dp,
    },
  });
}

export async function POST(request) {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { pesan: "Silakan masuk terlebih dahulu untuk menambah ke keranjang." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: profil } = await supabase
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profil || profil.role !== "pelanggan") {
    return NextResponse.json(
      { pesan: "Hanya pelanggan yang dapat menambah ke keranjang belanja." },
      { status: 403 }
    );
  }

  const { data: keranjangLama } = await supabase
    .from("keranjang_item")
    .select("id, jenis, id_produk, jumlah")
    .eq("id_pelanggan", user.id);

  const totalBaris = (keranjangLama || []).length;
  let customCount = 0;
  for (let i = 0; i < (keranjangLama || []).length; i++) {
    if (keranjangLama[i].jenis === "Custom") customCount++;
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const jenis = formData.get("jenis") || "Custom";

    if (jenis === "Custom") {
      if (totalBaris >= 20) {
        return NextResponse.json(
          { pesan: "Keranjang sudah mencapai batas maksimal 20 item." },
          { status: 400 }
        );
      }
      if (customCount >= 10) {
        return NextResponse.json(
          { pesan: "Keranjang sudah mencapai batas maksimal 10 kue custom." },
          { status: 400 }
        );
      }

      const tulisan_kue = formData.get("tulisan_kue") || "";
      const catatan = formData.get("catatan") || "";
      const pilihanRaw = formData.get("pilihan");
      const desainJsonRaw = formData.get("desain_json");

      let daftarPilihan = [];
      if (pilihanRaw) {
        if (typeof pilihanRaw === "string") {
          try {
            daftarPilihan = JSON.parse(pilihanRaw);
          } catch {
            daftarPilihan = [];
          }
        } else if (Array.isArray(pilihanRaw)) {
          daftarPilihan = pilihanRaw;
        }
      }

      if (!daftarPilihan || daftarPilihan.length === 0) {
        return NextResponse.json(
          { pesan: "Pilihan opsi kue custom tidak boleh kosong." },
          { status: 400 }
        );
      }

      const { data: semuaGrup } = await supabase
        .from("grup_opsi")
        .select("*")
        .order("urutan", { ascending: true });

      const { data: semuaOpsi } = await supabase
        .from("opsi_item")
        .select("*")
        .eq("aktif", true);

      const opsiMap = new Map();
      for (let i = 0; i < (semuaOpsi || []).length; i++) {
        opsiMap.set(Number(semuaOpsi[i].id), semuaOpsi[i]);
      }

      const grupTerisi = new Map();
      for (let i = 0; i < daftarPilihan.length; i++) {
        const p = daftarPilihan[i];
        const optId = Number(typeof p === "object" ? p.id_item : p);
        const optQty = Number(typeof p === "object" && p.jumlah ? p.jumlah : 1);
        const optData = opsiMap.get(optId);

        if (!optData) {
          return NextResponse.json(
            { pesan: "Ada opsi kue yang tidak valid atau sudah tidak aktif." },
            { status: 400 }
          );
        }

        const count = grupTerisi.get(optData.id_grup) || 0;
        grupTerisi.set(optData.id_grup, count + optQty);
      }

      for (let i = 0; i < (semuaGrup || []).length; i++) {
        const g = semuaGrup[i];
        const count = grupTerisi.get(g.id) || 0;
        if (g.wajib && count === 0) {
          return NextResponse.json(
            { pesan: `Grup "${g.nama}" wajib dipilih.` },
            { status: 400 }
          );
        }
        if (g.jenis_pilihan === "satu" && count > 1) {
          return NextResponse.json(
            { pesan: `Grup "${g.nama}" hanya boleh dipilih satu.` },
            { status: 400 }
          );
        }
        if (g.jenis_pilihan === "banyak" && count > 20) {
          return NextResponse.json(
            { pesan: `Grup "${g.nama}" melebihi batas maksimal 20 item.` },
            { status: 400 }
          );
        }
      }

      let adaBentukKustom = false;
      let adaGambarKustom = false;
      for (let i = 0; i < daftarPilihan.length; i++) {
        const p = daftarPilihan[i];
        const optId = Number(typeof p === "object" ? p.id_item : p);
        const optData = opsiMap.get(optId);
        if (optData) {
          const nama = (optData.nama || "").toLowerCase();
          if (nama.includes("buat sendiri")) adaBentukKustom = true;
          if (nama.includes("gambar kustom")) adaGambarKustom = true;
        }
      }

      const filePreview = formData.get("foto_preview");
      const fileBentuk = formData.get("foto_bentuk_kustom");
      const fileGambar = formData.get("foto_gambar_kustom");

      if (adaBentukKustom && (!fileBentuk || fileBentuk.size === 0)) {
        return NextResponse.json(
          { pesan: "Silakan unggah foto sketsa bentuk kustom kue Anda." },
          { status: 400 }
        );
      }

      if (adaGambarKustom && (!fileGambar || fileGambar.size === 0)) {
        return NextResponse.json(
          { pesan: "Silakan unggah gambar atau foto stiker kustom kue Anda." },
          { status: 400 }
        );
      }

      const validasiFile = (file, label) => {
        if (!file || file.size === 0) return null;
        if (file.size > 2 * 1024 * 1024) {
          return `Ukuran ${label} maksimal 2 MB.`;
        }
        const tipe = file.type || "";
        if (!tipe.includes("jpeg") && !tipe.includes("jpg") && !tipe.includes("png")) {
          return `Format ${label} harus berupa JPG atau PNG.`;
        }
        return null;
      };

      const errP = validasiFile(filePreview, "foto preview");
      if (errP) return NextResponse.json({ pesan: errP }, { status: 400 });
      const errB = validasiFile(fileBentuk, "foto bentuk kustom");
      if (errB) return NextResponse.json({ pesan: errB }, { status: 400 });
      const errG = validasiFile(fileGambar, "foto gambar kustom");
      if (errG) return NextResponse.json({ pesan: errG }, { status: 400 });

      let pathPreview = null;
      let pathBentuk = null;
      let pathGambar = null;

      const uploadKeKeranjang = async (file, suffix) => {
        if (!file || file.size === 0) return null;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.type.includes("png") ? "png" : "jpg";
        const path = `keranjang/${user.id}/${Date.now()}_${suffix}.${ext}`;
        const { error: errUpload } = await supabase.storage
          .from("referensi-kue")
          .upload(path, buffer, {
            contentType: file.type,
            upsert: true,
          });
        if (errUpload) return null;
        return path;
      };

      if (filePreview && filePreview.size > 0) {
        pathPreview = await uploadKeKeranjang(filePreview, "preview");
      }
      if (fileBentuk && fileBentuk.size > 0) {
        pathBentuk = await uploadKeKeranjang(fileBentuk, "bentuk");
      }
      if (fileGambar && fileGambar.size > 0) {
        pathGambar = await uploadKeKeranjang(fileGambar, "gambar");
      }

      let parsedDesain = null;
      if (desainJsonRaw) {
        if (typeof desainJsonRaw === "string") {
          try {
            parsedDesain = JSON.parse(desainJsonRaw);
          } catch {
            parsedDesain = null;
          }
        } else {
          parsedDesain = desainJsonRaw;
        }
      }

      const { data: baru, error: errInsert } = await supabase
        .from("keranjang_item")
        .insert({
          id_pelanggan: user.id,
          jenis: "Custom",
          jumlah: 1,
          pilihan: daftarPilihan,
          tulisan_kue: tulisan_kue ? String(tulisan_kue).trim() : "",
          catatan: catatan ? String(catatan).trim() : "",
          desain_json: parsedDesain,
          foto_preview: pathPreview,
          foto_bentuk_kustom: pathBentuk,
          foto_gambar_kustom: pathGambar,
        })
        .select()
        .single();

      if (errInsert) {
        return NextResponse.json(
          { pesan: "Gagal menyimpan kue custom ke keranjang." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        pesan: "Kue custom berhasil ditambahkan ke keranjang.",
        item: baru,
      });
    } else {
      const id_produk = Number(formData.get("id_produk"));
      const jumlah = Math.max(1, Math.min(20, Number(formData.get("jumlah") || 1)));

      if (!id_produk) {
        return NextResponse.json(
          { pesan: "Produk katalog harus dipilih." },
          { status: 400 }
        );
      }

      const { data: prod } = await supabase
        .from("produk")
        .select("*")
        .eq("id", id_produk)
        .eq("aktif", true)
        .single();

      if (!prod) {
        return NextResponse.json(
          { pesan: "Produk tidak ditemukan atau sedang tidak aktif." },
          { status: 404 }
        );
      }

      const existing = (keranjangLama || []).find(
        (it) => it.jenis === "Siap" && Number(it.id_produk) === id_produk
      );

      if (existing) {
        const jumlahBaru = Math.min(20, Number(existing.jumlah) + jumlah);
        const { data: updated } = await supabase
          .from("keranjang_item")
          .update({ jumlah: jumlahBaru })
          .eq("id", existing.id)
          .select()
          .single();

        return NextResponse.json({
          pesan: "Jumlah kue katalog diperbarui di keranjang.",
          item: updated,
        });
      } else {
        if (totalBaris >= 20) {
          return NextResponse.json(
            { pesan: "Keranjang sudah mencapai batas maksimal 20 item." },
            { status: 400 }
          );
        }

        const { data: baru } = await supabase
          .from("keranjang_item")
          .insert({
            id_pelanggan: user.id,
            jenis: "Siap",
            id_produk: id_produk,
            jumlah: jumlah,
          })
          .select()
          .single();

        return NextResponse.json({
          pesan: "Kue katalog berhasil ditambahkan ke keranjang.",
          item: baru,
        });
      }
    }
  } else {
    const body = await request.json();
    const jenis = body.jenis || "Siap";

    if (jenis === "Siap") {
      const id_produk = Number(body.id_produk);
      const jumlah = Math.max(1, Math.min(20, Number(body.jumlah || 1)));

      if (!id_produk) {
        return NextResponse.json(
          { pesan: "Produk katalog harus dipilih." },
          { status: 400 }
        );
      }

      const { data: prod } = await supabase
        .from("produk")
        .select("*")
        .eq("id", id_produk)
        .eq("aktif", true)
        .single();

      if (!prod) {
        return NextResponse.json(
          { pesan: "Produk tidak ditemukan atau sedang tidak aktif." },
          { status: 404 }
        );
      }

      const existing = (keranjangLama || []).find(
        (it) => it.jenis === "Siap" && Number(it.id_produk) === id_produk
      );

      if (existing) {
        const jumlahBaru = Math.min(20, Number(existing.jumlah) + jumlah);
        const { data: updated } = await supabase
          .from("keranjang_item")
          .update({ jumlah: jumlahBaru })
          .eq("id", existing.id)
          .select()
          .single();

        return NextResponse.json({
          pesan: "Jumlah kue katalog diperbarui di keranjang.",
          item: updated,
        });
      } else {
        if (totalBaris >= 20) {
          return NextResponse.json(
            { pesan: "Keranjang sudah mencapai batas maksimal 20 item." },
            { status: 400 }
          );
        }

        const { data: baru } = await supabase
          .from("keranjang_item")
          .insert({
            id_pelanggan: user.id,
            jenis: "Siap",
            id_produk: id_produk,
            jumlah: jumlah,
          })
          .select()
          .single();

        return NextResponse.json({
          pesan: "Kue katalog berhasil ditambahkan ke keranjang.",
          item: baru,
        });
      }
    } else {
      return NextResponse.json(
        { pesan: "Kue custom wajib dikirim melalui FormData beserta foto preview." },
        { status: 400 }
      );
    }
  }
}

export async function PATCH(request) {
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
  const body = await request.json();
  const id = Number(body.id);
  const jumlah = Number(body.jumlah);

  if (!id || !jumlah || jumlah < 1 || jumlah > 20) {
    return NextResponse.json(
      { pesan: "Jumlah kue harus antara 1 sampai 20." },
      { status: 400 }
    );
  }

  const { data: item } = await supabase
    .from("keranjang_item")
    .select("*")
    .eq("id", id)
    .eq("id_pelanggan", user.id)
    .single();

  if (!item) {
    return NextResponse.json(
      { pesan: "Item keranjang tidak ditemukan." },
      { status: 404 }
    );
  }

  if (item.jenis !== "Siap") {
    return NextResponse.json(
      { pesan: "Kue custom hanya berjumlah 1 dan tidak dapat diubah jumlahnya." },
      { status: 400 }
    );
  }

  const { data: updated } = await supabase
    .from("keranjang_item")
    .update({ jumlah: jumlah })
    .eq("id", id)
    .eq("id_pelanggan", user.id)
    .select()
    .single();

  return NextResponse.json({
    pesan: "Jumlah item keranjang berhasil diperbarui.",
    item: updated,
  });
}

export async function DELETE(request) {
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
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  if (idParam) {
    const id = Number(idParam);
    const { data: item } = await supabase
      .from("keranjang_item")
      .select("*")
      .eq("id", id)
      .eq("id_pelanggan", user.id)
      .single();

    if (!item) {
      return NextResponse.json(
        { pesan: "Item keranjang tidak ditemukan." },
        { status: 404 }
      );
    }

    const filesToRemove = [];
    if (item.foto_preview) filesToRemove.push(item.foto_preview);
    if (item.foto_bentuk_kustom) filesToRemove.push(item.foto_bentuk_kustom);
    if (item.foto_gambar_kustom) filesToRemove.push(item.foto_gambar_kustom);

    if (filesToRemove.length > 0) {
      await supabase.storage.from("referensi-kue").remove(filesToRemove);
    }

    await supabase
      .from("keranjang_item")
      .delete()
      .eq("id", id)
      .eq("id_pelanggan", user.id);

    return NextResponse.json({
      pesan: "Item berhasil dihapus dari keranjang.",
    });
  } else {
    const { data: allItems } = await supabase
      .from("keranjang_item")
      .select("*")
      .eq("id_pelanggan", user.id);

    const filesToRemove = [];
    for (let i = 0; i < (allItems || []).length; i++) {
      const it = allItems[i];
      if (it.foto_preview) filesToRemove.push(it.foto_preview);
      if (it.foto_bentuk_kustom) filesToRemove.push(it.foto_bentuk_kustom);
      if (it.foto_gambar_kustom) filesToRemove.push(it.foto_gambar_kustom);
    }

    if (filesToRemove.length > 0) {
      await supabase.storage.from("referensi-kue").remove(filesToRemove);
    }

    await supabase
      .from("keranjang_item")
      .delete()
      .eq("id_pelanggan", user.id);

    return NextResponse.json({
      pesan: "Keranjang belanja berhasil dikosongkan.",
    });
  }
}
