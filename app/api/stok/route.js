import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json({ pesan: "Akses ditolak." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const { data: pesananAktif } = await supabase
    .from("pesanan")
    .select("id")
    .in("status_pesanan", ["Diterima", "Sedang Dibuat", "Siap"])
    .is("stok_dipotong_pada", null);

  const kebutuhanAktifMap = {};

  if (pesananAktif && pesananAktif.length > 0) {
    const rawIds = pesananAktif.map((p) => p.id);
    const { data: allItems } = await supabase
      .from("pesanan_item")
      .select("id_pesanan, jenis")
      .in("id_pesanan", rawIds);

    const nonCustomOrderIds = new Set();
    if (allItems && allItems.length > 0) {
      const pesananItemMap = {};
      for (let i = 0; i < allItems.length; i++) {
        const pid = allItems[i].id_pesanan;
        if (!pesananItemMap[pid]) pesananItemMap[pid] = [];
        pesananItemMap[pid].push(allItems[i]);
      }
      for (const [pid, its] of Object.entries(pesananItemMap)) {
        const hasCustom = its.some((it) => it.jenis === "Custom" || it.jenis === "custom");
        if (!hasCustom) {
          nonCustomOrderIds.add(Number(pid));
        }
      }
    }

    const idPesananList = rawIds.filter((id) => !nonCustomOrderIds.has(Number(id)));

    const { data: pilihanList } = idPesananList.length > 0 ? await supabase
      .from("pesanan_pilihan")
      .select("id, id_item, nama_item, nama_grup, kode_visual, jumlah")
      .in("id_pesanan", idPesananList) : { data: [] };

    const validPilihan = pilihanList || [];
    const butuhLookupItem = validPilihan.some((p) => !p.id_item);
    if (butuhLookupItem) {
      const [{ data: allOpsi }, { data: allGrup }] = await Promise.all([
        supabase.from("opsi_item").select("id, nama, kode_visual, id_grup"),
        supabase.from("grup_opsi").select("id, nama"),
      ]);

      const grupMap = new Map((allGrup || []).map((g) => [g.id, g.nama?.trim().toLowerCase()]));

      for (let i = 0; i < validPilihan.length; i++) {
        const p = validPilihan[i];
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

    const itemIds = Array.from(new Set(validPilihan.map((p) => p.id_item).filter(Boolean)));

    if (itemIds.length > 0) {
      const { data: resepList } = await supabase
        .from("resep_item")
        .select("id_item, id_bahan, jumlah")
        .in("id_item", itemIds);

      const resepPerItem = new Map();
      for (let i = 0; i < (resepList || []).length; i++) {
        const r = resepList[i];
        if (!resepPerItem.has(r.id_item)) {
          resepPerItem.set(r.id_item, []);
        }
        resepPerItem.get(r.id_item).push(r);
      }

      for (let i = 0; i < validPilihan.length; i++) {
        const p = validPilihan[i];
        const rItems = resepPerItem.get(p.id_item) || [];
        const qtyPilihan = Number(p.jumlah) || 1;

        for (let j = 0; j < rItems.length; j++) {
          const r = rItems[j];
          const totalKebutuhan = Number(r.jumlah) * qtyPilihan;
          kebutuhanAktifMap[r.id_bahan] = Math.round(((kebutuhanAktifMap[r.id_bahan] || 0) + totalKebutuhan) * 1000) / 1000;
        }
      }
    }
  }

  return NextResponse.json({
    kebutuhanAktif: kebutuhanAktifMap,
  });
}

export async function POST(request) {
  const { profil, diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak." },
      { status: 403 }
    );
  }

  const isAdmin = profil.role === "admin";
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  if (aksi === "sesuaikan_jumlah") {
    const { id, perubahan, keterangan } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID bahan tidak valid." },
        { status: 400 }
      );
    }

    const { data: b } = await supabase
      .from("bahan")
      .select("jumlah")
      .eq("id", id)
      .single();

    if (!b) {
      return NextResponse.json(
        { pesan: "Bahan tidak ditemukan." },
        { status: 404 }
      );
    }

    const nilaiPerubahan = Number(perubahan);
    if (isNaN(nilaiPerubahan)) {
      return NextResponse.json(
        { pesan: "Nilai perubahan harus angka valid." },
        { status: 400 }
      );
    }

    const jumlahBaru = Number(b.jumlah) + nilaiPerubahan;
    if (jumlahBaru < 0) {
      return NextResponse.json(
        { pesan: "Jumlah stok tidak boleh kurang dari 0." },
        { status: 400 }
      );
    }

    await supabase
      .from("bahan")
      .update({ jumlah: jumlahBaru })
      .eq("id", id);

    await supabase.from("riwayat_stok").insert({
      id_bahan: id,
      perubahan: nilaiPerubahan,
      stok_setelah: jumlahBaru,
      jenis: nilaiPerubahan > 0 ? "Masuk" : "Keluar",
      keterangan: keterangan || (nilaiPerubahan > 0 ? "Stok Masuk" : "Stok Keluar"),
      id_user: profil.id,
    });

    return NextResponse.json({
      pesan: "Jumlah stok bahan berhasil diperbarui.",
    });
  }

  if (aksi === "tambah_bahan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Hanya admin yang boleh menambah bahan baru." },
        { status: 403 }
      );
    }

    const { nama, satuan, jumlah, batas_minimum } = body;

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!satuan || satuan.trim() === "") {
      return NextResponse.json(
        { pesan: "Satuan bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const j = Number(jumlah);
    const bm = Number(batas_minimum);

    if (isNaN(j) || j < 0) {
      return NextResponse.json(
        { pesan: "Jumlah awal harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    if (isNaN(bm) || bm < 0) {
      return NextResponse.json(
        { pesan: "Batas minimum harus berupa angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { data: insData, error } = await supabase
      .from("bahan")
      .insert({
        nama: nama.trim(),
        satuan: satuan.trim(),
        jumlah: j,
        batas_minimum: bm,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menambahkan bahan: " + error.message },
        { status: 500 }
      );
    }

    if (j > 0 && insData) {
      await supabase.from("riwayat_stok").insert({
        id_bahan: insData.id,
        perubahan: j,
        stok_setelah: j,
        jenis: "Masuk",
        keterangan: "Stok awal bahan",
        id_user: profil.id,
      });
    }

    return NextResponse.json({
      pesan: "Bahan berhasil ditambahkan.",
    });
  }

  if (aksi === "edit_bahan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Hanya admin yang boleh mengubah informasi bahan." },
        { status: 403 }
      );
    }

    const { id, nama, satuan, batas_minimum, jumlah } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID bahan tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!satuan || satuan.trim() === "") {
      return NextResponse.json(
        { pesan: "Satuan bahan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const bm = Number(batas_minimum);
    if (isNaN(bm) || bm < 0) {
      return NextResponse.json(
        { pesan: "Batas minimum harus angka dan minimal 0." },
        { status: 400 }
      );
    }

    const { data: bLama } = await supabase
      .from("bahan")
      .select("jumlah")
      .eq("id", id)
      .single();

    if (!bLama) {
      return NextResponse.json(
        { pesan: "Bahan tidak ditemukan." },
        { status: 404 }
      );
    }

    const jBaru = jumlah !== undefined ? Number(jumlah) : Number(bLama.jumlah);
    if (isNaN(jBaru) || jBaru < 0) {
      return NextResponse.json(
        { pesan: "Jumlah stok harus angka dan minimal 0." },
        { status: 400 }
      );
    }

    const delta = jBaru - Number(bLama.jumlah);

    const { error } = await supabase
      .from("bahan")
      .update({
        nama: nama.trim(),
        satuan: satuan.trim(),
        batas_minimum: bm,
        jumlah: jBaru,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal memperbarui bahan: " + error.message },
        { status: 500 }
      );
    }

    if (delta !== 0) {
      await supabase.from("riwayat_stok").insert({
        id_bahan: id,
        perubahan: delta,
        stok_setelah: jBaru,
        jenis: "Koreksi",
        keterangan: "Koreksi stok manual",
        id_user: profil.id,
      });
    }

    return NextResponse.json({
      pesan: "Informasi bahan berhasil diperbarui.",
    });
  }

  if (aksi === "hapus_bahan") {
    if (!isAdmin) {
      return NextResponse.json(
        { pesan: "Hanya admin yang boleh menghapus bahan." },
        { status: 403 }
      );
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { pesan: "ID bahan tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("bahan").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { pesan: "Gagal menghapus bahan: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Bahan berhasil dihapus.",
    });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}
