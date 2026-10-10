"use server";
import { createClient } from "@/lib/supabase/server";
import { MEALS, readMealProfile, type CoachResult } from "@/lib/meal-coach";
import { imageMime } from "@/lib/food-photo";
import { generateMealPlan, type CoachPhoto } from "@/lib/ai/meal-coach";

export async function coachMeals(_previous: CoachResult, form: FormData): Promise<CoachResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to use your daily meal coach." };
  if (form.get("consent") !== "yes") return { error: "Confirm you want to send these photos and details to Gemini for analysis." };
  const { profile, error } = readMealProfile(form);
  if (error || !profile) return { error: error || "Check your meal profile." };
  const photos: CoachPhoto[] = [];
  for (const meal of MEALS) {
    const file = form.get(`photo_${meal}`);
    const notes = String(form.get(`notes_${meal}`) ?? "").trim();
    if (notes.length > 500) return { error: "Keep portion notes under 500 characters per meal." };
    if (!file || typeof file === "string" || !file.size) continue;
    if (file.size > 300 * 1024) return { error: "A meal photo is too large. Choose it again so it can be resized." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = imageMime(bytes);
    if (!mimeType) return { error: "Use a JPG, PNG or WebP meal photo." };
    photos.push({ meal, bytes, mimeType, notes });
  }
  if (!photos.length) return { error: "Add at least one photo of a meal you have already eaten today." };
  if (!process.env.GEMINI_API_KEY?.trim()) return { error: "Meal coaching is not configured yet. Please try after AI setup." };
  const { data: credit, error: creditError } = await supabase.rpc("claim_caption_generation");
  if (creditError) return { error: "AI meal coaching is unavailable. Check the Week 4 Supabase setup." };
  if (credit !== "ok") return { error: credit === "cooldown" ? "Wait 30 seconds between AI requests." : "You’ve reached 10 AI attempts today, shared by meal coaching and post reactions." };
  // Photos/profile/plan are request-only: no Storage upload, row insert or raw-data logging.
  try { return await generateMealPlan(profile, photos); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not build a meal plan. Please try again." }; }
}
