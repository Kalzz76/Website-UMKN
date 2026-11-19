import { NextResponse } from "next/server";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { user, profil, diizinkan } = await cekRole(["admin"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin yang boleh mengelola akun." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: daftarProfil, error } = await supabase
    .from("profil")
    .select("id, nama, no_wa, role, aktif, dibuat_pada")
    .in("role", ["admin", "staf"])
    .order("dibuat_pada", { ascending: true });

  if (error) {
    return NextResponse.json(
      { pesan: "Gagal mengambil daftar akun: " + error.message },
      { status: 500 }
    );
  }

  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers();

  const emailMap = new Map();
  if (authUsers) {
    for (let i = 0; i < authUsers.length; i++) {
      emailMap.set(authUsers[i].id, authUsers[i].email);
    }
  }

  const hasil = (daftarProfil || []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) || "",
    isSaya: p.id === user.id,
  }));

  return NextResponse.json({ akun: hasil });
}

export async function POST(request) {
  const { user, profil, diizinkan } = await cekRole(["admin"]);
  if (!diizinkan || !profil) {
    return NextResponse.json(
      { pesan: "Akses ditolak. Hanya admin yang boleh mengelola akun." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { aksi } = body;

  if (aksi === "tambah") {
    const { nama, email, password, role, no_wa } = body;

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama lengkap tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!email || email.trim() === "") {
      return NextResponse.json(
        { pesan: "Email tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { pesan: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    if (!["admin", "staf"].includes(role)) {
      return NextResponse.json(
        { pesan: "Role akun harus berupa admin atau staf." },
        { status: 400 }
      );
    }

    const { data: newUser, error: errAuth } =
      await supabase.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          nama: nama.trim(),
          no_wa: no_wa ? no_wa.trim() : "",
        },
      });

    if (errAuth || !newUser.user) {
      return NextResponse.json(
        { pesan: "Gagal membuat akun: " + (errAuth?.message || "") },
        { status: 500 }
      );
    }

    await supabase
      .from("profil")
      .update({
        nama: nama.trim(),
        no_wa: no_wa ? no_wa.trim() : "",
        role,
        aktif: true,
      })
      .eq("id", newUser.user.id);

    return NextResponse.json({
      pesan: `Akun ${role} (${nama}) berhasil dibuat.`,
    });
  }

  if (aksi === "edit") {
    const { id, nama, role, aktif, password, no_wa } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID akun tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.trim() === "") {
      return NextResponse.json(
        { pesan: "Nama lengkap tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!["admin", "staf"].includes(role)) {
      return NextResponse.json(
        { pesan: "Role akun harus berupa admin atau staf." },
        { status: 400 }
      );
    }

    if (id === user.id) {
      if (!aktif) {
        return NextResponse.json(
          { pesan: "Anda tidak dapat menonaktifkan akun yang sedang digunakan." },
          { status: 400 }
        );
      }
      if (role !== "admin") {
        return NextResponse.json(
          { pesan: "Anda tidak dapat mencabut role admin akun Anda sendiri." },
          { status: 400 }
        );
      }
    }

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { pesan: "Password baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      const { error: errPass } = await supabase.auth.admin.updateUserById(id, {
        password: password.trim(),
      });

      if (errPass) {
        return NextResponse.json(
          { pesan: "Gagal mengganti password akun: " + errPass.message },
          { status: 500 }
        );
      }
    }

    const { error: errProfil } = await supabase
      .from("profil")
      .update({
        nama: nama.trim(),
        no_wa: no_wa ? no_wa.trim() : "",
        role,
        aktif: Boolean(aktif),
      })
      .eq("id", id);

    if (errProfil) {
      return NextResponse.json(
        { pesan: "Gagal memperbarui profil: " + errProfil.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Data akun berhasil diperbarui.",
    });
  }

  if (aksi === "hapus") {
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { pesan: "ID akun tidak valid." },
        { status: 400 }
      );
    }

    if (id === user.id) {
      return NextResponse.json(
        { pesan: "Anda tidak dapat menghapus akun Anda sendiri." },
        { status: 400 }
      );
    }

    const { error: errDel } = await supabase.auth.admin.deleteUser(id);

    if (errDel) {
      return NextResponse.json(
        { pesan: "Gagal menghapus akun: " + errDel.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pesan: "Akun berhasil dihapus.",
    });
  }

  return NextResponse.json(
    { pesan: "Aksi tidak dikenal." },
    { status: 400 }
  );
}