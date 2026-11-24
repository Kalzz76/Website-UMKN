import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya administrator yang dapat melihat laporan." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  if (!dari || !sampai) {
    return NextResponse.json(
      { pesan: "Parameter rentang tanggal wajib diisi." },
      { status: 400 }
    );
  }

  const dariIso = new Date(`${dari}T00:00:00+07:00`).toISOString();
  const sampaiIso = new Date(`${sampai}T23:59:59.999+07:00`).toISOString();

  const supabase = getSupabaseAdmin();

  const [
    { data: bayarList },
    { data: pesananList },
    { data: listBahan },
  ] = await Promise.all([
    supabase
      .from("pembayaran")
      .select("jenis, jumlah, status, dikonfirmasi_pada, dibuat_pada")
      .eq("status", "Dikonfirmasi")
      .gte("dikonfirmasi_pada", dariIso)
      .lte("dikonfirmasi_pada", sampaiIso),
    supabase
      .from("pesanan")
      .select("id, kode_pesanan, nama_penerima, tanggal_ambil, jam_ambil, metode_pengiriman, status_pesanan, status_bayar, total_bayar, jumlah_terbayar, total_kue, ongkir, perlu_refund, dibuat_pada")
      .gte("dibuat_pada", dariIso)
      .lte("dibuat_pada", sampaiIso)
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("bahan")
      .select("id, nama, satuan, jumlah, batas_minimum")
      .order("nama", { ascending: true }),
  ]);

  let omzetTotal = 0;
  let dpTotal = 0;
  let pelunasanTotal = 0;
  let lunasLangsungTotal = 0;

  (bayarList || []).forEach((b) => {
    const j = Number(b.jumlah) || 0;
    omzetTotal += j;
    if (b.jenis === "DP") dpTotal += j;
    else if (b.jenis === "Pelunasan") pelunasanTotal += j;
    else if (b.jenis === "Lunas") lunasLangsungTotal += j;
  });

  let piutangTotal = 0;
  let totalPerluRefund = 0;
  const statusCounts = {};
  const pengCounts = { Ambil: 0, Kirim: 0 };
  const pesananIds = [];
  const pesananNonBatal = [];

  (pesananList || []).forEach((p) => {
    pesananIds.push(p.id);
    statusCounts[p.status_pesanan] = (statusCounts[p.status_pesanan] || 0) + 1;
    pengCounts[p.metode_pengiriman] = (pengCounts[p.metode_pengiriman] || 0) + 1;

    if (p.perlu_refund) {
      totalPerluRefund += 1;
    }

    if (p.status_pesanan !== "Dibatalkan") {
      pesananNonBatal.push(p);
      if (p.status_bayar !== "Lunas") {
        piutangTotal += Number(p.total_bayar || 0) - Number(p.jumlah_terbayar || 0);
      }
    }
  });

  let allItems = [];
  let pilList = [];
  if (pesananIds.length > 0) {
    const [itRes, pilRes] = await Promise.all([
      supabase
        .from("pesanan_item")
        .select("id_pesanan, jenis, nama_item, subtotal, jumlah, harga_satuan")
        .in("id_pesanan", pesananIds),
      supabase
        .from("pesanan_pilihan")
        .select("nama_grup, nama_item, id_pesanan")
        .in("id_pesanan", pesananIds),
    ]);
    allItems = itRes.data || [];
    pilList = pilRes.data || [];
  }

  const itemsPerPesanan = {};
  allItems.forEach((it) => {
    if (!itemsPerPesanan[it.id_pesanan]) {
      itemsPerPesanan[it.id_pesanan] = [];
    }
    itemsPerPesanan[it.id_pesanan].push(it);
  });

  const pesananNonBatalIds = new Set(pesananNonBatal.map((p) => p.id));

  let totalNilaiCustom = 0;
  let totalNilaiKatalog = 0;
  let totalNilaiOngkir = 0;

  pesananNonBatal.forEach((p) => {
    totalNilaiOngkir += Number(p.ongkir) || 0;
  });

  const katalogStats = {};
  allItems.forEach((it) => {
    if (pesananNonBatalIds.has(it.id_pesanan)) {
      if (it.jenis === "Custom") {
        totalNilaiCustom += Number(it.subtotal) || 0;
      } else {
        totalNilaiKatalog += Number(it.subtotal) || 0;
        const nama = it.nama_item || "Kue";
        if (!katalogStats[nama]) {
          katalogStats[nama] = { nama, jumlah: 0, subtotal: 0 };
        }
        katalogStats[nama].jumlah += Number(it.jumlah) || 1;
        katalogStats[nama].subtotal += Number(it.subtotal) || 0;
      }
    }
  });

  const katalogTerlaris = Object.values(katalogStats).sort(
    (a, b) => b.jumlah - a.jumlah
  );

  const opsiTerlaris = {};
  pilList.forEach((pil) => {
    if (pesananNonBatalIds.has(pil.id_pesanan)) {
      const grup = pil.nama_grup || "Lainnya";
      const item = pil.nama_item || "-";
      if (!opsiTerlaris[grup]) opsiTerlaris[grup] = {};
      opsiTerlaris[grup][item] = (opsiTerlaris[grup][item] || 0) + 1;
    }
  });

  const daftarPesananFormatted = (pesananList || []).map((p) => {
    const items = itemsPerPesanan[p.id] || [];
    let customCount = 0;
    let katalogCount = 0;
    items.forEach((it) => {
      if (it.jenis === "Custom") customCount += it.jumlah || 1;
      else katalogCount += it.jumlah || 1;
    });

    let isiRingkas = "";
    if (customCount > 0 && katalogCount > 0) {
      isiRingkas = `${customCount} Custom, ${katalogCount} Katalog`;
    } else if (customCount > 0) {
      isiRingkas = `${customCount} Custom`;
    } else if (katalogCount > 0) {
      isiRingkas = `${katalogCount} Katalog`;
    } else {
      isiRingkas = "1 Pesanan";
    }

    let jenisPesanan = "Katalog";
    if (customCount > 0 && katalogCount > 0) jenisPesanan = "Campuran";
    else if (customCount > 0) jenisPesanan = "Custom";

    return {
      ...p,
      jenisPesanan,
      isiRingkas,
    };
  });

  const stokMenipis = (listBahan || []).filter(
    (b) => Number(b.jumlah) <= Number(b.batas_minimum)
  );

  return NextResponse.json({
    sukses: true,
    omzet: omzetTotal,
    piutang: piutangTotal,
    totalDp: dpTotal,
    totalPelunasan: pelunasanTotal,
    totalLunasLangsung: lunasLangsungTotal,
    nilaiCustom: totalNilaiCustom,
    nilaiKatalog: totalNilaiKatalog,
    nilaiOngkir: totalNilaiOngkir,
    totalNilaiPenjualan: totalNilaiCustom + totalNilaiKatalog + totalNilaiOngkir,
    jumlahPerluRefund: totalPerluRefund,
    hitungStatus: statusCounts,
    hitungPengambilan: pengCounts,
    opsiTerlaris,
    katalogTerlaris,
    stokMenipis,
    daftarPesanan: daftarPesananFormatted,
  });
}
