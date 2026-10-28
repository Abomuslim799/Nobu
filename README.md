# Nobu — til, IT va miya mashqlari (telefon ilovasi)

iPhone ilovasi (Expo / React Native). Darslardagi kod misollari — bizning
loyihalarimizdan (Nobu PC va telefon ilovasi), qaysi faylda turgani ko'rsatilgan.

## Ishga tushirish (Windows → iPhone)

1. **Node.js LTS** o'rnating: https://nodejs.org (bir marta).
2. iPhone'ga App Store'dan **Expo Go** ilovasini o'rnating (bepul).
3. Shu papkada terminal oching (papkada o'ng tugma → *Open in Terminal*):
   ```
   npm install
   npx expo start
   ```
4. Ekranda QR kod chiqadi — iPhone **kamerasi** bilan skanerlang → Expo Go'da ochiladi.
   Kompyuter va telefon **bitta Wi-Fi**da bo'lishi kerak.
   Ulanmasa: `npx expo start --tunnel`.

Kodni o'zgartirsangiz — telefonda o'zi yangilanadi (saqlash bilan).

## Tuzilish

```
src/app/                 ← ekranlar (har fayl — bitta sahifa, Expo Router)
  _layout.tsx            ← ilova skeleti: Stack + natijalar (ProgressProvider)
  (tabs)/_layout.tsx     ← pastki 4 ta tab
  (tabs)/index.tsx       ← Bugun: streak, kunlik maqsad, keyingi dars
  (tabs)/learn.tsx       ← Darslar: yo'nalishlar va darslar
  (tabs)/brain.tsx       ← Miya mashqlari
  (tabs)/stats.tsx       ← Statistika
  lesson/[id].tsx        ← interaktiv dars (matn → kod → test → to'ldirish)
  game/[id].tsx          ← Tezkor hisob o'yini
src/data/
  types.ts               ← dars qadamlari turlari (TypeScript 1-darsida misol)
  tracks.ts              ← DARSLAR MAZMUNI — yangi dars shu yerga qo'shiladi
  games.ts               ← mashqlar ro'yxati
src/lib/
  streak.ts              ← kun seriyasi hisobi (TypeScript 2-darsida misol)
  progress.tsx           ← natijalarni telefonda saqlash (AsyncStorage)
  speed-math.ts          ← o'yin uchun misol yasash
src/ui/kit.tsx           ← umumiy tugma, karta, matn, progress chizig'i
src/constants/theme.ts   ← ranglar (Nobu bilan bir xil: qora + yashil)
```

**O'qish tartibi:** `types.ts` → `tracks.ts` → `streak.ts` → `progress.tsx` → `lesson/[id].tsx`.

## Yo'nalishlar

| | Darslar | Misollar manbasi |
|---|---|---|
| 🐍 Python | dataclass, regex, deque, interpolyatsiya | Nobu |
| 🟦 TypeScript | union turlar, streak | shu ilova |
| ☕ Java | dataclass → record | Nobu kodining Java'dagi ko'rinishi (Java loyihamiz hali yo'q) |
| 🗄️ SQL | jadval, INSERT, yumshoq o'chirish | Nobu |
| 🇬🇧 English | ish so'zlari, phrasal verbs | Nobu lug'ati |

## Keyingi bosqichlar

1. Yangi darslar (har yo'nalishga) va qolgan 3 ta miya o'yini
2. Railway server (FastAPI + PostgreSQL): natijalar barcha qurilmalarda, Telegram'dagi
   to-do tracker ilovaga ko'chadi
3. AI ustoz (Gemini) — xatoni tushuntiradi
4. Boshqalar uchun: ro'yxatdan o'tish, App Store (Apple Developer $99/yil)
