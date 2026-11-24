"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ModalPesan from "@/components/ModalPesan";
import {
  BotanicalTopLeft,
  BotanicalBottomRight,
} from "@/components/patisserie/BotanicalBranchDecor";

function FormDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tujuan = searchParams.get("ke");

  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [daftarError, setDaftarError] = useState([]);
  const [modalSukses, setModalSukses] = useState(false);

  async function handleDaftar(e) {
    e.preventDefault();
    setDaftarError([]);

    const errorList = [];
    if (!nama.trim()) {
      errorList.push("Nama lengkap wajib diisi.");
    }
    if (!noWa.trim()) {
      errorList.push("Nomor WhatsApp wajib diisi.");
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      errorList.push("Format email tidak valid.");
    }
    if (!password || password.length < 6) {
      errorList.push("Kata sandi minimal 6 karakter.");
    }
    if (password !== konfirmasiPassword) {
      errorList.push("Konfirmasi kata sandi tidak cocok.");
    }

    if (errorList.length > 0) {
      setDaftarError(errorList);
      return;
    }

    setMemuat(true);

    try {
      const res = await fetch("/api/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          no_wa: noWa.trim(),
          email: email.trim(),
          password: password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMemuat(false);
        setDaftarError([data.pesan || "Terjadi kesalahan saat pendaftaran."]);
        return;
      }

      setMemuat(false);
      setModalSukses(true);
    } catch {
      setMemuat(false);
      setDaftarError(["Terjadi gangguan jaringan. Silakan coba kembali."]);
    }
  }

  function handleTutupModal() {
    setModalSukses(false);
    if (tujuan) {
      router.push(`/masuk?ke=${encodeURIComponent(tujuan)}`);
    } else {
      router.push("/masuk");
    }
  }

  return (
    <main className="relative min-h-screen bg-[#FDF5E7] text-[#3D2B28] flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none fixed top-0 left-0 opacity-45">
        <BotanicalTopLeft color="#A36361" opacity={0.4} />
      </div>
      <div className="pointer-events-none fixed bottom-0 right-0 opacity-45">
        <BotanicalBottomRight color="#8A675C" opacity={0.35} />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#FFFDF9] rounded-[28px] shadow-[0_20px_50px_rgba(61,43,40,0.12)] border-2 border-[#EADCC8] p-7 sm:p-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6158] hover:text-[#3D2B28] transition group"
          >
            <span className="w-7 h-7 rounded-full bg-[#FAF4ED] border border-[#EADCC8] group-hover:bg-[#F1DBD0]/60 flex items-center justify-center text-[#9E3B42] transition">
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
            </span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#9E3B42] bg-[#FCE8EC] px-3 py-1 rounded-full border border-[#EBC0C8] mb-2">
            Registrasi Pelanggan
          </span>
          <h1 className="font-serif text-3xl font-black text-[#3D2B28]">
            Buat Akun Pelanggan
          </h1>
          <p className="text-xs text-[#7A6158] mt-1">
            Nikmati kemudahan merancang kue 3D, lacak pesanan, dan simpan alamat pengiriman
          </p>
        </div>

        {daftarError.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <ul className="list-disc list-inside space-y-1">
              {daftarError.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleDaftar} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#5A3B33] mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Nadia Salsabila"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A3B33] mb-1">
              Nomor WhatsApp Aktif
            </label>
            <input
              type="tel"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              placeholder="Contoh: 081234567890"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A3B33] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A3B33] mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={lihatSandi ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={memuat}
                className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setLihatSandi(!lihatSandi)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
              >
                <i className={`fa-regular ${lihatSandi ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A3B33] mb-1">
              Ulangi Kata Sandi
            </label>
            <input
              type={lihatSandi ? "text" : "password"}
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              placeholder="Masukkan kembali kata sandi"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={memuat}
            className="w-full py-3 mt-2 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-110 text-white shadow-[0_8px_20px_rgba(158,59,66,0.3)] transition disabled:opacity-50 cursor-pointer"
          >
            {memuat ? "Mendaftarkan Akun..." : "Daftar Akun Pelanggan"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#7A6158]">
          Sudah punya akun?{" "}
          <Link
            href={tujuan ? `/masuk?ke=${encodeURIComponent(tujuan)}` : "/masuk"}
            className="text-[#9E3B42] font-extrabold hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>

      <ModalPesan
        terbuka={modalSukses}
        judul="Pendaftaran Berhasil"
        pesan="Akun Pelanggan Anda telah berhasil dibuat. Silakan masuk untuk mengakses Dashboard Pelanggan dan memesan kue."
        tipe="sukses"
        onTutup={handleTutupModal}
      />
    </main>
  );
}

export default function DaftarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF5E7] flex items-center justify-center p-4 text-[#7A6158] text-xs font-bold">Memuat...</div>}>
      <FormDaftar />
    </Suspense>
  );
}
