"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createCaption, rateCaption, publishPhoto, savePhoto } from "./actions";
import { ANIMALS, ANIMAL_ACTIONS, NEIGHBORHOODS } from "@/lib/food-photo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function Generator({ challenge }: { challenge: { animal: string; action: string } }) {
  const [selectedAnimal, setAnimal] = useState("Kitten");
  const [animalAction, setAnimalAction] = useState("Eating with a spoon");
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
    <label className="field">Your food story (optional)<textarea name="scene" maxLength={500} rows={3} placeholder="A rainy afternoon, a tiny ramen shop, and the best bowl after class." disabled={busy} /></label>
    <label className="field">Place name (optional)<input name="restaurant" maxLength={100} placeholder="Restaurant, café, or your own kitchen" disabled={busy} /></label>
    <label className="field">Neighborhood<select name="neighborhood" defaultValue="Other / home" disabled={busy}>{NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}</select></label>
    <fieldset className="animal-picker" disabled={busy}><legend>03 · Pick your tiny companion</legend><div className="animal-options">{ANIMALS.map((animal, i) => <label key={animal}><input type="radio" name="tone" value={animal} checked={selectedAnimal === animal} onChange={() => setAnimal(animal)} /><span><span aria-hidden="true">{["🐱", "🐶", "🐰"][i]}</span>{animal}</span></label>)}</div></fieldset>
    <label className="field">What are they doing?<select name="animal_action" value={animalAction} onChange={e => setAnimalAction(e.target.value)} disabled={busy}>{ANIMAL_ACTIONS.map(a => <option key={a}>{a}</option>)}</select></label>
    <button type="button" className="text-link daily-pick" disabled={busy} onClick={() => { setAnimal(challenge.animal); setAnimalAction(challenge.action); }}>Try today’s pair: {challenge.animal} ↗</button>
    <p className="companion-note">Spoon-sized. Soft little paws. Your real meal, with a little company.</p>
    <p className="upload-help">Your photo and story go to Google Gemini to add your miniature animal. The draft stays private until you publish.</p>
    <button className="button" disabled={busy || !photoPath}>{uploading ? "Preparing your photo…" : pending ? "Adding your tiny companion…" : "Meet your tiny companion ✦"}</button>
    <p className="upload-help">Up to 3 image attempts a day. Generation may take about a minute.</p>
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
  return <div className="post-controls">{!published ? <><p className="draft-note">Private preview · Publishing makes both photos, your first name, place and story public.</p><button type="button" className="button button-small" disabled={pending} onClick={() => mutate(true)}>Publish to the community ↗</button></> : <div className="caption-card-actions">{loggedIn ? <button type="button" className="text-link" aria-pressed={saved} disabled={pending} onClick={() => mutate(false)}>{saved ? "♥ Saved" : "♡ Save for later"}</button> : <Link href="/login" className="text-link">Sign in to save</Link>}<button type="button" className="text-link" onClick={share}>Share post ↗</button></div>}<p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
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
  return <div><div className="vote-row"><span className="caption-score"><strong>{score > 0 ? `+${score}` : score}</strong><small>{count} {count === 1 ? "vote" : "votes"}</small></span>{loggedIn ? <div className="vote-buttons"><button type="button" aria-label="Upvote this AI image" aria-pressed={vote === 1} disabled={pending} onClick={() => submit(1)}>↑ Love it</button><button type="button" aria-label="Downvote this AI image" aria-pressed={vote === -1} disabled={pending} onClick={() => submit(-1)}>↓ Pass</button></div> : <Link href="/login" className="text-link">Sign in to vote ↗</Link>}</div><p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
}

export function CopyCaption({ caption }: { caption: string }) {
  const [message, setMessage] = useState("Copy caption");
  async function copy() {
    try { await navigator.clipboard.writeText(caption); setMessage("Copied!"); } catch { setMessage("Select the caption to copy"); }
  }
  return <button className="text-link copy-caption" type="button" onClick={copy}>{message}</button>;
}

export function PhotoViewer({ original, generated, dish }: { original?: string; generated?: string; dish: string }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const src = showOriginal ? original : generated;
  async function download() {
    if (!generated) return;
    setSaving(true);
    try {
      const response = await fetch(generated);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      const link = document.createElement("a"); link.href = url; link.download = `foodfolio-tiny-companion.${extension}`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Image downloaded. Share it as an AI creation.");
    } catch { setMessage("Could not download. Refresh the post and try again."); }
    finally { setSaving(false); }
  }
  return <div className="post-photo"><div className="photo-switch" role="group" aria-label="Compare original and AI creation"><button type="button" aria-pressed={!showOriginal} onClick={() => setShowOriginal(false)}>✦ AI companion</button><button type="button" aria-pressed={showOriginal} onClick={() => setShowOriginal(true)}>Original meal</button></div><div className="food-photo-frame">{src ? <Image unoptimized src={src} width={1000} height={1000} alt={`${showOriginal ? "Original meal" : "AI miniature animal creation"}: ${dish}`} /> : <div className="photo-unavailable">Photo unavailable</div>}</div>{generated && <button type="button" className="text-link download-image" disabled={saving} onClick={download}>{saving ? "Downloading…" : "Download AI image ↗"}</button>}<p className="vote-status" role="status">{message}</p></div>;
}
