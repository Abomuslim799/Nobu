/**
 * skills.ts — ko'nikmalar jurnali: har bir mashq natijasi (vocab, grammar, listening,
 * writing, speaking) shu yerga yoziladi. Statistika va AI tahlil shundan tuziladi.
 * Telefonda saqlanadi (AsyncStorage), oxirgi 400 ta yozuv.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type Skill = 'vocab' | 'grammar' | 'listening' | 'writing' | 'speaking';
export const SKILLS: { id: Skill; title: string; icon: string }[] = [
  { id: 'vocab', title: 'Vocabulary', icon: '🎴' },
  { id: 'grammar', title: 'Grammar', icon: '🧩' },
  { id: 'listening', title: 'Listening', icon: '🎧' },
  { id: 'writing', title: 'Writing', icon: '✍️' },
  { id: 'speaking', title: 'Speaking', icon: '🗣' },
];

export interface SkillEntry {
  skill: Skill;
  at: number;            // Date.now()
  score: number;         // 0..100
  topic: string;         // "Past Perfect", "Inception", "Core 1–200" ...
  mistakes: string[];    // qisqa: "said me → told me", "braces"
}

const KEY = 'nobu.skills.v1';
const MAX = 400;

export async function getLog(): Promise<SkillEntry[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
  } catch {
    return [];
  }
}

/** Natijani yozadi (ekranni kutdirmaydi). */
export function logSkill(skill: Skill, score: number, topic: string, mistakes: string[] = []) {
  (async () => {
    const log = await getLog();
    log.push({ skill, at: Date.now(), score: Math.max(0, Math.min(100, Math.round(score))), topic, mistakes: mistakes.slice(0, 12) });
    await AsyncStorage.setItem(KEY, JSON.stringify(log.slice(-MAX)));
  })().catch(() => {});
}

export interface SkillStat { skill: Skill; count: number; avg: number; recent: number; trend: number }

/** Har bir ko'nikma: jami urinish, o'rtacha ball, oxirgi 5 ta o'rtachasi, o'zgarish. */
export function stats(log: SkillEntry[]): SkillStat[] {
  return SKILLS.map(({ id }) => {
    const xs = log.filter((e) => e.skill === id).map((e) => e.score);
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0);
    const recent = avg(xs.slice(-5));
    const before = avg(xs.slice(-10, -5));
    return { skill: id, count: xs.length, avg: avg(xs), recent, trend: xs.length > 5 ? recent - before : 0 };
  });
}

/** AI uchun ixcham xulosa: ko'nikma bo'yicha ballar, mavzular va eng ko'p takrorlangan xatolar. */
export function summarize(log: SkillEntry[]) {
  return SKILLS.map(({ id }) => {
    const xs = log.filter((e) => e.skill === id).slice(-40);
    const topics: Record<string, number[]> = {};
    xs.forEach((e) => { (topics[e.topic] ??= []).push(e.score); });
    const mistakes: Record<string, number> = {};
    xs.forEach((e) => e.mistakes.forEach((m) => { mistakes[m] = (mistakes[m] ?? 0) + 1; }));
    return {
      skill: id,
      scores: xs.map((e) => e.score),
      topics: Object.entries(topics).map(([t, s]) => `${t}: ${Math.round(s.reduce((a, b) => a + b, 0) / s.length)}% (${s.length}x)`),
      mistakes: Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([m, n]) => `${m} (${n}x)`),
    };
  });
}
