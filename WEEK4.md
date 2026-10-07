# Week 4 — Foodfolio: Good food. Tiny company.

Extends the original Week 1–3 repository and Supabase/Vercel projects.

## Core experience

Upload a real food photo → choose Kitten, Puppy or Bunny → choose Eating with a spoon, Holding a tiny fork or Sneaking a bite → generate a private image preview → compare with the original → publish if happy → community votes, bookmarks and shares.

The requested AI edit adds one spoon-sized animal while preserving the real dish, table and background as closely as possible. The food story is optional and written by the user. The original is always available via the Original meal tab. AI can still change details, so generated photos are labeled clearly. Restaurant information is supplied by the poster; votes evaluate the AI creation, not restaurant quality.

## Product reasoning / 作业设计思考

### 1. 为什么每天回来？

真实吃饭是反复发生的场景。每次吃到新的食物，都可以拍照并创造新的小动物作品。首页每天按纽约时间更换“动物 + 动作”挑战，创作表单可以一键选择今日组合，减少不知道做什么的阻力。Discover 展示新作品，本周热门避免旧作品永久霸榜；收藏和地区筛选方便用户周末寻找下一家想尝试的店。

这只是回访假设，不能保证用户每日使用。试用时应观察用户是否隔天主动回来、是否愿意再次上传、收藏是否促成真实探店。第一版不加连续打卡或虚假通知。

### 2. 如何成为热门内容来源？

食物照片提供真实生活背景，迷你动物提供统一且易识别的视觉特色。用户自己的不同菜品、猫狗选择和动作使内容持续变化。浏览无需登录；发表作品后可复制独立帖子链接、下载真实生成的图片，并将作品分享到自己的群聊或社交平台。登录用户一人一票，可改票；排名展示本周作品，而最新页为新内容提供曝光。

传播不是只靠排行榜。应验证外部分享是否带来访问、用户是否愿意用自己的照片创作。后续可根据反馈加入动物主题筛选；关注、评论、通知留待实际需求明确后再做。

### 3. 如何改进 Crackd.ai，如何应用到 Foodfolio？

参考 2026-10-07 公开首页 https://www.crackd.ai/ ，可见图片配文、分数、时间范围榜单与 New Post。以下是建议，不声称其登录后的功能缺失。

- 给用户清楚、容易选择的创作方向，降低空白输入的门槛。Foodfolio 对应：动物选项、吃饭动作和今日组合。
- 让用户在发布前判断生成内容是否符合自己的意思。Foodfolio 对应：私人草稿、原图对照、明确的发布按钮。
- 明确投票到底评价什么，保留新内容的曝光机会。Foodfolio 对应：评价 AI 小动物作品；最新与本周热门分开。
- 让作品离开网站后仍容易传播。Foodfolio 对应：单帖链接和 AI 图片下载。
- 加入与用户生活相关的实用背景。Foodfolio 对应：餐厅、地区、自己的探店故事和私密收藏。

### Sam 的使用场景

Sam 周末在纽约吃到一碗拉面，上传照片并添加一只拿勺子的小猫。满意后发布、下载图片发给朋友。浏览别人作品时，收藏 Lower East Side 的探店帖，下个周末再去。创作与找美食在同一条自然流程中。

## Apply to your original checkout

```bash
bash /Users/mac/.codex/.chatgpt-projects/g-p-6abd8d4db1388191bcff0fb3f7631307/week4-rating/scripts/apply-week4.sh
```

The script checks that the original checkout is clean and at the inspected Week 4 caption commit (0fe5420) before copying only intended files. It runs lint, tests and production build, then commits and pushes to the existing repository. It never copies local environment files or credentials. If your original checkout has changed, it stops for review rather than overwriting changes.

## Required configuration

1. Run `supabase/week4_rating.sql` in your existing Supabase SQL Editor. It is transactional and rerunnable, adds the image/animal columns, creates the private food-photos bucket, enables RLS on all public tables, and restricts app-owned table policies. Existing rows remain; older generation types remain valid.
2. Add server-only `GEMINI_API_KEY` to the existing Vercel project, Production and Preview. Optional `GEMINI_IMAGE_MODEL` defaults to `gemini-2.5-flash-image`. Keep the existing Supabase URL and publishable key. Never prefix the Gemini key with NEXT_PUBLIC_. Use an image-generation-capable key with quota; text-only/free API access does not prove image access. Review Google’s model pricing before enabling billing.
3. Redeploy after configuring the key. Keep your existing Google OAuth settings and ensure the deployment’s `/auth/callback` is allowed in Supabase Auth.
4. Verify Vercel Deployment Protection allows the grading deployment in Incognito.
5. Generate with your own food photo, preview and publish. No fake AI images or invented community posts are seeded.
6. Submit the commit-specific deployment URL after verifying it. Record actual PM feedback, implement relevant suggestions and retest; no PM feedback has yet been provided.

## Data, authentication and RLS

For compatibility with the earlier implementation, tables retain `caption_generations` and `caption_votes` names; the generated media is now an image. `tone` stores animal choice, and `animal_action` stores the selected action. Original/generated private Storage paths, exact prompt, system prompt, model, owner, timestamps and optional place/story are recorded. Publishing exposes the two pictures, first name and food context, while prompts remain owner-only.

Every mutation verifies the authenticated user server-side; RLS checks ownership again. First voting inserts a new row referencing the media; uniqueness allows a subsequent change to update only the caller’s vote. Private drafts cannot be rated or bookmarked. Only published posts are returned to public visitors. Bookmark rows, raw votes, profiles and prompts are owner-only. The feed function returns public content, aggregate ratings and the caller’s own state. Storage signed URLs expire after an hour.

Uploaded photos are re-encoded and resized before sending to Storage/Gemini to strip EXIF location metadata. Provider failures never create fake media. Generation limits are atomic: three attempts per New York day and at least 30 seconds between attempts. If saving a generated draft fails, its unused generated image is removed; the original upload remains.

## Validation

- `npm run lint`
- `npm run test:week4` — 19 tests: authentication, ownership, invalid inputs, first-vote insert, duplicate update, denied writes, private prompts, animal/action forwarding, provider errors, bookmarks, publication, orphan cleanup and New York daily rollover.
- `npm run build -- --webpack` — production compilation and TypeScript.

These are local/mocked checks, not live verification of credentials or deployed RLS. Browser preview was unavailable in this session; visual review remains pending.

### Live acceptance checklist

- Anonymous visitors browse published images; direct anonymous writes fail.
- A signed-in user uploads a real photo, generates an actual miniature animal edit, compares the original, publishes, votes, reloads, bookmarks and downloads.
- User B cannot read User A’s drafts, raw prompts, private votes/profile/bookmarks, or publish User A’s draft.
- Private images are invisible to another user until publication; published original and AI images are visible through the feed.
- One user changing a vote retains one row and changes its value.
- Inspect RLS policies for any additional pre-existing tables; preserved permissive policies may need tightening according to how those tables are used.
- Week 3 Google login, profile editing and avatar upload still work.
- Test actual Gemini quota/timeout responses, storage failures and mobile layout.
- Verify Incognito access and the final commit deployment URL.
