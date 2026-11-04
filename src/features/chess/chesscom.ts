/**
 * chesscom.ts — chess.com o'yinlari (ochiq API, login kerak emas) va ularni telefonda tahlil qilish.
 * Boshlanishi — oxirgi 30 o'yin, keyin yangilari qo'shilib boradi; tahlil qilinganlari o'chirilmaydi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chess } from 'chess.js';

import { KEYS } from '@/core/storage';
import { cause, classify, gameAccuracy, type Cause, type Label } from '@/features/chess/analysis';
import { analyse, type Info } from '@/features/chess/engine/engine';
import { bookMoves, openingName } from '@/features/chess/openings';

export interface ComGame {
  id: string; url: string; at: number; color: 'w' | 'b'; result: 'win' | 'loss' | 'draw';
  me: number; opp: number; oppName: string; tc: string; base: number;   // base — boshlang'ich vaqt (s)
  moves: string[]; clocks: (number | null)[];                          // har yurishdan keyingi soat (s)
}
export interface MoveAn { ply: number; label: Label; drop: number; best: string; pv: string[]; cause: Cause; winBefore: number; clock: number | null }
export const AN_V = 2;   // tahlil versiyasi — qoida o'zgarsa eski tahlillar qayta qilinadi
export const fresh = (a?: GameAn) => !!a && (a.v ?? 1) >= AN_V;
export interface GameAn { v?: number; id: string; acc: number; moves: MoveAn[]; opening: string | null; bookOut: number | null; evals: number[] }   // evals — oqlar uchun g'alaba % har pozitsiyada

const API = 'https://api.chess.com/pub/player';
const HEAD = { 'User-Agent': 'Farobiy-learning-app' };

export async function loadCom(): Promise<{ user: string; games: ComGame[] }> {
  try { return { user: 'Abomuslim0', games: [], ...JSON.parse((await AsyncStorage.getItem(KEYS.chessCom)) ?? '{}') }; } catch { return { user: 'Abomuslim0', games: [] }; }
}
export async function loadAn(): Promise<Record<string, GameAn>> {
  try { return JSON.parse((await AsyncStorage.getItem(KEYS.chessComAn)) ?? '{}'); } catch { return {}; }
}
const saveCom = (x: { user: string; games: ComGame[] }) => AsyncStorage.setItem(KEYS.chessCom, JSON.stringify(x)).catch(() => {});
const saveAn = (x: Record<string, GameAn>) => AsyncStorage.setItem(KEYS.chessComAn, JSON.stringify(x)).catch(() => {});

const clk = (s: string) => { const p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };

/** PGN → yurishlar (uci) va soatlar. */
export function parsePgn(pgn: string): { moves: string[]; clocks: (number | null)[] } {
  const g = new Chess();
  g.loadPgn(pgn);
  const moves = g.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''));
  const body = pgn.replace(/^\[.*\]$/gm, '');
  const clocks = [...body.matchAll(/\[%clk ([\d:.]+)\]/g)].map((m) => clk(m[1]));
  return { moves, clocks: moves.map((_, i) => clocks[i] ?? null) };
}

type Raw = { url: string; pgn?: string; end_time: number; time_control: string; rules?: string;
  white: { username: string; rating: number; result: string }; black: { username: string; rating: number; result: string } };

/** Yangi o'yinlarni yuklash (oxirgi oylardan), mavjudlariga qo'shish. Faqat oddiy shaxmat (chess). */
export async function fetchCom(user: string, want = 30): Promise<{ user: string; games: ComGame[]; added: number }> {
  const cur = await loadCom();
  const same = cur.user.toLowerCase() === user.toLowerCase();
  const have = new Set(same ? cur.games.map((g) => g.id) : []);
  const ar = await fetch(`${API}/${user.toLowerCase()}/games/archives`, { headers: HEAD });
  if (!ar.ok) throw new Error(ar.status === 404 ? `chess.com'da "${user}" topilmadi` : `chess.com javob bermadi (${ar.status})`);
  const months: string[] = ((await ar.json()).archives ?? []).slice().reverse();
  const got: ComGame[] = [];
  for (const m of months) {
    const r = await fetch(m, { headers: HEAD });
    if (!r.ok) continue;
    const list: Raw[] = ((await r.json()).games ?? []).slice().reverse();
    let stop = false;
    for (const x of list) {
      if (x.rules && x.rules !== 'chess') continue;
      if (!x.pgn) continue;
      if (have.has(x.url)) { stop = true; break; }
      const white = x.white.username.toLowerCase() === user.toLowerCase();
      const meR = white ? x.white : x.black, opR = white ? x.black : x.white;
      const result = meR.result === 'win' ? 'win' : ['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient'].includes(meR.result) ? 'draw' : 'loss';
      try {
        const { moves, clocks } = parsePgn(x.pgn);
        if (moves.length < 6) continue;
        got.push({ id: x.url, url: x.url, at: x.end_time * 1000, color: white ? 'w' : 'b', result, me: meR.rating, opp: opR.rating, oppName: opR.username,
          tc: x.time_control, base: Number(x.time_control.split('+')[0]) || 0, moves, clocks });
      } catch { /* buzilgan PGN */ }
      if (!same && got.length >= want) { stop = true; break; }
      if (same && have.size + got.length >= cur.games.length + want) { stop = true; break; }
    }
    if (stop || got.length >= want) break;
  }
  const games = [...(same ? cur.games : []), ...got].sort((a, b) => b.at - a.at);
  const out = { user, games };
  await saveCom(out);
  return { ...out, added: got.length };
}

/** Bitta o'yinni tahlil qilish: har pozitsiya bir marta baholanadi (yurishdan oldingisi va keyingisi shulardan olinadi). */
export async function analyseGame(g: ComGame, onPly?: (i: number, n: number) => void, movetime = 450): Promise<GameAn> {
  const c = new Chess(), fens = [c.fen()];
  for (const u of g.moves) { c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); fens.push(c.fen()); }
  const info: Info[] = [];
  for (let i = 0; i < fens.length; i++) { info.push(await analyse(fens[i], movetime, 12)); onPly?.(i + 1, fens.length); }
  const evals = info.map((x, i) => { const w = x.mate !== undefined ? (x.mate > 0 ? 100 : 0) : 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * (x.cp ?? 0))) - 1); return fens[i].split(' ')[1] === 'w' ? w : 100 - w; });
  const moves: MoveAn[] = [];
  let opening: string | null = null, bookOut: number | null = null;
  for (let i = 0; i < g.moves.length; i++) {
    const nm = openingName(fens[i + 1]); if (nm) opening = nm;
    const mine = (g.color === 'w') === (i % 2 === 0);
    if (!mine) continue;
    const inBook = bookMoves(fens[i]).length > 0, played = g.moves[i];
    if (bookOut === null && inBook && !bookMoves(fens[i]).includes(played)) bookOut = Math.floor(i / 2) + 1;
    const k = classify({ fenBefore: fens[i], played, before: info[i], after: info[i + 1], book: bookMoves(fens[i]).includes(played) });
    moves.push({ ply: i, label: k.label, drop: Math.round(k.drop * 10) / 10, best: info[i].best, pv: info[i].pv.slice(0, 6), winBefore: Math.round(k.winBefore),
      clock: g.clocks[i], cause: cause({ fenBefore: fens[i], fenAfter: fens[i + 1], label: k.label, after: info[i + 1], ply: i, inBook, bookMove: bookMoves(fens[i]).includes(played), played, clock: g.clocks[i], base: g.base }) });
  }
  return { v: AN_V, id: g.id, acc: gameAccuracy(moves.map((m) => m.drop)), moves, opening, bookOut, evals: evals.map((e) => Math.round(e)) };
}

/** Navbatdagi tahlil qilinmagan o'yinlarni ketma-ket tahlil qilish (to'xtatish mumkin). */
export async function analyseAll(onProgress: (done: number, total: number, ply: number, plies: number) => void, stop: () => boolean) {
  const { games } = await loadCom();
  const an = await loadAn();
  const todo = games.filter((g) => !fresh(an[g.id]));
  let done = 0;
  for (const g of todo) {
    if (stop()) break;
    an[g.id] = await analyseGame(g, (i, n) => onProgress(done, todo.length, i, n));
    await saveAn(an);
    done++;
    onProgress(done, todo.length, 0, 0);
  }
  return an;
}
