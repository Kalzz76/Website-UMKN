"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function PengaturanPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangSimpanToko, setSedangSimpanToko] = useState(false);
  const [sedangProsesZona, setSedangProsesZona] = useState(false);
  const [sedangProsesTanggal, setSedangProsesTanggal] = useState(false);

  const [formToko, setFormToko] = useState({
    nama_toko: "",
    alamat: "",
    no_wa: "",
    jam_operasional: "",
    jam_buka: "08:00",
    jam_tutup: "20:00",
    kuota_harian: 5,
    minimal_hari_pesan: 2,
    mode_pembayaran: "DP",
    persen_dp: 50,
    batas_bayar_jam: 24,
    nama_bank: "",
    no_rekening: "",
    atas_nama: "",
    gambar_qris: null,
  });

  const [fileQris, setFileQris] = useState(null);
  const [previewQris, setPreviewQris] = useState(null);
  const [hapusQrisFlag, setHapusQrisFlag] = useState(false);

  const [daftarZona, setDaftarZona] = useState([]);
  const [daftarTanggalTutup, setDaftarTanggalTutup] = useState([]);

  const [modalZonaBuka, setModalZonaBuka] = useState(false);
  const [editZonaId, setEditZonaId] = useState(null);
  const [formZona, setFormZona] = useState({
    nama: "",
    tarif: 0,
    aktif: true,
  });

  const [modalTanggalBuka, setModalTanggalBuka] = useState(false);
  const [formTanggal, setFormTanggal] = useState({
    tanggal: "",
    alasan: "",
  });

  const [errorToko, setErrorToko] = useState([]);
  const [errorZona, setErrorZona] = useState([]);
  const [errorTanggal, setErrorTanggal] = useState([]);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const { data: toko } = await supabase
      .from("pengaturan_toko")
      .select("*")
      .eq("id", 1)
      .single();

    if (toko) {
      setFormToko({
        nama_toko: toko.nama_toko || "",
        alamat: toko.alamat || "",
        no_wa: toko.no_wa || "",
        jam_operasional: toko.jam_operasional || "",
        jam_buka: toko.jam_buka?.slice(0, 5) || "08:00",
        jam_tutup: toko.jam_tutup?.slice(0, 5) || "20:00",
        kuota_harian: toko.kuota_harian ?? 5,
        minimal_hari_pesan: toko.minimal_hari_pesan ?? 2,
        mode_pembayaran: toko.mode_pembayaran || "DP",
        persen_dp: toko.persen_dp ?? 50,
        batas_bayar_jam: toko.batas_bayar_jam ?? 24,
        nama_bank: toko.nama_bank || "",
        no_rekening: toko.no_rekening || "",
        atas_nama: toko.atas_nama || "",
        gambar_qris: toko.gambar_qris || null,
      });
      setPreviewQris(toko.gambar_qris || null);
    }

    const { data: zonaList } = await supabase
      .from("zona_ongkir")
      .select("*")
      .order("id", { ascending: true });

    if (zonaList) {
      setDaftarZona(zonaList);
    }

    const { data: tanggalList } = await supabase
      .from("tanggal_tutup")
      .select("*")
      .order("tanggal", { ascending: true });

    if (tanggalList) {
      setDaftarTanggalTutup(tanggalList);
    }

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  function handlePilihFileQris(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorToko(["Ukuran gambar QRIS tidak boleh melebihi 2 MB."]);
      return;
    }

    setFileQris(file);
    setHapusQrisFlag(false);
    setErrorToko([]);
    const objectUrl = URL.createObjectURL(file);
    setPreviewQris(objectUrl);
  }

  function handleHapusGambarQris() {
    setFileQris(null);
    setPreviewQris(null);
    setHapusQrisFlag(true);
  }

  async function simpanPengaturanToko(e) {
    e.preventDefault();
    setErrorToko([]);

    const errors = [];
    if (!formToko.nama_toko.trim()) {
      errors.push("Nama toko tidak boleh kosong.");
    }
    if (formToko.kuota_harian < 1) {
      errors.push("Kuota pesanan harian minimal 1.");
    }
    if (formToko.minimal_hari_pesan < 0) {
      errors.push("Minimal hari pemesanan tidak boleh negatif.");
    }
    if (formToko.persen_dp < 1 || formToko.persen_dp > 100) {
      errors.push("Persentase DP harus bernilai antara 1 sampai 100.");
    }
    if (formToko.batas_bayar_jam < 1) {
      errors.push("Batas waktu pembayaran minimal 1 jam.");
    }

    if (errors.length > 0) {
      setErrorToko(errors);
      return;
    }

    setSedangSimpanToko(true);

    const formData = new FormData();
    formData.append("nama_toko", formToko.nama_toko);
    formData.append("alamat", formToko.alamat);
    formData.append("no_wa", formToko.no_wa);
    formData.append("jam_operasional", formToko.jam_operasional);
    formData.append("jam_buka", formToko.jam_buka);
    formData.append("jam_tutup", formToko.jam_tutup);
    formData.append("kuota_harian", formToko.kuota_harian);
    formData.append("minimal_hari_pesan", formToko.minimal_hari_pesan);
    formData.append("mode_pembayaran", formToko.mode_pembayaran);
    formData.append("persen_dp", formToko.persen_dp);
    formData.append("batas_bayar_jam", formToko.batas_bayar_jam);
    formData.append("nama_bank", formToko.nama_bank);
    formData.append("no_rekening", formToko.no_rekening);
    formData.append("atas_nama", formToko.atas_nama);
    formData.append("hapus_qris", hapusQrisFlag ? "true" : "false");

    if (fileQris) {
      formData.append("file_qris", fileQris);
    }

    const res = await fetch("/api/pengaturan", {
      method: "POST",
      body: formData,
    });

    const hasil = await res.json();
    setSedangSimpanToko(false);

    if (!res.ok) {
      setErrorToko([hasil.pesan || "Gagal menyimpan pengaturan toko."]);
      return;
    }

    setFileQris(null);
    setHapusQrisFlag(false);
    if (hasil.gambar_qris) {
      setPreviewQris(hasil.gambar_qris);
      setFormToko((prev) => ({ ...prev, gambar_qris: hasil.gambar_qris }));
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
  }

  function bukaModalTambahZona() {
    setEditZonaId(null);
    setFormZona({
      nama: "",
      tarif: 0,
      aktif: true,
    });
    setErrorZona([]);
    setModalZonaBuka(true);
  }

  function bukaModalEditZona(zona) {
    setEditZonaId(zona.id);
    setFormZona({
      nama: zona.nama,
      tarif: zona.tarif,
      aktif: zona.aktif,
    });
    setErrorZona([]);
    setModalZonaBuka(true);
  }

  async function simpanZona(e) {
    e.preventDefault();
    setErrorZona([]);

    if (!formZona.nama.trim()) {
      setErrorZona(["Nama zona tidak boleh kosong."]);
      return;
    }

    setSedangProsesZona(true);
    const aksi = editZonaId ? "edit_zona" : "tambah_zona";
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editZonaId,
        nama: formZona.nama,
        tarif: Number(formZona.tarif),
        aktif: formZona.aktif,
      }),
    });

    const hasil = await res.json();
    setSedangProsesZona(false);

    if (!res.ok) {
      setErrorZona([hasil.pesan || "Gagal menyimpan zona ongkir."]);
      return;
    }

    setModalZonaBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function toggleStatusZona(zona) {
    setSedangProsesZona(true);
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "toggle_zona",
        id: zona.id,
        aktif: !zona.aktif,
      }),
    });

    const hasil = await res.json();
    setSedangProsesZona(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal mengubah status zona.",
        tipe: "error",
      });
      return;
    }

    muatData();
  }

  async function hapusZona(zona) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus "${zona.nama}"? Jika zona sudah dipakai pesanan sebelumnya, Anda hanya dapat menonaktifkannya.`
    );
    if (!yakin) return;

    setSedangProsesZona(true);
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_zona",
        id: zona.id,
      }),
    });

    const hasil = await res.json();
    setSedangProsesZona(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus zona ongkir.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  function bukaModalTambahTanggal() {
    setFormTanggal({
      tanggal: "",
      alasan: "",
    });
    setErrorTanggal([]);
    setModalTanggalBuka(true);
  }

  async function simpanTanggalTutup(e) {
    e.preventDefault();
    setErrorTanggal([]);

    if (!formTanggal.tanggal) {
      setErrorTanggal(["Tanggal harus dipilih."]);
      return;
    }

    setSedangProsesTanggal(true);
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "tambah_tanggal_tutup",
        tanggal: formTanggal.tanggal,
        alasan: formTanggal.alasan,
      }),
    });

    const hasil = await res.json();
    setSedangProsesTanggal(false);

    if (!res.ok) {
      setErrorTanggal([hasil.pesan || "Gagal menambahkan tanggal tutup."]);
      return;
    }

    setModalTanggalBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function hapusTanggalTutup(item) {
    const yakin = window.confirm(
      `Buka kembali tanggal ${item.tanggal} untuk pemesanan pelanggan?`
    );
    if (!yakin) return;

    setSedangProsesTanggal(true);
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_tanggal_tutup",
        id: item.id,
      }),
    });

    const hasil = await res.json();
    setSedangProsesTanggal(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus tanggal tutup.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  if (sedangMemuat) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-stone-100 shadow-sm">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
        <p className="text-sm font-medium">Memuat pengaturan toko...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">
          Pengaturan Toko & Operasional
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Atur informasi toko, jam kerja, kebijakan pembayaran, tarif zona ongkir, dan jadwal libur.
        </p>
      </div>

      <form onSubmit={simpanPengaturanToko} className="space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-store"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Informasi Toko</h3>
              <p className="text-xs text-stone-500">
                Nama dan kontak ini ditampilkan pada halaman utama dan bukti pemesanan.
              </p>
            </div>
          </div>

          {errorToko.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
              {errorToko.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Nama Toko <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formToko.nama_toko}
                onChange={(e) =>
                  setFormToko({ ...formToko, nama_toko: e.target.value })
                }
                placeholder="Contoh: Dapur Manis Custom Cake"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Nomor WhatsApp Toko <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formToko.no_wa}
                onChange={(e) =>
                  setFormToko({ ...formToko, no_wa: e.target.value })
                }
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Alamat Toko Lengkap
              </label>
              <textarea
                rows="2"
                value={formToko.alamat}
                onChange={(e) =>
                  setFormToko({ ...formToko, alamat: e.target.value })
                }
                placeholder="Jl. Melati No. 12, Jakarta Selatan"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm resize-none"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Teks Jam Operasional (ditampilkan di footer/info toko)
              </label>
              <input
                type="text"
                value={formToko.jam_operasional}
                onChange={(e) =>
                  setFormToko({ ...formToko, jam_operasional: e.target.value })
                }
                placeholder="Contoh: Senin - Minggu: 08.00 - 20.00"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Jadwal & Kuota Pemesanan
              </h3>
              <p className="text-xs text-stone-500">
                Atur jam pengambilan, batas waktu pesanan per hari, dan persiapan minimal hari.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Jam Buka
              </label>
              <input
                type="time"
                required
                value={formToko.jam_buka}
                onChange={(e) =>
                  setFormToko({ ...formToko, jam_buka: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Jam Tutup
              </label>
              <input
                type="time"
                required
                value={formToko.jam_tutup}
                onChange={(e) =>
                  setFormToko({ ...formToko, jam_tutup: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Kuota Harian (Pesanan)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formToko.kuota_harian}
                onChange={(e) =>
                  setFormToko({
                    ...formToko,
                    kuota_harian: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Maksimal pesanan aktif per tanggal
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Minimal Hari Pesan (H-)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formToko.minimal_hari_pesan}
                onChange={(e) =>
                  setFormToko({
                    ...formToko,
                    minimal_hari_pesan: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Contoh 2: pesan minimal 2 hari sebelumnya
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Metode & Kebijakan Pembayaran
              </h3>
              <p className="text-xs text-stone-500">
                Pilih apakah pelanggan membayar uang muka (DP) atau langsung melunasi pesanan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Mode Pembayaran Awal
              </label>
              <select
                value={formToko.mode_pembayaran}
                onChange={(e) =>
                  setFormToko({ ...formToko, mode_pembayaran: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
              >
                <option value="DP">Mode DP (Uang Muka)</option>
                <option value="Lunas">Mode Lunas (Bayar Penuh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Persentase DP (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                disabled={formToko.mode_pembayaran === "Lunas"}
                value={formToko.persen_dp}
                onChange={(e) =>
                  setFormToko({
                    ...formToko,
                    persen_dp: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm disabled:bg-stone-50 disabled:text-stone-400"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                {formToko.mode_pembayaran === "Lunas"
                  ? "Tidak aktif untuk mode Lunas (100%)"
                  : "Contoh: 50% saat memesan"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Batas Waktu Bayar (Jam)
              </label>
              <input
                type="number"
                min="1"
                value={formToko.batas_bayar_jam}
                onChange={(e) =>
                  setFormToko({
                    ...formToko,
                    batas_bayar_jam: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Batas unggah bukti sebelum dibatalkan otomatis
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <h4 className="text-sm font-bold text-stone-800 mb-3">
              Rekening Bank & QRIS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nama Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA / Mandiri / BRI"
                  value={formToko.nama_bank}
                  onChange={(e) =>
                    setFormToko({ ...formToko, nama_bank: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1234567890"
                  value={formToko.no_rekening}
                  onChange={(e) =>
                    setFormToko({ ...formToko, no_rekening: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dapur Manis"
                  value={formToko.atas_nama}
                  onChange={(e) =>
                    setFormToko({ ...formToko, atas_nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-stone-50 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {previewQris ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-white flex-shrink-0 flex items-center justify-center p-1 relative">
                    <Image
                      src={previewQris}
                      alt="Gambar QRIS"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-dashed border-stone-300 bg-white flex flex-col items-center justify-center text-stone-400 text-xs">
                    <i className="fa-solid fa-qrcode text-2xl mb-1 text-stone-300"></i>
                    <span>Tanpa QRIS</span>
                  </div>
                )}
                <div>
                  <h5 className="text-xs font-bold text-stone-800">
                    Gambar Barcode QRIS
                  </h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Format file JPG, PNG, atau WebP (maks. 2 MB).
                  </p>
                  {previewQris && (
                    <button
                      type="button"
                      onClick={handleHapusGambarQris}
                      className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Hapus Gambar QRIS
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-semibold text-xs shadow-sm cursor-pointer transition">
                  <i className="fa-solid fa-upload text-stone-500"></i>
                  <span>Pilih File QRIS</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePilihFileQris}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sedangSimpanToko}
            className="px-8 py-3 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {sedangSimpanToko ? "Menyimpan Pengaturan..." : "Simpan Pengaturan Toko"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Zona & Tarif Ongkir
              </h3>
              <p className="text-xs text-stone-500">
                Pelanggan yang memilih opsi pengiriman &quot;Kirim&quot; akan memilih dari zona ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={bukaModalTambahZona}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer self-start sm:self-center"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Tambah Zona</span>
          </button>
        </div>

        {daftarZona.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl">
            Belum ada zona ongkir. Pilihan pengiriman &quot;Kirim&quot; akan disembunyikan sampai ada zona aktif.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">Nama Zona</th>
                  <th className="py-2.5 px-4">Tarif Ongkir</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right rounded-r-xl w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daftarZona.map((zona) => (
                  <tr key={zona.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 font-medium text-stone-900">
                      {zona.nama}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {formatRupiah(zona.tarif)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleStatusZona(zona)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                          zona.aktif
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            zona.aktif ? "bg-emerald-500" : "bg-stone-400"
                          }`}
                        ></span>
                        <span>{zona.aktif ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => bukaModalEditZona(zona)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Edit Zona"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => hapusZona(zona)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Zona"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-calendar-xmark"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Tanggal Tutup / Libur Toko
              </h3>
              <p className="text-xs text-stone-500">
                Tanggal di bawah ini tidak dapat dipilih pelanggan di kalender pemesanan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={bukaModalTambahTanggal}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer self-start sm:self-center"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Tambah Tanggal Tutup</span>
          </button>
        </div>

        {daftarTanggalTutup.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl">
            Tidak ada tanggal libur khusus. Toko siap menerima pesanan sesuai jadwal buka normal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">Tanggal</th>
                  <th className="py-2.5 px-4">Alasan Libur / Tutup</th>
                  <th className="py-2.5 px-4 text-right rounded-r-xl w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daftarTanggalTutup.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {formatTanggalIndonesia(item.tanggal)}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {item.alasan || "Libur Toko"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => hapusTanggalTutup(item)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Buka Kembali Tanggal Ini"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalZonaBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="text-lg font-bold text-stone-900">
                {editZonaId ? "Edit Zona Ongkir" : "Tambah Zona Ongkir"}
              </h3>
              <button
                type="button"
                onClick={() => setModalZonaBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {errorZona.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {errorZona.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={simpanZona} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Zona <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Zona 1 (Radius 0 - 5 km)"
                  value={formZona.nama}
                  onChange={(e) =>
                    setFormZona({ ...formZona, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tarif Ongkir (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={formZona.tarif}
                  onChange={(e) =>
                    setFormZona({ ...formZona, tarif: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formZona.aktif}
                    onChange={(e) =>
                      setFormZona({ ...formZona, aktif: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-400 border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Zona Aktif (Dapat dipilih pelanggan saat checkout pengiriman)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalZonaBuka(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesZona}
                  className="px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProsesZona ? "Menyimpan..." : "Simpan Zona"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalTanggalBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="text-lg font-bold text-stone-900">
                Tambah Tanggal Tutup
              </h3>
              <button
                type="button"
                onClick={() => setModalTanggalBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {errorTanggal.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {errorTanggal.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={simpanTanggalTutup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pilih Tanggal Tutup <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formTanggal.tanggal}
                  onChange={(e) =>
                    setFormTanggal({ ...formTanggal, tanggal: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alasan Libur / Tutup
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Hari Raya, Dapur Renovasi"
                  value={formTanggal.alasan}
                  onChange={(e) =>
                    setFormTanggal({ ...formTanggal, alasan: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalTanggalBuka(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesTanggal}
                  className="px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProsesTanggal ? "Menyimpan..." : "Simpan Tanggal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalPesan
        terbuka={notifikasi.terbuka}
        judul={notifikasi.judul}
        pesan={notifikasi.pesan}
        tipe={notifikasi.tipe}
        onTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
      />
    </div>
  );
}