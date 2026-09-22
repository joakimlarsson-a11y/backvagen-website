# Deploy — Bäckvägens samfällighet

Engångsuppsättning av hostingen. När det är klart uppdateras sajten automatiskt
varje gång någon sparar en ändring.

Webbplatsen är helt statisk: inga servrar, ingen databas, inga hemligheter,
inga miljövariabler. Det enda som behövs är ett bygge och ett filträd.

## Överblick

```
GitHub repo (main)
    │   push
    ▼
Cloudflare Pages build  (pnpm build → dist/)
    │   deploy
    ▼
asabackvag.se   (statisk HTML från Cloudflares nät)
```

## 1. Cloudflare Pages

1. Logga in på https://dash.cloudflare.com
2. **Workers & Pages → Create application → Pages → Connect to Git**
3. Välj repot `joakimlarsson-a11y/backvagen-website`
4. Inställningar:

   | Fält | Värde |
   |---|---|
   | Framework preset | `Astro` |
   | Build command | `pnpm build` |
   | Build output directory | `dist` |
   | Root directory | `/` |
   | Node version | `22` |

5. **Save and Deploy**

Inga miljövariabler och inga bindings behöver konfigureras.

## 2. Anpassad domän

**Custom domains → Set up a custom domain → asabackvag.se**

Ligger domänen redan hos Cloudflare läggs DNS-posten till automatiskt. Annars
följ instruktionerna som visas.

## 3. Klart

Därefter är löpande drift bara detta:

- **Innehåll:** se [REDIGERA.md](./REDIGERA.md)
- **Teknisk uppdatering:** `pnpm install && pnpm build` lokalt, commit + push

Varje push till `main` bygger om och publicerar. Varje pull request får en egen
förhandsvisnings-URL.

## Kostnad

| Tjänst | Tier | Kostnad |
|---|---|---|
| Cloudflare Pages | Free | 0 kr (obegränsad trafik, 500 byggen/mån) |
| GitHub | Free | 0 kr |
| Domän `asabackvag.se` | Befintlig | (era kostnader sedan tidigare) |

## Felsökning

**Bygget misslyckas**
→ Öppna byggloggen i Cloudflare Pages. Nästan alltid ett formatfel i en
markdown-fil — kontrollera att `---`-raderna finns kvar och att datum skrivs
som `ÅÅÅÅ-MM-DD`.

**En ändring syns inte**
→ Kontrollera att bygget är klart (grön bock i Pages) och ladda om med Ctrl+F5.

**Sidan visar 404**
→ Pages serverar `404.html` automatiskt. Kontrollera att adressen är rätt
stavad; sidornas adresser styrs av filnamnen i `src/pages/`.
