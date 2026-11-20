"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function HargaOpsiPage() {
  const [profil, setProfil] = useState(null);
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

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Kelola Harga Opsi Kustomisasi
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur harga dan tarif setiap opsi kue. Perubahan harga langsung berlaku untuk pesanan baru.
          </p>
        </div>

        {daftarGrup.length > 0 && (
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={toggleSemuaGrup}
              className="h-[40px] px-4 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-xs"
            >
              <i className={`fa-solid ${apakahSemuaTutup ? "fa-angles-down" : "fa-angles-up"} text-xs`} />
              <span>{apakahSemuaTutup ? "Buka Semua" : "Tutup Semua"}</span>
            </button>
          </div>
        )}
      </div>

      {sedangMemuat ? (
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
                  itemGrup.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500 bg-[#f7f2e4] rounded-2xl border border-dashed border-[#dfd4bd]">
                      Belum ada item di dalam grup ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-xs font-bold border-y border-[#dfd4bd]">
                          <tr>
                            <th className="py-3 px-3.5 rounded-l-xl w-12 text-center">No.</th>
                            <th className="py-3 px-3.5 whitespace-nowrap">Nama Opsi</th>
                            <th className="py-3 px-3.5 whitespace-nowrap">
                              {grup.peran_visual === "ukuran"
                                ? "Ukuran Visual"
                                : grup.peran_visual === "bentuk"
                                ? "Bentuk Visual"
                                : grup.peran_visual === "badan" || grup.peran_visual === "krim"
                                ? "Warna Visual"
                                : grup.peran_visual === "topping"
                                ? "Ikon Dekorasi"
                                : grup.peran_visual === "stiker"
                                ? "Stiker / Ikon"
                                : "Format"}
                            </th>
                            <th className="py-3 px-3.5 whitespace-nowrap">
                              {grup.peran_visual === "stiker" ? "Harga (per buah)" : "Harga"}
                            </th>
                            <th className="py-3 px-3.5 text-right rounded-r-xl w-32 whitespace-nowrap">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ede2cd]">
                          {itemGrup.map((item, idx) => {
                            const isSedangEdit = editItemId === item.id;
                            const isSedangSimpan = sedangSimpanId === item.id;

                            return (
                              <tr
                                key={item.id}
                                className={`transition ${
                                  isSedangEdit ? "bg-amber-50/80" : "hover:bg-[#f7f2e4]/70"
                                }`}
                              >
                                <td className="py-3 px-3.5 font-bold text-stone-600 text-xs text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3.5 font-bold text-[#1d3b2e]">
                                  {item.nama}
                                </td>
                                <td className="py-3 px-3.5">
                                  {renderVisualItem(item, grup.peran_visual)}
                                </td>
                                <td className="py-3 px-3.5 font-bold text-stone-800">
                                  {isSedangEdit ? (
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-xs font-bold text-stone-500">Rp</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={inputHarga}
                                        onChange={(e) => setInputHarga(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") simpanHarga(item.id);
                                          if (e.key === "Escape") batalEditHarga();
                                        }}
                                        autoFocus
                                        className="w-28 sm:w-36 px-2.5 py-1 text-xs font-bold rounded-lg border border-[#ba2b2b] bg-white outline-none focus:ring-1 focus:ring-[#ba2b2b]"
                                      />
                                    </div>
                                  ) : (
                                    <span
                                      onClick={() => mulaiEditHarga(item)}
                                      className="cursor-pointer hover:text-[#ba2b2b] transition"
                                      title="Klik untuk ubah harga"
                                    >
                                      {item.harga === 0 ? "Gratis (Rp 0)" : formatRupiah(item.harga)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                  {isSedangEdit ? (
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <button
                                        type="button"
                                        disabled={isSedangSimpan}
                                        onClick={() => simpanHarga(item.id)}
                                        className="px-3 py-1 rounded-lg bg-[#17382d] hover:bg-[#122e25] text-white text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-50 inline-flex items-center space-x-1"
                                      >
                                        <i className="fa-solid fa-check text-[10px]" />
                                        <span>{isSedangSimpan ? "Menyimpan..." : "Simpan"}</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isSedangSimpan}
                                        onClick={batalEditHarga}
                                        className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end space-x-1.5">
                                      {profil?.role === "admin" && (
                                        <button
                                          type="button"
                                          onClick={() => bukaModalResep(item)}
                                          className="px-2.5 py-1 rounded-lg border border-[#dfd4bd] bg-white hover:bg-[#ede2cd] text-[#1d3b2e] text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                                          title="Atur bahan yang dipakai opsi ini"
                                        >
                                          <i className="fa-solid fa-wheat-awn text-[10px] text-amber-700" />
                                          <span>Bahan</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => mulaiEditHarga(item)}
                                        className="px-3 py-1 rounded-lg border border-[#dfd4bd] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                                      >
                                        <i className="fa-solid fa-tag text-[10px]" />
                                        <span>Ubah Harga</span>
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
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalResepBuka && itemResepAktif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#fbf8f1] border border-[#dfd4bd] rounded-3xl p-6 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfd4bd]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e] flex items-center gap-2">
                  <i className="fa-solid fa-wheat-awn text-amber-700" />
                  <span>Bahan yang Dipakai</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Opsi: <span className="font-bold text-[#1d3b2e]">{itemResepAktif.nama}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalResepBuka(false);
                  setItemResepAktif(null);
                }}
                className="w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-100 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="py-3">
              <p className="text-xs text-stone-600 bg-[#ede2cd]/60 border border-[#dfd4bd] rounded-xl p-3 font-medium">
                Untuk grup yang boleh dipilih banyak, jumlah dikalikan banyaknya pilihan. Isi bahan dasar di grup Ukuran.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
              {sedangMemuatResep ? (
                <div className="py-8 text-center text-stone-400">
                  <i className="fa-solid fa-circle-notch fa-spin text-2xl text-amber-600 mb-2" />
                  <p className="text-xs">Memuat bahan...</p>
                </div>
              ) : barisResep.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500 bg-white/70 border border-dashed border-[#dfd4bd] rounded-2xl">
                  Belum ada bahan yang dikaitkan ke opsi ini.
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
