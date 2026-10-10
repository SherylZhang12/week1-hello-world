import { PostingGuide } from "@/app/components/getting-started";
import SiteHeader from "@/app/components/site-header";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/app/components/brand";
import FoodArt from "@/app/components/food-art";
import { type Caption, validVote } from "@/lib/captions";
import { NEIGHBORHOODS, dailyChefChallenge } from "@/lib/food-photo";
import { Generator, VoteControls, PostControls, ChefPost } from "./controls";
export const maxDuration = 120;
export const metadata = { title: "Foodfolio | Real meals, honest reviews & playful reactions" };
export default async function CaptionsPage({ searchParams }: { searchParams: Promise<{ sort?: string; mine?: string; saved?: string; area?: string; post?: string; restaurant?: string }> }) {
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
  return <div className="site-shell"><SiteHeader loggedIn={!!user} />
  <main id="main-content"><section className="caption-hero"><div><p className="eyebrow"><span className="small-dot" /> REAL MEALS. HONEST TAKES.</p><h1>Your meal.<br /><em>Everyone’s got opinions.</em></h1><p className="hero-description">Share where you ate and what you really thought. Add a Gordon Ramsay-style chef roast, or let your cat or dog borrow your phone.</p><p className="chef-disclosure">Your review is yours. AI reactions are fictional; the chef voice is not Gordon Ramsay’s actual review or endorsement.</p><a href="#caption-feed" className="button button-outline">Explore the community ↓</a></div><aside className="daily-card"><p className="eyebrow">TODAY’S KITCHEN CHALLENGE</p><h2>{challenge.style}<span aria-hidden="true"> ✦</span></h2><p>A new critique mode every day</p><p>Try a new reaction mode each day. Bring your own meal, create your version, and explore this week’s favorites.</p><a href="#create-caption" className="text-link">Try today’s voice ↗</a></aside></section>
  <PostingGuide />
  <div className="caption-layout"><section id="create-caption" className="panel generator-panel" aria-labelledby="generator-heading"><p className="eyebrow">MAKE IT YOURS</p><h2 id="generator-heading">Share your meal<span className="brand-dot">.</span></h2><p className="generator-intro">Upload a photo, name the place, and write your honest review. Pick an AI voice and preview both takes before sharing.</p>{user ? <Generator challenge={challenge} restaurant={String(params.restaurant || "").slice(0,100)} /> : <div className="generator-gate"><FoodArt name="ramen" /><div className="upload-zone guest-upload"><strong>01 · Upload your food photo</strong><span className="upload-help">JPG, PNG or WebP · Up to 5 MB</span><p>Sign in to choose a photo and get your playful AI reaction.</p><Link href="/login" className="button">Sign in to upload a photo ↗</Link></div><h3>Your food story belongs here.</h3><p>Sign in to get a playful AI reaction, vote on the sharpest commentary, and save food discoveries.</p><Link href="/login" className="button">Join the table ↗</Link></div>}</section>
  <section id="caption-feed" aria-labelledby="feed-heading"><div className="section-heading"><div><p className="eyebrow">GOOD FOOD. REAL PEOPLE.</p><h2 id="feed-heading">{mine ? "My posts & previews" : saved ? "Saved for later" : "Fresh from the community"}<span className="brand-dot">.</span></h2></div></div><nav className="feed-tabs" aria-label="Feed filters"><Link href="/captions" aria-current={!mine && !saved && sort === "new" ? "page" : undefined}>Discover</Link><Link href="/captions?sort=top" aria-current={!mine && !saved && sort === "top" ? "page" : undefined}>This week’s favorites</Link>{user && <><Link href="/captions?mine=1" aria-current={mine ? "page" : undefined}>My posts</Link><Link href="/captions?saved=1" aria-current={saved ? "page" : undefined}>Saved</Link></>}</nav>
  {!mine && !saved && !post && <form className="area-filter" action="/captions"><input name="sort" type="hidden" value={sort} /><label htmlFor="area">Explore a neighborhood</label><select id="area" name="area" defaultValue={area}><option value="">All neighborhoods</option>{NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}</select><button type="submit" className="button button-small button-outline">Explore</button></form>}
  {error ? <p role="alert" className="notice notice-error">The community feed is unavailable. Please try again later.</p> : !captions.length ? <div className="panel empty-feed"><span aria-hidden="true">✦</span><h3>{mine ? "Your first food moment is waiting." : saved ? "A little list of places to try." : "Bring the first bite."}</h3><p>{saved ? "Save posts from the community to keep your food inspiration in one place." : "Your plate is ready for its kitchen audition. Upload a food photo and bring the first review to the community."}</p></div> : <ul className="caption-feed">{captions.map(caption => <li key={caption.id} className="caption-card"><div className="caption-card-top"><span className="post-author">{caption.display_name || "Food explorer"}<small>{caption.neighborhood || "NYC"}</small></span><span className="member-tag">{caption.published_at ? caption.tone : "Private preview"}</span></div><h3 className="post-dish">{caption.dish}</h3>{caption.restaurant && <p className="post-place">↗ {caption.restaurant} · Shared by the poster</p>}
  <ChefPost original={caption.original_path ? imageUrls.get(caption.original_path) : undefined} dish={caption.dish} caption={caption.caption} persona={caption.tone} review={caption.personal_review || ""} rating={caption.personal_rating ?? null} /><p className="companion-label">{caption.tone} · {caption.reply_style} · {caption.language}</p>{caption.scene && <p className="food-story">{caption.scene}</p>}<p className="ai-note">Real food photo and personal review. AI reactions are fictional entertainment.</p>
  <PostControls id={caption.id} published={!!caption.published_at} saved={caption.is_saved} loggedIn={!!user} />{caption.published_at && <><p className="rating-explanation">Vote on the AI reaction’s humor and creativity. The personal star rating belongs to the poster.</p><VoteControls id={caption.id} vote={caption.my_vote} score={Number(caption.score)} count={Number(caption.vote_count)} loggedIn={!!user} /></>}
  {prompts.get(caption.id) && <details className="caption-details"><summary>Your saved AI prompt</summary><pre>{prompts.get(caption.id)?.system_prompt}{"\n\n"}{prompts.get(caption.id)?.prompt}</pre><p>Model: {caption.model}</p></details>}</li>)}</ul>}<p className="feed-note">Up to 50 posts · Places and food stories are shared by users.</p></section></div></main><Footer /></div>;
}
