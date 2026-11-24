import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";

export const metadata = {
  title: "Checkout & Pengiriman",
  description: "Lengkapi data pengiriman dan pembayaran pesanan kue Anda.",
};

export default async function CheckoutLayout({ children }) {
  const { user, profil, diizinkan } = await cekRole(["pelanggan"]);
  if (!diizinkan || !user) {
    if (profil && (profil.role === "admin" || profil.role === "staf")) {
      redirect("/dashboard");
    }
    redirect("/masuk?ke=/checkout");
  }
  return children;
}
