import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (!process.env.ADMIN_SETUP_SECRET || secret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const user = users.find(u => u.email === "info@axis-strategic-media.com");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
