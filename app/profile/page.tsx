import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateNames } from "./actions";
import AvatarUpload from "./avatar-upload";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error: loadError } = await supabase.from("profiles")
    .select("first_name, last_name, avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as Profile | null;
  const { error, updated } = await searchParams;

  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data: signed } = await supabase.storage.from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 p-8">
      <nav className="flex gap-5 underline"><Link href="/">Home</Link><Link href="/private">Members-only page</Link></nav>
      <h1 className="text-3xl font-bold">Profile</h1>
      <p>Signed in as {user.email}</p>
      {loadError && <p role="alert" className="text-red-600">Could not load your profile. Run the Week 3 database setup first.</p>}
      {!loadError && (!profile?.first_name || !profile?.last_name) && (
        <p className="rounded-md bg-amber-100 p-4 text-amber-900">Welcome! Please add your first and last name.</p>
      )}
      {updated && <p role="status" className="text-green-700">Profile saved.</p>}
      {error && <p role="alert" className="text-red-600">
        {error === "photo" ? "Choose a JPG, PNG, or WebP image smaller than 5 MB." :
          error === "names" ? "Enter a first and last name, each under 80 characters." :
          "Could not save your changes. Check the Supabase table, bucket, and policies."}
      </p>}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your details</h2>
        <form action={updateNames} className="flex flex-col gap-4">
          <label>First name <input name="first_name" required maxLength={80} defaultValue={profile?.first_name ?? ""}
            className="mt-1 block w-full rounded border p-2 text-foreground" /></label>
          <label>Last name <input name="last_name" required maxLength={80} defaultValue={profile?.last_name ?? ""}
            className="mt-1 block w-full rounded border p-2 text-foreground" /></label>
          <button type="submit" className="w-fit rounded bg-foreground px-5 py-2 text-background">Save names</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Photo</h2>
        {avatarUrl && <Image unoptimized src={avatarUrl} alt="Your profile photo" width={128} height={128} className="h-32 w-32 rounded-full object-cover" />}
        <AvatarUpload />
      </section>
    </main>
  );
}
