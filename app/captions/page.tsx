import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { Brand, Footer } from "@/app/components/brand";
import FoodArt from "@/app/components/food-art";
import { dailyChallenge, type Caption } from "@/lib/captions";
import { Generator, VoteControls, CopyCaption } from "./controls";

export const metadata = { title: "Foodfolio | NYC, served with a punchline" };
export default async function CaptionsPage({ searchParams }: { searchParams: Promise<{ sort?: string; mine?: string }> }) {
  const params = await searchParams;
  const sort = params.sort === "top" ? "top" : "new";
  const mine = params.mine === "1";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("get_caption_feed", { p_sort: sort, p_mine: mine });
  const captions = (data || []) as Caption[];
  const challenge = dailyChallenge();
  const prompts = new Map<string, { prompt: string; system_prompt: string }>();
  if (user && captions.some(caption => caption.is_owner)) {
    const { data: own } = await supabase.from("caption_generations").select("id,prompt,system_prompt").in("id", captions.filter(caption => caption.is_owner).map(caption => caption.id));
    own?.forEach(row => prompts.set(row.id, row));
  }
  return <div className="site-shell"><header className="site-header"><Brand /><nav aria-label="Main navigation"><Link href="/" className="nav-link collection-nav">The collection</Link>{user ? <><Link href="/profile" className="nav-link">My profile</Link><form action={signOut}><button className="button button-small button-outline">Sign out</button></form></> : <Link href="/login" className="button button-small">Sign in ↗</Link>}</nav></header>
    <main id="main-content"><section className="caption-hero"><div><p className="eyebrow"><span className="small-dot" /> THE CITY IS YOUR GROUP CHAT</p><h1>Good food.<br /><em>Questionable captions.</em></h1><p className="hero-description">Turn your NYC food adventures into AI punchlines. Vote for the ones that deserve a spot in the group chat.</p><a href="#caption-feed" className="button button-outline">See what’s cooking ↓</a></div><aside className="daily-card"><p className="eyebrow">TODAY’S FOOD SITUATION</p><span className="daily-icon" aria-hidden="true">✳</span><h2>{challenge}</h2><p>A fresh prompt every day. Same NYC appetite.</p><a href="#create-caption" className="text-link">Make it a caption ↗</a></aside></section>
    <div className="caption-layout"><section id="create-caption" className="panel generator-panel" aria-labelledby="generator-heading"><p className="eyebrow">YOUR FOOD MOMENT, REMIXED</p><h2 id="generator-heading">Add a little flavor<span className="brand-dot">.</span></h2><p className="generator-intro">Describe a scene, pick a vibe, let AI do the writing.</p>{user ? <Generator challenge={challenge} /> : <div className="generator-gate"><FoodArt name="pizza" /><h3>Got a story?</h3><p>Sign in to generate your own captions and vote on the community’s favorites.</p><Link href="/login" className="button">Join the table ↗</Link></div>}</section>
    <section id="caption-feed" aria-labelledby="feed-heading"><div className="section-heading"><div><p className="eyebrow">THE COMMUNITY MENU</p><h2 id="feed-heading">Fresh from the feed<span className="brand-dot">.</span></h2></div></div><nav className="feed-tabs" aria-label="Caption filters"><Link href="/captions" aria-current={!mine && sort === "new" ? "page" : undefined}>Newest</Link><Link href="/captions?sort=top" aria-current={!mine && sort === "top" ? "page" : undefined}>Top this week</Link>{user && <Link href="/captions?mine=1" aria-current={mine ? "page" : undefined}>My captions</Link>}</nav>
    {error ? <p role="alert" className="notice notice-error">The caption feed is unavailable. Please try again later.</p> : !captions.length ? <div className="panel empty-feed"><span aria-hidden="true">✦</span><h3>{mine ? "Your first punchline is waiting." : "Be the first to bring the flavor."}</h3><p>{sort === "top" && !mine ? "No captions have been posted this week yet." : "Generate a caption and give the community something to vote on."}</p></div> : <ul className="caption-feed">{captions.map((caption, index) => <li key={caption.id} className={`caption-card food-tone-${index % 3}`}><div className="caption-card-top"><span className="member-tag">AI caption · {caption.tone}</span><time dateTime={caption.created_at}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(caption.created_at))}</time></div><div className="caption-content"><div className="caption-art"><FoodArt name={caption.dish} /><span>{caption.dish}</span></div><blockquote>{caption.caption}</blockquote></div><details className="caption-details"><summary>The scene & AI details</summary><p>{caption.scene}</p><p className="upload-help">Generated with {caption.model}. Food illustration is decorative.</p>{prompts.get(caption.id) && <><p className="upload-help">Your saved generation prompts:</p><pre>{prompts.get(caption.id)?.system_prompt}{"\n\n"}{prompts.get(caption.id)?.prompt}</pre></>}</details><div className="caption-card-actions"><CopyCaption caption={caption.caption} />{caption.is_owner && <span className="upload-help">Your creation</span>}</div><VoteControls id={caption.id} vote={caption.my_vote} score={Number(caption.score)} count={Number(caption.vote_count)} loggedIn={!!user} /></li>)}</ul>}<p className="feed-note">Showing up to 50 captions · One vote per caption. You can change your mind.</p></section></div>
    </main><Footer /></div>;
}
