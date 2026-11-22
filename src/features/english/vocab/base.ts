/**
 * base.ts — yagona so'z bazasi: filmlar, Core (NGSL), ish/IT, phrasal, o'z so'zlaringiz.
 *   Ikki bo'lim: 'word' (so'zlar) va 'colloc' (collocation + phrasal verbs) — mantiq bir xil.
 *   Bazalar (manbalar) yoqib-o'chiriladi; yangi so'zlar yoqilgan bazalardan navbat bilan olinadi (rang-baranglik).
 */

import { CORE_WORDS } from '@/features/english/data/core';
import { UNITS } from '@/features/english/data/units';
import { WORDS, type Word } from '@/features/english/data/words';
import type { Kind } from '@/features/english/vocab/srs';

export interface Item extends Word { kind: Kind; base: string }

export interface Base { id: string; title: string; emoji: string; color: string; kind: Kind | 'both' }

export const BASES: Base[] = [
  { id: 'core', title: 'Core 2801', emoji: '📚', color: '#60A5FA', kind: 'word' },
  { id: 'film', title: 'Filmlar', emoji: '🎬', color: '#F59E0B', kind: 'both' },
  { id: 'work', title: 'Ish va ofis', emoji: '💼', color: '#A78BFA', kind: 'word' },
  { id: 'it', title: 'IT', emoji: '💻', color: '#34D399', kind: 'word' },
  { id: 'phrasal', title: 'Phrasal verbs', emoji: '🔗', color: '#F472B6', kind: 'colloc' },
  { id: 'my', title: "Mening so'zlarim", emoji: '✍️', color: '#FB923C', kind: 'both' },
];

const key = (w: string) => w.toLowerCase().replace(/\s+/g, ' ').trim();

/** Film so'zlari ustun (misoli filmdan) — boshqa filmdagi va Core'dagi takrorlari olib tashlanadi. */
function buildItems(): Item[] {
  const film: Item[] = UNITS.flatMap((u) => [
    ...u.vocab.map((w) => ({ ...w, deck: u.id, kind: 'word' as const, base: 'film' })),
    ...u.collocations.map((w) => ({ ...w, deck: u.id, kind: 'colloc' as const, base: 'film' })),
  ]);
  const seen = new Set<string>();
  const add = (w: Item) => { const k = `${w.kind}|${key(w.word)}`; if (seen.has(k)) return false; seen.add(k); return true; };
  const films = film.filter(add);   // bir xil so'z ikki filmda bo'lsa — birinchisi qoladi
  const base = WORDS.map((w) => ({ ...w, kind: (w.deck === 'phrasal' ? 'colloc' : 'word') as Kind, base: w.deck })).filter(add);
  const core = CORE_WORDS.map((w) => ({ ...w, kind: 'word' as const, base: 'core' })).filter(add);
  return [...films, ...base, ...core];
}

export const ITEMS: Item[] = buildItems();

/** O'zingiz qo'shgan so'zlar (progress → myWords): bir nechta so'zdan iborat bo'lsa — collocation. */
export const myItems = (my: (Omit<Word, 'deck'> & { id: string })[]): Item[] =>
  my.map((w) => ({ ...w, deck: 'my', base: 'my', kind: w.word.trim().includes(' ') ? 'colloc' : 'word' }));

/**
 * Yangi so'zlar: o'rganilmaganlar, yoqilgan bazalardan navbat bilan (round-robin).
 * Har bazaning ichida asl tartib (Core — chastota bo'yicha, film — film tartibida).
 */
export function pickNew(items: Item[], kind: Kind, learnedIds: Set<string>, enabled: Record<string, boolean>, n: number): Item[] {
  const lanes = BASES.filter((b) => enabled[b.id] !== false)
    .map((b) => items.filter((w) => w.kind === kind && w.base === b.id && !learnedIds.has(w.id)))
    .filter((l) => l.length);
  const out: Item[] = [];
  for (let i = 0; out.length < n && lanes.some((l) => i < l.length); i++) {
    for (const l of lanes) if (i < l.length && out.length < n) out.push(l[i]);
  }
  return out;
}
