import { redirect } from "next/navigation";

export default async function PesananSayaRedirectPage(props) {
  const sp = await props.searchParams;
  const tab = sp?.tab;
  if (tab) {
    redirect(`/user?tab=${encodeURIComponent(tab)}`);
  }
  redirect("/user");
}
