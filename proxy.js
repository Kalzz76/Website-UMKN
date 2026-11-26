import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/user",
  "/pesanan-saya",
  "/profil",
  "/keranjang",
  "/checkout",
  "/pembayaran",
];

/**
 * Refreshes expiring Supabase auth session cookies on page navigations
 * without triggering concurrent refresh-token races on prefetches.
 */
export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip Next.js Link prefetch requests so parallel prefetches never race
  // against each other on Supabase refresh-token rotation.
  if (
    request.headers.get("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch"
  ) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    path.startsWith(prefix)
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/masuk";
      redirectUrl.searchParams.set("ke", path);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const expiresAtMs = (session.expires_at || 0) * 1000;
  const isExpiringSoon = expiresAtMs - Date.now() <= 60_000;

  if (!isExpiringSoon) {
    return response;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isTransientServerError =
    Boolean(error) && (error.status === undefined || error.status >= 500);

  if (!user && isProtected && !isTransientServerError) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/masuk";
    redirectUrl.searchParams.set("ke", path);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
