import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const cookieStore = await cookies();
      let requestedNext = "";
      try { requestedNext = decodeURIComponent(cookieStore.get("foodfolio_next")?.value || ""); } catch { requestedNext = ""; }
      const next = requestedNext === "/#favorites" || /^\/(?:eat|captions|meal-coach|profile)(?:[/?#]|$)/.test(requestedNext) ? requestedNext : "/captions";
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("foodfolio_next");
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
