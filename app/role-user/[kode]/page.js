import { redirect } from "next/navigation";

export default async function RoleUserDetailRedirectPage(props) {
  const params = await props.params;
  const kode = params?.kode;
  if (kode) {
    redirect(`/user/${encodeURIComponent(kode)}`);
  }
  redirect("/user");
}
