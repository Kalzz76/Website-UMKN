import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { getTanggalHariIniJakarta, hitungTanggalMinimal } from "@/lib/format";
import { hitungPesanan } from "@/lib/hitungHarga";
import { jamBukaTutupUntukTanggal } from "@/lib/jam";
import { hitungJarakJalan, validasiKoordinat, cariTarifJarak } from "@/lib/ongkir";
import { hitungEstimasi } from "@/lib/estimasi";

function validasiDanNormalisasiWa(noWaRaw) {
  const bersih = (noWaRaw || "").trim().replace(/[\s\-]/g, "");
  const match = bersih.match(/^(\+628|628|08)(\d{8,13})$/);
  if (!match) return null;
  return `628${match[2]}`;
}

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

  const { data: keranjang, error: errCart } = await supabase
    .from("keranjang_item")
    .select("*")
    .eq("id_pelanggan", user.id)
    .order("dibuat_pada", { ascending: true });

  if (errCart || !keranjang || keranjang.length === 0) {
    const batasMenitLalu = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: pesananTerbaru } = await supabase
      .from("pesanan")
      .select("kode_pesanan")
      .eq("id_pelanggan", user.id)
      .gte("dibuat_pada", batasMenitLalu)
      .order("dibuat_pada", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pesananTerbaru) {
      return NextResponse.json(
        {
          pesan: "Pesanan sudah diproses sebelumnya.",
          kode_pesanan: pesananTerbaru.kode_pesanan,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { pesan: "Keranjang belanja Anda masih kosong." },
      { status: 400 }
    );
  }

  const { data: pesananMenunggu } = await supabase
    .from("pesanan")
    .select("id")
    .eq("id_pelanggan", user.id)
    .eq("status_pesanan", "Menunggu Pembayaran");

  if (pesananMenunggu && pesananMenunggu.length >= 3) {
    return NextResponse.json(
      {
        pesan: "Anda memiliki 3 pesanan yang berstatus Menunggu Pembayaran. Silakan selesaikan pembayaran pesanan sebelumnya terlebih dahulu.",
      },
      { status: 400 }
    );
  }

  const body = await request.json();
  const nama_penerima = (body.nama_penerima || "").trim();
  const noWaRaw = (body.no_wa || "").trim();
  const metode_pengiriman = body.metode_pengiriman || "Ambil";
  const alamat = (body.alamat || "").trim();
  const patokan = (body.patokan || "").trim();
  const catatan = (body.catatan || "").trim();

  if (!nama_penerima) {
    return NextResponse.json(
      { pesan: "Nama pemesan wajib diisi." },
      { status: 400 }
    );
  }

  const no_wa = validasiDanNormalisasiWa(noWaRaw);
  if (!no_wa) {
    return NextResponse.json(
      { pesan: "Nomor WhatsApp tidak valid. Gunakan format Indonesia yang diawali 08, 628, atau +628." },
      { status: 400 }
    );
  }

  if (metode_pengiriman !== "Ambil" && metode_pengiriman !== "Kirim") {
    return NextResponse.json(
      { pesan: "Metode pengiriman tidak valid." },
      { status: 400 }
    );
  }

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const minimalHariCustom = Number(pengaturan?.minimal_hari_pesan ?? 2);
  const minimalHariKatalog = Number(pengaturan?.minimal_hari_katalog ?? pengaturan?.minimal_hari_siap ?? 1);
  const kuotaHarian = Number(pengaturan?.kuota_harian ?? 5);

  let customCount = 0;
  let katalogCount = 0;
  for (let i = 0; i < keranjang.length; i++) {
    if (keranjang[i].jenis === "Custom") customCount++;
    else katalogCount++;
  }

  if (keranjang.length > 20) {
    return NextResponse.json(
      { pesan: "Keranjang melebihi batas maksimal 20 item." },
      { status: 400 }
    );
  }

  if (customCount > 10) {
    return NextResponse.json(
      { pesan: "Keranjang melebihi batas maksimal 10 kue custom." },
      { status: 400 }
    );
  }

  const { data: semuaProduk } = await supabase.from("produk").select("*");
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
        pesan: `Produk berikut sudah tidak tersedia: ${produkNonaktif.join(", ")}. Silakan periksa kembali keranjang Anda.`,
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
        pesan: `Pilihan opsi custom berikut sudah tidak tersedia: ${opsiNonaktif.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const hariIni = getTanggalHariIniJakarta();
  const { data: listTutup } = await supabase
    .from("tanggal_tutup")
    .select("tanggal, alasan");

  const { data: pesananAktifRaw } = await supabase
    .from("pesanan")
    .select("id, tanggal_ambil, dibuat_pada, status_pesanan")
    .gte("tanggal_ambil", hariIni)
    .neq("status_pesanan", "Dibatalkan");

  const batasBayarJam = Number(pengaturan?.batas_bayar_jam ?? 24);
  const sekarangMs = Date.now();
  const pesananAktif = (pesananAktifRaw || []).filter((p) => {
    if (p.status_pesanan === "Menunggu Pembayaran") {
      const expMs = new Date(p.dibuat_pada).getTime() + batasBayarJam * 3600 * 1000;
      if (expMs <= sekarangMs) return false;
    }
    return true;
  });

  const pesananIds = (pesananAktif || []).map((p) => p.id);
  let customItemsPerPesanan = new Map();
  if (pesananIds.length > 0) {
    const { data: itemsAktif } = await supabase
      .from("pesanan_item")
      .select("id_pesanan, jenis")
      .in("id_pesanan", pesananIds)
      .eq("jenis", "Custom");

    if (itemsAktif) {
      for (let i = 0; i < itemsAktif.length; i++) {
        const idPes = itemsAktif[i].id_pesanan;
        customItemsPerPesanan.set(idPes, (customItemsPerPesanan.get(idPes) || 0) + 1);
      }
    }
  }

  const customPerTanggal = {};
  for (let i = 0; i < (pesananAktif || []).length; i++) {
    const p = pesananAktif[i];
    const tgl = p.tanggal_ambil;
    const count = customItemsPerPesanan.has(p.id)
      ? customItemsPerPesanan.get(p.id)
      : 1;
    customPerTanggal[tgl] = (customPerTanggal[tgl] || 0) + count;
  }

  const tanggalPenuh = [];
  for (const tgl in customPerTanggal) {
    if (customPerTanggal[tgl] + (customCount > 0 ? customCount - 1 : 0) >= kuotaHarian) {
      tanggalPenuh.push(tgl);
    }
  }

  let ongkir = 0;
  let jarak_km = null;
  let lat_tujuan = null;
  let lng_tujuan = null;
  let tanggal_ambil = "";
  let jam_ambil = null;

  if (metode_pengiriman === "Kirim") {
    if (!alamat) {
      return NextResponse.json(
        { pesan: "Alamat pengiriman wajib diisi." },
        { status: 400 }
      );
    }

    lat_tujuan = Number(body.lat_tujuan);
    lng_tujuan = Number(body.lng_tujuan);

    if (!validasiKoordinat(lat_tujuan, lng_tujuan)) {
      return NextResponse.json(
        { pesan: "Koordinat lokasi pengiriman tidak valid untuk wilayah Indonesia." },
        { status: 400 }
      );
    }

    const latToko = Number(pengaturan?.lat_toko);
    const lngToko = Number(pengaturan?.lng_toko);

    if (!validasiKoordinat(latToko, lngToko)) {
      return NextResponse.json(
        { pesan: "Pengiriman belum tersedia (lokasi toko belum dikonfigurasi)." },
        { status: 400 }
      );
    }

    const faktorJalan = Number(pengaturan?.faktor_jalan) || 1.3;
    const maksJarak = Number(pengaturan?.maks_jarak_kirim_km) || 20;

    jarak_km = hitungJarakJalan(latToko, lngToko, lat_tujuan, lng_tujuan, faktorJalan);

    if (jarak_km > maksJarak) {
      return NextResponse.json(
        {
          pesan: `Alamat tujuan berjarak ${jarak_km} km, melebihi batas jangkauan pengiriman (${maksJarak} km).`,
        },
        { status: 400 }
      );
    }

    const { data: daftarTarif } = await supabase
      .from("tarif_jarak")
      .select("id, jarak_maks_km, tarif, aktif")
      .eq("aktif", true)
      .order("jarak_maks_km", { ascending: true });

    const tarifDitemukan = cariTarifJarak(jarak_km, daftarTarif || [], maksJarak);

    if (tarifDitemukan === null) {
      return NextResponse.json(
        { pesan: `Tarif pengiriman untuk jarak ${jarak_km} km tidak tersedia.` },
        { status: 400 }
      );
    }

    ongkir = tarifDitemukan;

    const estimasiKirim = hitungEstimasi({
      adaCustom: customCount > 0,
      adaKatalog: katalogCount > 0,
      metode: "Kirim",
      tanggalDiminta: body.tanggal_diminta || "",
      hariIni,
      pengaturan,
      tanggalTutup: listTutup || [],
      tanggalPenuh,
    });

    if (!estimasiKirim.valid) {
      return NextResponse.json(
        { pesan: estimasiKirim.pesan || "Tanggal pengiriman tidak valid." },
        { status: 400 }
      );
    }

    tanggal_ambil = estimasiKirim.tanggalPasti || estimasiKirim.tanggalAwal;
    jam_ambil = null;
  } else {
    ongkir = 0;
    tanggal_ambil = body.tanggal_ambil || "";
    jam_ambil = (body.jam_ambil || "").slice(0, 5);

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

    const estimasiAmbil = hitungEstimasi({
      adaCustom: customCount > 0,
      adaKatalog: katalogCount > 0,
      metode: "Ambil",
      tanggalDiminta: tanggal_ambil,
      jamDiminta: jam_ambil,
      hariIni,
      pengaturan,
      tanggalTutup: listTutup || [],
      tanggalPenuh,
    });

    if (!estimasiAmbil.valid) {
      return NextResponse.json(
        { pesan: estimasiAmbil.pesan || "Jadwal pengambilan tidak valid." },
        { status: 400 }
      );
    }
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
      .maybeSingle();

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
      patokan: metode_pengiriman === "Kirim" ? patokan : null,
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

    const oldFilesToDelete = filesDipindahkan.map((f) => f.oldPath);
    if (oldFilesToDelete.length > 0) {
      await supabase.storage.from("referensi-kue").remove(oldFilesToDelete);
    }

    await supabase
      .from("keranjang_item")
      .delete()
      .eq("id_pelanggan", user.id);
  } catch (err) {
    await supabase.from("pesanan_pilihan").delete().eq("id_pesanan", pesananBaru.id);
    await supabase.from("pesanan_item").delete().eq("id_pesanan", pesananBaru.id);
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
