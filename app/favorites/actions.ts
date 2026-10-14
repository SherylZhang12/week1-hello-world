"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanFoodPreferenceName, validFoodPreferenceRating } from "@/lib/food-preferences";

export type FavoriteRatingResult = { success?: string; error?: string };

export async function saveFavoriteRating(foodName: string, rating: number): Promise<FavoriteRatingResult> {
  const food = cleanFoodPreferenceName(foodName);
  if (!food) return { error: "Enter a food name under 80 characters." };
  if (!validFoodPreferenceRating(rating)) return { error: "Choose a rating from 1 to 10." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to rate this food." };

  const { error } = await supabase.from("user_food_preferences").upsert(
    { user_id: user.id, food_name: food.name, food_key: food.key, rating, updated_at: new Date().toISOString() },
    { onConflict: "user_id,food_key" },
  );
  if (error) return { error: "Your rating could not be saved. Please try again." };

  revalidatePath("/");
  revalidatePath("/favorites");
  return { success: `${food.name} is saved as ${rating}/10.` };
}

export async function addFoodPreference(_previous: FavoriteRatingResult, formData: FormData): Promise<FavoriteRatingResult> {
  const rating = Number(formData.get("rating"));
  return saveFavoriteRating(String(formData.get("food_name") ?? ""), rating);
}

