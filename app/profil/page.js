"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TombolKeluar from "@/components/TombolKeluar";

export default function ProfilUserPage() {
  const router = useRouter();
  const [sedangMuat, setSedangMuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [tabAktif, setTabAktif] = useState("datadiri");
  const [statistik, setStatistik] = useState({
    totalPesanan: 0,
    pesananAktif: 0,
  });

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
      if (res.status === 401 || res.status === 403) {
        router.push("/masuk?ke=/profil");
        return;
      }
      const data = await res.json();
      if (res.ok && data.profil) {
        if (data.profil.role === "admin" || data.profil.role === "staf") {
          router.replace("/dashboard/profil");
          return;
        }
        setProfil(data.profil);
        setFormProfil({
          nama: data.profil.nama || "",
          no_wa: data.profil.no_wa || "",
        });
        setStatistik(data.statistik || { totalPesanan: 0, pesananAktif: 0 });
      }
    } catch (err) {
      setPesanErrorData("Gagal memuat profil pengguna.");
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
      setPesanErrorData("Nama lengkap wajib diisi.");
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
        setPesanSuksesData(data.pesan || "Profil Anda berhasil diperbarui.");
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
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-stone-500">
            Memuat profil akun...
          </span>
        </div>
      </div>
    );
  }

  const role = profil?.role || "pelanggan";
  const inisial = (profil?.nama || "P").slice(0, 2).toUpperCase();
  const isStafAtauAdmin = role === "admin" || role === "staf";

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl hover:bg-rose-100 transition shadow-xs"
            >
              <i className="fa-solid fa-cake-candles"></i>
            </Link>
            <div>
              <h1 className="font-extrabold text-stone-900 text-lg leading-tight">
                Profil Saya
              </h1>
              <p className="text-xs text-stone-500">
                Halo, {profil?.nama || "Pelanggan"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
            >
              Beranda
            </Link>
            <Link
              href="/pesanan-saya"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 transition inline-flex items-center gap-1.5"
            >
              <i className="fa-solid fa-box-open text-rose-600"></i>
              <span>Pesanan Saya</span>
            </Link>
            <TombolKeluar />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {isStafAtauAdmin && (
          <div className="p-4 rounded-2xl bg-[#1d3b2e] text-[#f4ecd8] border border-[#dfd4bd] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 flex-shrink-0">
                <i className="fa-solid fa-user-shield"></i>
              </div>
              <div>
                <div className="text-xs font-bold">
                  Akun {role === "admin" ? "Administrator" : "Staf Produksi"}
                </div>
                <div className="text-[11px] text-stone-300">
                  Anda sedang mengakses antarmuka pelanggan. Buka dashboard untuk fitur operasional toko.
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/profil"
              className="h-[36px] px-4 rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white text-xs transition inline-flex items-center justify-center space-x-1.5 flex-shrink-0"
            >
              <span>Profil Dashboard</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm text-center space-y-4">
              <div className="relative inline-block mx-auto">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-200 shadow-sm bg-[#f8e4d9] mx-auto flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  >
                    <rect width="100" height="100" fill="#f8e4d9" />
                    <path
                      d="M20 50 C15 30 30 10 50 10 C70 10 85 30 80 50 C85 65 75 75 75 75 C75 75 65 60 65 55 C35 55 25 75 25 75 C25 75 15 65 20 50 Z"
                      fill="#2d2226"
                    />
                    <path
                      d="M28 42 C28 65 38 78 50 78 C62 78 72 65 72 42 C72 25 28 25 28 42 Z"
                      fill="#ffdfd2"
                    />
                    <ellipse
                      cx="36"
                      cy="56"
                      rx="5"
                      ry="3"
                      fill="#ffb4a2"
                      opacity="0.8"
                    />
                    <ellipse
                      cx="64"
                      cy="56"
                      rx="5"
                      ry="3"
                      fill="#ffb4a2"
                      opacity="0.8"
                    />
                    <ellipse cx="40" cy="48" rx="3.5" ry="5.5" fill="#2d2226" />
                    <circle cx="41" cy="46" r="1.5" fill="#ffffff" />
                    <ellipse cx="60" cy="48" rx="3.5" ry="5.5" fill="#2d2226" />
                    <circle cx="61" cy="46" r="1.5" fill="#ffffff" />
                    <path
                      d="M47 62 Q50 65 53 62"
                      stroke="#b25d5d"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M25 35 C32 20 45 15 50 15 C55 15 68 20 75 35 C70 30 65 30 60 38 C55 28 48 26 42 36 C38 28 32 30 25 35 Z"
                      fill="#3a2e33"
                    />
                    <path
                      d="M38 25 L43 42 L47 28 L53 40 L56 26"
                      fill="#3a2e33"
                    />
                    <path
                      d="M25 88 C30 76 42 76 50 76 C58 76 70 76 75 88 L85 100 L15 100 Z"
                      fill="#ffffff"
                    />
                    <path d="M46 76 L50 85 L54 76 Z" fill="#2d2226" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white">
                  <i className="fa-solid fa-check"></i>
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  {profil?.nama || "Pelanggan"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {profil?.email || "-"}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Pelanggan Terdaftar
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-2 text-stone-400">
                    <i className="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                    <span>WhatsApp</span>
                  </span>
                  <span className="font-bold text-stone-900">
                    {profil?.no_wa || "-"}
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

              <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-center">
                <Link
                  href="/pesanan-saya"
                  className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 hover:bg-amber-100/70 transition block"
                >
                  <div className="text-lg font-black text-stone-900">
                    {statistik.totalPesanan}
                  </div>
                  <div className="text-[10.5px] font-bold text-stone-500 mt-0.5">
                    Total Pesanan
                  </div>
                </Link>

                <Link
                  href="/pesanan-saya"
                  className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-100/70 transition block"
                >
                  <div className="text-lg font-black text-rose-700">
                    {statistik.pesananAktif}
                  </div>
                  <div className="text-[10.5px] font-bold text-stone-500 mt-0.5">
                    Sedang Diproses
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-2.5 border border-stone-100 shadow-sm space-y-1">
              <button
                type="button"
                onClick={() => setTabAktif("datadiri")}
                className={`w-full h-[40px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                  tabAktif === "datadiri"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-regular fa-user text-xs"></i>
                  <span>Ubah Data Diri</span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] opacity-70"></i>
              </button>

              <button
                type="button"
                onClick={() => setTabAktif("keamanan")}
                className={`w-full h-[40px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                  tabAktif === "keamanan"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-key text-xs"></i>
                  <span>Ganti Kata Sandi</span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] opacity-70"></i>
              </button>
            </div>
          </div>

          <div className="md:col-span-8 space-y-5">
            {tabAktif === "datadiri" && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-100 shadow-sm">
                <div className="pb-4 mb-6 border-b border-stone-100">
                  <h3 className="text-base font-bold text-stone-900">
                    Ubah Data Diri & Kontak
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
                        placeholder="Nama lengkap Anda..."
                        className="w-full h-[40px] pl-10 pr-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white text-stone-800 font-medium"
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
                        className="w-full h-[40px] pl-10 pr-3 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white text-stone-800 font-medium"
                      />
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1 block">
                      Nomor ini digunakan baker kami untuk konfirmasi dan update pesanan Anda.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Alamat Email
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
                      Email digunakan untuk login akun dan menerima nota digital.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={sedangSimpanData}
                      className="h-[40px] px-6 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white text-xs transition cursor-pointer inline-flex items-center justify-center space-x-2 shadow-xs disabled:opacity-60"
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
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-100 shadow-sm">
                <div className="pb-4 mb-6 border-b border-stone-100">
                  <h3 className="text-base font-bold text-stone-900">
                    Ganti Kata Sandi
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Gunakan kata sandi baru yang aman dan mudah diingat
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
                        placeholder="Masukkan sandi saat ini..."
                        className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white text-stone-800 font-medium"
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
                        className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white text-stone-800 font-medium"
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
                        className="w-full h-[40px] pl-10 pr-10 text-xs rounded-xl border border-stone-200 outline-none focus:border-rose-500 bg-white text-stone-800 font-medium"
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
                          <span>Menyimpan...</span>
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

            <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-stone-900">
                  Ingin Merancang Kue Custom Baru?
                </div>
                <div className="text-[11px] text-stone-500">
                  Kustomisasi bolu, lelehan krim, dan ornamen favorit Anda.
                </div>
              </div>
              <Link
                href="/pesan"
                className="h-[36px] px-4 rounded-full font-bold bg-rose-600 hover:bg-rose-500 text-white text-xs transition inline-flex items-center justify-center flex-shrink-0 shadow-xs"
              >
                Pesan Kue &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
