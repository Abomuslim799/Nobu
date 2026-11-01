# Farobiy

Shaxsiy o'qish ilovasi (Expo / React Native, iPhone — Expo Go): ingliz tili (filmlar), Science (matematika,
geometriya, fizika — doska va simulyatsiyalar), IT, miya o'yinlari, kutubxona. Natija — **FR** (Farobiy Reytingi),
mehnat — **XP** va streak. **Nobu** — ichidagi shaxsiy yordamchi (tahlil, suhbat), **Ustoz Farobiy** — darslarni o'tadi.

## Tuzilma

```
src/app/            yo'llar (expo-router) — ekran fayllari yupqa: ma'lumotni bo'limdan oladi va ko'rsatadi
  (tabs)/           Bugun · O'rganish · Miya · Kutubxona · Nobu
  english/ science/ it/ brain/ library/ nobu/   ichki ekranlar bo'lim bo'yicha
  test.tsx xp.tsx   kunlik test, XP va streak
src/features/       bo'limlar: mantiq + ekran bo'laklari
  english/          filmlar (unit qadamlari), kartochkalar, mashqlar, AI
  science/          engine (testlangan formulalar), darslar, doska, simulyatsiyalar, talaffuz
  it/ brain/ library/
  assessment/       FR (Elo), darajalar, savol generatorlari, streak
  assistant/        Nobu: suhbat, tahlil, kontekst
src/store/          yagona holat: progress (o'qish) + rating (FR, XP, streak, muz); ochilishda xotira ko'chiriladi
src/core/           umumiy yadro: storage (barcha xotira kalitlari + migratsiya), server (yagona API mijozi),
                    tts, backup, date, elo, hash, config, theme, ui
content/            kontent JSON: english/ (filmlar, 2 801 so'z), science/boards/, brain/puzzles.json
tests/run.ts        mantiq testlari (fizika, dars javoblari, savollar, FR/XP, xotira ko'chirishi)
scripts/            ovoz yasash (edge-tts), say.json eksporti, shaxmat masalalari, kontent tekshiruvi
```

Qatlamlar: `app → store → features → core`. `core/` hech narsani import qilmaydi (faqat o'zini).
Bo'limlar bir-biriga tayanmaydi; istisno — `assessment` (test savollari so'zlardan) va `assistant` (Nobu barcha
bo'limlar natijasini o'qiydi). Telefon xotirasiga faqat `core/storage` orqali (`farobiy.*` kalitlari),
serverga faqat `core/server` → `api()` orqali.

## Ishga tushirish

```
npm install
npx expo start          # iPhone: Expo Go bilan QR kod
npm run typecheck && npm run lint && npm test
```

## Nashr

`main` ga push → GitHub Actions: ovozlar, typecheck, lint, testlar → EAS Update (Expo Go havolasi o'zgarmaydi).
Ovoz fayllari va `say.json` — GitHub Pages (`site.yml`).

## Server

Railway (`Abomuslim799/daily-tracking-` repo, `farobiy_api.py`): AI (Gemini), Ustoz ovozi (TTS), widget holati,
kunlik zaxira. Yo'llar `/api/farobiy/*`, `APP_TOKEN` bilan. Kalitlar faqat serverda.
