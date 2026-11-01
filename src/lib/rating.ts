/**
 * rating.ts — FR (Farobiy Reytingi): bilim reytingi, shaxmat formulasi (Elo) bo'yicha.
 *   Har bo'lim o'z reytingiga ega; savolning qiyinligi (D) va natija (0…1, qisman ball ham) bo'yicha o'zgaradi.
 *   Umumiy FR — bo'limlar o'rtachasi; qiyin ishlar ko'p qilingan bo'lim ko'proq ta'sir qiladi (og'irlik — to'plangan ball).
 * Sof funksiyalar: scripts/test_science.ts tekshiradi.
 */

export type Area = 'en' | 'math' | 'geo' | 'phys' | 'brain' | 'chess';
export const AREA_META: Record<Area, { title: string; short: string; icon: string }> = {
  en: { title: 'Ingliz tili', short: 'Ingliz', icon: '🇬🇧' },
  math: { title: 'Matematika', short: 'Matem.', icon: '∫' },
  geo: { title: 'Geometriya', short: 'Geom.', icon: '△' },
  phys: { title: 'Fizika', short: 'Fizika', icon: '⚛' },
  brain: { title: 'Miya', short: 'Miya', icon: '🧠' },
  chess: { title: 'Shaxmat', short: 'Shaxmat', icon: '♟' },
};
export const AREAS: Area[] = ['en', 'math', 'geo', 'phys', 'brain', 'chess'];

export interface AreaR { r: number; n: number; pts: number; last: number }
export type FRState = Record<Area, AreaR>;

export const START: FRState = {
  en: { r: 1400, n: 0, pts: 0, last: 0 },      // B1–B2 dan boshlanadi (CEFR: B1≈1200, B2≈1500)
  math: { r: 1000, n: 0, pts: 0, last: 0 },
  geo: { r: 1000, n: 0, pts: 0, last: 0 },
  phys: { r: 1000, n: 0, pts: 0, last: 0 },
  brain: { r: 1000, n: 0, pts: 0, last: 0 },
  chess: { r: 1000, n: 0, pts: 0, last: 0 },
};

/** Test turi — FR ga ta'sir kuchi. */
export const WEIGHT = { lesson: 0.5, daily: 0.5, weekly: 1, monthly: 1.5, exam: 2 } as const;
export type TestKind = keyof typeof WEIGHT;

/** Qiyinlikka qarab maksimal ball: oson 10, o'rta 20, qiyin 40, juda qiyin 60. */
export const maxPoints = (d: number) => (d < 1000 ? 10 : d < 1300 ? 20 : d < 1600 ? 40 : 60);

const expected = (r: number, d: number) => 1 / (1 + 10 ** ((d - r) / 400));

/** Bitta natija: s — 0…1 (1-urinish 1, 2-urinish 0.5, maslahat 0.3, yechim 0). */
export function update(a: AreaR, d: number, s: number, kind: TestKind, now = Date.now()): AreaR {
  const k = (a.n < 20 ? 40 : 20) * WEIGHT[kind];
  const delta = k * (s - expected(a.r, d));
  return { r: Math.round((a.r + delta) * 10) / 10, n: a.n + 1, pts: a.pts + maxPoints(d) * s, last: now };
}

/** Umumiy FR: yoqilgan bo'limlar o'rtachasi (teng og'irlik — biror bo'lim tushsa, umumiy ham albatta tushadi). */
export function overall(st: FRState, disabled: Area[] = []): number {
  const on = AREAS.filter((a) => !disabled.includes(a));
  return on.length ? Math.round(on.reduce((s, a) => s + st[a].r, 0) / on.length) : 1000;
}

// ── Darajalar (madrasa yo'li) ────────────────────────────────────────────────
export const RANKS = [
  { id: 'tolib', title: 'Tolib', min: 0 },
  { id: 'shogird', title: 'Shogird', min: 1000 },
  { id: 'mutaallim', title: 'Mutaallim', min: 1200 },
  { id: 'mudarris', title: 'Mudarris', min: 1400 },
  { id: 'domla', title: 'Domla', min: 1600 },
  { id: 'alloma', title: 'Alloma', min: 1800 },
  { id: 'muallim', title: 'Muallimi soniy', min: 2000 },
] as const;
export type RankId = (typeof RANKS)[number]['id'];
export const rankOf = (fr: number) => [...RANKS].reverse().find((r) => fr >= r.min)!;
export const nextRank = (id: RankId) => RANKS[RANKS.findIndex((r) => r.id === id) + 1];

// ── XP: faol vaqtdan ─────────────────────────────────────────────────────────
/** Kunlik XP: <5 daq — 0; 5–19 — 1; 20 — 2; keyin har 5 daqiqaga +1 (35 daq = 5 XP). */
export function dayXP(minutes: number) {
  if (minutes < 5) return 0;
  if (minutes < 20) return 1;
  return 2 + Math.floor((minutes - 20) / 5);
}
/** Streak bonusi (bir martalik, shu kunga yetganda): 1→5, 3→10, 7→15, 14→20, 21→25 …; 30-kunda yana +20. */
export function streakBonus(day: number) {
  let b = 0;
  if (day === 1) b += 5;
  if (day === 3) b += 10;
  if (day >= 7 && day % 7 === 0) b += 15 + ((day / 7) - 1) * 5;
  if (day === 30) b += 20;
  return b;
}
export const PRICE = { muz: 30, tiklash: 90 } as const;
export const MUZ_MAX = 2;
