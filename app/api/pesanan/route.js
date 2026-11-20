import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { getTanggalHariIniJakarta } from "@/lib/format";
import { hitungTotal } from "@/lib/hitungHarga";

export async function POST(request) {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { pesan: "Silakan masuk terlebih dahulu untuk melakukan pemesanan." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();
  const contentType = request.headers.get("content-type") || "";

  let nama_penerima = "";
  let no_wa = "";
  let tulisan_kue = "";
  let catatan = "";
  let tanggal_ambil = "";
  let jam_ambil = "";
  let metode_pengiriman = "Ambil";
  let alamat = "";
  let id_zona = null;
  let pilihanRaw = null;
  let fileFoto = null;
  let filePreview = null;
  let fileBentukKustom = null;
  let fileGambarKustom = null;
  let desainJsonRaw = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    nama_penerima = formData.get("nama_penerima") || "";
    no_wa = formData.get("no_wa") || "";
    tulisan_kue = formData.get("tulisan_kue") || "";
    catatan = formData.get("catatan") || "";
    tanggal_ambil = formData.get("tanggal_ambil") || "";
    jam_ambil = formData.get("jam_ambil") || "";
    metode_pengiriman = formData.get("metode_pengiriman") || "Ambil";
    alamat = formData.get("alamat") || "";
    const idZonaRaw = formData.get("id_zona");
    id_zona = idZonaRaw ? Number(idZonaRaw) : null;
    pilihanRaw = formData.get("pilihan") || formData.get("pilihan_ids");
    fileFoto = formData.get("foto_referensi");
    filePreview = formData.get("foto_preview");
    fileBentukKustom = formData.get("foto_bentuk_kustom");
    fileGambarKustom = formData.get("foto_gambar_kustom");
    desainJsonRaw = formData.get("desain_json");
  } else {
    const body = await request.json();
    nama_penerima = body.nama_penerima || "";
    no_wa = body.no_wa || "";
    tulisan_kue = body.tulisan_kue || "";
    catatan = body.catatan || "";
    tanggal_ambil = body.tanggal_ambil || "";
    jam_ambil = body.jam_ambil || "";
    metode_pengiriman = body.metode_pengiriman || "Ambil";
    alamat = body.alamat || "";
    id_zona = body.id_zona ? Number(body.id_zona) : null;
    pilihanRaw = body.pilihan || body.pilihan_ids;
    desainJsonRaw = body.desain_json;
  }

  if (!nama_penerima || nama_penerima.trim() === "") {
    return NextResponse.json(
      { pesan: "Nama penerima tidak boleh kosong." },
      { status: 400 }
    );
  }

  if (!no_wa || no_wa.trim() === "") {
    return NextResponse.json(
      { pesan: "Nomor WhatsApp tidak boleh kosong." },
      { status: 400 }
    );
  }

  if (!tanggal_ambil) {
    return NextResponse.json(
      { pesan: "Tanggal pengambilan/pengiriman harus dipilih." },
      { status: 400 }
    );
  }

  if (!jam_ambil) {
    return NextResponse.json(
      { pesan: "Jam pengambilan/pengiriman harus dipilih." },
      { status: 400 }
    );
  }

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

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const minimalHari = pengaturan?.minimal_hari_pesan ?? 2;
  const kuotaHarian = pengaturan?.kuota_harian ?? 5;
  const jamBuka = (pengaturan?.jam_buka || "08:00").slice(0, 5);
  const jamTutup = (pengaturan?.jam_tutup || "20:00").slice(0, 5);

  const hariIni = getTanggalHariIniJakarta();
  const tglOrder = new Date(tanggal_ambil + "T00:00:00");
  const tglSekarang = new Date(hariIni + "T00:00:00");
  const diffTime = tglOrder.getTime() - tglSekarang.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < minimalHari) {
    return NextResponse.json(
      {
        pesan: `Pemesanan harus dilakukan minimal ${minimalHari} hari sebelum tanggal pengambilan.`,
      },
      { status: 400 }
    );
  }

  const { data: libur } = await supabase
    .from("tanggal_tutup")
    .select("tanggal, alasan")
    .eq("tanggal", tanggal_ambil)
    .maybeSingle();

  if (libur) {
    return NextResponse.json(
      {
        pesan: `Tanggal ${tanggal_ambil} toko sedang libur / tutup: ${libur.alasan || "Tidak menerima pesanan"}.`,
      },
      { status: 400 }
    );
  }

  const { count: jumlahPesananHariItu } = await supabase
    .from("pesanan")
    .select("*", { count: "exact", head: true })
    .eq("tanggal_ambil", tanggal_ambil)
    .neq("status_pesanan", "Dibatalkan");

  if ((jumlahPesananHariItu || 0) >= kuotaHarian) {
    return NextResponse.json(
      {
        pesan: `Kuota pesanan pada tanggal ${tanggal_ambil} sudah penuh (${kuotaHarian} pesanan). Silakan pilih tanggal lain.`,
      },
      { status: 400 }
    );
  }

  const jamPilih = jam_ambil.slice(0, 5);
  if (jamPilih < jamBuka || jamPilih > jamTutup) {
    return NextResponse.json(
      {
        pesan: `Jam pengambilan harus di antara jam operasional ${jamBuka} sampai ${jamTutup}.`,
      },
      { status: 400 }
    );
  }

  let ongkir = 0;
  if (metode_pengiriman === "Kirim") {
    if (!alamat || alamat.trim() === "") {
      return NextResponse.json(
        { pesan: "Alamat pengiriman wajib diisi untuk metode Kirim." },
        { status: 400 }
      );
    }
    if (!id_zona) {
      return NextResponse.json(
        { pesan: "Zona pengiriman harus dipilih." },
        { status: 400 }
      );
    }

    const { data: zonaData } = await supabase
      .from("zona_ongkir")
      .select("*")
      .eq("id", id_zona)
      .eq("aktif", true)
      .single();

    if (!zonaData) {
      return NextResponse.json(
        { pesan: "Zona pengiriman tidak valid atau sudah tidak aktif." },
        { status: 400 }
      );
    }
    ongkir = zonaData.tarif || 0;
  } else {
    alamat = null;
    id_zona = null;
  }

  const { data: grupList } = await supabase
    .from("grup_opsi")
    .select("id, nama, wajib, jenis_pilihan, peran_visual");

  const { data: allActiveItems } = await supabase
    .from("opsi_item")
    .select("id, id_grup, nama, harga, aktif, warna, kode_visual")
    .eq("aktif", true);

  const itemMap = new Map();
  for (let i = 0; i < (allActiveItems || []).length; i++) {
    itemMap.set(allActiveItems[i].id, allActiveItems[i]);
  }

  const grupMap = new Map();
  for (let i = 0; i < (grupList || []).length; i++) {
    grupMap.set(grupList[i].id, grupList[i]);
  }

  const grupItemCount = {};
  const itemTerpilihList = [];
  let adaGambarKustom = false;
  let adaBuatSendiri = false;

  for (let i = 0; i < daftarPilihan.length; i++) {
    const raw = daftarPilihan[i];
    if (!raw) continue;
    const itemId = Number(typeof raw === "object" ? raw.id_item : raw);
    const jumlah = Number(typeof raw === "object" && raw.jumlah ? raw.jumlah : 1);

    if (isNaN(itemId)) continue;

    const itemData = itemMap.get(itemId);
    if (!itemData) {
      return NextResponse.json(
        { pesan: "Opsi yang dipilih tidak valid atau sudah tidak aktif." },
        { status: 400 }
      );
    }

    const grupData = grupMap.get(itemData.id_grup);
    if (grupData && grupData.jenis_pilihan === "satu" && jumlah > 1) {
      return NextResponse.json(
        { pesan: `Grup "${grupData.nama}" tidak mengizinkan jumlah lebih dari 1.` },
        { status: 400 }
      );
    }

    if (jumlah < 1 || jumlah > 20) {
      return NextResponse.json(
        { pesan: `Jumlah untuk "${itemData.nama}" harus antara 1 sampai 20.` },
        { status: 400 }
      );
    }

    if (itemData.kode_visual === "gambar_kustom") {
      adaGambarKustom = true;
    }

    if (grupData?.peran_visual === "bentuk" && itemData.kode_visual === "custom") {
      adaBuatSendiri = true;
    }

    itemTerpilihList.push({
      itemData,
      jumlah,
    });
    grupItemCount[itemData.id_grup] = (grupItemCount[itemData.id_grup] || 0) + 1;
  }

  for (let i = 0; i < (grupList || []).length; i++) {
    const grup = grupList[i];
    const count = grupItemCount[grup.id] || 0;
    if (grup.wajib && count === 0) {
      return NextResponse.json(
        { pesan: `Grup "${grup.nama}" wajib dipilih minimal satu opsi.` },
        { status: 400 }
      );
    }
    if (grup.jenis_pilihan === "satu" && count > 1) {
      return NextResponse.json(
        { pesan: `Grup "${grup.nama}" hanya boleh memilih satu opsi.` },
        { status: 400 }
      );
    }
  }

  if (adaGambarKustom && (!fileGambarKustom || typeof fileGambarKustom !== "object" || fileGambarKustom.size === 0)) {
    return NextResponse.json(
      { pesan: "Item 'Gambar Kustom' memerlukan unggahan file gambar kustom." },
      { status: 400 }
    );
  }

  if (adaBuatSendiri && (!fileBentukKustom || typeof fileBentukKustom !== "object" || fileBentukKustom.size === 0)) {
    return NextResponse.json(
      { pesan: "Item bentuk 'Buat Sendiri' memerlukan unggahan gambar bentuk." },
      { status: 400 }
    );
  }

  const pilihanFormat = itemTerpilihList.map((x) => ({
    id_item: x.itemData.id,
    jumlah: x.jumlah,
  }));

  const kalkulasi = hitungTotal({
    pilihan: pilihanFormat,
    daftarItem: allActiveItems || [],
    ongkir,
    pengaturanDP: pengaturan,
  });

  const total_kue = kalkulasi.total_kue;
  const total_bayar = kalkulasi.total_bayar;
  const jumlah_dp = kalkulasi.jumlah_dp;
  const persen_dp_saat_pesan = kalkulasi.persen_dp_saat_pesan;

  async function uploadBerkas(berkas, awalan) {
    if (!berkas || typeof berkas !== "object" || berkas.size === 0) {
      return null;
    }
    const tipeValid = ["image/jpeg", "image/jpg", "image/png"];
    if (!tipeValid.includes(berkas.type)) {
      throw new Error(`Format berkas ${awalan} harus JPG, JPEG, atau PNG.`);
    }
    if (berkas.size > 2 * 1024 * 1024) {
      throw new Error(`Ukuran berkas ${awalan} maksimal 2 MB.`);
    }
    const ekstensi = berkas.name ? berkas.name.split(".").pop() : (berkas.type === "image/png" ? "png" : "jpg");
    const namaFile = `${user.id}-${awalan}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ekstensi}`;
    const bytes = await berkas.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: errUpload } = await supabase.storage
      .from("referensi-kue")
      .upload(namaFile, buffer, {
        contentType: berkas.type,
      });

    if (errUpload) {
      throw new Error(`Gagal mengunggah berkas ${awalan}: ${errUpload.message}`);
    }
    return namaFile;
  }

  let foto_referensi_path = null;
  let foto_preview_path = null;
  let foto_bentuk_kustom_path = null;
  let foto_gambar_kustom_path = null;

  try {
    if (fileFoto) {
      foto_referensi_path = await uploadBerkas(fileFoto, "ref");
    }
    if (filePreview) {
      foto_preview_path = await uploadBerkas(filePreview, "preview");
    }
    if (fileBentukKustom) {
      foto_bentuk_kustom_path = await uploadBerkas(fileBentukKustom, "bentuk");
    }
    if (fileGambarKustom) {
      foto_gambar_kustom_path = await uploadBerkas(fileGambarKustom, "custom");
    }
  } catch (err) {
    return NextResponse.json(
      { pesan: err.message || "Terjadi kesalahan saat mengunggah berkas." },
      { status: 400 }
    );
  }

  let desain_json = null;
  if (desainJsonRaw) {
    if (typeof desainJsonRaw === "object") {
      desain_json = desainJsonRaw;
    } else if (typeof desainJsonRaw === "string") {
      try {
        desain_json = JSON.parse(desainJsonRaw);
      } catch {
        desain_json = null;
      }
    }
  }

  const { data: newPesanan, error: errInsert } = await supabase
    .from("pesanan")
    .insert({
      id_pelanggan: user.id,
      nama_penerima: nama_penerima.trim(),
      no_wa: no_wa.trim(),
      tulisan_kue: tulisan_kue ? tulisan_kue.trim() : null,
      catatan: catatan ? catatan.trim() : null,
      foto_referensi: foto_referensi_path || foto_preview_path,
      foto_preview: foto_preview_path,
      foto_bentuk_kustom: foto_bentuk_kustom_path,
      foto_gambar_kustom: foto_gambar_kustom_path,
      desain_json,
      tanggal_ambil,
      jam_ambil: jam_ambil.slice(0, 5),
      metode_pengiriman,
      alamat: alamat ? alamat.trim() : null,
      id_zona,
      ongkir,
      total_kue,
      total_bayar,
      persen_dp_saat_pesan,
      jumlah_dp,
      jumlah_terbayar: 0,
      status_pesanan: "Menunggu Pembayaran",
      status_bayar: "Belum Bayar",
    })
    .select("id, nomor")
    .single();

  if (errInsert || !newPesanan) {
    return NextResponse.json(
      { pesan: "Gagal membuat pesanan: " + (errInsert?.message || "") },
      { status: 500 }
    );
  }

  const kode_pesanan = `KUE-${String(newPesanan.nomor).padStart(4, "0")}`;

  await supabase
    .from("pesanan")
    .update({ kode_pesanan })
    .eq("id", newPesanan.id);

  const pilihanRows = [];
  for (let i = 0; i < itemTerpilihList.length; i++) {
    const { itemData, jumlah } = itemTerpilihList[i];
    const gr = grupMap.get(itemData.id_grup);
    pilihanRows.push({
      id_pesanan: newPesanan.id,
      id_grup: itemData.id_grup || (gr ? gr.id : null),
      nama_grup: gr ? gr.nama : "Opsi",
      nama_item: itemData.nama,
      harga: itemData.harga,
      jumlah: jumlah || 1,
      warna: itemData.warna,
      kode_visual: itemData.kode_visual,
      peran_visual: gr ? gr.peran_visual : null,
    });
  }

  if (pilihanRows.length > 0) {
    await supabase.from("pesanan_pilihan").insert(pilihanRows);
  }

  await supabase.from("riwayat_pesanan").insert({
    id_pesanan: newPesanan.id,
    keterangan: "Pesanan Dibuat (Menunggu Pembayaran)",
    id_user: user.id,
  });

  return NextResponse.json({
    pesan: "Pesanan berhasil dibuat.",
    kode_pesanan,
  });
}
