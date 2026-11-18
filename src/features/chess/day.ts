/**
 * day.ts — shaxmat kuni: bugun nechta masala yechildi (maqsad 5), kun boshidagi reyting (bugungi o'sish uchun),
 * ketma-ket necha kun mashq qilindi. Bosh sahifadagi girih medalyoni shundan to'ladi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { KEYS } from '@/core/storage';

export const DAY_GOAL = 5;
export interface Day { date: string; n: number; start: number; streak: number; last: string }
const today = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return today(d); };

/** Bugungi holat (yangi kun bo'lsa — hisob noldan, reyting boshi — hozirgi). */
export async function getDay(rating: number): Promise<Day> {
  let d: Day | null = null;
  try { d = JSON.parse((await AsyncStorage.getItem(KEYS.chessDay)) ?? 'null'); } catch { /* yangi */ }
  const t = today();
  if (d && d.date === t) return d;
  const streak = d && (d.last === yesterday() || d.last === t) ? d.streak : 0;
  return { date: t, n: 0, start: rating, streak, last: d?.last ?? '' };
}
/** Masala yechilgandan keyin (to'g'ri yoki xato — urinish hisoblanadi). */
export async function markPuzzle(ratingBefore: number): Promise<Day> {
  const d = await getDay(ratingBefore);
  const t = today();
  const first = d.last !== t;
  const next: Day = { ...d, n: d.n + 1, last: t, streak: first ? d.streak + 1 : d.streak };
  await AsyncStorage.setItem(KEYS.chessDay, JSON.stringify(next)).catch(() => {});
  return next;
}
