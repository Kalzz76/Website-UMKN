"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardProfilPage() {
  const [sedangMuat, setSedangMuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [statistik, setStatistik] = useState({});
  const [tabAktif, setTabAktif] = useState("datadiri");

  const [formProfil, setFormProfil] = useState({
    nama: "",
    no_wa: "",
  });
  const [sedangSimpanData, setSedangSimpanData] = useState(false);
  const [pesanSuksesData, setPesanSuksesData] = useState("");
  const [pesanErrorData, setPesanErrorData] = useState("");

  const [formSandi, setFormSandi] = useState({
    kataSandiLama: "",
    kataSandiBaru: "",
    konfirmasiSandi: "",
  });
  const [lihatSandiLama, setLihatSandiLama] = useState(false);
  const [lihatSandiBaru, setLihatSandiBaru] = useState(false);
  const [lihatKonfirmasi, setLihatKonfirmasi] = useState(false);
  const [sedangGantiSandi, setSedangGantiSandi] = useState(false);
  const [pesanSuksesSandi, setPesanSuksesSandi] = useState("");
  const [pesanErrorSandi, setPesanErrorSandi] = useState("");

  async function muatProfil() {
    setSedangMuat(true);
    try {
      const res = await fetch("/api/profil");
      const data = await res.json();
      if (res.ok && data.profil) {
        setProfil(data.profil);
        setFormProfil({
          nama: data.profil.nama || "",
          no_wa: data.profil.no_wa || "",
        });
        setStatistik(data.statistik || {});
      }
    } catch (err) {
      setPesanErrorData("Gagal memuat informasi profil.");
    } finally {
      setSedangMuat(false);
    }
  }

  useEffect(() => {
    muatProfil();
  }, []);

  async function handleSimpanProfil(e) {
    e.preventDefault();
    setPesanSuksesData("");
    setPesanErrorData("");

    if (!formProfil.nama.trim()) {
      setPesanErrorData("Nama lengkap tidak boleh kosong.");
      return;
    }

    setSedangSimpanData(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formProfil.nama.trim(),
          no_wa: formProfil.no_wa.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPesanErrorData(data.pesan || "Gagal memperbarui profil.");
      } else {
        setPesanSuksesData(data.pesan || "Profil berhasil diperbarui.");
        if (data.profil) {
          setProfil(data.profil);
        }
      }
    } catch (err) {
      setPesanErrorData("Terjadi kesalahan jaringan.");
    } finally {
      setSedangSimpanData(false);
    }
  }

  async function handleGantiSandi(e) {
    e.preventDefault();
    setPesanSuksesSandi("");
    setPesanErrorSandi("");

    if (!formSandi.kataSandiLama) {
      setPesanErrorSandi("Masukkan kata sandi saat ini.");
      return;
    }

    if (!formSandi.kataSandiBaru) {
      setPesanErrorSandi("Masukkan kata sandi baru.");
      return;
    }

    if (formSandi.kataSandiBaru.length < 6) {
      setPesanErrorSandi("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (formSandi.kataSandiBaru !== formSandi.konfirmasiSandi) {
      setPesanErrorSandi("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSedangGantiSandi(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kataSandiLama: formSandi.kataSandiLama,
          kataSandiBaru: formSandi.kataSandiBaru,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPesanErrorSandi(data.pesan || "Gagal mengganti kata sandi.");
      } else {
        setPesanSuksesSandi("Kata sandi berhasil diperbarui.");
        setFormSandi({
          kataSandiLama: "",
          kataSandiBaru: "",
          konfirmasiSandi: "",
        });
      }
    } catch (err) {
      setPesanErrorSandi("Terjadi kesalahan jaringan.");
    } finally {
      setSedangGantiSandi(false);
    }
  }

  function formatTanggal(tglStr) {
    if (!tglStr) return "-";
    try {
      const d = new Date(tglStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return tglStr;
    }
  }

  if (sedangMuat) {
    return (
      <div className="content-card p-12 text-center text-stone-400">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-[#ba2b2b]"></i>
        <p className="text-xs font-bold text-[#1d3b2e]">Memuat profil pengguna...</p>
      </div>
    );
  }

  const role = profil?.role || "staf";
  const inisial = (profil?.nama || "P").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1d3b2e]">
            Profil Pengguna
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola data diri, kontak WhatsApp koordinasi, dan keamanan sandi akun {role === "admin" ? "Administrator" : "Staf Produksi"}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <span
            className={`h-[36px] px-3.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 border ${
              role === "admin"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <i
              className={`fa-solid ${
                role === "admin" ? "fa-user-shield" : "fa-kitchen-set"
              } text-xs`}
            ></i>
            <span>{role === "admin" ? "Administrator" : "Staf Produksi"}</span>
          </span>

          <span className="h-[36px] px-3 rounded-xl font-bold text-xs bg-[#d8e3cf] border border-[#bad1ab] text-[#215934] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#215934] animate-pulse"></span>
            <span>Aktif</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="content-card p-6 text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#1d3b2e] text-[#f4ecd8] border-2 border-[#dfd4bd] shadow-sm flex items-center justify-center font-black text-2xl mx-auto">
                {inisial}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white">
                <i className="fa-solid fa-check"></i>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-[#1d3b2e]">
                {profil?.nama || "Pengguna"}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {profil?.email || "-"}
              </p>
            </div>

            <div className="pt-3 border-t border-[#ede2cd] space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-2 text-stone-400">
                  <i className="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                  <span>WhatsApp</span>
                </span>
                <span className="font-bold text-[#1d3b2e]">
                  {profil?.no_wa || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-2 text-stone-400">
                  <i className="fa-solid fa-shield-halved text-amber-600 text-sm"></i>
                  <span>Peran</span>
                </span>
                <span className="font-bold text-[#1d3b2e]">
                  {role === "admin" ? "Administrator" : "Staf Produksi"}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-2 text-stone-400">
                  <i className="fa-regular fa-calendar-check text-stone-400 text-sm"></i>
                  <span>Bergabung</span>
                </span>
                <span className="font-medium text-stone-600">
                  {formatTanggal(profil?.dibuat_pada)}
                </span>
              </div>
            </div>
          </div>

          <div className="content-card p-3 space-y-1">
            <button
              type="button"
              onClick={() => setTabAktif("datadiri")}
              className={`w-full h-[42px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                tabAktif === "datadiri"
                  ? "bg-[#ba2b2b] text-white shadow-xs"
                  : "text-[#1d3b2e] hover:bg-[#ede2cd]/50"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i className="fa-regular fa-address-card text-xs"></i>
                <span>Data Diri & Kontak</span>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] opacity-70"></i>
            </button>

            <button
              type="button"
              onClick={() => setTabAktif("keamanan")}
              className={`w-full h-[42px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                tabAktif === "keamanan"
                  ? "bg-[#ba2b2b] text-white shadow-xs"
                  : "text-[#1d3b2e] hover:bg-[#ede2cd]/50"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i className="fa-solid fa-key text-xs"></i>
                <span>Keamanan Kata Sandi</span>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] opacity-70"></i>
            </button>

            <button
              type="button"
              onClick={() => setTabAktif("wewenang")}
              className={`w-full h-[42px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                tabAktif === "wewenang"
                  ? "bg-[#ba2b2b] text-white shadow-xs"
                  : "text-[#1d3b2e] hover:bg-[#ede2cd]/50"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i className="fa-solid fa-clipboard-list text-xs"></i>
                <span>Wewenang & Hak Akses</span>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] opacity-70"></i>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          {tabAktif === "datadiri" && (
            <div className="content-card p-6 sm:p-7">
              <div className="pb-4 mb-6 border-b border-[#ede2cd]">
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Data Diri & Kontak
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Perbarui nama lengkap dan nomor WhatsApp aktif Anda
                </p>
              </div>

              {pesanSuksesData && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2.5">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                  <span>{pesanSuksesData}</span>
                </div>
              )}

              {pesanErrorData && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2.5">
                  <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm"></i>
                  <span>{pesanErrorData}</span>
                </div>
              )}

              <form onSubmit={handleSimpanProfil} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <i className="fa-regular fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
                    <input
                      type="text"
                      required
                      value={formProfil.nama}
                      onChange={(e) =>
                        setFormProfil({ ...formProfil, nama: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap..."
                      className="w-full h-[40px] pl-10 pr-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white text-stone-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nomor WhatsApp Aktif
                  </label>
                  <div className="relative">
                    <i className="fa-brands fa-whatsapp absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 text-xs pointer-events-none"></i>
                    <input
                      type="text"
                      value={formProfil.no_wa}
                      onChange={(e) =>
                        setFormProfil({ ...formProfil, no_wa: e.target.value })
                      }
                      placeholder="Contoh: 081234567890"
                      className="w-full h-[40px] pl-10 pr-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white text-stone-800 font-medium"
                    />
                  </div>
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Digunakan untuk notifikasi sistem dan koordinasi tim dapur.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Alamat Email Akun
                  </label>
                  <div className="relative">
                    <i className="fa-regular fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
                    <input
                      type="email"
                      disabled
                      value={profil?.email || ""}
                      className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 bg-stone-100 text-stone-500 font-medium cursor-not-allowed"
                    />
                    <i className="fa-solid fa-lock absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
                  </div>
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Email terikat dengan otentikasi login akun Anda.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sedangSimpanData}
                    className="h-[40px] px-6 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition cursor-pointer inline-flex items-center justify-center space-x-2 shadow-xs disabled:opacity-60"
                  >
                    {sedangSimpanData ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk text-xs"></i>
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tabAktif === "keamanan" && (
            <div className="content-card p-6 sm:p-7">
              <div className="pb-4 mb-6 border-b border-[#ede2cd]">
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Keamanan Kata Sandi
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Perbarui kata sandi akun Anda secara berkala demi keamanan data toko
                </p>
              </div>

              {pesanSuksesSandi && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2.5">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                  <span>{pesanSuksesSandi}</span>
                </div>
              )}

              {pesanErrorSandi && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2.5">
                  <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm"></i>
                  <span>{pesanErrorSandi}</span>
                </div>
              )}

              <form onSubmit={handleGantiSandi} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
                    <input
                      type={lihatSandiLama ? "text" : "password"}
                      required
                      value={formSandi.kataSandiLama}
                      onChange={(e) =>
                        setFormSandi({
                          ...formSandi,
                          kataSandiLama: e.target.value,
                        })
                      }
                      placeholder="Masukkan kata sandi lama..."
                      className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white text-stone-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setLihatSandiLama(!lihatSandiLama)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer text-xs"
                    >
                      <i
                        className={`fa-solid ${
                          lihatSandiLama ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
                    <input
                      type={lihatSandiBaru ? "text" : "password"}
                      required
                      value={formSandi.kataSandiBaru}
                      onChange={(e) =>
                        setFormSandi({
                          ...formSandi,
                          kataSandiBaru: e.target.value,
                        })
                      }
                      placeholder="Minimal 6 karakter..."
                      className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white text-stone-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setLihatSandiBaru(!lihatSandiBaru)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer text-xs"
                    >
                      <i
                        className={`fa-solid ${
                          lihatSandiBaru ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-check-double absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
                    <input
                      type={lihatKonfirmasi ? "text" : "password"}
                      required
                      value={formSandi.konfirmasiSandi}
                      onChange={(e) =>
                        setFormSandi({
                          ...formSandi,
                          konfirmasiSandi: e.target.value,
                        })
                      }
                      placeholder="Ulangi kata sandi baru..."
                      className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 outline-none focus:border-[#ba2b2b] bg-white text-stone-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setLihatKonfirmasi(!lihatKonfirmasi)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer text-xs"
                    >
                      <i
                        className={`fa-solid ${
                          lihatKonfirmasi ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sedangGantiSandi}
                    className="h-[40px] px-6 rounded-xl font-bold bg-[#1d3b2e] hover:bg-[#142820] text-white text-xs transition cursor-pointer inline-flex items-center justify-center space-x-2 shadow-xs disabled:opacity-60"
                  >
                    {sedangGantiSandi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memperbarui Sandi...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-lock-open text-xs"></i>
                        <span>Perbarui Kata Sandi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tabAktif === "wewenang" && (
            <div className="content-card p-6 sm:p-7 space-y-5">
              <div className="pb-4 border-b border-[#ede2cd]">
                <h3 className="text-base font-bold text-[#1d3b2e]">
                  Wewenang & Hak Akses
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Daftar modul operasional yang dapat dikelola oleh akun Anda
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#fbf8f0] border border-[#ede2cd] flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0 text-sm">
                    <i className="fa-solid fa-boxes-stacked"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1d3b2e]">
                      Manajemen Pesanan
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      Melihat daftar pesanan pelanggan, memeriksa detail kebutuhan bahan baku kue, dan memperbarui status pengerjaan pesanan.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbf8f0] border border-[#ede2cd] flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 text-sm">
                    <i className="fa-solid fa-cubes"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1d3b2e]">
                      Manajemen Stok Persediaan
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      Memantau sisa bahan baku dapur, mencatat penambahan stok masuk, serta memotong stok sesuai kebutuhan resep kue.
                    </p>
                  </div>
                </div>

                {role === "admin" && (
                  <>
                    <div className="p-4 rounded-xl bg-[#fbf8f0] border border-[#ede2cd] flex items-start space-x-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 text-sm">
                        <i className="fa-solid fa-cash-register"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1d3b2e]">
                          Verifikasi Pembayaran & Laporan
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                          Memeriksa bukti transfer pembayaran, konfirmasi pelunasan/DP, dan analisis omzet penjualan toko.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#fbf8f0] border border-[#ede2cd] flex items-start space-x-3.5">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0 text-sm">
                        <i className="fa-solid fa-users-gear"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1d3b2e]">
                          Kelola Akun & Toko
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                          Menambah atau mengatur akun staf produksi, jam operasional toko, dan zona tarif ongkos kirim.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
