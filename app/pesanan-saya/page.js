import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PesananSayaRedirectPage() {
  redirect("/user?tab=pesanan");
}
