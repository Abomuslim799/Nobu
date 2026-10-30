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
import { autoBackup } from './cloudBackup';
import { pushStatus } from './sync';

// ── 1. Saqlanadigan ma'lumot shakli ─────────────────────────────────────────
export interface LessonResult { day: string; correct: number; total: number }
export interface DayActivity { lessons: number; games: number; cards?: number; read?: number; steps?: number; xp: number }   // steps — movie qadamlari   // read — daqiqa
/** So'z kartochkasi holati (Leitner tizimi — Nobu'dagidek). */
export interface CardState { box: number; due: number }   // due — ms (Date.now() formati)
export interface CustomWord { id: string; word: string; translation: string; example: string; image?: string }
export interface GameStats { best: number; plays: number; last: number }

// ── Kutubxona ──
export interface Book {
  id: string; title: string; author: string; lang: 'uz' | 'en' | 'ru';
  pages?: number;            // jami sahifa (bo'lmasa — foizda kuzatiladi)
  progress: number;          // 0..1 — qayergacha o'qildi
  cover?: string;            // muqova surati (telefondagi fayl)
  summary?: string;          // umumiy xulosa (o'zingiz yozasiz)
  finished?: boolean;
  created: number;
}
export interface ReadingSession {
  id: string; bookId: string; day: string; start: number;
  minutes: number; note: string; upto?: string;   // "120-bet" yoki "45%"
}
export interface Quote {
  id: string; text: string; author: string; bookId?: string;
  tags: string[]; fav: boolean; created: number;
}
/** Hozir o'qilayotgan kitob (Mutolaa'ga o'tib ketganda ham vaqt yo'qolmasin). */
export interface ActiveRead { bookId: string; start: number }
export const READ_MIN = 5;           // sessiya hisoblanishi uchun minimal daqiqa

interface Data {
  version: 1;
  lessons: Record<string, LessonResult>;      // lessonId → natija
  days: Record<string, DayActivity>;          // "2026-10-28" → faollik
  games: Record<string, GameStats>;           // gameId → rekordlar
  cards: Record<string, CardState>;           // wordId → quti va keyingi takror vaqti
  myWords: CustomWord[];                      // o'zingiz qo'shgan so'zlar
  books: Book[];
  sessions: ReadingSession[];
  quotes: Quote[];
  activeRead: ActiveRead | null;
  settings: { readGoal: number };             // kunlik o'qish maqsadi (daqiqa)
  unitSteps: Record<string, string[]>;        // unitId → bajarilgan qadamlar
}

const KEY = 'dojo.progress.v1';
const EMPTY: Data = {
  version: 1, lessons: {}, days: {}, games: {}, cards: {}, myWords: [],
  books: [], sessions: [], quotes: [], activeRead: null, settings: { readGoal: 20 }, unitSteps: {},
};
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
  // Kutubxona
  todayRead: number;                                        // bugun o'qilgan daqiqa
  saveBook: (b: Omit<Book, 'id' | 'created' | 'progress'> & Partial<Book>) => string;
  removeBook: (id: string) => void;
  startReading: (bookId: string) => void;
  cancelReading: () => void;
  finishReading: (s: { bookId: string; start: number; minutes: number; note: string; upto?: string; progress?: number }) => void;
  removeSession: (id: string) => void;
  saveQuote: (q: Omit<Quote, 'id' | 'created' | 'fav'> & Partial<Quote>) => void;
  removeQuote: (id: string) => void;
  setReadGoal: (minutes: number) => void;
  completeUnitStep: (unitId: string, step: string, score?: number) => void;
  // Zaxira
  exportJSON: () => string;
  importJSON: (raw: string) => boolean;
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

  const bump = (d: Data, field: 'lessons' | 'games' | 'cards' | 'read' | 'steps', xp: number, amount = 1, key = dayKey()): Data['days'] => {
    const day = d.days[key] ?? { lessons: 0, games: 0, xp: 0 };
    return { ...d.days, [key]: { ...day, [field]: (day[field] ?? 0) + amount, xp: day.xp + xp } };
  };

  // ── Kutubxona ──
  const saveBook = useCallback((b: Omit<Book, 'id' | 'created' | 'progress'> & Partial<Book>) => {
    const id = b.id ?? uid('book');
    setData((d) => {
      const old = d.books.find((x) => x.id === id);
      const book: Book = { progress: 0, created: Date.now(), ...old, ...b, id };
      return { ...d, books: old ? d.books.map((x) => (x.id === id ? book : x)) : [book, ...d.books] };
    });
    return id;
  }, []);

  const removeBook = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      books: d.books.filter((b) => b.id !== id),
      sessions: d.sessions.filter((x) => x.bookId !== id),
      quotes: d.quotes.map((q) => (q.bookId === id ? { ...q, bookId: undefined } : q)),
      activeRead: d.activeRead?.bookId === id ? null : d.activeRead,
    }));
  }, []);

  const startReading = useCallback((bookId: string) => {
    setData((d) => ({ ...d, activeRead: { bookId, start: Date.now() } }));
  }, []);
  const cancelReading = useCallback(() => setData((d) => ({ ...d, activeRead: null })), []);

  const finishReading = useCallback((x: { bookId: string; start: number; minutes: number; note: string; upto?: string; progress?: number }) => {
    setData((d) => {
      const day = dayKey(new Date(x.start));
      const session: ReadingSession = { id: uid('read'), bookId: x.bookId, day, start: x.start,
        minutes: x.minutes, note: x.note, upto: x.upto };
      const counts = x.minutes >= READ_MIN && x.note.trim().length > 0;
      return {
        ...d,
        activeRead: null,
        sessions: [session, ...d.sessions],
        books: d.books.map((b) => (b.id === x.bookId && x.progress !== undefined
          ? { ...b, progress: x.progress, finished: x.progress >= 1 } : b)),
        // 5 daqiqadan kam yoki tahlilsiz — saqlanadi, lekin kunlik maqsadga qo'shilmaydi.
        days: counts ? bump(d, 'read', Math.round(x.minutes / 2), x.minutes, day) : d.days,
      };
    });
  }, []);

  const removeSession = useCallback((id: string) => {
    setData((d) => {
      const x = d.sessions.find((s) => s.id === id);
      const counted = x && x.minutes >= READ_MIN && x.note.trim();
      const day = x && d.days[x.day];
      return {
        ...d,
        sessions: d.sessions.filter((s) => s.id !== id),
        days: counted && day ? { ...d.days, [x.day]: { ...day, read: Math.max(0, (day.read ?? 0) - x.minutes),
          xp: Math.max(0, day.xp - Math.round(x.minutes / 2)) } } : d.days,
      };
    });
  }, []);

  const saveQuote = useCallback((q: Omit<Quote, 'id' | 'created' | 'fav'> & Partial<Quote>) => {
    setData((d) => {
      const id = q.id ?? uid('quote');
      const old = d.quotes.find((x) => x.id === id);
      const quote: Quote = { fav: false, created: Date.now(), ...old, ...q, id };
      return { ...d, quotes: old ? d.quotes.map((x) => (x.id === id ? quote : x)) : [quote, ...d.quotes] };
    });
  }, []);
  const removeQuote = useCallback((id: string) => {
    setData((d) => ({ ...d, quotes: d.quotes.filter((q) => q.id !== id) }));
  }, []);
  const setReadGoal = useCallback((minutes: number) => {
    setData((d) => ({ ...d, settings: { ...d.settings, readGoal: minutes } }));
  }, []);

  // Unit qadami: birinchi marta bajarilganda dars sifatida hisoblanadi (kunlik maqsad).
  const completeUnitStep = useCallback((unitId: string, step: string, score = 0) => {
    setData((d) => {
      const done = d.unitSteps[unitId] ?? [];
      const first = !done.includes(step);
      return {
        ...d,
        unitSteps: first ? { ...d.unitSteps, [unitId]: [...done, step] } : d.unitSteps,
        days: bump({ ...d, days: bump(d, 'lessons', (first ? 8 : 3) + score) }, 'steps', 0),
      };
    });
  }, []);

  // ── Zaxira: butun ma'lumot bitta JSON matnda ──
  const exportJSON = useCallback(() => JSON.stringify(data), [data]);
  const importJSON = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.version !== 1 || typeof parsed.days !== 'object') return false;
      setData({ ...EMPTY, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

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
      todayRead: data.days[dayKey()]?.read ?? 0,
      saveBook, removeBook, startReading, cancelReading, finishReading, removeSession,
      saveQuote, removeQuote, setReadGoal, exportJSON, importJSON, completeUnitStep,
      reset,
    };
  }, [data, ready, completeLesson, recordGame, reviewCard, addWord, removeWord, reset,
      saveBook, removeBook, startReading, cancelReading, finishReading, removeSession,
      saveQuote, removeQuote, setReadGoal, exportJSON, importJSON, completeUnitStep]);

  // Widget uchun: streak o'zgarsa (yoki ilova ochilsa) serverga yuboramiz.
  const todayActive = !!data.days[dayKey()];
  useEffect(() => {
    if (ready) pushStatus({ streak: value.streak, best: value.best, today: todayActive });
  }, [ready, value.streak, value.best, todayActive]);
  useEffect(() => { if (ready) autoBackup(); }, [ready]);   // kuniga bir marta serverga zaxira

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Progress {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress() faqat <ProgressProvider> ichida ishlaydi');
  return ctx;
}
