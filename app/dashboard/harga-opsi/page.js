"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function HargaOpsiPage() {
  const [profil, setProfil] = useState(null);
  const [tabAktif, setTabAktif] = useState("custom");

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
  const [sedangMemuatResep, setSedangMemuatResep] = useState(false);
  const [sedangSimpanResep, setSedangSimpanResep] = useState(false);

  const [daftarProduk, setDaftarProduk] = useState([]);
  const [sedangMemuatProduk, setSedangMemuatProduk] = useState(false);
  const [modalProdukBuka, setModalProdukBuka] = useState(false);
  const [editProdukId, setEditProdukId] = useState(null);
  const [formProduk, setFormProduk] = useState({
    nama: "",
    deskripsi: "",
    harga: 0,
    urutan: 0,
    aktif: true,
  });
  const [fileFotoProduk, setFileFotoProduk] = useState(null);
  const [previewFotoProduk, setPreviewFotoProduk] = useState(null);
  const [sedangSimpanProduk, setSedangSimpanProduk] = useState(false);

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
      if (prof) setProfil(prof);
    }

    const { data: grupList, error: errGrup } = await supabase
      .from("grup_opsi")
      .select("*")
      .order("urutan", { ascending: true });

    const { data: itemList, error: errItem } = await supabase
      .from("opsi_item")
      .select("*")
      .order("urutan", { ascending: true });

    if (!errGrup && grupList) {
      setDaftarGrup(grupList);
    }
    if (!errItem && itemList) {
      setDaftarItem(itemList);
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

  useEffect(() => {
    muatData();
    muatProduk();
  }, []);

  function toggleGrupBuka(grupId) {
    setGrupTerbukaMap((prev) => ({
      ...prev,
      [grupId]: prev[grupId] === false ? true : false,
    }));
  }

  const apakahSemuaTutup =
    daftarGrup.length > 0 &&
    daftarGrup.every((g) => grupTerbukaMap[g.id] === false);

  function toggleSemuaGrup() {
    const nextVal = apakahSemuaTutup ? true : false;
    const newMap = {};
    for (let i = 0; i < daftarGrup.length; i++) {
      newMap[daftarGrup[i].id] = nextVal;
    }
    setGrupTerbukaMap(newMap);
  }

  function mulaiEditHarga(item) {
    setEditItemId(item.id);
    setInputHarga(String(item.harga ?? 0));
  }

  function batalEditHarga() {
    setEditItemId(null);
    setInputHarga("");
  }

  async function simpanHarga(itemId) {
    const hargaAngka = Number(inputHarga);
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

  async function bukaModalResep(item) {
    setItemResepAktif(item);
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
    const bahanTersedia = daftarBahan[0]?.id || "";
    setBarisResep((prev) => [...prev, { id_bahan: bahanTersedia, jumlah: 1 }]);
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
      deskripsi: "",
      harga: 100000,
      urutan: daftarProduk.length + 1,
      aktif: true,
    });
    setFileFotoProduk(null);
    setPreviewFotoProduk(null);
    setModalProdukBuka(true);
  }

  function bukaModalEditProduk(prod) {
    setEditProdukId(prod.id);
    setFormProduk({
      nama: prod.nama || "",
      deskripsi: prod.deskripsi || "",
      harga: prod.harga || 0,
      urutan: prod.urutan ?? 0,
      aktif: prod.aktif !== false,
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

    setSedangSimpanProduk(true);
    const fd = new FormData();
    if (editProdukId) {
      fd.append("id", editProdukId);
    }
    fd.append("nama", formProduk.nama);
    fd.append("deskripsi", formProduk.deskripsi);
    fd.append("harga", formProduk.harga);
    fd.append("urutan", formProduk.urutan);
    fd.append("aktif", formProduk.aktif ? "true" : "false");
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

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Kelola Harga & Katalog Kue
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur opsi kustomisasi studio kue dan produk kue katalog siap pesan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-[#ede2cd] border border-[#dfd4bd] rounded-2xl">
            <button
              type="button"
              onClick={() => setTabAktif("custom")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center space-x-1.5 ${
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
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center space-x-1.5 ${
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
              className="h-[40px] px-4 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-xs"
            >
              <i className={`fa-solid ${apakahSemuaTutup ? "fa-angles-down" : "fa-angles-up"} text-xs`} />
              <span>{apakahSemuaTutup ? "Buka Semua" : "Tutup Semua"}</span>
            </button>
          )}

          {tabAktif === "katalog" && (
            <button
              type="button"
              onClick={bukaModalTambahProduk}
              className="h-[40px] px-4 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold text-xs transition cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
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
            {daftarGrup.map((grup) => {
              const itemGrup = daftarItem.filter((it) => it.id_grup === grup.id);
              const isBuka = grupTerbukaMap[grup.id] !== false;

              return (
                <div
                  key={grup.id}
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
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-sm font-bold shadow-xs transition group-hover:scale-105">
                          <i className="fa-solid fa-layer-group" />
                        </div>
                        <h3 className="text-base font-bold text-[#1d3b2e] flex items-center gap-2">
                          <span>{grup.nama}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ede2cd] text-stone-700 border border-[#dfd4bd]">
                            {itemGrup.length} item
                          </span>
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
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

                            return (
                              <tr key={item.id} className="hover:bg-[#fbf8f1] transition">
                                <td className="py-2.5 px-3 text-center font-mono text-stone-400">
                                  {item.urutan}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-stone-900">
                                  {item.nama}
                                </td>
                                <td className="py-2.5 px-3">
                                  {renderVisualItem(item, grup.peran_visual)}
                                </td>
                                <td className="py-2.5 px-3">
                                  {sedangEdit ? (
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-stone-400 font-bold">Rp</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={inputHarga}
                                        onChange={(e) => setInputHarga(e.target.value)}
                                        className="w-24 h-7 px-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 outline-none focus:border-[#ba2b2b]"
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
                                        onClick={() => bukaModalResep(item)}
                                        className="h-7 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition cursor-pointer inline-flex items-center space-x-1"
                                      >
                                        <i className="fa-solid fa-wheat-awn text-[10px]" />
                                        <span>Resep</span>
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
            <button
              type="button"
              onClick={bukaModalTambahProduk}
              className="mt-4 px-4 py-2 bg-[#ba2b2b] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Tambah Produk
            </button>
          </div>
        ) : (
          <div className="content-card p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-[11px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl w-14">Foto</th>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-3">Deskripsi</th>
                    <th className="py-2.5 px-3">Harga</th>
                    <th className="py-2.5 px-3 text-center">Urutan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede2cd]">
                  {daftarProduk.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fbf8f1] transition">
                      <td className="py-2.5 px-3">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 border border-[#dfd4bd] overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.fotoUrl ? (
                            <img
                              src={p.fotoUrl}
                              alt={p.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="fa-solid fa-cake-candles text-stone-300 text-lg" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">
                        {p.nama}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 max-w-xs truncate">
                        {p.deskripsi || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900 lining-nums tabular-nums">
                        {formatRupiah(p.harga)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-stone-500">
                        {p.urutan ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.aktif !== false
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {p.aktif !== false ? "Aktif" : "Nonaktif"}
                        </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#fbf8f1] rounded-3xl max-w-lg w-full p-6 border border-[#dfd4bd] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfd4bd]">
              <h3 className="text-base font-bold text-[#1d3b2e]">
                {editProdukId ? "Ubah Kue Katalog" : "Tambah Kue Katalog"}
              </h3>
              <button
                type="button"
                onClick={() => setModalProdukBuka(false)}
                className="w-8 h-8 rounded-full hover:bg-[#ede2cd] text-stone-500 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSimpanProduk} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={formProduk.nama}
                  onChange={(e) => setFormProduk({ ...formProduk, nama: e.target.value })}
                  placeholder="Contoh: Strawberry Shortcake"
                  className="w-full h-9 px-3 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 outline-none focus:border-[#ba2b2b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={formProduk.deskripsi}
                  onChange={(e) => setFormProduk({ ...formProduk, deskripsi: e.target.value })}
                  placeholder="Deskripsi singkat kue..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 outline-none focus:border-[#ba2b2b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formProduk.harga}
                    onChange={(e) => setFormProduk({ ...formProduk, harga: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 outline-none focus:border-[#ba2b2b] lining-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={formProduk.urutan}
                    onChange={(e) => setFormProduk({ ...formProduk, urutan: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 outline-none focus:border-[#ba2b2b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Foto Produk (Maks 2 MB, JPG/PNG)
                </label>
                <div className="flex items-center gap-3">
                  {previewFotoProduk && (
                    <div className="w-14 h-14 rounded-xl border border-[#dfd4bd] bg-white overflow-hidden flex-shrink-0">
                      <img
                        src={previewFotoProduk}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handlePilihFotoProduk}
                    className="text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#17382d] file:text-white hover:file:bg-[#122e25] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="produk-aktif"
                  checked={formProduk.aktif}
                  onChange={(e) => setFormProduk({ ...formProduk, aktif: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="produk-aktif" className="text-xs font-bold text-stone-700 select-none cursor-pointer">
                  Produk Aktif (Tampil di menu/katalog publik)
                </label>
              </div>

              <div className="pt-3 border-t border-[#dfd4bd] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalProdukBuka(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangSimpanProduk}
                  className="px-5 py-2 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                >
                  {sedangSimpanProduk ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Produk</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHapusBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#fbf8f1] rounded-3xl max-w-sm w-full p-6 border border-[#dfd4bd] shadow-xl space-y-4">
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
                className="flex-1 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangHapusProduk}
                onClick={eksekusiHapusProduk}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {sedangHapusProduk ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalResepBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#fbf8f1] rounded-3xl max-w-lg w-full p-6 border border-[#dfd4bd] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfd4bd]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Resep Bahan: {itemResepAktif?.nama}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Tentukan bahan dan takaran yang dibutuhkan untuk 1 porsi opsi ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalResepBuka(false);
                  setItemResepAktif(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-[#ede2cd] text-stone-500 flex items-center justify-center transition cursor-pointer"
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
        padaTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
      />
    </div>
  );
}
