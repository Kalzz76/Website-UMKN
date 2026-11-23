export function hitungJarakLurusKm(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

export function hitungJarakJalanKm(lat1, lon1, lat2, lon2, faktorJalan = 1.3) {
  const lurus = hitungJarakLurusKm(lat1, lon1, lat2, lon2);
  const f = Number(faktorJalan) >= 1 ? Number(faktorJalan) : 1.3;
  return Math.ceil(lurus * f * 10) / 10;
}

export function cariTarif(jarakKm, daftarTarif = [], maksKm = null) {
  const aktif = (daftarTarif || [])
    .filter((t) => t && t.aktif)
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

export function validasiKoordinat(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng)) return false;
  return nLat >= -11 && nLat <= 6 && nLng >= 95 && nLng <= 141;
}
