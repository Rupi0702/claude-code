# DealMatch

A mobile-first web app prototype connecting **startup founders** with **angel investors** in the DACH region.

Built with **React + Vite + Tailwind CSS**, **Supabase** (Postgres, Auth, Realtime) and **Stripe** for payments. Dark mode, deep-navy + gold, premium-but-minimal feel.

> MVP scope: manual matching only — no recommendation algorithm. The focus is a working core match flow.

## Features

- **Auth** — email/password signup & login. Role (Founder / Investor) is chosen at signup.
- **Founder profile** — company name, one-liner, funding stage (Pre-Seed/Seed), ticket size (25k/50k/100k/200k+), industry.
- **Investor profile** — name, background, investment focus, ticket range, stage preference, verified badge.
- **Match feed** — card-based (no swipe). Free users see **5 profiles/day**; filter by industry & ticket size; one-tap match request. A mutual request becomes an instant match.
- **Conversations** — list of matched connections with a realtime chat per match.
- **Payment** — Stripe Checkout. Investor Premium **99€/month** unlocks unlimited matches + verified badge.

## Tech & structure

```
dealmatch/
├── src/
│   ├── context/AuthContext.jsx   # session + profile state
│   ├── lib/                      # supabase client, constants, matching helpers
│   ├── components/               # AppShell, BottomNav, ProfileCard, …
│   └── pages/                    # Login, Signup, Onboarding, Feed, Matches, Chat, Profile, Premium
└── supabase/
    ├── schema.sql                # tables, RLS policies, triggers, RPCs
    └── functions/                # Stripe create-checkout + webhook (Edge Functions)
```

## Getting started

### 1. Install

```bash
cd dealmatch
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your Supabase URL + anon key and Stripe publishable key / price ID.

### 3. Set up the database

In your Supabase project, open the **SQL editor** and run [`supabase/schema.sql`](supabase/schema.sql). This creates all tables, row-level-security policies, the signup trigger, and the `accept_match_request` RPC.

For the simplest local testing, disable "Confirm email" in **Authentication → Providers → Email** so signups get a session immediately.

### 4. Run

```bash
npm run dev
```

Open the printed URL (e.g. http://localhost:5173). Resize your browser to a phone width — the app is mobile-first and centers a phone-width column on larger screens.

### 5. (Optional) Stripe payments

1. Create a recurring **99€/month** Price in the Stripe dashboard; put its id in `VITE_STRIPE_PREMIUM_PRICE_ID`.
2. Deploy the edge functions and set secrets:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... \
                        STRIPE_WEBHOOK_SECRET=whsec_... \
                        SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. Add the `stripe-webhook` function URL as a webhook endpoint in Stripe, subscribing to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

On a successful subscription the webhook flips `is_premium` (and the verified badge) on the user's profile.

## Trying the match flow

1. Sign up two accounts in two browsers — one **Founder**, one **Investor** — and complete onboarding.
2. As the founder, open **Discover**: you'll see investor cards. Tap **Send match request**.
3. As the investor, open **Matches**: accept the incoming request (or, if you'd already requested the founder, it auto-matches).
4. Open the conversation and chat — messages stream in realtime.

## Notes & limitations (MVP)

- The verified badge is granted automatically with Premium; a manual toggle can be added later.
- The 5/day limit is enforced per viewer via the `feed_views` table; Premium removes the cap.
- No image uploads, push notifications, or matching algorithm — intentionally out of scope.
