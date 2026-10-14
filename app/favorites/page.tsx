import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/app/components/site-header";
import { Footer } from "@/app/components/brand";
import { createClient } from "@/lib/supabase/server";
import PreferenceForm from "./preference-form";

type FoodPreference = { food_key: string; food_name: string; rating: number; updated_at: string };

export default async function FoodPreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Ffavorites");
  const { data, error } = await supabase.from("user_food_preferences")
    .select("food_key,food_name,rating,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const preferences = (data ?? []) as FoodPreference[];

  return <div className="site-shell">
    <SiteHeader loggedIn />
    <main id="main-content">
      <div className="page-heading"><p className="eyebrow">MY FOOD PREFERENCES</p><h1>Foods I love<span className="brand-dot">.</span></h1><p>Add any food and give it your own 1–10 rating.</p></div>
      <div className="preference-layout">
        <section className="panel preference-create"><div className="panel-heading"><span className="step-number" aria-hidden="true">＋</span><div><h2>Add a food</h2><p>Saving the same food again updates your rating.</p></div></div><PreferenceForm /></section>
        <section className="panel preference-list"><div className="panel-heading"><span className="step-number" aria-hidden="true">★</span><div><h2>My ratings</h2><p>Your private, general food-preference list.</p></div></div>
          {error && <p role="alert" className="notice notice-error">Food preferences are not ready yet. Run the new Supabase setup SQL.</p>}
          {!error && preferences.length === 0 && <p className="notice">No foods yet. Add the first one!</p>}
          {!error && preferences.length > 0 && <ul className="preference-items">{preferences.map(item => <li key={item.food_key}><div><strong>{item.food_name}</strong><span>★ {item.rating}/10</span></div><Link className="text-link" href={`/eat?food=${encodeURIComponent(item.food_name)}`}>Find it nearby →</Link></li>)}</ul>}
        </section>
      </div>
    </main><Footer />
  </div>;
}
