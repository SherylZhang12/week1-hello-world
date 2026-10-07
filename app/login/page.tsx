"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brand, Footer } from "../components/brand";
import FoodArt from "../components/food-art";

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(false); }
    } catch {
      setError("Could not connect. Please try again.");
      setLoading(false);
    }
  }
  return <div className="site-shell">
    <header className="site-header"><Brand /><Link href="/" className="nav-link text-link">Back to the collection ↗</Link></header>
    <main id="main-content" className="login-main">
      <aside className="login-art"><p className="eyebrow">GOOD TASTE, GOOD COMPANY</p><h2>A seat at<br /><em>the table.</em></h2><FoodArt name="sushi" /><p>Your favorite little corner of the internet.</p></aside>
      <section className="login-card"><p className="eyebrow">WELCOME TO FOODFOLIO</p><h1>Make yourself<br />at home.</h1><p className="login-description">Sign in to add tiny dining companions to your food photos, share your creations, and save your next food discovery.</p>
        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="button google-button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M22 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.6a4.8 4.8 0 0 1-2.1 3.2v2.6h3.4c2-1.9 3.1-4.5 3.1-7.7Z"/><path fill="#34a853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H2.7v2.7A10.4 10.4 0 0 0 12 22Z"/><path fill="#fbbc05" d="M6.2 13.7a6.2 6.2 0 0 1 0-3.4V7.6H2.7a10 10 0 0 0 0 8.8Z"/><path fill="#ea4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 2.7 7.6l3.5 2.7A6.1 6.1 0 0 1 12 6.1Z"/></svg>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button><p className="login-footnote">No extra password to remember. Just you.</p>
        {(error || searchParams.has("error")) && <p role="alert" className="notice notice-error">{error ?? "Sign in could not be completed. Please try again."}</p>}
        <Link href="/" className="text-link">Just browsing? Explore the favorites →</Link>
      </section>
    </main><Footer />
  </div>;
}
export default function LoginPage() {
  return <Suspense fallback={<main id="main-content" className="site-shell page-heading">Loading login…</main>}><LoginForm /></Suspense>;
}
