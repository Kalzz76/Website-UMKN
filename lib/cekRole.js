import { getSupabaseServer } from "./supabaseServer";

export async function cekRole(peranDiizinkan = []) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profil: null, diizinkan: false, status: 401 };
  }

  const { data: profil, error } = await supabase
    .from("profil")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profil || !profil.aktif) {
    return { user, profil: null, diizinkan: false, status: 403 };
  }

  if (peranDiizinkan.length > 0 && !peranDiizinkan.includes(profil.role)) {
    return { user, profil, diizinkan: false, status: 403 };
  }

  return { user, profil, diizinkan: true, status: 200 };
}
