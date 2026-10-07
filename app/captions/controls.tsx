"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createCaption, rateCaption, publishPhoto, savePhoto } from "./actions";
import { REPLY_STYLES, NEIGHBORHOODS } from "@/lib/food-photo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function Generator({ challenge }: { challenge: { persona: string; style: string } }) {
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
    <label className="field">Your food story (optional)<textarea name="scene" maxLength={500} rows={3} placeholder="Paid $24 for ramen after class. Said I was saving money this week." disabled={busy} /></label>
    <label className="field">Place name (optional)<input name="restaurant" maxLength={100} placeholder="Restaurant, café, or your own kitchen" disabled={busy} /></label>
    <label className="field">Neighborhood<select name="neighborhood" defaultValue="Other / home" disabled={busy}>{NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}</select></label>
    <input type="hidden" name="tone" value="Gordon Ramsay" />
    <div className="chef-identity"><span aria-hidden="true">👨‍🍳</span><strong>Gordon Ramsay-style food critiques</strong><small>AI style imitation. Not his actual review.</small></div>
    <label className="field">03 · Choose the heat<select name="reply_style" value={replyStyle} onChange={e => setReplyStyle(e.target.value)} disabled={busy}>{REPLY_STYLES.map(a => <option key={a} value={a}>{({Roast:"Full roast",Hype:"Chef approved", "Roast then hype":"Roast then praise"})[a]}</option>)}</select></label>
    <input type="hidden" name="language" value="English" />
    <button type="button" className="text-link daily-pick" disabled={busy} onClick={() => { setReplyStyle(challenge.style); }}>Try today’s mode: {challenge.style} ↗</button>
    <p className="companion-note">Your dish enters the kitchen. The chef has opinions.</p>
    <p className="upload-help">Your photo and story go to Google Gemini to write original Gordon Ramsay-style commentary. The draft stays private until you publish.</p>
    <button className="button" disabled={busy || !photoPath}>{uploading ? "Preparing your photo…" : pending ? "The chef is judging…" : "Get my chef-style critique ✦"}</button>
    <p className="upload-help">Up to 10 attempts a day, 30 seconds apart. Your photo stays real; the commentary is AI-written.</p>
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
  return <div className="post-controls">{!published ? <><p className="draft-note">Private preview · Publishing makes your photo, AI-written chef critique, first name, place and story public.</p><button type="button" className="button button-small" disabled={pending} onClick={() => mutate(true)}>Publish to the community ↗</button></> : <div className="caption-card-actions">{loggedIn ? <button type="button" className="text-link" aria-pressed={saved} disabled={pending} onClick={() => mutate(false)}>{saved ? "♥ Saved" : "♡ Save for later"}</button> : <Link href="/login" className="text-link">Sign in to save</Link>}<button type="button" className="text-link" onClick={share}>Share post ↗</button></div>}<p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
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
  return <div><div className="vote-row"><span className="caption-score"><strong>{score > 0 ? `+${score}` : score}</strong><small>{count} {count === 1 ? "vote" : "votes"}</small></span>{loggedIn ? <div className="vote-buttons"><button type="button" aria-label="Upvote this AI chef critique" aria-pressed={vote === 1} disabled={pending} onClick={() => submit(1)}>↑ Love it</button><button type="button" aria-label="Downvote this AI chef critique" aria-pressed={vote === -1} disabled={pending} onClick={() => submit(-1)}>↓ Pass</button></div> : <Link href="/login" className="text-link">Sign in to vote ↗</Link>}</div><p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
}

export function CopyCaption({ caption }: { caption: string }) {
  const [message, setMessage] = useState("Copy critique");
  async function copy() {
    try { await navigator.clipboard.writeText(`${caption}\n\nAI-generated Gordon Ramsay-style commentary; not his actual review or endorsement.`); setMessage("Copied!"); } catch { setMessage("Select the caption to copy"); }
  }
  return <button className="text-link copy-caption" type="button" onClick={copy}>{message}</button>;
}

export function ChefPost({ original, dish, caption }: { original?: string; dish: string; caption: string }) {
  return <div className="pet-post"><div className="food-photo-frame">{original ? <Image unoptimized src={original} width={1000} height={1000} alt={`Real food photo: ${dish}`} /> : <div className="photo-unavailable">Photo unavailable</div>}</div><div className="pet-message"><div className="pet-message-header"><span aria-hidden="true" className="pet-avatar">👨‍🍳</span><span><strong>Gordon Ramsay-style critique</strong><small>AI style imitation. Not his actual review.</small></span></div><blockquote>{caption}</blockquote><CopyCaption caption={caption} /></div></div>;
}
