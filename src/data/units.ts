/**
 * units.ts — ingliz tili unitlari: bitta real kontekst (film, kitob) atrofida
 * reading → so'zlar (15 + 5 collocation) → grammatika → listening → speaking → test.
 * Kontent JSON fayllarda (src/data/units/*.json) — ovozlar ham shulardan yasaladi.
 */

import type { Word } from './words';
import forrest_gump_1 from './units/forrest-gump-1.json';
import the_shining_1 from './units/the-shining-1.json';
import harry_potter_1 from './units/harry-potter-1.json';
import interstellar_1 from './units/interstellar-1.json';
import inception_1 from './units/inception-1.json';
import lord_of_the_rings_1 from './units/lord-of-the-rings-1.json';
import star_wars_1 from './units/star-wars-1.json';
import batman_begins_1 from './units/batman-begins-1.json';
import venom_1 from './units/venom-1.json';
import transformers_1 from './units/transformers-1.json';
import drive_1 from './units/drive-1.json';
import uncharted_1 from './units/uncharted-1.json';
import iron_man_1 from './units/iron-man-1.json';
import i_robot_1 from './units/i-robot-1.json';
import fight_club_1 from './units/fight-club-1.json';
import dark_knight_1 from './units/dark-knight-1.json';
import fast_furious_1 from './units/fast-furious-1.json';
import se7en_1 from './units/se7en-1.json';
import better_call_saul_1 from './units/better-call-saul-1.json';
import breaking_bad_1 from './units/breaking-bad-1.json';
import game_of_thrones_1 from './units/game-of-thrones-1.json';
import peaky_blinders_1 from './units/peaky-blinders-1.json';

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

// Tartib — grammatika ketma-ketligi bo'yicha (oddiydan murakkabga)
export const UNITS: Unit[] = [
  forrest_gump_1,
  the_shining_1,
  harry_potter_1,
  interstellar_1,
  inception_1,
  lord_of_the_rings_1,
  star_wars_1,
  batman_begins_1,
  venom_1,
  transformers_1,
  drive_1,
  uncharted_1,
  iron_man_1,
  i_robot_1,
  fight_club_1,
  dark_knight_1,
  fast_furious_1,
  se7en_1,
  better_call_saul_1,
  breaking_bad_1,
  game_of_thrones_1,
  peaky_blinders_1,
] as Unit[];

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
