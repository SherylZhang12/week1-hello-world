"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 p-8">
      <h1 className="text-3xl font-bold">Log in</h1>
      <p>Sign in with Google to access your account.</p>
      <button type="button" onClick={handleGoogleLogin} disabled={loading}
        className="w-fit rounded-md bg-foreground px-5 py-3 text-background disabled:opacity-50">
        {loading ? "Redirecting…" : "Sign in with Google"}
      </button>
      {(error || searchParams.has("error")) && (
        <p role="alert" className="text-red-600">
          {error ?? "Sign in could not be completed. Please try again."}
        </p>
      )}
      <Link href="/" className="underline">Back to favorite foods</Link>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="p-8">Loading login…</main>}><LoginForm /></Suspense>;
}
