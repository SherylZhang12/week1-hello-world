"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import OrderSuggestions from "./order-suggestions";
import { type Diner, type GroupRestaurant } from "@/lib/group-dining";
import { findRestaurants } from "./actions";
import { SEARCH_AREAS, type SearchResult } from "@/lib/restaurant-search";

export default function FoodFinder({ initialWants = "", mealDish = "", compact = false }: { initialWants?: string; mealDish?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(findRestaurants, {} as SearchResult);
  const [groupMode, setGroupMode] = useState(false);
  const [diners, setDiners] = useState<Diner[]>([{id:"you",name:"You",wants:initialWants,avoids:"",restrictions:"",notes:""}]);
  function updateDiner(id: string, field: keyof Diner, value: string) {
    setDiners(current => current.map(d => d.id === id ? {...d,[field]:value} : d));
    setInputsChanged(true);
  }
  const [wants, setWants] = useState(initialWants);
  const [inputsChanged, setInputsChanged] = useState(false);
  const [area, setArea] = useState("Lower East Side");
  const [point, setPoint] = useState<{ lat: number; lon: number }>();
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  function locate() {
    if (!navigator.geolocation) { setLocationMessage("Location is unavailable. Choose a NYC neighborhood instead."); return; }
    setLocating(true); setLocationMessage("");
    navigator.geolocation.getCurrentPosition(position => {
      setPoint({lat: Number(position.coords.latitude.toFixed(3)), lon: Number(position.coords.longitude.toFixed(3))});
      setArea("device"); setInputsChanged(true); setLocating(false); setLocationMessage("Location ready. Submit to search nearby.");
    }, () => { setLocating(false); setLocationMessage("Location access was unavailable. You can still choose a NYC neighborhood."); }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 300000});
  }
  const dishMaps = mealDish ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mealDish} restaurants near ${area === "device" && point ? `${point.lat},${point.lon}` : `${area}, New York`}`)}` : "";
  return <div className={compact ? "finder-layout coach-finder" : "finder-layout"}><form action={data => { setInputsChanged(false); if (groupMode) data.set("diners",JSON.stringify(diners)); action(data); }} onChange={() => setInputsChanged(true)} className="panel caption-form" aria-busy={pending || locating}>
    <h2>{mealDish ? "Where would you like to eat?" : "What are you craving?"}</h2>
    {mealDish && <p className="upload-help">Suggested dish: {mealDish}. Find nearby restaurants by cuisine, or look for this dish on Google Maps.</p>}
    <label className="coach-consent"><input type="checkbox" checked={groupMode} disabled={pending} onChange={e => {setGroupMode(e.target.checked);setInputsChanged(true);}} /><span>Eating with others? Consider everyone’s opinions.</span></label>
    {groupMode ? <><p className="upload-help">Add each diner separately (up to 12). Cuisine wishes count equally; anyone’s cuisine skips are excluded. Budget, ingredients and other requests inform ordering ideas, but map data cannot verify them.</p><div className="dining-group">{diners.map((d,i)=><fieldset className="diner-card" key={d.id}><legend>Diner {i + 1}</legend>{([{key:"name",label:"Name or nickname",placeholder:"You / Friend 1"},{key:"wants",label:"Wants to eat",placeholder:"Japanese or Korean; sushi"},{key:"avoids",label:"Doesn’t want",placeholder:"No pizza; dislike mushrooms"},{key:"restrictions",label:"Dietary needs / allergies",placeholder:"Vegetarian; peanut allergy"},{key:"notes",label:"Other opinions",placeholder:"Prefer mild food, $20 per person, something filling"}] as const).map(f=><label key={f.key} className="field">{f.label}<input value={d[f.key]} maxLength={f.key === "name" ? 40 : 200} placeholder={f.placeholder} disabled={pending} onChange={e=>updateDiner(d.id,f.key,e.target.value)} /></label>)}{diners.length > 1 && <button type="button" className="text-link" disabled={pending} onClick={()=>{setDiners(current=>current.filter(p=>p.id!==d.id));setInputsChanged(true);}}>Remove diner</button>}</fieldset>)}</div><button type="button" className="text-link" disabled={pending || diners.length >= 12} onClick={()=>{setDiners(current=>[...current,{id:crypto.randomUUID(),name:`Diner ${current.length+1}`,wants:"",avoids:"",restrictions:"",notes:""}]);setInputsChanged(true);}}>+ Add another diner</button></> : <>
    <label className="field">I’m in the mood for…<textarea name="wants" value={wants} onChange={e => setWants(e.target.value)} maxLength={200} rows={2} placeholder="Maybe Japanese or Korean food today" disabled={pending} /></label>
    <label className="field">Skip this today…<textarea name="avoids" maxLength={200} rows={2} placeholder="No pizza or burgers" disabled={pending} /></label>
    <p className="upload-help">Use cuisine names. Separate wants and skips above. Leave both empty to explore nearby food spots.</p></>}
    <label className="field">Search near<select name="area" value={area} onChange={e => setArea(e.target.value)} disabled={pending || locating}>{SEARCH_AREAS.map(a => <option key={a.name}>{a.name}</option>)}{point && <option value="device">My current location</option>}</select></label>
    <button type="button" className="text-link" disabled={pending || locating} onClick={locate}>{locating ? "Finding your location…" : "Use my location ↗"}</button><p role="status" className="upload-help">{locationMessage}</p>
    <input type="hidden" name="lat" value={point?.lat ?? ""} /><input type="hidden" name="lon" value={point?.lon ?? ""} />
    <label className="field">How far?<select name="radius" defaultValue="2500" disabled={pending}><option value="1000">Within 1 km</option><option value="2500">Within 2.5 km</option><option value="5000">Within 5 km</option></select></label>
    <p className="upload-help">Your approximate search location is sent to OpenStreetMap’s Overpass service when you search. It is not added to your profile or posts.</p>
    <button className="button" disabled={pending || locating}>{pending ? "Finding your next bite…" : groupMode ? "Find food for everyone ↗" : "Find my next meal ↗"}</button>
    {dishMaps && <a className="text-link" href={dishMaps} target="_blank" rel="noreferrer">Search this dish on Google Maps ↗</a>}
    {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
  </form><section aria-live="polite" aria-busy={pending}>
    <p className="eyebrow">YOUR NEXT BITE</p><h2>{pending ? "Searching nearby…" : state.restaurants ? `Food near ${state.location}` : "Less scrolling. More eating."}</h2>
    {inputsChanged && state.restaurants && <p className="notice">Search options changed. Results below are from your previous search; submit again to update them.</p>}
    {mealDish && <p className="upload-help">These are cuisine matches, not confirmed menu matches. Check the dish, ingredients and dietary needs with the restaurant.</p>}
    {!state.restaurants && !pending && <p>Tell us what sounds good, skip what doesn’t, and find real mapped restaurants nearby.</p>}
    {state.restaurants?.length === 0 && !pending && <p className="notice">No mapped spots matched the cuisine wishes and skips in this radius. Review conflicting preferences together, try a larger radius, or leave cuisine wishes open. We have not silently removed anyone’s skips.</p>}
    {!pending && state.restaurants && <><ul className="restaurant-results">{state.restaurants.map(r => <li className="panel restaurant-card" key={r.id}><span className="eyebrow">{r.distance < 1000 ? `${r.distance} m` : `${(r.distance / 1000).toFixed(1)} km`} away · approximate</span><h3>{r.name}</h3><p>{r.cuisine}</p><p>{r.address}</p><p className="match-reason">{r.reason}</p>{"matchedDiners" in r && <p className="upload-help">Wishes matched: {(r as GroupRestaurant).matchedDiners.join(", ") || "No specific cuisine wishes"}. {(r as GroupRestaurant).unmatchedDiners.length > 0 && `Compromise for: ${(r as GroupRestaurant).unmatchedDiners.join(", ")}.`}</p>}<div className="caption-card-actions"><a className="text-link" href={r.maps} target="_blank" rel="noreferrer">View on Google Maps ↗</a><Link className="text-link" href={`/captions?restaurant=${encodeURIComponent(r.name)}#create-caption`}>Ate here? Share your meal ↗</Link><a className="text-link" href={r.source} target="_blank" rel="noreferrer">Map source</a></div>{state.diners && <OrderSuggestions key={`${r.id}-${JSON.stringify(state.diners)}`} restaurant={r} diners={state.diners} disabled={inputsChanged || pending} />}</li>)}</ul><p className="upload-help">{state.note}</p></>}
    <p className="upload-help">Restaurant data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Community-maintained listings may be incomplete or outdated.</p>
    <a className="text-link" href="https://www.google.com/maps/search/restaurants+near+me/" target="_blank" rel="noreferrer">Explore on Google Maps ↗</a>
  </section></div>;
}
