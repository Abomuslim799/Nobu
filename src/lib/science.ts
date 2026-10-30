/**
 * science.ts — Science (Matematika, Geometriya, Fizika) natijalari jurnali: har dars tugaganda
 * taxminlar, mashqlar va xatolar yoziladi. Statistika va Nobu tahlili shu yerdan oladi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Area } from '@/science/lessons';

export interface SciEntry { lesson: string; area: Area; title: string; at: number; correct: number; total: number; predicted: number; predictTotal: number; mistakes: string[] }
const KEY = 'nobu.science.v1';

export async function getSciLog(): Promise<SciEntry[]> {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export async function logScience(e: Omit<SciEntry, 'at'>) {
  const log = await getSciLog();
  log.push({ ...e, at: Date.now(), mistakes: e.mistakes.slice(0, 10) });
  await AsyncStorage.setItem(KEY, JSON.stringify(log.slice(-400)));
}

/** AI uchun ixcham xulosa. */
export function sciSummary(log: SciEntry[]) {
  const by: Record<string, SciEntry[]> = {};
  log.forEach((e) => { (by[e.lesson] ??= []).push(e); });
  return Object.values(by).map((xs) => {
    const last = xs[xs.length - 1];
    return {
      area: last.area, lesson: last.title, attempts: xs.length,
      lastScore: last.total ? Math.round((last.correct / last.total) * 100) : null,
      intuition: last.predictTotal ? `${last.predicted}/${last.predictTotal} taxmin to'g'ri` : '',
      mistakes: [...new Set(xs.flatMap((x) => x.mistakes))].slice(-8),
      lastDate: new Date(last.at).toISOString().slice(0, 10),
    };
  });
}
