import { redirect } from "next/navigation";

export default async function DetailTiketRedirectPage(props) {
  const params = await props.params;
  const kode = params?.kode;
  if (kode) {
    redirect(`/user/${encodeURIComponent(kode)}`);
  }
  redirect("/user");
}
