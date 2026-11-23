import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { validasiKoordinat } from "@/lib/ongkir";

function formatJamValid(str) {
  if (!str || typeof str !== "string") return false;
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return regex.test(str.slice(0, 5));
}

function jamLebihBesar(buka, tutup) {
  const b = buka.slice(0, 5);
  const t = tutup.slice(0, 5);
  return t > b;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: toko, error } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal memuat pengaturan toko: " + error.message },
      { status: 500 }
    );
  }

  const { data: zonaList } = await supabase
    .from("zona_ongkir")
    .select("*")
    .order("id", { ascending: true });

  const { data: tanggalTutupList } = await supabase
    .from("tanggal_tutup")
    .select("*")
    .order("tanggal", { ascending: true });

  return NextResponse.json({
    sukses: true,
    data: {
      ...toko,
      zona: zonaList || [],
      tanggal_tutup: tanggalTutupList || [],
    },
  });
}

export async function POST(request) {
  const { profil, diizinkan } = await cekRole(["admin"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin yang boleh mengubah pengaturan." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const nama_toko = formData.get("nama_toko");
    const alamat = formData.get("alamat") || "";
    const no_wa = formData.get("no_wa") || "";
    const jam_operasional = formData.get("jam_operasional") || "";

    let jam_buka_senin_jumat = formData.get("jam_buka_senin_jumat") || formData.get("jam_buka") || "08:00";
    let jam_tutup_senin_jumat = formData.get("jam_tutup_senin_jumat") || formData.get("jam_tutup") || "20:00";
    let jam_buka_sabtu_minggu = formData.get("jam_buka_sabtu_minggu") || formData.get("jam_buka") || "08:00";
    let jam_tutup_sabtu_minggu = formData.get("jam_tutup_sabtu_minggu") || formData.get("jam_tutup") || "20:00";

    jam_buka_senin_jumat = jam_buka_senin_jumat.slice(0, 5);
    jam_tutup_senin_jumat = jam_tutup_senin_jumat.slice(0, 5);
    jam_buka_sabtu_minggu = jam_buka_sabtu_minggu.slice(0, 5);
    jam_tutup_sabtu_minggu = jam_tutup_sabtu_minggu.slice(0, 5);

    const email = (formData.get("email") || "").trim();
    const instagram = (formData.get("instagram") || "").trim();
    const tautan_peta = (formData.get("tautan_peta") || "").trim();
    const deskripsi_footer = (formData.get("deskripsi_footer") || "").trim();

    const kuota_harian = Number(formData.get("kuota_harian"));
    const minimal_hari_pesan = Number(formData.get("minimal_hari_pesan"));
    const minimal_hari_katalog = Number(
      formData.get("minimal_hari_katalog") || formData.get("minimal_hari_siap") || 1
    );
    const mode_pembayaran = formData.get("mode_pembayaran") || "DP";
    const persen_dp = Number(formData.get("persen_dp"));
    const batas_bayar_jam = Number(formData.get("batas_bayar_jam"));
    const nama_bank = formData.get("nama_bank") || "";
    const no_rekening = formData.get("no_rekening") || "";
    const atas_nama = formData.get("atas_nama") || "";

    const latRaw = formData.get("lat_toko");
    const lngRaw = formData.get("lng_toko");
    const lat_toko = latRaw !== null && latRaw !== "" && !isNaN(Number(latRaw)) ? Number(latRaw) : null;
    const lng_toko = lngRaw !== null && lngRaw !== "" && !isNaN(Number(lngRaw)) ? Number(lngRaw) : null;

    const faktor_jalan = Number(formData.get("faktor_jalan") || 1.3);
    const maks_jarak_kirim_km = Number(formData.get("maks_jarak_kirim_km") || 20);

    const hapus_qris = formData.get("hapus_qris") === "true";
    const file_qris = formData.get("file_qris");
    const lat_toko_raw = formData.get("lat_toko");
    const lng_toko_raw = formData.get("lng_toko");
    const faktor_jalan_raw = formData.get("faktor_jalan");
    const maks_jarak_kirim_km_raw = formData.get("maks_jarak_kirim_km");

    let lat_toko = null;
    let lng_toko = null;
    if (lat_toko_raw !== null && lat_toko_raw !== undefined && String(lat_toko_raw).trim() !== "") {
      const n = Number(lat_toko_raw);
      if (!isNaN(n)) lat_toko = n;
    }
    if (lng_toko_raw !== null && lng_toko_raw !== undefined && String(lng_toko_raw).trim() !== "") {
      const n = Number(lng_toko_raw);
      if (!isNaN(n)) lng_toko = n;
    }

    let faktor_jalan = 1.3;
    if (faktor_jalan_raw !== null && faktor_jalan_raw !== undefined && String(faktor_jalan_raw).trim() !== "") {
      const n = Number(faktor_jalan_raw);
      if (!isNaN(n) && n >= 1) faktor_jalan = n;
    }

    let maks_jarak_kirim_km = null;
    if (maks_jarak_kirim_km_raw !== null && maks_jarak_kirim_km_raw !== undefined && String(maks_jarak_kirim_km_raw).trim() !== "") {
      const n = Number(maks_jarak_kirim_km_raw);
      if (!isNaN(n) && n > 0) maks_jarak_kirim_km = n;
    }

    if (!nama_toko || nama_toko.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama toko tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!formatJamValid(jam_buka_senin_jumat) || !formatJamValid(jam_tutup_senin_jumat)) {
      return NextResponse.json(
        { pesan: "Format jam Senin-Jumat harus berupa HH:MM." },
        { status: 400 }
      );
    }

    if (!jamLebihBesar(jam_buka_senin_jumat, jam_tutup_senin_jumat)) {
      return NextResponse.json(
        { pesan: "Jam tutup Senin-Jumat harus lebih besar dari jam buka." },
        { status: 400 }
      );
    }

    if (!formatJamValid(jam_buka_sabtu_minggu) || !formatJamValid(jam_tutup_sabtu_minggu)) {
      return NextResponse.json(
        { pesan: "Format jam Sabtu-Minggu harus berupa HH:MM." },
        { status: 400 }
      );
    }

    if (!jamLebihBesar(jam_buka_sabtu_minggu, jam_tutup_sabtu_minggu)) {
      return NextResponse.json(
        { pesan: "Jam tutup Sabtu-Minggu harus lebih besar dari jam buka." },
        { status: 400 }
      );
    }

    if (isNaN(kuota_harian) || kuota_harian < 1) {
      return NextResponse.json(
        { pesan: "Kuota harian minimal 1 pesanan." },
        { status: 400 }
      );
    }

    if (isNaN(minimal_hari_pesan) || minimal_hari_pesan < 0) {
      return NextResponse.json(
        { pesan: "Minimal hari pesan custom tidak boleh negatif." },
        { status: 400 }
      );
    }

    if (isNaN(minimal_hari_katalog) || minimal_hari_katalog < 0) {
      return NextResponse.json(
        { pesan: "Minimal hari pesan katalog tidak boleh negatif." },
        { status: 400 }
      );
    }

    if (!["DP", "Lunas"].includes(mode_pembayaran)) {
      return NextResponse.json(
        { pesan: "Mode pembayaran harus DP atau Lunas." },
        { status: 400 }
      );
    }

    if (isNaN(persen_dp) || persen_dp < 1 || persen_dp > 100) {
      return NextResponse.json(
        { pesan: "Persentase DP harus di antara 1 sampai 100." },
        { status: 400 }
      );
    }

    if (isNaN(batas_bayar_jam) || batas_bayar_jam < 1) {
      return NextResponse.json(
        { pesan: "Batas waktu pembayaran minimal 1 jam." },
        { status: 400 }
      );
    }

    if (isNaN(faktor_jalan) || faktor_jalan < 1) {
      return NextResponse.json(
        { pesan: "Faktor jalan minimal 1.0." },
        { status: 400 }
      );
    }

    if (isNaN(maks_jarak_kirim_km) || maks_jarak_kirim_km <= 0) {
      return NextResponse.json(
        { pesan: "Maksimal jarak kirim harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    if (lat_toko !== null || lng_toko !== null) {
      if (lat_toko === null || lng_toko === null || !validasiKoordinat(lat_toko, lng_toko)) {
        return NextResponse.json(
          { pesan: "Koordinat pin toko tidak valid untuk wilayah Indonesia." },
          { status: 400 }
        );
      }
    }

    const { data: pengaturanLama } = await supabase
      .from("pengaturan_toko")
      .select("gambar_qris")
      .eq("id", 1)
      .single();

    let gambar_qris_path = pengaturanLama ? pengaturanLama.gambar_qris : null;

    if (hapus_qris && gambar_qris_path) {
      const namaFileLama = gambar_qris_path.split("/").pop();
      if (namaFileLama) {
        await supabase.storage.from("publik").remove([namaFileLama]);
      }
      gambar_qris_path = null;
    }

    if (file_qris && typeof file_qris === "object" && file_qris.size > 0) {
      const tipeValid = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!tipeValid.includes(file_qris.type)) {
        return NextResponse.json(
          { pesan: "Format gambar QRIS harus berupa JPG, PNG, atau WebP." },
          { status: 400 }
        );
      }

      if (file_qris.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { pesan: "Ukuran gambar QRIS tidak boleh melebihi 2 MB." },
          { status: 400 }
        );
      }

      if (gambar_qris_path) {
        const fileLama = gambar_qris_path.split("/").pop();
        if (fileLama) {
          await supabase.storage.from("publik").remove([fileLama]);
        }
      }

      const ekstensi = file_qris.name.split(".").pop() || "jpg";
      const namaFileBaru = `qris-${Date.now()}.${ekstensi}`;
      const bytes = await file_qris.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: errUpload } = await supabase.storage
        .from("publik")
        .upload(namaFileBaru, buffer, {
          contentType: file_qris.type,
          upsert: true,
        });

      if (errUpload) {
        return NextResponse.json(
          { pesan: "Gagal mengunggah gambar QRIS: " + errUpload.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("publik")
        .getPublicUrl(namaFileBaru);

      gambar_qris_path = publicUrlData.publicUrl;
    }

    const payloadSimpan = {
      id: 1,
      nama_toko: nama_toko.trim(),
      alamat: alamat.trim(),
      no_wa: no_wa.trim(),
      jam_operasional: jam_operasional.trim(),
      jam_buka: jam_buka_senin_jumat,
      jam_tutup: jam_tutup_senin_jumat,
      jam_buka_senin_jumat,
      jam_tutup_senin_jumat,
      jam_buka_sabtu_minggu,
      jam_tutup_sabtu_minggu,
      email,
      instagram,
      tautan_peta,
      deskripsi_footer,
      kuota_harian,
      minimal_hari_pesan,
      minimal_hari_katalog,
      mode_pembayaran,
      persen_dp,
      batas_bayar_jam,
      nama_bank: nama_bank.trim(),
      no_rekening: no_rekening.trim(),
      atas_nama: atas_nama.trim(),
      gambar_qris: gambar_qris_path,
      lat_toko,
      lng_toko,
      faktor_jalan,
      maks_jarak_kirim_km,
    };

    let { error: errUpdate } = await supabase
      .from("pengaturan_toko")
      .upsert(payloadSimpan);

    if (errUpdate && errUpdate.message && errUpdate.message.includes("minimal_hari_katalog")) {
      delete payloadSimpan.minimal_hari_katalog;
      payloadSimpan.minimal_hari_siap = minimal_hari_katalog;
      const resFallback = await supabase.from("pengaturan_toko").upsert(payloadSimpan);
      errUpdate = resFallback.error;
    }

    if (errUpdate) {
      return NextResponse.json(
        { pesan: "Gagal menyimpan pengaturan toko: " + errUpdate.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Pengaturan toko berhasil diperbarui.",
      gambar_qris: gambar_qris_path,
    });
  }

  const body = await request.json();
  const { aksi } = body;

  if (aksi === "tambah_zona") {
    const { nama, tarif, aktif } = body;

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama zona ongkir tidak boleh kosong." },
        { status: 400 }
      );
    }

    const tarifAngka = Number(tarif);
    if (isNaN(tarifAngka) || tarifAngka < 0) {
      return NextResponse.json(
        { pesan: "Tarif ongkir harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("zona_ongkir").insert({
      nama: nama.trim(),
      tarif: Math.round(tarifAngka),
      aktif: aktif === undefined ? true : Boolean(aktif),
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambahkan zona ongkir: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Zona ongkir berhasil ditambahkan." });
  }

  if (aksi === "edit_zona") {
    const { id, nama, tarif, aktif } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID zona ongkir tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama zona ongkir tidak boleh kosong." },
        { status: 400 }
      );
    }

    const tarifAngka = Number(tarif);
    if (isNaN(tarifAngka) || tarifAngka < 0) {
      return NextResponse.json(
        { pesan: "Tarif ongkir harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("zona_ongkir")
      .update({
        nama: nama.trim(),
        tarif: Math.round(tarifAngka),
        aktif: Boolean(aktif),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengubah zona ongkir: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Zona ongkir berhasil diperbarui." });
  }

  if (aksi === "toggle_zona") {
    const { id, aktif } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID zona ongkir tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("zona_ongkir")
      .update({
        aktif: Boolean(aktif),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengubah status zona: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Status zona berhasil diubah." });
  }

  if (aksi === "hapus_zona") {
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID zona ongkir tidak valid." },
        { status: 400 }
      );
    }

    const { count } = await supabase
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .eq("id_zona", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          pesan:
            "Zona ongkir ini sudah digunakan dalam pesanan yang tersimpan. Untuk menjaga integritas data riwayat pesanan, disarankan menonaktifkan zona ini saja.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("zona_ongkir")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus zona ongkir: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Zona ongkir berhasil dihapus." });
  }

  if (aksi === "tambah_tanggal_tutup") {
    const { tanggal, alasan } = body;

    if (!tanggal || tanggal.trim() === "") {
      return NextResponse.json(
        { pesan: "Tanggal tutup harus dipilih." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("tanggal_tutup").insert({
      tanggal: tanggal.trim(),
      alasan: alasan ? alasan.trim() : "",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { pesan: "Tanggal tersebut sudah ada di daftar tanggal tutup." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { pesan: "Gagal menambahkan tanggal tutup: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Tanggal tutup berhasil ditambahkan." });
  }

  if (aksi === "hapus_tanggal_tutup") {
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID tanggal tutup tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tanggal_tutup")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus tanggal tutup: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Tanggal tutup berhasil dihapus." });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}
