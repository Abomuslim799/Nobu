/**
 * logic.ts — drill mantiqi (sof funksiyalar, tests/run.ts da tekshiriladi):
 *   javobni solishtirish, haftalik sikl, bosqich, mavzu holati (Zaif/O'rta/Mustahkam),
 *   holatga qarab vaqt va savollar soni, mistake bank qoidalari.
 */

import { addDays } from '@/core/date';
import { PHASES, START, TOPICS, WEEKS, type DrillTopic } from '@/features/english/drill/topics';

// ── Javobni solishtirish ────────────────────────────────────────────────────
const CONTRACT: [RegExp, string][] = [
  // telefonda apostrof ko'pincha tushib qoladi: dont, cant, im
  [/\b(do|does|did|is|are|was|were|have|has|had|could|should|would|must|need)nt\b/g, "$1n't"],
  [/\bcant\b/g, "can't"], [/\bwont\b/g, "won't"], [/\bim\b/g, "i'm"], [/\bive\b/g, "i've"],
  [/\bwon't\b/g, 'will not'], [/\bcan't\b/g, 'cannot'], [/\bcan not\b/g, 'cannot'], [/\bshan't\b/g, 'shall not'],
  [/\b(\w+)n't\b/g, '$1 not'], [/\bi'm\b/g, 'i am'], [/\b(\w+)'re\b/g, '$1 are'], [/\b(\w+)'ve\b/g, '$1 have'],
  [/\b(\w+)'ll\b/g, '$1 will'], [/\b(i|you|he|she|it|we|they)'d\b/g, '$1 would'],
  [/\b(he|she|it|that|there|what|who|where)'s\b/g, '$1 is'],
];

/** "I'm not  working!" → "i am not working" — katta-kichik harf, tinish belgilari, qisqartmalar farq qilmaydi. */
export function norm(s: string): string {
  let t = s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?;:"“”()—–-]/g, ' ');
  for (const [re, to] of CONTRACT) t = t.replace(re, to);
  return t.replace(/\s+/g, ' ').trim();
}

/** "he's" ikki ma'noli (he is / he has) — ikkalasini ham tekshiramiz. */
function variants(s: string): string[] {
  const a = norm(s);
  const b = norm(s.replace(/\b(he|she|it|that|there|who)'s\b/gi, '$1 has'));
  const c = norm(s.replace(/\b(i|you|he|she|it|we|they)'d\b/gi, '$1 had'));
  return [...new Set([a, b, c])];
}

export function matches(answer: string, accepted: string[]): boolean {
  const mine = variants(answer);
  return accepted.some((x) => variants(x).some((v) => mine.includes(v)));
}

// ── Sikl va bosqich ─────────────────────────────────────────────────────────
/** Haftaning kuni: 1 = dushanba … 7 = yakshanba. */
export function weekday(key: string): DrillTopic['day'] {
  const [y, m, d] = key.split('-').map(Number);
  const w = new Date(y, m - 1, d).getDay();     // 0 = yakshanba
  return (w === 0 ? 7 : w) as DrillTopic['day'];
}

/** Rejaning nechanchi haftasi (1…24). Boshlanishdan oldin — 0. */
export function weekOf(key: string): number {
  if (key < START) return 0;
  let w = 1, monday = START;
  while (addDays(monday, 7) <= key) { monday = addDays(monday, 7); w++; }
  return Math.min(w, WEEKS);
}

export function phaseOf(week: number) {
  return PHASES.find((p) => week >= p.from && week <= p.to) ?? PHASES[0];
}

/** Shu kunning mavzulari, blok bo'yicha. */
export function dayPlan(day: DrillTopic['day']) {
  const t = TOPICS.filter((x) => x.day === day);
  return { b1: t.filter((x) => x.block === 1), b2: t.filter((x) => x.block === 2) };
}

// ── Mavzu holati ────────────────────────────────────────────────────────────
export interface SessionResult { topic: string; at: number; day: string; acc: number; avgSec: number; limit: number; n: number }
export type Status = 'new' | 'zaif' | 'orta' | 'mustahkam';

export const STATUS: Record<Status, { label: string; color: string; time: number }> = {
  new: { label: 'Yangi', color: '#8A8F98', time: 1 },
  zaif: { label: 'Zaif', color: '#F87171', time: 1.5 },        // keyingi hafta +50% vaqt
  orta: { label: "O'rta", color: '#FBBF24', time: 1 },
  mustahkam: { label: 'Mustahkam', color: '#34D399', time: 0.7 }, // −30% vaqt, qiyinroq
};

/** Oxirgi 3 sessiya: aniqlik va tezlik. Sekin javob (limitning 75% idan ko'p) bir pog'ona tushiradi. */
export function statusOf(results: SessionResult[], topic: string): Status {
  const last = results.filter((r) => r.topic === topic).sort((a, b) => a.at - b.at).slice(-3);
  if (!last.length) return 'new';
  const acc = last.reduce((a, r) => a + r.acc, 0) / last.length;
  const slow = last.reduce((a, r) => a + r.avgSec / r.limit, 0) / last.length > 0.75;
  if (acc < 70) return 'zaif';
  if (acc < 85) return slow ? 'zaif' : 'orta';
  return slow ? 'orta' : 'mustahkam';
}

/** Mavzuga ajratilgan vaqt (daqiqa) holatga qarab. */
export const topicMinutes = (t: DrillTopic, st: Status) => Math.round(t.min * STATUS[st].time);

/** Drill savollari soni: sessiyaning ~60% i drill, bitta gap ~15 s. */
export const drillCount = (minutes: number) => Math.max(6, Math.round((minutes * 0.6 * 60) / 15));

// ── Mistake bank ────────────────────────────────────────────────────────────
export interface Mistake { topic: string; uz: string; en: string[]; wrong: string; at: number; hits: number }
/** Ketma-ket 2 marta to'g'ri javob berilsa — bankdan chiqadi. */
export const CLEAR_AFTER = 2;

export function addMistake(bank: Mistake[], m: Omit<Mistake, 'at' | 'hits'>, at = Date.now()): Mistake[] {
  const rest = bank.filter((x) => !(x.topic === m.topic && x.uz === m.uz));
  return [...rest, { ...m, at, hits: 0 }];
}

export function answerMistake(bank: Mistake[], topic: string, uz: string, right: boolean, wrong = ''): Mistake[] {
  return bank.flatMap((x) => {
    if (x.topic !== topic || x.uz !== uz) return [x];
    if (!right) return [{ ...x, hits: 0, wrong: wrong || x.wrong }];
    return x.hits + 1 >= CLEAR_AFTER ? [] : [{ ...x, hits: x.hits + 1 }];
  });
}

/** Bugungi blok tugaganmi: shu kunda mavzuning sessiyasi bor. */
export const doneOn = (results: SessionResult[], topic: string, day: string) => results.some((r) => r.topic === topic && r.day === day);
