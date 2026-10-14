"use client";

import { useActionState, useEffect, useRef } from "react";
import { addFoodPreference, type FavoriteRatingResult } from "./actions";

const initialState: FavoriteRatingResult = {};

export default function PreferenceForm() {
  const [state, action, pending] = useActionState(addFoodPreference, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success]);

  return <form ref={formRef} action={action} className="preference-form">
    <label className="field">Food name
      <input name="food_name" required maxLength={80} autoComplete="off" placeholder="e.g. Ramen, Mango, Dumplings" />
    </label>
    <label className="field">My rating
      <select name="rating" defaultValue="10" required>
        {[10,9,8,7,6,5,4,3,2,1].map(value => <option key={value} value={value}>{value} / 10</option>)}
      </select>
    </label>
    <button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Add to my favorites ↗"}</button>
    {state.error && <p role="alert" className="notice notice-error">{state.error}</p>}
    {state.success && <p role="status" className="notice notice-success">{state.success}</p>}
  </form>;
}
