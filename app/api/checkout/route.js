import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { getTanggalHariIniJakarta, hitungTanggalMinimal } from "@/lib/format";
import { hitungPesanan } from "@/lib/hitungHarga";
import { hitungJarakJalanKm, cariTarif, validasiKoordinat } from "@/lib/ongkir";
import { jamBukaTutupUntukTanggal } from "@/lib/jam";

export async function POST(request) {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { pesan: "Silakan masuk terlebih dahulu untuk melakukan checkout." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: profil } = await supabase
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profil || profil.role !== "pelanggan") {
    return NextResponse.json(
      { pesan: "Hanya pelanggan yang dapat melakukan pemesanan." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const nama_penerima = (body.nama_penerima || "").trim();
  const no_wa = (body.no_wa || "").trim();
  const metode_pengiriman = body.metode_pengiriman || "Ambil";
  const alamat = (body.alamat || "").trim();
  const lat_tujuan_raw = body.lat_tujuan;
  const lng_tujuan_raw = body.lng_tujuan;
  const tanggal_ambil = body.tanggal_ambil || "";
  const jam_ambil = (body.jam_ambil || "").slice(0, 5);
  const catatan = (body.catatan || "").trim();
  const metode_bayar = body.metode_bayar || "Transfer Bank";

  if (!nama_penerima) {
    return NextResponse.json(
      { pesan: "Nama penerima wajib diisi." },
      { status: 400 }
    );
  }

  if (!no_wa) {
    return NextResponse.json(
      { pesan: "Nomor WhatsApp wajib diisi." },
      { status: 400 }
    );
  }

  if (metode_bayar !== "Transfer Bank" && metode_bayar !== "QRIS") {
    return NextResponse.json(
      { pesan: "Metode pembayaran hanya mendukung Transfer Bank atau QRIS." },
      { status: 400 }
    );
  }

  if (metode_pengiriman !== "Ambil" && metode_pengiriman !== "Kirim") {
    return NextResponse.json(
      { pesan: "Metode pengiriman tidak valid." },
      { status: 400 }
    );
  }

  if (metode_pengiriman === "Kirim") {
    if (!alamat) {
      return NextResponse.json(
        { pesan: "Alamat pengiriman wajib diisi untuk metode kirim." },
        { status: 400 }
      );
    }
    if (
      lat_tujuan_raw === undefined ||
      lng_tujuan_raw === undefined ||
      lat_tujuan_raw === null ||
      lng_tujuan_raw === null ||
      !validasiKoordinat(lat_tujuan_raw, lng_tujuan_raw)
    ) {
      return NextResponse.json(
        { pesan: "Titik lokasi pengiriman tidak valid atau belum dipilih pada peta." },
        { status: 400 }
      );
    }
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

  const { data: keranjang, error: errCart } = await supabase
    .from("keranjang_item")
    .select("*")
    .eq("id_pelanggan", user.id)
    .order("dibuat_pada", { ascending: true });

  if (errCart || !keranjang || keranjang.length === 0) {
    return NextResponse.json(
      { pesan: "Keranjang belanja Anda masih kosong." },
      { status: 400 }
    );
  }

  if (keranjang.length > 20) {
    return NextResponse.json(
      { pesan: "Keranjang melebihi batas maksimal 20 item." },
      { status: 400 }
    );
  }

  let customCount = 0;
  let katalogCount = 0;
  for (let i = 0; i < keranjang.length; i++) {
    if (keranjang[i].jenis === "Custom") customCount++;
    else katalogCount++;
  }

  if (customCount > 10) {
    return NextResponse.json(
      { pesan: "Keranjang melebihi batas maksimal 10 kue custom." },
      { status: 400 }
    );
  }

  const { data: semuaProduk } = await supabase
    .from("produk")
    .select("*");

  const produkMap = new Map();
  for (let i = 0; i < (semuaProduk || []).length; i++) {
    produkMap.set(Number(semuaProduk[i].id), semuaProduk[i]);
  }

  const produkNonaktif = [];
  for (let i = 0; i < keranjang.length; i++) {
    const item = keranjang[i];
    if (item.jenis === "Katalog" || item.jenis === "Siap") {
      const p = produkMap.get(Number(item.id_produk));
      if (!p || !p.aktif) {
        produkNonaktif.push(p ? p.nama : `Produk ID #${item.id_produk}`);
      }
    }
  }

  if (produkNonaktif.length > 0) {
    return NextResponse.json(
      {
        pesan: `Produk berikut sudah tidak tersedia atau nonaktif: ${produkNonaktif.join(", ")}. Silakan hapus dari keranjang.`,
      },
      { status: 400 }
    );
  }

  const { data: semuaOpsi } = await supabase
    .from("opsi_item")
    .select("*, grup_opsi(nama, peran_visual)");

  const opsiMap = new Map();
  for (let i = 0; i < (semuaOpsi || []).length; i++) {
    opsiMap.set(Number(semuaOpsi[i].id), semuaOpsi[i]);
  }

  const opsiNonaktif = [];
  for (let i = 0; i < keranjang.length; i++) {
    const item = keranjang[i];
    if (item.jenis === "Custom") {
      const listPilihan = Array.isArray(item.pilihan) ? item.pilihan : [];
      for (let j = 0; j < listPilihan.length; j++) {
        const p = listPilihan[j];
        const optId = Number(typeof p === "object" ? p.id_item : p);
        const opt = opsiMap.get(optId);
        if (!opt || !opt.aktif) {
          opsiNonaktif.push(opt ? opt.nama : `Opsi ID #${optId}`);
        }
      }
    }
  }

  if (opsiNonaktif.length > 0) {
    return NextResponse.json(
      {
        pesan: `Pilihan opsi custom berikut sudah tidak tersedia: ${opsiNonaktif.join(", ")}. Silakan racik ulang kue custom Anda.`,
      },
      { status: 400 }
    );
  }

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  let ongkir = 0;
  let jarak_km = null;
  let lat_tujuan = null;
  let lng_tujuan = null;

  if (metode_pengiriman === "Kirim") {
    lat_tujuan = Number(lat_tujuan_raw);
    lng_tujuan = Number(lng_tujuan_raw);

    const latToko =
      pengaturan?.lat_toko !== null && pengaturan?.lat_toko !== undefined
        ? Number(pengaturan.lat_toko)
        : null;
    const lngToko =
      pengaturan?.lng_toko !== null && pengaturan?.lng_toko !== undefined
        ? Number(pengaturan.lng_toko)
        : null;

    if (latToko === null || lngToko === null || isNaN(latToko) || isNaN(lngToko)) {
      return NextResponse.json(
        { pesan: "Pengiriman belum tersedia karena lokasi toko belum diatur." },
        { status: 400 }
      );
    }

    const { data: daftarTarif } = await supabase
      .from("tarif_jarak")
      .select("*")
      .eq("aktif", true)
      .order("jarak_maks_km", { ascending: true });

    if (!daftarTarif || daftarTarif.length === 0) {
      return NextResponse.json(
        { pesan: "Pengiriman belum tersedia karena tarif jarak belum diatur." },
        { status: 400 }
      );
    }

    const faktorJalan = pengaturan?.faktor_jalan ? Number(pengaturan.faktor_jalan) : 1.3;
    const maksKm = pengaturan?.maks_jarak_kirim_km ? Number(pengaturan.maks_jarak_kirim_km) : null;

    jarak_km = hitungJarakJalanKm(latToko, lngToko, lat_tujuan, lng_tujuan, faktorJalan);
    const hasilTarif = cariTarif(jarak_km, daftarTarif, maksKm);

    if (hasilTarif.status === "tokoBelumDiatur") {
      return NextResponse.json(
        { pesan: "Pengiriman belum tersedia." },
        { status: 400 }
      );
    }

    if (hasilTarif.status === "diluarJangkauan") {
      const infoBatas = maksKm ? ` (maksimal ${maksKm} km)` : "";
      return NextResponse.json(
        { pesan: `Alamat pengiriman di luar jangkauan${infoBatas}. Jarak: ${jarak_km} km. Pilih Ambil di Tempat atau hubungi toko.` },
        { status: 400 }
      );
    }

    ongkir = hasilTarif.tarif;
  }

  const minimalHariCustom = pengaturan?.minimal_hari_pesan ?? 2;
  const minimalHariKatalog = pengaturan?.minimal_hari_katalog ?? pengaturan?.minimal_hari_siap ?? 1;
  const kuotaHarian = pengaturan?.kuota_harian ?? 5;

  const jamKhusus = jamBukaTutupUntukTanggal(tanggal_ambil, pengaturan);
  const jamBuka = jamKhusus.buka;
  const jamTutup = jamKhusus.tutup;

  let minimalHari = minimalHariCustom;
  if (customCount > 0 && katalogCount > 0) {
    minimalHari = Math.max(minimalHariCustom, minimalHariKatalog);
  } else if (customCount > 0 && katalogCount === 0) {
    minimalHari = minimalHariCustom;
  } else if (customCount === 0 && katalogCount > 0) {
    minimalHari = minimalHariKatalog;
  }

  const tanggalMinimal = hitungTanggalMinimal(minimalHari);

  if (tanggal_ambil < tanggalMinimal) {
    return NextResponse.json(
      {
        pesan: `Tanggal pengambilan minimal adalah ${tanggalMinimal} berdasarkan isi keranjang Anda.`,
      },
      { status: 400 }
    );
  }

  const { data: tutup } = await supabase
    .from("tanggal_tutup")
    .select("alasan")
    .eq("tanggal", tanggal_ambil)
    .single();

  if (tutup) {
    return NextResponse.json(
      {
        pesan: `Toko tutup pada tanggal tersebut: ${tutup.alasan || "Libur operasional"}. Silakan pilih tanggal lain.`,
      },
      { status: 400 }
    );
  }

  if (customCount > 0) {
    const hariIni = getTanggalHariIniJakarta();
    const { data: pesananAktif } = await supabase
      .from("pesanan")
      .select("id")
      .eq("tanggal_ambil", tanggal_ambil)
      .gte("tanggal_ambil", hariIni)
      .neq("status_pesanan", "Dibatalkan");

    const pesananIds = (pesananAktif || []).map((p) => p.id);
    let totalCustomAktif = 0;

    if (pesananIds.length > 0) {
      const { data: itemsAktif } = await supabase
        .from("pesanan_item")
        .select("id")
        .in("id_pesanan", pesananIds)
        .eq("jenis", "Custom");

      if (itemsAktif && itemsAktif.length > 0) {
        totalCustomAktif = itemsAktif.length;
      } else {
        totalCustomAktif = pesananIds.length;
      }
    }

    if (totalCustomAktif + customCount > kuotaHarian) {
      return NextResponse.json(
        {
          pesan: `Kapasitas dapur untuk kue custom pada tanggal ${tanggal_ambil} sudah penuh. Silakan pilih tanggal lain.`,
        },
        { status: 400 }
      );
    }
  }

  if (jam_ambil < jamBuka || jam_ambil > jamTutup) {
    return NextResponse.json(
      {
        pesan: `Jam pengambilan harus berada di antara jam buka (${jamBuka}) dan jam tutup (${jamTutup}).`,
      },
      { status: 400 }
    );
  }

  const hasilHitung = hitungPesanan(
    keranjang,
    semuaOpsi || [],
    semuaProduk || [],
    ongkir,
    pengaturan
  );

  let kodePesanan = "";
  let unik = false;
  let percobaan = 0;

  while (!unik && percobaan < 20) {
    percobaan++;
    const angkaAcak = Math.floor(1000 + Math.random() * 9000);
    const calonKode = `KUE-${angkaAcak}`;
    const { data: adaKode } = await supabase
      .from("pesanan")
      .select("id")
      .eq("kode_pesanan", calonKode)
      .single();

    if (!adaKode) {
      kodePesanan = calonKode;
      unik = true;
    }
  }

  if (!unik) {
    kodePesanan = `KUE-${Date.now().toString().slice(-6)}`;
  }

  const { data: pesananBaru, error: errPesanan } = await supabase
    .from("pesanan")
    .insert({
      kode_pesanan: kodePesanan,
      id_pelanggan: user.id,
      nama_penerima: nama_penerima,
      no_wa: no_wa,
      catatan: catatan,
      tanggal_ambil: tanggal_ambil,
      jam_ambil: jam_ambil,
      metode_pengiriman: metode_pengiriman,
      alamat: metode_pengiriman === "Kirim" ? alamat : null,
      id_zona: null,
      lat_tujuan: metode_pengiriman === "Kirim" ? lat_tujuan : null,
      lng_tujuan: metode_pengiriman === "Kirim" ? lng_tujuan : null,
      jarak_km: metode_pengiriman === "Kirim" ? jarak_km : null,
      ongkir: ongkir,
      total_kue: hasilHitung.total_kue,
      total_bayar: hasilHitung.total_bayar,
      persen_dp_saat_pesan: hasilHitung.persen_dp,
      jumlah_dp: hasilHitung.jumlah_dp,
      jumlah_terbayar: 0,
      status_pesanan: "Menunggu Pembayaran",
      status_bayar: "Belum Bayar",
    })
    .select()
    .single();

  if (errPesanan || !pesananBaru) {
    return NextResponse.json(
      { pesan: "Gagal membuat pesanan. Silakan coba lagi." },
      { status: 500 }
    );
  }

  let gagalRollback = false;
  const filesDipindahkan = [];

  try {
    for (let i = 0; i < hasilHitung.rincian.length; i++) {
      const r = hasilHitung.rincian[i];
      const rawItem = keranjang[i];

      let pathPreviewBaru = null;
      let pathBentukBaru = null;
      let pathGambarBaru = null;

      if (r.jenis === "Custom") {
        const pindahkanFile = async (oldPath, suffix) => {
          if (!oldPath) return null;
          const ext = oldPath.split(".").pop() || "jpg";
          const newPath = `pesanan/${kodePesanan}/${Date.now()}_${suffix}.${ext}`;
          const { error: errCopy } = await supabase.storage
            .from("referensi-kue")
            .copy(oldPath, newPath);

          if (!errCopy) {
            filesDipindahkan.push({ oldPath, newPath });
            return newPath;
          }
          return oldPath;
        };

        if (rawItem.foto_preview) {
          pathPreviewBaru = await pindahkanFile(rawItem.foto_preview, "preview");
        }
        if (rawItem.foto_bentuk_kustom) {
          pathBentukBaru = await pindahkanFile(rawItem.foto_bentuk_kustom, "bentuk");
        }
        if (rawItem.foto_gambar_kustom) {
          pathGambarBaru = await pindahkanFile(rawItem.foto_gambar_kustom, "gambar");
        }
      }

      const { data: pesItemBaru, error: errPesItem } = await supabase
        .from("pesanan_item")
        .insert({
          id_pesanan: pesananBaru.id,
          jenis: r.jenis === "Siap" ? "Katalog" : r.jenis,
          id_produk: (r.jenis === "Katalog" || r.jenis === "Siap") ? r.id_produk : null,
          nama_item: r.nama,
          harga_satuan: r.harga_satuan,
          jumlah: r.jumlah,
          subtotal: r.subtotal,
          tulisan_kue: rawItem.tulisan_kue || "",
          catatan: rawItem.catatan || "",
          desain_json: rawItem.desain_json || null,
          foto_preview: pathPreviewBaru || rawItem.foto_preview || null,
          foto_bentuk_kustom: pathBentukBaru || rawItem.foto_bentuk_kustom || null,
          foto_gambar_kustom: pathGambarBaru || rawItem.foto_gambar_kustom || null,
          urutan: i + 1,
        })
        .select()
        .single();

      if (errPesItem || !pesItemBaru) {
        throw new Error("Gagal menyimpan item pesanan");
      }

      if (r.jenis === "Custom" && Array.isArray(r.rincian_opsi)) {
        for (let j = 0; j < r.rincian_opsi.length; j++) {
          const opt = r.rincian_opsi[j];
          const optFull = opsiMap.get(Number(opt.id_item));
          const namaGrup = optFull?.grup_opsi?.nama || "Opsi";
          const peranVisual = optFull?.grup_opsi?.peran_visual || null;

          await supabase.from("pesanan_pilihan").insert({
            id_pesanan: pesananBaru.id,
            id_pesanan_item: pesItemBaru.id,
            nama_grup: namaGrup,
            nama_item: opt.nama,
            harga: opt.harga,
            jumlah: opt.jumlah,
            warna: optFull?.warna || null,
            kode_visual: optFull?.kode_visual || null,
            peran_visual: peranVisual,
          });
        }
      }
    }

    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesananBaru.id,
      keterangan: "Pesanan Dibuat",
      id_user: user.id,
    });

    const oldFilesToDelete = [];
    for (let i = 0; i < filesDipindahkan.length; i++) {
      oldFilesToDelete.push(filesDipindahkan[i].oldPath);
    }
    if (oldFilesToDelete.length > 0) {
      await supabase.storage.from("referensi-kue").remove(oldFilesToDelete);
    }

    await supabase
      .from("keranjang_item")
      .delete()
      .eq("id_pelanggan", user.id);
  } catch (err) {
    gagalRollback = true;
    await supabase.from("pesanan").delete().eq("id", pesananBaru.id);

    return NextResponse.json(
      { pesan: "Terjadi kesalahan saat memproses pesanan. Keranjang Anda tetap aman." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sukses: true,
    pesan: "Pesanan berhasil dibuat.",
    kode_pesanan: kodePesanan,
    total_bayar: hasilHitung.total_bayar,
    jumlah_dp: hasilHitung.jumlah_dp,
    sisa: hasilHitung.sisa,
  });
}
