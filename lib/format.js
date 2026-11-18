export function formatRupiah(angka) {
  const nilai = Number(angka) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(nilai)
    .replace(/\u00A0/g, " ");
}

export function formatTanggalIndonesia(tanggal) {
  if (!tanggal) return "";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTanggal(tanggal) {
  if (!tanggal) return "";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTanggalSingkat(tanggal) {
  if (!tanggal) return "";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatWaktu(tanggal) {
  if (!tanggal) return "";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatTanggalWaktu(tanggal) {
  if (!tanggal) return "";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return `${formatTanggal(d)}, ${formatWaktu(d)}`;
}

export function getTanggalHariIniJakarta() {
  const sekarang = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(sekarang);
}
