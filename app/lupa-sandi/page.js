"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import {
  BotanicalTopLeft,
  BotanicalBottomRight,
} from "@/components/patisserie/BotanicalBranchDecor";

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
      setErrorEmail("Email wajib diisi.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
      setErrorEmail("Format email tidak valid.");
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
        "Jika email terdaftar di sistem, tautan pengaturan ulang kata sandi telah dikirim. Silakan periksa kotak masuk atau folder spam Anda."
      );
      setSisaDetik(60);
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
        <div className="mb-5">
          <Link
            href="/masuk"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6158] hover:text-[#3D2B28] transition group"
          >
            <span className="w-7 h-7 rounded-full bg-[#FAF4ED] border border-[#EADCC8] group-hover:bg-[#F1DBD0]/60 flex items-center justify-center text-[#9E3B42] transition">
              <i className="fa-solid fa-arrow-left text-[11px]" />
            </span>
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#9E3B42] bg-[#FCE8EC] px-3 py-1 rounded-full border border-[#EBC0C8] mb-2">
            Pemulihan Akun
          </span>
          <h1 className="font-serif text-3xl font-black text-[#3D2B28]">
            Lupa Kata Sandi
          </h1>
          <p className="text-xs text-[#7A6158] mt-1.5 leading-relaxed">
            Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
          </p>
        </div>

        {errorEmail && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-600 shrink-0" />
            <span>{errorEmail}</span>
          </div>
        )}

        {pesan && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed font-medium">
            <div className="flex items-start gap-2.5">
              <i className="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5 shrink-0" />
              <span>{pesan}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleKirim} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={memuat || sisaDetik > 0}
              className="w-full px-4 py-3 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60 transition"
            />
          </div>

          <button
            type="submit"
            disabled={memuat || sisaDetik > 0}
            className="w-full py-3 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-110 text-white shadow-[0_8px_20px_rgba(158,59,66,0.3)] transition disabled:opacity-50 cursor-pointer"
          >
            {memuat
              ? "Mengirim Tautan..."
              : sisaDetik > 0
              ? `Kirim Ulang (${sisaDetik} detik)`
              : "Kirim Tautan Pemulihan"}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-[#EADCC8]">
          <p className="text-xs text-[#7A6158]">
            Sudah ingat kata sandi Anda?{" "}
            <Link href="/masuk" className="text-[#9E3B42] font-extrabold hover:underline">
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
