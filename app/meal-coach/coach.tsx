"use client";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { coachMeals } from "./actions";
import { MEALS, MEAL_CUISINES, MEAL_GOALS, ACTIVITIES, planTargets, type MealSlot, type CoachResult, type MealSuggestion } from "@/lib/meal-coach";

import FoodFinder from "@/app/eat/finder";

type PreparedPhoto = { blob: Blob; preview: string };
export default function MealCoach() {
  const [state, action, pending] = useActionState(coachMeals, {} as CoachResult);
  const [restaurantMeal, setRestaurantMeal] = useState<MealSuggestion | null>(null);
  const [photos, setPhotos] = useState<Partial<Record<MealSlot, PreparedPhoto>>>({});
  const photoRef = useRef(photos);
  const [values, setValues] = useState<Record<string, string>>({ age:"", sex:"Prefer not to say", height:"", weight:"", activity:"Lightly active", goal:"Balanced eating", cuisine:"Any cuisine", preferences:"", restrictions:"" });
  function field(name: string) {
    return { name, value: values[name] || "", onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues(current => ({...current,[name]:event.target.value})) };
  }
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [resultStale, setResultStale] = useState(false);
  useEffect(() => { photoRef.current = photos; }, [photos]);
  useEffect(() => () => { Object.values(photoRef.current).forEach(photo => URL.revokeObjectURL(photo.preview)); }, []);
  async function prepare(meal: MealSlot, file?: File) {
    setPhotoError(""); setResultStale(true);
    if (photos[meal]) URL.revokeObjectURL(photos[meal]!.preview);
    setPhotos(current => { const next = {...current}; delete next[meal]; return next; });
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setPhotoError("Choose a JPG, PNG or WebP up to 5 MB per meal."); return; }
    setPreparing(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); throw new Error("Could not prepare this photo."); }
      context.fillStyle = "white"; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
      let blob: Blob | null = null;
      for (const quality of [0.85,0.7,0.55,0.4]) {
        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve,"image/jpeg",quality));
        if (blob && blob.size <= 300 * 1024) break;
      }
      if (!blob || blob.size > 300 * 1024) throw new Error("This photo could not be resized. Try a simpler image or crop it first.");
      setPhotos(current => ({...current,[meal]:{blob,preview:URL.createObjectURL(blob!)}}));
    } catch (error) { setPhotoError(error instanceof Error ? error.message : "Could not prepare this photo."); }
    finally { setPreparing(false); }
  }
  const busy = pending || preparing;
  const uploaded = MEALS.filter(meal => !!photos[meal]);
  const targets = uploaded.length ? planTargets(uploaded) : null;
  return <div className="coach-layout"><form action={data => {
    uploaded.forEach(meal => data.set(`photo_${meal}`,photos[meal]!.blob,`${meal}.jpg`));
    setResultStale(false); setRestaurantMeal(null); action(data);
  }} className="caption-form panel coach-form" aria-busy={busy} onChange={() => setResultStale(true)}>
    <p className="eyebrow">01 · TODAY’S MEALS</p><h2>Show what you’ve eaten.</h2><p className="upload-help">Add one, two or three meals already eaten today. We plan after the latest meal shown; after dinner, we plan tomorrow.</p>
    <div className="meal-uploads">{MEALS.map(meal => <fieldset key={meal} className="meal-upload"><legend>{meal}</legend>
      <label className="upload-zone"><span>Choose a {meal.toLowerCase()} photo</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => prepare(meal,e.target.files?.[0])} /></label>
      {photos[meal] && <><div className="meal-preview"><Image unoptimized src={photos[meal]!.preview} alt={`Your ${meal.toLowerCase()} photo`} width={1024} height={768} /></div><button type="button" className="text-link" disabled={busy} onClick={() => prepare(meal)}>Remove photo</button></>}
      <label className="field">What was it, and how much did you eat?<textarea {...field(`notes_${meal}`)} rows={2} maxLength={500} placeholder="e.g. Two eggs, one slice of toast, half the avocado; eaten in full" disabled={busy} /></label>
    </fieldset>)}</div>
    {photoError && <p className="notice notice-error" role="alert">{photoError}</p>}
    {targets && <p className="notice">We’ll suggest {targets.meals.join(" and ").toLowerCase()} for {targets.day}.</p>}
    <p className="eyebrow">02 · YOUR CONTEXT</p><div className="form-row">
      <label className="field">Age (18+)<input {...field("age")} type="number" min="18" max="100" step="1" required disabled={busy} placeholder="24" /></label>
      <label className="field">Sex (optional)<select {...field("sex")} disabled={busy}><option>Prefer not to say</option><option>Female</option><option>Male</option></select></label>
      <label className="field">Height · cm (optional)<input {...field("height")} type="number" min="80" max="250" step="0.1" disabled={busy} placeholder="165" /></label>
      <label className="field">Weight · kg (optional)<input {...field("weight")} type="number" min="25" max="350" step="0.1" disabled={busy} placeholder="60" /></label>
    </div>
    <label className="field">Activity level<select {...field("activity")} disabled={busy}>{ACTIVITIES.map(a => <option key={a}>{a}</option>)}</select></label>
    <p className="eyebrow">03 · YOUR FOOD GOALS</p>
    <label className="field">My main goal<select {...field("goal")} disabled={busy}>{MEAL_GOALS.map(g => <option key={g}>{g}</option>)}</select></label>
    <label className="field">Preferred cuisine<select {...field("cuisine")} disabled={busy}>{MEAL_CUISINES.map(c => <option key={c}>{c}</option>)}</select></label>
    <p className="upload-help">Meal ideas follow your cuisine preference and dietary restrictions. After planning, choose a location to find restaurants for a suggested meal.</p>
    <label className="field">What else should we consider?<textarea {...field("preferences")} rows={3} maxLength={500} placeholder="e.g. I’m building muscle, train after class, and want quick affordable meals." disabled={busy} /></label>
    <label className="field">Dietary preferences or restrictions (optional)<textarea {...field("restrictions")} rows={2} maxLength={500} placeholder="e.g. Vegetarian, avoid dairy, peanut allergy" disabled={busy} /></label>
    <p className="upload-help">General food guidance for adults. Photos cannot establish portions, nutrition totals or inflammation. AI suggestions cannot verify allergens; check ingredients directly. Medical dietary targets need a clinician or registered dietitian.</p>
    <label className="coach-consent"><input name="consent" type="checkbox" value="yes" required disabled={busy} /><span>Send these photos, body details and food goals to Google Gemini for this analysis. Foodfolio does not save them to my profile or community; Google’s data terms apply.</span></label>
    <button className="button" disabled={busy || !uploaded.length}>{preparing ? "Preparing your photo…" : pending ? "Planning your next meals…" : "Build my next-meal plan ↗"}</button>
    <p className="upload-help">10 AI attempts per day, shared with post reactions. Leave 30 seconds between requests. Results last for this page session.</p>
  </form><section className="coach-results" aria-live="polite" aria-busy={pending}>
    <p className="eyebrow">SMALL CHANGES. PRACTICAL NEXT MEALS.</p><h2>{pending ? "Looking at your meals…" : state.plan ? `Your plan for ${state.day}` : "A plan that starts with your plate."}</h2>
    {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
    {resultStale && state.plan && <p className="notice">Your inputs changed. This is your previous plan; submit again to update it.</p>}
    {!state.plan && !pending && <p>Breakfast photo? We’ll suggest lunch and dinner. Lunch photo? We’ll help with dinner. Finished your day? Get a review and ideas for tomorrow.</p>}
    {state.plan && !pending && <>
      <p className="coach-summary">{state.plan.summary}</p>
      <h3>What your photos suggest</h3><ul className="coach-cards">{state.plan.observations.map(meal => <li className="panel" key={meal.meal}><p className="eyebrow">{meal.meal}</p><p>{meal.observation}</p><p className="upload-help">What’s uncertain: {meal.uncertainty}</p></li>)}</ul>
      <h3>Your next meals</h3><ul className="coach-cards">{state.plan.suggestions.map(meal => <li className="panel next-meal-card" key={meal.meal}><p className="eyebrow">{state.day === "tomorrow" ? "Tomorrow’s " : ""}{meal.meal}</p><h4>{meal.idea}</h4><p className="upload-help">{meal.cuisine} · {meal.dish}</p><p>{meal.why}</p><p className="meal-swap"><strong>Another option:</strong> {meal.swap}</p><button type="button" className="text-link" disabled={resultStale} aria-pressed={restaurantMeal?.meal === meal.meal} onClick={() => setRestaurantMeal(meal)}>Find restaurants for {meal.meal.toLowerCase()} ↗</button></li>)}</ul>
      {restaurantMeal && !resultStale && <section aria-label={`Restaurants for ${restaurantMeal.meal}`}><h3>Find your {restaurantMeal.meal.toLowerCase()} nearby</h3><FoodFinder key={`${state.day}-${restaurantMeal.meal}-${restaurantMeal.dish}`} initialWants={restaurantMeal.cuisine} mealDish={restaurantMeal.dish} compact /></section>}
      <h3>Changes to try</h3><ul className="coach-points">{state.plan.improvements.map((text,i) => <li key={i}>{text}</li>)}</ul>
      <h3>To make this more useful</h3><ul className="coach-points">{state.plan.questions.map((text,i) => <li key={i}>{text}</li>)}</ul>
      <p className="upload-help">AI-generated suggestions, not verified nutrient analysis or medical treatment. The health references below inform the coach’s general guidance; they do not validate this individual AI plan.</p>
      <button type="button" className="text-link" onClick={() => window.location.reload()}>Clear this session ↗</button>
    </>}
    <div className="coach-source-links"><p className="eyebrow">GENERAL NUTRITION REFERENCES</p><a href="https://www.niddk.nih.gov/health-information/weight-management/healthy-eating-physical-activity-for-life/health-tips-for-adults" target="_blank" rel="noreferrer">NIDDK · Adult healthy eating ↗</a><a href="https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/" target="_blank" rel="noreferrer">NIH ODS · Nutrition and exercise ↗</a><a href="https://pubmed.ncbi.nlm.nih.gov/34607347/" target="_blank" rel="noreferrer">Research review · Dietary patterns and inflammation ↗</a></div>
    <Link className="text-link" href="/eat">Find a restaurant for your next meal ↗</Link>
  </section></div>;
}
