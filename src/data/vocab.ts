/**
 * vocab.ts — barcha so'zlar bitta joyda: tayyor to'plamlar + unit so'zlari.
 * Kartochka va test ekranlari shu yerdan oladi.
 */

import { UNITS, UNIT_WORDS } from './units';
import { DECKS as BASE_DECKS, WORDS, type Word } from './words';

export const ALL_WORDS: Word[] = [...UNIT_WORDS, ...WORDS];

export const DECKS: Record<string, string> = {
  ...Object.fromEntries(UNITS.map((u) => [u.id, `${u.emoji} ${u.source}`])),
  ...BASE_DECKS,
};
