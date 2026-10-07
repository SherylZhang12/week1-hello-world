# Foodfolio — Gordon Ramsay-style food critiques

## Product

Real food photo → Gordon Ramsay-style commentary → Roast, Hype, or Roast then hype → English → AI writes an original short chef critique → private preview → publish → community votes, bookmarks and shares.

The named style is Gordon Ramsay: punchy sentences, dramatic rhetorical questions, culinary metaphors, fiery roasts and hard-earned praise. The homepage and community page explicitly display Gordon Ramsay-style food critiques. Both pages and each critique label the output as AI style imitation, not his real review or endorsement. Copied critiques carry the same attribution. The prompt forbids claiming to be him or copying show dialogue, and critiques only visible presentation plus supplied context; it must not infer taste, doneness or safety from a photo. A new reaction mode appears daily at New York midnight. Newest/weekly rankings and user-supplied restaurant/area bookmarks support discovery. Validate these engagement hypotheses with the PM.

AI generates text only. Photos are the users’ real uploads. There is no active image-generation call in the creation flow. `gemini-2.5-flash-lite` has free-tier image input/text output, subject to account availability and quotas. Do not enable billing for this version. Official pricing: https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite

## Apply

```bash
bash /Users/mac/.codex/.chatgpt-projects/g-p-6abd8d4db1388191bcff0fb3f7631307/week4-rating/scripts/apply-week4.sh
```

The script checks your original checkout is clean and still at the Gordon Ramsay commit `1f4de7b`, copies the changes, runs lint/tests/build, then commits and pushes. If your checkout has changed, it stops for review. It never copies credentials.

## Configure

1. Rerun the updated `supabase/week4_rating.sql` in the SAME Supabase project. This adds reply style, language and media kind, increases the text length, allows the Gordon Ramsay persona and chef_text media kind, updates text-post publishing/voting policies and changes the daily limit to 10. The earlier SQL is insufficient for this version. Existing rows and uploaded photos are preserved; the new feed shows chef text posts.
2. Create a Gemini API key in https://aistudio.google.com/api-keys using a project with free-tier text-model access. Keep billing disabled. Never send the key in chat or commit it.
3. In the existing Vercel project, add server-only `GEMINI_API_KEY` for Production and Preview. Optional `GEMINI_MODEL` defaults to `gemini-2.5-flash-lite`. Keep the existing Supabase settings. `GEMINI_IMAGE_MODEL` is unused by this creation flow.
4. Redeploy after adding the key. Retain the existing Google login and allow the deployment’s `/auth/callback` in Supabase Auth.
5. Verify the commit deployment works in Incognito and is available for grading. Submit the commit-specific deployment URL.

## Assignment and security

Logged-in users create actual AI text based on their photo, and exact system/user prompts, model, author and original photo path are saved. The first vote creates a `caption_votes` row referring to the correct `caption_generations` row. Subsequent votes change only that user’s existing vote. Anonymous visitors can browse published posts but cannot generate, publish, save or vote.

The reused schema names are intentional. `tone` is the persona, `reply_style` the reaction, `language` the post language, and `media_kind` is `chef_text`. Original photos remain in private Storage. RLS protects ownership of rows and files. Only the author can see private previews, raw prompts, profile details and vote/bookmark records. Publishing exposes the photo, AI critique, first name, place and optional food story; the feed exposes aggregate vote counts and the current caller’s vote. Users can copy the AI critique and share a direct post link.

Uploads are resized/re-encoded to strip EXIF before Gemini input. Generation errors never fabricate results. Atomic rate limiting permits 10 attempts per New York day with 30 seconds between attempts. Free provider limits can be tighter and show a useful error when exhausted.

## Validation

`npm run lint`, `npm run test:week4`, `npm run build -- --webpack`.

Tests cover authentication, photo ownership, first vote insert, duplicate update, denied writes, private prompt storage, text-only provider requests with actual image input, persona/style/language forwarding, invalid inputs, blocked/malformed output and daily rollover. Mocked checks do not prove live key access or RLS. Browser visual validation remains pending.

Live checklist: generate Roast and Hype modes using a real food photo; confirm attribution on pages, cards and copied text; verify English-only UI and generated commentary; ensure previews are private before publication; publish and vote from two accounts; verify vote count stays at one on change; ensure another user cannot read or modify private rows; test bookmarks, copy and share; confirm Week 3 profile/avatar/OAuth; inspect RLS on any extra existing tables; verify Incognito access; obtain real PM feedback and implement relevant improvements before submitting.

## Login redirect configuration

The application sends Google OAuth back to the current website origin at `/auth/callback`. Supabase must allow that exact callback, otherwise sign-in may fall back to the project Site URL (previously localhost). This is a dashboard setting, not fixed by translating the UI.

In Supabase Authentication → URL Configuration:

- Set Site URL to the production website root. For the currently visited deployment: `https://week1-hello-world-lzpwwq68y-sheryl7.vercel.app`. Replace with the stable production domain from Vercel once confirmed.
- Add `https://week1-hello-world-lzpwwq68y-sheryl7.vercel.app/auth/callback` to Redirect URLs for the current deployment.
- To support future commit URLs of this same project, add `https://week1-hello-world-*-sheryl7.vercel.app/auth/callback`. This limits the wildcard to the same project/account and the exact callback path.
- Keep `http://localhost:3000/auth/callback` for local development if needed.

After saving, start a NEW Google login on the online site. Do not reuse an old authorization URL or copy its one-time code between domains. URL Configuration changes apply without a new app deployment; English UI changes require the new commit deployment.

Reference: https://supabase.com/docs/guides/auth/redirect-urls
