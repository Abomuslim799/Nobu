/**
 * store.ts — drill holati telefonda (AsyncStorage, KEYS.drill): sessiyalar, mistake bank,
 * AI tasdiqlagan qo'shimcha javoblar. Zaxiraga avtomatik kiradi (farobiy.* kaliti).
 */

import { useCallback, useEffect, useState } from 'react';

import { KEYS, readJSON, writeJSON } from '@/core/storage';
import type { Mistake, SessionResult } from '@/features/english/drill/logic';

export interface DrillData {
  results: SessionResult[];          // oxirgi 600 ta sessiya
  mistakes: Mistake[];
  extra: Record<string, string[]>;   // "topic|uz" → AI "to'g'ri" degan qo'shimcha javoblar
  checks: Record<string, string[]>;  // kun → "Bugun" ro'yxatida qo'lda belgilangan bandlar (oxirgi 14 kun)
}

const EMPTY: DrillData = { results: [], mistakes: [], extra: {}, checks: {} };

export async function loadDrill(): Promise<DrillData> {
  const d = await readJSON<Partial<DrillData>>(KEYS.drill, EMPTY);
  return { results: d.results ?? [], mistakes: d.mistakes ?? [], extra: d.extra ?? {}, checks: d.checks ?? {} };
}

export async function saveDrill(d: DrillData) {
  const days = Object.keys(d.checks ?? {}).sort().slice(-14);
  const checks = Object.fromEntries(days.map((k) => [k, d.checks[k]]));
  await writeJSON(KEYS.drill, { ...d, results: d.results.slice(-600), checks });
}

/** Bandni belgilash / belgini olish (kun bo'yicha). */
export async function toggleCheck(day: string, id: string) {
  const d = await loadDrill();
  const cur = d.checks[day] ?? [];
  d.checks[day] = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  await saveDrill(d);
  return d;
}

/** Ekranlar uchun: ma'lumot + yangilash (ekran fokusga qaytganda reload chaqiriladi). */
export function useDrill() {
  const [data, setData] = useState<DrillData | null>(null);
  const reload = useCallback(() => { loadDrill().then(setData); }, []);
  useEffect(reload, [reload]);
  return { data, reload };
}

export const extraKey = (topic: string, uz: string) => `${topic}|${uz}`;
