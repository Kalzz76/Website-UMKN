import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";

export const metadata = {
  title: "Keranjang Belanja",
  description: "Rincian pesanan kue di keranjang belanja Anda.",
};

export default async function KeranjangLayout({ children }) {
  const { user, profil, diizinkan } = await cekRole(["pelanggan"]);
  if (!diizinkan || !user) {
    if (profil && (profil.role === "admin" || profil.role === "staf")) {
      redirect("/dashboard");
    }
    redirect("/masuk?ke=/keranjang");
  }
  return children;
}
