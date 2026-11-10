/**
 * review.ts — o'yin tahlili ko'rinishi uchun sof mantiq (testlanadi):
 * ikkala tomon yurishlari bahosi (raqibniki saqlangan evals dan), belgi soni, asosiy lahzalar,
 * har yurishga 1 jumla izoh (qaysi dona osilib qoldi, mat tahdidi, eng yaxshi yurish).
 */

import { Chess, type Move } from 'chess.js';

import { BAD, CAUSE, gameAccuracy, type Label } from '@/features/chess/analysis';
import type { ComGame, GameAn, MoveAn } from '@/features/chess/chesscom';
import { bookMoves } from '@/features/chess/openings';

export type Kind = Label | 'book';
export const BOOK = { sym: '📖', name: 'Book', color: '#A88B5E' };
export const ROWS: Kind[] = ['brilliant', 'best', 'good', 'book', 'inaccuracy', 'mistake', 'miss', 'blunder'];
export const UZ: Record<Kind, string> = {
  brilliant: 'Ajoyib', best: 'Eng yaxshi', good: 'Yaxshi', book: 'Nazariya', inaccuracy: 'Noaniqlik', mistake: 'Xato', miss: "O'tkazib yuborildi", blunder: "Qo'pol xato",
};

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const NAME: Record<string, string> = { p: 'piyoda', n: 'ot', b: 'fil', r: 'ruk', q: 'farzin', k: 'shoh' };
const uci = (u: string) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });

export function fensOf(g: Pick<ComGame, 'moves'>) {
  const c = new Chess(), out = [c.fen()];
  for (const u of g.moves) { c.move(uci(u)); out.push(c.fen()); }
  return out;
}
export const sanOf = (fen: string, u: string) => { try { return new Chess(fen).move(uci(u)).san; } catch { return u; } };
export const lineOf = (fen: string, pv: string[], n = 6) => {
  const g = new Chess(fen), out: string[] = [];
  for (const u of pv.slice(0, n)) { try { out.push(g.move(uci(u)).san); } catch { break; } }
  return out.join(' ');
};

export interface Ply { ply: number; mine: boolean; kind: Kind; drop: number; an?: MoveAn }

/** Har yurish: o'zingizniki — saqlangan tahlildan, raqibniki — evals (oqlar g'alaba %) dan. */
export function plies(g: ComGame, a: GameAn, fens: string[]): Ply[] {
  const my = new Map(a.moves.map((m) => [m.ply, m]));
  return g.moves.map((u, i) => {
    const mine = (g.color === 'w') === (i % 2 === 0);
    const book = bookMoves(fens[i]).includes(u);
    const m = my.get(i);
    if (mine && m) return { ply: i, mine, kind: book && m.drop < 5 ? 'book' : m.label, drop: m.drop, an: m };
    const w = i % 2 === 0;
    const e0 = a.evals[i] ?? 50, e1 = a.evals[i + 1] ?? e0;
    const before = w ? e0 : 100 - e0, after = w ? e1 : 100 - e1;
    const drop = Math.max(0, before - after);
    let kind: Kind;
    if (book) kind = 'book';
    else if (drop < 1) kind = 'best';
    else if (drop < 5) kind = 'good';
    else if (before >= 70 && after >= 35 && drop >= 10) kind = 'miss';
    else if (drop < 10) kind = 'inaccuracy';
    else if (drop < 20) kind = 'mistake';
    else kind = 'blunder';
    return { ply: i, mine, kind, drop: Math.round(drop * 10) / 10 };
  });
}

export function summary(ps: Ply[]) {
  const side = (mine: boolean) => {
    const xs = ps.filter((p) => p.mine === mine);
    const n = Object.fromEntries(ROWS.map((k) => [k, 0])) as Record<Kind, number>;
    xs.forEach((p) => { n[p.kind]++; });
    return { acc: gameAccuracy(xs.map((p) => (p.kind === 'book' ? 0 : p.drop))), n };
  };
  return { me: side(true), opp: side(false) };
}

/** 3–5 ta hal qiluvchi lahza: o'zingizning eng katta yo'qotishlaringiz + raqibning jazolanmagan qo'pol xatolari. */
export function keyMoments(ps: Ply[], max = 5): Ply[] {
  const mine = ps.filter((p) => p.mine && p.drop >= 8 && BAD.includes(p.kind as Label));
  const opp = ps.filter((p) => !p.mine && p.kind === 'blunder');
  return [...mine.sort((x, y) => y.drop - x.drop).slice(0, 4), ...opp.sort((x, y) => y.drop - x.drop).slice(0, 1)]
    .slice(0, max).sort((x, y) => x.ply - y.ply);
}

/** Navbatdagi tomon uchun eng foydali "tekin" olish: osilgan dona (himoyasiz yoki arzonroq dona bilan olinadi). */
export function bestGrab(fen: string): { san: string; piece: string; gain: number } | null {
  let g: Chess;
  try { g = new Chess(fen); } catch { return null; }
  let top: { san: string; piece: string; gain: number } | null = null;
  for (const m of g.moves({ verbose: true }) as Move[]) {
    if (!m.captured) continue;
    const t = new Chess(fen); t.move(m);
    const back = t.moves({ verbose: true }).some((r) => r.to === m.to);
    const gain = VAL[m.captured] - (back ? VAL[m.piece] : 0);
    if (gain >= 2 && (!top || gain > top.gain)) top = { san: m.san, piece: NAME[m.captured], gain };
  }
  return top;
}
/** Navbatdagi tomonda bir yurishda mat bormi. */
export function mateIn1(fen: string): string | null {
  try {
    const g = new Chess(fen);
    for (const m of g.moves({ verbose: true }) as Move[]) { const t = new Chess(fen); t.move(m); if (t.isCheckmate()) return m.san; }
  } catch { /* noto'g'ri fen */ }
  return null;
}

/** Yurishga 1–2 jumla izoh (murabbiy pufagi). */
export function explain(p: Ply, fens: string[], moves: string[]): string {
  const before = fens[p.ply], after = fens[p.ply + 1];
  const played = sanOf(before, moves[p.ply]);
  if (!p.mine) {
    if (p.kind === 'blunder' || p.kind === 'mistake') {
      const mt = mateIn1(after);
      if (mt) return `Raqib ${played} — qo'pol xato: ${mt} bilan mat qilasiz!`;
      const gr = bestGrab(after);
      return gr ? `Raqib ${played} bilan ${gr.piece}ni himoyasiz qoldirdi — ${gr.san}!` : `Raqib ${played} — xato. Imkoniyatni qidiring.`;
    }
    if (p.kind === 'book') return `Raqib: ${played} — nazariya.`;
    return `Raqib yurishi: ${played}.`;
  }
  const m = p.an;
  const best = m ? sanOf(before, m.best) : '';
  const same = m && m.best === moves[p.ply];
  switch (p.kind) {
    case 'book': return `${played} — nazariya yurishi.`;
    case 'brilliant': return `${played} — ajoyib qurbonlik, eng kuchli yurish!`;
    case 'best': return `${played} — eng yaxshi yurish.`;
    case 'good': return same || !best ? `${played} — yaxshi yurish.` : `${played} — yaxshi. Eng kuchlisi ${best} edi.`;
    case 'inaccuracy': return `${played} — noaniqlik. Yaxshiroq: ${best}.`;
    case 'miss': {
      const gr = bestGrab(before), mt = mateIn1(before);
      return mt ? `Mat bor edi: ${mt}! ${played} uni o'tkazib yubordi.` : gr && gr.san === best ? `${best} bilan ${gr.piece} yutar edingiz — o'tkazib yuborildi.` : `${played} — yutuq imkoniyati o'tkazib yuborildi: ${best} kuchli edi.`;
    }
    default: {   // mistake, blunder
      const mt = mateIn1(after), gr = bestGrab(after);
      const why = mt ? `raqib ${mt} bilan mat qiladi` : gr ? `${gr.piece} osilib qoldi (${gr.san})` : m && m.cause !== 'none' ? CAUSE[m.cause].name.toLowerCase() : 'pozitsiya yomonlashdi';
      return `${played} — ${p.kind === 'blunder' ? "qo'pol xato" : 'xato'}: ${why}. Yaxshisi: ${best}.`;
    }
  }
}

/** G'alaba % (oqlar) → piyoda birligidagi baho matni (+1.4, M). */
export function evalText(w: number): string {
  if (w >= 99.5) return 'M';
  if (w <= 0.5) return '-M';
  const x = -Math.log(100 / w - 1) / 0.00368208 / 100;
  return `${x >= 0 ? '+' : ''}${Math.abs(x) >= 10 ? x.toFixed(0) : x.toFixed(1)}`;
}
