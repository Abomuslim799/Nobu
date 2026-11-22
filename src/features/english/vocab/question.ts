/**
 * question.ts — takror savoli: har so'zga BITTA savol, turi tasodifiy (aralash).
 *   uz2en — tarjima → inglizcha so'z;  en2uz — so'z → tarjima;  audio — ovoz → so'z;  cloze — gapdagi bo'sh joy.
 *   4 variant (transportda tez). Ovozli savolga tezlik chegarasi +2 s.
 */

import { makeGap } from '@/features/english/quiz';
import type { Item } from '@/features/english/vocab/base';
import { FAST_SEC } from '@/features/english/vocab/srs';

export type QType = 'uz2en' | 'en2uz' | 'audio' | 'cloze';
export interface VQuestion { type: QType; item: Item; prompt: string; options: string[]; answer: string; fastSec: number }

const shuffle = <X,>(a: X[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

export function makeQuestion(item: Item, pool: Item[], rnd = Math.random): VQuestion {
  const gap = makeGap(item);
  const types: QType[] = ['uz2en', 'en2uz', 'audio', ...(gap ? ['cloze' as const] : [])];
  const type = types[Math.floor(rnd() * types.length)];
  const field = type === 'en2uz' ? 'translation' : 'word';
  const set = new Set<string>([item[field]]);
  // Chalg'ituvchilar: avval shu bo'limdagi so'zlar (o'xshash qiyinlik), keyin istalgani.
  for (const x of shuffle(pool)) { if (set.size >= 4) break; if (x.id !== item.id) set.add(x[field]); }
  const prompt = type === 'uz2en' ? item.translation : type === 'en2uz' ? item.word : type === 'cloze' ? gap! : '';
  return { type, item, prompt, options: shuffle([...set]), answer: item[field], fastSec: FAST_SEC + (type === 'audio' ? 2 : type === 'cloze' ? 3 : 0) };
}

export const QTYPE_LABEL: Record<QType, string> = {
  uz2en: 'Inglizchasini toping', en2uz: 'Tarjimasini toping', audio: 'Eshiting va toping', cloze: "Bo'sh joyga mos so'z",
};
