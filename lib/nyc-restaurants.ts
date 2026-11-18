import "server-only";
import snapshot from "@/data/nyc-restaurants.json";
import { distanceMeters, preferenceTags, type OsmElement } from "./restaurant-search";

const cuisines = (label: string) => {
  const value = label.toLowerCase();
  if (!value || value === "not applicable") return "";
  const parts = preferenceTags(value);
  if (value.includes("hamburger")) parts.push("burger");
  return [...new Set(parts)].join(";") || value.replaceAll(";", " ");
};

export function cityRestaurants(lat: number, lon: number, radius: number): OsmElement[] {
  const candidates: OsmElement[] = [];
  for (const [id, name, cuisine, address, y, x] of snapshot as [number, string, string, string, number, number][]) {
    if (Math.abs(y - lat) > 0.05 || Math.abs(x - lon) > 0.07 || distanceMeters(lat, lon, y, x) > radius) continue;
    candidates.push({type:"nyc", id, lat:y, lon:x, tags:{name, amenity:"restaurant", cuisine:cuisines(cuisine), "addr:street":address}});
  }
  return candidates;
}
