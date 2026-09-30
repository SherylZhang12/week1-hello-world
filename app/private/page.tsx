import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PrivatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 p-8">
      <h1 className="text-3xl font-bold">Members-only page</h1>
      <p>This page is only available after signing in. Welcome, {user.email}.</p>
      <Link href="/profile" className="underline">Go to your profile</Link>
    </main>
  );
}
