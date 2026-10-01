import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { Arrow, Brand, Footer } from "./components/brand";
import FoodArt from "./components/food-art";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: foods, error } = await supabase.from("favorite_foods").select("*").order("id");

  return <div className="site-shell">
    <header className="site-header"><Brand /><nav aria-label="Main navigation">
      <a href="#favorites" className="nav-link collection-nav">The collection</a>
      {user ? <><Link href="/profile" className="nav-link">My profile</Link><form action={signOut}><button className="button button-small button-outline">Sign out</button></form></> : <Link href="/login" className="button button-small">Sign in <Arrow /></Link>}
    </nav></header>
    <main id="main-content">
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><span className="small-dot" /> A LITTLE COLLECTION OF GOOD TASTE</p>
          <h1>Life tastes better<br />with <em>favorite foods.</em></h1>
          <p className="hero-description">A place for the dishes I love, the flavors I come back to, and a little inspiration for your next bite.</p>
          <a href="#favorites" className="button">Explore my favorites <span aria-hidden="true">↓</span></a>
          <div className="hero-note"><span aria-hidden="true">✳</span> From around the world, with love.</div>
        </div>
        <div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <span className="handwritten">a few of my favorite things</span><FoodArt name="sushi" className="hero-food" />
          <div className="floating-label"><span aria-hidden="true">✦</span> Good food, good mood.</div><span className="hero-spark" aria-hidden="true">✳</span>
        </div>
      </section>
      <section id="favorites" className="collection" aria-labelledby="collection-heading">
        <div className="section-heading"><div><p className="eyebrow">THE SHORTLIST</p><h2 id="collection-heading">My favorite foods<span className="brand-dot">.</span></h2></div><p>Personally picked. Happily rated.</p></div>
        {error && <p role="alert" className="notice notice-error">Could not load favorite foods. Please try again later.</p>}
        {!error && !foods?.length && <p className="notice">The collection is waiting for its first favorite.</p>}
        <ul className="food-grid">{foods?.map((food, index) => <li key={food.id} className={`food-card food-tone-${index % 3}`}>
          <div className="food-picture"><span className="food-number">{String(index + 1).padStart(2, "0")}</span><FoodArt name={String(food.name)} /></div>
          <div className="food-info"><p className="food-country"><span aria-hidden="true">↗</span> {food.country}</p><div className="food-title-row"><h3>{food.name}</h3><span className="rating"><span aria-hidden="true">★</span> {food.rating}<small>/10</small></span></div></div>
        </li>)}</ul>
      </section>
      <section className="join-banner"><div><p className="eyebrow">YOUR OWN LITTLE CORNER</p><h2>{user ? "Welcome back to the table." : "Come for the food. Stay a while."}</h2><p>{user ? "Make yourself at home. Your profile and members-only space are ready." : "Sign in to make your profile yours and step into the members-only space."}</p></div><Link href={user ? "/profile" : "/login"} className="button">{user ? "Your profile" : "Join the table"} <Arrow /></Link></section>
      {user && <p className="account-note">Signed in as {user.email} · <Link href="/private">Members-only page ↗</Link></p>}
    </main><Footer />
  </div>;
}
