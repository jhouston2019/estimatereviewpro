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

  const response = NextResponse.next({
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

  /** /create-account is intentionally omitted — post-checkout password step is public. */
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/upload");
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  if (isAdminRoute && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "redirectedFrom",
      pathname + (request.nextUrl.search || "")
    );
    return redirectWithSessionCookies(redirectUrl);
  }

  if (isProtected && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "redirectedFrom",
      pathname + (request.nextUrl.search || "")
    );
    return redirectWithSessionCookies(redirectUrl);
  }

  const referer = request.headers.get("referer");
  let refererFromAdmin = false;
  if (referer) {
    try {
      refererFromAdmin = new URL(referer).pathname.startsWith("/admin");
    } catch {
      refererFromAdmin = false;
    }
  }
  if (
    isAuthPage &&
    session &&
    !request.nextUrl.searchParams.has("admin") &&
    !refererFromAdmin
  ) {
    const from = request.nextUrl.searchParams.get("redirectedFrom");
    const safeFrom =
      from &&
      from.startsWith("/") &&
      !from.startsWith("//") &&
      !from.includes("://")
        ? from
        : null;
    if (safeFrom) {
      return redirectWithSessionCookies(
        new URL(safeFrom, request.nextUrl.origin)
      );
    }
    return redirectWithSessionCookies(
      new URL("/app", request.nextUrl.origin)
    );
  }

  if (isAdminRoute && !isAdminLoginPage && session) {
    const { data: adminRow } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .maybeSingle();

    const row = adminRow as { is_admin?: boolean } | null;
    if (!row?.is_admin) {
      return redirectWithSessionCookies(
        new URL("/admin/login", request.nextUrl.origin)
      );
    }
  }

  const paywallPaths =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/upload");

  // Skip paywall for admins
  if (paywallPaths && session) {
    const { data: adminCheck } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .maybeSingle();

    const isAdmin =
      (adminCheck as { is_admin?: boolean } | null)?.is_admin === true;
    if (isAdmin) return response;
  }

  // Skip paywall for admin users — already checked is_admin above
  if (
    paywallPaths &&
    session &&
    !isPaymentBypassActive() &&
    !isAdminRoute
  ) {
    const { data: paid, error: paidErr } = await supabase.rpc(
      "user_has_paid_access"
    );

    if (paidErr) {
      console.error("[middleware] user_has_paid_access error:", paidErr);
      return response;
    }

    if (paid === false) {
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
    "/upload",
    "/upload/:path*",
    "/admin/:path*",
    "/create-account",
    "/create-account/:path*",
  ],
};
