export function cleanFoodPreferenceName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) return null;
  return { name, key: name.toLocaleLowerCase("en-US") };
}

export function validFoodPreferenceRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
}
