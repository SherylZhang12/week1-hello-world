"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateChefReview } from "@/lib/ai/gemini";
import { imageMime, ownedPhotoPath, validatePhotoDetails, validatePersonalReview } from "@/lib/food-photo";
import { type ActionResult, validVote } from "@/lib/captions";

export async function createCaption(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to share a meal and add an AI reaction." };
  const scene = String(form.get("scene") ?? "").trim();
  const dish = String(form.get("dish") ?? "").trim();
  const tone = String(form.get("tone") ?? "");
  const reply_style = String(form.get("reply_style") ?? "");
  const language = String(form.get("language") ?? "");
  const restaurant = String(form.get("restaurant") ?? "").trim();
  const neighborhood = String(form.get("neighborhood") ?? "");
  const personal_review = String(form.get("personal_review") ?? "").trim();
  const rating = String(form.get("personal_rating") ?? "").trim();
  const personal_rating = rating ? Number(rating) : null;
  const reviewError = validatePersonalReview(personal_review, rating);
  if (reviewError) return { error: reviewError };
  const original_path = String(form.get("original_path") ?? "");
  const invalid = validatePhotoDetails(scene, dish, tone, restaurant, neighborhood, reply_style, language);
  if (invalid) return { error: invalid };
  if (!ownedPhotoPath(original_path, user.id)) return { error: "Upload your own food photo first." };
  if (!process.env.GEMINI_API_KEY) return { error: "AI reactions are not configured yet. Please try again after setup." };
  const { data: photo, error: photoError } = await supabase.storage.from("food-photos").download(original_path);
  if (photoError || !photo || !photo.size || photo.size > 5 * 1024 * 1024) return { error: "Could not read your photo. Upload a JPG, PNG or WebP up to 5 MB." };
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const mimeType = imageMime(bytes);
  if (!mimeType) return { error: "This photo format is not supported." };
  const { data: credit, error: creditError } = await supabase.rpc("claim_caption_generation");
  if (creditError) return { error: "AI reactions are not available yet. Please try again later." };
  if (credit !== "ok") return { error: credit === "cooldown" ? "Please wait 30 seconds between generations." : "You have reached 10 AI reaction attempts today. Come back tomorrow!" };
  try {
    const generated = await generateChefReview(bytes, mimeType, scene, dish, tone, reply_style, language);
    const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
    const display_name = String(profile?.first_name || "Food explorer").slice(0, 80);
    const { error } = await supabase.from("caption_generations").insert({ user_id: user.id, scene, dish, tone, reply_style, language, media_kind: "chef_text", restaurant, neighborhood, personal_review, personal_rating, original_path, display_name, ...generated });
    if (error) return { error: "Your meal and AI reaction could not be saved. Please try again later." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not write your AI reaction. Please try again." }; }
  revalidatePath("/captions");
  return { success: "Your private meal preview is ready. Open My posts to read it, copy the reaction or publish. Your personal review and selected AI reaction appear together." };
}

export async function publishPhoto(id: string): Promise<ActionResult> {
  if (!validVote(id, 1)) return { error: "Invalid post." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to publish." };
  const { data, error } = await supabase.from("caption_generations").update({ published_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).is("published_at", null).not("original_path", "is", null).eq("media_kind", "chef_text").select("id");
  if (error || !data?.length) return { error: "This draft could not be published." };
  revalidatePath("/captions");
  return { success: "Posted to the community." };
}

export async function savePhoto(id: string, saved: boolean): Promise<ActionResult> {
  if (!validVote(id, 1) || typeof saved !== "boolean") return { error: "Invalid post." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save food discoveries." };
  const { error } = saved ? await supabase.from("food_saves").delete().eq("user_id", user.id).eq("generation_id", id) : await supabase.from("food_saves").insert({ user_id: user.id, generation_id: id });
  if (error && error.code !== "23505") return { error: "Could not update your saved posts." };
  revalidatePath("/captions");
  return { success: saved ? "Removed from saved posts." : "Saved for your next food adventure." };
}

export async function rateCaption(id: string, value: number): Promise<ActionResult> {
  if (!validVote(id, value)) return { error: "This vote is invalid." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to vote." };
  // Explicit INSERT on the first vote; the unique constraint prevents double voting.
  const { error } = await supabase.from("caption_votes").insert({ user_id: user.id, generation_id: id, value });
  if (error?.code === "23505") {
    const { error: updateError } = await supabase.from("caption_votes").update({ value }).eq("generation_id", id).eq("user_id", user.id);
    if (updateError) return { error: "Could not change your vote. Please try again." };
  } else if (error) return { error: "Could not save your vote. Please try again." };
  revalidatePath("/captions");
  return { success: "Vote saved." };
}
