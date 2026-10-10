"use server";
import { createClient } from "@/lib/supabase/server";
import { coordinates, parsePreferences, rankRestaurants, SEARCH_AREAS, type SearchResult, type OsmElement } from "@/lib/restaurant-search";

import { readDiners, rankForGroup, type Diner } from "@/lib/group-dining";

export async function findRestaurants(_previous: SearchResult, form: FormData): Promise<SearchResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to find food near you." };
  const wants = String(form.get("wants") || "").trim(), avoids = String(form.get("avoids") || "").trim();
  if (wants.length > 200 || avoids.length > 200) return { error: "Keep each preference under 200 characters." };
  let diners: Diner[] | undefined;
  if (form.has("diners")) {
    try { diners = readDiners(form.get("diners")); } catch (error) { return { error: error instanceof Error ? error.message : "Check the group details." }; }
  }
  const area = SEARCH_AREAS.find(area => area.name === form.get("area"));
  const latInput = String(form.get("lat") || ""), lonInput = String(form.get("lon") || "");
  const usingDevice = form.get("area") === "device";
  const lat = usingDevice && latInput ? Number(latInput) : area?.lat;
  const lon = usingDevice && lonInput ? Number(lonInput) : area?.lon;
  const radius = Number(form.get("radius"));
  if (lat === undefined || lon === undefined || !coordinates(lat, lon) || ![1000, 2500, 5000].includes(radius)) return { error: "Choose an area or allow location access, then choose a search radius." };
  const { desired, excluded } = parsePreferences(wants, avoids);
  if (!diners && avoids && !parsePreferences("", avoids).excluded.length) return { error: "Skipped foods must be cuisine names, such as pizza or Japanese. Ingredient and allergy exclusions are not supported; check directly with the restaurant." };
  if (!diners && (wants || avoids) && !desired.length && !excluded.length) return { error: "Try a cuisine such as pizza, Japanese, Thai, Korean or burgers. Ingredient, price and spice preferences are not available in this map search yet." };
  const { data: credit, error } = await supabase.rpc("claim_food_search");
  if (error) return { error: "Restaurant search needs the updated Supabase SQL setup." };
  if (credit !== "ok") return { error: credit === "cooldown" ? "Wait 15 seconds before searching again." : "Today’s restaurant search limit is reached. Please try tomorrow." };
  // Rounded location leaves the browser only on submit. Cache shared map queries for one hour.
  const roundedLat = Number(lat.toFixed(3)), roundedLon = Number(lon.toFixed(3));
  const query = `[out:json][timeout:20][maxsize:16777216];nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:${radius + 150},${roundedLat},${roundedLon});out center tags 1000;`;
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Foodfolio-coursework/1.0 (https://github.com/SherylZhang12/week1-hello-world)" },
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) return { error: "The map service is busy. Try again later or search directly on Google Maps." };
    const data = await response.json() as { elements?: OsmElement[]; remark?: string };
    if (!Array.isArray(data.elements) || data.remark) return { error: "The map search did not finish. Try a smaller radius or come back later." };
    const restaurants = diners ? rankForGroup(data.elements, roundedLat, roundedLon, diners, radius) : rankRestaurants(data.elements, roundedLat, roundedLon, wants, avoids, radius);
    return { restaurants, diners: diners || [{id:"you",name:"You",wants,avoids,restrictions:"",notes:""}], location: usingDevice ? "your approximate location" : area!.name, note: diners ? "Group results prioritize the number of people whose cuisine wishes match, then distance. Everyone’s recognized cuisine skips are applied. Ingredient exclusions, allergies, spice, budgets and other notes cannot be verified from map tags; all opinions are passed to the AI only when you request ordering ideas. Menus and prices are not verified. If wishes conflict, results show a compromise rather than claiming everyone is satisfied." : `Cuisine filters applied — want: ${desired.join(", ") || "any"}; skip: ${excluded.join(", ") || "none"}. Other words are not used as filters. Approximate straight-line distances. Menu items, spice levels, prices and opening hours are not verified. Check with the restaurant for dietary needs.` };
  } catch { return { error: "Could not reach the map service. Try again later or open Google Maps." }; }
}
