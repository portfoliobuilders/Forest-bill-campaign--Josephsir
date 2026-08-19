# Janashabdam — Civic Campaign Platform

Every later Cursor chat on this repo must read PROJECT.md before writing any code.

## Context you must hold

- Target user: a farmer or resident in highland Kerala, on a low-end Android phone, on patchy 4G, arriving from a WhatsApp forward. Malayalam is their first language.
- The platform does NOT send email on the user's behalf by default. It composes the exact text and hands it off to the user's own mail client, so the objection comes from the citizen's real address.
- The database record is the product. The email send is the user's action.

Build this as a campaign-agnostic engine. A campaign row stays `is_active = false` until a live consultation is named and its deadline is verified from a primary source (Gazette, Niyamasabha bill page, or department circular — not a WhatsApp forward). That source URL belongs in `campaigns.source_url`.

## Stack

- Next.js 15 App Router
- TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres, RLS, security-definer RPCs)
- Zod
- Resend (OTP / receipts / opt-in server send later)
- No UI component library
- No animation library
- Client bundle budget: under 100 KB

Do not introduce Go, PostgreSQL outside Supabase, extra UI kits, or i18n libraries.

## Folder structure

```
forest-bill-campaign/
  PROJECT.md
  .env.example
  .cursor/rules/project.mdc
  src/
    app/
      layout.tsx
      page.tsx
      globals.css
    lib/
      i18n.ts
      supabase/
        server.ts    # service-role client; server-only
        client.ts    # browser client; anon key only
    types/
      database.ts
  supabase/
    migrations/
      0001_init.sql
      0002_representatives.sql
      0003_rls_and_rpc.sql
    seed.sql
```

## Database tables

| Table | Purpose |
|---|---|
| `campaigns` | One consultation window: copy, recipient, deadline, and whether it is live. |
| `objection_clauses` | Short selectable objection points that go into the email (max 220 chars). |
| `submissions` | The product: one citizen's composed objection, status, and consent. |
| `submission_clauses` | Which clauses a submission included, for breakdown queries. |
| `otp_codes` | Hashed email OTP codes used before a draft can count. |
| `rate_limits` | Hourly counters that block abuse by bucket and identifier. |
| `deletion_requests` | DPDP erasure requests, honoured within 30 days. |
| `constituencies` | Assembly / parliamentary areas used to route a CC to the local representative. |
| `representatives` | Current elected officials. Seed only from official post-4-May-2026 sources. Never invent names. |
| `locality_constituency` | Pincode / panchayat → constituency lookup. User must confirm before any CC. |

## Hard rules

- Never hard-code a credential. Everything comes from `process.env`.
- The anon key must never read or write `submissions`, `submission_clauses`, `otp_codes`, `rate_limits`, or `deletion_requests`. Writes go through service-role server code or security-definer RPCs.
- `createServiceClient()` must never be imported from client components.
- Malayalam is the default language. English is a toggle.
- Do not auto-CC a representative the citizen did not see and approve.
- Representative rows must be seeded only from post-4-May-2026 official sources (`niyamasabha.org`, `ceo.kerala.gov.in`). Never invent names, emails, or party affiliations.
- Public counters must describe what they actually measure. Track `handoff_opened` separately from `confirmed_sent`.
- Generated email bodies must stay short enough for Gmail / mailto URLs (clause `email_*` fields are capped at 220 characters).
