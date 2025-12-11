import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
  createMiddlewareClient,
} from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import type { Database } from "./supabase-types";

export function createSupabaseServerComponentClient() {
  return createServerComponentClient<Database>({ cookies });
}

export function createSupabaseRouteHandlerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}

export function createSupabaseMiddlewareClient(req: NextRequest, res: Response) {
  return createMiddlewareClient<Database>({ req, res });
}


