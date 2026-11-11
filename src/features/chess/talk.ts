/**
 * talk.ts — Farobiy qachon va nima deydi (sof, testlanadi). Har yurishda emas — faqat o'rinli paytda:
 * debyut tanilganda, nazariyadan chiqilganda, hal qiluvchi xato / kuchli yurishda, o'rta o'yin va endshpil boshlanganda,
 * vaqt kam qolganda; oddiy yurishlarda ba'zan qisqa "Good." / "Fine.". Bot o'yinida — yurish maqsadiga qarab
 * "Going for my knight?" + "You… will… try." kabi kesatiq.
 */

import { Chess, type Move, type Square } from 'chess.js';

import type { Label } from '@/features/chess/analysis';
import type { PhraseKind } from '@/features/chess/bot';

export interface Say { parts: PhraseKind[] }   // bo'laklar ketma-ket: baho + maqsad + oqibat
export interface Mem { said: number; open: boolean; out: boolean; middle: boolean; end: boolean; low: boolean }
export const freshMem = (): Mem => ({ said: -9, open: false, out: false, middle: false, end: false, low: false });

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CENTER = ['d4', 'e4', 'd5', 'e5'];
const uci = (u: string) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
const dist = (a: string, b: string) => Math.max(Math.abs(a.charCodeAt(0) - b.charCodeAt(0)), Math.abs(+a[1] - +b[1]));

export type Intent = 'center' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' | 'check' | 'castle' | 'trade' | 'push' | 'promote';
/** Yurish maqsadi (taxminiy): rokirovka, shax/shohga hujum, qaysi donaga yangi hujum, almashish, markaz, piyoda hujumi. */
export function intentOf(fen: string, u: string, ply: number): Intent | null {
  let g: Chess, m: Move;
  try { g = new Chess(fen); m = g.move(uci(u)); } catch { return null; }
  if (m.promotion) return 'promote';
  if (m.flags.includes('k') || m.flags.includes('q')) return 'castle';
  if (g.inCheck()) return 'check';
  if (m.captured && VAL[m.captured] >= 3 && VAL[m.captured] === VAL[m.piece]) return 'trade';
  const me = m.color, before = new Chess(fen);
  let best: { t: string; v: number } | null = null;
  for (const row of g.board()) for (const p of row) {
    if (!p || p.color === me || VAL[p.type] < 3) continue;
    const now = g.attackers(p.square as Square, me).includes(m.to);
    const was = before.attackers(p.square as Square, me).length > 0;
    if (now && !was && (!best || VAL[p.type] > best.v)) best = { t: p.type, v: VAL[p.type] };
  }
  if (best) return ({ n: 'knight', b: 'bishop', r: 'rook', q: 'queen' } as const)[best.t as 'n'];
  const king = g.board().flat().find((p) => p && p.type === 'k' && p.color !== me);
  if (king && m.piece !== 'p' && m.piece !== 'k' && ply >= 14 && dist(m.to, king.square) <= 2) return 'king';
  if (ply < 16 && CENTER.includes(m.to) && (m.piece === 'p' || m.piece === 'n')) return 'center';
  if (m.piece === 'p' && ply >= 16 && 'abgh'.includes(m.to[0])) return 'push';
  return null;
}

/** Yurishdan keyin raqib tekin oladigan donangiz (n/b/r/q) — "but left your bishop hanging". */
export function hanging(fenAfter: string): 'n' | 'b' | 'r' | 'q' | null {
  let g: Chess;
  try { g = new Chess(fenAfter); } catch { return null; }
  let top: { t: string; gain: number } | null = null;
  for (const m of g.moves({ verbose: true }) as Move[]) {
    if (!m.captured || VAL[m.captured] < 3) continue;
    const t = new Chess(fenAfter); t.move(m);
    const back = t.moves({ verbose: true }).some((r) => r.to === m.to);
    const gain = VAL[m.captured] - (back ? VAL[m.piece] : 0);
    if (gain >= 2 && (!top || gain > top.gain)) top = { t: m.captured, gain };
  }
  return (top?.t as 'n' | 'b' | 'r' | 'q') ?? null;
}

const OPEN: [RegExp, PhraseKind][] = [
  [/^Italian|Giuoco|Two Knights|Evans/, 'open_italian'], [/^Ruy Lopez|Spanish/, 'open_ruy'], [/^Scotch/, 'open_scotch'],
  [/^Sicilian/, 'open_sicilian'], [/^French/, 'open_french'], [/^Caro-Kann/, 'open_caro'], [/^Scandinavian/, 'open_scandi'],
  [/^Pirc|^Modern Defense/, 'open_pirc'], [/^King's Indian/, 'open_kid'], [/^Queen's Gambit|^Slav|^Semi-Slav/, 'open_qg'],
  [/London/, 'open_london'], [/^English/, 'open_english'], [/^Vienna/, 'open_vienna'], [/^King's Gambit/, 'open_kgambit'],
  [/^Petrov|Russian Game/, 'open_petrov'], [/^Philidor/, 'open_philidor'],
];
export const openKind = (name: string): PhraseKind => OPEN.find(([r]) => r.test(name))?.[1] ?? 'open_any';

/** Donalar (piyodasiz) jami qiymati ikkala tomon. */
function pieces(fen: string) {
  let s = 0, q = 0;
  for (const ch of fen.split(' ')[0]) { const t = ch.toLowerCase(); if ('nbrq'.includes(t)) { s += VAL[t]; if (t === 'q') q++; } }
  return { s, q };
}
export function phaseOf(fen: string, ply: number, out: boolean): 'opening' | 'middle' | 'end' {
  const { s, q } = pieces(fen);
  if (s <= 18 || (q === 0 && s <= 26)) return 'end';
  return ply >= 18 || (out && ply >= 12) ? 'middle' : 'opening';
}

export interface Ctx {
  mode: 'bot' | 'review';
  ply: number;                 // shu yurish indeksi (0 dan)
  mine: boolean;
  fenBefore: string;
  fenAfter: string;
  u: string;
  label: Label | null;         // sizning yurishingiz bahosi (raqibniki — review'da)
  leftBook: boolean;           // nazariyadagi pozitsiyada nazariyadan tashqari yurish
  opening: string | null;      // shu paytgacha tanilgan debyut nomi
  time?: number | null;        // qolgan vaqt (s)
  base?: number;               // boshlang'ich vaqt (s)
  rnd: () => number;
}

/** Nima deyish kerak (yoki jim turish). mem shu yerda yangilanadi. */
export function decide(x: Ctx, mem: Mem): Say | null {
  const say = (...parts: PhraseKind[]): Say => { mem.said = x.ply; return { parts }; };
  const gap = x.ply - mem.said;
  if (!x.mine) {                                                       // raqib yurishi (faqat tahlilda)
    if (x.label === 'blunder') return say('oppblunder');
    return events(x, mem, say);
  }
  const it = intentOf(x.fenBefore, x.u, x.ply);
  const r = it ? (`r_${it}` as PhraseKind) : null;
  const bad = x.label === 'blunder' || x.label === 'mistake' || x.label === 'miss';
  if (bad && x.leftBook && !mem.out) { mem.out = true; return say('outbook_bad'); }
  if (x.label === 'miss') return say('miss');
  if (bad) {                                                           // "Mistake. Your plan was the king attack, but defence came first."
    const h = hanging(x.fenAfter);
    const v: PhraseKind = x.label === 'blunder' ? 'v_blunder' : 'v_mistake';
    const attack = it === 'king' || it === 'check' || it === 'push' || it === 'knight' || it === 'bishop' || it === 'rook' || it === 'queen';
    if (r && (h || attack)) return say(v, r, h ? (`hang_${h}` as PhraseKind) : 'e_defence');
    return h ? say(v, `hang_${h}` as PhraseKind) : say(x.label as PhraseKind);
  }
  if (x.label === 'brilliant') return say('brilliant');
  if (x.label === 'best' && !x.leftBook && x.ply >= 10 && gap >= 2 && (it === 'queen' || it === 'rook' || it === 'king' || it === 'check')) return say('v_best', 'e_tactic');
  const ev = events(x, mem, say);
  if (ev) return ev;
  if (x.label === 'inaccuracy' && gap >= 2 && x.rnd() < 0.6) {          // "Careful. You attacked my knight, but left your bishop hanging."
    const h = hanging(x.fenAfter);
    if (r && h) return say('v_careful', r, `hang_${h}` as PhraseKind);
    return say('inaccuracy');
  }
  if (x.mode === 'bot' && it && gap >= 4 && x.rnd() < 0.5) {         // "Going for my knight? Bold. You… will… try."
    const quiet = it === 'castle' || it === 'trade' || it === 'promote' || it === 'check';
    return quiet ? say(`i_${it}` as PhraseKind) : say(`i_${it}` as PhraseKind, 'try');
  }
  if (x.mode === 'review' && (it === 'center' || it === 'castle') && gap >= 3 && x.rnd() < 0.5) return say('v_good', r!);   // "Good move. You took the center."
  if ((x.label === 'best' || x.label === 'good') && gap >= 3 && x.rnd() < 0.25) return say('short');
  return null;
}

/** Bir martalik voqealar: debyut nomi, nazariyadan chiqish, vaqt, o'rta o'yin, endshpil. */
function events(x: Ctx, mem: Mem, say: (...p: PhraseKind[]) => Say): Say | null {
  if (!mem.open && x.opening && x.ply >= 2 && x.ply <= 16) { mem.open = true; return say(openKind(x.opening)); }
  if (x.mine && x.leftBook && !mem.out) { mem.out = true; return say('outbook'); }
  if (x.mine && !mem.low && x.time != null && x.base && x.time < Math.max(20, x.base * 0.12)) { mem.low = true; return say('lowtime'); }
  const ph = phaseOf(x.fenAfter, x.ply, mem.out);
  if (ph === 'end' && !mem.end) { mem.end = true; mem.middle = true; return say('endgame'); }
  if (ph === 'middle' && !mem.middle) { mem.middle = true; return say('middle'); }
  return null;
}

/** Takrorlanadigan tasodif (tahlil har ochilganda bir xil gapirsin). */
export const seeded = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
