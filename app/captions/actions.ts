"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateCaption } from "@/lib/ai/gemini";
import { type ActionResult, validVote, validateGeneration } from "@/lib/captions";

export async function createCaption(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in to generate a caption." };
  const scene = String(form.get("scene") ?? "").trim();
  const dish = String(form.get("dish") ?? "");
  const tone = String(form.get("tone") ?? "");
  const invalid = validateGeneration(scene, dish, tone);
  if (invalid) return { error: invalid };
  if (!process.env.GEMINI_API_KEY) return { error: "AI generation is not configured yet. Please try again after setup." };
  const { data: credit, error: creditError } = await supabase.rpc("claim_caption_generation");
  if (creditError) return { error: "Generation is not available yet. Please try again later." };
  if (credit !== "ok") return { error: credit === "cooldown" ? "Please wait 30 seconds between generations." : "You have reached 10 generation attempts today. Come back tomorrow!" };
  try {
    const generated = await generateCaption(scene, dish, tone);
    const { error } = await supabase.from("caption_generations").insert({ user_id: user.id, scene, dish, tone, ...generated });
    if (error) return { error: "Your caption could not be saved. Please try again later." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not generate a caption. Please try again." }; }
  revalidatePath("/captions");
  return { success: "Your AI caption is live! Find it under My captions or Newest." };
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
