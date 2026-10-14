"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FavoriteRatingResult = { success?: string; error?: string };

export async function saveFavoriteRating(foodId: number, rating: number): Promise<FavoriteRatingResult> {
  if (!Number.isSafeInteger(foodId) || foodId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 10) {
    return { error: "Choose a rating from 1 to 10." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to rate this food." };

  const { error } = await supabase.from("favorite_food_ratings").upsert(
    { user_id: user.id, food_id: foodId, rating, updated_at: new Date().toISOString() },
    { onConflict: "user_id,food_id" },
  );
  if (error) return { error: "Your rating could not be saved. Please try again." };

  revalidatePath("/");
  return { success: `Your ${rating}/10 rating is saved.` };
}

