"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import {
  BotanicalTopLeft,
  BotanicalBottomRight,
} from "@/components/patisserie/BotanicalBranchDecor";

function FormMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tujuan = searchParams.get("ke");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [daftarError, setDaftarError] = useState([]);

  async function handleMasuk(e) {
    e.preventDefault();
    setDaftarError([]);

    const errorList = [];
    if (!email.trim()) {
      errorList.push("Email wajib diisi.");
    }
    if (!password) {
      errorList.push("Kata sandi wajib diisi.");
    }

    if (errorList.length > 0) {
      setDaftarError(errorList);
      return;
    }

    setMemuat(true);
    const supabase = getSupabaseBrowser();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setMemuat(false);
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        setDaftarError([
          "Email akun Anda belum terverifikasi. Silakan cek kotak masuk email atau hubungi admin toko.",
        ]);
      } else {
        setDaftarError(["Email atau kata sandi salah. Silakan periksa kembali."]);
      }
      return;
    }

    const { data: profil, error: errorProfil } = await supabase
      .from("profil")
      .select("role, aktif")
      .eq("id", data.user.id)
      .single();

    if (errorProfil || !profil) {
      setMemuat(false);
      setDaftarError(["Gagal mengambil data profil pengguna."]);
      return;
    }

    if (!profil.aktif) {
      await supabase.auth.signOut();
      setMemuat(false);
      setDaftarError(["Akun Anda telah dinonaktifkan. Silakan hubungi admin."]);
      return;
    }

    if (profil.role === "admin" || profil.role === "staf") {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    function sanitizeKe(target) {
      if (!target || typeof target !== "string") return null;
      const clean = target.trim();
      if (clean.startsWith("/") && !clean.startsWith("//") && !clean.includes("://")) {
        return clean;
      }
      return null;
    }

    const pathTujuan = sanitizeKe(tujuan);
    if (pathTujuan && pathTujuan !== "/" && !pathTujuan.startsWith("/dashboard")) {
      router.push(pathTujuan);
    } else {
      router.push("/user");
    }
    router.refresh();
  }

  return (
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
          Akses Akun Terpadu
        </span>
        <h1 className="font-serif text-3xl font-black text-[#3D2B28]">
          Masuk ke Akun
        </h1>
        <p className="text-xs text-[#7A6158] mt-1">
          Masuk sebagai Pelanggan, Petugas Dapur, atau Admin Toko
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

      <form onSubmit={handleMasuk} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            disabled={memuat}
            className="w-full px-4 py-3 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#5A3B33]">
              Kata Sandi
            </label>
            <Link
              href="/lupa-sandi"
              className="text-xs text-[#9E3B42] hover:underline font-bold"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <input
              type={lihatSandi ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              disabled={memuat}
              className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60"
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

        <button
          type="submit"
          disabled={memuat}
          className="w-full py-3 mt-2 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-110 text-white shadow-[0_8px_20px_rgba(158,59,66,0.3)] transition disabled:opacity-50 cursor-pointer"
        >
          {memuat ? "Memproses Masuk..." : "Masuk ke Dashboard"}
        </button>

        <div className="pt-4 border-t border-[#EADCC8] space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-extrabold text-[#8C6D62] uppercase tracking-wider">
            <span>Akses Cepat Tim Toko</span>
            <span>Klik Isi Otomatis</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@cravely.com");
                setPassword("password123");
                setDaftarError([]);
              }}
              className="py-2 px-3 rounded-2xl border border-[#EADCC8] hover:border-[#C59B62] bg-[#FAF4ED] hover:bg-[#F5E8D8] text-[#3D2B28] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-solid fa-crown text-[#B8925A]"></i>
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("petugas@cravely.com");
                setPassword("password123");
                setDaftarError([]);
              }}
              className="py-2 px-3 rounded-2xl border border-[#EADCC8] hover:border-[#215934] bg-[#FAF4ED] hover:bg-[#E8F4EC] text-[#3D2B28] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-solid fa-kitchen-set text-[#215934]"></i>
              <span>Petugas</span>
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-[#7A6158]">
        Pelanggan baru & belum punya akun?{" "}
        <Link
          href={tujuan ? `/daftar?ke=${encodeURIComponent(tujuan)}` : "/daftar"}
          className="text-[#9E3B42] font-extrabold hover:underline"
        >
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <main className="relative min-h-screen bg-[#FDF5E7] text-[#3D2B28] flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none fixed top-0 left-0 opacity-45">
        <BotanicalTopLeft color="#A36361" opacity={0.4} />
      </div>
      <div className="pointer-events-none fixed bottom-0 right-0 opacity-45">
        <BotanicalBottomRight color="#8A675C" opacity={0.35} />
      </div>
      <Suspense fallback={<div className="text-[#7A6158] text-xs font-bold">Memuat halaman masuk...</div>}>
        <FormMasuk />
      </Suspense>
    </main>
  );
}
