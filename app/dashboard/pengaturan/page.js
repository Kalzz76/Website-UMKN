"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import { cariTarifJarak } from "@/lib/ongkir";
import ModalPesan from "@/components/ModalPesan";

const PetaLokasi = dynamic(() => import("@/components/PetaLokasi"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-[#ede2cd] flex items-center justify-center text-xs font-bold text-stone-500">
      Memuat peta...
    </div>
  ),
});

export default function PengaturanPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [tabAktif, setTabAktif] = useState("toko");
  const [sedangMemuat, setSedangMemuat] = useState(true);

  const [sedangSimpanToko, setSedangSimpanToko] = useState(false);
  const [sedangSimpanPemesanan, setSedangSimpanPemesanan] = useState(false);
  const [sedangSimpanPembayaran, setSedangSimpanPembayaran] = useState(false);
  const [sedangSimpanOngkir, setSedangSimpanOngkir] = useState(false);
  const [sedangProsesTarifJarak, setSedangProsesTarifJarak] = useState(false);
  const [sedangProsesZona, setSedangProsesZona] = useState(false);
  const [sedangProsesTanggal, setSedangProsesTanggal] = useState(false);

  const [formToko, setFormToko] = useState({
    nama_toko: "",
    no_wa: "",
    email: "",
    instagram: "",
    alamat: "",
    tautan_peta: "",
    deskripsi_footer: "",
    jam_buka_senin_jumat: "08:00",
    jam_tutup_senin_jumat: "20:00",
    jam_buka_sabtu_minggu: "08:00",
    jam_tutup_sabtu_minggu: "20:00",
  });
  const [dataAwalToko, setDataAwalToko] = useState(null);

  const [formPemesanan, setFormPemesanan] = useState({
    kuota_harian: 5,
    minimal_hari_pesan: 2,
    minimal_hari_katalog: 1,
  });
  const [dataAwalPemesanan, setDataAwalPemesanan] = useState(null);

  const [formPembayaran, setFormPembayaran] = useState({
    mode_pembayaran: "DP",
    persen_dp: 50,
    batas_bayar_jam: 24,
    transfer_manual_aktif: false,
    nama_bank: "",
    no_rekening: "",
    atas_nama: "",
    gambar_qris: null,
  });
  const [dataAwalPembayaran, setDataAwalPembayaran] = useState(null);

  const [formOngkir, setFormOngkir] = useState({
    lat_toko: -6.9175,
    lng_toko: 107.6191,
    faktor_jalan: 1.3,
    maks_jarak_kirim_km: 20,
  });
  const [dataAwalOngkir, setDataAwalOngkir] = useState(null);

  const [statusMidtrans, setStatusMidtrans] = useState("Belum Terhubung");
  const [fileQris, setFileQris] = useState(null);
  const [previewQris, setPreviewQris] = useState(null);
  const [hapusQrisFlag, setHapusQrisFlag] = useState(false);

  const [daftarTarifJarak, setDaftarTarifJarak] = useState([]);
  const [daftarZona, setDaftarZona] = useState([]);
  const [daftarTanggalTutup, setDaftarTanggalTutup] = useState([]);

  const [zonaLamaBuka, setZonaLamaBuka] = useState(false);

  const [modalTarifJarakBuka, setModalTarifJarakBuka] = useState(false);
  const [editTarifJarakId, setEditTarifJarakId] = useState(null);
  const [formTarifJarak, setFormTarifJarak] = useState({
    jarak_maks_km: "",
    tarif: 0,
    aktif: true,
  });
  const [errorTarifJarak, setErrorTarifJarak] = useState([]);

  const [simulasiJarak, setSimulasiJarak] = useState("");
  const [hasilSimulasi, setHasilSimulasi] = useState(null);

  const [modalZonaBuka, setModalZonaBuka] = useState(false);
  const [editZonaId, setEditZonaId] = useState(null);
  const [formZona, setFormZona] = useState({
    nama: "",
    tarif: 0,
    aktif: true,
  });
  const [errorZona, setErrorZona] = useState([]);

  const [modalTanggalBuka, setModalTanggalBuka] = useState(false);
  const [formTanggal, setFormTanggal] = useState({
    tanggal: "",
    alasan: "",
  });
  const [errorTanggal, setErrorTanggal] = useState([]);

  const [errorToko, setErrorToko] = useState([]);
  const [errorPemesanan, setErrorPemesanan] = useState([]);
  const [errorPembayaran, setErrorPembayaran] = useState([]);
  const [errorOngkir, setErrorOngkir] = useState([]);

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
    if (modalZonaBuka || modalTanggalBuka || modalTarifJarakBuka || notifikasi.terbuka) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalZonaBuka, modalTanggalBuka, modalTarifJarakBuka, notifikasi.terbuka]);

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: prof } = await supabase
        .from("profil")
        .select("role")
        .eq("id", user.id)
        .single();
      if (prof?.role === "staf") {
        router.replace("/dashboard");
        return;
      }
    }

    try {
      const res = await fetch("/api/pengaturan");
      const json = await res.json();
      if (json.sukses && json.data) {
        const d = json.data;

        const awalToko = {
          nama_toko: d.nama_toko || "",
          no_wa: d.no_wa || "",
          email: d.email || "",
          instagram: d.instagram || "",
          alamat: d.alamat || "",
          tautan_peta: d.tautan_peta || "",
          deskripsi_footer: d.deskripsi_footer || "",
          jam_buka_senin_jumat: d.jam_buka_senin_jumat?.slice(0, 5) || d.jam_buka?.slice(0, 5) || "08:00",
          jam_tutup_senin_jumat: d.jam_tutup_senin_jumat?.slice(0, 5) || d.jam_tutup?.slice(0, 5) || "20:00",
          jam_buka_sabtu_minggu: d.jam_buka_sabtu_minggu?.slice(0, 5) || d.jam_buka?.slice(0, 5) || "08:00",
          jam_tutup_sabtu_minggu: d.jam_tutup_sabtu_minggu?.slice(0, 5) || d.jam_tutup?.slice(0, 5) || "20:00",
        };
        setFormToko(awalToko);
        setDataAwalToko(awalToko);

        const awalPemesanan = {
          kuota_harian: d.kuota_harian ?? 5,
          minimal_hari_pesan: d.minimal_hari_pesan ?? 2,
          minimal_hari_katalog: d.minimal_hari_katalog ?? d.minimal_hari_siap ?? 1,
        };
        setFormPemesanan(awalPemesanan);
        setDataAwalPemesanan(awalPemesanan);

        const awalPembayaran = {
          mode_pembayaran: d.mode_pembayaran || "DP",
          persen_dp: d.persen_dp ?? 50,
          batas_bayar_jam: d.batas_bayar_jam ?? 24,
          transfer_manual_aktif: Boolean(d.transfer_manual_aktif),
          nama_bank: d.nama_bank || "",
          no_rekening: d.no_rekening || "",
          atas_nama: d.atas_nama || "",
          gambar_qris: d.gambar_qris || null,
        };
        setFormPembayaran(awalPembayaran);
        setDataAwalPembayaran(awalPembayaran);
        setPreviewQris(d.gambar_qris || null);

        const awalOngkir = {
          lat_toko: d.lat_toko ?? -6.9175,
          lng_toko: d.lng_toko ?? 107.6191,
          faktor_jalan: d.faktor_jalan ?? 1.3,
          maks_jarak_kirim_km: d.maks_jarak_kirim_km ?? 20,
        };
        setFormOngkir(awalOngkir);
        setDataAwalOngkir(awalOngkir);

        setStatusMidtrans(d.status_midtrans || "Belum Terhubung");
        setDaftarTarifJarak(d.tarif_jarak || []);
        setDaftarZona(d.zona || []);
        setDaftarTanggalTutup(d.tanggal_tutup || []);
      }
    } catch (err) {
      setNotifikasi({
        terbuka: true,
        judul: "Gagal Memuat Data",
        pesan: "Gagal memuat pengaturan toko dari server.",
        tipe: "error",
      });
    }

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  const adaPerubahanToko = useMemo(() => {
    if (!dataAwalToko) return false;
    return (
      formToko.nama_toko !== dataAwalToko.nama_toko ||
      formToko.no_wa !== dataAwalToko.no_wa ||
      formToko.email !== dataAwalToko.email ||
      formToko.instagram !== dataAwalToko.instagram ||
      formToko.alamat !== dataAwalToko.alamat ||
      formToko.tautan_peta !== dataAwalToko.tautan_peta ||
      formToko.deskripsi_footer !== dataAwalToko.deskripsi_footer ||
      formToko.jam_buka_senin_jumat !== dataAwalToko.jam_buka_senin_jumat ||
      formToko.jam_tutup_senin_jumat !== dataAwalToko.jam_tutup_senin_jumat ||
      formToko.jam_buka_sabtu_minggu !== dataAwalToko.jam_buka_sabtu_minggu ||
      formToko.jam_tutup_sabtu_minggu !== dataAwalToko.jam_tutup_sabtu_minggu
    );
  }, [formToko, dataAwalToko]);

  const adaPerubahanPemesanan = useMemo(() => {
    if (!dataAwalPemesanan) return false;
    return (
      Number(formPemesanan.kuota_harian) !== Number(dataAwalPemesanan.kuota_harian) ||
      Number(formPemesanan.minimal_hari_pesan) !== Number(dataAwalPemesanan.minimal_hari_pesan) ||
      Number(formPemesanan.minimal_hari_katalog) !== Number(dataAwalPemesanan.minimal_hari_katalog)
    );
  }, [formPemesanan, dataAwalPemesanan]);

  const adaPerubahanPembayaran = useMemo(() => {
    if (!dataAwalPembayaran) return false;
    return (
      formPembayaran.mode_pembayaran !== dataAwalPembayaran.mode_pembayaran ||
      Number(formPembayaran.persen_dp) !== Number(dataAwalPembayaran.persen_dp) ||
      Number(formPembayaran.batas_bayar_jam) !== Number(dataAwalPembayaran.batas_bayar_jam) ||
      formPembayaran.transfer_manual_aktif !== dataAwalPembayaran.transfer_manual_aktif ||
      formPembayaran.nama_bank !== dataAwalPembayaran.nama_bank ||
      formPembayaran.no_rekening !== dataAwalPembayaran.no_rekening ||
      formPembayaran.atas_nama !== dataAwalPembayaran.atas_nama ||
      fileQris !== null ||
      hapusQrisFlag === true
    );
  }, [formPembayaran, dataAwalPembayaran, fileQris, hapusQrisFlag]);

  const adaPerubahanOngkir = useMemo(() => {
    if (!dataAwalOngkir) return false;
    return (
      Number(formOngkir.lat_toko) !== Number(dataAwalOngkir.lat_toko) ||
      Number(formOngkir.lng_toko) !== Number(dataAwalOngkir.lng_toko) ||
      Number(formOngkir.faktor_jalan) !== Number(dataAwalOngkir.faktor_jalan) ||
      Number(formOngkir.maks_jarak_kirim_km) !== Number(dataAwalOngkir.maks_jarak_kirim_km)
    );
  }, [formOngkir, dataAwalOngkir]);

  function handlePilihFileQris(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorPembayaran(["Format file harus berupa gambar (JPG, PNG, WebP)."]);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorPembayaran(["Ukuran gambar maksimal 2 MB."]);
      return;
    }

    setFileQris(file);
    setHapusQrisFlag(false);
    setErrorPembayaran([]);

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

  async function simpanToko(e) {
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

    if (formToko.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formToko.email.trim())) {
      setErrorToko(["Format email tidak valid."]);
      return;
    }

    if (formToko.tautan_peta.trim() && !formToko.tautan_peta.trim().startsWith("https://")) {
      setErrorToko(["Tautan peta harus diawali dengan https://"]);
      return;
    }

    if (formToko.deskripsi_footer.length > 300) {
      setErrorToko(["Deskripsi footer maksimal 300 karakter."]);
      return;
    }

    if (formToko.jam_tutup_senin_jumat <= formToko.jam_buka_senin_jumat) {
      setErrorToko(["Jam tutup Senin-Jumat harus lebih besar dari jam buka."]);
      return;
    }

    if (formToko.jam_tutup_sabtu_minggu <= formToko.jam_buka_sabtu_minggu) {
      setErrorToko(["Jam tutup Sabtu-Minggu harus lebih besar dari jam buka."]);
      return;
    }

    setSedangSimpanToko(true);

    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "simpan_toko",
        ...formToko,
      }),
    });

    const hasil = await res.json();
    setSedangSimpanToko(false);

    if (!res.ok) {
      setErrorToko([hasil.pesan || "Gagal menyimpan profil toko."]);
      return;
    }

    setDataAwalToko({ ...formToko });
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan || "Pengaturan profil toko berhasil diperbarui.",
      tipe: "sukses",
    });
  }

  async function simpanPemesanan(e) {
    e.preventDefault();
    setErrorPemesanan([]);

    const kuota = Number(formPemesanan.kuota_harian);
    const minCustom = Number(formPemesanan.minimal_hari_pesan);
    const minKatalog = Number(formPemesanan.minimal_hari_katalog);

    if (isNaN(kuota) || kuota < 1 || kuota > 100) {
      setErrorPemesanan(["Kuota harian harus antara 1 sampai 100 pesanan."]);
      return;
    }

    if (isNaN(minCustom) || minCustom < 0 || minCustom > 30) {
      setErrorPemesanan(["Minimal hari pesan custom cake harus antara 0 sampai 30 hari."]);
      return;
    }

    if (isNaN(minKatalog) || minKatalog < 0 || minKatalog > 30) {
      setErrorPemesanan(["Minimal hari pesan kue katalog harus antara 0 sampai 30 hari."]);
      return;
    }

    setSedangSimpanPemesanan(true);

    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "simpan_pemesanan",
        kuota_harian: kuota,
        minimal_hari_pesan: minCustom,
        minimal_hari_katalog: minKatalog,
      }),
    });

    const hasil = await res.json();
    setSedangSimpanPemesanan(false);

    if (!res.ok) {
      setErrorPemesanan([hasil.pesan || "Gagal menyimpan parameter pemesanan."]);
      return;
    }

    setDataAwalPemesanan({
      kuota_harian: kuota,
      minimal_hari_pesan: minCustom,
      minimal_hari_katalog: minKatalog,
    });
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan || "Parameter pemesanan berhasil diperbarui.",
      tipe: "sukses",
    });
  }

  async function simpanPembayaran(e) {
    e.preventDefault();
    setErrorPembayaran([]);

    const dp = Number(formPembayaran.persen_dp);
    const batas = Number(formPembayaran.batas_bayar_jam);

    if (formPembayaran.mode_pembayaran === "DP" && (isNaN(dp) || dp < 1 || dp > 100)) {
      setErrorPembayaran(["Persentase DP harus antara 1 sampai 100 persen."]);
      return;
    }

    if (isNaN(batas) || batas < 1 || batas > 168) {
      setErrorPembayaran(["Batas waktu pembayaran harus antara 1 sampai 168 jam."]);
      return;
    }

    setSedangSimpanPembayaran(true);

    const formData = new FormData();
    formData.append("aksi", "simpan_pembayaran");
    formData.append("mode_pembayaran", formPembayaran.mode_pembayaran);
    formData.append("persen_dp", formPembayaran.mode_pembayaran === "DP" ? dp : 100);
    formData.append("batas_bayar_jam", batas);
    formData.append("transfer_manual_aktif", formPembayaran.transfer_manual_aktif ? "true" : "false");
    formData.append("nama_bank", formPembayaran.nama_bank);
    formData.append("no_rekening", formPembayaran.no_rekening);
    formData.append("atas_nama", formPembayaran.atas_nama);
    formData.append("hapus_qris", hapusQrisFlag ? "true" : "false");

    if (fileQris) {
      formData.append("file_qris", fileQris);
    }

    const res = await fetch("/api/pengaturan", {
      method: "POST",
      body: formData,
    });

    const hasil = await res.json();
    setSedangSimpanPembayaran(false);

    if (!res.ok) {
      setErrorPembayaran([hasil.pesan || "Gagal menyimpan pengaturan pembayaran."]);
      return;
    }

    setFileQris(null);
    setHapusQrisFlag(false);
    const qrisFinal = hasil.gambar_qris !== undefined ? hasil.gambar_qris : (hapusQrisFlag ? null : formPembayaran.gambar_qris);
    setPreviewQris(qrisFinal);

    const updated = {
      ...formPembayaran,
      persen_dp: formPembayaran.mode_pembayaran === "DP" ? dp : 100,
      batas_bayar_jam: batas,
      gambar_qris: qrisFinal,
    };
    setFormPembayaran(updated);
    setDataAwalPembayaran(updated);

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan || "Pengaturan pembayaran berhasil diperbarui.",
      tipe: "sukses",
    });
  }

  async function simpanOngkir(e) {
    e.preventDefault();
    setErrorOngkir([]);

    const lat = Number(formOngkir.lat_toko);
    const lng = Number(formOngkir.lng_toko);
    const faktor = Number(formOngkir.faktor_jalan);
    const maks = Number(formOngkir.maks_jarak_kirim_km);

    if (isNaN(lat) || isNaN(lng)) {
      setErrorOngkir(["Koordinat latitude dan longitude toko harus valid."]);
      return;
    }

    if (isNaN(faktor) || faktor < 1.0) {
      setErrorOngkir(["Faktor jalan minimal 1.0."]);
      return;
    }

    if (isNaN(maks) || maks <= 0) {
      setErrorOngkir(["Jarak maksimal pengiriman harus lebih dari 0 km."]);
      return;
    }

    setSedangSimpanOngkir(true);

    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "simpan_ongkir",
        lat_toko: lat,
        lng_toko: lng,
        faktor_jalan: faktor,
        maks_jarak_kirim_km: maks,
      }),
    });

    const hasil = await res.json();
    setSedangSimpanOngkir(false);

    if (!res.ok) {
      setErrorOngkir([hasil.pesan || "Gagal menyimpan lokasi dan parameter ongkir."]);
      return;
    }

    setDataAwalOngkir({
      lat_toko: lat,
      lng_toko: lng,
      faktor_jalan: faktor,
      maks_jarak_kirim_km: maks,
    });
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan || "Lokasi dan parameter ongkir berhasil disimpan.",
      tipe: "sukses",
    });
  }

  function bukaModalTambahTarifJarak() {
    setEditTarifJarakId(null);
    setFormTarifJarak({
      jarak_maks_km: "",
      tarif: 0,
      aktif: true,
    });
    setErrorTarifJarak([]);
    setModalTarifJarakBuka(true);
  }

  function bukaModalEditTarifJarak(tier) {
    setEditTarifJarakId(tier.id);
    setFormTarifJarak({
      jarak_maks_km: tier.jarak_maks_km,
      tarif: tier.tarif,
      aktif: tier.aktif,
    });
    setErrorTarifJarak([]);
    setModalTarifJarakBuka(true);
  }

  async function simpanTarifJarak(e) {
    e.preventDefault();
    setErrorTarifJarak([]);

    const jarak = Number(formTarifJarak.jarak_maks_km);
    const tarif = Number(formTarifJarak.tarif);

    if (isNaN(jarak) || jarak <= 0) {
      setErrorTarifJarak(["Batas jarak maksimal harus lebih dari 0 km."]);
      return;
    }

    if (isNaN(tarif) || tarif < 0) {
      setErrorTarifJarak(["Tarif ongkir minimal Rp 0."]);
      return;
    }

    setSedangProsesTarifJarak(true);
    const aksi = editTarifJarakId ? "edit_tarif_jarak" : "tambah_tarif_jarak";
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editTarifJarakId,
        jarak_maks_km: jarak,
        tarif,
        aktif: formTarifJarak.aktif,
      }),
    });

    const hasil = await res.json();
    setSedangProsesTarifJarak(false);

    if (!res.ok) {
      setErrorTarifJarak([hasil.pesan || "Gagal menyimpan tarif jarak."]);
      return;
    }

    setModalTarifJarakBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function hapusTarifJarak(item) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus tier jarak sampai ${item.jarak_maks_km} km?`
    );
    if (!yakin) return;

    setSedangProsesTarifJarak(true);
    const res = await fetch("/api/pengaturan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_tarif_jarak",
        id: item.id,
      }),
    });

    const hasil = await res.json();
    setSedangProsesTarifJarak(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus tarif jarak.",
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

  function jalankanSimulasiOngkir(e) {
    e.preventDefault();
    const d = parseFloat(simulasiJarak);
    if (isNaN(d) || d <= 0) {
      setHasilSimulasi({ error: "Masukkan jarak yang valid (angka positif)." });
      return;
    }

    const maks = Number(formOngkir.maks_jarak_kirim_km) || 20;
    if (d > maks) {
      setHasilSimulasi({
        error: `Jarak ${d} km melebihi batas maksimal pengiriman toko (${maks} km). Pengiriman tidak dapat dilayani.`,
      });
      return;
    }

    const tier = cariTarifJarak(d, daftarTarifJarak);
    if (!tier) {
      setHasilSimulasi({
        error: `Tidak ada tier tarif aktif yang mencakup jarak ${d} km. Periksa daftar tier Anda.`,
      });
      return;
    }

    setHasilSimulasi({
      jarak: d,
      ongkir: tier.tarif,
      tierMaks: tier.jarak_maks_km,
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
      `Apakah Anda yakin ingin menghapus zona ${zona.nama}?`
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
            Kelola profil toko, parameter pemesanan, kebijakan pembayaran, serta tarif pengiriman berbasis jarak.
          </p>
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
          <span>Toko</span>
          {adaPerubahanToko && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("pemesanan")}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 ${
            tabAktif === "pemesanan"
              ? "bg-[#ba2b2b] text-white"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
          }`}
        >
          <i className="fa-solid fa-calendar-check text-xs"></i>
          <span>Pemesanan</span>
          {adaPerubahanPemesanan && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white"></span>
          )}
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
          <span>Pembayaran</span>
          {adaPerubahanPembayaran && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white"></span>
          )}
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
          <i className="fa-solid fa-route text-xs"></i>
          <span>Ongkir</span>
          {adaPerubahanOngkir && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white"></span>
          )}
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
                Nama toko, kontak WhatsApp, email, media sosial, tautan peta, dan jam operasional kelompok hari.
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

          <form onSubmit={simpanToko} className="space-y-5">
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
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Nomor akan dinormalisasi ke format internasional (62...) untuk tautan wa.me.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Email Toko
                </label>
                <input
                  type="email"
                  value={formToko.email}
                  onChange={(e) =>
                    setFormToko({ ...formToko, email: e.target.value })
                  }
                  placeholder="Contoh: halo@cravely.id"
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Akun Instagram
                </label>
                <input
                  type="text"
                  value={formToko.instagram}
                  onChange={(e) =>
                    setFormToko({ ...formToko, instagram: e.target.value })
                  }
                  placeholder="Contoh: @cravely.bdg atau https://instagram.com/cravely.bdg"
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
                  placeholder="Jl. Melati No. 12, Bandung"
                  className="w-full p-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs text-[#1d3b2e] resize-none"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Tautan Google Maps Toko (Petunjuk Arah)
                </label>
                <input
                  type="url"
                  value={formToko.tautan_peta}
                  onChange={(e) =>
                    setFormToko({ ...formToko, tautan_peta: e.target.value })
                  }
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Harus diawali dengan https:// (digunakan untuk tombol Petunjuk Arah di landing page).
                </span>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1d3b2e]">
                    Deskripsi Singkat Footer
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      formToko.deskripsi_footer.length > 300
                        ? "text-rose-600"
                        : "text-stone-400"
                    }`}
                  >
                    {formToko.deskripsi_footer.length}/300
                  </span>
                </div>
                <textarea
                  rows="3"
                  maxLength={300}
                  value={formToko.deskripsi_footer}
                  onChange={(e) =>
                    setFormToko({ ...formToko, deskripsi_footer: e.target.value })
                  }
                  placeholder="Deskripsi singkat yang tampil di bagian bawah footer..."
                  className="w-full p-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs text-[#1d3b2e] resize-none"
                ></textarea>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8dfc8]">
              <h4 className="text-xs font-bold text-[#1d3b2e] mb-3">
                Jam Operasional Toko
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Buka Senin – Jumat
                  </label>
                  <input
                    type="time"
                    required
                    value={formToko.jam_buka_senin_jumat}
                    onChange={(e) =>
                      setFormToko({ ...formToko, jam_buka_senin_jumat: e.target.value })
                    }
                    className="w-full h-[42px] px-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Tutup Senin – Jumat
                  </label>
                  <input
                    type="time"
                    required
                    value={formToko.jam_tutup_senin_jumat}
                    onChange={(e) =>
                      setFormToko({ ...formToko, jam_tutup_senin_jumat: e.target.value })
                    }
                    className="w-full h-[42px] px-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Buka Sabtu – Minggu
                  </label>
                  <input
                    type="time"
                    required
                    value={formToko.jam_buka_sabtu_minggu}
                    onChange={(e) =>
                      setFormToko({ ...formToko, jam_buka_sabtu_minggu: e.target.value })
                    }
                    className="w-full h-[42px] px-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Tutup Sabtu – Minggu
                  </label>
                  <input
                    type="time"
                    required
                    value={formToko.jam_tutup_sabtu_minggu}
                    onChange={(e) =>
                      setFormToko({ ...formToko, jam_tutup_sabtu_minggu: e.target.value })
                    }
                    className="w-full h-[42px] px-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8dfc8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                {adaPerubahanToko ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <i className="fa-solid fa-circle-exclamation text-xs"></i>
                    <span>Ada perubahan yang belum disimpan</span>
                  </span>
                ) : (
                  <span className="text-stone-400 font-medium">
                    Semua perubahan telah tersimpan
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={sedangSimpanToko || !adaPerubahanToko}
                className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <i className="fa-solid fa-floppy-disk text-xs"></i>
                <span>{sedangSimpanToko ? "Menyimpan..." : "Simpan Profil Toko"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {tabAktif === "pemesanan" && (
        <div className="space-y-6">
          <div className="content-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#e8dfc8]">
              <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                <i className="fa-solid fa-sliders"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Parameter Kuota & Batas Pemesanan
                </h3>
                <p className="text-xs text-stone-500">
                  Kapasitas harian kue custom dan waktu persiapan minimum sebelum tanggal pesanan.
                </p>
              </div>
            </div>

            {errorPemesanan.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {errorPemesanan.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={simpanPemesanan} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Kuota Kue Custom / Hari
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formPemesanan.kuota_harian}
                    onChange={(e) =>
                      setFormPemesanan({
                        ...formPemesanan,
                        kuota_harian: Number(e.target.value),
                      })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Maksimal pesanan custom aktif per tanggal target
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Minimal Hari Pesan Kue Custom (H-)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    required
                    value={formPemesanan.minimal_hari_pesan}
                    onChange={(e) =>
                      setFormPemesanan({
                        ...formPemesanan,
                        minimal_hari_pesan: Number(e.target.value),
                      })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Contoh: 2 (pesan minimal 2 hari sebelumnya)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Minimal Hari Pesan Kue Katalog
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    required
                    value={formPemesanan.minimal_hari_katalog}
                    onChange={(e) =>
                      setFormPemesanan({
                        ...formPemesanan,
                        minimal_hari_katalog: Number(e.target.value),
                      })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Contoh: 1 (pesan minimal 1 hari sebelumnya)
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e8dfc8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  {adaPerubahanPemesanan ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <i className="fa-solid fa-circle-exclamation text-xs"></i>
                      <span>Ada perubahan yang belum disimpan</span>
                    </span>
                  ) : (
                    <span className="text-stone-400 font-medium">
                      Semua perubahan telah tersimpan
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sedangSimpanPemesanan || !adaPerubahanPemesanan}
                  className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <i className="fa-solid fa-floppy-disk text-xs"></i>
                  <span>{sedangSimpanPemesanan ? "Menyimpan..." : "Simpan Parameter Pemesanan"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="content-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8dfc8]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                  <i className="fa-solid fa-calendar-xmark"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d3b2e]">
                    Daftar Hari Libur & Tutup Toko
                  </h3>
                  <p className="text-xs text-stone-500">
                    Tanggal yang tercantum dinonaktifkan di kalender pemilihan tanggal pelanggan.
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
              <div className="py-10 text-center text-stone-400">
                <i className="fa-solid fa-calendar-check text-3xl mb-2 block text-stone-300"></i>
                <p className="text-sm font-bold text-[#1d3b2e]">Tidak ada tanggal libur khusus.</p>
                <p className="text-xs text-stone-500 mt-1">Toko siap menerima pesanan setiap hari sesuai jadwal operasional normal.</p>
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
                          {item.alasan || item.keterangan || "Libur Operasional Toko"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => hapusTanggalTutup(item)}
                            className="w-8 h-8 rounded-lg border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
                            title="Buka Kembali"
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
                Metode Pembayaran & Gateway
              </h3>
              <p className="text-xs text-stone-500">
                Status payment gateway Midtrans, skema uang muka DP custom cake, dan konfigurasi transfer manual.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#dfd4bd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                  statusMidtrans.includes("Terhubung")
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-rose-100 text-rose-700 border border-rose-300"
                }`}
              >
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#1d3b2e]">
                    Midtrans:
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      statusMidtrans.includes("Production")
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : statusMidtrans.includes("Sandbox")
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {statusMidtrans}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {statusMidtrans.includes("Terhubung")
                    ? "Gateway Midtrans aktif terhubung melalui environment variable server (tanpa menampilkan kunci privat)."
                    : "Variabel MIDTRANS_SERVER_KEY / NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum terpasang di server."}
                </p>
              </div>
            </div>
          </div>

          {errorPembayaran.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
              {errorPembayaran.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          <form onSubmit={simpanPembayaran} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Mode Pembayaran Kue Custom
                </label>
                <select
                  value={formPembayaran.mode_pembayaran}
                  onChange={(e) =>
                    setFormPembayaran({
                      ...formPembayaran,
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
                  disabled={formPembayaran.mode_pembayaran === "Lunas"}
                  value={formPembayaran.persen_dp}
                  onChange={(e) =>
                    setFormPembayaran({
                      ...formPembayaran,
                      persen_dp: Number(e.target.value),
                    })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e] disabled:bg-stone-100 disabled:text-stone-400"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  hanya untuk kue custom; kue katalog dan ongkir dibayar penuh
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Batas Waktu Bayar (Jam)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={formPembayaran.batas_bayar_jam}
                  onChange={(e) =>
                    setFormPembayaran({
                      ...formPembayaran,
                      batas_bayar_jam: Number(e.target.value),
                    })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Batas waktu pembayaran sebelum pesanan kedaluwarsa
                </span>
              </div>
            </div>

            <div className="pt-5 border-t border-[#e8dfc8]">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#dcd3c1] mb-5">
                <div>
                  <h4 className="text-xs font-bold text-[#1d3b2e]">
                    Aktifkan transfer manual dengan bukti
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Jika diaktifkan, nomor rekening toko dan unggah bukti transfer akan tampil pada tiket pembayaran pelanggan.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={formPembayaran.transfer_manual_aktif}
                    onChange={(e) =>
                      setFormPembayaran({
                        ...formPembayaran,
                        transfer_manual_aktif: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ba2b2b]"></div>
                </label>
              </div>

              <div
                className={`transition-all duration-200 ${
                  formPembayaran.transfer_manual_aktif
                    ? "opacity-100"
                    : "opacity-40 pointer-events-none select-none"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-[#1d3b2e]">
                    Rekening Bank & QRIS Manual
                  </h4>
                  {!formPembayaran.transfer_manual_aktif && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-600">
                      Dinonaktifkan
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Informasi di bawah ini digunakan ketika pelanggan memilih metode transfer manual dengan bukti.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: BCA / Mandiri / BRI"
                      value={formPembayaran.nama_bank}
                      onChange={(e) =>
                        setFormPembayaran({ ...formPembayaran, nama_bank: e.target.value })
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
                      value={formPembayaran.no_rekening}
                      onChange={(e) =>
                        setFormPembayaran({
                          ...formPembayaran,
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
                      value={formPembayaran.atas_nama}
                      onChange={(e) =>
                        setFormPembayaran({ ...formPembayaran, atas_nama: e.target.value })
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
                        Gambar Barcode QRIS Manual
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
            </div>

            <div className="pt-4 border-t border-[#e8dfc8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                {adaPerubahanPembayaran ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <i className="fa-solid fa-circle-exclamation text-xs"></i>
                    <span>Ada perubahan yang belum disimpan</span>
                  </span>
                ) : (
                  <span className="text-stone-400 font-medium">
                    Semua perubahan telah tersimpan
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={sedangSimpanPembayaran || !adaPerubahanPembayaran}
                className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <i className="fa-solid fa-floppy-disk text-xs"></i>
                <span>{sedangSimpanPembayaran ? "Menyimpan..." : "Simpan Pengaturan Pembayaran"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {tabAktif === "ongkir" && (
        <div className="space-y-6">
          <div className="content-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#e8dfc8]">
              <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                <i className="fa-solid fa-location-crosshairs"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Lokasi Toko & Parameter Jarak Pengiriman
                </h3>
                <p className="text-xs text-stone-500">
                  Titik koordinat toko sebagai titik awal rute, faktor kelokan jalan, serta radius batas maksimal kirim.
                </p>
              </div>
            </div>

            {errorOngkir.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {errorOngkir.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={simpanOngkir} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Pin Lokasi Toko pada Peta
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Geser pin toko atau klik peta untuk menetapkan koordinat outlet Anda.
                </p>
                <PetaLokasi
                  posisiToko={{
                    lat: Number(formOngkir.lat_toko),
                    lng: Number(formOngkir.lng_toko),
                  }}
                  mode="toko"
                  onUbahToko={(lat, lng) =>
                    setFormOngkir((prev) => ({
                      ...prev,
                      lat_toko: Number(lat.toFixed(6)),
                      lng_toko: Number(lng.toFixed(6)),
                    }))
                  }
                  tinggi="320px"
                  bisaDipilih={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Latitude Toko
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formOngkir.lat_toko}
                    onChange={(e) =>
                      setFormOngkir({ ...formOngkir, lat_toko: Number(e.target.value) })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Longitude Toko
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formOngkir.lng_toko}
                    onChange={(e) =>
                      setFormOngkir({ ...formOngkir, lng_toko: Number(e.target.value) })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Faktor Kelokan Jalan
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    required
                    value={formOngkir.faktor_jalan}
                    onChange={(e) =>
                      setFormOngkir({
                        ...formOngkir,
                        faktor_jalan: Number(e.target.value),
                      })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Standar: 1.3 (jarak rute perkiraan jalan ≈ jarak lurus × 1.3)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Maks. Jarak Kirim (km)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formOngkir.maks_jarak_kirim_km}
                    onChange={(e) =>
                      setFormOngkir({
                        ...formOngkir,
                        maks_jarak_kirim_km: Number(e.target.value),
                      })
                    }
                    className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Jarak lebih jauh dari ini ditolak oleh sistem pengiriman
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e8dfc8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  {adaPerubahanOngkir ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <i className="fa-solid fa-circle-exclamation text-xs"></i>
                      <span>Ada perubahan yang belum disimpan</span>
                    </span>
                  ) : (
                    <span className="text-stone-400 font-medium">
                      Semua perubahan telah tersimpan
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sedangSimpanOngkir || !adaPerubahanOngkir}
                  className="h-[42px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <i className="fa-solid fa-floppy-disk text-xs"></i>
                  <span>{sedangSimpanOngkir ? "Menyimpan..." : "Simpan Lokasi & Parameter"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="content-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8dfc8]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d3b2e]">
                    Tabel Tarif Ongkir Berundak (Tiered Rate)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Sistem mencocokkan jarak pengiriman ke tier terkecil yang memuat jarak tersebut.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={bukaModalTambahTarifJarak}
                className="h-[42px] px-4 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5 self-start sm:self-center"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Tambah Tier</span>
              </button>
            </div>

            {daftarTarifJarak.length === 0 ? (
              <div className="py-10 text-center text-stone-400">
                <i className="fa-solid fa-truck-ramp-box text-3xl mb-2 block text-stone-300"></i>
                <p className="text-sm font-bold text-[#1d3b2e]">Belum ada tier tarif jarak.</p>
                <p className="text-xs text-stone-500 mt-1">Tambahkan minimal satu tier agar opsi pengiriman dapat dihitung.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-xs font-bold border-y border-[#dfd4bd]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Batas Jarak Maksimal</th>
                      <th className="py-3 px-4">Tarif Ongkir</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right rounded-r-xl w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ede2cd]">
                    {daftarTarifJarak.map((tier) => (
                      <tr key={tier.id} className="hover:bg-black/[0.02] transition">
                        <td className="py-3.5 px-4 font-bold text-[#1d3b2e]">
                          Hingga {tier.jarak_maks_km} km
                        </td>
                        <td className="py-3.5 px-4 font-black text-[#1d3b2e]">
                          {formatRupiah(tier.tarif)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              tier.aktif
                                ? "bg-[#d8e3cf] text-[#215934] border border-[#bad1ab]"
                                : "bg-stone-200 text-stone-600 border border-stone-300"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                tier.aktif ? "bg-[#215934]" : "bg-stone-500"
                              }`}
                            ></span>
                            <span>{tier.aktif ? "Aktif" : "Nonaktif"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => bukaModalEditTarifJarak(tier)}
                              className="w-8 h-8 rounded-lg border border-[#dcd3c1] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] inline-flex items-center justify-center transition cursor-pointer"
                              title="Edit Tier"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => hapusTarifJarak(tier)}
                              className="w-8 h-8 rounded-lg border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
                              title="Hapus Tier"
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

            <div className="mt-6 p-4 rounded-2xl bg-[#ede2cd]/40 border border-[#dfd4bd] space-y-3">
              <h4 className="text-xs font-bold text-[#1d3b2e] flex items-center gap-1.5">
                <i className="fa-solid fa-calculator text-[#ba2b2b]"></i>
                <span>Simulasi Perhitungan Ongkir</span>
              </h4>

              <form onSubmit={jalankanSimulasiOngkir} className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-600 font-semibold">Coba jarak:</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Contoh: 7.5"
                      value={simulasiJarak}
                      onChange={(e) => setSimulasiJarak(e.target.value)}
                      className="w-32 h-[38px] px-3 pr-8 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e]"
                    />
                    <span className="absolute right-2.5 top-2.5 text-[11px] text-stone-400 font-bold pointer-events-none">
                      km
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-[38px] px-4 rounded-xl font-bold bg-[#1d3b2e] hover:bg-[#142820] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                  <span>Hitung Ongkir</span>
                </button>
              </form>

              {hasilSimulasi && (
                <div className="pt-2">
                  {hasilSimulasi.error ? (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      {hasilSimulasi.error}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                      <span>
                        Jarak <b>{hasilSimulasi.jarak} km</b> masuk ke tier batas <b>{hasilSimulasi.tierMaks} km</b>
                      </span>
                      <span className="text-sm font-black text-emerald-900">
                        {formatRupiah(hasilSimulasi.ongkir)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="content-card overflow-hidden">
            <button
              type="button"
              onClick={() => setZonaLamaBuka(!zonaLamaBuka)}
              className="w-full p-6 sm:p-8 flex items-center justify-between text-left cursor-pointer hover:bg-black/[0.01] transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-lg">
                  <i className="fa-solid fa-truck-fast"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d3b2e]">
                    Zona lama (hanya untuk /pesan versi lama)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Daftar zona manual untuk kompatibilitas form pemesanan 3D lama pada rute /pesan.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stone-500">
                  {zonaLamaBuka ? "Tutup" : "Buka"}
                </span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-stone-400 transition-transform duration-200 ${
                    zonaLamaBuka ? "rotate-180" : ""
                  }`}
                ></i>
              </div>
            </button>

            {zonaLamaBuka && (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-[#e8dfc8] space-y-4">
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-stone-500">
                    Kelola nama dan tarif zona manual lama.
                  </p>
                  <button
                    type="button"
                    onClick={bukaModalTambahZona}
                    className="h-[38px] px-3.5 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Tambah Zona Lama</span>
                  </button>
                </div>

                {daftarZona.length === 0 ? (
                  <div className="py-8 text-center text-stone-400">
                    <i className="fa-solid fa-truck-ramp-box text-2xl mb-1.5 block text-stone-300"></i>
                    <p className="text-xs font-bold text-[#1d3b2e]">Belum ada zona ongkir pengiriman lama.</p>
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
          </div>
        </div>
      )}

      {modalTarifJarakBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fcfbf7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ede2cd] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede2cd]">
              <h3 className="font-extrabold text-[#1d3b2e] text-base">
                {editTarifJarakId ? "Edit Tier Tarif Jarak" : "Tambah Tier Tarif Jarak"}
              </h3>
              <button
                type="button"
                onClick={() => setModalTarifJarakBuka(false)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {errorTarifJarak.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorTarifJarak[0]}
              </div>
            )}

            <form onSubmit={simpanTarifJarak} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Batas Jarak Maksimal (km)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  placeholder="Contoh: 5"
                  value={formTarifJarak.jarak_maks_km}
                  onChange={(e) =>
                    setFormTarifJarak({ ...formTarifJarak, jarak_maks_km: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Tarif Ongkir (Rp)
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  required
                  placeholder="Contoh: 15000"
                  value={formTarifJarak.tarif}
                  onChange={(e) =>
                    setFormTarifJarak({ ...formTarifJarak, tarif: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#ede2cd]/60 border border-[#dfd4bd]">
                <span className="text-xs font-bold text-[#1d3b2e]">Status Tier Aktif</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formTarifJarak.aktif}
                    onChange={(e) =>
                      setFormTarifJarak({ ...formTarifJarak, aktif: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ba2b2b]"></div>
                </label>
              </div>

              <div className="pt-3 border-t border-[#ede2cd] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalTarifJarakBuka(false)}
                  className="h-[40px] px-4 rounded-xl font-bold bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesTarifJarak}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {sedangProsesTarifJarak ? "Menyimpan..." : "Simpan Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalZonaBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fcfbf7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ede2cd] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede2cd]">
              <h3 className="font-extrabold text-[#1d3b2e] text-base">
                {editZonaId ? "Edit Zona Ongkir Lama" : "Tambah Zona Ongkir Lama"}
              </h3>
              <button
                type="button"
                onClick={() => setModalZonaBuka(false)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {errorZona.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorZona[0]}
              </div>
            )}

            <form onSubmit={simpanZona} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Nama Zona
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bandung Kota / Coblong"
                  value={formZona.nama}
                  onChange={(e) =>
                    setFormZona({ ...formZona, nama: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Tarif Ongkir (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  placeholder="Contoh: 15000"
                  value={formZona.tarif}
                  onChange={(e) =>
                    setFormZona({ ...formZona, tarif: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#ede2cd]/60 border border-[#dfd4bd]">
                <span className="text-xs font-bold text-[#1d3b2e]">Status Aktif</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formZona.aktif}
                    onChange={(e) =>
                      setFormZona({ ...formZona, aktif: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ba2b2b]"></div>
                </label>
              </div>

              <div className="pt-3 border-t border-[#ede2cd] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalZonaBuka(false)}
                  className="h-[40px] px-4 rounded-xl font-bold bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesZona}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {sedangProsesZona ? "Menyimpan..." : "Simpan Zona"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalTanggalBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fcfbf7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ede2cd] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede2cd]">
              <h3 className="font-extrabold text-[#1d3b2e] text-base">
                Tambah Hari Libur Toko
              </h3>
              <button
                type="button"
                onClick={() => setModalTanggalBuka(false)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {errorTanggal.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorTanggal[0]}
              </div>
            )}

            <form onSubmit={simpanTanggalTutup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Tanggal Libur
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formTanggal.tanggal}
                  onChange={(e) =>
                    setFormTanggal({ ...formTanggal, tanggal: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                  Alasan Libur / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Hari Raya Idulfitri / Renovasi"
                  value={formTanggal.alasan}
                  onChange={(e) =>
                    setFormTanggal({ ...formTanggal, alasan: e.target.value })
                  }
                  className="w-full h-[42px] px-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                />
              </div>

              <div className="pt-3 border-t border-[#ede2cd] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalTanggalBuka(false)}
                  className="h-[40px] px-4 rounded-xl font-bold bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProsesTanggal}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {sedangProsesTanggal ? "Menyimpan..." : "Simpan Hari Libur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMounted && (
        <ModalPesan
          terbuka={notifikasi.terbuka}
          judul={notifikasi.judul}
          pesan={notifikasi.pesan}
          tipe={notifikasi.tipe}
          onTutup={() =>
            setNotifikasi((prev) => ({ ...prev, terbuka: false }))
          }
        />
      )}
    </div>
  );
}
