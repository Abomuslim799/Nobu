/**
 * store.ts — so'z bazasi holati telefonda (AsyncStorage, KEYS.vocab).
 *   states — o'rganilgan so'zlar (hard/normal/easy), rev — kunlik takrorlar soni,
 *   enabled — yoqilgan bazalar, start — reja boshlangan kun (kvota shu kundan hisoblanadi).
 *   Birinchi ochilishda eski Leitner qutilari (progress.cards) statuslarga o'tkaziladi.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { dayKey } from '@/core/date';
import { KEYS, readJSON, writeJSON } from '@/core/storage';
import { useProgress } from '@/store';
import { ITEMS, myItems, type Item } from '@/features/english/vocab/base';
import { decay, fromBox, grade, learned, newPlan, type ItemState, type Kind, type Status } from '@/features/english/vocab/srs';

export interface VocabData {
  start: string | null;
  states: Record<string, ItemState>;
  enabled: Record<string, boolean>;
  rev: Record<string, Partial<Record<Kind, number>>>;
  migrated: boolean;
}

const EMPTY: VocabData = { start: null, states: {}, enabled: {}, rev: {}, migrated: false };

const dayStart = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

export async function loadVocab(): Promise<VocabData> {
  return { ...EMPTY, ...(await readJSON<Partial<VocabData>>(KEYS.vocab, EMPTY)) };
}

/** Ekranlar uchun: ma'lumot, barcha so'zlar, kunlik reja va amallar. */
export function useVocab() {
  const { data: progress, ready, countCards } = useProgress();
  const [v, setV] = useState<VocabData | null>(null);

  const reload = useCallback(() => { loadVocab().then(setV); }, []);
  useEffect(reload, [reload]);

  // Eski Leitner qutilarini bir marta ko'chirish; start — birinchi ochilgan kun.
  useEffect(() => {
    if (!v || !ready || (v.migrated && v.start)) return;
    const states = { ...v.states };
    for (const [id, c] of Object.entries(progress.cards)) if (!states[id]) states[id] = fromBox(c.box, c.due);
    const next = { ...v, states, migrated: true, start: v.start ?? dayKey() };
    setV(next);
    writeJSON(KEYS.vocab, next);
  }, [v, ready, progress.cards]);

  const items: Item[] = useMemo(() => [...ITEMS, ...myItems(progress.myWords)], [progress.myWords]);

  const save = useCallback((f: (d: VocabData) => VocabData) => {
    setV((d) => {
      if (!d) return d;
      const next = f(d);
      writeJSON(KEYS.vocab, next);
      return next;
    });
  }, []);

  /** Yangi so'z kartasi ko'rildi — o'rganilgan (hard). */
  const learn = useCallback((id: string) => {
    save((d) => (d.states[id] ? d : { ...d, states: { ...d.states, [id]: learned() } }));
    countCards();
  }, [save, countCards]);

  /** Takror: tanlangan status. */
  const answer = useCallback((id: string, kind: Kind, st: Status) => {
    const today = dayKey();
    save((d) => {
      const prev = d.states[id] ?? learned();
      const day = d.rev[today] ?? {};
      return {
        ...d,
        states: { ...d.states, [id]: grade(prev, st) },
        rev: { ...d.rev, [today]: { ...day, [kind]: (day[kind] ?? 0) + 1 } },
      };
    });
    countCards();
  }, [save, countCards]);

  /** Yangi so'z tekshiruvida tanlangan status (takror soniga kirmaydi). */
  const setStatus = useCallback((id: string, st: Status) => {
    save((d) => ({ ...d, states: { ...d.states, [id]: { ...(d.states[id] ?? learned()), st, ...(st === 'easy' ? { easySince: Date.now() } : { easySince: undefined }) } } }));
  }, [save]);

  const setEnabled = useCallback((base: string, on: boolean) => save((d) => ({ ...d, enabled: { ...d.enabled, [base]: on } })), [save]);

  return { v, items, reload, learn, answer, setStatus, setEnabled };
}

/** Bo'lim xulosasi: kunlik yangi reja, bugungi takror, statuslar soni. */
export function summary(v: VocabData, items: Item[], kind: Kind, today = dayKey()) {
  const ids = items.filter((w) => w.kind === kind).map((w) => w.id);
  const startTs = dayStart(v.start ?? today), todayTs = dayStart(today);
  let sinceStart = 0, todayNew = 0;
  const count = { hard: 0, normal: 0, easy: 0 };
  for (const id of ids) {
    const s = v.states[id];
    if (!s) continue;
    count[decay(s).st]++;
    if (s.learnedAt >= startTs) sinceStart++;
    if (s.learnedAt >= todayTs) todayNew++;
  }
  return {
    ids, count, total: ids.length, learned: count.hard + count.normal + count.easy,
    plan: newPlan(kind, v.start ?? today, today, sinceStart, todayNew),
    reviewed: v.rev[today]?.[kind] ?? 0,
  };
}
