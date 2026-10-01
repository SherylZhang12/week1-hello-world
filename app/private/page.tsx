import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Arrow, Brand, Footer } from "../components/brand";
export default async function PrivatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <div className="site-shell">
    <header className="site-header"><Brand /><nav aria-label="Main navigation"><Link href="/" className="nav-link">The collection</Link><Link href="/profile" className="button button-small button-outline">My profile <Arrow /></Link></nav></header>
    <main id="main-content" className="members-main"><section className="panel members-panel"><span className="members-symbol" aria-hidden="true">✳</span><p className="eyebrow">MEMBERS-ONLY SPACE</p><h1>You’re part of<br /><em>the good company.</em></h1><p>This little corner is just for signed-in members.<br />Welcome, {user.email}.</p><Link href="/profile" className="button">Make your profile yours <Arrow /></Link></section></main><Footer />
  </div>;
}
