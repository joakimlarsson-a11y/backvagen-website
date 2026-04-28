# Bäckvägens Samfällighetsförening

Website for Bäckvägens Samfällighetsförening (Åsa, Kungsbacka) — a residential association of 47 households.

## What it is

- **Public info site** for prospective buyers and real estate agents
- **Members-only area** for residents (FAQ, documents, board contacts)
- **Admin panel** for the board to manage member access

## Stack

- **Astro 4** — static generation + SSR for protected pages
- **React 18** — interactive islands (auth forms, admin UI)
- **React Aria Components** — accessibility-first UI primitives
- **Vanilla CSS + design tokens** — no CSS framework, just scoped styles
- **Cloudflare Pages + Workers + KV** — hosting and storage
- **Resend** — magic link email delivery
- **Decap CMS** — Git-backed content editing

## Local development

```bash
pnpm install
pnpm dev
```

Opens on `http://localhost:4321`.

## Deployment

Deployed to Cloudflare Pages on push to `main`. Custom domain: `asabackvag.se`.

## Accessibility

Built to **WCAG 2.2 AA** and **EN 301 549 §9**. Verified with axe DevTools, Lighthouse, and keyboard-only testing.
