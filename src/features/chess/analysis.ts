/**
 * analysis.ts — yurishni baholash (sof, testlanadi): g'alaba ehtimoli, belgi (Best, Good, Inaccuracy, Mistake, Blunder, Miss, Brilliant),
 * aniqlik %, bot kuchi va moslashuvchan reyting.
 */

import { Chess } from 'chess.js';

import type { Info } from '@/features/chess/engine/engine';

/** Baho (santipiyoda) → g'alaba ehtimoli 0…100 (lichess formulasi). */
export const winPct = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
/** Info (navbatdagi tomon nuqtai nazaridan) → shu tomon uchun g'alaba %. */
export function winOf(i: Pick<Info, 'cp' | 'mate'>): number {
  if (i.mate !== undefined) return i.mate > 0 ? 100 : 0;
  return winPct(i.cp ?? 0);
}

export type Label = 'brilliant' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'miss';
export const LABEL: Record<Label, { sym: string; name: string; color: string }> = {
  brilliant: { sym: '!!', name: 'Brilliant', color: '#1BACA6' },
  best: { sym: '★', name: 'Best move', color: '#5B9E2E' },
  good: { sym: '✓', name: 'Good move', color: '#7FA650' },
  inaccuracy: { sym: '?!', name: 'Inaccuracy', color: '#E6A817' },
  mistake: { sym: '?', name: 'Mistake', color: '#E07B2E' },
  blunder: { sym: '??', name: 'Blunder', color: '#D64545' },
  miss: { sym: '✗', name: 'Miss', color: '#E0573A' },
};
export const BAD: Label[] = ['mistake', 'blunder', 'miss'];

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export function material(fen: string, color: 'w' | 'b') {
  let s = 0;
  for (const row of new Chess(fen).board()) for (const p of row) if (p) s += (p.color === color ? 1 : -1) * VAL[p.type];
  return s;
}

/**
 * Yurish bahosi. before — yurishdan oldingi pozitsiya (yuruvchi navbatda), after — yurishdan keyingi (raqib navbatda).
 * drop — yuruvchining g'alaba ehtimoli qancha tushgani.
 */
export function classify(x: { fenBefore: string; played: string; before: Info; after: Info }): { label: Label; drop: number; winBefore: number; winAfter: number } {
  const winBefore = winOf(x.before);
  const winAfter = 100 - winOf(x.after);
  const isBest = x.played === x.before.best || winBefore - winAfter < 0.5;
  const drop = isBest ? 0 : Math.max(0, winBefore - winAfter);   // dvigatel tanlovi — yo'qotish 0 (chuqurlik farqi shovqini emas)
  let label: Label;
  if (isBest) label = 'best';
  else if (drop < 5) label = 'good';
  else if (winBefore >= 70 && winAfter >= 35 && drop >= 10) label = 'miss';       // yutuq bor edi, ko'rilmadi (lekin yutqazmadi)
  else if (drop < 10) label = 'inaccuracy';
  else if (drop < 20) label = 'mistake';
  else label = 'blunder';
  // Brilliant: eng yaxshi yurish + qurbonlik (raqibning eng yaxshi javobidan keyin material kamaydi), pozitsiya hal qilinmagan edi
  if (label === 'best' && winBefore < 92 && winAfter >= 45 && x.after.pv[0]) {
    try {
      const me = new Chess(x.fenBefore).turn();
      const g = new Chess(x.fenBefore); g.move({ from: x.played.slice(0, 2), to: x.played.slice(2, 4), promotion: x.played[4] });
      const m0 = material(x.fenBefore, me);
      g.move({ from: x.after.pv[0].slice(0, 2), to: x.after.pv[0].slice(2, 4), promotion: x.after.pv[0][4] });
      if (material(g.fen(), me) - m0 <= -2) label = 'brilliant';
    } catch { /* variant noto'g'ri — oddiy best */ }
  }
  return { label, drop, winBefore, winAfter };
}

/** Bitta yurish aniqligi (chess.com uslubidagi formula). */
export const moveAccuracy = (drop: number) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * drop) - 3.1669));
export const gameAccuracy = (drops: number[]) => (drops.length ? Math.round(drops.reduce((s, d) => s + moveAccuracy(d), 0) / drops.length) : 0);

/** Bot kuchi: taxminiy Elo → Stockfish Skill Level va chuqurlik. */
export function botParams(elo: number) {
  const t = Math.max(0, Math.min(1, (elo - 800) / 1400));                    // 800 … 2200
  return { skill: Math.round(t * 16), depth: Math.max(1, Math.round(1 + t * 13)), movetime: Math.round(250 + t * 650) };
}
/** Foydalanuvchidan qancha kuchli o'ynashi (yutish juda qiyin bo'lsin). */
export const BOT_GAP = 275;
/** O'yindan keyin reyting: score 1 / 0.5 / 0. */
export function rateGame(rating: number, games: number, botElo: number, score: number) {
  const exp = 1 / (1 + 10 ** ((botElo - rating) / 400));
  const k = games < 10 ? 40 : 24;
  return Math.round(rating + k * (score - exp));
}

// ── Xato sababi (murabbiy tashxisi uchun) ─────────────────────────────────
export type Cause = 'none' | 'time' | 'opening' | 'threat' | 'tactic' | 'positional';
export const CAUSE: Record<Exclude<Cause, 'none'>, { name: string; icon: string; tip: string }> = {
  threat: { name: "Raqib tahdidini ko'rmadingiz", icon: '👁️', tip: 'Har yurishdan oldin: raqibning shax, olish va tahdidlari (CCT) — 3 soniya tekshiruv.' },
  tactic: { name: "O'z taktikangizni ko'rmadingiz", icon: '⚔️', tip: "Yutuq bo'lgan joyda avval majburiy yurishlarni (shax, olish) hisoblang." },
  time: { name: 'Vaqt tanqisligi', icon: '⏱️', tip: "Debyut va oddiy pozitsiyalarda tezroq; vaqtni hal qiluvchi lahzalarga saqlang." },
  opening: { name: 'Debyutni bilmaslik', icon: '📖', tip: "O'z debyutlaringizning birinchi 8–10 yurishini mashq qiling." },
  positional: { name: "Pozitsiyani noto'g'ri baholash / hisob", icon: '♟️', tip: "Yurishdan oldin reja: qaysi dona yomon turibdi, piyodalar qayerga ko'rsatadi." },
};
/** Yomon yurish sababi (qoidalar bilan, taxminiy). */
export function cause(x: { fenBefore: string; fenAfter: string; label: Label; after: Info; ply: number; inBook: boolean; bookMove: boolean; played: string; clock: number | null; base: number }): Cause {
  if (!BAD.includes(x.label) && x.label !== 'inaccuracy') return 'none';
  if (x.clock !== null && x.base > 0 && x.clock < Math.max(15, x.base * 0.08)) return 'time';
  if (x.ply < 24 && x.inBook && !x.bookMove) return 'opening';   // nazariyadagi pozitsiyada nazariyadan tashqari yurish
  if (x.label === 'miss') return 'tactic';
  try {
    const me = new Chess(x.fenBefore).turn();
    const g = new Chess(x.fenAfter);
    const m0 = material(x.fenAfter, me);
    for (const u of x.after.pv.slice(0, 2)) g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    if (material(g.fen(), me) - m0 <= -2 || g.isCheckmate()) return 'threat';
  } catch { /* variant yo'q */ }
  return 'positional';
}
