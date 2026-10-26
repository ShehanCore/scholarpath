# Turn on "Continue with Google"

The app already has the buttons and the return route (`/auth/callback`). Google sign-in starts working once
Google and Supabase know about each other. You need: your Supabase project, and a Google account to own the
Google Cloud project (use the ScholarPath business account, not a personal one).

After a student signs in with Google for the first time, ScholarPath sends them to finish registration
step 1: role, **WhatsApp number (required)**, the WhatsApp updates opt-in (unticked) and the terms. Until
then their account page shows "Finish setting up your account".

## 1. Google Cloud: create the OAuth client

1. Go to https://console.cloud.google.com/ and create a project, e.g. **ScholarPath**.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding):
   - App name: `ScholarPath`; user support email: your support address; logo: `public/assets/icon-v3.png`.
   - App domain: home page `https://scholarpath.lk`, privacy policy `https://scholarpath.lk/privacy`,
     terms `https://scholarpath.lk/privacy` (until there's a separate terms page).
   - Authorised domains: `scholarpath.lk` and `supabase.co`.
   - Audience: **External**. Data access (scopes): only `openid`, `.../auth/userinfo.email` and
     `.../auth/userinfo.profile`. These are non-sensitive, so no Google review is needed beyond branding
     verification.
   - While testing, add your own Google accounts as test users; choose **Publish app** before launch.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**, name `ScholarPath web`.
   - Authorised JavaScript origins: `https://scholarpath.lk` and `http://localhost:3000`.
   - Authorised redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (copy the exact URL from Supabase in step 2 below).
   - Create, then copy the **Client ID** and **Client secret**.

## 2. Supabase: enable the provider

1. Dashboard → **Authentication → Sign In / Providers → Google** → Enable.
2. Paste the Client ID and Client secret. The "Callback URL (for OAuth)" shown here is the redirect URI
   for step 1.3.
3. **Authentication → URL Configuration**: Site URL `https://scholarpath.lk`; Redirect URLs
   `https://scholarpath.lk/auth/callback` and `http://localhost:3000/auth/callback` (and your Vercel
   preview URL if you test there, e.g. `https://*-yourteam.vercel.app/auth/callback`).

Keep the client secret in Supabase only. It never goes in the code, in Vercel's `NEXT_PUBLIC_*` variables,
or in chat.

## 3. Test

1. Open `/login` and choose **Continue with Google**. Pick a test account.
2. You should land on **Finish creating your account**, with your name and email filled in from Google.
   Enter a WhatsApp number, tick the terms box (the WhatsApp updates box stays unticked unless you want
   messages), and continue through steps 2 and 3.
3. `/account` shows your profile and WhatsApp number. Log out and sign in with Google again: you go
   straight to `/account`.

If the button says "Google sign-in isn't available yet", the provider isn't enabled in Supabase. If Google
shows "redirect_uri_mismatch", the redirect URI in step 1.3 doesn't exactly match Supabase's callback URL.
