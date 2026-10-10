"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { findRestaurants } from "./actions";
import { SEARCH_AREAS, type SearchResult } from "@/lib/restaurant-search";

export default function FoodFinder() {
  const [state, action, pending] = useActionState(findRestaurants, {} as SearchResult);
  const [area, setArea] = useState("Lower East Side");
  const [point, setPoint] = useState<{ lat: number; lon: number }>();
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  function locate() {
    if (!navigator.geolocation) { setLocationMessage("Location is unavailable. Choose a NYC neighborhood instead."); return; }
    setLocating(true); setLocationMessage("");
    navigator.geolocation.getCurrentPosition(position => {
      setPoint({lat: Number(position.coords.latitude.toFixed(3)), lon: Number(position.coords.longitude.toFixed(3))});
      setArea("device"); setLocating(false); setLocationMessage("Location ready. Submit to search nearby.");
    }, () => { setLocating(false); setLocationMessage("Location access was unavailable. You can still choose a NYC neighborhood."); }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 300000});
  }
  return <div className="finder-layout"><form action={action} className="panel caption-form" aria-busy={pending || locating}>
    <h2>What are you craving?</h2>
    <label className="field">I’m in the mood for…<textarea name="wants" maxLength={200} rows={2} placeholder="Maybe Japanese or Korean food today" disabled={pending} /></label>
    <label className="field">Skip this today…<textarea name="avoids" maxLength={200} rows={2} placeholder="No pizza or burgers" disabled={pending} /></label>
    <p className="upload-help">Use cuisine names. Separate wants and skips above. Leave both empty to explore nearby food spots.</p>
    <label className="field">Search near<select name="area" value={area} onChange={e => setArea(e.target.value)} disabled={pending || locating}>{SEARCH_AREAS.map(a => <option key={a.name}>{a.name}</option>)}{point && <option value="device">My current location</option>}</select></label>
    <button type="button" className="text-link" disabled={pending || locating} onClick={locate}>{locating ? "Finding your location…" : "Use my location ↗"}</button><p role="status" className="upload-help">{locationMessage}</p>
    <input type="hidden" name="lat" value={point?.lat ?? ""} /><input type="hidden" name="lon" value={point?.lon ?? ""} />
    <label className="field">How far?<select name="radius" defaultValue="2500" disabled={pending}><option value="1000">Within 1 km</option><option value="2500">Within 2.5 km</option><option value="5000">Within 5 km</option></select></label>
    <p className="upload-help">Your approximate search location is sent to OpenStreetMap’s Overpass service when you search. It is not added to your profile or posts.</p>
    <button className="button" disabled={pending || locating}>{pending ? "Finding your next bite…" : "Find my next meal ↗"}</button>
    {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
  </form><section aria-live="polite" aria-busy={pending}>
    <p className="eyebrow">YOUR NEXT BITE</p><h2>{pending ? "Searching nearby…" : state.restaurants ? `Food near ${state.location}` : "Less scrolling. More eating."}</h2>
    {!state.restaurants && !pending && <p>Tell us what sounds good, skip what doesn’t, and find real mapped restaurants nearby.</p>}
    {state.restaurants?.length === 0 && !pending && <p className="notice">No mapped spots matched these cuisine tags in this radius. Try a different cuisine or a larger radius.</p>}
    {!pending && state.restaurants && <><ul className="restaurant-results">{state.restaurants.map(r => <li className="panel restaurant-card" key={r.id}><span className="eyebrow">{r.distance < 1000 ? `${r.distance} m` : `${(r.distance / 1000).toFixed(1)} km`} away · approximate</span><h3>{r.name}</h3><p>{r.cuisine}</p><p>{r.address}</p><p className="match-reason">{r.reason}</p><div className="caption-card-actions"><a className="text-link" href={r.maps} target="_blank" rel="noreferrer">View on Google Maps ↗</a><Link className="text-link" href={`/captions?restaurant=${encodeURIComponent(r.name)}#create-caption`}>Ate here? Share your meal ↗</Link><a className="text-link" href={r.source} target="_blank" rel="noreferrer">Map source</a></div></li>)}</ul><p className="upload-help">{state.note}</p></>}
    <p className="upload-help">Restaurant data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Community-maintained listings may be incomplete or outdated.</p>
    <a className="text-link" href="https://www.google.com/maps/search/restaurants+near+me/" target="_blank" rel="noreferrer">Explore on Google Maps ↗</a>
  </section></div>;
}
