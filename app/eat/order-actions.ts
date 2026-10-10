"use server";
import { createClient } from "@/lib/supabase/server";
import { readDiners, type OrderResult } from "@/lib/group-dining";
import { generateGroupOrder } from "@/lib/ai/group-order";
export async function suggestOrders(_previous: OrderResult, form: FormData): Promise<OrderResult> {
  const supabase = await createClient();
  const {data:{user},error:authError} = await supabase.auth.getUser();
  if (authError || !user) return {error:"Sign in to get ordering ideas."};
  if (form.get("consent") !== "yes") return {error:"Confirm everyone agrees to send their opinions to Gemini."};
  let diners;
  try { diners = readDiners(form.get("diners")); } catch (error) { return {error:error instanceof Error ? error.message : "Check group details."}; }
  const name = String(form.get("restaurant") || "").trim(), cuisine = String(form.get("cuisine") || "").trim(), menu = String(form.get("menu") || "").trim();
  if (!name || name.length > 120 || !cuisine || cuisine.length > 300 || menu.length > 4000) return {error:"Check the restaurant details and keep menu text under 4,000 characters."};
  if (!process.env.GEMINI_API_KEY?.trim()) return {error:"AI ordering ideas are not configured yet."};
  const {data:credit,error} = await supabase.rpc("claim_caption_generation");
  if (error) return {error:"AI ordering ideas are unavailable. Check the Supabase setup."};
  if (credit !== "ok") return {error:credit === "cooldown" ? "Wait 30 seconds between AI requests." : "You’ve reached the shared limit of 10 AI attempts today."};
  try { return {plan:await generateGroupOrder(diners,{name,cuisine},menu)}; }
  catch (error) { return {error:error instanceof Error ? error.message : "Could not generate ordering ideas."}; }
}
