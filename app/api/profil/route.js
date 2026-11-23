import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { user, profil, diizinkan, status } = await cekRole(["admin", "staf", "pelanggan"]);
  if (!diizinkan || !user || !profil) {
    return NextResponse.json(
      { pesan: "Akses tidak diizinkan. Silakan masuk terlebih dahulu." },
      { status: status || 401 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  let statistik = {
    totalPesanan: 0,
    pesananAktif: 0,
  };

  if (profil.role === "pelanggan") {
    const { count: total } = await supabaseAdmin
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .eq("id_pelanggan", user.id);

    const { count: aktif } = await supabaseAdmin
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .eq("id_pelanggan", user.id)
      .not("status_pesanan", "in", '("Selesai","Dibatalkan")');

    statistik.totalPesanan = total || 0;
    statistik.pesananAktif = aktif || 0;
  } else if (profil.role === "admin") {
    const { count: totalPesanan } = await supabaseAdmin
      .from("pesanan")
      .select("*", { count: "exact", head: true });

    const { count: totalPengguna } = await supabaseAdmin
      .from("profil")
      .select("*", { count: "exact", head: true });

    statistik.totalPesanan = totalPesanan || 0;
    statistik.totalPengguna = totalPengguna || 0;
  } else if (profil.role === "staf") {
    const { count: pesananProses } = await supabaseAdmin
      .from("pesanan")
      .select("*", { count: "exact", head: true })
      .in("status_pesanan", ["Diterima", "Sedang Dibuat"]);

    statistik.pesananProses = pesananProses || 0;
  }

  return NextResponse.json({
    profil: {
      ...profil,
      email: user.email || "",
    },
    statistik,
  });
}

export async function PUT(request) {
  const { user, profil, diizinkan, status } = await cekRole(["admin", "staf", "pelanggan"]);
  if (!diizinkan || !user || !profil) {
    return NextResponse.json(
      { pesan: "Akses tidak diizinkan. Silakan masuk terlebih dahulu." },
      { status: status || 401 }
    );
  }

  try {
    const body = await request.json();
    const { nama, no_wa, kataSandiLama, kataSandiBaru } = body;

    const supabaseAdmin = getSupabaseAdmin();
    const updateData = {};

    if (nama !== undefined) {
      const namaBersih = String(nama).trim();
      if (!namaBersih || namaBersih.length < 2) {
        return NextResponse.json(
          { pesan: "Nama lengkap minimal 2 karakter." },
          { status: 400 }
        );
      }
      updateData.nama = namaBersih;
    }

    if (no_wa !== undefined) {
      const waBersih = String(no_wa).trim().replace(/\s+/g, "");
      if (waBersih && !/^[0-9+\-()]{8,20}$/.test(waBersih)) {
        return NextResponse.json(
          { pesan: "Format nomor WhatsApp tidak valid." },
          { status: 400 }
        );
      }
      updateData.no_wa = waBersih;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: errUpdate } = await supabaseAdmin
        .from("profil")
        .update(updateData)
        .eq("id", user.id);

      if (errUpdate) {
        return NextResponse.json(
          { pesan: "Gagal memperbarui data profil: " + errUpdate.message },
          { status: 500 }
        );
      }
    }

    if (kataSandiBaru) {
      const sandiBaru = String(kataSandiBaru).trim();
      if (sandiBaru.length < 6) {
        return NextResponse.json(
          { pesan: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      if (kataSandiLama) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseAnon = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error: errVerifikasi } = await supabaseAnon.auth.signInWithPassword({
          email: user.email,
          password: String(kataSandiLama),
        });

        if (errVerifikasi) {
          return NextResponse.json(
            { pesan: "Kata sandi saat ini yang Anda masukkan salah." },
            { status: 400 }
          );
        }
      }

      const { error: errSandi } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: sandiBaru }
      );

      if (errSandi) {
        return NextResponse.json(
          { pesan: "Gagal mengganti kata sandi: " + errSandi.message },
          { status: 500 }
        );
      }
    }

    const { data: profilBaru } = await supabaseAdmin
      .from("profil")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      sukses: true,
      pesan: kataSandiBaru
        ? "Profil dan kata sandi berhasil diperbarui."
        : "Profil berhasil diperbarui.",
      profil: {
        ...(profilBaru || profil),
        email: user.email || "",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { pesan: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}
