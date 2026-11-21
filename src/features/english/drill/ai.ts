/**
 * ai.ts — drill uchun AI (server → Gemini free, mavjud /tutor yo'li): javob tekshiruvi,
 * speaking tekshiruvi. Oddiy drill AI'siz ishlaydi — AI faqat so'ralganda chaqiriladi (limit tejaladi).
 */

import { api } from '@/core/server';

async function ask(topic: string, ctx: string, q: string): Promise<string> {
  const r = await api<{ reply: string }>('/tutor', { topic, ctx, smart: false, history: [{ role: 'user', text: q }] });
  return r.reply.trim();
}

/** "Mening javobim ham to'g'ri" — AI hakam. Javob: to'g'rimi va qisqa izoh (o'zbekcha). */
export async function judge(topic: string, uz: string, answer: string, accepted: string[]): Promise<{ ok: boolean; why: string }> {
  const ctx = [
    `You are a strict English grammar examiner. Topic: ${topic}.`,
    'The learner translated an Uzbek sentence into English. Decide if the translation is grammatically correct AND',
    'uses the tense/structure the topic requires AND keeps the meaning. Small word choice differences are fine.',
    'Reply format: first line exactly YES or NO. Second line: one short explanation in Uzbek (max 25 words).',
  ].join(' ');
  const r = await ask(topic, ctx, `Uzbek: ${uz}\nReference: ${accepted.join(' | ')}\nLearner: ${answer}`);
  const [first, ...rest] = r.split('\n');
  return { ok: /^\W*yes/i.test(first), why: rest.join(' ').trim() || first };
}

/** Speaking: foydalanuvchi aytgan (diktovka qilgan) gaplarni tekshiradi — xatolar va to'g'ri variant. */
export async function speakCheck(topic: string, task: string, text: string): Promise<string> {
  const ctx = [
    `You are a strict but short English coach. Topic: ${topic}. Task: ${task}.`,
    'The learner spoke these sentences (dictated, so ignore punctuation and capitalization).',
    'For each sentence with a mistake give: ❌ wrong → ✅ correct — reason in Uzbek (short).',
    'Then count how many sentences correctly use the target structure: "Target: X/Y".',
    'Then one line in Uzbek: the main weakness. No praise, no long text.',
  ].join(' ');
  return ask(topic, ctx, text);
}
