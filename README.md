# ElimuHub

An educational resource marketplace and tutoring platform. Teachers upload
resources, an admin reviews them, students buy them, and tutors take
bookings. Built with React (Vite) + Express, both deployed as a **single
Vercel project** — no separate backend host, no server to keep alive
yourself. Supabase (Postgres + Auth + Storage) is the only other piece.

This repo was generated in a sandbox with no internet access, so nothing
here has been installed, run, or deployed yet — do that from your own
machine using the steps below.

## Why this structure

The Express app now lives at `api-server/app.js` with no `app.listen()`
call baked into it, and `/api/[...all].js` at the repo root exports that
app directly to Vercel. Vercel's Node runtime accepts an Express app as
a request handler as-is — every request to `/api/*` gets routed to that
one serverless function, and Express's own internal routing (the
`resources`, `orders`, `admin` routers etc.) handles the rest, completely
unchanged from before. The React app builds as static files from the same
repo. One `vercel --prod` (or one GitHub-connected project) deploys both.

This is what was slow and hard to host before: a separately-hosted
Express server (e.g. on a free tier that sleeps when idle) is slow on the
first request after a gap and is a second thing to configure, monitor, and
pay for. Serverless functions don't sleep the same way, and there's only
one deployment target now.

## 1. Set up Supabase

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Create **three private/public storage buckets**:
   - `resource-files` (private) — purchased downloadable files.
   - `resource-covers` (public) — marketplace cover images.
   - `platform-assets` (public) — the till QR image shown at checkout.
4. Turn on Row Level Security on every table and add policies (a starting point is commented at the bottom of `schema.sql`).
5. Copy your project URL, anon key, and service role key.

## 2. Local development

```
cp .env.example .env.local     # fill in the Supabase values
npm install
npm run dev:api                # Express, on http://localhost:4000
npm run dev                    # Vite, on http://localhost:5173 — run in a second terminal
```

Vite's dev server proxies `/api/*` to `localhost:4000` (see
`vite.config.js`), so the two feel like one app locally even though
they're two processes — in production they're truly one.

## 3. Deploying — just Vercel

1. Push this repo to GitHub (or any git host Vercel connects to).
2. Import it as a new Vercel project. Framework preset: **Vite** — Vercel
   will detect `/api` automatically and deploy it as a serverless function
   alongside the static build, no extra configuration.
3. Set every variable from `.env.example` in **Vercel → Settings →
   Environment Variables** (both the `VITE_*` ones and the server-only
   ones — Vercel keeps the server-only ones out of the browser bundle
   automatically since they're not prefixed `VITE_`).
4. Deploy. Your app and API are now the same domain — `VITE_API_URL=/api`
   already assumes that, so no URL juggling between environments.
5. If you're moving off a previous Render/Railway/Fly deployment, update
   `DARAJA_CALLBACK_URL`, `DARAJA_C2B_VALIDATION_URL`, and
   `DARAJA_C2B_CONFIRMATION_URL` to point at your new `*.vercel.app`
   domain (or custom domain) and re-run **Admin > Register with
   Safaricom**.

## Payments: three interchangeable providers

Set `PAYMENT_PROVIDER` as an environment variable:

- **`manual` (default)** — no Daraja account needed. Students pay your till/QR directly, submit the M-Pesa transaction code from their confirmation SMS, and an admin verifies it in **Admin > Pending payments** before the order is marked paid. Set your till number and upload the QR under **Admin > Till / QR payment settings** — use the real QR from "My Sticker" in the M-Pesa Business app, not a self-generated one.
- **`dev`** — simulates an instant successful payment, for testing the rest of the app without dealing with real money at all.
- **`mpesa`** — real Daraja STK Push. Requires `DARAJA_*` values and a working Business Admin/Manager login on the M-PESA portal (a Till Operator login isn't the same thing and won't work here). `DARAJA_CALLBACK_URL` must be a publicly reachable HTTPS URL.

You can switch providers at any time without touching the marketplace code — all three implement the same `charge()` interface in `api-server/lib/payments.js`.

### Making the manual flow automatic (C2B)

The `manual` provider above still needs an admin to eyeball each code. To
skip that step entirely:

1. Set `DARAJA_C2B_VALIDATION_URL` and `DARAJA_C2B_CONFIRMATION_URL` as
   environment variables, pointing at your Vercel domain.
2. Go to **Admin > Automatic till payments** and click **Register with
   Safaricom** — Daraja's `registerurl` API call, a one-time action per
   shortcode (or whenever the domain changes).
3. From then on, every payment to your till fires a confirmation to your
   server automatically. If the amount uniquely matches exactly one
   pending order, it's confirmed with no admin step at all. If more than
   one pending order shares that amount (or none do), it shows up under
   **Admin > Unmatched till payments** for a human to pick the right one.

## Fixing the 401 errors

The previous version returned the same generic 401 for three different
situations — not logged in, an expired session, and a missing profile
row — which made them impossible to tell apart or handle gracefully.
That's fixed now:

- The auth middleware (`api-server/middleware/auth.js`) returns a `code`
  field alongside the message: `not_signed_in`, `session_expired`, or
  `forbidden`. A missing profile now returns `404`, not `401` — it isn't
  an authentication problem.
- The frontend API client (`src/lib/api.js`) catches `session_expired`
  specifically, silently refreshes the Supabase session, and retries the
  request once before giving up. Most "random" 401s were an access token
  expiring in the gap between page load and a request on an idle tab —
  this closes that gap without the person noticing.
- CORS now reflects the request origin (`origin: true`) instead of a
  fixed `CLIENT_ORIGIN`, since Vercel preview deployments each get their
  own URL — a fixed origin would have silently broken auth on every
  preview link.

If 401s still show up after this, check that `SUPABASE_SERVICE_ROLE_KEY`
is set correctly in Vercel — a wrong or missing key makes every
`requireAuth` check fail, which looks identical to an expired session
from the outside.

## Appearance, accessibility, and theme

New: **Settings** (linked from the dashboard sidebar, previously missing
entirely) lets each person set:

- **Theme** — dark (default) or light.
- **Accent color** — a few preset swatches; stored as an RGB triplet and
  applied via a CSS variable, so it's a one-line change even in custom
  code, not a design-system rewrite.
- **Text size** — a 0.85×–1.3× scale applied to the root font size.
- **Reduce motion** — disables transitions/animations app-wide.
- **High contrast** — strengthens borders and muted-text contrast in
  either theme.

Preferences apply immediately (before login too, stored in
`localStorage`) and sync to the `user_settings` table once signed in, so
they follow the person across devices. See `src/lib/ThemeContext.jsx` and
`src/styles/index.css` for how the CSS variables are wired — every
existing component already uses Tailwind classes that resolve to these
variables, so nothing else needed to change for theming to reach the
whole app.

## What's implemented

Auth (Supabase), resource upload + moderation workflow (draft → pending
review → approved/changes requested/rejected), file and cover image
upload to Supabase Storage, marketplace browsing, purchase + protected
signed-URL downloads, three interchangeable payment providers (manual
till/QR verification, a dev simulator, and real M-Pesa STK Push), C2B
auto-confirmation for the manual till, teacher balances with a payout
request flow, an admin settlement action, subscription plans with teacher
sign-up, a notification bell, a dedicated analytics page, tutor profiles +
bookings, a learner list, an admin panel (moderation, payment
verification, till/QR and C2B settings, commission rate, plan
management, settlements), and appearance/accessibility settings.

## What's still intentionally out of scope

Card payments (only M-Pesa and manual till/QR are implemented — the same
`PaymentAdapter` interface would take a card processor), automatic
subscription renewal billing, and refund initiation from the UI (the
`refunded` order status and balance adjustment logic exist in the schema
but there's no button wired to it yet).
