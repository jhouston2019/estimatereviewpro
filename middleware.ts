import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./lib/supabase-types";
import {
  isPaymentBypassActive,
  productionBypassPaymentMisconfigurationResponse,
} from "./lib/billing/devBypass";

export async function middleware(request: NextRequest) {
  if (productionBypassPaymentMisconfigurationResponse()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  /** Preserve refreshed auth cookies on redirects. */
  const redirectWithSessionCookies = (url: URL | string) => {
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => {
      r.cookies.set(c.name, c.value, {
        path: "/",
      });
    });
    return r;
  };

  const pathname = request.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/estimate-review") ||
    pathname.startsWith("/upload");
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return redirectWithSessionCookies(redirectUrl);
  }

  if (isProtected && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return redirectWithSessionCookies(redirectUrl);
  }

  if (isAuthPage && session) {
    return redirectWithSessionCookies(
      new URL("/dashboard", request.nextUrl.origin)
    );
  }

  if (isAdminRoute && session) {
    const { data: adminRow } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .maybeSingle();

    const row = adminRow as { is_admin?: boolean } | null;
    if (!row?.is_admin) {
      return redirectWithSessionCookies(
        new URL("/dashboard", request.nextUrl.origin)
      );
    }
  }

  const paywallPaths =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/estimate-review") ||
    pathname.startsWith("/upload");

  if (paywallPaths && session && !isPaymentBypassActive()) {
    const { data: paid, error: paidErr } = await supabase.rpc(
      "user_has_paid_access"
    );

    if (paidErr) {
      console.error("[middleware] user_has_paid_access error:", paidErr);
    }

    if (paid !== true) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/pricing";
      redirectUrl.searchParams.set("message", "payment_required");
      return redirectWithSessionCookies(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/estimate-review/:path*",
    "/upload",
    "/upload/:path*",
    "/admin/:path*",
  ],
};
