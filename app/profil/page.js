import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";

export const dynamic = "force-dynamic";

export default async function ProfilRedirectPage() {
  const { user, profil } = await cekRole(["pelanggan", "admin", "staf"]);

  if (!user) {
    redirect("/masuk?ke=/user?tab=profil");
  }

  if (profil && (profil.role === "admin" || profil.role === "staf")) {
    redirect("/dashboard/profil");
  }

  redirect("/user?tab=profil");
}
