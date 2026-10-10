import SiteHeader from "@/app/components/site-header";
import Link from "next/link";
import { Footer } from "@/app/components/brand";
import { createClient } from "@/lib/supabase/server";
import MealCoach from "./coach";
export const metadata = { title: "Foodfolio | Daily meal coach" };
export const maxDuration = 60;
export default async function MealCoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="site-shell"><SiteHeader loggedIn={!!user} /><main id="main-content"><section className="caption-hero"><div><p className="eyebrow">YOUR DAY. YOUR FOOD GOALS.</p><h1>Start with breakfast.<br /><em>Plan the next bite.</em></h1><p className="hero-description">Share meals you’ve already eaten, add your context, and get practical ideas for what to eat next.</p></div><aside className="daily-card"><h2>A little guidance for your day.</h2><p>Balanced eating, muscle support, or a Mediterranean-style anti-inflammatory eating pattern. Your goals shape the suggestions.</p><p className="upload-help">Food guidance, not inflammation diagnosis or guaranteed results.</p></aside></section>{user ? <MealCoach /> : <div className="panel"><h2>Your daily meal coach is ready.</h2><p>Sign in to upload today’s meals and plan your next ones.</p><Link href="/login" className="button">Sign in to plan my meals ↗</Link></div>}</main><Footer /></div>;
}
