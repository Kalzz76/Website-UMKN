import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { hitungKebutuhanBahan } from "@/lib/resepKalkulator";
import DashboardAdminView from "@/components/DashboardAdminView";
import DashboardStafView from "@/components/DashboardStafView";

export const metadata = {
  title: "Dashboard - Cravely Bakery",
};

async function hitungKueHariIni(supabase, tglHariIni) {
  const { data: pesananHariIni } = await supabase
    .from("pesanan")
    .select("id, tulisan_kue, desain_json")
    .in("status_pesanan", ["Diterima", "Sedang Dibuat"])
    .eq("tanggal_ambil", tglHariIni);

  if (!pesananHariIni || pesananHariIni.length === 0) return 0;
  const ids = pesananHariIni.map((p) => p.id);

  const { data: itemsHariIni } = await supabase
    .from("pesanan_item")
    .select("id_pesanan, jenis")
    .in("id_pesanan", ids)
    .eq("jenis", "Custom");

  let total = 0;
  const countedOrders = new Set();
  if (itemsHariIni && itemsHariIni.length > 0) {
    for (let i = 0; i < itemsHariIni.length; i++) {
      countedOrders.add(itemsHariIni[i].id_pesanan);
      total += 1;
    }
  }

  for (let i = 0; i < pesananHariIni.length; i++) {
    const p = pesananHariIni[i];
    if (!countedOrders.has(p.id) && (p.tulisan_kue || p.desain_json)) {
      total += 1;
    }
  }

  return total;
}

export default async function DashboardPage() {
  const { profil } = await cekRole(["admin", "staf"]);
  const role = profil?.role || "staf";

  if (role === "staf") {
    redirect("/dashboard/hari-ini");
  }

  const supabase = await getSupabaseServer();

  const sekarang = new Date();
  const formatIsoJakarta = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  const tglHariIni = formatIsoJakarta.format(sekarang);

  if (role === "staf") {
    const [
      { data: pengaturan },
      { count: perluDiprosesCount },
      kueHariIniTotal,
      { count: siapHariIniCount },
      { count: menungguPelunasanCount },
      { data: antreanRaw },
      { data: bahanData },
    ] = await Promise.all([
      supabase
        .from("pengaturan_toko")
        .select("nama_toko, slogan")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("pesanan")
        .select("*", { count: "exact", head: true })
        .eq("status_pesanan", "Diterima"),
      hitungKueHariIni(supabase, tglHariIni),
      supabase
        .from("pesanan")
        .select("*", { count: "exact", head: true })
        .eq("status_pesanan", "Siap")
        .eq("tanggal_ambil", tglHariIni),
      supabase
        .from("pesanan")
        .select("*", { count: "exact", head: true })
        .neq("status_pesanan", "Dibatalkan")
        .neq("status_bayar", "Lunas"),
      supabase
        .from("pesanan")
        .select("id, kode_pesanan, nama_penerima, tanggal_ambil, jam_ambil, status_pesanan, metode_pengiriman")
        .in("status_pesanan", ["Diterima", "Sedang Dibuat"])
        .order("tanggal_ambil", { ascending: true })
        .order("jam_ambil", { ascending: true })
        .limit(10),
      supabase
        .from("bahan")
        .select("id, nama, satuan, jumlah, batas_minimum"),
    ]);

    const namaToko = pengaturan?.nama_toko || "Cravely Bakery";
    const slogan = pengaturan?.slogan || "Buat hari lebih manis dengan kue terbaik kami ♡";

    const daftarAntrean = antreanRaw || [];
    const idList = daftarAntrean.map((p) => p.id);

    let pilihanMap = {};
    if (idList.length > 0) {
      const { data: pilihanData } = await supabase
        .from("pesanan_pilihan")
        .select("id_pesanan, peran_visual, warna, kode_visual")
        .in("id_pesanan", idList);

      if (pilihanData) {
        for (let i = 0; i < pilihanData.length; i++) {
          const item = pilihanData[i];
          if (!pilihanMap[item.id_pesanan]) {
            pilihanMap[item.id_pesanan] = [];
          }
          pilihanMap[item.id_pesanan].push(item);
        }
      }
    }

    const antreanKue = daftarAntrean.map((p) => ({
      ...p,
      pilihan: pilihanMap[p.id] || [],
    }));

    const { data: pesananAktif } = await supabase
      .from("pesanan")
      .select("id")
      .in("status_pesanan", ["Diterima", "Sedang Dibuat", "Siap"])
      .is("stok_dipotong_pada", null);

    let kebutuhanMap = {};
    if (pesananAktif && pesananAktif.length > 0) {
      const idList = pesananAktif.map((p) => p.id);
      const [{ data: itemsList }, { data: pilihanList }] = await Promise.all([
        supabase
          .from("pesanan_item")
          .select("id, id_pesanan, jenis, jumlah")
          .in("id_pesanan", idList),
        supabase
          .from("pesanan_pilihan")
          .select(
            "id_pesanan, id_pesanan_item, id_item, nama_grup, nama_item, kode_visual, peran_visual, jumlah"
          )
          .in("id_pesanan", idList)
          .not("id_item", "is", null),
      ]);

      const validPilihan = pilihanList || [];
      const itemIds = Array.from(new Set(validPilihan.map((p) => p.id_item)));
      if (itemIds.length > 0) {
        const { data: resepList } = await supabase
          .from("resep_item")
          .select("id_item, id_bahan, jumlah")
          .in("id_item", itemIds);

        const resepPerItem = new Map();
        for (let i = 0; i < (resepList || []).length; i++) {
          const r = resepList[i];
          if (!resepPerItem.has(Number(r.id_item))) resepPerItem.set(Number(r.id_item), []);
          resepPerItem.get(Number(r.id_item)).push(r);
        }

        const pesananItemMap = new Map(
          (itemsList || []).map((it) => [Number(it.id), it])
        );
        const { kebutuhanPerBahan } = hitungKebutuhanBahan({
          pilihanList: validPilihan,
          pesananItemMap,
          resepPerItemMap: resepPerItem,
        });
        kebutuhanMap = kebutuhanPerBahan;
      }
    }

    const stokMenipis = (bahanData || []).filter(
      (b) =>
        Number(b.jumlah) <= Number(b.batas_minimum) ||
        Number(b.jumlah) < (kebutuhanMap[b.id] || 0)
    );

    const ringkasanStaf = {
      perluDiproses: perluDiprosesCount || 0,
      kueHariIni: kueHariIniTotal || 0,
      siapHariIni: siapHariIniCount || 0,
      menungguPelunasan: menungguPelunasanCount || 0,
      stokMenipis: stokMenipis.length,
    };

    return (
      <DashboardStafView
        namaToko={namaToko}
        slogan={slogan}
        ringkasanStaf={ringkasanStaf}
        antreanKue={antreanKue}
        stokMenipis={stokMenipis}
      />
    );
  }

  const [
    { data: pengaturan },
    { count: perluDiprosesCount },
    kueHariIniTotal,
  ] = await Promise.all([
    supabase
      .from("pengaturan_toko")
      .select("nama_toko, slogan")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .eq("status_pesanan", "Diterima"),
    hitungKueHariIni(supabase, tglHariIni),
  ]);

  const namaToko = pengaturan?.nama_toko || "Cravely Bakery";
  const slogan = pengaturan?.slogan || "Buat hari lebih manis dengan kue terbaik kami ♡";

  const ringkasanHero = {
    perluDiproses: perluDiprosesCount || 0,
    kueHariIni: kueHariIniTotal || 0,
  };

  const { data: semuaPesananRaw } = await supabase
    .from("pesanan")
    .select("id, id_pelanggan, status_pesanan, total_bayar, dibuat_pada")
    .neq("status_pesanan", "Dibatalkan");

  const semuaPesanan = semuaPesananRaw || [];
  const orderTimeMap = {};
  for (let i = 0; i < semuaPesanan.length; i++) {
    orderTimeMap[semuaPesanan[i].id] = new Date(semuaPesanan[i].dibuat_pada).getTime();
  }

  const { data: semuaPembayaranRaw } = await supabase
    .from("pembayaran")
    .select("id, jumlah, dikonfirmasi_pada, status")
    .eq("status", "Dikonfirmasi");

  const semuaPembayaran = semuaPembayaranRaw || [];

  const parts = formatIsoJakarta.format(sekarang).split("-").map(Number);
  const thn = parts[0];
  const bln = parts[1];
  const tgl = parts[2];

  const tglAwalHariIni = new Date(Date.UTC(thn, bln - 1, tgl, -7, 0, 0)).getTime();
  const tglAwalKemarin = new Date(Date.UTC(thn, bln - 1, tgl - 1, -7, 0, 0)).getTime();

  const tglTujuhHariLalu = new Date(Date.UTC(thn, bln - 1, tgl - 7, -7, 0, 0)).getTime();
  const tglEmpatBelasHariLalu = new Date(Date.UTC(thn, bln - 1, tgl - 14, -7, 0, 0)).getTime();

  const tglAwalBulanIni = new Date(Date.UTC(thn, bln - 1, 1, -7, 0, 0)).getTime();
  const tglAwalBulanLalu = new Date(Date.UTC(thn, bln - 2, 1, -7, 0, 0)).getTime();

  const tglAwalTahunIni = new Date(Date.UTC(thn, 0, 1, -7, 0, 0)).getTime();
  const tglAwalTahunLalu = new Date(Date.UTC(thn - 1, 0, 1, -7, 0, 0)).getTime();

  function hitungPersen(skrg, lalu) {
    if (!lalu || lalu === 0) return null;
    return Math.round(((skrg - lalu) / lalu) * 100);
  }

  function hitungMetrikRentang(startNow, startPrev, endPrev) {
    let pesananNow = 0;
    let pesananPrev = 0;
    const pelangganNowSet = new Set();
    const pelangganPrevSet = new Set();

    for (let i = 0; i < semuaPesanan.length; i++) {
      const p = semuaPesanan[i];
      const waktu = orderTimeMap[p.id];
      if (waktu >= startNow) {
        pesananNow++;
        if (p.id_pelanggan) pelangganNowSet.add(p.id_pelanggan);
      } else if (waktu >= startPrev && waktu < endPrev) {
        pesananPrev++;
        if (p.id_pelanggan) pelangganPrevSet.add(p.id_pelanggan);
      }
    }

    let pendapatanNow = 0;
    let pendapatanPrev = 0;

    for (let i = 0; i < semuaPembayaran.length; i++) {
      const b = semuaPembayaran[i];
      if (!b.dikonfirmasi_pada) continue;
      const waktu = new Date(b.dikonfirmasi_pada).getTime();
      if (waktu >= startNow) {
        pendapatanNow += b.jumlah || 0;
      } else if (waktu >= startPrev && waktu < endPrev) {
        pendapatanPrev += b.jumlah || 0;
      }
    }

    return {
      totalPesanan: pesananNow,
      persenPesanan: hitungPersen(pesananNow, pesananPrev),
      perluDiproses: ringkasanHero.perluDiproses,
      totalPendapatan: pendapatanNow,
      persenPendapatan: hitungPersen(pendapatanNow, pendapatanPrev),
      pelangganAktif: pelangganNowSet.size,
      persenPelanggan: hitungPersen(pelangganNowSet.size, pelangganPrevSet.size),
    };
  }

  const metrikPeriode = {
    hari_ini: hitungMetrikRentang(tglAwalHariIni, tglAwalKemarin, tglAwalHariIni),
    minggu_ini: hitungMetrikRentang(tglTujuhHariLalu, tglEmpatBelasHariLalu, tglTujuhHariLalu),
    bulan_ini: hitungMetrikRentang(tglAwalBulanIni, tglAwalBulanLalu, tglAwalBulanIni),
    tahun_ini: hitungMetrikRentang(tglAwalTahunIni, tglAwalTahunLalu, tglAwalTahunIni),
  };

  const labels7Hari = [];
  const data7Hari = [];
  const namaHari = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(thn, bln - 1, tgl - i, -7, 0, 0));
    const nextD = new Date(Date.UTC(thn, bln - 1, tgl - i + 1, -7, 0, 0));
    const idxHari = d.getUTCDay();
    labels7Hari.push(namaHari[idxHari]);

    let sum = 0;
    const startWaktu = d.getTime();
    const endWaktu = nextD.getTime();

    for (let j = 0; j < semuaPembayaran.length; j++) {
      const b = semuaPembayaran[j];
      if (!b.dikonfirmasi_pada) continue;
      const w = new Date(b.dikonfirmasi_pada).getTime();
      if (w >= startWaktu && w < endWaktu) {
        sum += b.jumlah || 0;
      }
    }
    data7Hari.push(sum);
  }

  const labels30Hari = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"];
  const data30Hari = [0, 0, 0, 0];

  for (let w = 0; w < 4; w++) {
    const startW = new Date(Date.UTC(thn, bln - 1, tgl - (28 - w * 7), -7, 0, 0)).getTime();
    const endW = new Date(Date.UTC(thn, bln - 1, tgl - (21 - w * 7), -7, 0, 0)).getTime();

    for (let j = 0; j < semuaPembayaran.length; j++) {
      const b = semuaPembayaran[j];
      if (!b.dikonfirmasi_pada) continue;
      const t = new Date(b.dikonfirmasi_pada).getTime();
      if (t >= startW && t < endW) {
        data30Hari[w] += b.jumlah || 0;
      }
    }
  }

  const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const labels90Hari = [];
  const data90Hari = [0, 0, 0];

  for (let m = 2; m >= 0; m--) {
    const targetBulanIdx = (bln - 1 - m + 12) % 12;
    labels90Hari.push(namaBulan[targetBulanIdx]);

    const startM = new Date(Date.UTC(thn, bln - 1 - m, 1, -7, 0, 0)).getTime();
    const endM = new Date(Date.UTC(thn, bln - m, 1, -7, 0, 0)).getTime();

    for (let j = 0; j < semuaPembayaran.length; j++) {
      const b = semuaPembayaran[j];
      if (!b.dikonfirmasi_pada) continue;
      const t = new Date(b.dikonfirmasi_pada).getTime();
      if (t >= startM && t < endM) {
        data90Hari[2 - m] += b.jumlah || 0;
      }
    }
  }

  const dataGrafik = {
    "7hari": { labels: labels7Hari, data: data7Hari },
    "30hari": { labels: labels30Hari, data: data30Hari },
    "90hari": { labels: labels90Hari, data: data90Hari },
  };

  const { data: grupJenis } = await supabase
    .from("grup_opsi")
    .select("id, nama")
    .eq("peran_dashboard", "jenis")
    .maybeSingle();

  const { data: grupTerlaris } = await supabase
    .from("grup_opsi")
    .select("id, nama")
    .eq("peran_dashboard", "terlaris")
    .maybeSingle();

  const [semuaPilihanRes, semuaItemsRes] = await Promise.all([
    supabase
      .from("pesanan_pilihan")
      .select("id_pesanan, id_grup, nama_grup, nama_item, warna"),
    supabase
      .from("pesanan_item")
      .select("id_pesanan, jenis, nama_item, jumlah, produk(id_kategori, kategori_produk(nama))")
  ]);

  const semuaPilihan = (semuaPilihanRes.data || []).filter(
    (item) => orderTimeMap[item.id_pesanan] !== undefined
  );
  const semuaItems = semuaItemsRes.data || [];

  const periodeStartMap = {
    hari_ini: tglAwalHariIni,
    minggu_ini: tglTujuhHariLalu,
    bulan_ini: tglAwalBulanIni,
    tahun_ini: tglAwalTahunIni,
  };

  const paletDonut = ["#1e4b3c", "#608d7c", "#b2cfbe", "#8fa58f", "#d9e6dd", "#d97706"];

  const donutPerPeriode = {};
  const terlarisPerPeriode = {};

  const daftarKunciPeriode = ["hari_ini", "minggu_ini", "bulan_ini", "tahun_ini"];

  for (let k = 0; k < daftarKunciPeriode.length; k++) {
    const key = daftarKunciPeriode[k];
    const startTs = periodeStartMap[key];

    let totalKue = 0;
    const kategoriMap = {};
    let totalCustomCake = 0;
    const pesananWithItems = new Set();

    for (let m = 0; m < semuaItems.length; m++) {
      const it = semuaItems[m];
      const wt = orderTimeMap[it.id_pesanan];
      if (!wt || wt < startTs) continue;
      pesananWithItems.add(it.id_pesanan);

      const qty = Number(it.jumlah) || 1;
      if (it.jenis === "Custom") {
        totalCustomCake += qty;
        totalKue += qty;
      } else {
        const namaKategori = it.produk?.kategori_produk?.nama || "Kue Katalog";
        kategoriMap[namaKategori] = (kategoriMap[namaKategori] || 0) + qty;
        totalKue += qty;
      }
    }

    for (let i = 0; i < semuaPesanan.length; i++) {
      const p = semuaPesanan[i];
      const wt = orderTimeMap[p.id];
      if (wt && wt >= startTs && !pesananWithItems.has(p.id)) {
        totalCustomCake += 1;
        totalKue += 1;
      }
    }

    if (totalKue === 0) {
      donutPerPeriode[key] = {
        adaGrup: true,
        namaGrup: "Jenis Kue",
        kosong: true,
        pesan: "Belum ada pesanan pada periode ini",
        items: [],
        total: 0,
      };
    } else {
      const irisanList = [];
      if (totalCustomCake > 0) {
        irisanList.push({ nama: "Custom Cake", jumlah: totalCustomCake });
      }

      const kategoriSorted = Object.keys(kategoriMap)
        .map((kName) => ({ nama: kName, jumlah: kategoriMap[kName] }))
        .sort((a, b) => b.jumlah - a.jumlah);

      for (let s = 0; s < kategoriSorted.length; s++) {
        irisanList.push(kategoriSorted[s]);
      }

      irisanList.sort((a, b) => b.jumlah - a.jumlah);

      let finalIrisan = [];
      if (irisanList.length <= 4) {
        finalIrisan = irisanList;
      } else {
        finalIrisan = irisanList.slice(0, 4);
        let sisaJumlah = 0;
        for (let s = 4; s < irisanList.length; s++) {
          sisaJumlah += irisanList[s].jumlah;
        }
        if (sisaJumlah > 0) {
          finalIrisan.push({ nama: "Lainnya", jumlah: sisaJumlah });
        }
      }

      const itemsWithPercent = finalIrisan.map((item, idx) => ({
        nama: item.nama,
        jumlah: item.jumlah,
        warna: paletDonut[idx % paletDonut.length],
        persen: Math.round((item.jumlah / totalKue) * 100),
      }));

      donutPerPeriode[key] = {
        adaGrup: true,
        namaGrup: "Jenis Kue",
        kosong: false,
        pesan: "",
        items: itemsWithPercent,
        total: totalKue,
      };
    }

    let terlarisRasa = {
      adaGrup: false,
      namaGrup: "Rasa",
      kosong: true,
      pesan: "Belum ada grup yang diset sebagai terlaris di menu Katalog & Opsi",
      items: [],
    };

    if (grupTerlaris) {
      const hitungMap = {};
      const warnaMap = {};
      let totalPilihan = 0;

      for (let p = 0; p < semuaPilihan.length; p++) {
        const item = semuaPilihan[p];
        const waktuPesanan = orderTimeMap[item.id_pesanan];
        if (waktuPesanan < startTs) continue;

        const cocokGrup =
          (item.id_grup && String(item.id_grup) === String(grupTerlaris.id)) ||
          (!item.id_grup && item.nama_grup === grupTerlaris.nama);

        if (cocokGrup) {
          hitungMap[item.nama_item] = (hitungMap[item.nama_item] || 0) + 1;
          if (item.warna) warnaMap[item.nama_item] = item.warna;
          totalPilihan++;
        }
      }

      if (totalPilihan === 0) {
        terlarisRasa = {
          adaGrup: true,
          namaGrup: grupTerlaris.nama,
          kosong: true,
          pesan: "Belum ada pesanan kue custom pada periode ini",
          items: [],
        };
      } else {
        const top3 = Object.keys(hitungMap)
          .map((nama) => ({
            nama,
            jumlah: hitungMap[nama],
            warna: warnaMap[nama] || "#1e4b3c",
            persen: Math.round((hitungMap[nama] / totalPilihan) * 100),
          }))
          .sort((a, b) => b.jumlah - a.jumlah)
          .slice(0, 3);

        terlarisRasa = {
          adaGrup: true,
          namaGrup: grupTerlaris.nama,
          kosong: false,
          pesan: "",
          items: top3,
        };
      }
    }

    const hitungProdukMap = {};
    let totalProdukTerjual = 0;
    for (let m = 0; m < semuaItems.length; m++) {
      const it = semuaItems[m];
      const wt = orderTimeMap[it.id_pesanan];
      if (wt && wt >= startTs && (it.jenis === "Katalog" || it.jenis === "Siap")) {
        const qty = Number(it.jumlah) || 1;
        hitungProdukMap[it.nama_item] = (hitungProdukMap[it.nama_item] || 0) + qty;
        totalProdukTerjual += qty;
      }
    }

    let terlarisProduk = {
      adaGrup: true,
      namaGrup: "Produk Katalog",
      kosong: true,
      pesan: "Belum ada produk katalog terjual pada periode ini",
      items: [],
    };

    if (totalProdukTerjual > 0) {
      const paletProduk = ["#d97706", "#2563eb", "#059669", "#7c3aed"];
      const top3Produk = Object.keys(hitungProdukMap)
        .map((nama, idx) => ({
          nama,
          jumlah: hitungProdukMap[nama],
          warna: paletProduk[idx % paletProduk.length],
          persen: Math.round((hitungProdukMap[nama] / totalProdukTerjual) * 100),
        }))
        .sort((a, b) => b.jumlah - a.jumlah)
        .slice(0, 3);

      terlarisProduk = {
        adaGrup: true,
        namaGrup: "Produk Katalog",
        kosong: false,
        pesan: "",
        items: top3Produk,
      };
    }

    terlarisPerPeriode[key] = {
      rasa: terlarisRasa,
      produk: terlarisProduk,
    };
  }

  const { data: pesananTerbaruRaw } = await supabase
    .from("pesanan")
    .select("id, kode_pesanan, dibuat_pada, status_pesanan, total_bayar, foto_preview")
    .order("dibuat_pada", { ascending: false })
    .limit(3);

  const daftarTerbaru = pesananTerbaruRaw || [];
  const idTerbaruList = daftarTerbaru.map((p) => p.id);

  let pilihanTerbaruMap = {};
  let fotoPreviewMap = {};

  if (idTerbaruList.length > 0) {
    const [pilihanTerbaruData, itemsTerbaruData] = await Promise.all([
      supabase
        .from("pesanan_pilihan")
        .select("id_pesanan, peran_visual, warna, kode_visual")
        .in("id_pesanan", idTerbaruList),
      supabase
        .from("pesanan_item")
        .select("id_pesanan, jenis, foto_preview, produk(foto)")
        .in("id_pesanan", idTerbaruList)
        .order("urutan", { ascending: true })
    ]);

    if (pilihanTerbaruData.data) {
      for (let i = 0; i < pilihanTerbaruData.data.length; i++) {
        const item = pilihanTerbaruData.data[i];
        if (!pilihanTerbaruMap[item.id_pesanan]) {
          pilihanTerbaruMap[item.id_pesanan] = [];
        }
        pilihanTerbaruMap[item.id_pesanan].push(item);
      }
    }

    const { data: storagePublik } = supabase.storage.from("publik").getPublicUrl("");
    const basePublikUrl = storagePublik?.publicUrl ? storagePublik.publicUrl.replace(/\/+$/, "") : "";
    const adminClient = getSupabaseAdmin();

    const itemsByOrder = {};
    const itemsList = itemsTerbaruData.data || [];
    for (let i = 0; i < itemsList.length; i++) {
      const it = itemsList[i];
      if (!itemsByOrder[it.id_pesanan]) itemsByOrder[it.id_pesanan] = [];
      itemsByOrder[it.id_pesanan].push(it);
    }

    for (let i = 0; i < daftarTerbaru.length; i++) {
      const p = daftarTerbaru[i];
      const ordItems = itemsByOrder[p.id] || [];
      if (ordItems.length > 0) {
        const first = ordItems[0];
        if (first.jenis === "Custom" && first.foto_preview) {
          const { data: signed } = await adminClient.storage
            .from("referensi-kue")
            .createSignedUrl(first.foto_preview, 3600);
          if (signed) fotoPreviewMap[p.id] = signed.signedUrl;
        } else if ((first.jenis === "Katalog" || first.jenis === "Siap") && first.produk?.foto) {
          const f = first.produk.foto;
          fotoPreviewMap[p.id] = f.startsWith("http") ? f : `${basePublikUrl}/${f.replace(/^\/+/, "")}`;
        } else if (p.foto_preview) {
          const { data: signed } = await adminClient.storage
            .from("referensi-kue")
            .createSignedUrl(p.foto_preview, 3600);
          if (signed) fotoPreviewMap[p.id] = signed.signedUrl;
        }
      } else if (p.foto_preview) {
        const { data: signed } = await adminClient.storage
          .from("referensi-kue")
          .createSignedUrl(p.foto_preview, 3600);
        if (signed) fotoPreviewMap[p.id] = signed.signedUrl;
      }
    }
  }

  const pesananTerbaru = daftarTerbaru.map((p) => ({
    ...p,
    pilihan: pilihanTerbaruMap[p.id] || [],
    fotoPreviewUrl: fotoPreviewMap[p.id] || null,
  }));

  return (
    <DashboardAdminView
      namaToko={namaToko}
      slogan={slogan}
      kueHariIni={ringkasanHero.kueHariIni}
      metrikPeriode={metrikPeriode}
      dataGrafik={dataGrafik}
      terlarisPerPeriode={terlarisPerPeriode}
      donutPerPeriode={donutPerPeriode}
      pesananTerbaru={pesananTerbaru}
    />
  );
}
