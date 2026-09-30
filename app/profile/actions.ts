"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateNames(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80) {
    redirect("/profile?error=names");
  }

  const { error: insertError } = await supabase.from("profiles").upsert(
    { id: user.id },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (insertError) redirect("/profile?error=save");
  const { error } = await supabase.from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", user.id);
  if (error) redirect("/profile?error=save");

  revalidatePath("/profile");
  redirect("/profile?updated=1");
}
