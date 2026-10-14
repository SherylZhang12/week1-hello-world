import { StartHere } from "@/app/components/getting-started";
import SiteHeader from "@/app/components/site-header";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Arrow, Footer } from "./components/brand";
import FoodArt from "./components/food-art";
import FavoriteRating from "./components/favorite-rating";
import { cleanFoodPreferenceName } from "@/lib/food-preferences";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: foods, error } = await supabase.from("favorite_foods").select("*").order("id");
  const { data: personalRatings } = user
    ? await supabase.from("user_food_preferences").select("food_key,rating").eq("user_id", user.id)
    : { data: null };
  const ratingByFood = new Map((personalRatings ?? []).map((item) => [String(item.food_key), Number(item.rating)]));

  return <div className="site-shell">
    <SiteHeader loggedIn={!!user} />
    <main id="main-content">
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><span className="small-dot" /> FOLLOW YOUR CRAVINGS. SHARE YOUR FINDS.</p>
          <h1>Your next bite.<br /><em>Your honest take.</em></h1>
          <p className="hero-description">Find food that fits today’s cravings and plan your next meals around your goals. Share real photos, restaurant names and honest reviews. Then hand the mic to a fiery chef, your cat or your dog.</p>
          <div className="hero-actions"><Link href="/eat" className="button">What should I eat? <Arrow /></Link><Link href="/captions#create-caption" className="button button-outline">Share a meal ✦</Link></div><p className="chef-disclosure">Your real experience, plus playful AI reactions. Gordon Ramsay-style commentary is one optional voice, not his actual review.</p><p style={{marginTop: 16}}><a href="#favorites" className="text-link">Explore the original collection ↓</a></p>
          <div className="hero-note"><span aria-hidden="true">✳</span> From around the world, with love.</div>
        </div>
        <div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <span className="handwritten">what’s your next craving?</span><FoodArt name="sushi" className="hero-food" />
          <div className="floating-label"><span aria-hidden="true">✦</span> Discover. Eat. Share.</div><span className="hero-spark" aria-hidden="true">✳</span>
        </div>
      </section>
      <StartHere />
      <section className="meal-coach-banner"><div><p className="eyebrow">MAKE THE REST OF YOUR DAY EASIER</p><h2>Breakfast eaten. What’s next?</h2><p>Upload today’s meals and get ideas for lunch, dinner or tomorrow, shaped by your food goals.</p></div><Link href="/meal-coach" className="button button-outline">Try the daily meal coach <Arrow /></Link></section>
      <section id="favorites" className="collection" aria-labelledby="collection-heading">
        <div className="section-heading"><div><p className="eyebrow">QUICK CRAVINGS · POWERED BY YOUR SUPABASE LIST</p><h2 id="collection-heading">Rate foods you love<span className="brand-dot">.</span></h2></div><p>Rate a sample, or add any food to your personal list.</p></div>
        {error && <p role="alert" className="notice notice-error">Could not load favorite foods. Please try again later.</p>}
        {!error && !foods?.length && <p className="notice">The collection is waiting for its first favorite.</p>}
        <ul className="food-grid">{foods?.map((food, index) => { const target = `/eat?food=${encodeURIComponent(String(food.name))}`; const foodKey = cleanFoodPreferenceName(String(food.name))?.key ?? String(food.name).toLowerCase(); return <li key={food.id} className={`food-card food-tone-${index % 3}`}><Link className="food-card-link" href={user ? target : `/login?next=${encodeURIComponent(target)}`} aria-label={`Find ${food.name} near me`}>
          <div className="food-picture"><span className="food-number">{String(index + 1).padStart(2, "0")}</span><span className="food-action-badge">Search nearby ↗</span><FoodArt name={String(food.name)} /></div>
          <div className="food-info"><p className="food-country"><span aria-hidden="true">⌖</span> {food.country}</p><div className="food-title-row"><h3>{food.name}</h3><span className="rating sample-rating"><span aria-hidden="true">★</span> {food.rating}<small>/10 · sample</small></span></div><strong className="food-card-action">Find {food.name} restaurants near me →</strong></div>
        </Link><FavoriteRating foodName={String(food.name)} initialRating={ratingByFood.get(foodKey) ?? null} loggedIn={!!user} /></li>; })}
          <li className="food-card more-food-card"><Link className="food-card-link" href={user ? "/favorites" : "/login?next=%2Ffavorites"}>
            <div className="food-picture more-food-picture"><span className="food-number">04</span><span className="food-action-badge">Add yours ↗</span><span className="more-food-plus" aria-hidden="true">＋</span></div>
            <div className="food-info"><p className="food-country"><span aria-hidden="true">✦</span> YOUR OWN LIST</p><div className="food-title-row"><h3>More</h3></div><strong className="food-card-action">Add a food and rate it →</strong></div>
          </Link></li>
        </ul>
      </section>
      <section className="join-banner"><div><p className="eyebrow">YOUR OWN LITTLE CORNER</p><h2>{user ? "Welcome back to the table." : "Come for the food. Stay a while."}</h2><p>{user ? "Make yourself at home. Your profile and members-only space are ready." : "Sign in to make your profile yours and step into the members-only space."}</p></div><Link href={user ? "/profile" : "/login"} className="button">{user ? "Your profile" : "Join the table"} <Arrow /></Link></section>
      {user && <p className="account-note">Signed in as {user.email} · <Link href="/private">Members-only page ↗</Link></p>}
    </main><Footer />
  </div>;
}
