import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  const unwrapped = await params;
  const kode = unwrapped?.kode;
  if (!kode) {
    return NextResponse.json(
      { pesan: "Kode pesanan wajib diisi." },
      { status: 400 }
    );
  }

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

  const { data: pesanan, error: pError } = await supabase
    .from("pesanan")
    .select("*, zona_ongkir(nama)")
    .eq("kode_pesanan", kode)
    .single();

  if (pError || !pesanan) {
    return NextResponse.json(
      { pesan: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: prof } = await supabase
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdminOrStaf = prof && (prof.role === "admin" || prof.role === "staf");
  const isOwner = pesanan.id_pelanggan === user.id;

  if (!isAdminOrStaf && !isOwner) {
    return NextResponse.json(
      { pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  const [itemsRes, pilRes, bayarRes, riwRes, tokoRes] = await Promise.all([
    supabase
      .from("pesanan_item")
      .select("*, produk(*)")
      .eq("id_pesanan", pesanan.id)
      .order("urutan", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("pesanan_pilihan")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .order("id", { ascending: true }),
    supabase
      .from("pembayaran")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("riwayat_pesanan")
      .select("*, profil(nama)")
      .eq("id_pesanan", pesanan.id)
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("pengaturan_toko")
      .select("batas_bayar_jam, nama_toko, no_wa, alamat")
      .eq("id", 1)
      .single(),
  ]);

  let fotoPrevUrl = null;
  let fotoRefUrl = null;
  let fotoBentukUrl = null;
  let fotoGambarUrl = null;

  if (pesanan.foto_preview) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_preview, 3600);
    if (signed) fotoPrevUrl = signed.signedUrl;
  }

  if (pesanan.foto_referensi) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_referensi, 3600);
    if (signed) fotoRefUrl = signed.signedUrl;
  }

  if (pesanan.foto_bentuk_kustom) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_bentuk_kustom, 3600);
    if (signed) fotoBentukUrl = signed.signedUrl;
  }

  if (pesanan.foto_gambar_kustom) {
    const { data: signed } = await supabase.storage
      .from("referensi-kue")
      .createSignedUrl(pesanan.foto_gambar_kustom, 3600);
    if (signed) fotoGambarUrl = signed.signedUrl;
  }

  const { data: storagePublik } = supabase.storage.from("publik").getPublicUrl("");
  const basePublikUrl = storagePublik?.publicUrl ? storagePublik.publicUrl.replace(/\/+$/, "") : "";

  let rawItems = itemsRes.data || [];
  if (rawItems.length === 0) {
    rawItems = [
      {
        id: 0,
        id_pesanan: pesanan.id,
        jenis: "Custom",
        id_produk: null,
        nama_item: "Kue Custom",
        harga_satuan: pesanan.total_kue,
        jumlah: 1,
        subtotal: pesanan.total_kue,
        tulisan_kue: pesanan.tulisan_kue,
        catatan: pesanan.catatan,
        desain_json: pesanan.desain_json,
        foto_preview: pesanan.foto_preview,
        foto_bentuk_kustom: pesanan.foto_bentuk_kustom,
        foto_gambar_kustom: pesanan.foto_gambar_kustom,
        urutan: 1,
      },
    ];
  }

  const itemsWithUrls = [];
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i];
    let itFotoPrevUrl = null;
    let itFotoBentukUrl = null;
    let itFotoGambarUrl = null;
    let itFotoProdukUrl = null;

    if (it.foto_preview) {
      const { data: signed } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(it.foto_preview, 3600);
      if (signed) itFotoPrevUrl = signed.signedUrl;
    }

    if (it.foto_bentuk_kustom) {
      const { data: signed } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(it.foto_bentuk_kustom, 3600);
      if (signed) itFotoBentukUrl = signed.signedUrl;
    }

    if (it.foto_gambar_kustom) {
      const { data: signed } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(it.foto_gambar_kustom, 3600);
      if (signed) itFotoGambarUrl = signed.signedUrl;
    }

    const fotoProd = it.produk?.foto;
    if (fotoProd) {
      if (fotoProd.startsWith("http://") || fotoProd.startsWith("https://")) {
        itFotoProdukUrl = fotoProd;
      } else {
        itFotoProdukUrl = `${basePublikUrl}/${fotoProd.replace(/^\/+/, "")}`;
      }
    }

    const pilihanItem = (pilRes.data || []).filter(
      (p) => !p.id_pesanan_item || Number(p.id_pesanan_item) === Number(it.id)
    );

    itemsWithUrls.push({
      ...it,
      fotoPreviewUrl: itFotoPrevUrl || (it.id === 0 ? fotoPrevUrl : null),
      fotoBentukUrl: itFotoBentukUrl || (it.id === 0 ? fotoBentukUrl : null),
      fotoGambarUrl: itFotoGambarUrl || (it.id === 0 ? fotoGambarUrl : null),
      fotoProdukUrl: itFotoProdukUrl,
      pilihan: pilihanItem,
    });
  }

  const bayarWithUrl = [];
  const bayarList = bayarRes.data || [];
  for (let i = 0; i < bayarList.length; i++) {
    const item = bayarList[i];
    let url = null;
    if (item.bukti && !item.bukti.startsWith("midtrans-")) {
      const { data: signed } = await supabase.storage
        .from("bukti-bayar")
        .createSignedUrl(item.bukti, 3600);
      if (signed) url = signed.signedUrl;
    }
    bayarWithUrl.push({ ...item, buktiUrl: url });
  }

  const sisa = Math.max(0, pesanan.total_bayar - (pesanan.jumlah_terbayar || 0));
  let bayarSekarang = pesanan.total_bayar;
  if (pesanan.status_bayar === "DP Dibayar") {
    bayarSekarang = sisa;
  } else if (pesanan.status_bayar === "Belum Bayar") {
    bayarSekarang = pesanan.jumlah_dp || pesanan.total_bayar;
  } else {
    bayarSekarang = 0;
  }

  const batasJam = Number(tokoRes?.data?.batas_bayar_jam ?? 24);
  const dibuatMs = new Date(pesanan.dibuat_pada).getTime();
  const batasBayarIso = new Date(dibuatMs + batasJam * 3600000).toISOString();
  const statusPembayaranTerakhir = bayarList.length > 0 ? bayarList[0].status : null;

  let estimasi = null;
  if (pesanan.metode_pengiriman === "Kirim" && pesanan.tanggal_ambil) {
    const [y, m, d] = pesanan.tanggal_ambil.split("-").map(Number);
    const dtAkhir = new Date(Date.UTC(y, m - 1, d + 1));
    const tglAkhir = dtAkhir.toISOString().slice(0, 10);
    estimasi = {
      tanggalAwal: pesanan.tanggal_ambil,
      tanggalAkhir: tglAkhir,
      tanggalPasti: pesanan.tanggal_ambil,
    };
  }

  return NextResponse.json({
    sukses: true,
    pesanan,
    items: itemsWithUrls,
    pilihan: pilRes.data || [],
    pembayaran: bayarWithUrl,
    riwayat: riwRes.data || [],
    estimasi,
    jarak: pesanan.jarak_km,
    alamat: pesanan.alamat,
    patokan: pesanan.patokan,
    bayar_sekarang: bayarSekarang,
    sisa,
    batas_bayar: batasBayarIso,
    status_pembayaran_terakhir: statusPembayaranTerakhir,
    urls: {
      fotoPreview: fotoPrevUrl,
      fotoReferensi: fotoRefUrl,
      fotoBentukKustom: fotoBentukUrl,
      fotoGambarKustom: fotoGambarUrl,
    },
  });
}
