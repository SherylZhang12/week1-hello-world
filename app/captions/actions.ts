"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateFoodImage } from "@/lib/ai/food-image";
import { imageMime, ownedPhotoPath, validatePhotoDetails } from "@/lib/food-photo";
import { type ActionResult, validVote } from "@/lib/captions";

export async function createCaption(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to create a tiny dining companion." };
  const scene = String(form.get("scene") ?? "").trim();
  const dish = String(form.get("dish") ?? "").trim();
  const tone = String(form.get("tone") ?? "");
  const animal_action = String(form.get("animal_action") ?? "");
  const restaurant = String(form.get("restaurant") ?? "").trim();
  const neighborhood = String(form.get("neighborhood") ?? "");
  const original_path = String(form.get("original_path") ?? "");
  const invalid = validatePhotoDetails(scene, dish, tone, restaurant, neighborhood, animal_action);
  if (invalid) return { error: invalid };
  if (!ownedPhotoPath(original_path, user.id)) return { error: "Upload your own food photo first." };
  if (!process.env.GEMINI_API_KEY) return { error: "Tiny companion generation is not configured yet. Please try again after setup." };
  const { data: photo, error: photoError } = await supabase.storage.from("food-photos").download(original_path);
  if (photoError || !photo || !photo.size || photo.size > 5 * 1024 * 1024) return { error: "Could not read your photo. Upload a JPG, PNG or WebP up to 5 MB." };
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const mimeType = imageMime(bytes);
  if (!mimeType) return { error: "This photo format is not supported." };
  const { data: credit, error: creditError } = await supabase.rpc("claim_caption_generation");
  if (creditError) return { error: "Photo generation is not available yet. Please try again later." };
  if (credit !== "ok") return { error: credit === "cooldown" ? "Please wait 30 seconds between generations." : "You have reached 3 image attempts today. Come back tomorrow!" };
  try {
    const generated = await generateFoodImage(bytes, mimeType, scene, dish, tone, animal_action);
    const extension = generated.mimeType === "image/png" ? "png" : generated.mimeType === "image/webp" ? "webp" : "jpg";
    const image_path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("food-photos").upload(image_path, generated.bytes, { contentType: generated.mimeType, upsert: false });
    if (uploadError) return { error: "Your AI animal photo could not be saved. Please try again later." };
    const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
    const display_name = String(profile?.first_name || "Food explorer").slice(0, 80);
    const { error } = await supabase.from("caption_generations").insert({ user_id: user.id, scene, dish, tone, animal_action, caption: dish, restaurant, neighborhood, original_path, image_path, display_name, model: generated.model, prompt: generated.prompt, system_prompt: generated.system_prompt });
    if (error) {
      await supabase.storage.from("food-photos").remove([image_path]);
      return { error: "Your draft could not be saved. Please try again later." };
    }
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not create your AI photo. Please try again." }; }
  revalidatePath("/captions");
  return { success: "Your private preview is ready. Open My posts to compare the photos and publish." };
}

export async function publishPhoto(id: string): Promise<ActionResult> {
  if (!validVote(id, 1)) return { error: "Invalid post." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to publish." };
  const { data, error } = await supabase.from("caption_generations").update({ published_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).is("published_at", null).not("image_path", "is", null).select("id");
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
