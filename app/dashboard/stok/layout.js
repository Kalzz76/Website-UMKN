import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";

export default async function StokLayout({ children }) {
  const { diizinkan } = await cekRole(["admin", "staf"]);
  if (!diizinkan) {
    redirect("/dashboard");
  }
  return children;
}
