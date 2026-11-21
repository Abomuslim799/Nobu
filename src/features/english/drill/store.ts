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
}

const EMPTY: DrillData = { results: [], mistakes: [], extra: {} };

export async function loadDrill(): Promise<DrillData> {
  const d = await readJSON<Partial<DrillData>>(KEYS.drill, EMPTY);
  return { results: d.results ?? [], mistakes: d.mistakes ?? [], extra: d.extra ?? {} };
}

export async function saveDrill(d: DrillData) {
  await writeJSON(KEYS.drill, { ...d, results: d.results.slice(-600) });
}

/** Ekranlar uchun: ma'lumot + yangilash (ekran fokusga qaytganda reload chaqiriladi). */
export function useDrill() {
  const [data, setData] = useState<DrillData | null>(null);
  const reload = useCallback(() => { loadDrill().then(setData); }, []);
  useEffect(reload, [reload]);
  return { data, reload };
}

export const extraKey = (topic: string, uz: string) => `${topic}|${uz}`;
