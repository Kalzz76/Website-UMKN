import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { validasiKoordinat } from "@/lib/ongkir";

function invalidateCacheToko() {
  try {
    revalidateTag("pengaturan_toko");
  } catch {}
  try {
    revalidatePath("/");
  } catch {}
}

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

function emailValid(str) {
  if (!str) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function tautanPetaValid(str) {
  if (!str) return true;
  return str.startsWith("https://");
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isMidtransSandbox = midtransClientKey.startsWith("SB-");
  const statusMidtrans = !midtransClientKey
    ? "Belum Terhubung"
    : isMidtransSandbox
    ? "Terhubung (Sandbox)"
    : "Terhubung (Production)";

  if (diizinkan && profil) {
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

    const { data: tarifJarakList } = await supabase
      .from("tarif_jarak")
      .select("*")
      .order("jarak_maks_km", { ascending: true });

    return NextResponse.json({
      sukses: true,
      data: {
        ...toko,
        status_midtrans: statusMidtrans,
        zona: zonaList || [],
        tanggal_tutup: tanggalTutupList || [],
        tarif_jarak: tarifJarakList || [],
      },
    });
  }

  const kolomPublik = [
    "nama_toko",
    "alamat",
    "no_wa",
    "email",
    "instagram",
    "tautan_peta",
    "deskripsi_footer",
    "jam_buka",
    "jam_tutup",
    "jam_buka_senin_jumat",
    "jam_tutup_senin_jumat",
    "jam_buka_sabtu_minggu",
    "jam_tutup_sabtu_minggu",
    "minimal_hari_pesan",
    "minimal_hari_katalog",
    "mode_pembayaran",
    "persen_dp",
    "batas_bayar_jam",
    "nama_bank",
    "no_rekening",
    "atas_nama",
    "gambar_qris",
    "lat_toko",
    "lng_toko",
    "faktor_jalan",
    "maks_jarak_kirim_km",
    "transfer_manual_aktif",
  ].join(", ");

  const { data: toko, error } = await supabase
    .from("pengaturan_toko")
    .select(kolomPublik)
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal memuat pengaturan toko: " + error.message },
      { status: 500 }
    );
  }

  const { data: tanggalTutupList } = await supabase
    .from("tanggal_tutup")
    .select("tanggal, keterangan")
    .order("tanggal", { ascending: true });

  return NextResponse.json({
    sukses: true,
    data: {
      ...toko,
      status_midtrans: statusMidtrans,
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
    const aksi = formData.get("aksi") || "simpan_semua";

    if (aksi === "simpan_toko") {
      const nama_toko = (formData.get("nama_toko") || "").trim();
      const alamat = (formData.get("alamat") || "").trim();
      const no_wa = (formData.get("no_wa") || "").trim();
      const email = (formData.get("email") || "").trim();
      const instagram = (formData.get("instagram") || "").trim();
      const tautan_peta = (formData.get("tautan_peta") || "").trim();
      const deskripsi_footer = (formData.get("deskripsi_footer") || "").trim();

      let jam_buka_senin_jumat = (formData.get("jam_buka_senin_jumat") || formData.get("jam_buka") || "08:00").slice(0, 5);
      let jam_tutup_senin_jumat = (formData.get("jam_tutup_senin_jumat") || formData.get("jam_tutup") || "20:00").slice(0, 5);
      let jam_buka_sabtu_minggu = (formData.get("jam_buka_sabtu_minggu") || formData.get("jam_buka") || "08:00").slice(0, 5);
      let jam_tutup_sabtu_minggu = (formData.get("jam_tutup_sabtu_minggu") || formData.get("jam_tutup") || "20:00").slice(0, 5);

      if (!nama_toko) {
        return NextResponse.json({ pesan: "Nama toko tidak boleh kosong." }, { status: 400 });
      }

      if (email && !emailValid(email)) {
        return NextResponse.json({ pesan: "Format email toko tidak valid." }, { status: 400 });
      }

      if (tautan_peta && !tautanPetaValid(tautan_peta)) {
        return NextResponse.json({ pesan: "Tautan peta harus diawali dengan https://" }, { status: 400 });
      }

      if (deskripsi_footer.length > 300) {
        return NextResponse.json({ pesan: "Deskripsi singkat footer maksimal 300 karakter." }, { status: 400 });
      }

      if (!formatJamValid(jam_buka_senin_jumat) || !formatJamValid(jam_tutup_senin_jumat)) {
        return NextResponse.json({ pesan: "Format jam buka dan tutup Senin-Jumat harus berupa HH:MM." }, { status: 400 });
      }

      if (!jamLebihBesar(jam_buka_senin_jumat, jam_tutup_senin_jumat)) {
        return NextResponse.json({ pesan: "Jam tutup Senin-Jumat harus lebih besar dari jam buka." }, { status: 400 });
      }

      if (!formatJamValid(jam_buka_sabtu_minggu) || !formatJamValid(jam_tutup_sabtu_minggu)) {
        return NextResponse.json({ pesan: "Format jam buka dan tutup Sabtu-Minggu harus berupa HH:MM." }, { status: 400 });
      }

      if (!jamLebihBesar(jam_buka_sabtu_minggu, jam_tutup_sabtu_minggu)) {
        return NextResponse.json({ pesan: "Jam tutup Sabtu-Minggu harus lebih besar dari jam buka." }, { status: 400 });
      }

      const { error: errUpdate } = await supabase
        .from("pengaturan_toko")
        .update({
          nama_toko,
          alamat,
          no_wa,
          email,
          instagram,
          tautan_peta,
          deskripsi_footer,
          jam_buka_senin_jumat,
          jam_tutup_senin_jumat,
          jam_buka_sabtu_minggu,
          jam_tutup_sabtu_minggu,
          jam_buka: jam_buka_senin_jumat,
          jam_tutup: jam_tutup_senin_jumat,
        })
        .eq("id", 1);

      if (errUpdate) {
        return NextResponse.json({ pesan: "Gagal menyimpan pengaturan toko: " + errUpdate.message }, { status: 500 });
      }

      invalidateCacheToko();
      return NextResponse.json({ pesan: "Pengaturan profil toko berhasil diperbarui." });
    }

    if (aksi === "simpan_pemesanan") {
      const kuota_harian = Number(formData.get("kuota_harian"));
      const minimal_hari_pesan = Number(formData.get("minimal_hari_pesan"));
      const minimal_hari_katalog = Number(
        formData.get("minimal_hari_katalog") !== null
          ? formData.get("minimal_hari_katalog")
          : formData.get("minimal_hari_siap") || 1
      );

      if (isNaN(kuota_harian) || kuota_harian < 1 || kuota_harian > 100) {
        return NextResponse.json({ pesan: "Kuota harian harus antara 1 sampai 100 pesanan." }, { status: 400 });
      }

      if (isNaN(minimal_hari_pesan) || minimal_hari_pesan < 0 || minimal_hari_pesan > 30) {
        return NextResponse.json({ pesan: "Minimal hari pemesanan custom cake harus antara 0 sampai 30 hari." }, { status: 400 });
      }

      if (isNaN(minimal_hari_katalog) || minimal_hari_katalog < 0 || minimal_hari_katalog > 30) {
        return NextResponse.json({ pesan: "Minimal hari pemesanan kue katalog harus antara 0 sampai 30 hari." }, { status: 400 });
      }

      const { error: errUpdate } = await supabase
        .from("pengaturan_toko")
        .update({
          kuota_harian,
          minimal_hari_pesan,
          minimal_hari_katalog,
        })
        .eq("id", 1);

      if (errUpdate) {
        return NextResponse.json({ pesan: "Gagal menyimpan pengaturan pemesanan: " + errUpdate.message }, { status: 500 });
      }

      invalidateCacheToko();
      return NextResponse.json({ pesan: "Pengaturan pemesanan berhasil diperbarui." });
    }

    if (aksi === "simpan_pembayaran") {
      const mode_pembayaran = formData.get("mode_pembayaran") || "DP";
      const persen_dp = Number(formData.get("persen_dp"));
      const batas_bayar_jam = Number(formData.get("batas_bayar_jam"));
      const transfer_manual_aktif = formData.get("transfer_manual_aktif") === "true";
      const nama_bank = (formData.get("nama_bank") || "").trim();
      const no_rekening = (formData.get("no_rekening") || "").trim();
      const atas_nama = (formData.get("atas_nama") || "").trim();
      const hapus_qris = formData.get("hapus_qris") === "true";
      const file_qris = formData.get("file_qris");

      if (mode_pembayaran !== "DP" && mode_pembayaran !== "Lunas") {
        return NextResponse.json({ pesan: "Mode pembayaran harus DP atau Lunas." }, { status: 400 });
      }

      if (mode_pembayaran === "DP" && (isNaN(persen_dp) || persen_dp < 1 || persen_dp > 100)) {
        return NextResponse.json({ pesan: "Persentase DP harus antara 1 sampai 100 persen." }, { status: 400 });
      }

      if (isNaN(batas_bayar_jam) || batas_bayar_jam < 1 || batas_bayar_jam > 168) {
        return NextResponse.json({ pesan: "Batas waktu pembayaran harus antara 1 sampai 168 jam." }, { status: 400 });
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
        const tipeValid = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!tipeValid.includes(file_qris.type)) {
          return NextResponse.json({ pesan: "Format gambar QRIS harus berupa JPG, PNG, atau WebP." }, { status: 400 });
        }

        if (file_qris.size > 2 * 1024 * 1024) {
          return NextResponse.json({ pesan: "Ukuran gambar QRIS tidak boleh melebihi 2 MB." }, { status: 400 });
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
          return NextResponse.json({ pesan: "Gagal mengunggah gambar QRIS: " + errUpload.message }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage
          .from("publik")
          .getPublicUrl(namaFileBaru);

        gambar_qris_path = publicUrlData.publicUrl;
      }

      const { error: errUpdate } = await supabase
        .from("pengaturan_toko")
        .update({
          mode_pembayaran,
          persen_dp: mode_pembayaran === "DP" ? persen_dp : 100,
          batas_bayar_jam,
          transfer_manual_aktif,
          nama_bank,
          no_rekening,
          atas_nama,
          gambar_qris: gambar_qris_path,
        })
        .eq("id", 1);

      if (errUpdate) {
        return NextResponse.json({ pesan: "Gagal menyimpan pengaturan pembayaran: " + errUpdate.message }, { status: 500 });
      }

      invalidateCacheToko();
      return NextResponse.json({
        pesan: "Pengaturan pembayaran berhasil diperbarui.",
        gambar_qris: gambar_qris_path,
      });
    }

    const nama_toko = formData.get("nama_toko");
    const alamat = formData.get("alamat") || "";
    const no_wa = formData.get("no_wa") || "";

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

    const hapus_qris = formData.get("hapus_qris") === "true";
    const file_qris = formData.get("file_qris");
    const transfer_manual_aktif = formData.get("transfer_manual_aktif") === "true";

    if (!nama_toko || nama_toko.trim() === "") {
      return NextResponse.json({ pesan: "Nama toko tidak boleh kosong." }, { status: 400 });
    }

    if (email && !emailValid(email)) {
      return NextResponse.json({ pesan: "Format email toko tidak valid." }, { status: 400 });
    }

    if (tautan_peta && !tautanPetaValid(tautan_peta)) {
      return NextResponse.json({ pesan: "Tautan peta harus diawali dengan https://" }, { status: 400 });
    }

    if (deskripsi_footer.length > 300) {
      return NextResponse.json({ pesan: "Deskripsi singkat footer maksimal 300 karakter." }, { status: 400 });
    }

    if (!formatJamValid(jam_buka_senin_jumat) || !formatJamValid(jam_tutup_senin_jumat)) {
      return NextResponse.json({ pesan: "Format jam Senin-Jumat harus berupa HH:MM." }, { status: 400 });
    }

    if (!jamLebihBesar(jam_buka_senin_jumat, jam_tutup_senin_jumat)) {
      return NextResponse.json({ pesan: "Jam tutup Senin-Jumat harus lebih besar dari jam buka." }, { status: 400 });
    }

    if (!formatJamValid(jam_buka_sabtu_minggu) || !formatJamValid(jam_tutup_sabtu_minggu)) {
      return NextResponse.json({ pesan: "Format jam Sabtu-Minggu harus berupa HH:MM." }, { status: 400 });
    }

    if (!jamLebihBesar(jam_buka_sabtu_minggu, jam_tutup_sabtu_minggu)) {
      return NextResponse.json({ pesan: "Jam tutup Sabtu-Minggu harus lebih besar dari jam buka." }, { status: 400 });
    }

    if (isNaN(kuota_harian) || kuota_harian < 1 || kuota_harian > 100) {
      return NextResponse.json({ pesan: "Kuota harian harus antara 1 sampai 100 pesanan." }, { status: 400 });
    }

    if (isNaN(minimal_hari_pesan) || minimal_hari_pesan < 0 || minimal_hari_pesan > 30) {
      return NextResponse.json({ pesan: "Minimal hari pemesanan custom cake harus antara 0 sampai 30 hari." }, { status: 400 });
    }

    if (isNaN(minimal_hari_katalog) || minimal_hari_katalog < 0 || minimal_hari_katalog > 30) {
      return NextResponse.json({ pesan: "Minimal hari pemesanan kue katalog harus antara 0 sampai 30 hari." }, { status: 400 });
    }

    if (isNaN(batas_bayar_jam) || batas_bayar_jam < 1 || batas_bayar_jam > 168) {
      return NextResponse.json({ pesan: "Batas waktu pembayaran harus antara 1 sampai 168 jam." }, { status: 400 });
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
      const tipeValid = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!tipeValid.includes(file_qris.type)) {
        return NextResponse.json({ pesan: "Format gambar QRIS harus berupa JPG, PNG, atau WebP." }, { status: 400 });
      }

      if (file_qris.size > 2 * 1024 * 1024) {
        return NextResponse.json({ pesan: "Ukuran gambar QRIS tidak boleh melebihi 2 MB." }, { status: 400 });
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
        return NextResponse.json({ pesan: "Gagal mengunggah gambar QRIS: " + errUpload.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("publik")
        .getPublicUrl(namaFileBaru);

      gambar_qris_path = publicUrlData.publicUrl;
    }

    const payloadSimpan = {
      nama_toko: nama_toko.trim(),
      alamat: alamat.trim(),
      no_wa: no_wa.trim(),
      email,
      instagram,
      tautan_peta,
      deskripsi_footer,
      jam_buka_senin_jumat,
      jam_tutup_senin_jumat,
      jam_buka_sabtu_minggu,
      jam_tutup_sabtu_minggu,
      jam_buka: jam_buka_senin_jumat,
      jam_tutup: jam_tutup_senin_jumat,
      kuota_harian,
      minimal_hari_pesan,
      minimal_hari_katalog,
      mode_pembayaran,
      persen_dp: mode_pembayaran === "DP" ? persen_dp : 100,
      batas_bayar_jam,
      nama_bank: nama_bank.trim(),
      no_rekening: no_rekening.trim(),
      atas_nama: atas_nama.trim(),
      gambar_qris: gambar_qris_path,
      transfer_manual_aktif,
    };

    const { error: errUpdate } = await supabase
      .from("pengaturan_toko")
      .update(payloadSimpan)
      .eq("id", 1);

    if (errUpdate) {
      return NextResponse.json({ pesan: "Gagal menyimpan pengaturan toko: " + errUpdate.message }, { status: 500 });
    }

    invalidateCacheToko();
    return NextResponse.json({
      pesan: "Pengaturan toko berhasil diperbarui.",
      gambar_qris: gambar_qris_path,
    });
  }

  const body = await request.json();
  const { aksi } = body;

  if (aksi === "simpan_toko") {
    const {
      nama_toko,
      no_wa,
      email,
      instagram,
      alamat,
      tautan_peta,
      deskripsi_footer,
      jam_buka_senin_jumat,
      jam_tutup_senin_jumat,
      jam_buka_sabtu_minggu,
      jam_tutup_sabtu_minggu,
    } = body;

    const nama = (nama_toko || "").trim();
    if (!nama) {
      return NextResponse.json({ pesan: "Nama toko tidak boleh kosong." }, { status: 400 });
    }

    const em = (email || "").trim();
    if (em && !emailValid(em)) {
      return NextResponse.json({ pesan: "Format email toko tidak valid." }, { status: 400 });
    }

    const peta = (tautan_peta || "").trim();
    if (peta && !tautanPetaValid(peta)) {
      return NextResponse.json({ pesan: "Tautan peta harus diawali dengan https://" }, { status: 400 });
    }

    const desc = (deskripsi_footer || "").trim();
    if (desc.length > 300) {
      return NextResponse.json({ pesan: "Deskripsi singkat footer maksimal 300 karakter." }, { status: 400 });
    }

    const jbsj = (jam_buka_senin_jumat || "08:00").slice(0, 5);
    const jtsj = (jam_tutup_senin_jumat || "20:00").slice(0, 5);
    const jbsm = (jam_buka_sabtu_minggu || "08:00").slice(0, 5);
    const jtsm = (jam_tutup_sabtu_minggu || "20:00").slice(0, 5);

    if (!formatJamValid(jbsj) || !formatJamValid(jtsj)) {
      return NextResponse.json({ pesan: "Format jam buka dan tutup Senin-Jumat harus berupa HH:MM." }, { status: 400 });
    }

    if (!jamLebihBesar(jbsj, jtsj)) {
      return NextResponse.json({ pesan: "Jam tutup Senin-Jumat harus lebih besar dari jam buka." }, { status: 400 });
    }

    if (!formatJamValid(jbsm) || !formatJamValid(jtsm)) {
      return NextResponse.json({ pesan: "Format jam buka dan tutup Sabtu-Minggu harus berupa HH:MM." }, { status: 400 });
    }

    if (!jamLebihBesar(jbsm, jtsm)) {
      return NextResponse.json({ pesan: "Jam tutup Sabtu-Minggu harus lebih besar dari jam buka." }, { status: 400 });
    }

    const { error: errUpdate } = await supabase
      .from("pengaturan_toko")
      .update({
        nama_toko: nama,
        no_wa: (no_wa || "").trim(),
        email: em,
        instagram: (instagram || "").trim(),
        alamat: (alamat || "").trim(),
        tautan_peta: peta,
        deskripsi_footer: desc,
        jam_buka_senin_jumat: jbsj,
        jam_tutup_senin_jumat: jtsj,
        jam_buka_sabtu_minggu: jbsm,
        jam_tutup_sabtu_minggu: jtsm,
        jam_buka: jbsj,
        jam_tutup: jtsj,
      })
      .eq("id", 1);

    if (errUpdate) {
      return NextResponse.json({ pesan: "Gagal menyimpan pengaturan toko: " + errUpdate.message }, { status: 500 });
    }

    invalidateCacheToko();
    return NextResponse.json({ pesan: "Pengaturan profil toko berhasil diperbarui." });
  }

  if (aksi === "simpan_pemesanan") {
    const { kuota_harian, minimal_hari_pesan, minimal_hari_katalog } = body;
    const kuota = Number(kuota_harian);
    const minCustom = Number(minimal_hari_pesan);
    const minKatalog = Number(minimal_hari_katalog);

    if (isNaN(kuota) || kuota < 1 || kuota > 100) {
      return NextResponse.json({ pesan: "Kuota harian harus antara 1 sampai 100 pesanan." }, { status: 400 });
    }

    if (isNaN(minCustom) || minCustom < 0 || minCustom > 30) {
      return NextResponse.json({ pesan: "Minimal hari pemesanan custom cake harus antara 0 sampai 30 hari." }, { status: 400 });
    }

    if (isNaN(minKatalog) || minKatalog < 0 || minKatalog > 30) {
      return NextResponse.json({ pesan: "Minimal hari pemesanan kue katalog harus antara 0 sampai 30 hari." }, { status: 400 });
    }

    const { error: errUpdate } = await supabase
      .from("pengaturan_toko")
      .update({
        kuota_harian: kuota,
        minimal_hari_pesan: minCustom,
        minimal_hari_katalog: minKatalog,
      })
      .eq("id", 1);

    if (errUpdate) {
      return NextResponse.json({ pesan: "Gagal menyimpan pengaturan pemesanan: " + errUpdate.message }, { status: 500 });
    }

    invalidateCacheToko();
    return NextResponse.json({ pesan: "Pengaturan pemesanan berhasil diperbarui." });
  }

  if (aksi === "simpan_pembayaran") {
    const {
      mode_pembayaran,
      persen_dp,
      batas_bayar_jam,
      transfer_manual_aktif,
      nama_bank,
      no_rekening,
      atas_nama,
    } = body;

    const mode = mode_pembayaran === "Lunas" ? "Lunas" : "DP";
    const dp = Number(persen_dp);
    const batas = Number(batas_bayar_jam);

    if (mode === "DP" && (isNaN(dp) || dp < 1 || dp > 100)) {
      return NextResponse.json({ pesan: "Persentase DP harus antara 1 sampai 100 persen." }, { status: 400 });
    }

    if (isNaN(batas) || batas < 1 || batas > 168) {
      return NextResponse.json({ pesan: "Batas waktu pembayaran harus antara 1 sampai 168 jam." }, { status: 400 });
    }

    const { error: errUpdate } = await supabase
      .from("pengaturan_toko")
      .update({
        mode_pembayaran: mode,
        persen_dp: mode === "DP" ? dp : 100,
        batas_bayar_jam: batas,
        transfer_manual_aktif: Boolean(transfer_manual_aktif),
        nama_bank: (nama_bank || "").trim(),
        no_rekening: (no_rekening || "").trim(),
        atas_nama: (atas_nama || "").trim(),
      })
      .eq("id", 1);

    if (errUpdate) {
      return NextResponse.json({ pesan: "Gagal menyimpan pengaturan pembayaran: " + errUpdate.message }, { status: 500 });
    }

    invalidateCacheToko();
    return NextResponse.json({ pesan: "Pengaturan pembayaran berhasil diperbarui." });
  }

  if (aksi === "simpan_ongkir") {
    const { lat_toko, lng_toko, faktor_jalan, maks_jarak_kirim_km } = body;

    const latNum = lat_toko !== null && lat_toko !== undefined ? Number(lat_toko) : null;
    const lngNum = lng_toko !== null && lng_toko !== undefined ? Number(lng_toko) : null;
    const faktorNum = Number(faktor_jalan) || 1.3;
    const maksNum = Number(maks_jarak_kirim_km) || 20;

    if (latNum !== null && lngNum !== null && !validasiKoordinat(latNum, lngNum)) {
      return NextResponse.json(
        { pesan: "Koordinat pin toko tidak valid untuk wilayah Indonesia." },
        { status: 400 }
      );
    }

    if (faktorNum < 1) {
      return NextResponse.json(
        { pesan: "Faktor jalan minimal 1.0." },
        { status: 400 }
      );
    }

    if (maksNum <= 0) {
      return NextResponse.json(
        { pesan: "Maksimal jarak kirim harus lebih dari 0 km." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("pengaturan_toko")
      .update({
        lat_toko: latNum,
        lng_toko: lngNum,
        faktor_jalan: faktorNum,
        maks_jarak_kirim_km: maksNum,
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menyimpan parameter ongkir: " + error.message },
        { status: 500 }
      );
    }

    invalidateCacheToko();
    return NextResponse.json({ pesan: "Parameter ongkir jarak berhasil disimpan." });
  }

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

  if (aksi === "tambah_tarif_jarak") {
    const { jarak_maks_km, tarif, aktif } = body;
    const jarak = Number(jarak_maks_km);
    const tarifNum = Number(tarif);

    if (isNaN(jarak) || jarak <= 0) {
      return NextResponse.json(
        { pesan: "Jarak maksimal tier harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    if (isNaN(tarifNum) || tarifNum < 0) {
      return NextResponse.json(
        { pesan: "Tarif ongkir minimal Rp 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("tarif_jarak").insert({
      jarak_maks_km: jarak,
      tarif: Math.round(tarifNum),
      aktif: aktif === undefined ? true : Boolean(aktif),
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambah tarif jarak: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Tarif jarak berhasil ditambahkan." });
  }

  if (aksi === "edit_tarif_jarak") {
    const { id, jarak_maks_km, tarif, aktif } = body;
    if (!id) {
      return NextResponse.json({ pesan: "ID tarif tidak valid." }, { status: 400 });
    }

    const jarak = Number(jarak_maks_km);
    const tarifNum = Number(tarif);

    if (isNaN(jarak) || jarak <= 0) {
      return NextResponse.json(
        { pesan: "Jarak maksimal tier harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (isNaN(tarifNum) || tarifNum < 0) {
      return NextResponse.json(
        { pesan: "Tarif ongkir minimal Rp 0." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tarif_jarak")
      .update({
        jarak_maks_km: jarak,
        tarif: Math.round(tarifNum),
        aktif: Boolean(aktif),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal memperbarui tarif jarak: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Tarif jarak berhasil diperbarui." });
  }

  if (aksi === "hapus_tarif_jarak") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ pesan: "ID tarif tidak valid." }, { status: 400 });
    }

    const { error } = await supabase.from("tarif_jarak").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus tarif jarak: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pesan: "Tarif jarak berhasil dihapus." });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}
