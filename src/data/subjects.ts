/**
 * subjects.ts — O'rganish papkalari va ularning ichidagi narsalar.
 * IT — barcha dasturlash yo'nalishlari + IT so'zlari; Ingliz tili — unitlar, so'z boyligi,
 * qisqa darslar; Fizika — tez kunda.
 */

import { TRACKS } from './tracks';
import { STEPS, UNITS } from './units';

export interface Subject { id: 'it' | 'en' | 'physics'; title: string; icon: string; color: string; about: string; soon?: boolean }

export const SUBJECTS: Subject[] = [
  { id: 'it', title: 'IT', icon: '💻', color: '#34D399', about: 'Python · TypeScript · Java · SQL · IT so\'zlari' },
  { id: 'en', title: 'Ingliz tili', icon: '🇬🇧', color: '#60A5FA', about: 'Film unitlari · so\'z boyligi · talaffuz · grammatika' },
  { id: 'physics', title: 'Fizika', icon: '⚛️', color: '#F59E0B', about: 'Mexanika → energiya → elektr, simulyatsiyalar bilan', soon: true },
];

export const IT_TRACKS = TRACKS.filter((t) => t.id !== 'english');
export const EN_TRACK = TRACKS.find((t) => t.id === 'english');

export function subjectProgress(id: Subject['id'], data: { lessons: Record<string, unknown>; unitSteps: Record<string, string[]> }) {
  if (id === 'it') {
    const all = IT_TRACKS.flatMap((t) => t.lessons);
    return { done: all.filter((l) => data.lessons[l.id]).length, total: all.length };
  }
  if (id === 'en') {
    const lessons = EN_TRACK?.lessons ?? [];
    const steps = UNITS.reduce((a, u) => a + (data.unitSteps[u.id]?.length ?? 0), 0);
    return {
      done: steps + lessons.filter((l) => data.lessons[l.id]).length,
      total: UNITS.length * STEPS.length + lessons.length,
    };
  }
  return { done: 0, total: 0 };
}
