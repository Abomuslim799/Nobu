/**
 * vocab.ts — barcha so'zlar bitta joyda: tayyor to'plamlar + unit so'zlari.
 * Kartochka va test ekranlari shu yerdan oladi.
 */

import { CORE_DECKS, CORE_WORDS } from '@/features/english/data/core';
import { UNITS, UNIT_WORDS } from '@/features/english/data/units';
import { DECKS as BASE_DECKS, WORDS, type Word } from '@/features/english/data/words';

// Takror so'zlar (movie'da ham, core'da ham) — movie versiyasi qoladi, chunki uning misoli filmdan.
const movieWords = new Set(UNIT_WORDS.map((w) => w.word.toLowerCase()));
export const ALL_WORDS: Word[] = [...UNIT_WORDS, ...WORDS, ...CORE_WORDS.filter((w) => !movieWords.has(w.word.toLowerCase()))];

export const DECKS: Record<string, string> = {
  ...Object.fromEntries(UNITS.map((u) => [u.id, `${u.emoji} ${u.source}`])),
  ...BASE_DECKS,
  ...CORE_DECKS,
};
