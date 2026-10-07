"use client";
import { useActionState, useState, useTransition } from "react";
import { createCaption, rateCaption } from "./actions";
import { DISHES, TONES } from "@/lib/captions";
import Link from "next/link";

export function Generator({ challenge }: { challenge: string }) {
  const [scene, setScene] = useState("");
  const [state, action, pending] = useActionState(createCaption, {});
  return <form action={action} className="caption-form">
    <div className="prompt-pick"><span>Need an idea?</span><button type="button" className="text-link" onClick={() => setScene(challenge)} disabled={pending}>Use today’s prompt ↗</button></div>
    <label className="field" htmlFor="scene">What’s the food situation?</label>
    <textarea id="scene" name="scene" value={scene} onChange={event => setScene(event.target.value)} minLength={10} maxLength={500} rows={4} required placeholder="POV: you walked 30 blocks for ramen and your friend says it tastes like the dorm microwave version." disabled={pending} aria-describedby="scene-help" />
    <p id="scene-help" className="upload-help">{scene.length}/500 · Your scene and caption will be public. Skip personal details.</p>
    <div className="form-row"><label className="field">Food<select name="dish" defaultValue="pizza" disabled={pending}>{DISHES.map(dish => <option key={dish} value={dish}>{dish[0].toUpperCase() + dish.slice(1)}</option>)}</select></label><label className="field">The vibe<select name="tone" disabled={pending}>{TONES.map(tone => <option key={tone}>{tone}</option>)}</select></label></div>
    <button className="button" disabled={pending}>{pending ? "Cooking up a caption…" : "Generate & post ✦"}</button>
    <p className="upload-help">AI writes it. You judge it. Up to 10 attempts a day.</p>
    <div aria-live="polite">{state.error && <p role="alert" className="notice notice-error">{state.error}</p>}{state.success && <p className="notice notice-success">{state.success}</p>}</div>
  </form>;
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
  return <div><div className="vote-row"><span className="caption-score"><strong>{score > 0 ? `+${score}` : score}</strong><small>{count} {count === 1 ? "vote" : "votes"}</small></span>{loggedIn ? <div className="vote-buttons"><button type="button" aria-label="Upvote this caption" aria-pressed={vote === 1} disabled={pending} onClick={() => submit(1)}>↑ Funny</button><button type="button" aria-label="Downvote this caption" aria-pressed={vote === -1} disabled={pending} onClick={() => submit(-1)}>↓ Pass</button></div> : <Link href="/login" className="text-link">Sign in to vote ↗</Link>}</div><p className="vote-status" role="status">{pending ? "Saving…" : message}</p></div>;
}

export function CopyCaption({ caption }: { caption: string }) {
  const [message, setMessage] = useState("Copy caption");
  async function copy() {
    try { await navigator.clipboard.writeText(caption); setMessage("Copied!"); } catch { setMessage("Select the caption to copy"); }
  }
  return <button className="text-link copy-caption" type="button" onClick={copy}>{message}</button>;
}
