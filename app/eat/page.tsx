import SiteHeader from "@/app/components/site-header";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/app/components/brand";
import FoodFinder from "./finder";
export const metadata = { title: "Foodfolio | What should I eat today?" };
export const maxDuration = 60;
export default async function EatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="site-shell"><SiteHeader loggedIn={!!user} /><main id="main-content"><section className="caption-hero"><div><p className="eyebrow">FOLLOW YOUR CRAVINGS</p><h1>What should I<br /><em>eat today?</em></h1><p className="hero-description">A little indecisive? Tell us what you want, what you don’t, and where to look. Your next meal starts here.</p></div><aside className="daily-card"><h2>Find it. Eat it. Tell us.</h2><p>Discover a restaurant, share your honest experience, then let a fiery chef, your cat or your dog have a say.</p><Link href="/captions" className="text-link">Share a meal ↗</Link></aside></section>{user ? <FoodFinder /> : <div className="panel"><h2>Find your next bite.</h2><p>Sign in to search near your location or a NYC neighborhood.</p><Link href="/login" className="button">Sign in to find food ↗</Link></div>}</main><Footer /></div>;
}
