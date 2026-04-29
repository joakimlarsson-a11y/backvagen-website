# Deploy — Bäckvägens samfällighet

Engångsuppsättning av produktionsmiljön. När allt är på plats behöver du bara pusha till `main` för att uppdatera sajten.

## Överblick

```
GitHub repo (main)
    │   push
    ▼
Cloudflare Pages build
    │   deploy
    ▼
asabackvag.se  ──►  Workers SSR  ──►  APP_KV (Cloudflare)
                                 ──►  Resend API  (e-post)
                                 ──►  GitHub API  (Decap CMS)
```

## 1. GitHub-repo

Gå till https://github.com och skapa ett privat repo `duff92/backvagen-website`. Pusha från denna mapp:

```bash
git remote add origin git@github.com:duff92/backvagen-website.git
git push -u origin main
```

Om `duff92` inte är rätt användare, uppdatera:
- `README.md`
- `public/admin/config.yml` → `backend.repo`

## 2. Cloudflare Pages

### 2.1 Skapa projektet

1. Logga in på https://dash.cloudflare.com
2. **Workers & Pages → Create application → Pages → Connect to Git**
3. Välj `backvagen-website` repot
4. Inställningar:
   - Framework preset: `Astro`
   - Build command: `pnpm build`
   - Build output: `dist`
   - Root directory: `/`
   - Node version: `22`

### 2.2 Skapa KV-namespace

I en terminal med Cloudflare-CLI:n inloggad:

```bash
npx wrangler login
npx wrangler kv:namespace create APP_KV
npx wrangler kv:namespace create APP_KV --preview
```

Kopiera `id` och `preview_id` från output och klistra in i `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "APP_KV"
id = "<prod id>"
preview_id = "<preview id>"
```

Commita och pusha.

### 2.3 Binda KV i Pages

**Workers & Pages → backvagen-website → Settings → Bindings → Add KV namespace**

- Variable name: `APP_KV`
- KV namespace: välj det du skapade

Gör samma för **Preview** (använd preview-namespace).

### 2.4 Miljövariabler

**Settings → Environment variables**

| Namn | Production | Preview |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://asabackvag.se` | `https://preview.asabackvag.pages.dev` |
| `EMAIL_FROM` | `Bäckvägens Samfällighet <no-reply@asabackvag.se>` | samma |
| `HASH_SECRET` | Markera som **encrypted**, använd `openssl rand -base64 32` | markerad encrypted, eget värde |
| `RESEND_API_KEY` | Markera som **encrypted** — se steg 3 | (kan lämnas tom i preview) |
| `GITHUB_CLIENT_ID` | Se steg 4 | samma |
| `GITHUB_CLIENT_SECRET` | Markera som **encrypted** — se steg 4 | samma |

### 2.5 Anpassad domän

**Custom domains → Set up a custom domain → asabackvag.se**

Cloudflare lägger till CNAME automatiskt om domänen redan ligger hos dem. Annars följ deras DNS-instruktioner.

## 3. Resend (e-post)

1. Skapa konto på https://resend.com (3 000 gratis mejl/mån räcker vida för 47 hushåll)
2. **Domains → Add Domain → asabackvag.se**
3. Lägg till de SPF + DKIM + MX TXT-poster som Resend anger i din DNS-leverantör
4. Vänta tills Resend markerar domänen som **Verified**
5. **API keys → Create API key** (Full access) → kopiera in i Pages env-var `RESEND_API_KEY`

> **Viktigt:** Innan domänen är verifierad kommer utgående mejl från `no-reply@asabackvag.se` att studsa. Tills dess kan du använda Resends test-avsändare `onboarding@resend.dev` i `EMAIL_FROM`.

## 4. GitHub OAuth App (för Decap CMS)

Detta tillåter styrelsen att logga in på `/admin/` med sina GitHub-konton för att redigera innehåll.

1. GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fyll i:
   - Application name: `Bäckvägens CMS`
   - Homepage URL: `https://asabackvag.se`
   - Authorization callback URL: `https://asabackvag.se/api/cms-auth/callback`
3. Efter skapande: kopiera **Client ID** → Pages env `GITHUB_CLIENT_ID`
4. Klicka **Generate a new client secret** → kopiera → Pages env `GITHUB_CLIENT_SECRET` (markera encrypted)

Lägg till styrelsemedlemmar som collaborators på `duff92/backvagen-website` så de kan push:a från Decap.

## 5. Första admin-kontot (produktion)

När sajten är deployad:

```bash
# Skriv direkt till produktions-KV via wrangler:
npx wrangler kv:key put --binding=APP_KV allowed-users \
  '[{"email":"din@adress.se","role":"admin","addedAt":"2026-01-01T00:00:00.000Z","addedBy":"bootstrap"}]' \
  --remote
```

Sedan:

1. Gå till `https://asabackvag.se/medlem/logga-in`
2. Ange din adress
3. Kontrollera inboxen, klicka länken
4. Nu kan du lägga till fler hushåll via `/admin`

## 6. Lokal CMS-redigering (valfritt)

För att redigera innehåll lokalt utan GitHub-OAuth:

```bash
# Terminal 1:
pnpm dev

# Terminal 2:
pnpm cms:proxy
```

Decap upptäcker `local_backend: true` i `config.yml` och skriver direkt till din lokala filsystem istället för att committa till GitHub. Perfekt för stora innehållsändringar.

Ta bort eller kommentera ut `local_backend: true` innan produktionsdeploy om ni vill förhindra att den används av misstag i deployad kod — den är dock ofarlig eftersom den bara lyssnar efter en lokal server som inte finns i produktion.

## 7. Bild-assets från informationsbrevet

Efter första deploy:

1. Öppna `Informationsbrev 2026.pdf`
2. Extrahera bilderna enligt `public/images/README.md`
3. Ladda upp via CMS:ets media library, **eller** commita filerna direkt i `public/images/`
4. Uppdatera relevanta content-poster med rätt filnamn

## 8. Löpande drift

- **Ny boende:** Logga in på `/admin`, klicka Lägg till, skriv in e-post
- **Innehållsuppdatering:** Logga in på `/admin/`, redigera i Decap, publicera — sajten byggs om på ~1 min
- **Teknisk uppdatering:** `pnpm install && pnpm build` lokalt, commita + push, Pages deployar automatiskt

## 9. Kostnadsöversikt

| Tjänst | Tier | Kostnad |
|---|---|---|
| Cloudflare Pages + Workers | Free | 0 kr (100k requests/dag) |
| Cloudflare KV | Free | 0 kr (1 GB, 100k läsningar/dag) |
| Resend | Free | 0 kr (3 000 mejl/mån) |
| Domän `asabackvag.se` | Befintlig | (era kostnader sedan tidigare) |
| GitHub (privat repo) | Free | 0 kr |

**Tak för gratis-tier:** ~50 000 sidvisningar/dag innan ni behöver betala något. Ni kommer inte i närheten.

## 10. Felsökning

**"Serverkonfiguration saknas" vid inloggning**
→ `HASH_SECRET` är tom i Pages env-vars.

**Magic link går inte fram**
→ `RESEND_API_KEY` saknas eller domänen är inte verifierad i Resend. Kontrollera Resend-dashboardens event-logg.

**`/admin/` säger "Config Errors"**
→ `public/admin/config.yml` har ett syntax-fel. Kör `npx js-yaml public/admin/config.yml` lokalt för att validera.

**GitHub-inloggning i Decap failar**
→ Kontrollera att callback-URL:n i GitHub OAuth App exakt matchar `https://asabackvag.se/api/cms-auth/callback`.

**Sidan bygger men auth fungerar inte**
→ KV-bindingen `APP_KV` är inte kopplad i Pages Settings → Bindings, eller heter något annat än `APP_KV`.
