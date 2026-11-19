"use client";

import { useState, useEffect } from "react";
import ModalPesan from "@/components/ModalPesan";

export default function AkunDashboardPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [daftarAkun, setDaftarAkun] = useState([]);
  const [sedangProses, setSedangProses] = useState(false);

  const [modalTambahBuka, setModalTambahBuka] = useState(false);
  const [formTambah, setFormTambah] = useState({
    nama: "",
    email: "",
    password: "",
    role: "staf",
    no_wa: "",
  });

  const [modalEditBuka, setModalEditBuka] = useState(false);
  const [editAkunId, setEditAkunId] = useState(null);
  const [formEdit, setFormEdit] = useState({
    nama: "",
    email: "",
    password: "",
    role: "staf",
    aktif: true,
    no_wa: "",
    isSaya: false,
  });

  const [pesanError, setPesanError] = useState([]);
  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatAkun() {
    setSedangMemuat(true);
    const res = await fetch("/api/akun");
    const hasil = await res.json();

    if (res.ok && hasil.akun) {
      setDaftarAkun(hasil.akun);
    }
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatAkun();
  }, []);

  function bukaModalTambah() {
    setFormTambah({
      nama: "",
      email: "",
      password: "",
      role: "staf",
      no_wa: "",
    });
    setPesanError([]);
    setModalTambahBuka(true);
  }

  async function handleSimpanTambah(e) {
    e.preventDefault();
    setPesanError([]);

    if (!formTambah.nama.trim()) {
      setPesanError(["Nama lengkap tidak boleh kosong."]);
      return;
    }
    if (!formTambah.email.trim()) {
      setPesanError(["Email tidak boleh kosong."]);
      return;
    }
    if (formTambah.password.length < 6) {
      setPesanError(["Password awal minimal 6 karakter."]);
      return;
    }

    setSedangProses(true);
    const res = await fetch("/api/akun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "tambah",
        ...formTambah,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanError([hasil.pesan || "Gagal membuat akun."]);
      return;
    }

    setModalTambahBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatAkun();
  }

  function bukaModalEdit(akun) {
    setEditAkunId(akun.id);
    setFormEdit({
      nama: akun.nama || "",
      email: akun.email || "",
      password: "",
      role: akun.role || "staf",
      aktif: Boolean(akun.aktif),
      no_wa: akun.no_wa || "",
      isSaya: Boolean(akun.isSaya),
    });
    setPesanError([]);
    setModalEditBuka(true);
  }

  async function handleSimpanEdit(e) {
    e.preventDefault();
    setPesanError([]);

    if (!formEdit.nama.trim()) {
      setPesanError(["Nama lengkap tidak boleh kosong."]);
      return;
    }

    if (formEdit.password && formEdit.password.length < 6) {
      setPesanError(["Password baru minimal 6 karakter."]);
      return;
    }

    setSedangProses(true);
    const res = await fetch("/api/akun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "edit",
        id: editAkunId,
        nama: formEdit.nama,
        role: formEdit.role,
        aktif: formEdit.aktif,
        password: formEdit.password,
        no_wa: formEdit.no_wa,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanError([hasil.pesan || "Gagal memperbarui akun."]);
      return;
    }

    setModalEditBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatAkun();
  }

  async function handleHapusAkun(akun) {
    if (akun.isSaya) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: "Anda tidak dapat menghapus akun Anda sendiri.",
        tipe: "error",
      });
      return;
    }

    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus akun "${akun.nama}" (${akun.email})? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!yakin) return;

    setSedangProses(true);
    const res = await fetch("/api/akun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus",
        id: akun.id,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus akun.",
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
    muatAkun();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={bukaModalTambah}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition shadow-sm cursor-pointer"
        >
          <i className="fa-solid fa-user-plus"></i>
          <span>Tambah Akun</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-rose-500"></i>
            <p className="text-xs">Memuat daftar akun...</p>
          </div>
        ) : daftarAkun.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-users text-3xl mb-2 block text-stone-300"></i>
            <p className="text-sm font-semibold text-stone-700">Belum ada akun terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Nama Pengguna</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daftarAkun.map((ak) => (
                  <tr key={ak.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      <div className="flex items-center space-x-2">
                        <span>{ak.nama}</span>
                        {ak.isSaya && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            Saya
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 text-xs">
                      {ak.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          ak.role === "admin"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {ak.role === "admin" ? "Administrator" : "Staf Produksi"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          ak.aktif
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ak.aktif ? "bg-emerald-500" : "bg-stone-400"
                          }`}
                        ></span>
                        <span>{ak.aktif ? "Aktif" : "Nonaktif"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => bukaModalEdit(ak)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Edit Akun"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        {!ak.isSaya && (
                          <button
                            type="button"
                            onClick={() => handleHapusAkun(ak)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Akun"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalTambahBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                Tambah Akun Staf / Admin
              </h3>
              <button
                type="button"
                onClick={() => setModalTambahBuka(false)}
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

            <form onSubmit={handleSimpanTambah} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formTambah.nama}
                  onChange={(e) =>
                    setFormTambah({ ...formTambah, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="staf@tokokue.com"
                  value={formTambah.email}
                  onChange={(e) =>
                    setFormTambah({ ...formTambah, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={formTambah.password}
                  onChange={(e) =>
                    setFormTambah({ ...formTambah, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Role Akun
                  </label>
                  <select
                    value={formTambah.role}
                    onChange={(e) =>
                      setFormTambah({ ...formTambah, role: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                  >
                    <option value="staf">Staf Produksi</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    No. WhatsApp (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formTambah.no_wa}
                    onChange={(e) =>
                      setFormTambah({ ...formTambah, no_wa: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalTambahBuka(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-5 py-2 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProses ? "Membuat Akun..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEditBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Edit Akun
                </h3>
                <p className="text-xs text-stone-500">{formEdit.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalEditBuka(false)}
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

            <form onSubmit={handleSimpanEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formEdit.nama}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Ganti Password Baru (kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  placeholder="Isi untuk mengganti password"
                  value={formEdit.password}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Role Akun
                  </label>
                  <select
                    disabled={formEdit.isSaya}
                    value={formEdit.role}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, role: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white disabled:bg-stone-50 disabled:text-stone-400"
                  >
                    <option value="staf">Staf Produksi</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formEdit.no_wa}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, no_wa: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={formEdit.isSaya}
                    checked={formEdit.aktif}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, aktif: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-400 border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Akun Aktif (Dapat login ke panel dashboard)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalEditBuka(false)}
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