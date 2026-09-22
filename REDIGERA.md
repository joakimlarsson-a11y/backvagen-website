# Redigera webbplatsen

Den här guiden är skriven för styrelsen. Du behöver inte kunna programmera.
Allt görs i webbläsaren och webbplatsen uppdateras av sig själv några minuter
efter att du sparat.

## Innan du börjar (engångsgrej)

1. Skaffa ett gratiskonto på [github.com](https://github.com).
2. Be en befintlig styrelsemedlem lägga till dig i projektet
   (**Settings → Collaborators → Add people**).
3. Du får ett mejl med en inbjudan — klicka **Accept**.

## Så fungerar det

Allt innehåll ligger som textfiler. Varje fil har två delar:

```
---
title: Stadgar          ← inställningar (mellan strecken)
date: 2024-03-15
---

Här skriver du brödtexten.   ← själva texten (under strecken)
```

**Rör inte raderna med `---`.** Ändra bara texten efter kolonet, och texten
under det nedre strecket.

## Öppna redigeraren

Gå till projektet på github.com och tryck på punkt-tangenten (`.`) på
tangentbordet. Då öppnas en redigerare direkt i webbläsaren. Till vänster ser
du alla mappar.

> Fungerar det inte? Gå till `github.dev/joakimlarsson-a11y/backvagen-website`
> istället.

## Spara dina ändringar

När du är klar:

1. Klicka på symbolen med de tre grenarna i vänsterkanten (**Source Control**).
2. Skriv en kort rad om vad du ändrat, t.ex. "Ny kassör efter stämman 2026".
3. Klicka **Commit & Push**.

Webbplatsen bygger om sig själv och är uppdaterad efter ungefär en minut.

---

## Vanliga uppgifter

### Byta ut styrelsen efter årsstämman

Mappen `src/content/styrelsen/` innehåller en fil per person.

**Ändra en person:** öppna filen och skriv över namn, husnummer och telefon.

**Lägga till en person:** högerklicka på mappen → **New File** → döp den till
t.ex. `ledamot-anna-svensson.md` och klistra in:

```
---
role: Ledamot
name: Anna Svensson
house: 79C
phone: 0700-000000
order: 8
---
```

`role` måste vara en av: `Ordförande`, `Kassör`, `Sekreterare`, `Ledamot`,
`Suppleant`. `order` styr ordningen på sidan — 1 visas först.

**Ta bort en person:** högerklicka på filen → **Delete**.

### Lägga upp ett nytt dokument (t.ex. ett protokoll)

1. Lägg PDF-filen i mappen `public/pdf/` (dra och släpp den i redigeraren).
   Finns inte mappen, skapa den.
2. Skapa en ny fil i `src/content/dokument/`, t.ex. `protokoll-2026-03.md`:

```
---
title: Protokoll styrelsemöte mars 2026
description: Beslut om asfaltering och nya sopkärl.
date: 2026-03-02
category: Protokoll
file: /pdf/protokoll-2026-03.pdf
---
```

`date` skrivs alltid som `ÅÅÅÅ-MM-DD`. Nyaste dokumentet hamnar överst av sig
självt.

### Lägga till en fråga under Frågor & svar

Skapa en fil i `src/content/faq/`, t.ex. `parkering.md`:

```
---
question: Var får besökare parkera?
category: Övrigt
order: 10
---

Besöksparkering finns vid infarten. Parkering på gångvägar är inte tillåten.
```

`category` måste vara en av: `Sophantering`, `Skötsel & underhåll`,
`Vatten & ledningar`, `Nätverk & el`, `Styrelse & stämma`, `Övrigt`.

### Ändra text på en vanlig sida

Sidorna ligger i `src/pages/`. Filnamnet motsvarar adressen — `kontakt.astro`
blir `/kontakt`. Leta upp texten du vill ändra och skriv över den.

Var försiktig: i de här filerna finns även kod. Ändra bara text som står
mellan `>` och `<`, exempelvis:

```
<p>Den här texten kan du ändra.</p>
```

### Byta ut en bild

1. Lägg den nya bilden i `public/images/`.
2. Leta upp filnamnet på den gamla bilden i texten och byt ut det.

Bilderna som ligger i `public/images/placeholders/` är tillfälliga — se
`public/images/README.md` för vilka av föreningens egna bilder som ska ersätta
dem.

**Beskriv alltid bilden.** Fält som heter `heroImageAlt` läses upp för personer
som använder skärmläsare. Skriv vad som faktiskt syns på bilden.

---

## Om något blir fel

Ingenting går sönder på riktigt — alla tidigare versioner sparas.

- **Sidan ser konstig ut:** troligtvis har en `---`-rad eller ett kolon råkat
  försvinna. Gå till fliken **Commits** på github.com, hitta din ändring och
  klicka **Revert**.
- **Ändringen syns inte:** vänta någon minut till och ladda om sidan med
  Ctrl+F5 (Cmd+Shift+R på Mac).
- **Du är osäker:** fråga hellre än gissa. Ändringar går alltid att ångra.
