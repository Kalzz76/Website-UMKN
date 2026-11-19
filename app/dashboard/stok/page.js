"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import ModalPesan from "@/components/ModalPesan";

export default function StokDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [daftarBahan, setDaftarBahan] = useState([]);
  const [sedangProses, setSedangProses] = useState(false);

  const [kataKunciCari, setKataKunciCari] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  const [modalSesuaikanBuka, setModalSesuaikanBuka] = useState(false);
  const [bahanAktif, setBahanAktif] = useState(null);
  const [nilaiSesuaikan, setNilaiSesuaikan] = useState("");
  const [tipeSesuaikan, setTipeSesuaikan] = useState("tambah");

  const [modalBahanBuka, setModalBahanBuka] = useState(false);
  const [editBahanId, setEditBahanId] = useState(null);
  const [formBahan, setFormBahan] = useState({
    nama: "",
    satuan: "kg",
    jumlah: 0,
    batas_minimum: 5,
  });

  const [pesanError, setPesanError] = useState([]);
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
    if (modalSesuaikanBuka || modalBahanBuka || notifikasi.terbuka) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalSesuaikanBuka, modalBahanBuka, notifikasi.terbuka]);

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSedangMemuat(false);
      return;
    }

    const { data: prof } = await supabase
      .from("profil")
      .select("role, nama")
      .eq("id", user.id)
      .single();

    if (prof) setProfil(prof);

    const { data: bList } = await supabase
      .from("bahan")
      .select("*")
      .order("nama", { ascending: true });

    if (bList) setDaftarBahan(bList);
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  function bukaModalSesuaikan(bahan, tipe = "tambah") {
    setBahanAktif(bahan);
    setTipeSesuaikan(tipe);
    setNilaiSesuaikan("");
    setPesanError([]);
    setModalSesuaikanBuka(true);
  }

  async function handleKirimSesuaikan(e) {
    e.preventDefault();
    setPesanError([]);

    const val = Number(nilaiSesuaikan);
    if (isNaN(val) || val <= 0) {
      setPesanError(["Jumlah harus berupa angka lebih dari 0."]);
      return;
    }

    const delta = tipeSesuaikan === "tambah" ? val : -val;
    if (tipeSesuaikan === "kurang" && Number(bahanAktif.jumlah) - val < 0) {
      setPesanError(["Jumlah pengurangan melebihi sisa stok bahan saat ini."]);
      return;
    }

    setSedangProses(true);
    const res = await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "sesuaikan_jumlah",
        id: bahanAktif.id,
        perubahan: delta,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanError([hasil.pesan || "Gagal memperbarui stok."]);
      return;
    }

    setModalSesuaikanBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  function bukaModalTambahBahan() {
    setEditBahanId(null);
    setFormBahan({
      nama: "",
      satuan: "kg",
      jumlah: 0,
      batas_minimum: 5,
    });
    setPesanError([]);
    setModalBahanBuka(true);
  }

  function bukaModalEditBahan(bahan) {
    setEditBahanId(bahan.id);
    setFormBahan({
      nama: bahan.nama,
      satuan: bahan.satuan,
      jumlah: Number(bahan.jumlah),
      batas_minimum: Number(bahan.batas_minimum),
    });
    setPesanError([]);
    setModalBahanBuka(true);
  }

  async function handleSimpanBahan(e) {
    e.preventDefault();
    setPesanError([]);

    if (!formBahan.nama.trim()) {
      setPesanError(["Nama bahan tidak boleh kosong."]);
      return;
    }
    if (!formBahan.satuan.trim()) {
      setPesanError(["Satuan bahan tidak boleh kosong."]);
      return;
    }

    setSedangProses(true);
    const aksi = editBahanId ? "edit_bahan" : "tambah_bahan";
    const res = await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editBahanId,
        nama: formBahan.nama,
        satuan: formBahan.satuan,
        jumlah: Number(formBahan.jumlah),
        batas_minimum: Number(formBahan.batas_minimum),
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanError([hasil.pesan || "Gagal menyimpan bahan."]);
      return;
    }

    setModalBahanBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function handleHapusBahan(bahan) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus data bahan "${bahan.nama}"?`
    );
    if (!yakin) return;

    setSedangProses(true);
    const res = await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_bahan",
        id: bahan.id,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus bahan.",
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

  const isAdmin = profil?.role === "admin";

  const totalBahan = daftarBahan.length;
  const daftarMenipis = daftarBahan.filter(
    (b) => Number(b.jumlah) <= Number(b.batas_minimum)
  );
  const totalMenipis = daftarMenipis.length;
  const totalAman = totalBahan - totalMenipis;

  const bahanTersaring = daftarBahan.filter((b) => {
    const namaCocok = b.nama
      .toLowerCase()
      .includes(kataKunciCari.trim().toLowerCase());
    const isMenipis = Number(b.jumlah) <= Number(b.batas_minimum);

    if (filterStatus === "menipis") return namaCocok && isMenipis;
    if (filterStatus === "aman") return namaCocok && !isMenipis;
    return namaCocok;
  });

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Kelola Stok & Inventaris Bahan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Pantau persediaan bahan baku kue, lakukan penyesuaian stok masuk/keluar harian, dan pantau peringatan bahan menipis
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={bukaModalTambahBahan}
            className="h-[42px] px-5 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer shadow-sm inline-flex items-center justify-center space-x-2 flex-shrink-0"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Tambah Bahan Baru</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="content-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1d3b2e]">
              {totalBahan}
            </div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Total Jenis Bahan
            </div>
          </div>
        </div>

        <div className="content-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#d8e3cf] border border-[#bad1ab] text-[#215934] flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-[#215934]">
              {totalAman}
            </div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Stok Aman & Mencukupi
            </div>
          </div>
        </div>

        <div className={`content-card p-5 flex items-center space-x-4 ${totalMenipis > 0 ? "border-rose-300 bg-[#fff5f5]" : ""}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-xs ${
            totalMenipis > 0
              ? "bg-rose-100 border border-rose-200 text-rose-700"
              : "bg-[#ede2cd] border border-[#dfd4bd] text-stone-600"
          }`}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <div className={`text-2xl font-black ${totalMenipis > 0 ? "text-rose-700" : "text-stone-700"}`}>
              {totalMenipis}
            </div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Bahan Menipis (Perlu Restok)
            </div>
          </div>
        </div>
      </div>

      <div className="content-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8dfc8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-sm font-bold shadow-xs">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Daftar Persediaan Bahan
              </h3>
              <p className="text-[11px] text-stone-500">
                Menampilkan {bahanTersaring.length} dari {totalBahan} bahan baku
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
              <input
                type="text"
                placeholder="Cari nama bahan..."
                value={kataKunciCari}
                onChange={(e) => setKataKunciCari(e.target.value)}
                className="h-[38px] pl-9 pr-3.5 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e] w-48 sm:w-56"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-[38px] px-3 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e] cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="menipis">Stok Menipis Saja</option>
              <option value="aman">Stok Aman Saja</option>
            </select>
          </div>
        </div>

        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-[#ba2b2b]"></i>
            <p className="text-xs font-semibold">Memuat data persediaan bahan...</p>
          </div>
        ) : bahanTersaring.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-boxes-stacked text-3xl mb-2 block text-stone-300"></i>
            <p className="text-sm font-bold text-stone-700">
              {kataKunciCari || filterStatus !== "semua"
                ? "Tidak ada bahan yang cocok dengan pencarian atau filter."
                : "Belum ada data persediaan bahan."}
            </p>
            {isAdmin && (
              <p className="text-xs text-stone-400 mt-1">
                Klik tombol &quot;Tambah Bahan Baru&quot; untuk mulai mencatat stok.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase text-xs font-bold border-y border-[#dfd4bd]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl w-14">No.</th>
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-4">Sisa Stok</th>
                  <th className="py-3 px-4">Batas Minimum</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Penyesuaian Cepat</th>
                  <th className="py-3 px-4 text-right rounded-r-xl w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede2cd]">
                {bahanTersaring.map((b, idx) => {
                  const menipis = Number(b.jumlah) <= Number(b.batas_minimum);
                  return (
                    <tr key={b.id} className="hover:bg-[#f7f2e4]/70 transition">
                      <td className="py-3.5 px-4 font-bold text-stone-600 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1d3b2e]">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-[#1d3b2e]/30"></span>
                          <span>{b.nama}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline space-x-1.5">
                          <span className={`text-base font-black ${menipis ? "text-rose-700" : "text-[#1d3b2e]"}`}>
                            {b.jumlah}
                          </span>
                          <span className="text-xs font-bold text-stone-500">
                            {b.satuan}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-[#ede2cd] text-stone-700 border border-[#dfd4bd] text-xs font-semibold">
                          Min. {b.batas_minimum} {b.satuan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {menipis ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            <span>Menipis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d8e3cf] text-[#215934] border border-[#bad1ab]">
                            <span className="w-2 h-2 rounded-full bg-[#215934]"></span>
                            <span>Aman</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => bukaModalSesuaikan(b, "tambah")}
                            className="h-[32px] px-3 rounded-xl bg-[#d8e3cf] hover:bg-[#cbe0bf] text-[#215934] border border-[#bad1ab] font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer shadow-xs"
                            title="Tambah Stok Masuk"
                          >
                            <i className="fa-solid fa-plus text-[10px]"></i>
                            <span>Masuk</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => bukaModalSesuaikan(b, "kurang")}
                            className="h-[32px] px-3 rounded-xl bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 border border-[#f0c2c2] font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer shadow-xs"
                            title="Kurangi Stok Keluar / Terpakai"
                          >
                            <i className="fa-solid fa-minus text-[10px]"></i>
                            <span>Keluar</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => bukaModalEditBahan(b)}
                              className="w-8 h-8 rounded-lg border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] inline-flex items-center justify-center transition cursor-pointer"
                              title="Edit Bahan"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHapusBahan(b)}
                              className="w-8 h-8 rounded-lg border border-[#f0c2c2] bg-[#fde8e8] hover:bg-[#fbd0d0] text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
                              title="Hapus Bahan"
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs">-</span>
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

      {isMounted && modalSesuaikanBuka && bahanAktif && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalSesuaikanBuka(false);
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
          <div className="relative bg-[#fbf6e9] border-2 border-[#e8dfc8] rounded-[24px] max-w-sm w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  {tipeSesuaikan === "tambah" ? "Tambah Stok Masuk" : "Catat Stok Keluar"}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Bahan: <strong className="text-[#1d3b2e]">{bahanAktif.nama}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSesuaikanBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleKirimSesuaikan} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Stok Saat Ini:</span>
                  <span className="text-sm font-black text-[#1d3b2e]">
                    {bahanAktif.jumlah} {bahanAktif.satuan}
                  </span>
                </div>

                {pesanError.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    {pesanError.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1.5">
                    Jumlah yang Di{tipeSesuaikan === "tambah" ? "tambahkan" : "kurangkan"} ({bahanAktif.satuan}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="Contoh: 5"
                    value={nilaiSesuaikan}
                    onChange={(e) => setNilaiSesuaikan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-sm font-bold text-[#1d3b2e]"
                    autoFocus
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-stone-600 mb-1.5">
                    Pilihan Cepat Kuantitas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[1, 5, 10, 25].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNilaiSesuaikan(String(amt))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          nilaiSesuaikan === String(amt)
                            ? "bg-[#ba2b2b] text-white border-[#ba2b2b]"
                            : "bg-white border-[#e0d5b8] text-[#1d3b2e] hover:bg-[#ede2cd]"
                        }`}
                      >
                        {tipeSesuaikan === "tambah" ? `+${amt}` : `-${amt}`} {bahanAktif.satuan}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalSesuaikanBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Penyesuaian"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isMounted && modalBahanBuka && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalBahanBuka(false);
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
          <div className="relative bg-[#fbf6e9] border-2 border-[#e8dfc8] rounded-[24px] max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <h3 className="text-lg font-bold text-[#1d3b2e]">
                {editBahanId ? "Edit Data Bahan" : "Tambah Bahan Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalBahanBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSimpanBahan} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {pesanError.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    {pesanError.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Nama Bahan Baku <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tepung Terigu Segitiga Biru, Mentega Anchor"
                    value={formBahan.nama}
                    onChange={(e) =>
                      setFormBahan({ ...formBahan, nama: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Satuan Takaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="kg / butir / liter / box"
                      value={formBahan.satuan}
                      onChange={(e) =>
                        setFormBahan({ ...formBahan, satuan: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                    />
                  </div>

                  {!editBahanId && (
                    <div>
                      <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                        Jumlah Stok Awal
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formBahan.jumlah}
                        onChange={(e) =>
                          setFormBahan({ ...formBahan, jumlah: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Batas Minimum Peringatan
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formBahan.batas_minimum}
                      onChange={(e) =>
                        setFormBahan({
                          ...formBahan,
                          batas_minimum: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e0d5b8] bg-white outline-none focus:border-[#ba2b2b] text-sm text-[#1d3b2e]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalBahanBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Bahan"}
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
