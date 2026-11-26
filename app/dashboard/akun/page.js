"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ModalPesan from "@/components/ModalPesan";

export default function AkunDashboardPage() {
  const router = useRouter();
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [daftarAkun, setDaftarAkun] = useState([]);
  const [sedangProses, setSedangProses] = useState(false);

  const [kataKunciCari, setKataKunciCari] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");

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
    if (res.status === 403) {
      router.replace("/dashboard");
      return;
    }
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

    setNotifikasi({
      terbuka: true,
      judul: "Hapus Akun?",
      pesan: `Apakah Anda yakin ingin menghapus akun "${akun.nama}" (${akun.email})? Tindakan ini tidak dapat dibatalkan.`,
      tipe: "konfirmasi",
      onKonfirmasi: () => prosesHapusAkun(akun),
    });
  }

  async function prosesHapusAkun(akun) {
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

  const totalAkun = daftarAkun.length;
  const totalAdmin = daftarAkun.filter((a) => a.role === "admin").length;
  const totalStaf = daftarAkun.filter((a) => a.role === "staf").length;
  const totalAktif = daftarAkun.filter((a) => a.aktif).length;

  const akunTersaring = daftarAkun.filter((ak) => {
    const kataKunci = kataKunciCari.trim().toLowerCase();
    const cocokCari =
      !kataKunci ||
      ak.nama?.toLowerCase().includes(kataKunci) ||
      ak.email?.toLowerCase().includes(kataKunci) ||
      ak.no_wa?.toLowerCase().includes(kataKunci);

    const cocokRole =
      filterRole === "semua" || ak.role === filterRole;

    const cocokStatus =
      filterStatus === "semua" ||
      (filterStatus === "aktif" && ak.aktif) ||
      (filterStatus === "nonaktif" && !ak.aktif);

    return cocokCari && cocokRole && cocokStatus;
  });

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Kelola Akun & Hak Akses Pengguna
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola akun administrator dan staf produksi yang memiliki akses ke dashboard Cravely Bakery
          </p>
        </div>

        <button
          type="button"
          onClick={bukaModalTambah}
          className="h-[42px] px-5 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer inline-flex items-center justify-center space-x-2 flex-shrink-0 shadow-xs"
        >
          <i className="fa-solid fa-user-plus text-xs"></i>
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="content-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-xl flex-shrink-0">
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1d3b2e]">{totalAkun}</div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Total Pengguna
            </div>
          </div>
        </div>

        <div className="content-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center text-xl flex-shrink-0">
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-800">{totalAdmin}</div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Administrator
            </div>
          </div>
        </div>

        <div className="content-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center text-xl flex-shrink-0">
            <i className="fa-solid fa-kitchen-set"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-800">{totalStaf}</div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Staf Produksi
            </div>
          </div>
        </div>

        <div className="content-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#d8e3cf] border border-[#bad1ab] text-[#215934] flex items-center justify-center text-xl flex-shrink-0">
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-[#215934]">{totalAktif}</div>
            <div className="text-xs font-bold text-stone-500 mt-0.5">
              Akun Aktif
            </div>
          </div>
        </div>
      </div>

      <div className="content-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#e8dfc8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-id-card-clip"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Daftar Pengguna Sistem
              </h3>
              <p className="text-[11px] text-stone-500">
                Menampilkan {akunTersaring.length} dari {totalAkun} akun terdaftar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
              <input
                type="text"
                placeholder="Cari nama / email..."
                value={kataKunciCari}
                onChange={(e) => setKataKunciCari(e.target.value)}
                className="h-[38px] pl-10 pr-3.5 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e] w-48 sm:w-56 shadow-none"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-[38px] px-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e] cursor-pointer shadow-none"
            >
              <option value="semua">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="staf">Staf Produksi</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-[38px] px-3 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e] cursor-pointer shadow-none"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Akun Aktif</option>
              <option value="nonaktif">Akun Nonaktif</option>
            </select>
          </div>
        </div>

        {sedangMemuat ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-[#ba2b2b]"></i>
            <p className="text-xs font-semibold">Memuat daftar akun...</p>
          </div>
        ) : akunTersaring.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-users text-3xl mb-2 block text-stone-300"></i>
            <p className="text-sm font-bold text-stone-700">Tidak ada akun yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#dfd4bd] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ede2cd] text-[#1d3b2e] uppercase font-bold border-b border-[#dfd4bd]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Email Login</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede2cd]">
                {akunTersaring.map((ak, idx) => {
                  const inisial = (ak.nama || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={ak.id} className="hover:bg-[#f7f2e4]/70 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-stone-500 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1d3b2e]">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] flex items-center justify-center font-black text-xs flex-shrink-0 shadow-2xs">
                            {inisial}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-stone-900 text-xs">{ak.nama}</span>
                              {ak.isSaya && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300">
                                  Saya
                                </span>
                              )}
                            </div>
                            {ak.no_wa && (
                              <span className="text-[10px] font-medium text-stone-500 block mt-0.5">
                                <i className="fa-brands fa-whatsapp text-emerald-600 mr-1"></i>
                                {ak.no_wa}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 text-xs font-medium">
                        <div className="flex items-center space-x-1.5">
                          <i className="fa-regular fa-envelope text-stone-400 text-xs"></i>
                          <span>{ak.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            ak.role === "admin"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-[#d8e3cf] text-[#215934] border-[#bad1ab]"
                          }`}
                        >
                          <i className={`text-[10px] ${ak.role === "admin" ? "fa-solid fa-user-shield" : "fa-solid fa-kitchen-set"}`} />
                          <span>{ak.role === "admin" ? "Administrator" : "Staf Produksi"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            ak.aktif
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ak.aktif ? "bg-emerald-600" : "bg-stone-400"
                            }`}
                          ></span>
                          <span>{ak.aktif ? "Aktif" : "Nonaktif"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => bukaModalEdit(ak)}
                            className="h-[32px] px-3 rounded-xl border border-[#dfd4bd] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                            title="Edit Data Akun"
                          >
                            <i className="fa-solid fa-pen-to-square text-[10px] text-amber-700"></i>
                            <span>Edit</span>
                          </button>

                          {!ak.isSaya && (
                            <button
                              type="button"
                              onClick={() => handleHapusAkun(ak)}
                              className="h-[32px] px-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer"
                              title="Hapus Akun"
                            >
                              <i className="fa-solid fa-trash-can text-[10px]"></i>
                            </button>
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

      {modalTambahBuka && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalTambahBuka(false);
          }}
          className="fixed inset-0 !mt-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs overflow-hidden"
        >
          <div className="relative bg-[#fbf6e9] border border-[#dcd3c1] rounded-[24px] max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Tambah Akun Pengguna Baru
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Buat akun untuk staf atau admin baru
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTambahBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSimpanTambah} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
                {pesanError.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    {pesanError.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Nama Lengkap <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formTambah.nama}
                    onChange={(e) =>
                      setFormTambah({ ...formTambah, nama: e.target.value })
                    }
                    className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Email Login <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staf@cravely.com"
                    value={formTambah.email}
                    onChange={(e) =>
                      setFormTambah({ ...formTambah, email: e.target.value })
                    }
                    className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Password Awal <span className="text-rose-600">*</span>
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
                    className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Role Hak Akses
                    </label>
                    <select
                      value={formTambah.role}
                      onChange={(e) =>
                        setFormTambah({ ...formTambah, role: e.target.value })
                      }
                      className="w-full h-[40px] px-3 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e] cursor-pointer"
                    >
                      <option value="staf">Staf Produksi</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      No. WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={formTambah.no_wa}
                      onChange={(e) =>
                        setFormTambah({ ...formTambah, no_wa: e.target.value })
                      }
                      className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalTambahBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {sedangProses ? "Membuat Akun..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEditBuka && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEditBuka(false);
          }}
          className="fixed inset-0 !mt-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs overflow-hidden"
        >
          <div className="relative bg-[#fbf6e9] border border-[#dcd3c1] rounded-[24px] max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#e8dfc8] bg-[#fbf6e9]">
              <div>
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Edit Data Akun
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">{formEdit.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalEditBuka(false)}
                className="w-8 h-8 rounded-xl border border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSimpanEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
                {pesanError.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    {pesanError.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Nama Lengkap <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formEdit.nama}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, nama: e.target.value })
                    }
                    className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                    Ganti Password Baru (opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak ingin mengganti"
                    value={formEdit.password}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, password: e.target.value })
                    }
                    className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      Role Hak Akses
                    </label>
                    <select
                      disabled={formEdit.isSaya}
                      value={formEdit.role}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, role: e.target.value })
                      }
                      className="w-full h-[40px] px-3 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-bold text-[#1d3b2e] cursor-pointer disabled:bg-stone-100 disabled:text-stone-400"
                    >
                      <option value="staf">Staf Produksi</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1d3b2e] mb-1">
                      No. WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formEdit.no_wa}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, no_wa: e.target.value })
                      }
                      className="w-full h-[40px] px-3.5 rounded-xl border border-[#dcd1be] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer p-3 rounded-xl bg-white border border-[#dcd1be]">
                    <input
                      type="checkbox"
                      disabled={formEdit.isSaya}
                      checked={formEdit.aktif}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, aktif: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#ba2b2b] focus:ring-[#ba2b2b] border-[#dcd1be]"
                    />
                    <span className="text-xs font-bold text-[#1d3b2e]">
                      Akun Aktif (Dapat masuk ke dashboard Cravely)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-[#e8dfc8] bg-[#f8f3e5]">
                <button
                  type="button"
                  onClick={() => setModalEditBuka(false)}
                  className="h-[40px] px-5 rounded-xl border border-[#dcd1be] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
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
        onKonfirmasi={notifikasi.onKonfirmasi}
        onTutup={() => setNotifikasi({ ...notifikasi, terbuka: false, onKonfirmasi: null })}
      />
    </div>
  );
}
