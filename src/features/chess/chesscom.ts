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
export interface GameAn { v?: number; src?: 'cloud'; id: string; acc: number; moves: MoveAn[]; opening: string | null; bookOut: number | null; evals: number[] }   // evals — oqlar uchun g'alaba % har pozitsiyada

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

/** chess.com'dan hali bizda yo'q o'yinlar (eng yangisidan). limit — nechta yangi o'yin yetarli. Telefon va bulut (GitHub) ishlatadi. */
export async function fetchNew(user: string, have: Set<string>, limit: number): Promise<ComGame[]> {
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
      if (got.length >= limit) { stop = true; break; }
    }
    if (stop || got.length >= limit) break;
  }
  return got;
}

/** Yangi o'yinlarni yuklash (oxirgi oylardan), mavjudlariga qo'shish. Faqat oddiy shaxmat (chess). */
export async function fetchCom(user: string, want = 30): Promise<{ user: string; games: ComGame[]; added: number }> {
  const cur = await loadCom();
  const same = cur.user.toLowerCase() === user.toLowerCase();
  const got = await fetchNew(user, new Set(same ? cur.games.map((g) => g.id) : []), want);
  const games = [...(same ? cur.games : []), ...got].sort((a, b) => b.at - a.at);
  const out = { user, games };
  await saveCom(out);
  return { ...out, added: got.length };
}

/** Bitta o'yinni tahlil qilish: har pozitsiya bir marta baholanadi (yurishdan oldingisi va keyingisi shulardan olinadi). */
export async function analyseGame(g: ComGame, onPly?: (i: number, n: number) => void, movetime = 450, resume: Info[] = [], onPart?: (info: Info[]) => void, depth = 12): Promise<GameAn> {
  const c = new Chess(), fens = [c.fen()];
  for (const u of g.moves) { c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); fens.push(c.fen()); }
  const info: Info[] = resume.slice(0, fens.length);                // to'xtatilgan joydan davom
  for (let i = info.length; i < fens.length; i++) {
    info.push(await analyse(fens[i], movetime, depth)); onPly?.(i + 1, fens.length);
    if (i % 8 === 7) onPart?.(info);
  }
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

/** Bulut tahlili (GitHub Actions, har soatda, Stockfish 16): tayyor o'yinlar va tahlillarni olib, bizdagilarga qo'shish. */
export const CLOUD_URL = (user: string) => `https://raw.githubusercontent.com/Abomuslim799/Nobu/chess-data/${user.toLowerCase()}.json`;
export async function syncCloud(): Promise<{ added: number; analysed: number; updated: number } | null> {
  const cur = await loadCom();
  let d: { games: ComGame[]; an: Record<string, GameAn>; updated: number };
  try {
    const r = await fetch(`${CLOUD_URL(cur.user)}?t=${Date.now()}`);
    if (!r.ok) return null;
    d = await r.json();
  } catch { return null; }
  const ids = new Set(cur.games.map((g) => g.id));
  const fresh_ = d.games.filter((g) => !ids.has(g.id));
  await saveCom({ user: cur.user, games: [...cur.games, ...fresh_].sort((a, b) => b.at - a.at) });
  const an = await loadAn();
  let k = 0;
  for (const [id, x] of Object.entries(d.an)) if (an[id]?.src !== 'cloud' || (an[id]?.acc !== x.acc)) { an[id] = x; k++; }   // bulut chuqurroq — ustun
  await saveAn(an);
  return { added: fresh_.length, analysed: k, updated: d.updated };
}

/** Bitta o'yinni (qayta) tahlil qilib saqlash. */
export async function reanalyse(g: ComGame, onPly?: (i: number, n: number) => void) {
  const r = await analyseGame(g, onPly);
  const an = await loadAn(); an[g.id] = r; await saveAn(an);
  return r;
}

/** Navbatdagi tahlil qilinmagan o'yinlarni ketma-ket tahlil qilish (to'xtatish mumkin). */
export async function analyseAll(onProgress: (done: number, total: number, ply: number, plies: number) => void, stop: () => boolean) {
  const { games } = await loadCom();
  const an = await loadAn();
  const todo = games.filter((g) => !an[g.id]);
  const PART = `${KEYS.chessComAn}.part`;
  let part: { id: string; info: Info[] } | null = null;
  try { part = JSON.parse((await AsyncStorage.getItem(PART)) ?? 'null'); } catch { part = null; }
  let done = 0;
  for (const g of todo) {
    if (stop()) break;
    const resume = part && part.id === g.id ? part.info : [];
    try {
      an[g.id] = await analyseGame(g, (i, n) => onProgress(done, todo.length, i, n), 450, resume,
        (info) => { AsyncStorage.setItem(PART, JSON.stringify({ id: g.id, info })).catch(() => {}); if (stop()) throw new Error('stop'); });
    } catch { break; }                                    // to'xtatildi — qisman natija saqlangan, keyin shu joydan davom
    await saveAn(an);
    AsyncStorage.removeItem(PART).catch(() => {});
    done++;
    onProgress(done, todo.length, 0, 0);
  }
  return an;
}
