/**
 * quiz.ts — so'z testi uchun savollar yasash (ekransiz, sof mantiq).
 *
 * 3 bosqich:
 *   1. Tarjima ↔ so'z:   o'zbekcha → inglizcha so'zni tanlash, keyin teskarisi
 *   2. Ovoz → so'z:      inglizcha ovoz → so'z, keyin o'zbekcha ovoz → inglizcha so'z
 *   3. Bo'sh joy:        misol gapda tushib qolgan so'zni topish
 */

import type { Word } from '@/data/words';

export type Kind = 'uz2en' | 'en2uz' | 'audioEn' | 'audioUz' | 'cloze';
export interface Question {
  kind: Kind;
  stage: 1 | 2 | 3;
  word: Word;
  options: string[];
  answer: string;
  gapped?: string;          // cloze: "The _____ for the report is Friday."
}

export const STAGES = { 1: 'Tarjima ↔ so\'z', 2: 'Ovoz → so\'z', 3: 'Gapdagi bo\'sh joy' } as const;
const WORDS_PER_QUIZ = 6;

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Misol gapdagi so'zni "_____" bilan almashtiradi. Topilmasa — undefined. */
export function makeGap(w: Word): string | undefined {
  if (!w.example) return undefined;
  let re: RegExp;
  if (w.cloze) {
    re = new RegExp(escape(w.cloze), 'i');
  } else {
    const parts = w.word.replace(/^to /, '').replace(/\s*\(.*?\)/, '').trim().split(/\s+/);
    // "postpone" → "postpon\w*" — "postponed", "postponing" ham topilsin
    re = new RegExp(parts.map((p) => escape(p.length > 3 ? p.replace(/[ey]$/, '') : p) + '\\w*').join('\\s+'), 'i');
  }
  const m = w.example.match(re);
  return m ? w.example.replace(m[0], '_____') : undefined;
}

function options(w: Word, pool: Word[], all: Word[], key: 'word' | 'translation'): string[] {
  const others = shuffle(pool.filter((x) => x.id !== w.id));
  const extra = shuffle(all.filter((x) => x.id !== w.id && !pool.includes(x)));
  const set = new Set<string>([w[key]]);
  for (const x of [...others, ...extra]) {
    if (set.size >= 4) break;
    set.add(x[key]);
  }
  return shuffle([...set]);
}

export function buildQuiz(
  deck: Word[], all: Word[], boxes: Record<string, { box: number }>, hasUz: (id: string) => boolean,
): Question[] {
  // Eng zaif so'zlar birinchi: hali ko'rilmagan yoki past qutidagilar.
  const picked = shuffle(deck)
    .sort((a, b) => (boxes[a.id]?.box ?? -1) - (boxes[b.id]?.box ?? -1))
    .slice(0, WORDS_PER_QUIZ);

  const q = (kind: Kind, stage: 1 | 2 | 3, w: Word): Question => {
    const key = kind === 'en2uz' ? 'translation' : 'word';
    return { kind, stage, word: w, answer: w[key], options: options(w, deck, all, key) };
  };

  return [
    ...shuffle(picked).map((w) => q('uz2en', 1, w)),
    ...shuffle(picked).map((w) => q('en2uz', 1, w)),
    ...shuffle(picked).map((w) => q('audioEn', 2, w)),
    // O'zbekcha ovozi yo'q so'z (o'zingiz qo'shgan) — matn bilan so'raladi.
    ...shuffle(picked).map((w) => q(hasUz(w.id) ? 'audioUz' : 'uz2en', 2, w)),
    ...shuffle(picked).flatMap((w) => {
      const gapped = makeGap(w);
      return gapped ? [{ ...q('cloze', 3, w), gapped }] : [];
    }),
  ];
}
