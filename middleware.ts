import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "./lib/supabase-types";
import {
  isPaymentBypassActive,
  productionBypassPaymentMisconfigurationResponse,
} from "./lib/billing/devBypass";

/** JWT app_metadata (custom claims); no database calls. */
function isAdminFromAppMetadata(user: User | undefined): boolean {
  return user?.app_metadata?.is_admin === true;
}

/** Paid access: non-null, non-empty plan_type in app_metadata. */
function hasPaidAccessFromAppMetadata(user: User | undefined): boolean {
  const planType = user?.app_metadata?.plan_type;
  if (planType == null) return false;
  if (typeof planType === "string" && !planType.trim()) return false;
  return true;
}

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

  if (isAuthPage && session && !request.nextUrl.searchParams.has("admin")) {
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
    if (!isAdminFromAppMetadata(session.user)) {
      return redirectWithSessionCookies(
        new URL("/admin/login", request.nextUrl.origin)
      );
    }
  }

  const paywallPaths =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/upload");

  if (paywallPaths && session) {
    if (isAdminFromAppMetadata(session.user)) return response;
  }

  // Skip paywall for admin users — is_admin comes from app_metadata above
  if (
    paywallPaths &&
    session &&
    !isPaymentBypassActive() &&
    !isAdminRoute
  ) {
    if (!hasPaidAccessFromAppMetadata(session.user)) {
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
