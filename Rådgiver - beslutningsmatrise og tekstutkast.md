# Rådgiver v2 for Altifiber

## 1) Beslutningsmatrise (implementerbar)

### Hovedprinsipper
- Skille mellom `hastighet` (kapasitet) og `stabilitet/ping` (kvalitet på oppkobling).
- Ikke vis pris før adresse/postnummer er sjekket.
- Ikke vis tjenester i resultat som ikke faktisk inngår i valgt pakke.
- Ikke send bruker til løs anbefaling alene; send til `uforpliktende tilbud` med forhåndsvalgt anbefaling.

### Steg A: Behovstype
- Valg 1: `Kun internett`
- Valg 2: `TV + internett`

Dette styrer kun hvilke pakker/tillegg som vises i resultatet, ikke selve hastighetsberegningen.

### Steg B: Dekningssjekk (tidlig)
Input:
- Adresse
- Postnummer

Utfall:
- `Leverbar`: Fortsett rådgiver.
- `Delvis leverbar`: Fortsett, men vis tydelig melding: "Tilgjengelige pakker kan variere på din adresse."
- `Ikke leverbar`: Stopp flyt og vis "Vi kan ikke levere i dag, men du kan melde interesse."

### Steg C: Poeng for kapasitetsbehov (Mbps)

#### C1. Personer i husstanden
- 1 person = 1 poeng
- 2 personer = 2 poeng
- 3-4 personer = 4 poeng
- 5+ personer = 5 poeng

#### C2. Samtidig bruk (peak)
- Sjelden mange på nett samtidig = 0 poeng
- Av og til = 1 poeng
- Ofte = 2 poeng

#### C3. Bruksmønster (flervalg)
- Streaming (HD/4K) = +2 poeng
- Hjemmekontor/videomøter = +1 poeng
- Gaming = +1 poeng
- Smarthus/mange enheter = +1 poeng
- Store nedlastinger/backup = +1 poeng

#### C4. Stabilitet viktig?
- Vanlig = +0 poeng
- Ganske viktig = +0 poeng
- Veldig viktig = +1 poeng

Merk: Stabilitet skal nesten ikke gi utslag i Mbps alene.

### Steg D: Mapping til anbefalt hastighet
`total = C1 + C2 + C3 + C4`

- 0-5 poeng -> `100 Mbps`
- 6-9 poeng -> `500 Mbps`
- 10+ poeng -> `1000 Mbps`

### Steg E: Guardrails (for å unngå logiske feil)
- Hvis `1 person` + ikke streaming + ikke mange samtidige -> maks `500 Mbps`.
- `1000 Mbps` krever minst ett av disse:
  - 5+ personer
  - Ofte mange samtidige
  - Streaming + hjemmekontor + gaming samtidig
- Hvis bruker velger "Veldig viktig stabilitet" uten høyt kapasitetsbehov:
  - behold anbefalt Mbps
  - legg til råd om kablet nett / moderne WiFi-ruter.

## 2) Tekstutkast (copy)

### Intro
- Tittel: `Finn riktig fiberpakke for din adresse`
- Undertittel: `Svar på noen korte spørsmål. Vi sjekker dekning og sender et uforpliktende tilbud med anbefalt pakke.`

### Steg 1: Behovstype
- Spørsmål: `Hva trenger du?`
- Valg A:
  - Tittel: `Kun internett`
  - Beskrivelse: `For deg som streamer og bruker egne TV-tjenester.`
- Valg B:
  - Tittel: `TV + internett`
  - Beskrivelse: `Totalpakke med både TV-innhold og internett.`

### Steg 2: Adresse og postnummer
- Spørsmål: `Hvor ønsker du levering?`
- Hjelpetekst: `Vi sjekker først om vi kan levere på adressen din.`
- Felter:
  - `Adresse`
  - `Postnummer`
- Feilmeldinger:
  - `Oppgi gyldig adresse.`
  - `Postnummer må være 4 siffer.`
  - `Vi fant ikke adressen. Sjekk stavemåte og prøv igjen.`
- Delvis dekning:
  - `Vi kan levere i området ditt, men tilgjengelige pakker kan variere på adressen.`
- Ikke dekning:
  - `Vi kan dessverre ikke levere på denne adressen akkurat nå.`
  - CTA: `Meld interesse`

### Steg 3: Husstand
- Spørsmål: `Hvor mange bruker nettet hjemme?`
- Valg:
  - `1 person`
  - `2 personer`
  - `3-4 personer`
  - `5 eller flere`

### Steg 4: Bruksmønster
- Spørsmål: `Hva bruker dere nettet til?`
- Hjelpetekst: `Velg alt som passer.`
- Valg:
  - `Streaming (film/serier/sport)`
  - `Gaming`
  - `Hjemmekontor/videomøter`
  - `Smarthus og mange enheter`
  - `Store nedlastinger/backup`

### Steg 5: Samtidighet
- Spørsmål: `Hvor ofte er flere på nett samtidig?`
- Valg:
  - `Sjelden`
  - `Av og til`
  - `Ofte`

### Steg 6: Stabilitet
- Spørsmål: `Hvor viktig er stabil linje for deg?`
- Valg:
  - `Vanlig viktig`
  - `Ganske viktig`
  - `Veldig viktig`
- Info under felt:
  - `Tips: Opplevd hakking i spill/video skyldes ofte WiFi eller servere, ikke bare hastighet.`

### Steg 7: Kontakt
- Tittel: `Få et uforpliktende tilbud`
- Undertittel: `Vi sender tilbud med anbefalt pakke for adressen din.`
- Felter:
  - `Navn`
  - `E-post`
  - `Telefon (valgfritt)`
- Samtykke:
  - `Ved innsending samtykker du til at Altifiber kontakter deg om forespørselen.`

### Resultatkort (variant 1: kun internett)
- Tittel: `Foreløpig anbefaling: [HASTIGHET]`
- Brødtekst:
  - `Basert på svarene dine anbefaler vi [HASTIGHET] for stabil bruk i husstanden.`
  - `Endelig tilbud avhenger av hva som er tilgjengelig på adressen din.`
- CTA primær: `Få uforpliktende tilbud`
- CTA sekundær: `Se andre hastigheter`

### Resultatkort (variant 2: TV + internett)
- Tittel: `Foreløpig anbefaling: [PAKKENAVN]`
- Brødtekst:
  - `Basert på svarene dine anbefaler vi [PAKKENAVN] med [HASTIGHET].`
  - `Vi bekrefter innhold og tilgjengelighet i tilbudet for adressen din.`
- CTA primær: `Få uforpliktende tilbud`
- CTA sekundær: `Se andre pakker`

## 3) Innholdsregler for å unngå feilinfo
- Ikke skriv "best pris" eller konkrete priser før dekningssjekk er gjort.
- Ikke nevn Netflix/andre tjenester med mindre det faktisk inngår i valgt pakke.
- Ikke bruk formuleringer som lover at 1000 Mbps løser all hakking i gaming.
- Skriv alltid "foreløpig anbefaling" frem til adressesjekk er bekreftet.

## 4) Konkrete fixes i eksisterende løsning
- Flytt adresse/postnummer fra siste steg til tidlig steg (steg 2).
- Vis speedometer først etter dekningssjekk.
- Behold 3 nivåer (100/500/1000), men bruk guardrails over for å unngå 1000 for "bor alene" uten grunn.
- Oppdater resultattekster til "uforpliktende tilbud" i stedet for ren anbefaling.
- Valider pakke-features mot faktisk produktkatalog før visning.
