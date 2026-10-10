# Foodfolio — discover, eat, share

## Product

“What should I eat today?” → choose a NYC neighborhood or explicitly allow device location → enter wanted and unwanted cuisines → real mapped restaurant candidates with distance, source and Google Maps link → “Ate here? Share your meal” pre-fills the restaurant name.

Upload a real food photo → add restaurant, neighborhood, personal review and optional 1–5 star personal rating → choose Gordon Ramsay-style chef, Cat or Dog → choose Roast, Hype or Roast then hype → English AI reaction → private preview with human review and AI reaction side by side → publish → vote on AI humor, bookmark and share. Original reviews are never rewritten by AI or passed as the photo context. Existing posts remain intact and show no personal rating when none was provided.

The chef voice uses an American TV kitchen roast style and is labeled AI imitation, not his actual review or endorsement. Cat and dog voices are fictional “found my human’s phone” posts. Prompts require visible-photo details, prohibit inferred taste, safety or hidden ingredients, and prohibit feeding the food to pets. Photos remain real; no image generation is called. Gemini model defaults to gemini-3.1-flash-lite; availability and free quotas depend on the Google project. https://ai.google.dev/gemini-api/docs/pricing

Restaurant discovery is deterministic map-tag matching, not AI-invented listings. Plain text recognizes supported cuisine names/aliases (e.g. Japanese, ramen, pizza, Thai); matching ramen means the Japanese tag, not verified ramen menu availability. Wanted and skipped cuisines have separate fields; unsupported-only inputs receive an explanation. Missing cuisine tags are excluded when filtering. Mixed unsupported preferences are not enforced: the UI states cuisine-only search. There is no price, open-now, ingredient, allergy or spice guarantee. Straight-line distances use rounded coordinates, not walking routes. Browser location is requested only on click; rounded coordinates leave the browser only on submit, and are not saved in profiles/posts. Google Maps links and OSM source links are externally navigable.

The coursework prototype uses OpenStreetMap via Overpass with one-hour query caching, authentication and atomic per-user limits of 20 searches/day and a 15-second cooldown. No new API key or billing setup. Public Overpass has load shedding and is unsuitable as the long-term backend of a popular consumer app: replace it with a dedicated instance or suitable places provider before broad release. Endpoint failures and incomplete queries show errors, never fake recommendations. Attribution is displayed. Official source: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html

Daily return hypotheses: solving the recurring “what to eat” decision, fresh community discoveries, saved places and a rotating AI reaction mode. Shareability comes from the actual meal plus human review and playful AI opinion. Validate with users before claiming growth or retention.

## Apply

```bash
bash /Users/mac/.codex/.chatgpt-projects/g-p-6abd8d4db1388191bcff0fb3f7631307/week4-rating/scripts/apply-week4.sh
```

The script checks your original checkout is clean and still at the Gemini-update commit `e15337f`, copies the changes, runs lint/tests/build, then commits and pushes. If your checkout has changed, it stops for review. It never copies credentials.

## Configure

1. For your already-configured Week 4 database, run `supabase/food_discovery.sql` in the SAME Supabase project. For a fresh setup, use the full `supabase/week4_rating.sql` instead. This adds personal_review and personal_rating, extends the feed RPC, and adds the separate restaurant search limit function/table. Cat and Dog personas reuse the existing allowed tones. The earlier SQL is insufficient for this version. Existing rows and uploaded photos are preserved; the new feed shows chef text posts.
2. Create a Gemini API key in https://aistudio.google.com/api-keys using a project with free-tier text-model access. Keep billing disabled. Never send the key in chat or commit it.
3. In the existing Vercel project, add server-only `GEMINI_API_KEY` for Production and Preview. Optional `GEMINI_MODEL` defaults to `gemini-3.1-flash-lite`. Keep the existing Supabase settings. `GEMINI_IMAGE_MODEL` is unused by this creation flow.
4. Redeploy after adding the key. Retain the existing Google login and allow the deployment’s `/auth/callback` in Supabase Auth.
5. Verify the commit deployment works in Incognito and is available for grading. Submit the commit-specific deployment URL.

## Assignment and security

Logged-in users create actual AI text based on their photo, and exact system/user prompts, model, author and original photo path are saved. The first vote creates a `caption_votes` row referring to the correct `caption_generations` row. Subsequent votes change only that user’s existing vote. Anonymous visitors can browse published posts but cannot generate, publish, save or vote.

The reused schema names are intentional. `tone` is the persona, `reply_style` the reaction, `language` the post language, and `media_kind` is `chef_text`. Original photos remain in private Storage. RLS protects ownership of rows and files. Only the author can see private previews, raw prompts, profile details and vote/bookmark records. Publishing exposes the photo, personal review and rating, AI reaction, first name, place and optional context; the feed exposes aggregate vote counts and the current caller’s vote. Users can copy the AI critique and share a direct post link.

Uploads are resized/re-encoded to strip EXIF before Gemini input. Generation errors never fabricate results. Atomic rate limiting permits 10 attempts per New York day with 30 seconds between attempts. Free provider limits can be tighter and show a useful error when exhausted.

## Validation

`npm run lint`, `npm run test:week4`, `npm run build -- --webpack`.

Tests cover authentication, photo ownership, first vote insert, duplicate update, denied writes, private prompt storage, text-only provider requests with actual image input, persona/style/language forwarding, invalid inputs, blocked/malformed output and daily rollover. Mocked checks do not prove live key access or RLS. Browser visual validation remains pending.

Live checklist: search near a chosen area and device location, test exclusions/no-match/provider-unavailable states, verify restaurant source and navigation, prefill a restaurant into a post, save/read personal review and rating, generate all three personas in Roast and Hype modes using a real food photo; confirm attribution on pages, cards and copied text; verify English-only UI and generated commentary; ensure previews are private before publication; publish and vote from two accounts; verify vote count stays at one on change; ensure another user cannot read or modify private rows; test bookmarks, copy and share; confirm Week 3 profile/avatar/OAuth; inspect RLS on any extra existing tables; verify Incognito access; obtain real PM feedback and implement relevant improvements before submitting.

## Login redirect configuration

The application sends Google OAuth back to the current website origin at `/auth/callback`. Supabase must allow that exact callback, otherwise sign-in may fall back to the project Site URL (previously localhost). This is a dashboard setting, not fixed by translating the UI.

In Supabase Authentication → URL Configuration:

- Set Site URL to the production website root. For the currently visited deployment: `https://week1-hello-world-lzpwwq68y-sheryl7.vercel.app`. Replace with the stable production domain from Vercel once confirmed.
- Add `https://week1-hello-world-lzpwwq68y-sheryl7.vercel.app/auth/callback` to Redirect URLs for the current deployment.
- To support future commit URLs of this same project, add `https://week1-hello-world-*-sheryl7.vercel.app/auth/callback`. This limits the wildcard to the same project/account and the exact callback path.
- Keep `http://localhost:3000/auth/callback` for local development if needed.

After saving, start a NEW Google login on the online site. Do not reuse an old authorization URL or copy its one-time code between domains. URL Configuration changes apply without a new app deployment; English UI changes require the new commit deployment.

Reference: https://supabase.com/docs/guides/auth/redirect-urls

## Gemini error diagnosis

Generation now defaults to `gemini-3.1-flash-lite` (image input, text output, free tier subject to quota). An existing GEMINI_MODEL overrides the default: set it to that model if it still points at an older model. Changes require a fresh Vercel deployment. Provider HTTP status and a safe diagnostic label appear on failures: KEY_REJECTED, API_DISABLED, MODEL_UNAVAILABLE, ACCESS_DENIED, QUOTA or INVALID_REQUEST. The raw provider message, API key and photo are never echoed. Vercel server logs include only the status, label and model. No billing is enabled by these changes.

## Daily meal coach

Route `/meal-coach`: upload breakfast, lunch and/or dinner already eaten today; add portion/ingredient notes, adult age, optional height (cm), weight (kg) and sex, activity level, main goal and free-text dietary needs. Latest uploaded slot determines the next meal slots: breakfast → lunch/dinner; lunch → dinner; dinner → tomorrow’s three meals. Unuploaded earlier meals are unknown, not inferred. AI returns observations with uncertainty, concrete next-meal ideas, alternatives, improvements and follow-up questions. Goal choices: balanced eating, muscle support, anti-inflammatory eating pattern. The coach uses a supportive voice separate from entertainment personas.

This version provides qualitative general adult food guidance, not numeric calorie/macro prescriptions, diagnosis or treatment. Photos cannot establish actual intake/portions, nutrient deficiencies, allergens or inflammation. Anti-inflammatory goals are framed as Mediterranean-style food patterns without promised medical effects. Prompt sources are linked in the UI; links do not validate an individual generated plan. Restrictions are passed to the AI, whose suggestions cannot certify allergen safety; ingredients still need checking. No BMI scoring, body shame, compensatory restriction or supplement/medication recommendations. Medical dietary needs are referred to a dietitian/clinician for individual targets.

Privacy: original photos are locally resized/re-encoded to JPEG (stripping EXIF), at most 300 KB each. Prepared photos and the entered body/goal details are sent through an authenticated Server Action to Google Gemini only after the consent checkbox is checked. They are not uploaded to Supabase Storage, saved as posts or inserted into profiles; the generated plan remains client-session state. Gemini processing/storage is subject to Google's terms; this is not a claim that Google retains nothing. Reload/Clear this session clears the app's displayed inputs and plan. Shared Gemini request code logs only provider status/diagnostic/model. Atomic existing `claim_caption_generation` limits apply: 10 AI attempts/day shared with post reactions; 30-second cooldown. No new meal-coach SQL or env variables are needed; pending food discovery SQL from the previous addition is still required.

Additional live checks: breakfast-only → lunch/dinner, lunch-only → dinner, three photos → tomorrow, empty/non-food photos, invalid body input and quota errors, vegetarian/allergy restriction forwarding, verify no new Storage objects or health-detail database rows. Input/output checks and mocked provider tests do not prove nutritional correctness; actual model output and clinician feedback remain pending.

Nutrition references reviewed: NIDDK Health Tips for Adults; NIH ODS Exercise and Athletic Performance Consumer Fact Sheet; systematic review Effects of Dietary Patterns on Biomarkers of Inflammation and Immune Responses (PMID 34607347). These inform general prompt boundaries rather than clinical efficacy claims.

## Feedback Group iteration — October 10

User-supplied PM feedback:
- Glow: “UI Design is clear, easy to see. Great Features/Functions, Review before posting.”
- Grow: “First time user, might be hard to navigate around different pages, Introducing different personas.”

Implemented: reuse one header across home, community, food search, meal coach, login, profile and members-only pages. Destinations have consistent names/order and the current section is marked; mobile navigation wraps and remains visible. A persistent Quick guide link returns to a homepage section with three explained entry points. The community has a collapsible four-step posting guide that links to My posts and explains private preview/publication and the distinction between personal stars and AI votes. Chef/Cat/Dog are introduced through labeled radio cards, character descriptions and explicitly labeled sample voices. Private review-before-publishing behavior and the existing visual design are retained. Previously requested personal reviews/ratings, real restaurant name, nearby restaurant search and request-only daily meal coaching are included in the same release.

The sample character lines are static onboarding examples, clearly labeled; actual post reactions still require a successful AI call. This records the user's supplied feedback and the implemented response; renewed PM usability confirmation and live deployment verification are pending.
