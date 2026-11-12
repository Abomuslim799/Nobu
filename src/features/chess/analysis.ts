/**
 * analysis.ts — yurishni baholash (sof, testlanadi): g'alaba ehtimoli, belgi (Best, Good, Inaccuracy, Mistake, Blunder, Miss, Brilliant),
 * aniqlik %, bot kuchi va moslashuvchan reyting.
 */

import { Chess, type Square } from 'chess.js';

import type { Info } from '@/features/chess/engine/engine';

/** Baho (santipiyoda) → g'alaba ehtimoli 0…100 (lichess formulasi). */
export const winPct = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
/** Info (navbatdagi tomon nuqtai nazaridan) → shu tomon uchun g'alaba %. */
export function winOf(i: Pick<Info, 'cp' | 'mate'>): number {
  if (i.mate !== undefined) return i.mate > 0 ? 100 : 0;
  return winPct(i.cp ?? 0);
}

export type Label = 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'miss';
export const LABEL: Record<Label, { sym: string; name: string; color: string }> = {
  brilliant: { sym: '!!', name: 'Brilliant', color: '#1BACA6' },
  great: { sym: '!', name: 'Great move', color: '#5C8BB0' },
  best: { sym: '★', name: 'Best move', color: '#5B9E2E' },
  excellent: { sym: '👍', name: 'Excellent', color: '#6FAA3C' },
  good: { sym: '✓', name: 'Good move', color: '#8AAE6A' },
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

const isRecapture = (fenBefore: string, played: string, prevTo: string | null) => {
  if (!prevTo || played.slice(2, 4) !== prevTo) return false;
  try { return !!new Chess(fenBefore).get(prevTo as Square); } catch { return false; }
};

/**
 * Yurish bahosi. before — yurishdan oldingi pozitsiya (yuruvchi navbatda), after — yurishdan keyingi (raqib navbatda).
 * before.multi bo'lsa (server, MultiPV 3) — o'ynalgan yurish shu qidiruvdagi bahosi bilan solishtiriladi: alohida qidiruvlar
 * orasidagi "shovqin" xato bo'lib chiqmaydi (chess.com usuli). prevBad — raqibning oldingi yurishi xato edi (Miss uchun).
 * drop — yuruvchining g'alaba ehtimoli qancha tushgani.
 */
export function classify(x: { fenBefore: string; played: string; before: Info; after: Info; book?: boolean; prevBad?: boolean; prevTo?: string | null }): { label: Label; drop: number; winBefore: number; winAfter: number } {
  const winBefore = winOf(x.before);
  const alt = x.before.multi?.find((m) => m.move === x.played);
  const winAfter = alt ? winOf(alt) : 100 - winOf(x.after);
  if (x.book) return { label: x.played === x.before.best ? 'best' : 'good', drop: 0, winBefore, winAfter };   // nazariya yurishi — xato emas
  const isBest = x.played === x.before.best || winBefore - winAfter < 0.5;
  const drop = isBest ? 0 : Math.max(0, winBefore - winAfter);   // dvigatel tanlovi — yo'qotish 0
  let label: Label;
  if (isBest) label = 'best';
  else if (drop < 2) label = 'excellent';
  else if (drop < 5) label = 'good';
  else if (x.prevBad !== undefined ? x.prevBad && drop >= 10 && !(drop >= 20 && winAfter < 35) : winBefore >= 70 && winAfter >= 35 && drop >= 10) label = 'miss';   // raqib xatosini jazolamadi
  else if (drop < 10) label = 'inaccuracy';
  else if (drop < 20) label = 'mistake';
  else label = 'blunder';
  if (label === 'best' && winBefore < 92 && winAfter >= 45 && x.after.pv[0]) {
    // Brilliant: eng yaxshi yurish + qurbonlik (raqibning eng yaxshi javobidan keyin material kamaydi)
    try {
      const me = new Chess(x.fenBefore).turn();
      const g = new Chess(x.fenBefore); g.move({ from: x.played.slice(0, 2), to: x.played.slice(2, 4), promotion: x.played[4] });
      const m0 = material(x.fenBefore, me);
      g.move({ from: x.after.pv[0].slice(0, 2), to: x.after.pv[0].slice(2, 4), promotion: x.after.pv[0][4] });
      if (material(g.fen(), me) - m0 <= -2) label = 'brilliant';
    } catch { /* variant noto'g'ri — oddiy best */ }
  }
  // Great: yagona yaxshi yurish — ikkinchi variant ancha yomon (oddiy qaytarib olish emas)
  const m = x.before.multi;
  if (label === 'best' && m && m.length >= 2 && winBefore > 8 && winBefore < 92 && winOf(m[0]) - winOf(m[1]) >= 15 && !isRecapture(x.fenBefore, x.played, x.prevTo ?? null)) label = 'great';
  return { label, drop, winBefore, winAfter };
}

/** O'yin reytingi (taxminiy, aniqlikdan): chess.com namunasi — 77% ≈ 1400, 87% ≈ 1650; yuqorida tezroq o'sadi. */
export function gameRating(acc: number) {
  const r = 1400 + 26.6 * (acc - 77.3) + Math.max(0, acc - 87) ** 2 * 6;
  return Math.round(Math.max(200, Math.min(3000, r)) / 50) * 50;
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
