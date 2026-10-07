export const TONES = ["Deadpan", "Chronically online", "Wholesome"] as const;
export const DISHES = ["pizza", "ramen", "sushi", "tacos", "bagel", "coffee"] as const;
export const CHALLENGES = [
  "You spent your entire weekend food budget on one NYC brunch.",
  "You found a perfect late-night bite after studying in Butler.",
  "Your dorm cooking experiment set off everyone's group chat.",
  "You crossed three boroughs for a snack you saw online.",
  "Your friend calls a $9 coffee a personality investment.",
  "You brought Midwest portion expectations to a NYC restaurant.",
  "You promised to meal prep, then walked past a pizza place.",
];
export function dailyChallenge(date = new Date()) {
  const nyDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const day = Math.floor(Date.parse(`${nyDate}T00:00:00Z`) / 86400000);
  return CHALLENGES[day % CHALLENGES.length];
}
export type Caption = {
  id: string; caption: string; scene: string; dish: string; tone: string; animal_action: string;
  model: string; created_at: string; score: number; vote_count: number;
  my_vote: number | null; is_owner: boolean; original_path: string | null; image_path: string | null; restaurant: string; neighborhood: string; display_name: string; published_at: string | null; is_saved: boolean;
};
export type ActionResult = { error?: string; success?: string };
export function validateGeneration(scene: string, dish: string, tone: string) {
  if (scene.length < 10 || scene.length > 500) return "Describe your scene in 10–500 characters.";
  if (!(DISHES as readonly string[]).includes(dish) || !(TONES as readonly string[]).includes(tone)) return "Choose an available food and tone.";
  return null;
}
export function validVote(id: string, value: number) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && (value === 1 || value === -1);
}
