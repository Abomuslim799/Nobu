/**
 * puzzles.ts — masalalar bazasi (lichess, CC0): reytingga yaqin tanlash, mavzular, sprint qiyinligi.
 * Qator: [id, fen, yurishlar (uci), reyting, mavzular]. Birinchi yurish — raqibniki.
 */

import rows from '@content/brain/puzzles.json';

export type Row = [string, string, string, number, string];
export const PUZZLES = rows as unknown as Row[];

export const THEME_UZ: Record<string, string> = {
  fork: 'Vilka', pin: "Bog'lash", skewer: 'Skewer', mateIn1: 'Mat 1 yurishda', mateIn2: 'Mat 2 yurishda', mateIn3: 'Mat 3 yurishda',
  hangingPiece: 'Himoyasiz dona', discoveredAttack: 'Ochiq hujum', backRankMate: 'Oxirgi qatorda mat', sacrifice: 'Qurbonlik',
  deflection: "Chalg'itish", attraction: 'Jalb qilish', trappedPiece: 'Qamalgan dona', promotion: 'Farzinga aylantirish',
  endgame: 'Endshpil', middlegame: "O'rta o'yin", opening: 'Debyut', defensiveMove: 'Himoya yurishi', quietMove: 'Jim yurish',
  doubleCheck: "Qo'sh shax", exposedKing: 'Ochiq qirol', kingsideAttack: 'Qirol qanotiga hujum', intermezzo: 'Oraliq yurish',
  rookEndgame: 'Ruh endshpili', pawnEndgame: 'Piyoda endshpili', advancedPawn: "O'tgan piyoda", discoveredCheck: 'Ochiq shax',
  clearance: "Yo'l ochish", queensideAttack: 'Farzin qanotiga hujum',
};
export const themesUz = (t: string) => t.split(' ').map((x) => THEME_UZ[x]).filter(Boolean).slice(0, 3).join(', ');

/** Mavzular ro'yxati: bazada kamida 15 ta masala bo'lganlari, ko'pidan kamiga. */
export const THEMES: { id: string; name: string; n: number }[] = Object.entries(
  PUZZLES.reduce<Record<string, number>>((m, p) => { for (const t of p[4].split(' ')) if (THEME_UZ[t]) m[t] = (m[t] ?? 0) + 1; return m; }, {}),
).filter(([, n]) => n >= 15).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, name: THEME_UZ[id], n }));

/** Reytingga yaqin, hali ko'rilmagan masala (mavzu bo'yicha ham). */
export function pick(rating: number, seen: string[], theme?: string, rnd = Math.random): Row {
  const base = theme ? PUZZLES.filter((p) => p[4].split(' ').includes(theme)) : PUZZLES;
  for (const spread of [100, 200, 400, 4000]) {
    const pool = base.filter((p) => Math.abs(p[3] - rating) <= spread && !seen.includes(p[0]));
    if (pool.length) return pool[Math.floor(rnd() * pool.length)];
  }
  return base[Math.floor(rnd() * base.length)] ?? PUZZLES[0];
}

/** Sprint: oson boshlanadi va har yechilgan masala bilan qiyinlashadi. */
export const sprintRating = (base: number, solved: number) => Math.max(500, base - 300) + solved * 60;
export const SPRINT_SEC = 180, SPRINT_LIVES = 3;
