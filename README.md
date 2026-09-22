# Bäckvägens Samfällighetsförening

Webbplats för Bäckvägens Samfällighetsförening (Åsa, Kungsbacka) — 47 hushåll.

**Ska du uppdatera innehåll?** Läs [REDIGERA.md](./REDIGERA.md) — ingen programmering
krävs. **Ska du sätta upp hostingen?** Läs [DEPLOY.md](./DEPLOY.md).

## Vad det är

En helt statisk webbplats. Varje sida byggs i förväg till vanlig HTML och
serveras direkt från Cloudflares nät. Det finns ingen server, ingen databas,
ingen inloggning och inga hemligheter att hålla reda på — allt innehåll är
publikt.

## Teknik

- **Astro 5** — statisk sidgenerering
- **Vanlig CSS med design tokens** — inget CSS-ramverk
- **Markdown-filer** — allt innehåll ligger i `src/content/`
- **Cloudflare Pages** — hosting, bygger om automatiskt vid push till `main`

Webbplatsen skickar **noll JavaScript** till besökaren, bortsett från den lilla
menyknappen i mobilvyn.

## Innehållsstruktur

| Mapp | Visas på |
|---|---|
| `src/content/vad-ingar/` | `/vad-ingar` och undersidor |
| `src/content/faq/` | `/fragor-och-svar` |
| `src/content/dokument/` | `/dokument` |
| `src/content/styrelsen/` | `/styrelsen` |

## Lokal utveckling

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm check    # typkontroll
pnpm build    # bygger till dist/
```

## Tillgänglighet

Byggd mot **WCAG 2.2 AA** och **EN 301 549 §9**.
