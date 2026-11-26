import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { hitungKebutuhanBahan, roundQty } from "@/lib/resepKalkulator";

async function muatKebutuhanPesanan(supabase, pesananId, itemsList) {
  const { data: pilihanList } = await supabase
    .from("pesanan_pilihan")
    .select(
      "id, id_pesanan, id_pesanan_item, id_item, nama_item, nama_grup, kode_visual, peran_visual, jumlah"
    )
    .eq("id_pesanan", pesananId);

  const daftarPilihan = pilihanList || [];

  const butuhLookupItem = daftarPilihan.some((p) => !p.id_item);
  if (butuhLookupItem) {
    const [{ data: allOpsi }, { data: allGrup }] = await Promise.all([
      supabase.from("opsi_item").select("id, nama, kode_visual, id_grup"),
      supabase.from("grup_opsi").select("id, nama, peran_visual"),
    ]);

    const grupMap = new Map(
      (allGrup || []).map((g) => [
        g.id,
        { nama: g.nama?.trim().toLowerCase(), peran_visual: g.peran_visual },
      ])
    );

    for (let i = 0; i < daftarPilihan.length; i++) {
      const p = daftarPilihan[i];
      if (!p.id_item) {
        const match = (allOpsi || []).find((o) => {
          const gInfo = grupMap.get(o.id_grup);
          if (gInfo?.nama !== p.nama_grup?.trim().toLowerCase()) return false;
          if (
            p.kode_visual &&
            o.kode_visual &&
            p.kode_visual.trim().toLowerCase() ===
              o.kode_visual.trim().toLowerCase()
          ) {
            return true;
          }
          return (
            o.nama?.trim().toLowerCase() === p.nama_item?.trim().toLowerCase()
          );
        });
        if (match) {
          p.id_item = match.id;
          if (!p.peran_visual) {
            p.peran_visual = grupMap.get(match.id_grup)?.peran_visual || null;
          }
        }
      }
    }
  }

  const itemIds = Array.from(
    new Set(
      daftarPilihan
        .map((p) => p.id_item)
        .filter((id) => id !== null && id !== undefined)
    )
  );

  let resepList = [];
  if (itemIds.length > 0) {
    const { data: rList } = await supabase
      .from("resep_item")
      .select("id_item, id_bahan, jumlah, bahan:id_bahan(id, nama, satuan, jumlah)")
      .in("id_item", itemIds);
    resepList = rList || [];
  }

  const resepPerItemMap = new Map();
  for (let i = 0; i < resepList.length; i++) {
    const r = resepList[i];
    if (!resepPerItemMap.has(Number(r.id_item))) {
      resepPerItemMap.set(Number(r.id_item), []);
    }
    resepPerItemMap.get(Number(r.id_item)).push(r);
  }

  const pesananItemMap = new Map(
    (itemsList || []).map((it) => [Number(it.id), it])
  );

  return hitungKebutuhanBahan({
    pilihanList: daftarPilihan,
    pesananItemMap,
    resepPerItemMap,
  });
}

export async function GET(request, { params }) {
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json({ pesan: "Akses ditolak." }, { status: 403 });
  }

  const { kode } = await params;
  const supabase = getSupabaseAdmin();

  const { data: pesanan, error: errPesanan } = await supabase
    .from("pesanan")
    .select("id, kode_pesanan, status_pesanan, stok_dipotong_pada")
    .eq("kode_pesanan", kode)
    .single();

  if (errPesanan || !pesanan) {
    return NextResponse.json(
      { pesan: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: itemsList } = await supabase
    .from("pesanan_item")
    .select("id, jenis, jumlah")
    .eq("id_pesanan", pesanan.id);

  const adaItem = itemsList && itemsList.length > 0;
  const adaCustom = (itemsList || []).some(
    (it) => it.jenis === "Custom" || it.jenis === "custom"
  );

  if (adaItem && !adaCustom) {
    return NextResponse.json({
      pesanan: {
        id: pesanan.id,
        kode_pesanan: pesanan.kode_pesanan,
        status_pesanan: pesanan.status_pesanan,
        stok_dipotong_pada: pesanan.stok_dipotong_pada,
        nama_pemotong: null,
      },
      adaCustom: false,
      daftarKebutuhan: [],
      ringkasanPengali: [],
      pilihanTanpaResep: 0,
      daftarPilihanTanpaResep: [],
      riwayatPengurangan: [],
      pesan:
        "Pesanan hanya berisi produk katalog dan tidak membutuhkan stok bahan baku.",
    });
  }

  const { daftarKebutuhan, daftarPilihanTanpaResep, ringkasanPengali } =
    await muatKebutuhanPesanan(supabase, pesanan.id, itemsList || []);

  let infoPemotong = null;
  let riwayatPengurangan = [];

  if (pesanan.stok_dipotong_pada) {
    const { data: riwayat } = await supabase
      .from("riwayat_stok")
      .select(
        "id, id_bahan, perubahan, stok_setelah, jenis, dibuat_pada, keterangan, id_user, profil:id_user(nama), bahan:id_bahan(nama, satuan)"
      )
      .eq("id_pesanan", pesanan.id)
      .eq("jenis", "Pesanan")
      .order("id", { ascending: true });

    if (riwayat && riwayat.length > 0) {
      infoPemotong = riwayat[0].profil?.nama || "Staf";
      riwayatPengurangan = riwayat.map((r) => ({
        id_bahan: r.id_bahan,
        nama: r.bahan?.nama || "Bahan",
        satuan: r.bahan?.satuan || "",
        dikurangi: roundQty(Math.abs(Number(r.perubahan))),
      }));
    }
  }

  return NextResponse.json({
    pesanan: {
      id: pesanan.id,
      kode_pesanan: pesanan.kode_pesanan,
      status_pesanan: pesanan.status_pesanan,
      stok_dipotong_pada: pesanan.stok_dipotong_pada,
      nama_pemotong: infoPemotong,
    },
    adaCustom: true,
    daftarKebutuhan,
    ringkasanPengali,
    pilihanTanpaResep: daftarPilihanTanpaResep.length,
    daftarPilihanTanpaResep,
    riwayatPengurangan,
  });
}

export async function POST(request, { params }) {
  const { user, profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json({ pesan: "Akses ditolak." }, { status: 403 });
  }

  const { kode } = await params;
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  const { data: pesanan, error: errPesanan } = await supabase
    .from("pesanan")
    .select("id, kode_pesanan, status_pesanan, stok_dipotong_pada")
    .eq("kode_pesanan", kode)
    .single();

  if (errPesanan || !pesanan) {
    return NextResponse.json(
      { pesan: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: itemsList } = await supabase
    .from("pesanan_item")
    .select("id, jenis, jumlah")
    .eq("id_pesanan", pesanan.id);

  const adaItem = itemsList && itemsList.length > 0;
  const adaCustom = (itemsList || []).some(
    (it) => it.jenis === "Custom" || it.jenis === "custom"
  );

  if (adaItem && !adaCustom) {
    return NextResponse.json(
      { pesan: "Pesanan katalog tidak memerlukan pengelolaan stok bahan baku." },
      { status: 400 }
    );
  }

  if (aksi === "kurangi") {
    if (pesanan.stok_dipotong_pada) {
      return NextResponse.json(
        { pesan: "Stok untuk pesanan ini sudah pernah dikurangi." },
        { status: 400 }
      );
    }

    if (
      ["Menunggu Pembayaran", "Dibatalkan"].includes(pesanan.status_pesanan)
    ) {
      return NextResponse.json(
        {
          pesan: `Stok tidak dapat dikurangi untuk pesanan berstatus ${pesanan.status_pesanan}.`,
        },
        { status: 400 }
      );
    }

    const { daftarKebutuhan } = await muatKebutuhanPesanan(
      supabase,
      pesanan.id,
      itemsList || []
    );

    const hasilPemotongan = [];

    for (let i = 0; i < daftarKebutuhan.length; i++) {
      const item = daftarKebutuhan[i];
      const { data: bahanRow } = await supabase
        .from("bahan")
        .select("id, jumlah")
        .eq("id", item.id_bahan)
        .single();

      const stokSekarang = Number(bahanRow?.jumlah) || 0;
      const dikurangi = roundQty(
        Math.min(Math.max(stokSekarang, 0), item.dibutuhkan)
      );
      const kurang = roundQty(Math.max(0, item.dibutuhkan - dikurangi));
      const stokSetelah = roundQty(Math.max(0, stokSekarang - dikurangi));

      const { error: errUpd } = await supabase
        .from("bahan")
        .update({ jumlah: stokSetelah })
        .eq("id", item.id_bahan);

      if (errUpd) {
        return NextResponse.json(
          { pesan: "Gagal mengurangi stok bahan: " + errUpd.message },
          { status: 400 }
        );
      }

      const keterangan =
        kurang > 0
          ? `Pengurangan stok pesanan #${pesanan.kode_pesanan} (kurang ${kurang} ${item.satuan})`
          : `Pengurangan stok pesanan #${pesanan.kode_pesanan}`;

      await supabase.from("riwayat_stok").insert({
        id_bahan: item.id_bahan,
        perubahan: -dikurangi,
        stok_setelah: stokSetelah,
        jenis: "Pesanan",
        id_pesanan: pesanan.id,
        keterangan,
        id_user: user.id,
      });

      hasilPemotongan.push({
        id_bahan: item.id_bahan,
        nama: item.nama,
        satuan: item.satuan,
        dibutuhkan: item.dibutuhkan,
        dikurangi,
        kurang,
      });
    }

    const { error: errStamp } = await supabase
      .from("pesanan")
      .update({ stok_dipotong_pada: new Date().toISOString() })
      .eq("id", pesanan.id);

    if (errStamp) {
      return NextResponse.json(
        { pesan: "Gagal memperbarui status pemotongan stok: " + errStamp.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      pesan: "Stok berhasil dikurangi.",
      data: hasilPemotongan,
    });
  }

  if (aksi === "kembalikan") {
    if (!pesanan.stok_dipotong_pada) {
      return NextResponse.json(
        { pesan: "Stok belum pernah dikurangi, tidak ada yang perlu dikembalikan." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("kembalikan_stok_pesanan", {
      p_id_pesanan: pesanan.id,
      p_id_user: user.id,
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengembalikan stok: " + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      pesan: "Stok berhasil dikembalikan.",
      data,
    });
  }

  return NextResponse.json({ pesan: "Aksi tidak dikenal." }, { status: 400 });
}
