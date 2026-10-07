export const ANIMALS = ["Kitten", "Puppy", "Bunny"] as const;
export const ANIMAL_ACTIONS = ["Eating with a spoon", "Holding a tiny fork", "Sneaking a bite"] as const;
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
export function validatePhotoDetails(scene: string, dish: string, animal: string, restaurant: string, neighborhood: string, animalAction: string) {
  if (scene.length > 500 || !dish.trim() || dish.length > 80) return "Add a dish name and keep your optional food story under 500 characters.";
  if (!(ANIMALS as readonly string[]).includes(animal) || !(ANIMAL_ACTIONS as readonly string[]).includes(animalAction)) return "Choose an available animal and action.";
  if (restaurant.length > 100 || !(NEIGHBORHOODS as readonly string[]).includes(neighborhood)) return "Choose a neighborhood and keep the place name under 100 characters.";
  return null;
}

export function dailyCompanion(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const dateKey = `${part("year")}-${part("month")}-${part("day")}`;
  const day = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86400000);
  return { animal: ANIMALS[day % ANIMALS.length], action: ANIMAL_ACTIONS[Math.floor(day / ANIMALS.length) % ANIMAL_ACTIONS.length], dateKey };
}
