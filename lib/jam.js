export function jamBukaTutupUntukTanggal(tanggal, pengaturan) {
  if (!tanggal) {
    const bukaDef = (pengaturan?.jam_buka_senin_jumat || pengaturan?.jam_buka || "08:00").slice(0, 5);
    const tutupDef = (pengaturan?.jam_tutup_senin_jumat || pengaturan?.jam_tutup || "20:00").slice(0, 5);
    return { buka: bukaDef, tutup: tutupDef };
  }

  let d;
  if (typeof tanggal === "string") {
    const bagian = tanggal.split("T")[0].split("-");
    if (bagian.length === 3) {
      d = new Date(`${bagian[0]}-${bagian[1]}-${bagian[2]}T12:00:00+07:00`);
    } else {
      d = new Date(tanggal);
    }
  } else {
    d = tanggal;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  });
  const hari = formatter.format(d);

  if (hari === "Sat" || hari === "Sun") {
    const buka = (pengaturan?.jam_buka_sabtu_minggu || pengaturan?.jam_buka || "08:00").slice(0, 5);
    const tutup = (pengaturan?.jam_tutup_sabtu_minggu || pengaturan?.jam_tutup || "20:00").slice(0, 5);
    return { buka, tutup };
  }

  const buka = (pengaturan?.jam_buka_senin_jumat || pengaturan?.jam_buka || "08:00").slice(0, 5);
  const tutup = (pengaturan?.jam_tutup_senin_jumat || pengaturan?.jam_tutup || "20:00").slice(0, 5);
  return { buka, tutup };
}
