/**
 * core.ts — eng ko'p ishlatiladigan 2 801 inglizcha so'z (NGSL 1.2, chastota tartibida).
 * Manba: New General Service List — Browne, Culligan & Phillips, CC BY-SA 4.0
 * (newgeneralservicelist.com). Tarjima, britancha IPA va misollar — Nobu uchun yozilgan.
 * 200 tadan to'plamlarga bo'lingan: 1–200 eng ko'p ishlatiladigan, oxirgilari — B2 darajasi.
 */

import type { Word } from './words';
import rows from './core.json';

export const CORE_SIZE = 200;
const deckOf = (i: number) => `ng${String(Math.floor(i / CORE_SIZE) + 1).padStart(2, '0')}`;

export const CORE_WORDS: Word[] = (rows as [string, string, string, string][]).map(([word, ipa, translation, example], i) => ({
  id: `ng-${word.toLowerCase().replace(/[^a-z]/g, '')}`, word, ipa, translation, example, deck: deckOf(i),
}));

/** "📚 Core 1–200", "📚 Core 201–400" ... */
export const CORE_DECKS: Record<string, string> = Object.fromEntries(
  Array.from({ length: Math.ceil(CORE_WORDS.length / CORE_SIZE) }, (_, k) => {
    const from = k * CORE_SIZE + 1, to = Math.min((k + 1) * CORE_SIZE, CORE_WORDS.length);
    return [deckOf(k * CORE_SIZE), `📚 Core ${from}–${to}`];
  }),
);
