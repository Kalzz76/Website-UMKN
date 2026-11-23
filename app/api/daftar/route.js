import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    const body = await request.json();
    const nama = body.nama ? String(body.nama).trim() : "";
    const no_wa = body.no_wa ? String(body.no_wa).trim() : "";
    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const password = body.password ? String(body.password) : "";

    if (!nama || nama.length < 2) {
      return NextResponse.json(
        { pesan: "Nama lengkap wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    if (!no_wa || no_wa.length < 8) {
      return NextResponse.json(
        { pesan: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { pesan: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { pesan: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nama,
          no_wa,
        },
      });

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        return NextResponse.json(
          {
            pesan:
              "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { pesan: "Terjadi kesalahan saat pendaftaran: " + (createErr?.message || "") },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    const { data: sudahAda } = await supabaseAdmin
      .from("profil")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!sudahAda) {
      await supabaseAdmin.from("profil").insert({
        id: userId,
        nama,
        no_wa,
        role: "pelanggan",
        aktif: true,
      });
    } else {
      await supabaseAdmin
        .from("profil")
        .update({ nama, no_wa })
        .eq("id", userId)
        .eq("role", "pelanggan");
    }

    return NextResponse.json(
      {
        sukses: true,
        pesan: "Akun berhasil dibuat. Anda dapat langsung masuk sekarang.",
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { pesan: "Terjadi kesalahan server saat mendaftar." },
      { status: 500 }
    );
  }
}
