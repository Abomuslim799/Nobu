/**
 * bot.ts — Farobiy bot ma'lumotlari: sizning bot reytingingiz va o'yinlar tarixi, tugallanmagan o'yin, xatolardan masalalar.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { KEYS } from '@/core/storage';
import type { Label } from '@/features/chess/analysis';
import type { Row } from '@/features/chess/puzzles';
import phrases from '@content/chess/phrases.json';

export interface GameRec { at: number; result: 'win' | 'loss' | 'draw'; acc: number; botElo: number; rating: number; moves: number; labels: Partial<Record<Label, number>>; opening?: string }
export interface BotState { rating: number; games: GameRec[] }
export interface Saved {
  color: 'w' | 'b'; practice: 'kid' | 'austrian' | null; tc: number; inc: number;   // tc — soniya (0 — cheksiz)
  botElo: number; moves: string[]; labels: (Label | null)[]; drops: (number | null)[]; myTime: number; retries: number; opening?: string;
}

const read = async <T,>(k: string, d: T): Promise<T> => { try { const r = await AsyncStorage.getItem(k); return r ? { ...d, ...JSON.parse(r) } : d; } catch { return d; } };
export const getBot = () => read<BotState>(KEYS.chessBot, { rating: 1000, games: [] });
export const saveBot = (s: BotState) => AsyncStorage.setItem(KEYS.chessBot, JSON.stringify({ ...s, games: s.games.slice(-300) })).catch(() => {});
export async function getSaved(): Promise<Saved | null> { try { const r = await AsyncStorage.getItem(KEYS.chessGame); return r ? JSON.parse(r) : null; } catch { return null; } }
export const saveGame = (g: Saved | null) => (g ? AsyncStorage.setItem(KEYS.chessGame, JSON.stringify(g)) : AsyncStorage.removeItem(KEYS.chessGame)).catch(() => {});

export async function getOwn(): Promise<Row[]> { try { return JSON.parse((await AsyncStorage.getItem(KEYS.chessOwn)) ?? '[]'); } catch { return []; } }
export async function addOwn(rows: Row[]) {
  if (!rows.length) return;
  const cur = await getOwn();
  const ids = new Set(cur.map((r) => r[0]));
  await AsyncStorage.setItem(KEYS.chessOwn, JSON.stringify([...cur, ...rows.filter((r) => !ids.has(r[0]))].slice(-400))).catch(() => {});
}

/** Farobiy gapi: tur bo'yicha tasodifiy; ovoz fayli — chess-<tur><n>.mp3 (CI, Ryan). */
export type PhraseKind = keyof typeof phrases;
export function phrase(kind: PhraseKind, rnd = Math.random): { text: string; file: string } {
  const arr = (phrases as Record<string, string[]>)[kind] ?? [];
  const i = Math.floor(rnd() * arr.length);
  return { text: (arr[i] ?? '').replace(/^~/, '').replace(/\[[^\]]*\]\s*/g, ''), file: `chess-${kind}${i}.mp3` };   // [excited] kabi teglar — faqat ElevenLabs uchun
}
