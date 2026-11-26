"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah } from "@/lib/format";
import {
  JENIS_KUE_STUDIO,
  ambilKonfigurasiJenisKue,
  ambilGrupUntukJenisKue,
} from "@/lib/opsiStudio";
import {
  isGrupPengaliUkuran,
  getFaktorPengaliUkuran,
  formatFaktorPengali,
} from "@/lib/resepKalkulator";
import ModalPesan from "@/components/ModalPesan";
import GambarProduk from "@/components/GambarProduk";

export default function KatalogOpsiPage() {
  const router = useRouter();
  const [profil, setProfil] = useState(null);
  const [tabAktif, setTabAktif] = useState("custom");
  const [jenisKueDipilih, setJenisKueDipilih] = useState("cake");
  const [langkahDipilih, setLangkahDipilih] = useState("semua");

  const [daftarGrup, setDaftarGrup] = useState([]);
  const [daftarItem, setDaftarItem] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangSimpanId, setSedangSimpanId] = useState(null);
  const [grupTerbukaMap, setGrupTerbukaMap] = useState({});

  const [editItemId, setEditItemId] = useState(null);
  const [inputHarga, setInputHarga] = useState("");

  const [modalResepBuka, setModalResepBuka] = useState(false);
  const [itemResepAktif, setItemResepAktif] = useState(null);
  const [daftarBahan, setDaftarBahan] = useState([]);
  const [barisResep, setBarisResep] = useState([]);
  const [jumlahResepMap, setJumlahResepMap] = useState({});
  const [sedangMemuatResep, setSedangMemuatResep] = useState(false);
  const [sedangSimpanResep, setSedangSimpanResep] = useState(false);

  const [daftarProduk, setDaftarProduk] = useState([]);
  const [daftarKategori, setDaftarKategori] = useState([]);
  const [sedangMemuatProduk, setSedangMemuatProduk] = useState(false);
  const [modalProdukBuka, setModalProdukBuka] = useState(false);
  const [modalKategoriBuka, setModalKategoriBuka] = useState(false);
  const [kategoriBaruNama, setKategoriBaruNama] = useState("");
  const [editKategoriId, setEditKategoriId] = useState(null);
  const [editKategoriNama, setEditKategoriNama] = useState("");
  const [editKategoriAktif, setEditKategoriAktif] = useState(true);
  const [sedangSimpanKategori, setSedangSimpanKategori] = useState(false);
  const [editProdukId, setEditProdukId] = useState(null);
  const [formProduk, setFormProduk] = useState({
    nama: "",
    id_kategori: "",
    deskripsi: "",
    label_teks: "",
    harga: "",
    aktif: true,
    unggulan: false,
  });
  const [fileFotoProduk, setFileFotoProduk] = useState(null);
  const [previewFotoProduk, setPreviewFotoProduk] = useState(null);
  const [sedangSimpanProduk, setSedangSimpanProduk] = useState(false);
  const [brokenImgMap, setBrokenImgMap] = useState({});

  const [modalHapusBuka, setModalHapusBuka] = useState(false);
  const [idHapusProduk, setIdHapusProduk] = useState(null);
  const [namaHapusProduk, setNamaHapusProduk] = useState("");
  const [sedangHapusProduk, setSedangHapusProduk] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: prof } = await supabase
        .from("profil")
        .select("role, nama")
        .eq("id", user.id)
        .single();
      if (prof) {
        if (prof.role === "staf") {
          router.replace("/dashboard");
          return;
        }
        setProfil(prof);
      }
    }

    const { data: grupList, error: errGrup } = await supabase
      .from("grup_opsi")
      .select("*")
      .order("urutan", { ascending: true });

    const { data: itemList, error: errItem } = await supabase
      .from("opsi_item")
      .select("*")
      .order("urutan", { ascending: true });

    const { data: resepList } = await supabase
      .from("resep_item")
      .select("id_item");

    if (!errGrup && grupList) {
      setDaftarGrup(grupList);
    }
    if (!errItem && itemList) {
      const grupJenis = (grupList || []).find(
        (g) => g.peran_dashboard === "jenis" || (g.nama || "").toLowerCase() === "jenis kue"
      );
      if (grupJenis) {
        const itemJenis = itemList.filter((it) => it.id_grup === grupJenis.id);
        const perluSinkron =
          itemJenis.length < 5 ||
          itemJenis.some(
            (it) =>
              it.kode_visual === "template" ||
              it.kode_visual === "custom" ||
              (it.nama || "").toLowerCase().includes("template")
          );
        if (perluSinkron) {
          try {
            const resSync = await fetch("/api/opsi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ aksi: "sinkron_jenis_kue", id_grup: grupJenis.id }),
            });
            if (resSync.ok) {
              const { data: refreshedItems } = await supabase
                .from("opsi_item")
                .select("*")
                .order("urutan", { ascending: true });
              if (refreshedItems) {
                setDaftarItem(refreshedItems);
                setSedangMemuat(false);
                return;
              }
            }
          } catch {}
        }
      }
      setDaftarItem(itemList);
    }
    if (resepList) {
      const hitungMap = {};
      for (let i = 0; i < resepList.length; i++) {
        const idIt = resepList[i].id_item;
        hitungMap[idIt] = (hitungMap[idIt] || 0) + 1;
      }
      setJumlahResepMap(hitungMap);
    }
    setSedangMemuat(false);
  }

  async function muatProduk() {
    setSedangMemuatProduk(true);
    try {
      const res = await fetch("/api/produk");
      const json = await res.json();
      if (res.ok && json.data) {
        setDaftarProduk(json.data);
      }
    } catch {}
    setSedangMemuatProduk(false);
  }

  async function muatKategori() {
    try {
      const res = await fetch("/api/kategori-produk?semua=1");
      const json = await res.json();
      if (res.ok && json.data) {
        setDaftarKategori(json.data);
      }
    } catch {}
  }

  useEffect(() => {
    muatData();
    muatProduk();
    muatKategori();
  }, []);

  const konfigJenisAktif = ambilKonfigurasiJenisKue(jenisKueDipilih);
  const grupTerpetakan = ambilGrupUntukJenisKue(daftarGrup, jenisKueDipilih);
  const grupDitampilkan =
    langkahDipilih === "semua"
      ? grupTerpetakan
      : grupTerpetakan.filter((entry) => entry.langkah.kunci === langkahDipilih);

  function toggleGrupBuka(grupId) {
    setGrupTerbukaMap((prev) => ({
      ...prev,
      [grupId]: prev[grupId] === false ? true : false,
    }));
  }

  const apakahSemuaTutup =
    grupDitampilkan.length > 0 &&
    grupDitampilkan.every((entry) => grupTerbukaMap[entry.grup.id] === false);

  function toggleSemuaGrup() {
    const nextVal = apakahSemuaTutup ? true : false;
    const newMap = { ...grupTerbukaMap };
    for (let i = 0; i < grupDitampilkan.length; i++) {
      newMap[grupDitampilkan[i].grup.id] = nextVal;
    }
    setGrupTerbukaMap(newMap);
  }

  function pilihJenisKue(kode) {
    setJenisKueDipilih(kode);
    setLangkahDipilih("semua");
    setEditItemId(null);
    setInputHarga("");
  }

  function hitungJumlahItemLangkah(langkah) {
    if (langkah.otomatis) return 0;
    let total = 0;
    for (let i = 0; i < grupTerpetakan.length; i++) {
      if (grupTerpetakan[i].langkah.kunci === langkah.kunci) {
        const gId = grupTerpetakan[i].grup.id;
        for (let j = 0; j < daftarItem.length; j++) {
          if (daftarItem[j].id_grup === gId && daftarItem[j].aktif !== false) {
            total += 1;
          }
        }
      }
    }
    return total;
  }

  function formatInputRibuan(val) {
    const digits = String(val ?? "").replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("id-ID");
  }

  function parseInputRibuan(val) {
    const digits = String(val ?? "").replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  }

  function mulaiEditHarga(item) {
    setEditItemId(item.id);
    setInputHarga(formatInputRibuan(item.harga ?? 0));
  }

  function batalEditHarga() {
    setEditItemId(null);
    setInputHarga("");
  }

  async function simpanHarga(itemId) {
    const hargaAngka = parseInputRibuan(inputHarga);
    if (isNaN(hargaAngka) || hargaAngka < 0) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Harga harus berupa angka dan minimal 0.",
        tipe: "error",
      });
      return;
    }

    setSedangSimpanId(itemId);
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "ubah_harga",
        id: itemId,
        harga: Math.round(hargaAngka),
      }),
    });

    const hasil = await res.json();
    setSedangSimpanId(null);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal mengubah harga item.",
        tipe: "error",
      });
      return;
    }

    setDaftarItem((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, harga: Math.round(hargaAngka) } : it
      )
    );
    setEditItemId(null);
    setInputHarga("");

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
  }

  async function bukaModalResep(item, grup) {
    setItemResepAktif({
      ...item,
      _grupNama: grup?.nama || "",
      _peranVisual: grup?.peran_visual || "",
    });
    setModalResepBuka(true);
    setSedangMemuatResep(true);

    try {
      const res = await fetch(`/api/opsi/resep?id_item=${item.id}`);
      const data = await res.json();
      if (res.ok) {
        setDaftarBahan(data.bahan || []);
        const formatBaris = (data.resep || []).map((r) => ({
          id_bahan: r.id_bahan,
          jumlah: r.jumlah,
        }));
        setBarisResep(formatBaris);
      }
    } catch {
      setBarisResep([]);
    } finally {
      setSedangMemuatResep(false);
    }
  }

  function tambahBarisResep() {
    setBarisResep((prev) => [...prev, { id_bahan: "", jumlah: "" }]);
  }

  function ubahBarisResep(idx, field, val) {
    setBarisResep((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: val } : b))
    );
  }

  function hapusBarisResep(idx) {
    setBarisResep((prev) => prev.filter((_, i) => i !== idx));
  }

  async function simpanResep() {
    if (!itemResepAktif) return;
    setSedangSimpanResep(true);

    const formatKirim = barisResep
      .filter((b) => b.id_bahan && Number(b.jumlah) > 0)
      .map((b) => ({
        id_bahan: Number(b.id_bahan),
        jumlah: Number(b.jumlah),
      }));

    const res = await fetch("/api/opsi/resep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_item: itemResepAktif.id,
        resep: formatKirim,
      }),
    });

    const hasil = await res.json();
    setSedangSimpanResep(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: hasil.pesan || "Gagal menyimpan resep bahan.",
        tipe: "error",
      });
      return;
    }

    const idItemTersimpan = itemResepAktif.id;
    setJumlahResepMap((prev) => ({
      ...prev,
      [idItemTersimpan]: formatKirim.length,
    }));
    setModalResepBuka(false);
    setItemResepAktif(null);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
  }

  function renderVisualItem(item, peranGrup) {
    if (peranGrup === "badan" || peranGrup === "krim") {
      return (
        <div className="flex items-center space-x-2">
          {item.warna && (
            <span
              className="w-5 h-5 rounded-full border border-stone-300 shadow-xs inline-block flex-shrink-0"
              style={{ backgroundColor: item.warna }}
            />
          )}
          <span className="text-xs font-mono font-bold text-stone-700">
            {item.kode_visual || item.warna || "-"}
          </span>
        </div>
      );
    }

    if (item.kode_visual) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#e8f0fe] text-[#1e40af] border border-[#bfdbfe]">
          {item.kode_visual}
        </span>
      );
    }

    return <span className="text-stone-400 text-xs font-medium">-</span>;
  }

  function bukaModalTambahProduk() {
    setEditProdukId(null);
    setFormProduk({
      nama: "",
      id_kategori: daftarKategori[0]?.id ? String(daftarKategori[0].id) : "",
      deskripsi: "",
      label_teks: "",
      harga: "",
      aktif: true,
      unggulan: false,
    });
    setFileFotoProduk(null);
    setPreviewFotoProduk(null);
    setModalProdukBuka(true);
  }

  function bukaModalEditProduk(prod) {
    setEditProdukId(prod.id);
    setFormProduk({
      nama: prod.nama || "",
      id_kategori: prod.id_kategori ? String(prod.id_kategori) : "",
      deskripsi: prod.deskripsi || "",
      label_teks: prod.label_teks || "",
      harga: prod.harga !== undefined && prod.harga !== null ? formatInputRibuan(prod.harga) : "",
      aktif: prod.aktif !== false,
      unggulan: Boolean(prod.unggulan),
    });
    setFileFotoProduk(null);
    setPreviewFotoProduk(prod.fotoUrl || null);
    setModalProdukBuka(true);
  }

  function handlePilihFotoProduk(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Format file harus gambar (JPG atau PNG).",
        tipe: "error",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Ukuran gambar tidak boleh melebihi 2 MB.",
        tipe: "error",
      });
      return;
    }

    setFileFotoProduk(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewFotoProduk(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSimpanProduk(e) {
    e.preventDefault();
    if (!formProduk.nama.trim()) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Nama produk wajib diisi.",
        tipe: "error",
      });
      return;
    }

    if (formProduk.label_teks && formProduk.label_teks.length > 24) {
      setNotifikasi({
        terbuka: true,
        judul: "Peringatan",
        pesan: "Label teks maksimal 24 karakter.",
        tipe: "error",
      });
      return;
    }

    setSedangSimpanProduk(true);
    const fd = new FormData();
    if (editProdukId) {
      fd.append("id", editProdukId);
    }
    fd.append("nama", formProduk.nama);
    fd.append("deskripsi", formProduk.deskripsi);
    fd.append("harga", String(parseInputRibuan(formProduk.harga)));
    fd.append("aktif", formProduk.aktif ? "true" : "false");
    fd.append("id_kategori", formProduk.id_kategori || "");
    fd.append("label_teks", formProduk.label_teks || "");
    fd.append("unggulan", formProduk.unggulan ? "true" : "false");

    if (fileFotoProduk) {
      fd.append("foto", fileFotoProduk);
    }

    try {
      const res = await fetch("/api/produk", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      setSedangSimpanProduk(false);

      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal",
          pesan: json.pesan || "Gagal menyimpan produk.",
          tipe: "error",
        });
        return;
      }

      setModalProdukBuka(false);
      muatProduk();
      setNotifikasi({
        terbuka: true,
        judul: "Berhasil",
        pesan: json.pesan,
        tipe: "sukses",
      });
    } catch {
      setSedangSimpanProduk(false);
      setNotifikasi({
        terbuka: true,
        judul: "Error",
        pesan: "Terjadi gangguan koneksi saat menyimpan produk.",
        tipe: "error",
      });
    }
  }

  function konfirmasiHapusProduk(prod) {
    setIdHapusProduk(prod.id);
    setNamaHapusProduk(prod.nama);
    setModalHapusBuka(true);
  }

  async function eksekusiHapusProduk() {
    if (!idHapusProduk) return;
    setSedangHapusProduk(true);

    try {
      const res = await fetch("/api/produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "hapus", id: idHapusProduk }),
      });
      const json = await res.json();
      setSedangHapusProduk(false);
      setModalHapusBuka(false);

      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal",
          pesan: json.pesan || "Gagal menghapus produk.",
          tipe: "error",
        });
        return;
      }

      muatProduk();
      setNotifikasi({
        terbuka: true,
        judul: "Berhasil",
        pesan: json.pesan,
        tipe: "sukses",
      });
    } catch {
      setSedangHapusProduk(false);
      setModalHapusBuka(false);
      setNotifikasi({
        terbuka: true,
        judul: "Error",
        pesan: "Terjadi kesalahan saat menghapus produk.",
        tipe: "error",
      });
    }
  }

  async function handleTambahKategori(e) {
    e.preventDefault();
    if (!kategoriBaruNama.trim()) return;
    setSedangSimpanKategori(true);
    try {
      const res = await fetch("/api/kategori-produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aksi: "tambah",
          nama: kategoriBaruNama.trim(),
        }),
      });
      const json = await res.json();
      setSedangSimpanKategori(false);
      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal",
          pesan: json.pesan || "Gagal menambah kategori.",
          tipe: "error",
        });
        return;
      }
      setKategoriBaruNama("");
      muatKategori();
    } catch {
      setSedangSimpanKategori(false);
    }
  }

  async function handleUbahKategori(id, nama, aktif) {
    setSedangSimpanKategori(true);
    try {
      const res = await fetch("/api/kategori-produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "ubah", id, nama, aktif }),
      });
      const json = await res.json();
      setSedangSimpanKategori(false);
      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Gagal",
          pesan: json.pesan || "Gagal mengubah kategori.",
          tipe: "error",
        });
        return;
      }
      setEditKategoriId(null);
      muatKategori();
      muatProduk();
    } catch {
      setSedangSimpanKategori(false);
    }
  }

  async function handleHapusKategori(id) {
    setSedangSimpanKategori(true);
    try {
      const res = await fetch("/api/kategori-produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "hapus", id }),
      });
      const json = await res.json();
      setSedangSimpanKategori(false);
      if (!res.ok) {
        setNotifikasi({
          terbuka: true,
          judul: "Peringatan",
          pesan: json.pesan || "Gagal menghapus kategori.",
          tipe: "error",
        });
        return;
      }
      muatKategori();
      muatProduk();
    } catch {
      setSedangSimpanKategori(false);
    }
  }

  const totalUnggulan = daftarProduk.filter((p) => p.unggulan).length;
  const isCurrentUnggulan = editProdukId
    ? Boolean(daftarProduk.find((p) => p.id === editProdukId)?.unggulan)
    : false;
  const batasUnggulanTercapai = totalUnggulan >= 4 && !isCurrentUnggulan;

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Kelola Harga & Katalog Kue
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur opsi kustomisasi studio kue dan produk kue katalog siap pesan.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <div className="inline-flex p-1 bg-[#ede2cd] border border-[#dfd4bd] rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setTabAktif("custom")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center space-x-1.5 whitespace-nowrap ${
                tabAktif === "custom"
                  ? "bg-[#17382d] text-white shadow-2xs"
                  : "text-[#1d3b2e] hover:bg-stone-50/50"
              }`}
            >
              <i className="fa-solid fa-cake-candles" />
              <span>Opsi Custom</span>
            </button>
            <button
              type="button"
              onClick={() => setTabAktif("katalog")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center space-x-1.5 whitespace-nowrap ${
                tabAktif === "katalog"
                  ? "bg-[#17382d] text-white shadow-2xs"
                  : "text-[#1d3b2e] hover:bg-stone-50/50"
              }`}
            >
              <i className="fa-solid fa-store" />
              <span>Kue Katalog</span>
            </button>
          </div>

          {tabAktif === "custom" && daftarGrup.length > 0 && (
            <button
              type="button"
              onClick={toggleSemuaGrup}
              className="h-[40px] px-4 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-xs whitespace-nowrap shrink-0"
            >
              <i className={`fa-solid ${apakahSemuaTutup ? "fa-angles-down" : "fa-angles-up"} text-xs`} />
              <span>{apakahSemuaTutup ? "Buka Semua" : "Tutup Semua"}</span>
            </button>
          )}

          {tabAktif === "katalog" && (
            <button
              type="button"
              onClick={bukaModalTambahProduk}
              className="h-[40px] px-4 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold text-xs transition cursor-pointer inline-flex items-center space-x-1.5 shadow-xs whitespace-nowrap shrink-0"
            >
              <i className="fa-solid fa-plus text-xs" />
              <span>Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

      {tabAktif === "custom" ? (
        sedangMemuat ? (
          <div className="content-card p-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500" />
            <p className="text-sm font-medium">Memuat katalog harga opsi...</p>
          </div>
        ) : daftarGrup.length === 0 ? (
          <div className="content-card p-12 text-center text-stone-400">
            <i className="fa-solid fa-layer-group text-4xl mb-3 text-stone-300" />
            <p className="text-base font-semibold text-stone-700">Belum ada grup opsi.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="content-card p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1d3b2e]">
                    Progres Bar Opsi per Jenis Kue
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Pilih jenis kue untuk mengatur harga dan resep sesuai urutan tahap kustomisasi di halaman /pesan.
                  </p>
                </div>
                {langkahDipilih !== "semua" && (
                  <button
                    type="button"
                    onClick={() => setLangkahDipilih("semua")}
                    className="h-8 px-3 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer inline-flex items-center space-x-1.5 self-start md:self-auto"
                  >
                    <i className="fa-solid fa-list-ul text-[11px]" />
                    <span>Tampilkan Semua Tahap</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {JENIS_KUE_STUDIO.map((jk) => {
                  const aktif = jenisKueDipilih === jk.kode;
                  return (
                    <button
                      key={jk.kode}
                      type="button"
                      onClick={() => pilihJenisKue(jk.kode)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                        aktif
                          ? "bg-[#17382d] text-white border-[#17382d] shadow-xs"
                          : "bg-[#fbf8f1] text-[#1d3b2e] border-[#e4dac5] hover:border-[#17382d]/40 hover:bg-[#f6efe0]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                          aktif
                            ? "bg-white/15 text-amber-200"
                            : "bg-[#ede2cd] text-[#1d3b2e]"
                        }`}
                      >
                        <i className={jk.ikon} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{jk.nama}</div>
                        <div
                          className={`text-[11px] font-medium ${
                            aktif ? "text-emerald-100/90" : "text-stone-500"
                          }`}
                        >
                          {jk.langkah.length} Tahap
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#e8dfc8]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Alur Langkah {konfigJenisAktif.nama}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    Klik tahap untuk menyaring grup opsi
                  </span>
                </div>
                <div className="overflow-x-auto pb-1">
                  <div className="flex items-center min-w-max gap-1.5">
                    {konfigJenisAktif.langkah.map((stepItem, idx) => {
                      const sedangDipilih = langkahDipilih === stepItem.kunci;
                      const jmlItem = hitungJumlahItemLangkah(stepItem);
                      return (
                        <div key={stepItem.kunci} className="flex items-center">
                          <button
                            type="button"
                            onClick={() =>
                              setLangkahDipilih(sedangDipilih ? "semua" : stepItem.kunci)
                            }
                            className={`px-3 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 ${
                              sedangDipilih
                                ? "bg-[#17382d] text-white border-[#17382d] shadow-xs"
                                : stepItem.otomatis
                                ? "bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100/70"
                                : "bg-white text-[#1d3b2e] border-[#dfd4bd] hover:bg-[#fbf8f1]"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                sedangDipilih
                                  ? "bg-white text-[#17382d]"
                                  : stepItem.otomatis
                                  ? "bg-amber-200/80 text-amber-950"
                                  : "bg-[#ede2cd] text-[#1d3b2e]"
                              }`}
                            >
                              {stepItem.nomor}
                            </span>
                            <div className="text-left leading-tight">
                              <div className="text-xs font-bold whitespace-nowrap">
                                {stepItem.label}
                              </div>
                              <div
                                className={`text-[10px] ${
                                  sedangDipilih
                                    ? "text-emerald-100/90"
                                    : stepItem.otomatis
                                    ? "text-amber-700"
                                    : "text-stone-400"
                                }`}
                              >
                                {stepItem.otomatis ? "Otomatis" : `${jmlItem} opsi`}
                              </div>
                            </div>
                          </button>
                          {idx < konfigJenisAktif.langkah.length - 1 && (
                            <i className="fa-solid fa-chevron-right text-[10px] text-stone-400 mx-1.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {grupDitampilkan.map(({ grup, langkah }) => {
              const itemGrup = daftarItem.filter(
                (it) => it.id_grup === grup.id && it.aktif !== false
              );
              const isBuka = grupTerbukaMap[grup.id] !== false;
              const isGrupJenis =
                grup.peran_dashboard === "jenis" ||
                (grup.nama || "").trim().toLowerCase() === "jenis kue";

              return (
                <div
                  key={`${jenisKueDipilih}-${grup.id}`}
                  className={`content-card transition-all duration-200 ${
                    isBuka ? "p-6 space-y-4" : "p-5"
                  }`}
                >
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      isBuka ? "pb-3 border-b border-[#e8dfc8]" : ""
                    }`}
                  >
                    <div
                      onClick={() => toggleGrupBuka(grup.id)}
                      className="space-y-1.5 cursor-pointer select-none flex-1 group"
                    >
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <div className="w-8 h-8 rounded-xl bg-[#17382d] text-white flex items-center justify-center text-xs font-bold shadow-xs transition group-hover:scale-105">
                          {langkah.nomor}
                        </div>
                        <h3 className="text-base font-bold text-[#1d3b2e] flex items-center gap-2 flex-wrap">
                          <span>{grup.nama}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ede2cd] text-stone-700 border border-[#dfd4bd]">
                            {itemGrup.length} item
                          </span>
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#17382d]/10 text-[#17382d] border border-[#17382d]/20">
                          Tahap {langkah.nomor}: {langkah.label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold border ${
                            grup.wajib
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-[#ede2cd] text-[#1d3b2e] border-[#dfd4bd]"
                          }`}
                        >
                          {grup.wajib ? "Wajib Dipilih" : "Opsional"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          {grup.jenis_pilihan === "satu" ? "Pilih Satu" : "Pilih Banyak"}
                        </span>
                        {isGrupJenis ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Harga Dasar Jenis Kue
                          </span>
                        ) : grup.peran_visual === "ukuran" ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            Tambahan Ukuran / Porsi (Rp 0 = Termasuk)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleGrupBuka(grup.id)}
                        className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center transition cursor-pointer"
                        title={isBuka ? "Tutup Grup" : "Buka Grup"}
                      >
                        <i
                          className={`fa-solid ${
                            isBuka ? "fa-chevron-up" : "fa-chevron-down"
                          } text-xs transition-transform duration-200`}
                        />
                      </button>
                    </div>
                  </div>

                  {isBuka && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-[11px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3 rounded-l-xl w-12 text-center">Urutan</th>
                            <th className="py-2.5 px-3">Nama Opsi</th>
                            <th className="py-2.5 px-3">Visual</th>
                            <th className="py-2.5 px-3">Harga</th>
                            <th className="py-2.5 px-3 text-right rounded-r-xl">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ede2cd]">
                          {itemGrup.map((item) => {
                            const sedangEdit = editItemId === item.id;
                            const sedangSimpan = sedangSimpanId === item.id;
                            const cocokJenisAktif =
                              isGrupJenis && item.kode_visual === jenisKueDipilih;
                            const isPengali = isGrupPengaliUkuran(grup.nama, grup.peran_visual);
                            const faktorPengali = isPengali
                              ? getFaktorPengaliUkuran(grup.nama, item.kode_visual, item.nama)
                              : 1;

                            return (
                              <tr
                                key={`${item.id}-${item.kode_visual || item.urutan}`}
                                className={`transition ${
                                  cocokJenisAktif
                                    ? "bg-emerald-50/60 hover:bg-emerald-50"
                                    : "hover:bg-[#fbf8f1]"
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center font-mono text-stone-400">
                                  {item.urutan}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-stone-900">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span>{item.nama}</span>
                                    {cocokJenisAktif && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#17382d] text-white">
                                        Sedang Dilihat
                                      </span>
                                    )}
                                    {isPengali && (
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200"
                                        title="Otomatis mengalikan resep adonan, rasa, & topping saat dipesan"
                                      >
                                        Pengali Resep {formatFaktorPengali(faktorPengali)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  {renderVisualItem(item, grup.peran_visual)}
                                </td>
                                <td className="py-2.5 px-3">
                                  {sedangEdit ? (
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-stone-400 font-bold">Rp</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={inputHarga}
                                        onChange={(e) => setInputHarga(formatInputRibuan(e.target.value))}
                                        placeholder="0"
                                        className="w-28 h-7 px-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 outline-none focus:border-[#ba2b2b]"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-bold text-stone-900 lining-nums tabular-nums">
                                      {formatRupiah(item.harga)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {sedangEdit ? (
                                    <div className="inline-flex items-center space-x-1">
                                      <button
                                        type="button"
                                        disabled={sedangSimpan}
                                        onClick={() => simpanHarga(item.id)}
                                        className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer"
                                      >
                                        {sedangSimpan ? "..." : "Simpan"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={sedangSimpan}
                                        onClick={batalEditHarga}
                                        className="h-7 px-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => mulaiEditHarga(item)}
                                        className="h-7 px-2.5 rounded-lg border border-[#dfd4bd] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-[11px] transition cursor-pointer inline-flex items-center space-x-1"
                                      >
                                        <i className="fa-solid fa-pen-to-square text-[10px]" />
                                        <span>Harga</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => bukaModalResep(item, grup)}
                                        className="h-7 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition cursor-pointer inline-flex items-center space-x-1"
                                        title={
                                          isPengali
                                            ? "Opsional: tambahkan bahan kemasan (box/toples) untuk paket ini"
                                            : "Atur takaran bahan baku per 1 satuan/ukuran dasar"
                                        }
                                      >
                                        <i className={`fa-solid ${isPengali ? "fa-box-open" : "fa-wheat-awn"} text-[10px]`} />
                                        <span>
                                          {isPengali ? "Kemasan" : "Resep"}
                                          {jumlahResepMap[item.id] > 0
                                            ? ` (${jumlahResepMap[item.id]})`
                                            : ""}
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {(langkahDipilih === "semua" || langkahDipilih === "rincian") && (
              <div className="content-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbf8f1] border border-dashed border-[#d9ccb2]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0">
                    {konfigJenisAktif.langkah.length}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#1d3b2e]">Rincian Bahan</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        Tahap {konfigJenisAktif.langkah.length} · Otomatis
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Tahap akhir di /pesan untuk {konfigJenisAktif.nama} otomatis merangkum seluruh pilihan pelanggan dan menghitung kebutuhan bahan dapur berdasarkan tombol Resep pada setiap opsi di atas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        sedangMemuatProduk ? (
          <div className="content-card p-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500" />
            <p className="text-sm font-medium">Memuat katalog produk kue...</p>
          </div>
        ) : daftarProduk.length === 0 ? (
          <div className="content-card p-12 text-center text-stone-400">
            <i className="fa-solid fa-store text-4xl mb-3 text-stone-300" />
            <p className="text-base font-semibold text-stone-700">Belum ada kue katalog.</p>
            <p className="text-xs text-stone-400 mt-1">Tambahkan kue siap pesan pertama Anda.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setModalKategoriBuka(true)}
                className="px-4 py-2 border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] rounded-xl text-xs font-bold cursor-pointer"
              >
                Kelola Kategori
              </button>
              <button
                type="button"
                onClick={bukaModalTambahProduk}
                className="px-4 py-2 bg-[#ba2b2b] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tambah Produk
              </button>
            </div>
          </div>
        ) : (
          <div className="content-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#1d3b2e]">Daftar Produk Katalog</h3>
              <button
                type="button"
                onClick={() => setModalKategoriBuka(true)}
                className="h-[36px] px-3.5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer inline-flex items-center space-x-1.5 shadow-xs whitespace-nowrap shrink-0"
              >
                <i className="fa-solid fa-tags text-xs" />
                <span>Kelola Kategori</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-[11px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl w-14">Foto</th>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Label</th>
                    <th className="py-2.5 px-3">Harga</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede2cd]">
                  {daftarProduk.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fbf8f1] transition">
                      <td className="py-2.5 px-3">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 border border-[#dfd4bd] overflow-hidden flex items-center justify-center flex-shrink-0">
                          <GambarProduk
                            src={p.fotoUrl}
                            nama={p.nama}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900">{p.nama}</div>
                        {p.deskripsi && (
                          <div className="text-[11px] text-stone-500 max-w-xs truncate">
                            {p.deskripsi}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#ede2cd] text-[#1d3b2e] font-semibold text-[11px]">
                          {p.kategori || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                        {p.label_teks ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                            {p.label_teks}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900 lining-nums tabular-nums">
                        {formatRupiah(p.harga)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.aktif !== false
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            {p.aktif !== false ? "Aktif" : "Nonaktif"}
                          </span>
                          {p.unggulan ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              <i className="fa-solid fa-star text-[9px] text-amber-500" />
                              <span>Unggulan</span>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => bukaModalEditProduk(p)}
                            className="h-7 px-2.5 rounded-lg border border-[#dfd4bd] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-[11px] transition cursor-pointer inline-flex items-center space-x-1"
                          >
                            <i className="fa-solid fa-pen-to-square text-[10px]" />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => konfirmasiHapusProduk(p)}
                            className="h-7 px-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {modalProdukBuka && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setModalProdukBuka(false)}
          />
          <div className="relative bg-[#FFFDF9] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#dfd4bd] shadow-2xl space-y-4 my-auto z-10">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#dfd4bd]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  {editProdukId ? "Ubah Kue Katalog" : "Tambah Kue Katalog"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Lengkapi informasi kue katalog untuk etalase dan menu toko.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalProdukBuka(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#ede2cd] text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <form onSubmit={handleSimpanProduk} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nama Produk <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formProduk.nama}
                    onChange={(e) => setFormProduk({ ...formProduk, nama: e.target.value })}
                    placeholder="Contoh: Strawberry Shortcake"
                    className="w-full h-10 px-3.5 rounded-xl border border-[#dfd4bd] bg-white text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#17382d] focus:ring-1 focus:ring-[#17382d] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Kategori Produk
                  </label>
                  <select
                    value={formProduk.id_kategori}
                    onChange={(e) => setFormProduk({ ...formProduk, id_kategori: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#dfd4bd] bg-white text-xs text-stone-800 outline-none focus:border-[#17382d] focus:ring-1 focus:ring-[#17382d] transition"
                  >
                    <option value="">Pilih Kategori...</option>
                    {daftarKategori
                      .filter((k) => k.aktif || k.id === Number(formProduk.id_kategori))
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} {!k.aktif ? "(Nonaktif)" : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Harga (Rp) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 150.000"
                    value={formProduk.harga}
                    onChange={(e) => setFormProduk({ ...formProduk, harga: formatInputRibuan(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#dfd4bd] bg-white text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#17382d] focus:ring-1 focus:ring-[#17382d] transition lining-nums"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Label Teks
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {formProduk.label_teks.length}/24
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={24}
                    value={formProduk.label_teks}
                    onChange={(e) => setFormProduk({ ...formProduk, label_teks: e.target.value })}
                    placeholder="Contoh: Terlaris / Signature"
                    className="w-full h-10 px-3.5 rounded-xl border border-[#dfd4bd] bg-white text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#17382d] focus:ring-1 focus:ring-[#17382d] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Deskripsi Kue
                </label>
                <textarea
                  rows={2}
                  value={formProduk.deskripsi}
                  onChange={(e) => setFormProduk({ ...formProduk, deskripsi: e.target.value })}
                  placeholder="Deskripsi singkat kue, rasa, dan keunggulan..."
                  className="w-full p-3 rounded-xl border border-[#dfd4bd] bg-white text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#17382d] focus:ring-1 focus:ring-[#17382d] transition resize-none"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Tulis juga info penting seperti alergen (kacang, susu, gluten) kalau ada.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Foto Produk <span className="text-stone-400 font-normal">(Maks 2 MB, format JPG/PNG/WebP)</span>
                </label>
                <div className="flex items-center gap-3">
                  {previewFotoProduk ? (
                    <div className="relative w-16 h-16 rounded-2xl border-2 border-[#17382d]/25 bg-white overflow-hidden flex-shrink-0 shadow-sm group">
                      <img
                        src={previewFotoProduk}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFileFotoProduk(null);
                          setPreviewFotoProduk(null);
                        }}
                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[11px] font-bold cursor-pointer"
                        title="Hapus foto"
                      >
                        <i className="fa-solid fa-trash-can mr-1 text-[10px]" />
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#dfd4bd] bg-[#fbf8f1] flex flex-col items-center justify-center text-stone-400 flex-shrink-0">
                      <i className="fa-solid fa-image text-lg mb-0.5 text-stone-400" />
                      <span className="text-[9px] font-semibold text-stone-400">Kosong</span>
                    </div>
                  )}
                  <label className="flex-1 px-4 py-3 rounded-2xl border border-dashed border-[#c5b497] hover:border-[#17382d] bg-white hover:bg-[#fbf8f1] cursor-pointer transition flex items-center justify-center gap-2 text-xs font-semibold text-[#17382d] shadow-2xs">
                    <i className="fa-solid fa-cloud-arrow-up text-sm" />
                    <span className="truncate">{fileFotoProduk ? fileFotoProduk.name : "Pilih File Foto..."}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handlePilihFotoProduk}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-3 bg-[#ede2cd]/50 rounded-2xl border border-[#dfd4bd] space-y-2">
                <label
                  htmlFor="produk-unggulan"
                  className={`flex items-start gap-2.5 cursor-pointer select-none ${
                    batasUnggulanTercapai ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    id="produk-unggulan"
                    disabled={batasUnggulanTercapai}
                    checked={formProduk.unggulan}
                    onChange={(e) => setFormProduk({ ...formProduk, unggulan: e.target.checked })}
                    className="w-4 h-4 rounded text-[#17382d] accent-[#17382d] mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-800">
                      Tampil di Beranda (maks 4)
                    </span>
                    <span className="ml-2 text-[11px] font-semibold text-stone-500">
                      ({totalUnggulan} dari 4 unggulan)
                    </span>
                    {batasUnggulanTercapai && (
                      <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                        Batas maksimal 4 unggulan sudah tercapai. Hapus status unggulan pada produk lain terlebih dahulu.
                      </p>
                    )}
                  </div>
                </label>

                <label htmlFor="produk-aktif" className="flex items-center gap-2.5 pt-1.5 border-t border-[#dfd4bd]/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="produk-aktif"
                    checked={formProduk.aktif}
                    onChange={(e) => setFormProduk({ ...formProduk, aktif: e.target.checked })}
                    className="w-4 h-4 rounded text-[#17382d] accent-[#17382d] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Produk Aktif <span className="text-stone-400 font-normal">(Tampil di menu dan etalase toko)</span>
                  </span>
                </label>
              </div>

              <div className="pt-3.5 border-t border-[#dfd4bd] flex justify-end items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalProdukBuka(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangSimpanProduk}
                  className="px-5 py-2.5 rounded-xl bg-[#ba2b2b] hover:bg-[#9f2323] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  {sedangSimpanProduk ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check text-xs" />
                      <span>Simpan Produk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalKategoriBuka && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setModalKategoriBuka(false)}
          />
          <div className="relative bg-[#FFFDF9] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#dfd4bd] shadow-2xl space-y-4 my-auto z-10">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#dfd4bd]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Kelola Kategori Produk
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Atur kategori kue katalog untuk filter dan pengelompokan menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalKategoriBuka(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#ede2cd] text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <form
              onSubmit={handleTambahKategori}
              className="flex items-end gap-2 p-3 bg-[#ede2cd]/40 border border-[#dfd4bd] rounded-2xl"
            >
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Kategori Baru
                </label>
                <input
                  type="text"
                  required
                  value={kategoriBaruNama}
                  onChange={(e) => setKategoriBaruNama(e.target.value)}
                  placeholder="Nama kategori..."
                  className="w-full h-9 px-3 rounded-xl border border-[#dfd4bd] bg-white text-xs text-stone-800 outline-none focus:border-[#17382d]"
                />
              </div>
              <button
                type="submit"
                disabled={sedangSimpanKategori}
                className="h-9 px-3.5 rounded-xl bg-[#17382d] hover:bg-[#122e25] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
              >
                <i className="fa-solid fa-plus text-[10px]" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {daftarKategori.length === 0 ? (
                <div className="p-6 text-center text-stone-400 text-xs">
                  Belum ada kategori produk.
                </div>
              ) : (
                daftarKategori.map((kat) => (
                  <div
                    key={kat.id}
                    className="p-3 bg-white border border-[#dfd4bd] rounded-2xl flex items-center justify-between gap-3"
                  >
                    {editKategoriId === kat.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editKategoriNama}
                          onChange={(e) => setEditKategoriNama(e.target.value)}
                          className="flex-1 h-8 px-2.5 rounded-lg border border-[#17382d] text-xs font-bold outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUbahKategori(
                              kat.id,
                              editKategoriNama,
                              editKategoriAktif
                            )
                          }
                          className="h-8 px-2.5 rounded-lg bg-[#17382d] text-white text-xs font-bold"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditKategoriId(null)}
                          className="h-8 px-2.5 rounded-lg border border-stone-300 text-xs text-stone-600"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-xs text-stone-800 truncate">
                            {kat.nama}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              kat.aktif
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            {kat.aktif ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleUbahKategori(
                                kat.id,
                                kat.nama,
                                !kat.aktif
                              )
                            }
                            className={`h-7 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                              kat.aktif
                                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {kat.aktif ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditKategoriId(kat.id);
                              setEditKategoriNama(kat.nama);
                              setEditKategoriAktif(kat.aktif !== false);
                            }}
                            className="w-7 h-7 rounded-lg border border-[#dfd4bd] bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition cursor-pointer"
                            title="Ubah Kategori"
                          >
                            <i className="fa-solid fa-pen text-[10px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHapusKategori(kat.id)}
                            className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#dfd4bd] flex justify-end">
              <button
                type="button"
                onClick={() => setModalKategoriBuka(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {modalHapusBuka && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setModalHapusBuka(false)}
          />
          <div className="relative bg-[#FFFDF9] rounded-3xl max-w-sm w-full p-6 border border-[#dfd4bd] shadow-2xl space-y-4 my-auto z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900">Hapus Produk?</h3>
              <p className="text-xs text-stone-600">
                Apakah Anda yakin ingin menghapus <strong>&ldquo;{namaHapusProduk}&rdquo;</strong> dari katalog? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalHapusBuka(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangHapusProduk}
                onClick={eksekusiHapusProduk}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {sedangHapusProduk ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalResepBuka && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => {
              setModalResepBuka(false);
              setItemResepAktif(null);
            }}
          />
          <div className="relative bg-[#FFFDF9] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#dfd4bd] shadow-2xl space-y-4 my-auto z-10">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#dfd4bd]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  {isGrupPengaliUkuran(itemResepAktif?._grupNama, itemResepAktif?._peranVisual)
                    ? `Kemasan / Bahan Tambahan: ${itemResepAktif?.nama}`
                    : `Resep Bahan: ${itemResepAktif?.nama}`}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  {isGrupPengaliUkuran(itemResepAktif?._grupNama, itemResepAktif?._peranVisual) ? (
                    <>
                      Opsi ini otomatis mengalikan bahan <b>Jenis Kue, Rasa, &amp; Topping</b> sebesar{" "}
                      <span className="font-bold text-amber-800">
                        {formatFaktorPengali(
                          getFaktorPengaliUkuran(
                            itemResepAktif?._grupNama,
                            itemResepAktif?.kode_visual,
                            itemResepAktif?.nama
                          )
                        )}
                      </span>
                      . Di sini cukup isi bahan kemasan (mis. box/toples) jika diperlukan.
                    </>
                  ) : (
                    <>
                      Isi takaran bahan untuk <b>1 satuan / ukuran dasar</b>. Sistem otomatis mengalikan dengan pilihan Ukuran / Porsi / Jumlah saat dipesan.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalResepBuka(false);
                  setItemResepAktif(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#ede2cd] text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {sedangMemuatResep ? (
                <div className="py-8 text-center text-stone-400">
                  <i className="fa-solid fa-circle-notch fa-spin text-xl mb-2 text-amber-700" />
                  <p className="text-xs">Memuat resep bahan...</p>
                </div>
              ) : barisResep.length === 0 ? (
                <div className="p-6 text-center text-stone-400 border border-dashed border-[#dfd4bd] rounded-2xl bg-white">
                  <i className="fa-solid fa-wheat-awn text-2xl mb-2 text-stone-300" />
                  <p className="text-xs font-semibold text-stone-600">Belum ada bahan untuk opsi ini.</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Klik tombol di bawah untuk menambahkan bahan baku.
                  </p>
                </div>
              ) : (
                barisResep.map((baris, idx) => {
                  const bahanObj = daftarBahan.find((b) => b.id === Number(baris.id_bahan));
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-[#dfd4bd]"
                    >
                      <div className="flex-1 min-w-0">
                        <select
                          value={baris.id_bahan}
                          onChange={(e) => ubahBarisResep(idx, "id_bahan", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-[#1d3b2e] bg-[#fbf8f1] outline-none"
                        >
                          <option value="" disabled>Pilih Bahan...</option>
                          {daftarBahan.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.nama} ({b.satuan})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28 flex items-center space-x-1">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={baris.jumlah}
                          onChange={(e) => ubahBarisResep(idx, "jumlah", e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-center text-[#1d3b2e] bg-[#fbf8f1] outline-none"
                        />
                        <span className="text-[11px] font-bold text-stone-500 w-10 truncate">
                          {bahanObj?.satuan || ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => hapusBarisResep(idx)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                        title="Hapus baris bahan"
                      >
                        <i className="fa-solid fa-trash-can text-xs" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#dfd4bd] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={tambahBarisResep}
                disabled={sedangMemuatResep || daftarBahan.length === 0}
                className="px-3 py-2 rounded-xl border border-[#dfd4bd] bg-white hover:bg-stone-50 text-[#1d3b2e] text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
              >
                <i className="fa-solid fa-plus text-[10px]" />
                <span>Tambah Bahan</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalResepBuka(false);
                    setItemResepAktif(null);
                  }}
                  disabled={sedangSimpanResep}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={simpanResep}
                  disabled={sedangSimpanResep || sedangMemuatResep}
                  className="px-5 py-2 rounded-xl bg-[#17382d] hover:bg-[#122e25] text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {sedangSimpanResep ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Bahan</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalPesan
        terbuka={notifikasi.terbuka}
        judul={notifikasi.judul}
        pesan={notifikasi.pesan}
        tipe={notifikasi.tipe}
        onTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
        padaTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
      />
    </div>
  );
}
