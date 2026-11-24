"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function AturUlangSandiPage() {
  const router = useRouter();
  const [sandiBaru, setSandiBaru] = useState("");
  const [konfirmasiSandi, setKonfirmasiSandi] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);
  const [sesiSiap, setSesiSiap] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSesiSiap(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSesiSiap(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSimpan(e) {
    e.preventDefault();
    setErrorPesan("");

    if (!sandiBaru) {
      setErrorPesan("Kata sandi baru wajib diisi");
      return;
    }

    if (sandiBaru.length < 8) {
      setErrorPesan("Kata sandi minimal 8 karakter");
      return;
    }

    if (sandiBaru !== konfirmasiSandi) {
      setErrorPesan("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setMemuat(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({
        password: sandiBaru,
      });

      if (error) {
        setErrorPesan(error.message || "Gagal memperbarui kata sandi");
      } else {
        setBerhasil(true);
      }
    } catch {
      setErrorPesan("Terjadi kendala jaringan. Silakan coba beberapa saat lagi.");
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-stone-900">Atur Ulang Kata Sandi</h1>
          <p className="text-sm text-stone-500 mt-1">
            Buat kata sandi baru yang kuat (minimal 8 karakter) untuk akun Anda.
          </p>
        </div>

        {errorPesan && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-600 shrink-0" />
            <span>{errorPesan}</span>
          </div>
        )}

        {berhasil ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-check" />
            </div>
            <h2 className="text-base font-bold text-stone-900">
              Kata Sandi Berhasil Diperbarui
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Anda kini dapat masuk ke akun menggunakan kata sandi baru.
            </p>
            <div className="pt-2">
              <Link
                href="/masuk"
                className="w-full inline-block py-3 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition text-sm cursor-pointer"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSimpan} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                value={sandiBaru}
                onChange={(e) => setSandiBaru(e.target.value)}
                placeholder="Minimal 8 karakter"
                disabled={memuat}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                value={konfirmasiSandi}
                onChange={(e) => setKonfirmasiSandi(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                disabled={memuat}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 disabled:bg-stone-50 text-stone-800 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={memuat}
              className="w-full py-3 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer text-sm"
            >
              {memuat ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
