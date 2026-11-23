export function hitungJarakLurusKm(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (Number(lat2) - Number(lat1)) * rad;
  const dLon = (Number(lon2) - Number(lon1)) * rad;
  const radLat1 = Number(lat1) * rad;
  const radLat2 = Number(lat2) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

export const hitungJarakKm = hitungJarakLurusKm;

export function hitungJarakJalanKm(lat1, lon1, lat2, lon2, faktorJalan = 1.3) {
  const lurus = hitungJarakLurusKm(lat1, lon1, lat2, lon2);
  const f = Math.max(1, Number(faktorJalan) || 1.3);
  return Math.ceil(lurus * f * 10) / 10;
}

export const hitungJarakJalan = hitungJarakJalanKm;

export function validasiKoordinat(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng)) return false;
  return nLat >= -11 && nLat <= 6 && nLng >= 95 && nLng <= 141;
}

export function cariTarif(jarakKm, daftarTarif = [], maksKm = null) {
  const aktif = (daftarTarif || [])
    .filter((t) => t && t.aktif !== false)
    .sort((a, b) => Number(a.jarak_maks_km) - Number(b.jarak_maks_km));

  if (aktif.length === 0) {
    return { status: "tokoBelumDiatur", tarif: 0 };
  }

  if (maksKm !== null && maksKm !== undefined && maksKm !== "") {
    const batas = Number(maksKm);
    if (!isNaN(batas) && batas > 0 && jarakKm > batas) {
      return { status: "diluarJangkauan", tarif: 0 };
    }
  }

  for (let i = 0; i < aktif.length; i++) {
    if (Number(aktif[i].jarak_maks_km) >= jarakKm) {
      return { status: "ok", tarif: Number(aktif[i].tarif) };
    }
  }

  return { status: "diluarJangkauan", tarif: 0 };
}

export function cariTarifJarak(jarakKm, daftarTarif = [], maksJarakKm = 20) {
  const hasil = cariTarif(jarakKm, daftarTarif, maksJarakKm);
  if (hasil.status === "ok") return hasil.tarif;
  return null;
}
