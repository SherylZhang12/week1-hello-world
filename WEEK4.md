# Week 4 — Foodfolio: NYC, served with a punchline

Extends the same Next.js/Supabase application from Weeks 1–3.

## Apply to the original local checkout

Run `bash scripts/apply-week4.sh` from this prepared checkout. It checks that the original Week 3 checkout is clean and unchanged, copies only the 15 intended files, runs lint/tests/build, commits and pushes to the same GitHub repository. Credentials and local environment files are never copied. If the original project has changed, the script stops rather than overwriting work.

## Setup in the existing projects

1. In the existing Supabase SQL Editor, execute `supabase/week4_rating.sql`. It is transactional, preserves existing data, enables RLS on every public table, and replaces policies only on the app-owned tables. Review the printed policies for any additional tables.
2. In the existing Vercel project's Environment Variables, add `GEMINI_API_KEY` as a server-only variable for Production and Preview. Use your own Google AI Studio key. Do not use a `NEXT_PUBLIC_` prefix or commit the key. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash-lite`). Keep both existing Supabase environment variables.
3. Redeploy the new commit after setting environment variables.
4. Ensure Supabase Auth's redirect allowlist includes the deployed `/auth/callback` URL. The existing Google OAuth flow is retained; successful login now opens `/captions`.
5. For grading, open Vercel Settings → Deployment Protection and verify the commit deployment is accessible in Incognito. A change to that security setting should be made by the project owner.
6. Open `/captions`, sign in, and generate the first caption. No fake seed content or placeholder AI results are inserted.

## Features

- Signed-in users describe a food situation, select a food and tone, and generate a real Gemini caption.
- The caption, source scene, exact user/system prompts, model, timestamp, and authenticated owner ID are saved in `caption_generations`.
- The first vote INSERTs a new row in `caption_votes` referencing the correct generation and authenticated voter. A uniqueness constraint prevents duplicate votes; changing a vote UPDATEs that user's row.
- Server actions validate authentication and inputs on every mutation. RLS supplies a second database authorization boundary.
- Raw generation/prompt rows and votes can be read only by their owners. A fixed SQL function exposes public caption content and aggregate scores without owner IDs or other users' vote records.
- Public visitors browse; only signed-in users generate or vote. Existing profile, avatar and private-page features remain.
- Newest, Top this week, My captions, a prompt that changes at New York midnight, and copy-caption controls.
- Atomic database rate limiting: 10 generation attempts per New York day, at least 30 seconds between attempts. AI errors never create fake content; rejected database writes never report success.

## Product decisions for Sam

Daily prompt and fresh community captions create a reason to return. NYC food and dorm scenes give Sam recognizable, local material. Weekly ranking keeps the feed current; copying captions makes them easy to share in group chats. Compared with a generic caption feed, tone selection, scene context, clear AI labeling, and one vote per person make the content more useful and the rankings more understandable. The accompanying food illustrations are decorative SVGs, not AI-generated media; the generated caption is the media being rated.

## Validation

- `npm run build -- --webpack`: production compile and TypeScript.
- `npm run lint`: ESLint.
- `npm run test:week4`: mocked server-action/provider tests for authentication, ownership, invalid input, first-vote INSERT, duplicate-vote UPDATE, write errors, quotas, New York daily prompts, provider failure and blocked output.

The mocked tests do not prove live Supabase policies or Gemini credentials. Perform this live checklist before submission:

- Incognito can read the public feed but cannot generate or vote; direct anonymous writes are denied.
- User A can generate, see the stored row/prompts, vote, reload and see the same vote.
- User B can see A's caption but cannot read A's raw vote/prompt/profile rows, edit A's vote, or create a row under A's user ID.
- First vote creates one row; changing it changes the score without increasing vote count.
- Every application table has RLS enabled; inspect policies on any additional tables and preserve necessary existing functionality.
- Profile editing, Google login and avatar upload still work.
- AI timeout, blocked response and quota failure display a useful error.
- Record actual PM feedback from the Feedback Group, implement it, and retest. No feedback was supplied at implementation time.
- Submit the unique URL from the deployment for the final commit, not the moving production alias.
