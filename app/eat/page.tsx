import SiteHeader from "@/app/components/site-header";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/app/components/brand";
import FoodFinder from "./finder";
export const metadata = { title: "Foodfolio | What should I eat today?" };
export const maxDuration = 60;
const QUICK_CRAVINGS: Record<string, string> = { sushi: "Japanese", "hot pot": "Chinese", pasta: "Italian" };
export default async function EatPage({ searchParams }: { searchParams: Promise<{ food?: string }> }) {
  const requestedFood = String((await searchParams).food || "").trim().slice(0, 50);
  const initialWants = QUICK_CRAVINGS[requestedFood.toLowerCase()] || "";
  const quickPick = initialWants ? requestedFood : "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="site-shell"><SiteHeader loggedIn={!!user} /><main id="main-content"><section className="caption-hero"><div><p className="eyebrow">FOLLOW YOUR CRAVINGS</p><h1>{quickPick ? <>Let’s find<br /><em>{quickPick}.</em></> : <>What should I<br /><em>eat today?</em></>}</h1><p className="hero-description">{quickPick ? `You picked ${quickPick} from your favorites. We translated it into a ${initialWants} restaurant search; choose where and how far below.` : "A little indecisive? Tell us what you want, what you don’t, and where to look. Your next meal starts here."}</p></div><aside className="daily-card"><h2>Find it. Eat it. Tell us.</h2><p>Discover a restaurant, share your honest experience, then let a fiery chef, your cat or your dog have a say.</p><Link href="/captions" className="text-link">Share a meal ↗</Link></aside></section>{user ? <FoodFinder initialWants={initialWants} mealDish={quickPick} /> : <div className="panel"><h2>{quickPick ? `${quickPick} is selected.` : "Find your next bite."}</h2><p>Sign in to search near your location or a NYC neighborhood. Your quick craving will remain in this page’s URL.</p><Link href="/login" className="button">Sign in to find food ↗</Link></div>}</main><Footer /></div>;
}
