"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const photo = new FormData(form).get("photo");
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    };
    if (!(photo instanceof File) || !photo.size || photo.size > 5 * 1024 * 1024 || !extensions[photo.type]) {
      setMessage("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }
      const path = `${user.id}/${crypto.randomUUID()}.${extensions[photo.type]}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, photo, {
        contentType: photo.type, upsert: false,
      });
      if (uploadError) throw uploadError;
      const { error: saveError } = await supabase.from("profiles").upsert({ id: user.id, avatar_path: path });
      if (saveError) throw saveError;
      form.reset();
      setMessage("Photo saved.");
      router.refresh();
    } catch {
      setMessage("Could not save your photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="flex flex-col gap-4">
      <label>Choose a profile photo (JPG, PNG, or WebP, up to 5 MB)
        <input className="mt-2 block" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} />
      </label>
      <button type="submit" disabled={busy} className="w-fit rounded bg-foreground px-5 py-2 text-background disabled:opacity-50">
        {busy ? "Uploading…" : "Upload photo"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
