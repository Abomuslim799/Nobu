/**
 * nobuContext.ts — Nobu suhbati uchun kontekst: dars mazmuni yoki foydalanuvchining butun statistikasi.
 */

import { getBrainLog, getChess, brainSummary } from './brain';
import { getSciLog, sciSummary } from './science';
import { getLog, summarize } from './skills';
import { BOARDS } from '@/science/board';
import { lessonById, lessonContext, type Block } from '@/science/lessons';

/** Barcha bo'limlar bo'yicha ma'lumot (Nobu tahlili va "statistikam haqida gaplashish" uchun). */
export async function allData() {
  const [skills, brain, chess, sci] = await Promise.all([getLog(), getBrainLog(), getChess(), getSciLog()]);
  return { english: summarize(skills), brain: brainSummary(brain, chess), science: sciSummary(sci) };
}

/** key: 'lesson:f2' | 'stats' | 'science' */
export function stepText(b: Block): string {
  switch (b.k) {
    case 'nobu': case 'text': return b.text;
    case 'law': return `${b.title}: ${b.formula.join('; ')}. ${b.meaning}`;
    case 'example': return `${b.title}: ${b.steps.join(' ')}`;
    case 'predict': return `Savol: ${b.q} Javob: ${b.answer}. ${b.reveal}`;
    case 'choice': return `Savol: ${b.q} Javob: ${b.answer}. ${b.why}`;
    case 'sim': return `Simulyatsiya (${b.id}): ${b.task}`;
    case 'board': return `Doskada tushuntirish (${b.id}): ${(BOARDS[b.id]?.steps ?? []).map((x) => x.say).join(' ')}`;
    case 'ex': return `Mashq: ${b.q} Javob: ${b.answer}. Yechim: ${b.solution}`;
  }
}

export async function buildContext(key: string, step?: number): Promise<{ topic: string; ctx: string }> {
  if (key.startsWith('lesson:')) {
    const l = lessonById(key.slice(7));
    if (l) {
      const res = sciSummary((await getSciLog()).filter((e) => e.lesson === l.id))[0];
      const st = step !== undefined && l.blocks[step] ? `\nFoydalanuvchi aynan shu qadamni TUSHUNMADI (${step + 1}-qadam): ${stepText(l.blocks[step])}\nUni juda oddiy, kundalik misol bilan, qisqa tushuntir; atamalarni izohla; oxirida tushunganini tekshiradigan bitta oddiy savol ber.` : '';
      return { topic: l.title, ctx: lessonContext(l) + (res ? `\nFoydalanuvchi natijasi: ${JSON.stringify(res)}` : '') + st };
    }
  }
  if (key === 'science') {
    return { topic: 'Matematika, geometriya, fizika', ctx: `Science natijalari: ${JSON.stringify(sciSummary(await getSciLog()))}` };
  }
  return { topic: 'Mening statistikam', ctx: JSON.stringify(await allData()).slice(0, 11000) };
}
