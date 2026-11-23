export function hitungJarakKm(lat1, lon1, lat2, lon2) {
  const r = 6371;
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const radLat1 = (Number(lat1) * Math.PI) / 180;
  const radLat2 = (Number(lat2) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

export function hitungJarakJalan(lat1, lon1, lat2, lon2, faktorJalan = 1.3) {
  const faktor = Math.max(1, Number(faktorJalan) || 1.3);
  const garisLurus = hitungJarakKm(lat1, lon1, lat2, lon2);
  const jarakEstimasi = garisLurus * faktor;
  return Math.ceil(jarakEstimasi * 10) / 10;
}

export function validasiKoordinat(lat, lon) {
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (isNaN(nLat) || isNaN(nLon)) {
    return false;
  }
  if (nLat < -11.0 || nLat > 6.0) {
    return false;
  }
  if (nLon < 95.0 || nLon > 141.0) {
    return false;
  }
  return true;
}

export function cariTarifJarak(jarakKm, daftarTarif = [], maksJarakKm = 20) {
  const dist = Number(jarakKm);
  const maks = Number(maksJarakKm) || 20;

  if (isNaN(dist) || dist <= 0 || dist > maks) {
    return null;
  }

  const list = [...daftarTarif].sort(
    (a, b) => Number(a.jarak_maks_km) - Number(b.jarak_maks_km)
  );

  for (let i = 0; i < list.length; i++) {
    const tier = list[i];
    if (tier && tier.aktif !== false) {
      if (dist <= Number(tier.jarak_maks_km)) {
        return Number(tier.tarif);
      }
    }
  }

  return null;
}
