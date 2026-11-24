"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function LupaSandiPage() {
  const [email, setEmail] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [sisaDetik, setSisaDetik] = useState(0);

  useEffect(() => {
    if (sisaDetik <= 0) return;
    const interval = setInterval(() => {
      setSisaDetik((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [sisaDetik]);

  async function handleKirim(e) {
    e.preventDefault();
    setErrorEmail("");
    setPesan("");

    const emailBersih = email.trim();
    if (!emailBersih) {
      setErrorEmail("Email wajib diisi");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
      setErrorEmail("Format email tidak valid");
      return;
    }

    setMemuat(true);

    try {
      const supabase = getSupabaseBrowser();
      const redirectUrl = `${window.location.origin}/atur-ulang-sandi`;
      await supabase.auth.resetPasswordForEmail(emailBersih, {
        redirectTo: redirectUrl,
      });
    } catch {
    } finally {
      setMemuat(false);
      setPesan(
        "Jika email terdaftar di sistem, tautan pengaturan ulang kata sandi telah dikirim. Silakan periksa kotak masuk atau spam email Anda."
      );
      setSisaDetik(60);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
        <div className="mb-4">
          <Link
            href="/masuk"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition group"
          >
            <span className="w-7 h-7 rounded-full bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center text-stone-600 transition">
              <i className="fa-solid fa-arrow-left text-[11px]" />
            </span>
            <span>Kembali ke Masuk</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-stone-900">Lupa Kata Sandi</h1>
          <p className="text-sm text-stone-500 mt-1">
            Masukkan email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
          </p>
        </div>

        {errorEmail && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-600 shrink-0" />
            <span>{errorEmail}</span>
          </div>
        )}

        {pesan && (
          <div className="p-4 mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed font-medium">
            <div className="flex items-start gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5 shrink-0" />
              <span>{pesan}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleKirim} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={memuat || sisaDetik > 0}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={memuat || sisaDetik > 0}
            className="w-full py-3 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer text-sm"
          >
            {memuat
              ? "Mengirim..."
              : sisaDetik > 0
              ? `Kirim Ulang (${sisaDetik}s)`
              : "Kirim Tautan Pemulihan"}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-stone-100">
          <p className="text-xs text-stone-500">
            Ingat kata sandi Anda?{" "}
            <Link href="/masuk" className="text-rose-600 hover:text-rose-700 font-bold">
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
