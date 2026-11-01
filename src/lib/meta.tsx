/**
 * meta.tsx — Nobu tizimi: FR (Farobiy Reytingi), daraja, faol vaqt → XP, streak, muz.
 *
 *  • FR — bilim (testlar, darslar, miya o'yinlari, shaxmat). Pul/XP bilan sotib olinmaydi.
 *  • XP — mehnat: faqat FAOL vaqtdan (ekranga tegilmasa 60 s dan keyin to'xtaydi).
 *    Kunlik: <5 daq 0, 5–19 daq 1, 20 daq 2, keyin har 5 daqiqa +1. Streak milestone bonuslari.
 *  • Streak kuni — kamida 5 daqiqa faol vaqt. O'tkazib yuborilgan kun muz bilan saqlanadi (⏸ → ❄️ → 0).
 *  • Muz — 30 XP (ko'pi bilan 2 ta), tiklash — 90 XP (48 soat ichida).
 * Telefon xotirasida: nobu.meta.v1 (bulutli zaxiraga avtomatik kiradi).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { getChess } from './brain';
import { useProgress } from './progress';
import {
  AREAS, MUZ_MAX, PRICE, START, dayXP, overall, rankOf, streakBonus, update,
  type Area, type FRState, type RankId, type TestKind,
} from './rating';
import type { Q } from './questions';
import { bestStreak, currentStreak, dayKey, lastDays } from './streak';
import { pushStatus } from './sync';

export interface TestLog { at: number; day: string; kind: TestKind | 'practice'; n: number; ok: number; sec: number; before: number; after: number; by: Partial<Record<Area, { ok: number; n: number; d: number }>> }
interface MetaData {
  v: 1;
  fr: FRState;
  hist: Record<string, number>;        // kun → umumiy FR (kun oxiridagi)
  title: RankId;                       // daraja nomi — faqat imtihon bilan o'zgaradi
  sec: Record<string, number>;         // kun → faol soniyalar
  frozen: string[];                    // muz bilan saqlangan kunlar
  muz: number;
  spent: number;                       // sarflangan XP
  bonus: Record<string, number>;       // kun → streak bonusi (bir marta)
  seen: Record<string, number>;        // savol kaliti → oxirgi berilgan vaqt
  tests: TestLog[];
  cutover: string;                     // shu kundan oldingi kunlar eski tizim bo'yicha (har qanday faollik) hisoblanadi
  checked: string;                     // muz qaysi kungacha tekshirilgan
  disabled: Area[];
}
const KEY = 'nobu.meta.v1';
const fresh = (): MetaData => ({
  v: 1, fr: START, hist: {}, title: 'shogird', sec: {}, frozen: [], muz: MUZ_MAX, spent: 0, bonus: {}, seen: {}, tests: [],
  cutover: dayKey(), checked: addDays(dayKey(), -1), disabled: [],
});
function addDays(key: string, delta: number) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}
export const STREAK_SEC = 300;

// ── Faol vaqt: ildizdagi View har teginishda markActive() chaqiradi ──────────
let lastActive = Date.now();
export const markActive = () => { lastActive = Date.now(); };
// Brauzerda (kompyuter) — sichqoncha, klaviatura va g'ildirak ham faollik
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown', 'wheel']) document.addEventListener(ev, markActive, { passive: true, capture: true });
}
const IDLE_MS = 60_000, TICK_MS = 10_000;

export type DayMark = 'ok' | 'frozen' | 'none';
export interface TestItem { q: Q; s: number }      // s: 0…1 (1-urinish 1, 2-urinish 0.5, maslahat 0.3)

interface Meta {
  ready: boolean;
  m: MetaData;
  fr: number;                          // umumiy FR
  rank: { id: RankId; title: string };
  frRank: ReturnType<typeof rankOf>;   // FR bo'yicha (imtihon ochilishi uchun)
  week: number;                        // 7 kunlik o'zgarish
  peak: number;
  streak: number; best: number;
  todaySec: number; todayXP: number; xp: number; totalSec: number;
  mark: (day: string) => DayMark;
  widget: 'ok' | 'pending' | 'pause' | 'ice' | 'zero';
  dailyDone: TestLog | undefined;
  canRestore: string[];                // tiklanadigan kunlar (bo'sh — kerak emas)
  recordTest: (kind: TestKind | 'practice', items: TestItem[], sec: number) => TestLog;
  recordBrain: (level: number, score: number) => void;
  syncChess: () => void;
  buyMuz: () => boolean;
  restore: () => boolean;
}
const Ctx = createContext<Meta | null>(null);

export function MetaProvider({ children }: { children: ReactNode }) {
  const { data, ready: pReady } = useProgress();
  const [m, setM] = useState<MetaData>(fresh);
  const [ready, setReady] = useState(false);
  const ref = useRef(m);
  ref.current = m;
  const [today, setToday] = useState(dayKey());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) { const x = { ...fresh(), ...JSON.parse(raw) }; x.fr = { ...START, ...x.fr }; setM(x); } })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(m)).catch(() => {}); }, [m, ready]);

  // Faol vaqt hisoblagichi
  const pending = useRef(0);
  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      const add = pending.current;
      if (!add) return;
      pending.current = 0;
      const k = dayKey();
      setM((x) => ({ ...x, sec: { ...x.sec, [k]: (x.sec[k] ?? 0) + add } }));
      setToday(k);
    };
    const id = setInterval(() => {
      if (AppState.currentState === 'active' && Date.now() - lastActive < IDLE_MS) pending.current += TICK_MS / 1000;
      if (pending.current >= 60) flush();
    }, TICK_MS);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') { markActive(); setToday(dayKey()); } else flush(); });
    return () => { clearInterval(id); sub.remove(); flush(); };
  }, [ready]);

  const legacy = data.days;
  const qual = useCallback((d: string, x: MetaData = ref.current) =>
    (x.sec[d] ?? 0) >= STREAK_SEC || x.frozen.includes(d) || (d < x.cutover && !!legacy[d]), [legacy]);

  // Muz: o'tkazib yuborilgan kunlar (kechagacha) — streak tirik bo'lsa va muz bor bo'lsa, avtomatik
  useEffect(() => {
    if (!ready || !pReady) return;
    const yest = addDays(today, -1);
    const x = ref.current;
    if (x.checked >= yest) return;
    let { muz } = x; const frozen = [...x.frozen];
    const y: MetaData = { ...x, frozen };
    for (let d = addDays(x.checked, 1); d <= yest; d = addDays(d, 1)) {
      if (qual(d, y)) continue;
      if (muz > 0 && qual(addDays(d, -1), y)) { frozen.push(d); muz--; }
    }
    setM({ ...x, frozen, muz, checked: yest });
  }, [ready, pReady, today, qual]);

  const value = useMemo<Meta>(() => {
    const days = new Set<string>([...Object.keys(m.sec), ...m.frozen, ...Object.keys(legacy)].filter((d) => qual(d, m)));
    const streak = currentStreak(days, today);
    const fr = overall(m.fr, m.disabled);
    const wk = Object.keys(m.hist).filter((d) => d <= addDays(today, -7)).sort().pop();
    const week = wk ? fr - m.hist[wk] : fr - (Object.values(m.hist)[0] ?? fr);
    const xpDays = Object.values(m.sec).reduce((s, v) => s + dayXP(Math.floor(v / 60)), 0);
    const xpBonus = Object.values(m.bonus).reduce((s, v) => s + v, 0);
    const todaySec = m.sec[today] ?? 0;
    const yest = addDays(today, -1), y2 = addDays(today, -2);
    const widget = days.has(today) ? 'ok' : m.frozen.includes(yest) && m.frozen.includes(y2) ? 'ice'
      : m.frozen.includes(yest) ? 'pause' : streak > 0 ? 'pending' : 'zero';
    // Tiklash: kechagacha uzilgan 1–2 kun, undan oldin streak bor edi
    const gap: string[] = [];
    for (let d = yest; gap.length < 3 && !days.has(d); d = addDays(d, -1)) gap.push(d);
    const canRestore = gap.length >= 1 && gap.length <= 2 && days.has(addDays(gap[gap.length - 1], -1)) ? gap : [];
    const title = m.title;
    return {
      ready, m, fr, week, peak: Math.max(fr, ...Object.values(m.hist)),
      rank: { id: title, title: RANK_TITLE[title] ?? 'Shogird' },
      frRank: rankOf(fr),
      streak, best: bestStreak(days),
      todaySec, todayXP: dayXP(Math.floor(todaySec / 60)) + (m.bonus[today] ?? 0),
      xp: xpDays + xpBonus - m.spent,
      totalSec: Object.values(m.sec).reduce((s, v) => s + v, 0),
      mark: (d) => ((m.sec[d] ?? 0) >= STREAK_SEC || (d < m.cutover && legacy[d]) ? 'ok' : m.frozen.includes(d) ? 'frozen' : 'none'),
      widget,
      dailyDone: m.tests.find((t) => t.kind === 'daily' && t.day === today),
      canRestore,
      recordTest: (kind, items, sec) => {
        const x = ref.current;
        const before = overall(x.fr, x.disabled);
        const frs = { ...x.fr };
        const by: TestLog['by'] = {};
        const seen = { ...x.seen }, now = Date.now();
        for (const { q, s } of items) {
          seen[q.key] = now;
          if (kind !== 'practice') frs[q.area] = update(frs[q.area], q.d, s, kind, now);
          const b = by[q.area] ?? { ok: 0, n: 0, d: 0 };
          by[q.area] = { ok: b.ok + (s >= 1 ? 1 : 0), n: b.n + 1, d: 0 };
        }
        for (const a of AREAS) if (by[a]) by[a]!.d = Math.round(frs[a].r - x.fr[a].r);
        const after = overall(frs, x.disabled);
        const log: TestLog = { at: now, day: dayKey(), kind, n: items.length, ok: items.filter((i) => i.s >= 1).length, sec, before, after, by };
        const base = Object.keys(x.hist).length ? {} : { [addDays(dayKey(), -1)]: before };   // birinchi test: haftalik o'zgarish shu nuqtadan
        const next = { ...x, fr: frs, seen, tests: [...x.tests, log].slice(-400), hist: { ...base, ...x.hist, [dayKey()]: after } };
        ref.current = next; setM(next);
        return log;
      },
      recordBrain: (level, score) => {
        const x = ref.current;
        const frs = { ...x.fr, brain: update(x.fr.brain, 800 + level * 100, Math.max(0, Math.min(1, score / 100)), 'lesson') };
        const next = { ...x, fr: frs, hist: { ...x.hist, [dayKey()]: overall(frs, x.disabled) } };
        ref.current = next; setM(next);
      },
      syncChess: () => {
        getChess().then((c) => {
          const x = ref.current, n = c.solved + c.failed;
          if (!n || (x.fr.chess.r === c.rating && x.fr.chess.n === n)) return;
          const frs = { ...x.fr, chess: { r: c.rating, n, pts: c.solved * 20, last: Date.now() } };
          setM({ ...x, fr: frs, hist: { ...x.hist, [dayKey()]: overall(frs, x.disabled) } });
        }).catch(() => {});
      },
      buyMuz: () => {
        const x = ref.current;
        if (x.muz >= MUZ_MAX || xpDays + xpBonus - x.spent < PRICE.muz) return false;
        setM({ ...x, muz: x.muz + 1, spent: x.spent + PRICE.muz });
        return true;
      },
      restore: () => {
        const x = ref.current;
        if (!canRestore.length || xpDays + xpBonus - x.spent < PRICE.tiklash) return false;
        setM({ ...x, frozen: [...x.frozen, ...canRestore], spent: x.spent + PRICE.tiklash });
        return true;
      },
    };
  }, [m, ready, today, legacy, qual]);

  // Streak bonusi: bugun streak kuni bo'lgan zahoti, bir marta
  const todayOk = qual(today, m);
  useEffect(() => {
    if (!ready || !todayOk || m.bonus[today] !== undefined) return;
    setM((x) => ({ ...x, bonus: { ...x.bonus, [today]: streakBonus(value.streak) } }));
  }, [ready, todayOk, today, m.bonus, value.streak]);

  // Shaxmat reytingi → FR (ochilganda)
  useEffect(() => { if (ready) value.syncChess(); }, [ready]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Widget va kechki eslatma uchun holat (bo'limlar FR — katta widget ustunchalari)
  const areasKey = JSON.stringify(Object.fromEntries(AREAS.filter((a) => !m.disabled.includes(a)).map((a) => [a, Math.round(m.fr[a].r)])));
  useEffect(() => {
    if (ready && pReady) pushStatus({ streak: value.streak, best: value.best, today: value.widget === 'ok',
      fr: value.fr, rank: value.rank.title, muz: m.muz, state: value.widget, week: value.week, areas: areasKey ? JSON.parse(areasKey) : undefined });
  }, [ready, pReady, value.streak, value.best, value.widget, value.fr, value.rank.title, m.muz, value.week, areasKey]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const RANK_TITLE: Record<string, string> = { tolib: 'Tolib', shogird: 'Shogird', mutaallim: 'Mutaallim', mudarris: 'Mudarris', domla: 'Domla', alloma: 'Alloma', muallim: 'Muallimi soniy' };

export function useMeta(): Meta {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMeta() faqat <MetaProvider> ichida');
  return ctx;
}

/** "1 soat 25 daq" */
export function fmtDur(sec: number) {
  const mnt = Math.floor(sec / 60), h = Math.floor(mnt / 60);
  return h ? `${h} soat ${mnt % 60} daq` : `${mnt} daq`;
}
export { lastDays };
