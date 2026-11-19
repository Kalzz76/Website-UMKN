"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function PengaturanPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [tabAktif, setTabAktif] = useState("toko");
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (modalZonaBuka || modalTanggalBuka || notifikasi.terbuka) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalZonaBuka, modalTanggalBuka, notifikasi.terbuka]);

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

    if (zonaList) setDaftarZona(zonaList);

    const { data: tglList } = await supabase
      .from("tanggal_tutup")
      .select("*")
      .gte("tanggal", new Date().toISOString().split("T")[0])
      .order("tanggal", { ascending: true });

    if (tglList) setDaftarTanggalTutup(tglList);

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  function handlePilihFileQris(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorToko(["Format file harus berupa gambar (JPG, PNG, WebP)."]);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorToko(["Ukuran gambar maksimal 2 MB."]);
      return;
    }

    setFileQris(file);
    setHapusQrisFlag(false);
    setErrorToko([]);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewQris(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleHapusGambarQris() {
    setFileQris(null);
    setPreviewQris(null);
    setHapusQrisFlag(true);
  }

  async function simpanPengaturanToko(e) {
    e.preventDefault();
    setErrorToko([]);

    if (!formToko.nama_toko.trim()) {
      setErrorToko(["Nama toko tidak boleh kosong."]);
      return;
    }

    if (!formToko.no_wa.trim()) {
      setErrorToko(["Nomor WhatsApp toko wajib diisi."]);
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
      setErrorTanggal(["Tanggal tutup harus dipilih."]);
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
      setErrorTanggal([hasil.pesan || "Gagal menyimpan tanggal tutup."]);
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
      `Buka kembali toko untuk tanggal ${formatTanggalIndonesia(item.tanggal)}?`
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
      <div className="content-card p-12 text-center text-stone-400">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-[#ba2b2b]"></i>
        <p className="text-xs font-bold text-[#1d3b2e]">Memuat pengaturan toko...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Pengaturan Toko & Operasional
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola profil toko, jadwal pemesanan, kebijakan pembayaran, zona tarif pengiriman, dan hari libur
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tabAktif === "ongkir" && (
            <button
              type="button"
              onClick={bukaModalTambahZona}
              className="h-[42px] px-4 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5 flex-shrink-0"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Tambah Zona</span>
            </button>
          )}

          {tabAktif === "libur" && (
            <button
              type="button"
              onClick={bukaModalTambahTanggal}
              className="h-[42px] px-4 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5 flex-shrink-0"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Tambah Hari Libur</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button
          type="button"
          onClick={() => setTabAktif("toko")}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 ${
            tabAktif === "toko"
              ? "bg-[#ba2b2b] text-white"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
          }`}
        >
          <i className="fa-solid fa-store text-xs"></i>
          <span>Profil Toko</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("jadwal")}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 ${
            tabAktif === "jadwal"
              ? "bg-[#ba2b2b] text-white"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
          }`}
        >
          <i className="fa-solid fa-clock text-xs"></i>
          <span>Jadwal & Kuota</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("pembayaran")}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 ${
            tabAktif === "pembayaran"
              ? "bg-[#ba2b2b] text-white"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
          }`}
        >
          <i className="fa-solid fa-credit-card text-xs"></i>
          <span>Pembayaran & Rekening</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("ongkir")}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 ${
            tabAktif === "ongkir"
              ? "bg-[#ba2b2b] text-white"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
          }`}
        >
          <i className="fa-solid fa-truck-fast text-xs"></i>
          <span>Zona Ongkir ({daftarZona.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("libur")}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 ${
            tabAktif === "libur"
              ? "bg-[#ba2b2b] text-white"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
          }`}
        >
          <i className="fa-solid fa-calendar-xmark text-xs"></i>
          <span>Hari Libur ({daftarTanggalTutup.length})</span>
        </button>
      </div>

      {tabAktif === "toko" && (
        <div className="content-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#e8dfc8]">
            <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
              <i className="fa-solid fa-store"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Informasi Profil Toko
              </h3>
              <p className="text-xs text-stone-500">
                Nama, nomor WhatsApp, dan alamat toko ditampilkan pada halaman utama dan bukti pemesanan pelanggan.
              </p>
            </div>
          </div>

          {errorToko.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
              {errorToko.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          <form onSubmit={simpanPengaturanToko} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Nama Toko <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formToko.nama_toko}
                  onChange={(e) =>
                    setFormToko({ ...formToko, nama_toko: e.target.value })
                  }
                  placeholder="Contoh: Cravely Bakery"
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
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
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Alamat Lengkap Toko
                </label>
                <textarea
                  rows="2"
                  value={formToko.alamat}
                  onChange={(e) =>
                    setFormToko({ ...formToko, alamat: e.target.value })
                  }
                  placeholder="Jl. Melati No. 12, Jakarta"
                  className="w-full p-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs text-[#1d3b2e] resize-none"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Teks Jam Operasional Toko
                </label>
                <input
                  type="text"
                  value={formToko.jam_operasional}
                  onChange={(e) =>
                    setFormToko({
                      ...formToko,
                      jam_operasional: e.target.value,
                    })
                  }
                  placeholder="Contoh: Setiap Hari: 08.00 - 20.00 WIB"
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8dfc8] flex justify-end">
              <button
                type="submit"
                disabled={sedangSimpanToko}
                className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <i className="fa-solid fa-floppy-disk text-xs"></i>
                <span>{sedangSimpanToko ? "Menyimpan..." : "Simpan Profil Toko"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {tabAktif === "jadwal" && (
        <div className="content-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#e8dfc8]">
            <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Jadwal & Kuota Pemesanan
              </h3>
              <p className="text-xs text-stone-500">
                Atur jam pengambilan pesanan, kuota pesanan per hari, dan batas minimal persiapan hari sebelum jadwal ambil.
              </p>
            </div>
          </div>

          {errorToko.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
              {errorToko.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          <form onSubmit={simpanPengaturanToko} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Jam Buka Operasional
                </label>
                <input
                  type="time"
                  required
                  value={formToko.jam_buka}
                  onChange={(e) =>
                    setFormToko({ ...formToko, jam_buka: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Jam Tutup Operasional
                </label>
                <input
                  type="time"
                  required
                  value={formToko.jam_tutup}
                  onChange={(e) =>
                    setFormToko({ ...formToko, jam_tutup: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Kuota Pesanan / Hari
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
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Maksimal pesanan aktif per tanggal
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
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
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Contoh: 2 (pesan minimal 2 hari sebelumnya)
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8dfc8] flex justify-end">
              <button
                type="submit"
                disabled={sedangSimpanToko}
                className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <i className="fa-solid fa-floppy-disk text-xs"></i>
                <span>{sedangSimpanToko ? "Menyimpan..." : "Simpan Jadwal & Kuota"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {tabAktif === "pembayaran" && (
        <div className="content-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#e8dfc8]">
            <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Metode Pembayaran & Rekening
              </h3>
              <p className="text-xs text-stone-500">
                Pilih apakah pelanggan membayar uang muka (DP) atau lunas penuh, batas waktu unggah bukti bayar, serta informasi rekening transfer dan QRIS.
              </p>
            </div>
          </div>

          {errorToko.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
              {errorToko.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          <form onSubmit={simpanPengaturanToko} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Mode Pembayaran Awal
                </label>
                <select
                  value={formToko.mode_pembayaran}
                  onChange={(e) =>
                    setFormToko({
                      ...formToko,
                      mode_pembayaran: e.target.value,
                    })
                  }
                  className="w-full h-[42px] px-3.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e] cursor-pointer"
                >
                  <option value="DP">Mode DP (Uang Muka)</option>
                  <option value="Lunas">Mode Lunas (Bayar Penuh 100%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
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
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e] disabled:bg-stone-100 disabled:text-stone-400"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  {formToko.mode_pembayaran === "Lunas"
                    ? "Terkunci untuk mode Lunas (100%)"
                    : "Contoh: 50% saat memesan"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
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
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Batas unggah bukti sebelum otomatis dibatalkan
                </span>
              </div>
            </div>

            <div className="pt-5 border-t border-[#e8dfc8]">
              <h4 className="text-sm font-bold text-[#1d3b2e] mb-3">
                Informasi Rekening Bank & QRIS Toko
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BCA / Mandiri / BRI"
                    value={formToko.nama_bank}
                    onChange={(e) =>
                      setFormToko({ ...formToko, nama_bank: e.target.value })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={formToko.no_rekening}
                    onChange={(e) =>
                      setFormToko({
                        ...formToko,
                        no_rekening: e.target.value,
                      })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Atas Nama Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cravely Bakery"
                    value={formToko.atas_nama}
                    onChange={(e) =>
                      setFormToko({ ...formToko, atas_nama: e.target.value })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-[#ede2cd]/50 border border-[#dfd4bd] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {previewQris ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#dcd3c1] bg-white flex-shrink-0 flex items-center justify-center p-1 relative shadow-xs">
                      <Image
                        src={previewQris}
                        alt="Gambar QRIS"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border border-dashed border-[#cec1aa] bg-white flex flex-col items-center justify-center text-stone-400 text-xs">
                      <i className="fa-solid fa-qrcode text-2xl mb-1 text-stone-300"></i>
                      <span className="text-[11px] font-bold">Tanpa QRIS</span>
                    </div>
                  )}

                  <div>
                    <h5 className="text-xs font-bold text-[#1d3b2e]">
                      Gambar Barcode QRIS Toko
                    </h5>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Format file JPG, PNG, atau WebP (maks. 2 MB).
                    </p>
                    {previewQris && (
                      <button
                        type="button"
                        onClick={handleHapusGambarQris}
                        className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Hapus Gambar QRIS
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="h-[40px] px-4 rounded-xl border border-[#dcd3c1] bg-white hover:bg-[#ede2cd] text-[#1d3b2e] font-bold text-xs inline-flex items-center space-x-2 cursor-pointer transition shadow-xs">
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

            <div className="pt-4 border-t border-[#e8dfc8] flex justify-end">
              <button
                type="submit"
                disabled={sedangSimpanToko}
                className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <i className="fa-solid fa-floppy-disk text-xs"></i>
                <span>{sedangSimpanToko ? "Menyimpan..." : "Simpan Pembayaran & Rekening"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {tabAktif === "ongkir" && (
        <div className="content-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8dfc8]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Zona & Tarif Ongkir Pengiriman
                </h3>
                <p className="text-xs text-stone-500">
                  Pelanggan yang memilih opsi pengiriman &quot;Kirim&quot; akan memilih wilayah dari daftar zona ini.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={bukaModalTambahZona}
              className="h-[42px] px-4 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5 self-start sm:self-center"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Tambah Zona</span>
            </button>
          </div>

          {daftarZona.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <i className="fa-solid fa-truck-ramp-box text-3xl mb-2 block text-stone-300"></i>
              <p className="text-sm font-bold text-[#1d3b2e]">Belum ada zona ongkir pengiriman.</p>
              <p className="text-xs text-stone-500 mt-1">Opsi pengiriman &quot;Kirim&quot; akan disembunyikan sampai minimal ada satu zona aktif.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-xs font-bold border-y border-[#dfd4bd]">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Nama Zona</th>
                    <th className="py-3 px-4">Tarif Ongkir</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right rounded-r-xl w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede2cd]">
                  {daftarZona.map((zona) => (
                    <tr key={zona.id} className="hover:bg-black/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-[#1d3b2e]">
                        {zona.nama}
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#1d3b2e]">
                        {formatRupiah(zona.tarif)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatusZona(zona)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            zona.aktif
                              ? "bg-[#d8e3cf] text-[#215934] border border-[#bad1ab]"
                              : "bg-stone-200 text-stone-600 border border-stone-300"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              zona.aktif ? "bg-[#215934]" : "bg-stone-500"
                            }`}
                          ></span>
                          <span>{zona.aktif ? "Aktif" : "Nonaktif"}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => bukaModalEditZona(zona)}
                            className="w-8 h-8 rounded-lg border border-[#dcd3c1] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] inline-flex items-center justify-center transition cursor-pointer"
                            title="Edit Zona"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => hapusZona(zona)}
                            className="w-8 h-8 rounded-lg border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
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
      )}

      {tabAktif === "libur" && (
        <div className="content-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8dfc8]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                <i className="fa-solid fa-calendar-xmark"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Jadwal Tutup & Libur Toko
                </h3>
                <p className="text-xs text-stone-500">
                  Tanggal yang tercantum di bawah ini akan dinonaktifkan di kalender pemesanan pelanggan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={bukaModalTambahTanggal}
              className="h-[42px] px-4 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5 self-start sm:self-center"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Tambah Hari Libur</span>
            </button>
          </div>

          {daftarTanggalTutup.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <i className="fa-solid fa-calendar-check text-3xl mb-2 block text-stone-300"></i>
              <p className="text-sm font-bold text-[#1d3b2e]">Tidak ada tanggal libur khusus.</p>
              <p className="text-xs text-stone-500 mt-1">Toko siap menerima pesanan sesuai jadwal normal setiap hari.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-xs font-bold border-y border-[#dfd4bd]">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Tanggal</th>
                    <th className="py-3 px-4">Alasan Libur / Keterangan</th>
                    <th className="py-3 px-4 text-right rounded-r-xl w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede2cd]">
                  {daftarTanggalTutup.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.02] transition">
                      <td className="py-3.5 px-4 font-black text-[#1d3b2e]">
                        {formatTanggalIndonesia(item.tanggal)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {item.alasan || "Libur Operasional Toko"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => hapusTanggalTutup(item)}
                          className="w-8 h-8 rounded-lg border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
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
      )}

      {isMounted && modalZonaBuka && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalZonaBuka(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          className="flex items-center justify-center p-3 sm:p-5 bg-black/75 overflow-hidden"
        >
          <div className="relative bg-[#fbf6e9] border border-[#e8dfc8] rounded-[24px] max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <h3 className="text-base font-bold text-[#1d3b2e]">
                {editZonaId ? "Edit Zona Ongkir" : "Tambah Zona Ongkir"}
              </h3>
              <button
                type="button"
                onClick={() => setModalZonaBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#dcd3c1] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {errorZona.length > 0 && (
              <div className="px-6 pt-4">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                  {errorZona.map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={simpanZona} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
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
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
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
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formZona.aktif}
                      onChange={(e) =>
                        setFormZona({ ...formZona, aktif: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#ba2b2b] focus:ring-[#ba2b2b] border-[#dcd3c1]"
                    />
                    <span className="text-xs font-bold text-[#1d3b2e]">
                      Zona Aktif (Tampil dan dapat dipilih pelanggan di opsi checkout kirim)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalZonaBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd3c1] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesZona}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {sedangProsesZona ? "Menyimpan..." : "Simpan Zona"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isMounted && modalTanggalBuka && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalTanggalBuka(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          className="flex items-center justify-center p-3 sm:p-5 bg-black/75 overflow-hidden"
        >
          <div className="relative bg-[#fbf6e9] border border-[#e8dfc8] rounded-[24px] max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Tambah Tanggal Tutup / Libur Toko
              </h3>
              <button
                type="button"
                onClick={() => setModalTanggalBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#dcd3c1] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {errorTanggal.length > 0 && (
              <div className="px-6 pt-4">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                  {errorTanggal.map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={simpanTanggalTutup} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Pilih Tanggal Tutup <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal.tanggal}
                    onChange={(e) =>
                      setFormTanggal({ ...formTanggal, tanggal: e.target.value })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Alasan Libur / Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Libur Hari Raya, Renovasi Dapur"
                    value={formTanggal.alasan}
                    onChange={(e) =>
                      setFormTanggal({ ...formTanggal, alasan: e.target.value })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalTanggalBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd3c1] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesTanggal}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {sedangProsesTanggal ? "Menyimpan..." : "Simpan Hari Libur"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
