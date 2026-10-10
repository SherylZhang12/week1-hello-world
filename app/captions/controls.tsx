"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createCaption, rateCaption, publishPhoto, savePhoto } from "./actions";
import { REPLY_STYLES, NEIGHBORHOODS, PERSONAS, PERSONA_DETAILS, personaLabel } from "@/lib/food-photo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function Generator({ challenge, restaurant = "" }: { challenge: { persona: string; style: string }; restaurant?: string }) {
  const [persona, setPersona] = useState<typeof PERSONAS[number]>("Gordon Ramsay");
  const [replyStyle, setReplyStyle] = useState("Roast");
  const [state, action, pending] = useActionState(createCaption, {});
  const [uploading, setUploading] = useState(false);
  const [photoPath, setPhotoPath] = useState("");
  const [preview, setPreview] = useState("");
  const [uploadError, setUploadError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function upload(file?: File) {
    setPhotoPath(""); setPreview(""); setUploadError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setUploadError("Choose a JPG, PNG or WebP up to 5 MB."); return; }
    setUploading(true);
    try {
      // Re-encode pixels before upload: strips EXIF/location metadata and bounds size.
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); throw new Error("Image preview unavailable."); }
      context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not prepare image.")), "image/jpeg", 0.88));
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("food-photos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw new Error("Could not upload your photo. Please try again.");
      setPreview(URL.createObjectURL(blob)); setPhotoPath(path);
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Could not upload your photo."); }
    finally { setUploading(false); }
  }
  const busy = pending || uploading;
  return <form action={action} className="caption-form" aria-busy={busy}>
    <label className="upload-zone">01 · Your real food photo<span className="upload-help">JPG, PNG or WebP · Up to 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => upload(event.target.files?.[0])} /></label>
    {preview && <div className="photo-preview">{/* Local blob preview cannot use Next Image optimization. */}<Image unoptimized src={preview} width={1600} height={1200} alt="Your original food photo" /></div>}
    <input type="hidden" name="original_path" value={photoPath} />
    {uploadError && <p className="notice notice-error" role="alert">{uploadError}</p>}
    <label className="field">02 · What did you eat?<input name="dish" required maxLength={80} placeholder="Spicy miso ramen" disabled={busy} /></label>
    <label className="field">Extra context for the AI (optional)<textarea name="scene" maxLength={500} rows={3} placeholder="Paid $24 for ramen after class. Said I was saving money this week." disabled={busy} /></label>
    <label className="field">Restaurant or place name<input name="restaurant" defaultValue={restaurant} maxLength={100} placeholder="Restaurant, café, or your own kitchen" disabled={busy} /></label>
    <label className="field">Neighborhood<select name="neighborhood" defaultValue="Other / home" disabled={busy}>{NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}</select></label>
    <label className="field">03 · Your honest review (optional)<textarea name="personal_review" maxLength={1000} rows={4} placeholder="How did it taste? Was it worth the price? Would you come back?" disabled={busy} /></label>
    <label className="field">Your personal rating<select name="personal_rating" defaultValue="" disabled={busy}><option value="">No rating</option>{[5,4,3,2,1].map(n => <option value={n} key={n}>{n} / 5</option>)}</select></label>
    <fieldset className="persona-picker" disabled={busy}><legend>04 · Who gets the phone?</legend><p className="upload-help">Keep your own review. Choose who adds the fictional AI reaction.</p><div className="persona-cards">{PERSONAS.map(p => <label key={p} className="persona-option"><input type="radio" name="tone" value={p} checked={persona === p} onChange={() => setPersona(p)} /><span><span className="persona-option-top"><span aria-hidden="true">{PERSONA_DETAILS[p].emoji}</span><strong>{PERSONA_DETAILS[p].title}</strong>{persona === p && <small>Selected ✓</small>}</span><span className="persona-description">{PERSONA_DETAILS[p].description}</span></span></label>)}</div></fieldset>
    <div className="persona-example"><p className="eyebrow">SAMPLE VOICE · NOT GENERATED FROM YOUR PHOTO</p><p>“{PERSONA_DETAILS[persona].example}”</p><small>{persona === "Gordon Ramsay" ? "AI style imitation, not Gordon Ramsay’s actual review or endorsement." : "A fictional pet character, not your pet’s actual opinion."}</small></div>
    <label className="field">05 · Choose the attitude<select name="reply_style" value={replyStyle} onChange={e => setReplyStyle(e.target.value)} disabled={busy}>{REPLY_STYLES.map(a => <option key={a} value={a}>{({Roast:"Roast me",Hype:"Hype me", "Roast then hype":"Roast then praise"})[a]}</option>)}</select></label>
    <input type="hidden" name="language" value="English" />
    <button type="button" className="text-link daily-pick" disabled={busy} onClick={() => { setReplyStyle(challenge.style); if ((PERSONAS as readonly string[]).includes(challenge.persona)) setPersona(challenge.persona as typeof PERSONAS[number]); }}>Try today’s mode: {challenge.style} ↗</button>
    <p className="companion-note">Your honest take. Their very dramatic opinion.</p>
    <p className="upload-help">Your photo and extra AI context go to Google Gemini to write the selected fictional reaction. Your personal review is kept exactly as written. The draft stays private until you publish.</p>
    <button className="button" disabled={busy || !photoPath}>{uploading ? "Preparing your photo…" : pending ? "Writing your reaction…" : "Preview my meal & AI reaction ✦"}</button>
    <p className="upload-help">Up to 10 AI attempts a day, shared with meal coaching, 30 seconds apart. Your photo stays real; the commentary is AI-written.</p>
    <div aria-live="polite">{state.error && <p role="alert" className="notice notice-error">{state.error}</p>}{state.success && <p className="notice notice-success">{state.success} <Link href="/captions?mine=1" className="text-link">View preview →</Link></p>}</div>
  </form>;
}

export function PostControls({ id, published, saved, loggedIn }: { id: string; published: boolean; saved: boolean; loggedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function mutate(publish: boolean) {
    startTransition(async () => {
      try { const result = publish ? await publishPhoto(id) : await savePhoto(id, saved); setMessage(result.error || result.success || ""); }
      catch { setMessage("Could not save the change. Refresh and try again."); }
    });
  }
  async function share() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/captions?post=${id}`); setMessage("Post link copied."); }
    catch { setMessage("Open this post and copy its address to share."); }
  }
  return <div className="post-controls">{!published ? <><p className="draft-note">Private preview · Publishing makes your photo, personal review, rating, AI reaction, first name, place and context public.</p><button type="button" className="button button-small" disabled={pending} onClick={() => mutate(true)}>Publish to the community ↗</button></> : <div className="caption-card-actions">{loggedIn ? <button type="button" className="text-link" aria-pressed={saved} disabled={pending} onClick={() => mutate(false)}>{saved ? "♥ Saved" : "♡ Save for later"}</button> : <Link href="/login" className="text-link">Sign in to save</Link>}<button type="button" className="text-link" onClick={share}>Share post ↗</button></div>}<p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
}

export function VoteControls({ id, vote, score, count, loggedIn }: { id: string; vote: number | null; score: number; count: number; loggedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function submit(value: number) {
    startTransition(async () => {
      try { const result = await rateCaption(id, value); setMessage(result.error || result.success || ""); }
      catch { setMessage("Could not save your vote. Refresh and try again."); }
    });
  }
  return <div><div className="vote-row"><span className="caption-score"><strong>{score > 0 ? `+${score}` : score}</strong><small>{count} {count === 1 ? "vote" : "votes"}</small></span>{loggedIn ? <div className="vote-buttons"><button type="button" aria-label="Upvote this AI reaction" aria-pressed={vote === 1} disabled={pending} onClick={() => submit(1)}>↑ Love it</button><button type="button" aria-label="Downvote this AI reaction" aria-pressed={vote === -1} disabled={pending} onClick={() => submit(-1)}>↓ Pass</button></div> : <Link href="/login" className="text-link">Sign in to vote ↗</Link>}</div><p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
}

export function CopyCaption({ caption, persona }: { caption: string; persona: string }) {
  const [message, setMessage] = useState("Copy reaction");
  async function copy() {
    const disclosure = persona === "Gordon Ramsay" ? "AI-generated Gordon Ramsay-style commentary; not his actual review or endorsement." : `AI-generated fictional ${persona.toLowerCase()} reaction; just for fun.`;
    try { await navigator.clipboard.writeText(`${caption}\n\n${disclosure}`); setMessage("Copied!"); } catch { setMessage("Select the text to copy"); }
  }
  return <button className="text-link copy-caption" type="button" onClick={copy}>{message}</button>;
}

export function ChefPost({ original, dish, caption, persona, review, rating }: { original?: string; dish: string; caption: string; persona: string; review: string; rating: number | null }) {
  return <div className="pet-post"><div className="food-photo-frame">{original ? <Image unoptimized src={original} width={1000} height={1000} alt={`Real food photo: ${dish}`} /> : <div className="photo-unavailable">Photo unavailable</div>}</div><div className="review-pair"><div className="personal-message"><p className="eyebrow">THE HUMAN’S TAKE</p><h4>My honest review {rating != null && <span className="personal-rating">★ {rating}/5</span>}</h4><p>{review || "The poster hasn’t added a personal review yet."}</p><small>Personal experience, shared by the poster.</small></div><div className="pet-message"><div className="pet-message-header"><span aria-hidden="true" className="pet-avatar">{persona === "Cat" ? "🐱" : persona === "Dog" ? "🐶" : "👨‍🍳"}</span><span><strong>{personaLabel(persona)}</strong><small>{persona === "Gordon Ramsay" ? "AI style imitation. Not his actual review." : "Fictional AI pet reaction. Just for fun."}</small></span></div><blockquote>{caption}</blockquote><CopyCaption caption={caption} persona={persona} /></div></div></div>;
}
