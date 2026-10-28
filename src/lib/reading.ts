/**
 * reading.ts — kitob o'qish yordamchilari: Mutolaa'ni ochish, vaqt formati, kun iqtibosi.
 */

import { Linking } from 'react-native';

import type { Quote } from '@/lib/progress';

const MUTOLAA_APP = 'mutolaa://';
const MUTOLAA_STORE = 'https://apps.apple.com/app/id6475738561';

/** Mutolaa ilovasini ochadi. Ilova o'z havolasini qabul qilmasa — App Store sahifasi ("Ochish" tugmasi bor). */
export async function openMutolaa() {
  try {
    await Linking.openURL(MUTOLAA_APP);
  } catch {
    Linking.openURL(MUTOLAA_STORE).catch(() => {});
  }
}

/** 754 soniya → "12:34" */
export function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Har kuni bitta iqtibos: avval sevimlilar orasidan, bo'lmasa hammasidan. Kun ichida o'zgarmaydi. */
export function quoteOfDay(quotes: Quote[], date = new Date()): Quote | undefined {
  const pool = quotes.some((q) => q.fav) ? quotes.filter((q) => q.fav) : quotes;
  if (!pool.length) return undefined;
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return pool[dayNumber % pool.length];
}
