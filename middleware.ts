import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./lib/supabase-types";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/account") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/estimate-review");
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isProtected && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  // Check payment status for upload/estimate-review pages
  if ((pathname.startsWith("/upload") || pathname.startsWith("/estimate-review")) && session) {
    type UserPaymentStatus = {
      plan_type: string | null;
      team_id: string | null;
    };

    const { data } = await supabase
      .from('users')
      .select('plan_type, team_id')
      .eq('id', session.user.id)
      .maybeSingle();

    const user = data as UserPaymentStatus | null;

    // If user exists but has no plan and no team, redirect to pricing
    if (user && !user.plan_type && !user.team_id) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/pricing";
      redirectUrl.searchParams.set("message", "payment_required");
      return NextResponse.redirect(redirectUrl);
    }
    
    // If user doesn't exist in our database yet (just paid), allow access
    // The webhook will create their account shortly
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/account", "/login", "/register", "/upload", "/estimate-review"],
};


