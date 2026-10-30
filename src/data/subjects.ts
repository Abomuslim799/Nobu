/**
 * subjects.ts — O'rganish papkalari va ularning ichidagi narsalar.
 * IT — barcha dasturlash yo'nalishlari + IT so'zlari; Ingliz tili — unitlar, so'z boyligi,
 * qisqa darslar; Fizika — tez kunda.
 */

import { TRACKS } from './tracks';
import { STEPS, UNITS, stepsDone } from './units';
import { LESSONS as SCI } from '@/science/lessons';

export interface Subject { id: 'it' | 'en' | 'science'; title: string; icon: string; color: string; about: string; soon?: boolean }

export const SUBJECTS: Subject[] = [
  { id: 'it', title: 'IT', icon: '💻', color: '#34D399', about: 'Python · TypeScript · Java · SQL · IT so\'zlari' },
  { id: 'en', title: 'Ingliz tili', icon: '🇬🇧', color: '#60A5FA', about: 'Movies: vocab · grammar · reading · listening · writing · speaking' },
  { id: 'science', title: 'Science', icon: '🔬', color: '#F59E0B', about: 'Matematika · Geometriya · Fizika — simulyatsiyalar va Nobu bilan' },
];

export const IT_TRACKS = TRACKS;   // ingliz tili endi faqat film unitlari va kartochkalarda

export function subjectProgress(id: Subject['id'], data: { lessons: Record<string, unknown>; unitSteps: Record<string, string[]> }) {
  if (id === 'it') {
    const all = IT_TRACKS.flatMap((t) => t.lessons);
    return { done: all.filter((l) => data.lessons[l.id]).length, total: all.length };
  }
  if (id === 'en') {
    const steps = UNITS.reduce((a, u) => a + stepsDone(data.unitSteps[u.id]), 0);
    return { done: steps, total: UNITS.length * STEPS.length };
  }
  return { done: SCI.filter((l) => data.lessons[`sci-${l.id}`]).length, total: SCI.length };
}
