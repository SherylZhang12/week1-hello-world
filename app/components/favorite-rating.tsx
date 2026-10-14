"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveFavoriteRating } from "@/app/favorites/actions";

export default function FavoriteRating({ foodName, initialRating, loggedIn }: {
  foodName: string;
  initialRating: number | null;
  loggedIn: boolean;
}) {
  const [rating, setRating] = useState(initialRating ?? 10);
  const [savedRating, setSavedRating] = useState(initialRating);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return <div className="user-rating-box"><span>Your rating</span><Link href="/login?next=%2F%23favorites" className="text-link">Sign in to rate →</Link></div>;
  }

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await saveFavoriteRating(foodName, rating);
      if (result.error) setMessage(result.error);
      else { setSavedRating(rating); setMessage(result.success ?? "Rating saved."); }
    });
  }

  return <div className="user-rating-box">
    <div className="user-rating-heading"><span>Your rating</span><strong>{savedRating == null ? "Not rated" : `★ ${savedRating}/10`}</strong></div>
    <div className="user-rating-controls">
      <label><span className="sr-only">Rate {foodName} from 1 to 10</span><select value={rating} onChange={(event) => setRating(Number(event.target.value))} disabled={pending}>
        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 10</option>)}
      </select></label>
      <button type="button" onClick={save} disabled={pending} className="rating-save">{pending ? "Saving…" : savedRating == null ? "Rate" : "Update"}</button>
    </div>
    {message && <p className="rating-status" role="status">{message}</p>}
  </div>;
}

