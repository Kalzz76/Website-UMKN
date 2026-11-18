"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, getTanggalHariIniJakarta } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";
import ModalPesan from "@/components/ModalPesan";

export default function PesanPage() {
  const router = useRouter();
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangKirim, setSedangKirim] = useState(false);

  const [langkah, setLangkah] = useState(1);
  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);

  const [pengaturan, setPengaturan] = useState(null);
  const [daftarGrup, setDaftarGrup] = useState([]);
  const [daftarItem, setDaftarItem] = useState([]);
  const [daftarZona, setDaftarZona] = useState([]);
  const [daftarTanggalTutup, setDaftarTanggalTutup] = useState([]);
  const [kuotaTerpakaiPerTanggal, setKuotaTerpakaiPerTanggal] = useState({});

  const [pilihanItem, setPilihanItem] = useState({});
  const [tulisanKue, setTulisanKue] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fotoReferensi, setFotoReferensi] = useState(null);
  const [previewFotoUrl, setPreviewFotoUrl] = useState(null);

  const [tanggalAmbil, setTanggalAmbil] = useState("");
  const [jamAmbil, setJamAmbil] = useState("");
  const [metodePengiriman, setMetodePengiriman] = useState("Ambil");
  const [alamat, setAlamat] = useState("");
  const [idZona, setIdZona] = useState("");

  const [namaPenerima, setNamaPenerima] = useState("");
  const [noWa, setNoWa] = useState("");

  const [pesanError, setPesanError] = useState([]);
  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function inisialisasi() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      setUser(currentUser);
      const { data: prof } = await supabase
        .from("profil")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      if (prof) {
        setProfil(prof);
        setNamaPenerima(prof.nama || "");
        setNoWa(prof.no_wa || "");
      }
    }

    const { data: toko } = await supabase
      .from("pengaturan_toko")
      .select("*")
      .eq("id", 1)
      .single();
    if (toko) setPengaturan(toko);

    const { data: grupList } = await supabase
      .from("grup_opsi")
      .select("*")
      .order("urutan", { ascending: true });
    if (grupList) setDaftarGrup(grupList);

    const { data: itemList } = await supabase
      .from("opsi_item")
      .select("*")
      .eq("aktif", true)
      .order("urutan", { ascending: true });
    if (itemList) setDaftarItem(itemList);

    const { data: zonaList } = await supabase
      .from("zona_ongkir")
      .select("*")
      .eq("aktif", true)
      .order("id", { ascending: true });
    if (zonaList) {
      setDaftarZona(zonaList);
      if (zonaList.length > 0) {
        setIdZona(String(zonaList[0].id));
      }
    }

    const { data: tglTutupList } = await supabase
      .from("tanggal_tutup")
      .select("tanggal, alasan");
    if (tglTutupList) setDaftarTanggalTutup(tglTutupList);

    const hariIni = getTanggalHariIniJakarta();
    const { data: pesananAktif } = await supabase
      .from("pesanan")
      .select("tanggal_ambil")
      .gte("tanggal_ambil", hariIni)
      .neq("status_pesanan", "Dibatalkan");

    if (pesananAktif) {
      const counts = {};
      for (let i = 0; i < pesananAktif.length; i++) {
        const tgl = pesananAktif[i].tanggal_ambil;
        counts[tgl] = (counts[tgl] || 0) + 1;
      }
      setKuotaTerpakaiPerTanggal(counts);
    }

    const draft = sessionStorage.getItem("draft_pesanan_kue");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.pilihanItem) setPilihanItem(d.pilihanItem);
        if (d.tulisanKue) setTulisanKue(d.tulisanKue);
        if (d.catatan) setCatatan(d.catatan);
        if (d.tanggalAmbil) setTanggalAmbil(d.tanggalAmbil);
        if (d.jamAmbil) setJamAmbil(d.jamAmbil);
        if (d.metodePengiriman) setMetodePengiriman(d.metodePengiriman);
        if (d.alamat) setAlamat(d.alamat);
        if (d.idZona) setIdZona(d.idZona);
        if (d.namaPenerima && !currentUser) setNamaPenerima(d.namaPenerima);
        if (d.noWa && !currentUser) setNoWa(d.noWa);
        if (d.langkah) setLangkah(d.langkah);
      } catch {}
    } else if (itemList && itemList.length > 0 && grupList) {
      const defaultPilihan = {};
      for (let g = 0; g < grupList.length; g++) {
        const grup = grupList[g];
        const itemsGrup = itemList.filter((it) => it.id_grup === grup.id);
        if (itemsGrup.length > 0) {
          if (grup.jenis_pilihan === "satu") {
            defaultPilihan[grup.id] = [itemsGrup[0]];
          }
        }
      }
      setPilihanItem(defaultPilihan);
    }

    setSedangMemuat(false);
  }

  useEffect(() => {
    inisialisasi();
  }, []);

  function simpanDraftKeSession(override = {}) {
    const data = {
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
      langkah,
      ...override,
    };
    sessionStorage.setItem("draft_pesanan_kue", JSON.stringify(data));
  }

  function handlePilihItem(grup, item) {
    const baru = { ...pilihanItem };
    if (grup.jenis_pilihan === "satu") {
      baru[grup.id] = [item];
    } else {
      const listLama = baru[grup.id] || [];
      const sudahAda = listLama.some((it) => it.id === item.id);
      if (sudahAda) {
        baru[grup.id] = listLama.filter((it) => it.id !== item.id);
      } else {
        baru[grup.id] = [...listLama, item];
      }
    }
    setPilihanItem(baru);
  }

  function hitungDaftarPilihanAktif() {
    const list = [];
    for (let i = 0; i < daftarGrup.length; i++) {
      const g = daftarGrup[i];
      const items = pilihanItem[g.id] || [];
      for (let j = 0; j < items.length; j++) {
        list.push({
          ...items[j],
          nama_grup: g.nama,
          peran_visual: g.peran_visual,
        });
      }
    }
    return list;
  }

  const itemTerpilihArray = hitungDaftarPilihanAktif();
  let totalKue = 0;
  for (let i = 0; i < itemTerpilihArray.length; i++) {
    totalKue += itemTerpilihArray[i].harga;
  }

  let ongkir = 0;
  if (metodePengiriman === "Kirim" && idZona) {
    const z = daftarZona.find((item) => String(item.id) === String(idZona));
    if (z) ongkir = z.tarif;
  }

  const totalBayar = totalKue + ongkir;
  const persenDp = pengaturan?.mode_pembayaran === "DP" ? (pengaturan.persen_dp || 50) : 100;
  const jumlahHarusBayar = pengaturan?.mode_pembayaran === "DP"
    ? Math.round((totalBayar * persenDp) / 100)
    : totalBayar;

  function hitungTanggalMinimal() {
    const hariIniStr = getTanggalHariIniJakarta();
    const minimalHari = pengaturan?.minimal_hari_pesan ?? 2;
    const d = new Date(hariIniStr + "T00:00:00");
    d.setDate(d.getDate() + minimalHari);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function generateDaftarJam() {
    const jamBuka = parseInt((pengaturan?.jam_buka || "08:00").slice(0, 2), 10);
    const jamTutup = parseInt((pengaturan?.jam_tutup || "20:00").slice(0, 2), 10);
    const opsiJam = [];
    for (let h = jamBuka; h <= jamTutup; h++) {
      opsiJam.push(`${String(h).padStart(2, "0")}:00`);
    }
    return opsiJam;
  }

  function cekTanggalValid(tglStr) {
    if (!tglStr) return { valid: false, pesan: "Pilih tanggal." };
    const tglMin = hitungTanggalMinimal();
    if (tglStr < tglMin) {
      return {
        valid: false,
        pesan: `Pemesanan harus minimal ${pengaturan?.minimal_hari_pesan || 2} hari sebelumnya.`,
      };
    }
    const tglTutup = daftarTanggalTutup.find((t) => t.tanggal === tglStr);
    if (tglTutup) {
      return {
        valid: false,
        pesan: `Toko libur/tutup pada tanggal ini: ${tglTutup.alasan || "Libur"}.`,
      };
    }
    const terpakai = kuotaTerpakaiPerTanggal[tglStr] || 0;
    const kuota = pengaturan?.kuota_harian || 5;
    if (terpakai >= kuota) {
      return {
        valid: false,
        pesan: `Kuota pesanan pada tanggal ini sudah penuh (${kuota} pesanan).`,
      };
    }
    return { valid: true };
  }

  function handleLanjutLangkah1() {
    const errors = [];
    for (let i = 0; i < daftarGrup.length; i++) {
      const g = daftarGrup[i];
      const items = pilihanItem[g.id] || [];
      if (g.wajib && items.length === 0) {
        errors.push(`Grup "${g.nama}" wajib dipilih minimal satu opsi.`);
      }
    }
    if (errors.length > 0) {
      setPesanError(errors);
      return;
    }
    setPesanError([]);
    setLangkah(2);
    simpanDraftKeSession({ langkah: 2 });
  }

  function handleLanjutLangkah2() {
    const errors = [];
    if (!tanggalAmbil) {
      errors.push("Tanggal pengambilan atau pengiriman harus dipilih.");
    } else {
      const cek = cekTanggalValid(tanggalAmbil);
      if (!cek.valid) errors.push(cek.pesan);
    }

    if (!jamAmbil) {
      errors.push("Jam pengambilan atau pengiriman harus dipilih.");
    }

    if (metodePengiriman === "Kirim") {
      if (!alamat.trim()) errors.push("Alamat pengiriman wajib diisi.");
      if (!idZona) errors.push("Zona pengiriman harus dipilih.");
    }

    if (errors.length > 0) {
      setPesanError(errors);
      return;
    }

    setPesanError([]);
    setLangkah(3);
    simpanDraftKeSession({ langkah: 3 });
  }

  function handleLanjutLangkah3() {
    const errors = [];
    if (!namaPenerima.trim()) errors.push("Nama pemesan/penerima wajib diisi.");
    if (!noWa.trim()) errors.push("Nomor WhatsApp wajib diisi.");

    if (errors.length > 0) {
      setPesanError(errors);
      return;
    }

    if (!user) {
      simpanDraftKeSession({ langkah: 4 });
      setNotifikasi({
        terbuka: true,
        judul: "Masuk Akun Diperlukan",
        pesan: "Untuk menyelesaikan pesanan, silakan masuk atau daftar terlebih dahulu. Pilihan kustomisasi Anda telah tersimpan secara aman.",
        tipe: "info",
      });
      return;
    }

    setPesanError([]);
    setLangkah(4);
    simpanDraftKeSession({ langkah: 4 });
  }

  async function handleBuatPesanan() {
    if (!user) {
      simpanDraftKeSession({ langkah: 4 });
      router.push("/masuk?ke=/pesan");
      return;
    }

    setSedangKirim(true);
    setPesanError([]);

    const itemIds = [];
    for (let i = 0; i < itemTerpilihArray.length; i++) {
      itemIds.push(itemTerpilihArray[i].id);
    }

    const formData = new FormData();
    formData.append("nama_penerima", namaPenerima.trim());
    formData.append("no_wa", noWa.trim());
    formData.append("tulisan_kue", tulisanKue.trim());
    formData.append("catatan", catatan.trim());
    formData.append("tanggal_ambil", tanggalAmbil);
    formData.append("jam_ambil", jamAmbil);
    formData.append("metode_pengiriman", metodePengiriman);
    formData.append("alamat", alamat.trim());
    formData.append("id_zona", idZona);
    formData.append("pilihan_ids", JSON.stringify(itemIds));

    if (fotoReferensi) {
      formData.append("foto_referensi", fotoReferensi);
    }

    const res = await fetch("/api/pesanan", {
      method: "POST",
      body: formData,
    });

    const hasil = await res.json();
    setSedangKirim(false);

    if (!res.ok) {
      setPesanError([hasil.pesan || "Terjadi kesalahan saat membuat pesanan."]);
      return;
    }

    sessionStorage.removeItem("draft_pesanan_kue");
    router.push(`/pesanan-saya/${hasil.kode_pesanan}`);
  }

  if (sedangMemuat) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-stone-100 max-w-sm w-full">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
          <p className="text-sm font-semibold text-stone-700">Menyiapkan Dapur Manis...</p>
        </div>
      </div>
    );
  }

  const opsiJam = generateDaftarJam();
  const tanggalMin = hitungTanggalMinimal();

  return (
    <div className="min-h-screen bg-amber-50 pb-16">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-cake-candles"></i>
            </div>
            <span className="font-extrabold text-stone-900 text-base">
              {pengaturan?.nama_toko || "Dapur Manis"}
            </span>
          </Link>
          <div className="flex items-center space-x-2 text-xs font-semibold text-stone-600">
            <span>Alur Kustomisasi</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="text-rose-600">Langkah {langkah} dari 4</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Live Preview Kue
              </span>
              <div className="w-full flex items-center justify-center min-h-[260px] bg-stone-50/60 rounded-2xl p-4">
                <PreviewKue
                  pilihan={itemTerpilihArray}
                  tulisan_kue={tulisanKue}
                  className="w-full max-w-[280px] h-auto drop-shadow-md"
                />
              </div>
              {tulisanKue && (
                <p className="text-xs font-medium text-stone-600 mt-2 italic">
                  &quot;{tulisanKue}&quot;
                </p>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
              <h4 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
                Ringkasan Pilihan
              </h4>
              <div className="space-y-2 text-xs">
                {itemTerpilihArray.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-stone-700">
                    <div>
                      <span className="text-stone-400 mr-1.5">{it.nama_grup}:</span>
                      <span className="font-medium text-stone-900">{it.nama}</span>
                    </div>
                    <span className="font-semibold text-stone-800">
                      {formatRupiah(it.harga)}
                    </span>
                  </div>
                ))}
                {metodePengiriman === "Kirim" && ongkir > 0 && (
                  <div className="flex justify-between items-center text-stone-700 pt-2 border-t border-dashed border-stone-100">
                    <span className="text-stone-500">Ongkir ({daftarZona.find((z) => String(z.id) === String(idZona))?.nama})</span>
                    <span className="font-semibold text-stone-800">{formatRupiah(ongkir)}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline">
                <span className="text-xs font-bold text-stone-600">Total Harga</span>
                <span className="text-xl font-extrabold text-stone-900">
                  {formatRupiah(totalBayar)}
                </span>
              </div>

              {pengaturan?.mode_pembayaran === "DP" && (
                <div className="bg-rose-50/70 p-3 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between text-rose-900 font-bold">
                    <span>DP Saat Pesan ({persenDp}%)</span>
                    <span>{formatRupiah(jumlahHarusBayar)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>Sisa Pelunasan</span>
                    <span>{formatRupiah(totalBayar - jumlahHarusBayar)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Langkah {langkah}
                </span>
                <h2 className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {langkah === 1 && "Kustomisasi Desain Kue"}
                  {langkah === 2 && "Jadwal & Metode Pengambilan"}
                  {langkah === 3 && "Data Pemesan & Kontak"}
                  {langkah === 4 && "Konfirmasi & Cara Pembayaran"}
                </h2>
              </div>
              <div className="flex space-x-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition ${
                      step === langkah
                        ? "bg-rose-600 ring-4 ring-rose-100"
                        : step < langkah
                        ? "bg-emerald-500"
                        : "bg-stone-200"
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {pesanError.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {pesanError.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            {langkah === 1 && (
              <div className="space-y-6">
                {daftarGrup.map((grup) => {
                  const items = daftarItem.filter((it) => it.id_grup === grup.id);
                  const terpilih = pilihanItem[grup.id] || [];

                  return (
                    <div key={grup.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-stone-900 flex items-center space-x-1.5">
                          <span>{grup.nama}</span>
                          {grup.wajib && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[11px] text-stone-400">
                          {grup.jenis_pilihan === "satu" ? "Pilih 1 opsi" : "Pilih 1 atau lebih"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {items.map((item) => {
                          const aktif = terpilih.some((it) => it.id === item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handlePilihItem(grup, item)}
                              className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                                aktif
                                  ? "border-rose-500 bg-rose-50/40 text-stone-900 ring-2 ring-rose-500/20 shadow-sm"
                                  : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                {item.warna && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block flex-shrink-0"
                                    style={{ backgroundColor: item.warna }}
                                  ></span>
                                )}
                                <span className="font-bold text-xs truncate">
                                  {item.nama}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-500 block">
                                +{formatRupiah(item.harga)}
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
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Tulisan di Permukaan Kue (opsional)
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      placeholder="Contoh: Happy Birthday Sarah ke-20"
                      value={tulisanKue}
                      onChange={(e) => setTulisanKue(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                    />
                    <span className="text-[11px] text-stone-400 mt-1 block">
                      Teks akan otomatis tampil di atas permukaan preview kue.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Catatan Tambahan untuk Dapur (opsional)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Contoh: Jangan terlalu manis, sendok lilin angka 5, dsb."
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Unggah Foto Contoh / Referensi Desain (opsional, maks. 2 MB)
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer">
                        <i className="fa-solid fa-image text-rose-500"></i>
                        <span>{fotoReferensi ? "Ganti Foto" : "Pilih Gambar"}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setFotoReferensi(f);
                              setPreviewFotoUrl(URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {previewFotoUrl && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-stone-600 truncate max-w-[150px]">
                            {fotoReferensi?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFotoReferensi(null);
                              setPreviewFotoUrl(null);
                            }}
                            className="text-rose-600 text-xs hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleLanjutLangkah1}
                    className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm cursor-pointer"
                  >
                    Lanjut ke Tanggal & Pengiriman
                  </button>
                </div>
              </div>
            )}

            {langkah === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Pilih Tanggal Pengambilan / Pengiriman <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={tanggalMin}
                    value={tanggalAmbil}
                    onChange={(e) => setTanggalAmbil(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Minimal {pengaturan?.minimal_hari_pesan || 2} hari dari sekarang. Tanggal libur & kuota penuh tidak dapat diproses.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Pilih Jam Pengambilan / Pengiriman <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jamAmbil}
                    onChange={(e) => setJamAmbil(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                  >
                    <option value="">-- Pilih Jam --</option>
                    {opsiJam.map((jam) => (
                      <option key={jam} value={jam}>
                        Pukul {jam} WIB
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-2">
                    Metode Pengambilan
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMetodePengiriman("Ambil")}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                        metodePengiriman === "Ambil"
                          ? "border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <i className="fa-solid fa-shop text-rose-600 text-base mb-1 block"></i>
                      <span className="font-bold text-xs block text-stone-900">Ambil di Toko</span>
                      <span className="text-[11px] text-stone-500">Gratis ongkir</span>
                    </button>

                    <button
                      type="button"
                      disabled={daftarZona.length === 0}
                      onClick={() => setMetodePengiriman("Kirim")}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer disabled:opacity-40 ${
                        metodePengiriman === "Kirim"
                          ? "border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <i className="fa-solid fa-truck text-rose-600 text-base mb-1 block"></i>
                      <span className="font-bold text-xs block text-stone-900">Kirim ke Alamat</span>
                      <span className="text-[11px] text-stone-500">Sesuai tarif zona</span>
                    </button>
                  </div>
                </div>

                {metodePengiriman === "Kirim" && (
                  <div className="space-y-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Pilih Zona Pengiriman <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={idZona}
                        onChange={(e) => setIdZona(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                      >
                        {daftarZona.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.nama} ({formatRupiah(z.tarif)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Alamat Lengkap Pengiriman <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows="2"
                        required
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white resize-none"
                      ></textarea>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setLangkah(1)}
                    className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleLanjutLangkah2}
                    className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm cursor-pointer"
                  >
                    Lanjut ke Data Pemesan
                  </button>
                </div>
              </div>
            )}

            {langkah === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Nama Pemesan / Penerima <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sarah Melati"
                    value={namaPenerima}
                    onChange={(e) => setNamaPenerima(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Konfirmasi pesanan dan update produksi akan dihubungi melalui nomor ini.
                  </span>
                </div>

                {!user && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-bold flex items-center space-x-1.5">
                      <i className="fa-solid fa-lock"></i>
                      <span>Masuk atau Buat Akun</span>
                    </p>
                    <p>
                      Anda belum login. Klik tombol lanjut untuk masuk ke akun Anda. Pilihan kue Anda akan tetap tersimpan.
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setLangkah(2)}
                    className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleLanjutLangkah3}
                    className="px-6 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm cursor-pointer"
                  >
                    {user ? "Lanjut ke Pembayaran" : "Masuk untuk Lanjut"}
                  </button>
                </div>
              </div>
            )}

            {langkah === 4 && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Instruksi Pembayaran Toko
                  </h4>
                  <p className="text-xs text-stone-600">
                    Pesanan akan mulai diproduksi setelah pembayaran pertama ({pengaturan?.mode_pembayaran === "DP" ? `DP ${persenDp}%` : "Lunas"}) dikonfirmasi admin.
                  </p>

                  <div className="pt-2 border-t border-stone-200 space-y-2">
                    {pengaturan?.nama_bank && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-500">Transfer Bank</span>
                        <span className="font-bold text-stone-900">
                          {pengaturan.nama_bank} {pengaturan.no_rekening} a.n {pengaturan.atas_nama}
                        </span>
                      </div>
                    )}
                    {pengaturan?.gambar_qris && (
                      <div className="pt-2 text-center">
                        <span className="text-[11px] font-bold text-stone-600 block mb-1">
                          Scan QRIS Toko
                        </span>
                        <img
                          src={pengaturan.gambar_qris}
                          alt="QRIS"
                          className="w-36 h-36 mx-auto rounded-xl border border-stone-200 bg-white object-contain p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      Jumlah yang Perlu Dibayar Sekarang
                    </span>
                    <span className="text-xl font-black text-rose-700">
                      {formatRupiah(jumlahHarusBayar)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-rose-700 border border-rose-200">
                    {pengaturan?.mode_pembayaran === "DP" ? `DP ${persenDp}%` : "Bayar Penuh"}
                  </span>
                </div>

                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setLangkah(3)}
                    className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={sedangKirim}
                    onClick={handleBuatPesanan}
                    className="px-7 py-3 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {sedangKirim ? "Memproses Pesanan..." : "Konfirmasi & Dapatkan Tiket"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ModalPesan
        terbuka={notifikasi.terbuka}
        judul={notifikasi.judul}
        pesan={notifikasi.pesan}
        tipe={notifikasi.tipe}
        onTutup={() => {
          setNotifikasi({ ...notifikasi, terbuka: false });
          if (!user) {
            router.push("/masuk?ke=/pesan");
          }
        }}
      />
    </div>
  );
}