export const PERSONAS = ["Gordon Ramsay"] as const;
export const REPLY_STYLES = ["Roast", "Hype", "Roast then hype"] as const;
export const POST_LANGUAGES = ["English", "中文"] as const;
export const NEIGHBORHOODS = ["Morningside Heights", "Upper West Side", "Midtown", "East Village", "Lower East Side", "Chinatown", "Brooklyn", "Queens", "Other / home"] as const;
export function ownedPhotoPath(path: string, userId: string) {
  return path.startsWith(`${userId}/`) && /^[a-zA-Z0-9-]+\/[0-9a-f-]{36}\.jpg$/.test(path);
}
export function imageMime(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return "image/png";
  if (String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}
export function validatePhotoDetails(scene: string, dish: string, persona: string, restaurant: string, neighborhood: string, replyStyle: string, language: string) {
  if (scene.length > 500 || !dish.trim() || dish.length > 80) return "Add a dish name and keep your optional food story under 500 characters.";
  if (!(PERSONAS as readonly string[]).includes(persona) || !(REPLY_STYLES as readonly string[]).includes(replyStyle) || !(POST_LANGUAGES as readonly string[]).includes(language)) return "Choose an available chef style, reaction and language.";
  if (restaurant.length > 100 || !(NEIGHBORHOODS as readonly string[]).includes(neighborhood)) return "Choose a neighborhood and keep the place name under 100 characters.";
  return null;
}

export function dailyChefChallenge(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const dateKey = `${part("year")}-${part("month")}-${part("day")}`;
  const day = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86400000);
  return { persona: PERSONAS[0], style: REPLY_STYLES[day % REPLY_STYLES.length], dateKey };
}
