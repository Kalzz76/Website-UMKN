const mapRateLimit = new Map();

setInterval(() => {
  const sekarang = Date.now();
  for (const [kunci, data] of mapRateLimit.entries()) {
    if (sekarang - data.waktuMulai > 60000) {
      mapRateLimit.delete(kunci);
    }
  }
}, 60000);

export function cekRateLimit(kunci, batasMaks = 10, rentangWaktuMs = 10000) {
  const sekarang = Date.now();
  const data = mapRateLimit.get(kunci);

  if (!data || sekarang - data.waktuMulai > rentangWaktuMs) {
    mapRateLimit.set(kunci, { waktuMulai: sekarang, hitungan: 1 });
    return { diizinkan: true, sisa: batasMaks - 1 };
  }

  if (data.hitungan >= batasMaks) {
    return {
      diizinkan: false,
      sisa: 0,
      tungguDetik: Math.ceil((rentangWaktuMs - (sekarang - data.waktuMulai)) / 1000),
    };
  }

  data.hitungan += 1;
  return { diizinkan: true, sisa: batasMaks - data.hitungan };
}
