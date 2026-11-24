import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

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
    return NextResponse.json({ pesan: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const { data: itemsList } = await supabase
    .from("pesanan_item")
    .select("id, jenis")
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
      pilihanTanpaResep: 0,
      daftarPilihanTanpaResep: [],
      riwayatPengurangan: [],
      pesan: "Pesanan hanya berisi produk katalog dan tidak membutuhkan stok bahan baku.",
    });
  }

  const { data: pilihanList } = await supabase
    .from("pesanan_pilihan")
    .select("id, id_item, nama_item, nama_grup, kode_visual, jumlah")
    .eq("id_pesanan", pesanan.id);

  const daftarPilihan = pilihanList || [];

  const butuhLookupItem = daftarPilihan.some((p) => !p.id_item);
  if (butuhLookupItem) {
    const [{ data: allOpsi }, { data: allGrup }] = await Promise.all([
      supabase.from("opsi_item").select("id, nama, kode_visual, id_grup"),
      supabase.from("grup_opsi").select("id, nama"),
    ]);

    const grupMap = new Map((allGrup || []).map((g) => [g.id, g.nama?.trim().toLowerCase()]));

    for (let i = 0; i < daftarPilihan.length; i++) {
      const p = daftarPilihan[i];
      if (!p.id_item) {
        const match = (allOpsi || []).find((o) => {
          const gNama = grupMap.get(o.id_grup);
          if (gNama !== p.nama_grup?.trim().toLowerCase()) return false;
          if (p.kode_visual && o.kode_visual && p.kode_visual.trim().toLowerCase() === o.kode_visual.trim().toLowerCase()) {
            return true;
          }
          return o.nama?.trim().toLowerCase() === p.nama_item?.trim().toLowerCase();
        });
        if (match) {
          p.id_item = match.id;
        }
      }
    }
  }

  const itemIds = Array.from(new Set(daftarPilihan
    .map((p) => p.id_item)
    .filter((id) => id !== null && id !== undefined)));

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
    if (!resepPerItemMap.has(r.id_item)) {
      resepPerItemMap.set(r.id_item, []);
    }
    resepPerItemMap.get(r.id_item).push(r);
  }

  const daftarPilihanTanpaResep = [];
  const kebutuhanMap = new Map();

  for (let i = 0; i < daftarPilihan.length; i++) {
    const p = daftarPilihan[i];
    const qtyPilihan = Number(p.jumlah) || 1;
    if (!p.id_item || !resepPerItemMap.has(p.id_item) || resepPerItemMap.get(p.id_item).length === 0) {
      daftarPilihanTanpaResep.push({
        nama_grup: p.nama_grup,
        nama_item: p.nama_item,
        jumlah: qtyPilihan,
      });
      continue;
    }

    const resepItems = resepPerItemMap.get(p.id_item);
    for (let j = 0; j < resepItems.length; j++) {
      const ri = resepItems[j];
      const bahanInfo = ri.bahan;
      if (!bahanInfo) continue;

      const totalKebutuhanItem = Number(ri.jumlah) * qtyPilihan;
      if (!kebutuhanMap.has(ri.id_bahan)) {
        kebutuhanMap.set(ri.id_bahan, {
          id_bahan: ri.id_bahan,
          nama: bahanInfo.nama,
          satuan: bahanInfo.satuan,
          stok_sekarang: Number(bahanInfo.jumlah) || 0,
          dibutuhkan: totalKebutuhanItem,
        });
      } else {
        const cur = kebutuhanMap.get(ri.id_bahan);
        cur.dibutuhkan += totalKebutuhanItem;
      }
    }
  }

  const daftarKebutuhan = Array.from(kebutuhanMap.values()).map((b) => {
    const dib = Math.round(b.dibutuhkan * 1000) / 1000;
    const stk = Math.round(b.stok_sekarang * 1000) / 1000;
    const kurang = Math.round(Math.max(0, dib - stk) * 1000) / 1000;
    return {
      id_bahan: b.id_bahan,
      nama: b.nama,
      satuan: b.satuan,
      stok_sekarang: stk,
      dibutuhkan: dib,
      status: kurang > 0 ? "kurang" : "cukup",
      kurang,
    };
  });

  daftarKebutuhan.sort((a, b) => a.nama.localeCompare(b.nama));

  let infoPemotong = null;
  let riwayatPengurangan = [];

  if (pesanan.stok_dipotong_pada) {
    const { data: riwayat } = await supabase
      .from("riwayat_stok")
      .select("id, id_bahan, perubahan, stok_setelah, jenis, dibuat_pada, keterangan, id_user, profil:id_user(nama), bahan:id_bahan(nama, satuan)")
      .eq("id_pesanan", pesanan.id)
      .eq("jenis", "Pesanan")
      .order("id", { ascending: true });

    if (riwayat && riwayat.length > 0) {
      infoPemotong = riwayat[0].profil?.nama || "Staf";
      riwayatPengurangan = riwayat.map((r) => ({
        id_bahan: r.id_bahan,
        nama: r.bahan?.nama || "Bahan",
        satuan: r.bahan?.satuan || "",
        dikurangi: Math.round(Math.abs(Number(r.perubahan)) * 1000) / 1000,
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
    daftarKebutuhan,
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
    return NextResponse.json({ pesan: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const { data: itemsList } = await supabase
    .from("pesanan_item")
    .select("id, jenis")
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

    if (["Menunggu Pembayaran", "Dibatalkan"].includes(pesanan.status_pesanan)) {
      return NextResponse.json(
        { pesan: `Stok tidak dapat dikurangi untuk pesanan berstatus ${pesanan.status_pesanan}.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("kurangi_stok_pesanan", {
      p_id_pesanan: pesanan.id,
      p_id_user: user.id,
    });

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal mengurangi stok: " + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      pesan: "Stok berhasil dikurangi.",
      data,
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
