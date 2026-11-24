import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";

export default async function LaporanLayout({ children }) {
  const { profil, diizinkan } = await cekRole(["admin"]);
  if (!diizinkan) {
    redirect(profil?.role === "staf" ? "/dashboard/hari-ini" : "/dashboard");
  }
  return children;
}
