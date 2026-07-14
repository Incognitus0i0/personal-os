# Personal OS

Asmeninė gyvenimo valdymo sistema — CRM, projektai, tasks, kalendorius,
finansai, fitness, media tracker ir daugiau. React + Vite + Supabase.

## Paleidimas lokaliai

```bash
npm install
npm run dev
```

Atsidaryk http://localhost:5173/personal-os/

## Deploy į GitHub Pages

1. Sukurk GitHub repo pavadinimu `personal-os`
2. Įkelk visus failus į `main` šaką
3. Repo Settings → Pages → Source: **GitHub Actions**
4. Kiekvienas push į `main` automatiškai perbuildina ir deploy'ina

App'sas bus pasiekiamas: `https://TAVO-USERNAME.github.io/personal-os/`

## Telefone (PWA)

Atsidaryk app'so adresą telefono naršyklėje → meniu → **Add to Home Screen**.
App'sas įsidiegs kaip atskira aplikacija su savo ikona.

## Struktūra

- `src/PersonalOS.jsx` — visas UI (moduliai, rodiniai)
- `src/db.js` — Supabase sinchronizacijos sluoksnis (local-first)
- `src/Auth.jsx` — prisijungimo ekranas
- `src/supabase.js` — Supabase klientas
- `migration-2.sql` — DB migracija (paleisti prieš pirmą naudojimą)

## Kaip veikia sinchronizacija

UI atnaujinimai vyksta akimirksniu (local-first), o pakeitimai į Supabase
išsiunčiami po 600ms neaktyvumo. Kitame įrenginyje pakeitimai atsiranda
automatiškai per Realtime. Duomenis mato tik prisijungęs vartotojas (RLS).
