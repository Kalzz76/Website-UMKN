"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

const presetWarna = [
  { label: "Coklat", hex: "#5c3a21" },
  { label: "Vanilla", hex: "#fbf0d9" },
  { label: "Pink", hex: "#f472b6" },
  { label: "Red Velvet", hex: "#991b1b" },
  { label: "Matcha", hex: "#4d7c0f" },
  { label: "Putih", hex: "#ffffff" },
  { label: "Mocca", hex: "#78350f" },
  { label: "Krim Keju", hex: "#fef3c7" },
];

const KODE_STUDIO_PER_PERAN = {
  ukuran: ["mini", "small", "medium", "large"],
  bentuk: ["round", "square", "heart", "star", "hex", "custom"],
  badan: ["vanilla", "choco", "velvet", "straw"],
  krim: ["pink", "putih", "coklat", "mint", "kuning", "lavender"],
  topping: ["drip", "straw", "berry", "flower", "spr", "candle"],
  stiker: ["stiker", "topper", "bunga", "buah", "cokelat", "lainnya"],
};

export default function HargaOpsiPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [daftarGrup, setDaftarGrup] = useState([]);
  const [daftarItem, setDaftarItem] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangProses, setSedangProses] = useState(false);
  const [grupTerbukaMap, setGrupTerbukaMap] = useState({});

  const [modalGrupBuka, setModalGrupBuka] = useState(false);
  const [editGrupId, setEditGrupId] = useState(null);
  const [formGrup, setFormGrup] = useState({
    nama: "",
    urutan: 0,
    wajib: false,
    jenis_pilihan: "satu",
    peran_visual: "",
    peran_dashboard: "",
  });

  const [modalItemBuka, setModalItemBuka] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [grupAktifForItem, setGrupAktifForItem] = useState(null);
  const [formItem, setFormItem] = useState({
    id_grup: "",
    nama: "",
    harga: 0,
    aktif: true,
    urutan: 0,
    warna: "",
    kode_visual: "",
  });

  const [pesanErrorForm, setPesanErrorForm] = useState([]);
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
    if (modalGrupBuka || modalItemBuka || notifikasi.terbuka) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalGrupBuka, modalItemBuka, notifikasi.terbuka]);

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

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

  useEffect(() => {
    muatData();
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

  function bukaModalTambahGrup() {
    setEditGrupId(null);
    setFormGrup({
      nama: "",
      urutan: daftarGrup.length + 1,
      wajib: false,
      jenis_pilihan: "satu",
      peran_visual: "",
      peran_dashboard: "",
    });
    setPesanErrorForm([]);
    setModalGrupBuka(true);
  }

  function bukaModalEditGrup(grup) {
    setEditGrupId(grup.id);
    setFormGrup({
      nama: grup.nama,
      urutan: grup.urutan,
      wajib: grup.wajib,
      jenis_pilihan: grup.jenis_pilihan,
      peran_visual: grup.peran_visual || "",
      peran_dashboard: grup.peran_dashboard || "",
    });
    setPesanErrorForm([]);
    setModalGrupBuka(true);
  }

  async function simpanGrup(e) {
    e.preventDefault();
    setPesanErrorForm([]);

    const errors = [];
    if (!formGrup.nama.trim()) {
      errors.push("Nama grup tidak boleh kosong.");
    }
    if (errors.length > 0) {
      setPesanErrorForm(errors);
      return;
    }

    setSedangProses(true);
    const aksi = editGrupId ? "edit_grup" : "tambah_grup";
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editGrupId,
        nama: formGrup.nama,
        urutan: formGrup.urutan,
        wajib: formGrup.wajib,
        jenis_pilihan: formGrup.jenis_pilihan,
        peran_visual: formGrup.peran_visual,
        peran_dashboard: formGrup.peran_dashboard,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanErrorForm([hasil.pesan || "Terjadi kesalahan saat menyimpan grup."]);
      return;
    }

    setModalGrupBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function hapusGrup(grup) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus grup "${grup.nama}"? Semua opsi item di dalamnya akan ikut terhapus. Jika opsi sudah pernah dipesan, data pesanan lama tetap aman.`
    );
    if (!yakin) return;

    setSedangProses(true);
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_grup",
        id: grup.id,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus grup.",
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

  function bukaModalTambahItem(grup) {
    setEditItemId(null);
    setGrupAktifForItem(grup);
    const itemDiGrup = daftarItem.filter((item) => item.id_grup === grup.id);

    let defaultKodeVisual = "";
    let defaultWarna = "";
    if (grup.peran_visual === "ukuran") {
      defaultKodeVisual = "mini";
    } else if (grup.peran_visual === "bentuk") {
      defaultKodeVisual = "round";
    } else if (grup.peran_visual === "badan") {
      defaultWarna = "#5c3a21";
      defaultKodeVisual = "vanilla";
    } else if (grup.peran_visual === "krim") {
      defaultWarna = "#ffffff";
      defaultKodeVisual = "putih";
    } else if (grup.peran_visual === "topping") {
      defaultKodeVisual = "drip";
    } else if (grup.peran_visual === "stiker") {
      defaultKodeVisual = "stiker";
    }

    setFormItem({
      id_grup: grup.id,
      nama: "",
      harga: 0,
      aktif: true,
      urutan: itemDiGrup.length + 1,
      warna: defaultWarna,
      kode_visual: defaultKodeVisual,
    });
    setPesanErrorForm([]);
    setModalItemBuka(true);
  }

  function bukaModalEditItem(item, grup) {
    setEditItemId(item.id);
    setGrupAktifForItem(grup);

    setFormItem({
      id_grup: item.id_grup,
      nama: item.nama,
      harga: item.harga,
      aktif: item.aktif,
      urutan: item.urutan,
      warna: item.warna || "",
      kode_visual: item.kode_visual || "",
    });
    setPesanErrorForm([]);
    setModalItemBuka(true);
  }

  async function simpanItem(e) {
    e.preventDefault();
    setPesanErrorForm([]);

    const errors = [];
    if (!formItem.nama.trim()) {
      errors.push("Nama opsi item tidak boleh kosong.");
    }
    if (formItem.harga < 0 || isNaN(Number(formItem.harga))) {
      errors.push("Harga harus berupa angka valid dan minimal 0.");
    }
    if (errors.length > 0) {
      setPesanErrorForm(errors);
      return;
    }

    const finalWarna = formItem.warna?.trim() || null;
    const finalKodeVisual = formItem.kode_visual?.trim() || null;

    setSedangProses(true);
    const aksi = editItemId ? "edit_item" : "tambah_item";
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editItemId,
        id_grup: formItem.id_grup,
        nama: formItem.nama,
        harga: Number(formItem.harga),
        aktif: formItem.aktif,
        urutan: formItem.urutan,
        warna: finalWarna,
        kode_visual: finalKodeVisual,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanErrorForm([hasil.pesan || "Terjadi kesalahan saat menyimpan item."]);
      return;
    }

    setModalItemBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function toggleAktifItem(item) {
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "edit_item",
        id: item.id,
        id_grup: item.id_grup,
        nama: item.nama,
        harga: item.harga,
        aktif: !item.aktif,
        urutan: item.urutan,
        warna: item.warna,
        kode_visual: item.kode_visual,
      }),
    });

    const hasil = await res.json();
    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal mengubah status item.",
        tipe: "error",
      });
      return;
    }

    muatData();
  }

  async function hapusItem(item) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus item "${item.nama}"? Jika bahan sedang kosong, disarankan untuk menonaktifkannya saja agar tidak muncul bagi pelanggan.`
    );
    if (!yakin) return;

    setSedangProses(true);
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_item",
        id: item.id,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus item.",
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

  function renderLabelPeranVisual(peran) {
    if (peran === "ukuran") return "Ukuran Kue";
    if (peran === "bentuk") return "Bentuk Kue";
    if (peran === "badan") return "Rasa / Warna Kue";
    if (peran === "krim") return "Warna Krim";
    if (peran === "topping") return "Dekorasi / Topping";
    if (peran === "stiker") return "Elemen Hiasan / Stiker";
    return "Tanpa Efek Visual";
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

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Kelola Harga & Opsi Kustomisasi
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur pilihan ukuran, rasa, warna krim, dan topping kue sesuai katalog toko Anda
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {daftarGrup.length > 0 && (
            <button
              type="button"
              onClick={toggleSemuaGrup}
              className="h-[42px] px-4 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-xs"
            >
              <i className={`fa-solid ${apakahSemuaTutup ? "fa-angles-down" : "fa-angles-up"} text-xs`}></i>
              <span>{apakahSemuaTutup ? "Buka Semua" : "Tutup Semua"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={bukaModalTambahGrup}
            className="h-[42px] px-5 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-sm inline-flex items-center justify-center space-x-2 flex-shrink-0"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Tambah Grup Opsi</span>
          </button>
        </div>
      </div>

      {sedangMemuat ? (
        <div className="content-card p-12 text-center text-stone-400">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
          <p className="text-sm font-medium">Memuat data grup dan opsi...</p>
        </div>
      ) : daftarGrup.length === 0 ? (
        <div className="content-card p-12 text-center text-stone-400">
          <i className="fa-solid fa-layer-group text-4xl mb-3 text-stone-300"></i>
          <p className="text-base font-semibold text-stone-700">Belum ada grup opsi.</p>
          <p className="text-xs text-stone-400 mt-1">
            Klik tombol &quot;Tambah Grup Opsi&quot; untuk membuat grup kustomisasi pertama Anda.
          </p>
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
                  isBuka ? "p-6 space-y-5" : "p-5"
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    isBuka ? "pb-4 border-b border-[#e8dfc8]" : ""
                  }`}
                >
                  <div
                    onClick={() => toggleGrupBuka(grup.id)}
                    className="space-y-2 cursor-pointer select-none flex-1 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-sm font-bold shadow-xs transition group-hover:scale-105">
                        <i className="fa-solid fa-layer-group"></i>
                      </div>
                      <h3 className="text-lg font-bold text-[#1d3b2e] flex items-center gap-2">
                        <span>{grup.nama}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ede2cd] text-stone-700 border border-[#dfd4bd]">
                          {itemGrup.length} item
                        </span>
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-3 py-0.5 rounded-full font-bold border ${
                          grup.wajib
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-[#ede2cd] text-[#1d3b2e] border-[#dfd4bd]"
                        }`}
                      >
                        {grup.wajib ? "Wajib Dipilih" : "Opsional"}
                      </span>
                      <span className="px-3 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        {grup.jenis_pilihan === "satu" ? "Pilih Satu" : "Pilih Banyak"}
                      </span>
                      {grup.peran_visual ? (
                        <span className="px-3 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Peran Visual: {renderLabelPeranVisual(grup.peran_visual)}
                        </span>
                      ) : (
                        <span className="px-3 py-0.5 rounded-full font-bold bg-stone-100 text-stone-600 border border-stone-200">
                          Non-Visual (Teks)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => bukaModalTambahItem(grup)}
                      className="h-[36px] px-3.5 rounded-xl text-xs font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white transition cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      <span>Tambah Item</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => bukaModalEditGrup(grup)}
                      className="w-9 h-9 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center transition cursor-pointer"
                      title="Edit Grup"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => hapusGrup(grup)}
                      className="w-9 h-9 rounded-xl border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 flex items-center justify-center transition cursor-pointer"
                      title="Hapus Grup"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGrupBuka(grup.id)}
                      className="w-9 h-9 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center transition cursor-pointer"
                      title={isBuka ? "Tutup Grup" : "Buka Grup"}
                    >
                      <i
                        className={`fa-solid ${
                          isBuka ? "fa-chevron-up" : "fa-chevron-down"
                        } text-xs transition-transform duration-200`}
                      ></i>
                    </button>
                  </div>
                </div>

                {isBuka && (
                  itemGrup.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-500 bg-[#f7f2e4] rounded-2xl border border-dashed border-[#dfd4bd]">
                      Belum ada pilihan item di dalam grup ini. Silakan klik tombol &quot;Tambah Item&quot;.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-xs font-bold border-y border-[#dfd4bd]">
                          <tr>
                            <th className="py-3 px-3.5 rounded-l-xl w-14">No.</th>
                            <th className="py-3 px-3.5">Nama Opsi</th>
                            <th className="py-3 px-3.5">Harga Tambahan</th>
                            <th className="py-3 px-3.5">
                              {grup.peran_visual === "ukuran"
                                ? "Ukuran Visual"
                                : grup.peran_visual === "badan" || grup.peran_visual === "krim"
                                ? "Warna Visual"
                                : grup.peran_visual === "topping"
                                ? "Ikon Visual"
                                : "Format"}
                            </th>
                            <th className="py-3 px-3.5">Status</th>
                            <th className="py-3 px-3.5 text-right rounded-r-xl w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ede2cd]">
                          {itemGrup.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-[#f7f2e4]/70 transition">
                              <td className="py-3 px-3.5 font-bold text-stone-600 text-xs">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3.5 font-bold text-[#1d3b2e]">
                                {item.nama}
                              </td>
                              <td className="py-3 px-3.5 font-bold text-stone-800">
                                {formatRupiah(item.harga)}
                              </td>
                              <td className="py-3 px-3.5">
                                {renderVisualItem(item, grup.peran_visual)}
                              </td>
                              <td className="py-3 px-3.5">
                                <button
                                  type="button"
                                  onClick={() => toggleAktifItem(item)}
                                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                                    item.aktif
                                      ? "bg-[#d8e3cf] text-[#215934] border-[#bad1ab] hover:bg-[#cbe0bf]"
                                      : "bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300"
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      item.aktif ? "bg-[#215934]" : "bg-stone-400"
                                    }`}
                                  ></span>
                                  <span>{item.aktif ? "Aktif" : "Nonaktif"}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => bukaModalEditItem(item, grup)}
                                    className="w-8 h-8 rounded-lg border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] inline-flex items-center justify-center transition cursor-pointer"
                                    title="Edit Item"
                                  >
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => hapusItem(item)}
                                    className="w-8 h-8 rounded-lg border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
                                    title="Hapus Item"
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
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {isMounted && modalGrupBuka && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalGrupBuka(false);
          }}
          className="portal-modal-backdrop flex items-center justify-center p-3 sm:p-5 overflow-hidden"
        >
          <div className="relative bg-[#fbf6e9] border border-[#dcd3c1] rounded-[24px] max-w-lg w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <h3 className="text-lg font-bold text-[#1d3b2e]">
                {editGrupId ? "Edit Grup Opsi" : "Tambah Grup Opsi"}
              </h3>
              <button
                type="button"
                onClick={() => setModalGrupBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={simpanGrup} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {pesanErrorForm.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    {pesanErrorForm.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Nama Grup <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ukuran Kue, Rasa Sponge, Warna Krim"
                    value={formGrup.nama}
                    onChange={(e) =>
                      setFormGrup({ ...formGrup, nama: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formGrup.urutan}
                      onChange={(e) =>
                        setFormGrup({ ...formGrup, urutan: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Jenis Pilihan
                    </label>
                    <select
                      value={formGrup.jenis_pilihan}
                      onChange={(e) =>
                        setFormGrup({ ...formGrup, jenis_pilihan: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                    >
                      <option value="satu">Pilih Satu (Radio)</option>
                      <option value="banyak">Pilih Banyak (Checkbox)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Peran Visual (Preview Kue)
                  </label>
                  <select
                    value={formGrup.peran_visual}
                    onChange={(e) =>
                      setFormGrup({ ...formGrup, peran_visual: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                  >
                    <option value="">Non-Visual (Hanya harga & teks catatan)</option>
                    <option value="ukuran">Ukuran (Mengatur tingkat & ukuran kue)</option>
                    <option value="bentuk">Bentuk (Bentuk dasar kue 3D)</option>
                    <option value="badan">Warna Kue (Mengatur warna dasar bolu)</option>
                    <option value="krim">Warna Krim (Mengatur warna lelehan krim)</option>
                    <option value="topping">Dekorasi / Topping (Lelehan, lilin, buah)</option>
                    <option value="stiker">Elemen Hiasan / Stiker (Topper, bunga, stiker)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Tampil di Dashboard Sebagai
                  </label>
                  <select
                    value={formGrup.peran_dashboard || ""}
                    onChange={(e) =>
                      setFormGrup({ ...formGrup, peran_dashboard: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                  >
                    <option value="">Tidak ditampilkan di ringkasan grafik</option>
                    <option value="jenis">Grafik jenis kue (donut chart)</option>
                    <option value="terlaris">Daftar item terlaris</option>
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formGrup.wajib}
                      onChange={(e) =>
                        setFormGrup({ ...formGrup, wajib: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#ba2b2b] focus:ring-[#ba2b2b] border-[#e0d5b8]"
                    />
                    <span className="text-xs font-bold text-[#1d3b2e]">
                      Wajib Dipilih oleh Pelanggan saat Memesan
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalGrupBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Grup"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isMounted && modalItemBuka && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalItemBuka(false);
          }}
          className="portal-modal-backdrop flex items-center justify-center p-3 sm:p-5 overflow-hidden"
        >
          <div className="relative bg-[#fbf6e9] border border-[#dcd3c1] rounded-[24px] max-w-lg w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <div>
                <h3 className="text-lg font-bold text-[#1d3b2e]">
                  {editItemId ? "Edit Opsi Item" : "Tambah Opsi Item"}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Grup: <span className="font-bold text-[#1d3b2e]">{grupAktifForItem?.nama}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {renderLabelPeranVisual(grupAktifForItem?.peran_visual)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalItemBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={simpanItem} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {pesanErrorForm.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    {pesanErrorForm.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Nama Opsi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      grupAktifForItem?.peran_visual === "ukuran"
                        ? "Contoh: Kecil (15 cm), Sedang (20 cm), Besar (25 cm)"
                        : grupAktifForItem?.peran_visual === "badan" || grupAktifForItem?.peran_visual === "krim"
                        ? "Contoh: Coklat, Vanilla, Red Velvet, Matcha"
                        : grupAktifForItem?.peran_visual === "topping"
                        ? "Contoh: Strawberry Segar, Lilin Ultah, Choco Chip"
                        : "Contoh: Tulisan di Kue, Kartu Ucapan, Lilin Angka"
                    }
                    value={formItem.nama}
                    onChange={(e) =>
                      setFormItem({ ...formItem, nama: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Harga Tambahan (Rp) <span className="text-rose-500">*</span>
                      {grupAktifForItem?.jenis_pilihan === "banyak" && (
                        <span className="block text-[11px] font-medium text-amber-700 mt-0.5">
                          Harga dihitung per buah
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={formItem.harga}
                      onChange={(e) =>
                        setFormItem({ ...formItem, harga: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Urutan
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formItem.urutan}
                      onChange={(e) =>
                        setFormItem({ ...formItem, urutan: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                    />
                  </div>
                </div>

                {grupAktifForItem?.peran_visual && (
                  <div className="p-3.5 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                        Kode Visual Studio 3D
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh kode visual..."
                        value={formItem.kode_visual}
                        onChange={(e) =>
                          setFormItem({ ...formItem, kode_visual: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-sm font-mono text-[#1d3b2e]"
                      />
                      {(() => {
                        const peran = grupAktifForItem.peran_visual;
                        const kodeList = KODE_STUDIO_PER_PERAN[peran] || [];
                        const val = formItem.kode_visual?.trim().toLowerCase();
                        const tidakDikenal = Boolean(val && kodeList.length > 0 && !kodeList.includes(val));

                        return (
                          <div className="mt-2 space-y-2">
                            {kodeList.length > 0 && (
                              <div>
                                <span className="block text-[11px] font-semibold text-stone-600 mb-1">
                                  Kode yang dikenal studio untuk peran &ldquo;{peran}&rdquo;:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {kodeList.map((kd) => (
                                    <button
                                      key={kd}
                                      type="button"
                                      onClick={() => setFormItem({ ...formItem, kode_visual: kd })}
                                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition border cursor-pointer ${
                                        val === kd
                                          ? "bg-[#ba2b2b] text-white border-[#ba2b2b]"
                                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                                      }`}
                                    >
                                      {kd}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tidakDikenal && (
                              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                                <i className="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
                                <span>
                                  Peringatan: Kode <strong>&ldquo;{formItem.kode_visual}&rdquo;</strong> tidak dikenal oleh studio 3D untuk peran ini. Studio akan menggunakan tampilan bawaan.
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {(grupAktifForItem.peran_visual === "badan" || grupAktifForItem.peran_visual === "krim") && (
                      <div className="pt-2 border-t border-[#dfd4bd] space-y-2">
                        <label className="block text-xs font-bold text-[#1d3b2e]">
                          Warna Hex ({grupAktifForItem.peran_visual === "badan" ? "Kue" : "Krim"})
                        </label>
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="color"
                            value={formItem.warna || (grupAktifForItem.peran_visual === "badan" ? "#5c3a21" : "#ffffff")}
                            onChange={(e) =>
                              setFormItem({ ...formItem, warna: e.target.value })
                            }
                            className="w-11 h-11 p-1 rounded-xl border border-[#dcd3c1] bg-white cursor-pointer"
                          />
                          <input
                            type="text"
                            placeholder="#ffffff"
                            value={formItem.warna}
                            onChange={(e) =>
                              setFormItem({ ...formItem, warna: e.target.value })
                            }
                            className="flex-1 px-3 py-2.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-mono font-bold text-[#1d3b2e]"
                          />
                        </div>

                        <div>
                          <span className="block text-[11px] font-bold text-stone-600 mb-1.5">
                            Pilihan Cepat Warna Populer:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {presetWarna.map((pw) => (
                              <button
                                key={pw.hex}
                                type="button"
                                onClick={() => setFormItem({ ...formItem, warna: pw.hex })}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                  formItem.warna?.toLowerCase() === pw.hex.toLowerCase()
                                    ? "bg-white border-[#ba2b2b] shadow-xs"
                                    : "bg-white/80 border-[#e0d5b8] hover:bg-white"
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-stone-300"
                                  style={{ backgroundColor: pw.hex }}
                                />
                                <span className="text-[#1d3b2e]">{pw.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formItem.aktif}
                      onChange={(e) =>
                        setFormItem({ ...formItem, aktif: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#ba2b2b] focus:ring-[#ba2b2b] border-[#e0d5b8]"
                    />
                    <span className="text-xs font-bold text-[#1d3b2e]">
                      Opsi Aktif (Tampil dan dapat dipilih pelanggan di form pemesanan)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalItemBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Item"}
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
