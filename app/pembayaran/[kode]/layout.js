import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";

export const metadata = {
  title: "Pembayaran Pesanan",
  description: "Selesaikan pembayaran pesanan kue Anda.",
};

export default async function PembayaranLayout({ children }) {
  const { user, profil, diizinkan } = await cekRole(["pelanggan"]);
  if (!diizinkan || !user) {
    if (profil && (profil.role === "admin" || profil.role === "staf")) {
      redirect("/dashboard");
    }
    redirect("/masuk?ke=/pesanan-saya");
  }
  return children;
}
