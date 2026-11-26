"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import {
  BotanicalTopLeft,
  BotanicalBottomRight,
} from "@/components/patisserie/BotanicalBranchDecor";

export default function AturUlangSandiPage() {
  const [sandiBaru, setSandiBaru] = useState("");
  const [konfirmasiSandi, setKonfirmasiSandi] = useState("");
  const [lihatSandiBaru, setLihatSandiBaru] = useState(false);
  const [lihatKonfirmasi, setLihatKonfirmasi] = useState(false);
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
      setErrorPesan("Kata sandi baru wajib diisi.");
      return;
    }

    if (sandiBaru.length < 8) {
      setErrorPesan("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (sandiBaru !== konfirmasiSandi) {
      setErrorPesan("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setMemuat(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({
        password: sandiBaru,
      });

      if (error) {
        setErrorPesan(error.message || "Gagal memperbarui kata sandi.");
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
            Keamanan Akun
          </span>
          <h1 className="font-serif text-3xl font-black text-[#3D2B28]">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-xs text-[#7A6158] mt-1.5 leading-relaxed">
            Buat kata sandi baru yang kuat (minimal 8 karakter) untuk mengamankan akun Anda.
          </p>
        </div>

        {!sesiSiap && !berhasil && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF8EB] border border-[#F0D9A8] text-[#7A4B06] text-xs leading-relaxed font-medium">
            Pastikan Anda membuka halaman ini langsung melalui tautan pemulihan dari email agar perubahan sandi dapat diproses.
          </div>
        )}

        {errorPesan && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-600 shrink-0" />
            <span>{errorPesan}</span>
          </div>
        )}

        {berhasil ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto text-lg">
              <i className="fa-solid fa-check" />
            </div>
            <h2 className="font-serif text-xl font-black text-[#3D2B28]">
              Kata Sandi Berhasil Diperbarui
            </h2>
            <p className="text-xs text-[#7A6158] leading-relaxed">
              Anda kini dapat masuk ke akun menggunakan kata sandi baru Anda.
            </p>
            <div className="pt-2">
              <Link
                href="/masuk"
                className="w-full inline-block py-3 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-110 text-white shadow-[0_8px_20px_rgba(158,59,66,0.3)] transition cursor-pointer"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSimpan} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={lihatSandiBaru ? "text" : "password"}
                  value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  disabled={memuat}
                  className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60 transition"
                />
                <button
                  type="button"
                  onClick={() => setLihatSandiBaru(!lihatSandiBaru)}
                  aria-label="Tampilkan atau sembunyikan kata sandi baru"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
                >
                  <i className={`fa-regular ${lihatSandiBaru ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={lihatKonfirmasi ? "text" : "password"}
                  value={konfirmasiSandi}
                  onChange={(e) => setKonfirmasiSandi(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  disabled={memuat}
                  className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42] disabled:opacity-60 transition"
                />
                <button
                  type="button"
                  onClick={() => setLihatKonfirmasi(!lihatKonfirmasi)}
                  aria-label="Tampilkan atau sembunyikan konfirmasi kata sandi"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
                >
                  <i className={`fa-regular ${lihatKonfirmasi ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={memuat}
              className="w-full py-3 mt-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-110 text-white shadow-[0_8px_20px_rgba(158,59,66,0.3)] transition disabled:opacity-50 cursor-pointer"
            >
              {memuat ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
