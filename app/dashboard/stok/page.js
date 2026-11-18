"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import ModalPesan from "@/components/ModalPesan";

export default function StokDashboardPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [daftarBahan, setDaftarBahan] = useState([]);
  const [sedangProses, setSedangProses] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">
            Inventori Stok Bahan Dapur
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Pantau ketersediaan bahan pembuatan kue dan perbarui jumlah stok fisik dapur.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={bukaModalTambahBahan}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Tambah Bahan</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-rose-500"></i>
            <p className="text-xs">Memuat data bahan...</p>
          </div>
        ) : daftarBahan.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-boxes-stacked text-3xl mb-2 block text-stone-300"></i>
            <p className="text-sm font-semibold text-stone-700">Belum ada data bahan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Nama Bahan</th>
                  <th className="py-3 px-4">Jumlah Stok</th>
                  <th className="py-3 px-4">Satuan</th>
                  <th className="py-3 px-4">Batas Minimum</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daftarBahan.map((b) => {
                  const menipis = Number(b.jumlah) <= Number(b.batas_minimum);
                  return (
                    <tr key={b.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {b.nama}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-base text-stone-900">
                        {b.jumlah}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 text-xs font-medium">
                        {b.satuan}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-xs">
                        {b.batas_minimum} {b.satuan}
                      </td>
                      <td className="py-3.5 px-4">
                        {menipis ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>Menipis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Aman</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => bukaModalSesuaikan(b, "tambah")}
                            className="p-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition cursor-pointer"
                            title="Tambah Jumlah Stok"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => bukaModalSesuaikan(b, "kurang")}
                            className="p-1.5 px-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs transition cursor-pointer"
                            title="Kurangi Jumlah Stok"
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => bukaModalEditBahan(b)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                                title="Edit Bahan"
                              >
                                <i className="fa-solid fa-pen-to-square text-xs"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHapusBahan(b)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Bahan"
                              >
                                <i className="fa-solid fa-trash text-xs"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalSesuaikanBuka && bahanAktif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {tipeSesuaikan === "tambah" ? "Tambah Stok" : "Kurangi Stok"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Bahan: <strong className="text-stone-800">{bahanAktif.nama}</strong> (Saat ini: {bahanAktif.jumlah} {bahanAktif.satuan})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSesuaikanBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {pesanError.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {pesanError.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleKirimSesuaikan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Jumlah yang Di{tipeSesuaikan === "tambah" ? "tambahkan" : "kurangkan"} ({bahanAktif.satuan})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  placeholder="Contoh: 5"
                  value={nilaiSesuaikan}
                  onChange={(e) => setNilaiSesuaikan(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalSesuaikanBuka(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-5 py-2 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalBahanBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editBahanId ? "Edit Bahan" : "Tambah Bahan Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalBahanBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {pesanError.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {pesanError.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleSimpanBahan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Bahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tepung Terigu Segitiga Biru"
                  value={formBahan.nama}
                  onChange={(e) =>
                    setFormBahan({ ...formBahan, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Satuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kg / butir / liter"
                    value={formBahan.satuan}
                    onChange={(e) =>
                      setFormBahan({ ...formBahan, satuan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                {!editBahanId && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Jumlah Awal
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formBahan.jumlah}
                      onChange={(e) =>
                        setFormBahan({ ...formBahan, jumlah: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Batas Minimum Peringatan
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formBahan.batas_minimum}
                    onChange={(e) =>
                      setFormBahan({ ...formBahan, batas_minimum: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalBahanBuka(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-5 py-2 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Bahan"}
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