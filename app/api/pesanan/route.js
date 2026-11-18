import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { hitungTanggalMinimal } from "@/lib/format";

export async function POST(request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { pesan: "Silakan masuk terlebih dahulu untuk membuat pesanan." },
      { status: 401 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  let nama_penerima = "";
  let no_wa = "";
  let tulisan_kue = "";
  let catatan = "";
  let tanggal_ambil = "";
  let jam_ambil = "";
  let metode_pengiriman = "Ambil";
  let alamat = "";
  let id_zona = null;
  let item_ids = [];
  let fileFoto = null;

  const contentType = request.headers.get("content-type") || "";

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
    const rawZona = formData.get("id_zona");
    if (rawZona) {
      id_zona = Number(rawZona);
    }
    try {
      item_ids = JSON.parse(formData.get("item_ids") || "[]");
    } catch {
      item_ids = [];
    }
    const rawFile = formData.get("foto_referensi");
    if (rawFile && typeof rawFile === "object" && rawFile.size > 0) {
      fileFoto = rawFile;
    }
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
    if (body.id_zona) {
      id_zona = Number(body.id_zona);
    }
    item_ids = body.item_ids || [];
  }

  if (!nama_penerima.trim()) {
    return NextResponse.json(
      { pesan: "Nama penerima wajib diisi." },
      { status: 400 }
    );
  }
  if (!no_wa.trim()) {
    return NextResponse.json(
      { pesan: "Nomor WhatsApp wajib diisi." },
      { status: 400 }
    );
  }
  if (!tanggal_ambil) {
    return NextResponse.json(
      { pesan: "Tanggal pengambilan wajib dipilih." },
      { status: 400 }
    );
  }
  if (!jam_ambil) {
    return NextResponse.json(
      { pesan: "Jam pengambilan wajib dipilih." },
      { status: 400 }
    );
  }
  if (metode_pengiriman !== "Ambil" && metode_pengiriman !== "Kirim") {
    return NextResponse.json(
      { pesan: "Pilihan metode pengiriman tidak valid." },
      { status: 400 }
    );
  }
  if (metode_pengiriman === "Kirim") {
    if (!alamat.trim()) {
      return NextResponse.json(
        { pesan: "Alamat lengkap wajib diisi untuk pengiriman." },
        { status: 400 }
      );
    }
    if (!id_zona) {
      return NextResponse.json(
        { pesan: "Zona ongkir wajib dipilih untuk pengiriman." },
        { status: 400 }
      );
    }
  }
  if (!Array.isArray(item_ids) || item_ids.length === 0) {
    return NextResponse.json(
      { pesan: "Silakan pilih komponen kue terlebih dahulu." },
      { status: 400 }
    );
  }

  const { data: pengaturan } = await supabaseAdmin
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const minimalHari = pengaturan?.minimal_hari_pesan || 2;
  const batasTanggal = hitungTanggalMinimal(minimalHari);

  if (tanggal_ambil < batasTanggal) {
    return NextResponse.json(
      { pesan: `Pemesanan harus dilakukan minimal ${minimalHari} hari sebelumnya.` },
      { status: 400 }
    );
  }

  const { data: tutup } = await supabaseAdmin
    .from("tanggal_tutup")
    .select("alasan")
    .eq("tanggal", tanggal_ambil)
    .maybeSingle();

  if (tutup) {
    return NextResponse.json(
      { pesan: `Toko tutup pada tanggal tersebut: ${tutup.alasan || "Libur"}.` },
      { status: 400 }
    );
  }

  const kuotaHarian = pengaturan?.kuota_harian || 5;
  const { count: jumlahPesananAktif } = await supabaseAdmin
    .from("pesanan")
    .select("*", { count: "exact", head: true })
    .eq("tanggal_ambil", tanggal_ambil)
    .neq("status_pesanan", "Dibatalkan");

  if ((jumlahPesananAktif || 0) >= kuotaHarian) {
    return NextResponse.json(
      { pesan: "Kuota pesanan pada tanggal ini sudah penuh. Silakan pilih tanggal lain." },
      { status: 400 }
    );
  }

  const jamBuka = pengaturan?.jam_buka || "08:00";
  const jamTutup = pengaturan?.jam_tutup || "20:00";
  if (jam_ambil < jamBuka.slice(0, 5) || jam_ambil > jamTutup.slice(0, 5)) {
    return NextResponse.json(
      { pesan: `Jam pengambilan harus antara pukul ${jamBuka.slice(0, 5)} sampai ${jamTutup.slice(0, 5)}.` },
      { status: 400 }
    );
  }

  const { data: daftarGrup } = await supabaseAdmin
    .from("grup_opsi")
    .select("*")
    .order("urutan", { ascending: true });

  const { data: itemTerpilih } = await supabaseAdmin
    .from("opsi_item")
    .select("*")
    .in("id", item_ids)
    .eq("aktif", true);

  if (!itemTerpilih || itemTerpilih.length !== item_ids.length) {
    return NextResponse.json(
      { pesan: "Satu atau lebih komponen yang dipilih tidak tersedia atau tidak aktif." },
      { status: 400 }
    );
  }

  if (daftarGrup) {
    for (let i = 0; i < daftarGrup.length; i++) {
      const g = daftarGrup[i];
      const itemGrup = itemTerpilih.filter((it) => it.id_grup === g.id);
      if (g.wajib && itemGrup.length === 0) {
        return NextResponse.json(
          { pesan: `Pilihan untuk ${g.nama} wajib dipilih.` },
          { status: 400 }
        );
      }
      if (g.jenis_pilihan === "satu" && itemGrup.length > 1) {
        return NextResponse.json(
          { pesan: `Pilihan untuk ${g.nama} hanya boleh satu.` },
          { status: 400 }
        );
      }
    }
  }

  let total_kue = 0;
  for (let i = 0; i < itemTerpilih.length; i++) {
    total_kue += itemTerpilih[i].harga;
  }

  let ongkir = 0;
  if (metode_pengiriman === "Kirim") {
    const { data: zona } = await supabaseAdmin
      .from("zona_ongkir")
      .select("tarif, aktif")
      .eq("id", id_zona)
      .single();

    if (!zona || !zona.aktif) {
      return NextResponse.json(
        { pesan: "Zona ongkir yang dipilih tidak aktif." },
        { status: 400 }
      );
    }
    ongkir = zona.tarif;
  } else {
    id_zona = null;
    alamat = "";
  }

  const total_bayar = total_kue + ongkir;
  const modeBayar = pengaturan?.mode_pembayaran || "DP";
  let persen_dp_saat_pesan = null;
  let jumlah_dp = total_bayar;

  if (modeBayar === "DP") {
    persen_dp_saat_pesan = pengaturan?.persen_dp || 50;
    jumlah_dp = Math.round((total_bayar * persen_dp_saat_pesan) / 100);
  }

  let foto_referensi_path = null;
  if (fileFoto) {
    const tipe = fileFoto.type;
    if (
      tipe !== "image/jpeg" &&
      tipe !== "image/jpg" &&
      tipe !== "image/png"
    ) {
      return NextResponse.json(
        { pesan: "Format foto referensi harus berupa JPG atau PNG." },
        { status: 400 }
      );
    }
    if (fileFoto.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { pesan: "Ukuran foto referensi maksimal 2 MB." },
        { status: 400 }
      );
    }

    const ekstensi = tipe.includes("png") ? "png" : "jpg";
    const namaFile = `${Date.now()}-${user.id.slice(0, 8)}.${ekstensi}`;
    const fileBytes = await fileFoto.arrayBuffer();

    const { error: errUpload } = await supabaseAdmin.storage
      .from("referensi-kue")
      .upload(namaFile, fileBytes, {
        contentType: tipe,
        upsert: false,
      });

    if (!errUpload) {
      foto_referensi_path = namaFile;
    }
  }

  const { data: pesananBaru, error: errPesanan } = await supabaseAdmin
    .from("pesanan")
    .insert({
      id_pelanggan: user.id,
      nama_penerima: nama_penerima.trim(),
      no_wa: no_wa.trim(),
      tulisan_kue: tulisan_kue.trim() || null,
      catatan: catatan.trim() || null,
      foto_referensi: foto_referensi_path,
      tanggal_ambil,
      jam_ambil,
      metode_pengiriman,
      alamat: alamat.trim() || null,
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
    .select("id, kode_pesanan")
    .single();

  if (errPesanan || !pesananBaru) {
    return NextResponse.json(
      { pesan: "Gagal membuat pesanan. Silakan coba lagi." },
      { status: 500 }
    );
  }

  const barisPilihan = [];
  for (let i = 0; i < itemTerpilih.length; i++) {
    const it = itemTerpilih[i];
    const g = daftarGrup ? daftarGrup.find((grp) => grp.id === it.id_grup) : null;
    barisPilihan.push({
      id_pesanan: pesananBaru.id,
      nama_grup: g ? g.nama : "",
      nama_item: it.nama,
      harga: it.harga,
      warna: it.warna,
      kode_visual: it.kode_visual,
      peran_visual: g ? g.peran_visual : null,
    });
  }

  await supabaseAdmin.from("pesanan_pilihan").insert(barisPilihan);

  await supabaseAdmin.from("riwayat_pesanan").insert({
    id_pesanan: pesananBaru.id,
    keterangan: "Pesanan dibuat (Menunggu Pembayaran)",
    id_user: user.id,
  });

  return NextResponse.json({
    sukses: true,
    kode_pesanan: pesananBaru.kode_pesanan,
    total_bayar,
    jumlah_dp,
    mode_pembayaran: modeBayar,
  });
}
