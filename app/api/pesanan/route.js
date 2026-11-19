import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { getTanggalHariIniJakarta } from "@/lib/format";

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
  let pilihanItemIds = [];
  let fileFoto = null;
  let skema_pembayaran = "DP";

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
    skema_pembayaran = formData.get("skema_pembayaran") || "DP";
    const idZonaRaw = formData.get("id_zona");
    id_zona = idZonaRaw ? Number(idZonaRaw) : null;
    const pilihanRaw = formData.get("pilihan_ids");
    if (pilihanRaw) {
      try {
        pilihanItemIds = JSON.parse(pilihanRaw);
      } catch {
        pilihanItemIds = [];
      }
    }
    fileFoto = formData.get("foto_referensi");
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
    skema_pembayaran = body.skema_pembayaran || "DP";
    id_zona = body.id_zona ? Number(body.id_zona) : null;
    pilihanItemIds = body.pilihan_ids || [];
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
  for (let i = 0; i < allActiveItems.length; i++) {
    itemMap.set(allActiveItems[i].id, allActiveItems[i]);
  }

  const grupItemCount = {};
  const itemTerpilihList = [];
  let total_kue = 0;

  for (let i = 0; i < pilihanItemIds.length; i++) {
    const itemId = Number(pilihanItemIds[i]);
    const itemData = itemMap.get(itemId);
    if (!itemData) {
      return NextResponse.json(
        { pesan: "Opsi yang dipilih tidak valid atau sudah tidak aktif." },
        { status: 400 }
      );
    }
    itemTerpilihList.push(itemData);
    total_kue += itemData.harga;
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

  const total_bayar = total_kue + ongkir;
  const modeBayar =
    pengaturan?.mode_pembayaran === "Lunas"
      ? "Lunas"
      : skema_pembayaran === "Lunas"
      ? "Lunas"
      : "DP";
  let persen_dp_saat_pesan = null;
  let jumlah_dp = total_bayar;

  if (modeBayar === "DP") {
    persen_dp_saat_pesan = pengaturan?.persen_dp || 50;
    jumlah_dp = Math.round((total_bayar * persen_dp_saat_pesan) / 100);
  }

  let foto_referensi_path = null;
  if (fileFoto && typeof fileFoto === "object" && fileFoto.size > 0) {
    const tipeValid = ["image/jpeg", "image/jpg", "image/png"];
    if (!tipeValid.includes(fileFoto.type)) {
      return NextResponse.json(
        { pesan: "Format foto referensi harus JPG, JPEG, atau PNG." },
        { status: 400 }
      );
    }
    if (fileFoto.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { pesan: "Ukuran foto referensi maksimal 2 MB." },
        { status: 400 }
      );
    }

    const ekstensi = fileFoto.name.split(".").pop() || "jpg";
    const namaFile = `${user.id}-${Date.now()}.${ekstensi}`;
    const bytes = await fileFoto.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: errUpload } = await supabase.storage
      .from("referensi-kue")
      .upload(namaFile, buffer, {
        contentType: fileFoto.type,
      });

    if (errUpload) {
      return NextResponse.json(
        { pesan: "Gagal mengunggah foto referensi: " + errUpload.message },
        { status: 500 }
      );
    }
    foto_referensi_path = namaFile;
  }

  const { data: newPesanan, error: errInsert } = await supabase
    .from("pesanan")
    .insert({
      id_pelanggan: user.id,
      nama_penerima: nama_penerima.trim(),
      no_wa: no_wa.trim(),
      tulisan_kue: tulisan_kue ? tulisan_kue.trim() : null,
      catatan: catatan ? catatan.trim() : null,
      foto_referensi: foto_referensi_path,
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

  const grupLookup = new Map();
  for (let i = 0; i < (grupList || []).length; i++) {
    grupLookup.set(grupList[i].id, grupList[i]);
  }

  const pilihanRows = [];
  for (let i = 0; i < itemTerpilihList.length; i++) {
    const it = itemTerpilihList[i];
    const gr = grupLookup.get(it.id_grup);
    pilihanRows.push({
      id_pesanan: newPesanan.id,
      id_grup: it.id_grup || (gr ? gr.id : null),
      nama_grup: gr ? gr.nama : "Opsi",
      nama_item: it.nama,
      harga: it.harga,
      warna: it.warna,
      kode_visual: it.kode_visual,
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