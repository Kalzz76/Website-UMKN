"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

function FormMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tujuan = searchParams.get("ke");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setDaftarError(["Email atau kata sandi salah. Silakan periksa kembali."]);
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

    if (tujuan && tujuan.startsWith("/")) {
      router.push(tujuan);
    } else {
      router.push("/pesanan-saya");
    }
    router.refresh();
  }

  return (
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
        <h1 className="text-2xl font-extrabold text-stone-900">Masuk ke Akun</h1>
        <p className="text-sm text-stone-500 mt-1">
          Silakan masuk untuk melanjutkan pemesanan atau melihat status pesanan
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

      <form onSubmit={handleMasuk} className="space-y-4">
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
            placeholder="Masukkan kata sandi"
            disabled={memuat}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800"
          />
        </div>

        <button
          type="submit"
          disabled={memuat}
          className="w-full py-3 mt-2 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer"
        >
          {memuat ? "Memproses..." : "Masuk"}
        </button>

        <div className="pt-4 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            <span>Akses Cepat</span>
            <span>Klik untuk Isi Otomatis</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@cravely.com");
                setPassword("password123");
                setDaftarError([]);
              }}
              className="py-2 px-3 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/60 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-solid fa-crown text-amber-500"></i>
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("petugas@cravely.com");
                setPassword("password123");
                setDaftarError([]);
              }}
              className="py-2 px-3 rounded-xl border border-stone-200 hover:border-emerald-400 bg-stone-50 hover:bg-emerald-50/60 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-solid fa-kitchen-set text-emerald-600"></i>
              <span>Petugas</span>
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-stone-600">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-rose-600 font-semibold hover:underline">
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-stone-500 text-sm">Memuat...</div>}>
        <FormMasuk />
      </Suspense>
    </main>
  );
}
