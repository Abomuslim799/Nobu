/**
 * progress.tsx — foydalanuvchi natijalari: tugatilgan darslar, kunlik faollik,
 * o'yin rekordlari. Telefon xotirasida (AsyncStorage) saqlanadi.
 *
 * React "Context" nima?
 *   Bir xil ma'lumot ko'p ekranga kerak (Bugun, Statistika, Darslar).
 *   Uni har biriga qo'lda uzatish o'rniga, ilovani <ProgressProvider> bilan
 *   o'raymiz — ichidagi istalgan ekran `useProgress()` bilan unga yetadi.
 *
 * Keyin (server bosqichi): shu fayldagi `load`/`save` Railway'dagi API'ga
 * ulanadi, ekranlar esa o'zgarmaydi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { bestStreak, currentStreak, dayKey } from './streak';

// ── 1. Saqlanadigan ma'lumot shakli ─────────────────────────────────────────
export interface LessonResult { day: string; correct: number; total: number }
export interface DayActivity { lessons: number; games: number; cards?: number; xp: number }
/** So'z kartochkasi holati (Leitner tizimi — Nobu'dagidek). */
export interface CardState { box: number; due: number }   // due — ms (Date.now() formati)
export interface CustomWord { id: string; word: string; translation: string; example: string }
export interface GameStats { best: number; plays: number; last: number }

interface Data {
  version: 1;
  lessons: Record<string, LessonResult>;      // lessonId → natija
  days: Record<string, DayActivity>;          // "2026-10-28" → faollik
  games: Record<string, GameStats>;           // gameId → rekordlar
  cards: Record<string, CardState>;           // wordId → quti va keyingi takror vaqti
  myWords: CustomWord[];                      // o'zingiz qo'shgan so'zlar
}

const KEY = 'dojo.progress.v1';
const EMPTY: Data = { version: 1, lessons: {}, days: {}, games: {}, cards: {}, myWords: [] };

// Leitner oraliqlari: quti raqami → keyingi takrorgacha (ms). Bilsangiz quti oshadi.
const MIN = 60_000, DAY = 86_400_000;
export const BOX_INTERVALS = [10 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY];

// ── 2. Context'ning tashqi ko'rinishi ───────────────────────────────────────
interface Progress {
  ready: boolean;
  data: Data;
  streak: number;
  best: number;
  today: DayActivity;
  completeLesson: (id: string, correct: number, total: number) => void;
  recordGame: (id: string, score: number) => void;
  reviewCard: (wordId: string, knew: boolean) => void;
  addWord: (word: Omit<CustomWord, 'id'>) => void;
  removeWord: (id: string) => void;
  reset: () => void;
}

const ProgressContext = createContext<Progress | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);

  // 2a. Ilova ochilganda — bir marta xotiradan o'qiymiz.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setData({ ...EMPTY, ...JSON.parse(raw) }))
      .catch(() => {})                         // buzilgan ma'lumot ilovani yiqitmasin
      .finally(() => setReady(true));
  }, []);

  // 2b. Har o'zgarishda — saqlaymiz. `ready` bo'lmaguncha yozmaymiz,
  //     aks holda bo'sh EMPTY eski ma'lumotning ustiga yozilib ketardi.
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  const bump = (d: Data, field: 'lessons' | 'games' | 'cards', xp: number): Data['days'] => {
    const key = dayKey();
    const day = d.days[key] ?? { lessons: 0, games: 0, xp: 0 };
    return { ...d.days, [key]: { ...day, [field]: (day[field] ?? 0) + 1, xp: day.xp + xp } };
  };

  const reviewCard = useCallback((wordId: string, knew: boolean) => {
    setData((d) => {
      const old = d.cards[wordId] ?? { box: 0, due: 0 };
      const box = knew ? Math.min(old.box + 1, BOX_INTERVALS.length - 1) : 0;
      return {
        ...d,
        cards: { ...d.cards, [wordId]: { box, due: Date.now() + BOX_INTERVALS[box] } },
        days: bump(d, 'cards', knew ? 2 : 1),
      };
    });
  }, []);

  const addWord = useCallback((word: Omit<CustomWord, 'id'>) => {
    setData((d) => ({ ...d, myWords: [...d.myWords, { ...word, id: `my-${Date.now()}` }] }));
  }, []);

  const removeWord = useCallback((id: string) => {
    setData((d) => ({ ...d, myWords: d.myWords.filter((w) => w.id !== id) }));
  }, []);

  const completeLesson = useCallback((id: string, correct: number, total: number) => {
    setData((d) => ({
      ...d,
      lessons: { ...d.lessons, [id]: { day: dayKey(), correct, total } },
      days: bump(d, 'lessons', 10 + correct * 2),
    }));
  }, []);

  const recordGame = useCallback((id: string, score: number) => {
    setData((d) => {
      const g = d.games[id] ?? { best: 0, plays: 0, last: 0 };
      return {
        ...d,
        games: { ...d.games, [id]: { best: Math.max(g.best, score), plays: g.plays + 1, last: score } },
        days: bump(d, 'games', 5 + Math.floor(score / 5)),
      };
    });
  }, []);

  const reset = useCallback(() => setData(EMPTY), []);

  // useMemo — hisob faqat `data` o'zgarganda qayta bajariladi, har chizishda emas.
  const value = useMemo<Progress>(() => {
    const active = new Set(Object.keys(data.days));
    return {
      ready,
      data,
      streak: currentStreak(active),
      best: bestStreak(active),
      today: data.days[dayKey()] ?? { lessons: 0, games: 0, xp: 0 },
      completeLesson,
      recordGame,
      reviewCard,
      addWord,
      removeWord,
      reset,
    };
  }, [data, ready, completeLesson, recordGame, reviewCard, addWord, removeWord, reset]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Progress {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress() faqat <ProgressProvider> ichida ishlaydi');
  return ctx;
}
