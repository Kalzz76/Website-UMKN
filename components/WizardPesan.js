"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PreviewKue from "@/components/PreviewKue";
import { formatRupiah, hitungTanggalMinimal } from "@/lib/format";

export default function WizardPesan({
  pengaturan,
  daftarGrup = [],
  daftarZona = [],
  daftarTutup = [],
  user = null,
  profil = null,
}) {
  const router = useRouter();

  const [tahap, setTahap] = useState(1);
  const [pilihanItem, setPilihanItem] = useState({});
  const [tulisanKue, setTulisanKue] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fileFoto, setFileFoto] = useState(null);
  const [namaFoto, setNamaFoto] = useState("");

  const minimalHari = pengaturan?.minimal_hari_pesan || 2;
  const tanggalMinimal = hitungTanggalMinimal(minimalHari);

  const [tanggalAmbil, setTanggalAmbil] = useState(tanggalMinimal);
  const [jamAmbil, setJamAmbil] = useState("10:00");
  const [metodePengiriman, setMetodePengiriman] = useState("Ambil");
  const [alamat, setAlamat] = useState("");
  const [idZona, setIdZona] = useState(daftarZona.length > 0 ? String(daftarZona[0].id) : "");

  const [namaPenerima, setNamaPenerima] = useState(profil?.nama || "");
  const [noWa, setNoWa] = useState(profil?.no_wa || "");

  const [memuat, setMemuat] = useState(false);
  const [daftarError, setDaftarError] = useState([]);

  useEffect(() => {
    const pilihanAwal = {};
    for (let i = 0; i < daftarGrup.length; i++) {
      const g = daftarGrup[i];
      if (g.wajib && g.opsi_item && g.opsi_item.length > 0) {
        if (g.jenis_pilihan === "satu") {
          pilihanAwal[g.id] = [g.opsi_item[0]];
        }
      }
    }

    try {
      const tersimpan = sessionStorage.getItem("draf_pesanan");
      if (tersimpan) {
        const draf = JSON.parse(tersimpan);
        if (draf.pilihanItem) {
          setPilihanItem(draf.pilihanItem);
        } else {
          setPilihanItem(pilihanAwal);
        }
        if (draf.tulisanKue !== undefined) setTulisanKue(draf.tulisanKue);
        if (draf.catatan !== undefined) setCatatan(draf.catatan);
        if (draf.tanggalAmbil) setTanggalAmbil(draf.tanggalAmbil);
        if (draf.jamAmbil) setJamAmbil(draf.jamAmbil);
        if (draf.metodePengiriman) setMetodePengiriman(draf.metodePengiriman);
        if (draf.alamat) setAlamat(draf.alamat);
        if (draf.idZona) setIdZona(draf.idZona);
        if (draf.namaPenerima && !namaPenerima) setNamaPenerima(draf.namaPenerima);
        if (draf.noWa && !noWa) setNoWa(draf.noWa);
        return;
      }
    } catch {}

    setPilihanItem(pilihanAwal);
  }, [daftarGrup]);

  function simpanDrafKeStorage() {
    try {
      const draf = {
        pilihanItem,
        tulisanKue,
        catatan,
        tanggalAmbil,
        jamAmbil,
        metodePengiriman,
        alamat,
        idZona,
        namaPenerima,
        noWa,
      };
      sessionStorage.setItem("draf_pesanan", JSON.stringify(draf));
    } catch {}
  }

  function handlePilihItem(grup, item) {
    const terpilihSaatIni = pilihanItem[grup.id] || [];
    if (grup.jenis_pilihan === "satu") {
      setPilihanItem({
        ...pilihanItem,
        [grup.id]: [item],
      });
    } else {
      const sudahAda = terpilihSaatIni.some((it) => it.id === item.id);
      let baru = [];
      if (sudahAda) {
        baru = terpilihSaatIni.filter((it) => it.id !== item.id);
      } else {
        baru = [...terpilihSaatIni, item];
      }
      setPilihanItem({
        ...pilihanItem,
        [grup.id]: baru,
      });
    }
  }

  const semuaItemTerpilih = [];
  const grupKeys = Object.keys(pilihanItem);
  for (let i = 0; i < grupKeys.length; i++) {
    const list = pilihanItem[grupKeys[i]] || [];
    for (let j = 0; j < list.length; j++) {
      semuaItemTerpilih.push(list[j]);
    }
  }

  let totalKue = 0;
  for (let i = 0; i < semuaItemTerpilih.length; i++) {
    totalKue += semuaItemTerpilih[i].harga;
  }

  let ongkir = 0;
  let zonaTerpilih = null;
  if (metodePengiriman === "Kirim" && idZona) {
    zonaTerpilih = daftarZona.find((z) => String(z.id) === String(idZona));
    if (zonaTerpilih) {
      ongkir = zonaTerpilih.tarif;
    }
  }

  const totalBayar = totalKue + ongkir;
  const modeBayar = pengaturan?.mode_pembayaran || "DP";
  const persenDp = pengaturan?.persen_dp || 50;
  let jumlahDp = totalBayar;
  if (modeBayar === "DP") {
    jumlahDp = Math.round((totalBayar * persenDp) / 100);
  }
  const sisaBayar = totalBayar - jumlahDp;

  const jamBuka = pengaturan?.jam_buka ? parseInt(pengaturan.jam_buka.slice(0, 2), 10) : 8;
  const jamTutup = pengaturan?.jam_tutup ? parseInt(pengaturan.jam_tutup.slice(0, 2), 10) : 20;
  const daftarSlotJam = [];
  for (let j = jamBuka; j <= jamTutup; j++) {
    const jamStr = `${String(j).padStart(2, "0")}:00`;
    daftarSlotJam.push(jamStr);
  }

  function validasiTahap(tahapKe) {
    const errors = [];
    if (tahapKe === 1) {
      for (let i = 0; i < daftarGrup.length; i++) {
        const g = daftarGrup[i];
        const terpilih = pilihanItem[g.id] || [];
        if (g.wajib && terpilih.length === 0) {
          errors.push(`Silakan pilih salah satu opsi untuk ${g.nama}.`);
        }
      }
    } else if (tahapKe === 2) {
      if (!tanggalAmbil) {
        errors.push("Tanggal pengambilan wajib dipilih.");
      } else if (tanggalAmbil < tanggalMinimal) {
        errors.push(`Pemesanan minimal ${minimalHari} hari sebelumnya.`);
      }
      const tTutup = daftarTutup.find((t) => t.tanggal === tanggalAmbil);
      if (tTutup) {
        errors.push(`Toko tutup pada tanggal tersebut: ${tTutup.alasan || "Libur"}.`);
      }
      if (!jamAmbil) {
        errors.push("Jam pengambilan wajib dipilih.");
      }
      if (metodePengiriman === "Kirim") {
        if (!alamat.trim()) {
          errors.push("Alamat pengiriman lengkap wajib diisi.");
        }
        if (!idZona) {
          errors.push("Zona ongkir wajib dipilih.");
        }
      }
    } else if (tahapKe === 3) {
      if (!namaPenerima.trim()) {
        errors.push("Nama penerima wajib diisi.");
      }
      if (!noWa.trim()) {
        errors.push("Nomor WhatsApp wajib diisi.");
      }
    }
    return errors;
  }

  function lanjutTahap() {
    setDaftarError([]);
    const errors = validasiTahap(tahap);
    if (errors.length > 0) {
      setDaftarError(errors);
      return;
    }
    simpanDrafKeStorage();
    setTahap(tahap + 1);
  }

  async function handleKirimPesanan() {
    setDaftarError([]);
    const err3 = validasiTahap(3);
    if (err3.length > 0) {
      setDaftarError(err3);
      setTahap(3);
      return;
    }

    if (!user) {
      simpanDrafKeStorage();
      router.push("/masuk?ke=/pesan");
      return;
    }

    setMemuat(true);

    const itemIds = semuaItemTerpilih.map((it) => it.id);
    const formData = new FormData();
    formData.append("nama_penerima", namaPenerima.trim());
    formData.append("no_wa", noWa.trim());
    formData.append("tulisan_kue", tulisanKue.trim());
    formData.append("catatan", catatan.trim());
    formData.append("tanggal_ambil", tanggalAmbil);
    formData.append("jam_ambil", jamAmbil);
    formData.append("metode_pengiriman", metodePengiriman);
    formData.append("alamat", alamat.trim());
    if (idZona) {
      formData.append("id_zona", idZona);
    }
    formData.append("item_ids", JSON.stringify(itemIds));
    if (fileFoto) {
      formData.append("foto_referensi", fileFoto);
    }

    try {
      const res = await fetch("/api/pesanan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMemuat(false);
        setDaftarError([data.pesan || "Terjadi kesalahan saat memproses pesanan."]);
        return;
      }

      sessionStorage.removeItem("draf_pesanan");
      router.push(`/user/${data.kode_pesanan}`);
    } catch {
      setMemuat(false);
      setDaftarError(["Gagal terhubung ke server. Silakan coba lagi."]);
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-stone-100 lg:sticky lg:top-6 order-2 lg:order-1">
        <h2 className="font-extrabold text-stone-900 text-lg mb-2 text-center">
          Preview Kue Anda
        </h2>

        <div className="bg-amber-50/60 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
          <PreviewKue
            pilihan={semuaItemTerpilih}
            tulisan={tulisanKue}
            className="w-full"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Komponen Terpilih:</span>
            <span>{semuaItemTerpilih.length} item</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs text-stone-600">
            {semuaItemTerpilih.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.nama}</span>
                <span className="font-semibold text-stone-900">
                  {formatRupiah(item.harga)}
                </span>
              </div>
            ))}
            {metodePengiriman === "Kirim" && (
              <div className="flex justify-between text-stone-600">
                <span>Ongkir ({zonaTerpilih ? zonaTerpilih.nama : "Kirim"})</span>
                <span className="font-semibold text-stone-900">
                  {formatRupiah(ongkir)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-stone-400 block">Total Pembayaran</span>
              <span className="text-xl font-black text-rose-600">
                {formatRupiah(totalBayar)}
              </span>
            </div>
            {modeBayar === "DP" && (
              <div className="text-right">
                <span className="text-xs text-stone-400 block">DP Sekarang ({persenDp}%)</span>
                <span className="text-sm font-bold text-stone-800">
                  {formatRupiah(jumlahDp)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 order-1 lg:order-2">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-stone-400">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                tahap === 1
                  ? "bg-rose-600 text-white"
                  : tahap > 1
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              1
            </span>
            <span className={tahap === 1 ? "text-rose-600 font-bold" : ""}>Kue</span>
            <span className="text-stone-300">/</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                tahap === 2
                  ? "bg-rose-600 text-white"
                  : tahap > 2
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              2
            </span>
            <span className={tahap === 2 ? "text-rose-600 font-bold" : ""}>Jadwal</span>
            <span className="text-stone-300">/</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                tahap === 3
                  ? "bg-rose-600 text-white"
                  : tahap > 3
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              3
            </span>
            <span className={tahap === 3 ? "text-rose-600 font-bold" : ""}>Penerima</span>
            <span className="text-stone-300">/</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                tahap === 4 ? "bg-rose-600 text-white" : "bg-stone-100 text-stone-500"
              }`}
            >
              4
            </span>
            <span className={tahap === 4 ? "text-rose-600 font-bold" : ""}>Bayar</span>
          </div>
        </div>

        {daftarError.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <ul className="list-disc list-inside space-y-1">
              {daftarError.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {tahap === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">
                Pilih Komponen Kue
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Kustomisasi kue sesuai selera Anda. Tampilan di samping akan berubah otomatis.
              </p>
            </div>

            {daftarGrup.map((grup) => {
              const terpilihGrup = pilihanItem[grup.id] || [];
              return (
                <div key={grup.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-stone-800">
                      {grup.nama}
                      {grup.wajib && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    <span className="text-[11px] text-stone-400">
                      {grup.jenis_pilihan === "satu" ? "Pilih 1" : "Pilihan banyak"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {grup.opsi_item &&
                      grup.opsi_item
                        .filter((item) => item.aktif)
                        .map((item) => {
                          const aktif = terpilihGrup.some((it) => it.id === item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handlePilihItem(grup, item)}
                              className={`p-3 rounded-2xl text-left border text-xs transition cursor-pointer flex flex-col justify-between ${
                                aktif
                                  ? "border-rose-600 bg-rose-50/70 text-rose-950 font-bold shadow-sm"
                                  : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {item.warna && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-stone-300 flex-shrink-0"
                                    style={{ backgroundColor: item.warna }}
                                  ></span>
                                )}
                                <span className="truncate">{item.nama}</span>
                              </div>
                              <span className="text-stone-500 text-[11px] mt-1.5 font-normal">
                                {formatRupiah(item.harga)}
                              </span>
                            </button>
                          );
                        })}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Tulisan di Kue (Opsional)
                </label>
                <input
                  type="text"
                  value={tulisanKue}
                  onChange={(e) => setTulisanKue(e.target.value)}
                  maxLength={30}
                  placeholder="Contoh: Happy Birthday Sarah"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Catatan untuk Dapur (Opsional)
                </label>
                <textarea
                  rows="2"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Lilin warna biru, tulisan pakai krim merah muda"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Foto Referensi Desain (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileFoto(e.target.files[0]);
                      setNamaFoto(e.target.files[0].name);
                    }
                  }}
                  className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Format JPG atau PNG, maksimal 2 MB.
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={lanjutTahap}
                className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition text-sm cursor-pointer"
              >
                Lanjut ke Jadwal
              </button>
            </div>
          </div>
        )}

        {tahap === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">
                Pilih Jadwal & Pengambilan
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Tentukan kapan kue diambil atau diantar ke alamat Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Tanggal Pengambilan
                </label>
                <input
                  type="date"
                  min={tanggalMinimal}
                  value={tanggalAmbil}
                  onChange={(e) => setTanggalAmbil(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Minimal tanggal {tanggalMinimal} ({minimalHari} hari persiapan).
                </span>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Jam Pengambilan
                </label>
                <select
                  value={jamAmbil}
                  onChange={(e) => setJamAmbil(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm bg-white"
                >
                  {daftarSlotJam.map((slot) => (
                    <option key={slot} value={slot}>
                      Pukul {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100">
              <label className="block text-sm font-bold text-stone-800 mb-2">
                Metode Pengambilan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodePengiriman("Ambil")}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    metodePengiriman === "Ambil"
                      ? "border-rose-600 bg-rose-50 text-rose-950 font-bold"
                      : "border-stone-200 text-stone-700 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-store text-rose-600"></i>
                    <span className="text-sm font-semibold">Ambil di Tempat</span>
                  </div>
                  <span className="text-xs text-stone-500 mt-1 block font-normal">
                    Gratis ongkos kirim. Ambil langsung di dapur kami.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodePengiriman("Kirim")}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    metodePengiriman === "Kirim"
                      ? "border-rose-600 bg-rose-50 text-rose-950 font-bold"
                      : "border-stone-200 text-stone-700 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-truck text-rose-600"></i>
                    <span className="text-sm font-semibold">Kirim ke Alamat</span>
                  </div>
                  <span className="text-xs text-stone-500 mt-1 block font-normal">
                    Diantar kurir amanah khusus kue ke lokasi Anda.
                  </span>
                </button>
              </div>
            </div>

            {metodePengiriman === "Kirim" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-stone-800 mb-1">
                    Zona Pengiriman
                  </label>
                  <select
                    value={idZona}
                    onChange={(e) => setIdZona(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm bg-white"
                  >
                    {daftarZona.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nama} - {formatRupiah(z.tarif)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-800 mb-1">
                    Alamat Lengkap Pengiriman
                  </label>
                  <textarea
                    rows="3"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
                  ></textarea>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setTahap(1)}
                className="px-6 py-2.5 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition text-sm cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={lanjutTahap}
                className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition text-sm cursor-pointer"
              >
                Lanjut ke Data Penerima
              </button>
            </div>
          </div>
        )}

        {tahap === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">
                Informasi Penerima
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Data kontak untuk konfirmasi pesanan dan pemberitahuan saat kue siap.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Nama Penerima
                </label>
                <input
                  type="text"
                  value={namaPenerima}
                  onChange={(e) => setNamaPenerima(e.target.value)}
                  placeholder="Nama lengkap pemesan/penerima"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-stone-800 text-sm"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Nomor ini digunakan untuk kirim info resi dan konfirmasi status.
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setTahap(2)}
                className="px-6 py-2.5 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition text-sm cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={lanjutTahap}
                className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition text-sm cursor-pointer"
              >
                Lanjut ke Ringkasan
              </button>
            </div>
          </div>
        )}

        {tahap === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">
                Ringkasan Pemesanan
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Periksa kembali detail pesanan Anda sebelum melanjutkan.
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Penerima</span>
                <span className="font-semibold text-stone-800">{namaPenerima} ({noWa})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Jadwal</span>
                <span className="font-semibold text-stone-800">
                  {tanggalAmbil} pukul {jamAmbil}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Pengambilan</span>
                <span className="font-semibold text-stone-800">
                  {metodePengiriman === "Ambil" ? "Ambil di Tempat" : `Kirim (${zonaTerpilih?.nama})`}
                </span>
              </div>
              {metodePengiriman === "Kirim" && (
                <div className="py-1 border-b border-stone-200">
                  <span className="text-stone-500 block mb-0.5">Alamat</span>
                  <span className="font-medium text-stone-800 block">{alamat}</span>
                </div>
              )}
              {tulisanKue && (
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">Tulisan di Kue</span>
                  <span className="font-bold text-rose-600">&ldquo;{tulisanKue}&rdquo;</span>
                </div>
              )}
              {catatan && (
                <div className="py-1">
                  <span className="text-stone-500 block mb-0.5">Catatan</span>
                  <span className="text-stone-800">{catatan}</span>
                </div>
              )}
            </div>

            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-100 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Instruksi Pembayaran ({modeBayar === "DP" ? `Mode DP ${persenDp}%` : "Mode Lunas"})
              </h4>
              <p className="text-xs text-amber-800">
                {modeBayar === "DP"
                  ? `Anda cukup membayar DP sebesar ${formatRupiah(
                      jumlahDp
                    )} sekarang. Sisa ${formatRupiah(
                      sisaBayar
                    )} dilunasi sebelum kue diambil/dikirim.`
                  : `Total pembayaran pesanan adalah ${formatRupiah(totalBayar)}.`}
              </p>
              {pengaturan?.nama_bank && (
                <div className="text-xs text-stone-700 pt-2 border-t border-amber-200/60">
                  <span>Transfer Bank: </span>
                  <span className="font-bold text-stone-900">{pengaturan.nama_bank}</span>
                  <span> - No. Rekening: </span>
                  <span className="font-bold text-stone-900">{pengaturan.no_rekening}</span>
                  <span> a.n. {pengaturan.atas_nama}</span>
                </div>
              )}
            </div>

            {!user && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start space-x-2.5">
                <i className="fa-solid fa-circle-info text-sky-600 text-sm mt-0.5"></i>
                <div>
                  <span className="font-bold block">Anda belum masuk ke akun</span>
                  <span>
                    Klik tombol di bawah untuk masuk. Pilihan kue Anda akan tetap tersimpan otomatis.
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setTahap(3)}
                disabled={memuat}
                className="px-6 py-2.5 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition text-sm cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleKirimPesanan}
                disabled={memuat}
                className="px-8 py-3 rounded-full font-bold bg-rose-600 hover:bg-rose-500 text-white transition text-sm cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {memuat ? (
                  <span>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Memproses Pesanan...
                  </span>
                ) : user ? (
                  "Konfirmasi & Buat Pesanan"
                ) : (
                  "Masuk & Buat Pesanan"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
