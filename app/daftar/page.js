"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ModalPesan from "@/components/ModalPesan";

function FormDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tujuan = searchParams.get("ke");

  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
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
    } catch (err) {
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
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition group"
          >
            <span className="w-7 h-7 rounded-full bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center text-stone-600 transition">
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
            </span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-stone-900">Buat Akun Baru</h1>
          <p className="text-sm text-stone-500 mt-1">
            Daftar untuk mulai memesan kue custom impian Anda
          </p>
        </div>

        {daftarError.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <ul className="list-disc list-inside space-y-1">
              {daftarError.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleDaftar} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              placeholder="Contoh: 081234567890"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Ulangi Kata Sandi
            </label>
            <input
              type="password"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              placeholder="Masukkan kembali kata sandi"
              disabled={memuat}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800"
            />
          </div>

          <button
            type="submit"
            disabled={memuat}
            className="w-full py-3 mt-2 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer"
          >
            {memuat ? "Memproses..." : "Daftar Akun"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-600">
          Sudah punya akun?{" "}
          <Link
            href={tujuan ? `/masuk?ke=${encodeURIComponent(tujuan)}` : "/masuk"}
            className="text-rose-600 font-semibold hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>

      <ModalPesan
        terbuka={modalSukses}
        judul="Pendaftaran Berhasil"
        pesan="Akun Anda telah berhasil dibuat. Silakan masuk untuk mulai memesan kue."
        tipe="sukses"
        onTutup={handleTutupModal}
      />
    </main>
  );
}

export default function DaftarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 text-stone-500 text-sm">Memuat...</div>}>
      <FormDaftar />
    </Suspense>
  );
}
