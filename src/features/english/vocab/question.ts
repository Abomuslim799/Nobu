/**
 * question.ts — takror savoli (bosib ochish, variantsiz): o'zbekcha ma'no yoki misol gapda bo'sh joy.
 *   So'zni eslaysiz → ochasiz → statusni tanlaysiz.
 */

import { makeGap } from '@/features/english/quiz';
import type { Item } from '@/features/english/vocab/base';

export type QType = 'meaning' | 'cloze';
export interface VQuestion { type: QType; item: Item; prompt: string }

export function makeQuestion(item: Item, rnd = Math.random): VQuestion {
  const gap = makeGap(item);
  const cloze = !!gap && rnd() < 0.35;
  return { type: cloze ? 'cloze' : 'meaning', item, prompt: cloze ? gap! : item.translation };
}
