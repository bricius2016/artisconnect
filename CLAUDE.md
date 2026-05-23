# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
```

No test suite is configured yet.

## Architecture

**ArtisConnect** is a Next.js 14 App Router platform connecting artisans/service providers with clients in Burkina Faso (Ouagadougou and Bobo-Dioulasso only). Stack: Next.js 14 + TypeScript + Tailwind + Supabase + next-intl v4.

### Routing & i18n

All routes live under `src/app/[locale]/` — every page is locale-prefixed (`/fr/...` or `/en/...`). The default locale is `fr`. Locale validation happens in `src/app/[locale]/layout.tsx`; invalid locales trigger `notFound()`. Translation strings are in `messages/fr.json` and `messages/en.json` and accessed via `next-intl` hooks (`useTranslations`, `getTranslations`).

### Middleware (`src/middleware.ts`)

Runs i18n routing first (via `next-intl`), then checks Supabase session. Protected routes (`/dashboard`, `/profil`, `/messages`, `/candidatures`) redirect unauthenticated users to `/{locale}/auth/login?redirect=...`. Auth routes (`/auth/login`, `/auth/register`) redirect authenticated users to `/{locale}/dashboard`.

### Supabase clients (`src/lib/supabase.ts`)

Two clients must be used correctly:
- `createClient()` — browser client, for Client Components
- `createServerSupabaseClient()` — async, for Server Components and Route Handlers (reads cookies via `next/headers`)

The middleware uses a third inline client (direct `createServerClient`) that reads from `request.cookies` instead of `next/headers`.

### Data model (`src/types/index.ts` + `supabase/migrations/001_initial_schema.sql`)

Core tables and their relationships:
- `profiles` — extends `auth.users`; one per user; roles: `client | prestataire | entreprise | admin`
- `prestataire_profiles` — service provider details; FK to `profiles`; one-to-one
- `entreprise_profiles` — company details; FK to `profiles`; one-to-one
- `metiers` — trade/craft categories (seeded in `supabase/seed/001_metiers.sql`); ~35 entries across 8 categories
- `realisations` — portfolio items for prestataires
- `reviews` — client→prestataire ratings (1–5); triggers auto-update `avg_rating` and `total_reviews` on `prestataire_profiles`
- `appels_offres` — tenders posted by entreprises; triggers auto-update `responses_count`
- `ao_responses` — prestataire candidatures on AOs
- `conversations` + `messages` — direct messaging; trigger updates `last_message_at`
- `notifications` — per-user notification feed

**Account validation flow** for prestataires and entreprises: `pending → step1_done → step2_done → verified` (or `rejected` / `suspended`). Only `verified` profiles are publicly visible (enforced by RLS policies).

All tables have Row Level Security enabled. Public-facing search only surfaces `account_status = 'verified'` prestataires.

### Design tokens (Tailwind)

Custom colors defined in `tailwind.config.ts`:
- `brand` / `brand-dark` / `brand-light` / `brand-pale` — primary orange (`#D4460F`)
- `dark` (`#1C1917`), `mid`, `soft`, `border`, `surface` (`#FAFAF9`), `verified` (green)

Fonts: `font-sans` → Plus Jakarta Sans, `font-display` → Instrument Serif.

### Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
