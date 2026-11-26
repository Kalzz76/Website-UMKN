const NAMA_GRUP_PENGALI = new Set([
  "ukuran",
  "porsi cupcake",
  "ukuran tart",
  "jumlah donat",
  "jumlah cookies",
]);

const NAMA_GRUP_TANPA_RESEP_WAJIB = new Set([
  "ukuran",
  "porsi cupcake",
  "ukuran tart",
  "jumlah donat",
  "jumlah cookies",
  "bentuk",
  "elemen hiasan",
  "desain kustom",
  "warna krim",
]);

const FAKTOR_DEFAULT_BY_GRUP = {
  ukuran: { mini: 1, small: 1.5, medium: 2.5, large: 3.5 },
  "porsi cupcake": { mini: 1, small: 2, medium: 4, large: 6 },
  "ukuran tart": { mini: 1, small: 2, medium: 3, large: 4 },
  "jumlah donat": { mini: 1, small: 3, medium: 6, large: 12 },
  "jumlah cookies": { mini: 1, small: 3, medium: 6, large: 10 },
};

function norm(val) {
  return String(val || "").trim().toLowerCase();
}

export function isGrupPengaliUkuran(namaGrup, peranVisual) {
  if (norm(peranVisual) === "ukuran") return true;
  return NAMA_GRUP_PENGALI.has(norm(namaGrup));
}

export function isGrupOpsionalTanpaResep(namaGrup, peranVisual) {
  if (isGrupPengaliUkuran(namaGrup, peranVisual)) return true;
  return NAMA_GRUP_TANPA_RESEP_WAJIB.has(norm(namaGrup));
}

/**
 * Menentukan faktor pengali resep dari opsi Ukuran / Porsi / Jumlah.
 * Untuk paket berbasis jumlah (Donat, Cupcake, Cookies), angka pada nama opsi
 * seperti "Paket 3 Pcs" atau "Box 6 Cookies" diprioritaskan agar otomatis akurat
 * meski nama diubah admin; jika tidak ada angka, pakai pemetaan kode_visual.
 */
export function getFaktorPengaliUkuran(namaGrup, kodeVisual, namaItem) {
  const g = norm(namaGrup);
  const k = norm(kodeVisual);
  const n = norm(namaItem);

  const isPaketJumlah =
    g === "porsi cupcake" || g === "jumlah donat" || g === "jumlah cookies";

  if (isPaketJumlah && n) {
    const matchAngka = n.match(/(\d+(?:[.,]\d+)?)\s*(pcs|buah|cupcake|donat|cookie|cookies|giant)/i);
    if (matchAngka) {
      const parsed = Number(matchAngka[1].replace(",", "."));
      if (parsed > 0) return parsed;
    }
  }

  const tabelGrup = FAKTOR_DEFAULT_BY_GRUP[g];
  if (tabelGrup && k && tabelGrup[k] !== undefined) {
    return tabelGrup[k];
  }

  if (k === "mini") return 1;
  if (k === "small") return 2;
  if (k === "medium") return 3;
  if (k === "large") return 4;

  return 1;
}

export function formatFaktorPengali(faktor) {
  const f = Number(faktor) || 1;
  return `×${Number.isInteger(f) ? f : Number(f.toFixed(2))}`;
}

export function roundQty(val) {
  return Math.round(Number(val || 0) * 1000) / 1000;
}

/**
 * Menghitung total kebutuhan bahan baku untuk daftar pesanan_pilihan (bisa satu pesanan
 * atau banyak pesanan sekaligus).
 *
 * Aturan:
 * - Pilihan dikelompokkan per (id_pesanan, id_pesanan_item).
 * - Opsi bertipe Ukuran / Porsi / Jumlah menjadi pengali (faktor) untuk seluruh
 *   bahan resep opsi lain (Jenis Kue, Rasa, Isian, Topping, Glaze, Dekorasi) pada item tsb.
 * - Jika opsi Ukuran / Porsi / Jumlah sendiri diberi resep (misal kemasan Box / Toples),
 *   resep kemasan tsb TIDAK dikali faktor porsi (hanya dikali qtyItem * qtyPilihan).
 * - Seluruh kebutuhan dikalikan jumlah item pesanan (pesanan_item.jumlah).
 */
export function hitungKebutuhanBahan({
  pilihanList = [],
  pesananItemMap = new Map(),
  resepPerItemMap = new Map(),
  bahanMap = new Map(),
}) {
  const kelompokMap = new Map();

  for (let i = 0; i < pilihanList.length; i++) {
    const p = pilihanList[i];
    const key = `${p.id_pesanan || 0}::${p.id_pesanan_item || 0}`;
    if (!kelompokMap.has(key)) {
      kelompokMap.set(key, []);
    }
    kelompokMap.get(key).push(p);
  }

  const kebutuhanMap = new Map();
  const daftarPilihanTanpaResep = [];
  const ringkasanPengali = [];

  for (const [, grupPilihan] of kelompokMap.entries()) {
    const first = grupPilihan[0];
    const pesItem = first?.id_pesanan_item
      ? pesananItemMap.get(Number(first.id_pesanan_item))
      : null;
    const qtyItem = Math.max(1, Number(pesItem?.jumlah) || 1);

    let faktorUkuran = 1;
    let infoUkuran = null;

    for (let i = 0; i < grupPilihan.length; i++) {
      const p = grupPilihan[i];
      if (isGrupPengaliUkuran(p.nama_grup, p.peran_visual)) {
        faktorUkuran = getFaktorPengaliUkuran(
          p.nama_grup,
          p.kode_visual,
          p.nama_item
        );
        infoUkuran = {
          nama_grup: p.nama_grup,
          nama_item: p.nama_item,
          faktor: faktorUkuran,
          qty_item: qtyItem,
        };
        break;
      }
    }

    if (infoUkuran) {
      ringkasanPengali.push(infoUkuran);
    }

    for (let i = 0; i < grupPilihan.length; i++) {
      const p = grupPilihan[i];
      const qtyPilihan = Math.max(1, Number(p.jumlah) || 1);
      const isUkuran = isGrupPengaliUkuran(p.nama_grup, p.peran_visual);
      const resepItems = p.id_item ? resepPerItemMap.get(Number(p.id_item)) || [] : [];

      if (resepItems.length === 0) {
        if (!isGrupOpsionalTanpaResep(p.nama_grup, p.peran_visual)) {
          daftarPilihanTanpaResep.push({
            nama_grup: p.nama_grup,
            nama_item: p.nama_item,
            jumlah: qtyPilihan * qtyItem,
          });
        }
        continue;
      }

      // Kemasan pada opsi Ukuran/Porsi tidak dikali faktor porsi; bahan kue/rasa/topping dikali faktor porsi.
      const pengaliEfektif = isUkuran
        ? qtyPilihan * qtyItem
        : qtyPilihan * faktorUkuran * qtyItem;

      for (let j = 0; j < resepItems.length; j++) {
        const ri = resepItems[j];
        const bahanInfo = ri.bahan || bahanMap.get(Number(ri.id_bahan)) || null;
        const totalKebutuhanItem = Number(ri.jumlah) * pengaliEfektif;

        if (!kebutuhanMap.has(Number(ri.id_bahan))) {
          kebutuhanMap.set(Number(ri.id_bahan), {
            id_bahan: Number(ri.id_bahan),
            nama: bahanInfo?.nama || "Bahan",
            satuan: bahanInfo?.satuan || "",
            stok_sekarang: Number(bahanInfo?.jumlah) || 0,
            dibutuhkan: totalKebutuhanItem,
          });
        } else {
          const cur = kebutuhanMap.get(Number(ri.id_bahan));
          cur.dibutuhkan += totalKebutuhanItem;
        }
      }
    }
  }

  const daftarKebutuhan = Array.from(kebutuhanMap.values())
    .map((b) => {
      const dib = roundQty(b.dibutuhkan);
      const stk = roundQty(b.stok_sekarang);
      const kurang = roundQty(Math.max(0, dib - stk));
      return {
        id_bahan: b.id_bahan,
        nama: b.nama,
        satuan: b.satuan,
        stok_sekarang: stk,
        dibutuhkan: dib,
        status: kurang > 0 ? "kurang" : "cukup",
        kurang,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const kebutuhanPerBahan = {};
  for (let i = 0; i < daftarKebutuhan.length; i++) {
    kebutuhanPerBahan[daftarKebutuhan[i].id_bahan] = daftarKebutuhan[i].dibutuhkan;
  }

  return {
    daftarKebutuhan,
    kebutuhanPerBahan,
    daftarPilihanTanpaResep,
    ringkasanPengali,
  };
}
