export function hitungTotal({
  pilihan = [],
  daftarItem = [],
  ongkir = 0,
  pengaturanDP = { mode_pembayaran: "DP", persen_dp: 50 },
}) {
  const itemMap = new Map();
  for (let i = 0; i < daftarItem.length; i++) {
    itemMap.set(Number(daftarItem[i].id), daftarItem[i]);
  }

  let total_kue = 0;
  for (let i = 0; i < pilihan.length; i++) {
    const p = pilihan[i];
    if (!p) continue;
    const itemId = Number(typeof p === "object" ? p.id_item : p);
    const qty = Number(typeof p === "object" && p.jumlah ? p.jumlah : 1);
    const itemData = itemMap.get(itemId);
    if (itemData) {
      total_kue += Number(itemData.harga || 0) * qty;
    }
  }

  const ongkirVal = Number(ongkir || 0);
  const total_bayar = total_kue + ongkirVal;

  const mode = pengaturanDP?.mode_pembayaran || "DP";
  let jumlah_dp = total_bayar;
  let persen_dp_saat_pesan = null;

  if (mode === "DP") {
    persen_dp_saat_pesan = Number(pengaturanDP?.persen_dp ?? 50);
    jumlah_dp = Math.round((total_kue * persen_dp_saat_pesan) / 100) + ongkirVal;
  }

  return {
    total_kue,
    ongkir: ongkirVal,
    total_bayar,
    jumlah_dp,
    persen_dp_saat_pesan,
  };
}

export function hitungPesanan(itemKeranjang = [], daftarItem = [], daftarProduk = [], ongkir = 0, pengaturan = null) {
  const itemMap = new Map();
  for (let i = 0; i < (daftarItem || []).length; i++) {
    itemMap.set(Number(daftarItem[i].id), daftarItem[i]);
  }

  const produkMap = new Map();
  for (let i = 0; i < (daftarProduk || []).length; i++) {
    produkMap.set(Number(daftarProduk[i].id), daftarProduk[i]);
  }

  let subtotal_custom = 0;
  let subtotal_katalog = 0;
  const rincian = [];

  for (let i = 0; i < (itemKeranjang || []).length; i++) {
    const item = itemKeranjang[i];
    if (!item) continue;

    if (item.jenis === "Custom") {
      let hargaKue = 0;
      const pilihanList = Array.isArray(item.pilihan) ? item.pilihan : [];
      const rincianOpsi = [];

      for (let j = 0; j < pilihanList.length; j++) {
        const p = pilihanList[j];
        if (!p) continue;
        const optId = Number(typeof p === "object" ? p.id_item : p);
        const optQty = Number(typeof p === "object" && p.jumlah ? p.jumlah : 1);
        const optData = itemMap.get(optId);
        const optHarga = optData ? Number(optData.harga || 0) : 0;
        hargaKue += optHarga * optQty;
        rincianOpsi.push({
          id_item: optId,
          jumlah: optQty,
          nama: optData ? optData.nama : "",
          harga: optHarga,
          subtotal: optHarga * optQty,
          itemData: optData || null,
        });
      }

      subtotal_custom += hargaKue;
      rincian.push({
        id: item.id,
        jenis: "Custom",
        nama: item.nama_item || "Kue Custom",
        harga_satuan: hargaKue,
        jumlah: 1,
        subtotal: hargaKue,
        tulisan_kue: item.tulisan_kue || "",
        catatan: item.catatan || "",
        desain_json: item.desain_json || null,
        foto_preview: item.foto_preview || null,
        foto_bentuk_kustom: item.foto_bentuk_kustom || null,
        foto_gambar_kustom: item.foto_gambar_kustom || null,
        pilihan: pilihanList,
        rincian_opsi: rincianOpsi,
      });
    } else {
      const prodId = Number(item.id_produk);
      const prodData = produkMap.get(prodId);
      const hargaSatuan = prodData ? Number(prodData.harga || 0) : Number(item.harga || 0);
      const qty = Math.max(1, Math.min(20, Number(item.jumlah || 1)));
      const subtotalItem = hargaSatuan * qty;

      subtotal_katalog += subtotalItem;
      rincian.push({
        id: item.id,
        jenis: "Katalog",
        id_produk: prodId,
        nama: prodData ? prodData.nama : (item.nama || "Kue Katalog"),
        deskripsi: prodData ? prodData.deskripsi : "",
        foto: prodData ? prodData.foto : item.foto,
        harga_satuan: hargaSatuan,
        jumlah: qty,
        subtotal: subtotalItem,
      });
    }
  }

  const ongkirVal = Number(ongkir || 0);
  const total_kue = subtotal_custom + subtotal_katalog;
  const total_bayar = total_kue + ongkirVal;

  const mode = pengaturan?.mode_pembayaran || "DP";
  let jumlah_dp = total_bayar;
  let persen_dp = null;

  if (mode === "DP") {
    persen_dp = Number(pengaturan?.persen_dp ?? 50);
    const dpCustom = Math.round((subtotal_custom * persen_dp) / 100);
    jumlah_dp = dpCustom + subtotal_katalog + ongkirVal;
  }

  const sisa = Math.max(0, total_bayar - jumlah_dp);

  return {
    subtotal_custom,
    subtotal_katalog,
    total_kue,
    ongkir: ongkirVal,
    total_bayar,
    jumlah_dp,
    sisa,
    mode_pembayaran: mode,
    persen_dp,
    rincian,
  };
}
