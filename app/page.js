import { ambilMenuPopuler } from "@/lib/menuPopuler";
import HomePageClient from "@/components/patisserie/HomePageClient";

export const revalidate = 60;

export default async function HomePage() {
  const popularCakes = await ambilMenuPopuler();
  return <HomePageClient popularCakes={popularCakes} />;
}
