import { getTanggalHariIniJakarta } from "./format";
import { jamBukaTutupUntukTanggal } from "./jam";

function tambahHari(tanggalStr, jumlahHari) {
  const [y, m, d] = tanggalStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Number(jumlahHari)));
  return dt.toISOString().slice(0, 10);
}

export function hitungEstimasi({
  adaCustom = false,
  adaKatalog = false,
  metode = "Ambil",
  tanggalDiminta = "",
  jamDiminta = "",
  hariIni = "",
  pengaturan = null,
  tanggalTutup = [],
  tanggalPenuh = [],
}) {
  const today = hariIni || getTanggalHariIniJakarta();
  const minHariCustom = Number(pengaturan?.minimal_hari_pesan ?? 2);
  const minHariKatalog = Number(pengaturan?.minimal_hari_katalog ?? pengaturan?.minimal_hari_siap ?? 1);

  let minHari = minHariKatalog;
  if (adaCustom) {
    minHari = minHariCustom;
  }

  const setTutup = new Set(
    (tanggalTutup || []).map((t) => (typeof t === "string" ? t : t?.tanggal || ""))
  );
  const setPenuh = new Set(
    (tanggalPenuh || []).map((t) => (typeof t === "string" ? t : t?.tanggal || t || ""))
  );

  let tanggalAwal = tambahHari(today, minHari);
  for (let i = 0; i < 365; i++) {
    const isTutup = setTutup.has(tanggalAwal);
    const isPenuh = adaCustom && setPenuh.has(tanggalAwal);
    if (!isTutup && !isPenuh) {
      break;
    }
    tanggalAwal = tambahHari(tanggalAwal, 1);
  }

  let tanggalAkhir = tambahHari(tanggalAwal, 1);
  for (let i = 0; i < 365; i++) {
    if (!setTutup.has(tanggalAkhir)) {
      break;
    }
    tanggalAkhir = tambahHari(tanggalAkhir, 1);
  }

  if (metode === "Kirim") {
    if (tanggalDiminta) {
      if (tanggalDiminta < tanggalAwal) {
        return {
          valid: false,
          pesan: `Tanggal pengiriman minimal adalah ${tanggalAwal}.`,
          tanggalAwal,
          tanggalAkhir,
          tanggalPasti: null,
        };
      }
      if (setTutup.has(tanggalDiminta)) {
        return {
          valid: false,
          pesan: "Toko tutup pada tanggal tersebut.",
          tanggalAwal,
          tanggalAkhir,
          tanggalPasti: null,
        };
      }
      if (adaCustom && setPenuh.has(tanggalDiminta)) {
        return {
          valid: false,
          pesan: "Kuota pesanan custom penuh pada tanggal tersebut.",
          tanggalAwal,
          tanggalAkhir,
          tanggalPasti: null,
        };
      }
      return {
        valid: true,
        tanggalAwal,
        tanggalAkhir,
        tanggalPasti: tanggalDiminta,
      };
    }

    return {
      valid: true,
      tanggalAwal,
      tanggalAkhir,
      tanggalPasti: null,
    };
  }

  if (tanggalDiminta) {
    if (tanggalDiminta < tanggalAwal) {
      return {
        valid: false,
        pesan: `Tanggal pengambilan minimal adalah ${tanggalAwal}.`,
        tanggalAwal,
        tanggalPasti: null,
      };
    }
    if (setTutup.has(tanggalDiminta)) {
      return {
        valid: false,
        pesan: "Toko tutup pada tanggal tersebut.",
        tanggalAwal,
        tanggalPasti: null,
      };
    }
    if (adaCustom && setPenuh.has(tanggalDiminta)) {
      return {
        valid: false,
        pesan: "Kuota dapur kue custom pada tanggal tersebut sudah penuh.",
        tanggalAwal,
        tanggalPasti: null,
      };
    }

    if (jamDiminta) {
      const { buka, tutup } = jamBukaTutupUntukTanggal(tanggalDiminta, pengaturan);
      const jamBersih = jamDiminta.slice(0, 5);
      if (jamBersih < buka || jamBersih > tutup) {
        return {
          valid: false,
          pesan: `Jam pengambilan harus di antara ${buka} dan ${tutup}.`,
          tanggalAwal,
          tanggalPasti: tanggalDiminta,
        };
      }
    }

    return {
      valid: true,
      tanggalAwal,
      tanggalPasti: tanggalDiminta,
    };
  }

  return {
    valid: true,
    tanggalAwal,
    tanggalPasti: null,
  };
}
