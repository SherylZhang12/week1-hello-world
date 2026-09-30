This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Week 3: Auth setup

Use the same Supabase project, GitHub repo, and Vercel project from Week 2.

1. Run `supabase/week3_auth.sql` in the Supabase SQL Editor. It creates the `profiles` table, the `auth.users` signup trigger, per-user access policies, and a private `avatars` Storage bucket. It also adds profiles for existing users.
2. In Google Cloud, create a **Web application** OAuth client. Add your Supabase project's callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and paste the client ID and client secret. Do not put the client secret in the app or GitHub.
3. In Supabase **Authentication → URL Configuration**, allow `http://localhost:3000/auth/callback` and `https://<your-vercel-domain>/auth/callback`. The app's `redirectTo` is exactly `/auth/callback` with no extra query parameters.
4. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in local `.env.local` and Vercel project environment variables. Run `npm install`, then `npm run dev` from this repository directory.
5. Check a fresh Google login: it should create a `profiles` row, open `/profile`, and ask for first and last name. Save names, upload a JPG/PNG/WebP image under 5 MB, and visit `/private`. In an Incognito window, `/private` should redirect to `/login`.
6. Push the commit to the existing GitHub repository. Turn off Vercel deployment protection and submit the **commit-specific Vercel deployment URL** after it is ready.

Images are stored in Supabase Storage; `profiles.avatar_path` holds only the file path.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses system fonts, so builds do not need to download fonts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
