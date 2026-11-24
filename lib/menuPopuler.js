import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function ambilMenuPopuler() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("produk")
      .select("id, nama, deskripsi, harga, foto, aktif, unggulan, dibuat_pada")
      .eq("aktif", true)
      .eq("unggulan", true)
      .order("dibuat_pada", { ascending: false })
      .limit(4);

    if (error || !data) return [];

    const { data: storageData } = supabase.storage.from("publik").getPublicUrl("");
    const baseUrl = storageData?.publicUrl ? storageData.publicUrl.replace(/\/+$/, "") : "";

    return data.map((p) => {
      let photo = null;
      if (p.foto) {
        if (p.foto.startsWith("http://") || p.foto.startsWith("https://")) {
          photo = p.foto;
        } else {
          photo = `${baseUrl}/${p.foto.replace(/^\/+/, "")}`;
        }
      }
      return {
        id: p.id,
        nama: p.nama,
        desc: p.deskripsi || "",
        harga: p.harga,
        photo,
      };
    });
  } catch {
    return [];
  }
}
