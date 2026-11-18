export function BadgeStatusPesanan({ status }) {
  let kelas = "bg-stone-100 text-stone-700";

  if (status === "Menunggu Pembayaran") {
    kelas = "bg-stone-100 text-stone-700";
  } else if (status === "Diterima") {
    kelas = "bg-sky-100 text-sky-800";
  } else if (status === "Sedang Dibuat") {
    kelas = "bg-amber-100 text-amber-800";
  } else if (status === "Siap") {
    kelas = "bg-emerald-100 text-emerald-800";
  } else if (status === "Dikirim") {
    kelas = "bg-indigo-100 text-indigo-800";
  } else if (status === "Selesai") {
    kelas = "bg-green-100 text-green-800";
  } else if (status === "Dibatalkan") {
    kelas = "bg-rose-100 text-rose-800";
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${kelas}`}>
      {status}
    </span>
  );
}

export function BadgeStatusBayar({ status }) {
  let kelas = "bg-rose-100 text-rose-800";

  if (status === "Lunas") {
    kelas = "bg-emerald-100 text-emerald-800";
  } else if (status === "DP Dibayar") {
    kelas = "bg-amber-100 text-amber-800";
  } else if (status === "Belum Bayar") {
    kelas = "bg-rose-100 text-rose-800";
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${kelas}`}>
      {status}
    </span>
  );
}
