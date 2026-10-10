"use client";
import { useActionState, useState } from "react";
import { suggestOrders } from "./order-actions";
import { type Diner, type OrderResult } from "@/lib/group-dining";
import { type Restaurant } from "@/lib/restaurant-search";
export default function OrderSuggestions({restaurant,diners,disabled}:{restaurant:Restaurant;diners:Diner[];disabled:boolean}) {
  const [state,action,pending] = useActionState(suggestOrders,{} as OrderResult);
  const [changed,setChanged] = useState(false);
  return <details className="group-order"><summary>What should our group order? ↗</summary>
    <p className="upload-help">Cuisine-based ideas for every diner. This restaurant’s actual menu is not available automatically.</p>
    <form action={data=>{setChanged(false);action(data);}} onChange={()=>setChanged(true)} aria-busy={pending}>
      <input type="hidden" name="diners" value={JSON.stringify(diners)} /><input type="hidden" name="restaurant" value={restaurant.name} /><input type="hidden" name="cuisine" value={restaurant.cuisine.slice(0,300)} />
      <label className="field">Menu text (optional)<textarea name="menu" maxLength={4000} rows={3} placeholder="Paste actual menu items to get more specific ideas." disabled={pending || disabled} /></label>
      <label className="coach-consent"><input name="consent" type="checkbox" value="yes" required disabled={pending || disabled} /><span>Everyone agrees to send their food opinions, restrictions and this menu text to Google Gemini for ordering ideas. Names are not sent. These details are not saved to profiles or posts.</span></label>
      <button className="button" disabled={pending || disabled}>{pending ? "Considering everyone’s opinions…" : "Suggest orders for everyone ↗"}</button>
      <p className="upload-help">Uses the shared 10 AI attempts/day; wait 30 seconds between requests.</p>
    </form>
    <div aria-live="polite">{state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
    {disabled && <p className="notice">Group or search options changed. Search again to update these suggestions.</p>}
    {changed && state.plan && <p className="notice">Menu inputs changed. Generate again to update these ideas.</p>}
    {state.plan && !pending && <><p>{state.plan.summary}</p><ul className="coach-cards">{state.plan.diners.map(d=><li key={d.dinerId}><h4>{diners.find(p=>p.id===d.dinerId)?.name}</h4><ul>{d.ideas.map((idea,i)=><li key={i}>{idea}</li>)}</ul><p><strong>Adjustments:</strong> {d.adjustments}</p><p>{d.reason}</p></li>)}</ul><h4>For the table</h4><ul>{state.plan.sharing.map((s,i)=><li key={i}>{s}</li>)}</ul><h4>Check before ordering</h4><ul>{state.plan.checks.map((s,i)=><li key={i}>{s}</li>)}</ul><p className="upload-help">AI suggestions, not confirmed menu availability, ingredient information or prices.</p></>}
    </div>
  </details>;
}
