import { ambilMenuPopuler } from "@/lib/menuPopuler";
import { ambilTokoPublik } from "@/lib/tokoPublik";
import HomePageClient from "@/components/patisserie/HomePageClient";

export const revalidate = 60;

export async function generateMetadata() {
  const toko = await ambilTokoPublik();
  const namaToko = toko?.nama_toko ? toko.nama_toko.trim() : "";
  const deskripsi = toko?.deskripsi_footer ? toko.deskripsi_footer.trim() : "";

  return {
    title: namaToko ? `${namaToko} - Artisan Patisserie & Custom Cake` : "Artisan Patisserie & Custom Cake",
    description: deskripsi,
  };
}

export default async function HomePage() {
  const [popularCakes, toko] = await Promise.all([
    ambilMenuPopuler(),
    ambilTokoPublik(),
  ]);

  return <HomePageClient popularCakes={popularCakes} toko={toko} />;
}
