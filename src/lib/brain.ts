/**
 * brain.ts — Miya bo'limi: o'yinlar natijalari jurnali, moslashuvchan daraja va statistika.
 *   Daraja: natija ≥ 80% — daraja oshadi, < 50% — pasayadi (har o'yinning o'zi uchun).
 *   Shaxmat uchun alohida masala reytingi (Elo kabi) saqlanadi.
 * Telefonda saqlanadi (AsyncStorage).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type BrainSkill = 'speed' | 'attention' | 'memory' | 'working' | 'chess' | 'logic';
export const BRAIN_SKILLS: { id: BrainSkill; title: string; icon: string }[] = [
  { id: 'speed', title: 'Tezlik', icon: '⚡' },
  { id: 'attention', title: 'Diqqat', icon: '🎯' },
  { id: 'memory', title: 'Xotira', icon: '🧠' },
  { id: 'working', title: 'Ishchi xotira', icon: '🔁' },
  { id: 'chess', title: 'Shaxmat', icon: '♟️' },
  { id: 'logic', title: 'Mantiq', icon: '🧩' },
];

export interface BrainEntry { skill: BrainSkill; game: string; at: number; score: number; level: number; mistakes: string[] }

const LOG = 'nobu.brain.log.v1';
const LEVELS = 'nobu.brain.levels.v1';
const CHESS = 'nobu.brain.chess.v1';

async function read<T>(key: string, empty: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : empty;
  } catch {
    return empty;
  }
}

export const getBrainLog = () => read<BrainEntry[]>(LOG, []);

// ── Daraja ──────────────────────────────────────────────────────────────────
export async function getLevel(game: string): Promise<number> {
  return (await read<Record<string, number>>(LEVELS, {}))[game] ?? 1;
}

/** Natijani yozadi va darajani moslaydi. Yangi darajani qaytaradi. */
export async function finishGame(skill: BrainSkill, game: string, score: number, level: number, mistakes: string[] = []) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const log = await getBrainLog();
  log.push({ skill, game, at: Date.now(), score: s, level, mistakes: mistakes.slice(0, 12) });
  await AsyncStorage.setItem(LOG, JSON.stringify(log.slice(-500)));
  const levels = await read<Record<string, number>>(LEVELS, {});
  const next = s >= 80 ? level + 1 : s < 50 ? Math.max(1, level - 1) : level;
  levels[game] = next;
  await AsyncStorage.setItem(LEVELS, JSON.stringify(levels));
  return next;
}

// ── Shaxmat reytingi (masalalar bo'yicha, Elo formulasi) ─────────────────────
export interface ChessState { rating: number; solved: number; failed: number; seen: string[] }
export const getChess = () => read<ChessState>(CHESS, { rating: 1000, solved: 0, failed: 0, seen: [] });

export async function chessResult(puzzleRating: number, ok: boolean, id: string): Promise<ChessState> {
  const st = await getChess();
  const expected = 1 / (1 + 10 ** ((puzzleRating - st.rating) / 400));
  const k = st.solved + st.failed < 30 ? 40 : 20;          // boshida tezroq moslashadi
  const next: ChessState = {
    rating: Math.round(st.rating + k * ((ok ? 1 : 0) - expected)),
    solved: st.solved + (ok ? 1 : 0),
    failed: st.failed + (ok ? 0 : 1),
    seen: [...st.seen, id].slice(-800),
  };
  await AsyncStorage.setItem(CHESS, JSON.stringify(next));
  return next;
}

// ── Statistika ──────────────────────────────────────────────────────────────
export function brainStats(log: BrainEntry[]) {
  return BRAIN_SKILLS.map(({ id }) => {
    const xs = log.filter((e) => e.skill === id);
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0);
    const sc = xs.map((e) => e.score);
    const recent = avg(sc.slice(-5));
    return { skill: id, count: xs.length, avg: avg(sc), recent, trend: sc.length > 5 ? recent - avg(sc.slice(-10, -5)) : 0,
      level: xs.length ? xs[xs.length - 1].level : 0 };
  });
}

/** AI uchun ixcham xulosa. */
export function brainSummary(log: BrainEntry[], chess: ChessState) {
  return {
    chess: { puzzleRating: chess.rating, solved: chess.solved, failed: chess.failed },
    skills: BRAIN_SKILLS.map(({ id }) => {
      const xs = log.filter((e) => e.skill === id).slice(-40);
      const mistakes: Record<string, number> = {};
      xs.forEach((e) => e.mistakes.forEach((m) => { mistakes[m] = (mistakes[m] ?? 0) + 1; }));
      return {
        skill: id,
        games: [...new Set(xs.map((e) => e.game))],
        scores: xs.map((e) => e.score),
        levels: xs.map((e) => e.level),
        mistakes: Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([m, n]) => `${m} (${n}x)`),
      };
    }),
  };
}
