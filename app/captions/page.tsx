import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { Brand, Footer } from "@/app/components/brand";
import FoodArt from "@/app/components/food-art";
import { type Caption, validVote } from "@/lib/captions";
import { NEIGHBORHOODS, dailyChefChallenge } from "@/lib/food-photo";
import { Generator, VoteControls, PostControls, ChefPost } from "./controls";
export const maxDuration = 120;
export const metadata = { title: "Foodfolio | “Gordon Ramsay”式评价你的美食" };
export default async function CaptionsPage({ searchParams }: { searchParams: Promise<{ sort?: string; mine?: string; saved?: string; area?: string; post?: string }> }) {
  const params = await searchParams;
  const challenge = dailyChefChallenge();
  const sort = params.sort === "top" ? "top" : "new";
  const mine = params.mine === "1", saved = params.saved === "1";
  const area = (NEIGHBORHOODS as readonly string[]).includes(params.area || "") ? params.area! : "";
  const post = params.post && validVote(params.post, 1) ? params.post : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("get_caption_feed", { p_sort: sort, p_mine: mine, p_saved: saved, p_area: area, p_post: post });
  const captions = (data || []) as Caption[];
  const paths = [...new Set(captions.flatMap(caption => [caption.original_path, caption.image_path]).filter((path): path is string => !!path))];
  const imageUrls = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabase.storage.from("food-photos").createSignedUrls(paths, 3600);
    urls?.forEach(row => { if (row.path && row.signedUrl) imageUrls.set(row.path, row.signedUrl); });
  }
  const prompts = new Map<string, { prompt: string; system_prompt: string }>();
  if (user && captions.some(caption => caption.is_owner)) {
    const { data: own } = await supabase.from("caption_generations").select("id,prompt,system_prompt").in("id", captions.filter(caption => caption.is_owner).map(caption => caption.id));
    own?.forEach(row => prompts.set(row.id, row));
  }
  return <div className="site-shell"><header className="site-header"><Brand /><nav aria-label="Main navigation"><Link href="/" className="nav-link collection-nav">The collection</Link>{user ? <><Link href="/captions?saved=1" className="nav-link">Saved</Link><Link href="/profile" className="nav-link">My profile</Link><form action={signOut}><button className="button button-small button-outline">Sign out</button></form></> : <Link href="/login" className="button button-small">Join the table ↗</Link>}</nav></header>
  <main id="main-content"><section className="caption-hero"><div><p className="eyebrow"><span className="small-dot" /> YOUR FOOD. THE CHEF’S VERDICT.</p><h1>“Gordon Ramsay”<br /><em>式评价你的美食</em></h1><p className="hero-description">Upload your real meal for a fiery, funny Gordon Ramsay-style critique. Turn up the heat, earn a compliment, or get a little of both.</p><p className="chef-disclosure">AI 风格模仿 · 非 Gordon Ramsay 本人评价或背书</p><a href="#caption-feed" className="button button-outline">Explore the community ↓</a></div><aside className="daily-card"><p className="eyebrow">TODAY’S KITCHEN CHALLENGE</p><h2>{challenge.style}<span aria-hidden="true"> ✦</span></h2><p>A new critique mode every day</p><p>A new chef-commentary pair each day. Bring your own meal, create your version, and explore this week’s favorites.</p><a href="#create-caption" className="text-link">Try today’s voice ↗</a></aside></section>
  <div className="caption-layout"><section id="create-caption" className="panel generator-panel" aria-labelledby="generator-heading"><p className="eyebrow">MAKE IT YOURS</p><h2 id="generator-heading">Bring it to the pass<span className="brand-dot">.</span></h2><p className="generator-intro">Show us the plate. Choose the heat and language. Read your AI chef critique before sharing.</p>{user ? <Generator challenge={challenge} /> : <div className="generator-gate"><FoodArt name="ramen" /><h3>Bring something to the table.</h3><p>Sign in to get a chef-style critique, vote on the sharpest commentary, and save food discoveries.</p><Link href="/login" className="button">Join the table ↗</Link></div>}</section>
  <section id="caption-feed" aria-labelledby="feed-heading"><div className="section-heading"><div><p className="eyebrow">REAL MEALS. FIERY COMMENTARY.</p><h2 id="feed-heading">{mine ? "My posts & previews" : saved ? "Saved for later" : "Fresh from the community"}<span className="brand-dot">.</span></h2></div></div><nav className="feed-tabs" aria-label="Feed filters"><Link href="/captions" aria-current={!mine && !saved && sort === "new" ? "page" : undefined}>Discover</Link><Link href="/captions?sort=top" aria-current={!mine && !saved && sort === "top" ? "page" : undefined}>This week’s favorites</Link>{user && <><Link href="/captions?mine=1" aria-current={mine ? "page" : undefined}>My posts</Link><Link href="/captions?saved=1" aria-current={saved ? "page" : undefined}>Saved</Link></>}</nav>
  {!mine && !saved && !post && <form className="area-filter" action="/captions"><input name="sort" type="hidden" value={sort} /><label htmlFor="area">Explore a neighborhood</label><select id="area" name="area" defaultValue={area}><option value="">All neighborhoods</option>{NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}</select><button type="submit" className="button button-small button-outline">Explore</button></form>}
  {error ? <p role="alert" className="notice notice-error">The community feed is unavailable. Please try again later.</p> : !captions.length ? <div className="panel empty-feed"><span aria-hidden="true">✦</span><h3>{mine ? "Your first food moment is waiting." : saved ? "A little list of places to try." : "Bring the first bite."}</h3><p>{saved ? "Save posts from the community to keep your food inspiration in one place." : "Your plate is ready for its kitchen audition. Upload a food photo and bring the first chef critique to the community."}</p></div> : <ul className="caption-feed">{captions.map(caption => <li key={caption.id} className="caption-card"><div className="caption-card-top"><span className="post-author">{caption.display_name || "Food explorer"}<small>{caption.neighborhood || "NYC"}</small></span><span className="member-tag">{caption.published_at ? caption.tone : "Private preview"}</span></div><h3 className="post-dish">{caption.dish}</h3>{caption.restaurant && <p className="post-place">↗ {caption.restaurant} · Shared by the poster</p>}
  <ChefPost original={caption.original_path ? imageUrls.get(caption.original_path) : undefined} dish={caption.dish} caption={caption.caption} /><p className="companion-label">{caption.tone} · {caption.reply_style} · {caption.language}</p>{caption.scene && <p className="food-story">{caption.scene}</p>}<p className="ai-note">Real food photo. Original AI style imitation, not Gordon Ramsay’s actual opinion or endorsement.</p>
  <PostControls id={caption.id} published={!!caption.published_at} saved={caption.is_saved} loggedIn={!!user} />{caption.published_at && <><p className="rating-explanation">Rate the AI critique’s humor and creativity, not the restaurant.</p><VoteControls id={caption.id} vote={caption.my_vote} score={Number(caption.score)} count={Number(caption.vote_count)} loggedIn={!!user} /></>}
  {prompts.get(caption.id) && <details className="caption-details"><summary>Your saved AI prompt</summary><pre>{prompts.get(caption.id)?.system_prompt}{"\n\n"}{prompts.get(caption.id)?.prompt}</pre><p>Model: {caption.model}</p></details>}</li>)}</ul>}<p className="feed-note">Up to 50 posts · Places and food stories are shared by users.</p></section></div></main><Footer /></div>;
}
