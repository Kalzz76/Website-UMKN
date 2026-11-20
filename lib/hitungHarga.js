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
    jumlah_dp = Math.round((total_bayar * persen_dp_saat_pesan) / 100);
  }

  return {
    total_kue,
    ongkir: ongkirVal,
    total_bayar,
    jumlah_dp,
    persen_dp_saat_pesan,
  };
}
