import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserTiketRedirectPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const kode = params?.kode || "";
  const query = new URLSearchParams(searchParams || {}).toString();
  const target = `/pesanan-saya/${kode}${query ? `?${query}` : ""}`;
  redirect(target);
}
