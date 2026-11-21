/**
 * context.ts — Ustoz suhbati uchun drill konteksti: mavzu qoidasi, juftlar, so'nggi xatolar va holat.
 *   topic bo'sh bo'lsa — umumiy: barcha mavzular holati va eng ko'p xato qilingan joylar.
 */

import { contentOf } from '@/features/english/drill/content';
import { STATUS, statusOf } from '@/features/english/drill/logic';
import { loadDrill } from '@/features/english/drill/store';
import { TOPICS, topicById } from '@/features/english/drill/topics';

const RULES = [
  'You are Ustoz Farobiy, a strict English grammar teacher for an Uzbek B2 learner aiming for C1.',
  'Answer in Uzbek, short and precise; English examples in English. No praise. Focus on his real mistakes.',
  'When useful, give 3–5 short practice sentences (Uzbek) for him to translate, then check his answers.',
].join(' ');

export async function drillContext(topic: string): Promise<{ topic: string; ctx: string }> {
  const d = await loadDrill();
  const t = topicById(topic);
  const c = contentOf(topic);
  if (t && c) {
    const mistakes = d.mistakes.filter((m) => m.topic === topic).slice(-15)
      .map((m) => `UZ: ${m.uz} | his answer: ${m.wrong || '(empty/timeout)'} | correct: ${m.en[0]}`);
    return {
      topic: t.title,
      ctx: [RULES, `Topic: ${t.title} (Murphy ${t.murphy}).`, `Rules: ${c.formula.join(' ')}`,
        `Contrast pairs: ${c.pairs.map((p) => `${p.a} / ${p.b} (${p.note_uz})`).join('; ')}`,
        `Status: ${STATUS[statusOf(d.results, topic)].label}.`,
        mistakes.length ? `His recent mistakes:\n${mistakes.join('\n')}` : 'No mistakes recorded yet.'].join('\n'),
    };
  }
  const states = TOPICS.map((x) => `${x.title}: ${STATUS[statusOf(d.results, x.id)].label}`).join('; ');
  const recent = d.mistakes.slice(-20).map((m) => `[${m.topic}] ${m.wrong || '(timeout)'} → ${m.en[0]}`).join('\n');
  return { topic: 'Grammar — 6 oylik reja', ctx: [RULES, `Topic states: ${states}`, recent ? `Recent mistakes:\n${recent}` : ''].join('\n') };
}
