/**
 * units.ts — ingliz tili unitlari: bitta real kontekst (film, kitob) atrofida
 * reading → so'zlar (15 + 5 collocation) → grammatika → listening → speaking → test.
 * Kontent JSON fayllarda (src/data/units/*.json) — ovozlar ham shulardan yasaladi.
 */

import type { Word } from './words';
import fg1 from './units/forrest-gump-1.json';

export interface Unit {
  id: string;
  title: string;
  source: string;
  level: string;
  emoji: string;
  hook: { quote: string; who: string; context: string; link: string };
  reading: string[];
  questions: { q: string; options: string[]; answer: string }[];
  vocab: Omit<Word, 'deck'>[];
  collocations: Omit<Word, 'deck'>[];
  grammar: { title: string; explain: string[]; exercises: { q: string; options: string[]; answer: string; why: string }[] };
  dictation: { text: string; gap: string }[];
  shadowing: string[];
}

export const UNITS: Unit[] = [fg1 as Unit];

export const STEPS = [
  { id: 'hook', title: 'Kirish', icon: '🎬' },
  { id: 'read', title: 'Reading', icon: '📖' },
  { id: 'vocab', title: "So'zlar", icon: '🎴' },
  { id: 'grammar', title: 'Grammatika', icon: '🧩' },
  { id: 'listen', title: 'Listening', icon: '🎧' },
  { id: 'speak', title: 'Speaking', icon: '🗣' },
  { id: 'test', title: 'Test', icon: '🧪' },
] as const;
export type StepId = (typeof STEPS)[number]['id'];

/** Unit so'zlari kartochka/test uchun: deck = unit id. */
export const UNIT_WORDS: Word[] = UNITS.flatMap((u) =>
  [...u.vocab, ...u.collocations].map((w) => ({ ...w, deck: u.id })));
