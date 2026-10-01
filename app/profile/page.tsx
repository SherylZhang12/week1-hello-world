import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateNames } from "./actions";
import AvatarUpload from "./avatar-upload";
import { Brand, Footer } from "../components/brand";
import { signOut } from "../actions";

type Profile = { first_name: string | null; last_name: string | null; avatar_path: string | null };
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error: loadError } = await supabase.from("profiles").select("first_name, last_name, avatar_path").eq("id", user.id).maybeSingle();
  const profile = data as Profile | null;
  const { error, updated } = await searchParams;
  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60);
    avatarUrl = signed?.signedUrl ?? null;
  }
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your little corner";
  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "F";
  return <div className="site-shell">
    <header className="site-header"><Brand /><nav aria-label="Main navigation"><Link href="/" className="nav-link">The collection</Link><form action={signOut}><button className="button button-small button-outline">Sign out</button></form></nav></header>
    <main id="main-content">
      <div className="page-heading"><p className="eyebrow">A LITTLE MORE YOU</p><h1>My profile<span className="brand-dot">.</span></h1><p>Your name, your photo, your place at the table.</p></div>
      {loadError && <p role="alert" className="notice notice-error">Could not load your profile. Run the Week 3 database setup first.</p>}
      {!loadError && (!profile?.first_name || !profile?.last_name) && <p className="notice">Welcome! Add your first and last name to make yourself at home.</p>}
      {updated && <p role="status" className="notice notice-success">Profile saved. Looking good!</p>}
      {error && <p role="alert" className="notice notice-error">{error === "photo" ? "Choose a JPG, PNG, or WebP image smaller than 5 MB." : error === "names" ? "Enter a first and last name, each under 80 characters." : "Could not save your changes. Check the Supabase table, bucket, and policies."}</p>}
      <div className="profile-layout">
        <aside className="panel profile-summary">
          {avatarUrl ? <Image unoptimized src={avatarUrl} alt="Your profile photo" width={112} height={112} className="avatar" /> : <div className="avatar avatar-placeholder" aria-label="Your initials">{initials}</div>}
          <h2>{displayName}</h2><p className="profile-email">Signed in as<br />{user.email}</p><span className="member-tag">✦ FOODFOLIO MEMBER</span>
          <p className="profile-tip">Good food is even better with good company.<br /><Link href="/private" className="text-link">Visit the members-only space ↗</Link></p>
        </aside>
        <div className="profile-settings">
          <section className="panel"><div className="panel-heading"><span className="step-number" aria-hidden="true">01</span><div><h2>Your details</h2><p>A familiar name makes it feel like home.</p></div></div>
            <form action={updateNames}><div className="form-row"><label className="field">First name<input name="first_name" autoComplete="given-name" required maxLength={80} defaultValue={profile?.first_name ?? ""} placeholder="Your first name" /></label><label className="field">Last name<input name="last_name" autoComplete="family-name" required maxLength={80} defaultValue={profile?.last_name ?? ""} placeholder="Your last name" /></label></div><button type="submit" className="button">Save names <span aria-hidden="true">↗</span></button></form>
          </section>
          <section className="panel"><div className="panel-heading"><span className="step-number" aria-hidden="true">02</span><div><h2>Your photo</h2><p>A face, a pet, or something that feels like you.</p></div></div><AvatarUpload /></section>
        </div>
      </div>
    </main><Footer />
  </div>;
}
