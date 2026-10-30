/**
 * nobuContext.ts — Nobu suhbati uchun kontekst: dars mazmuni yoki foydalanuvchining butun statistikasi.
 */

import { getBrainLog, getChess, brainSummary } from './brain';
import { getSciLog, sciSummary } from './science';
import { getLog, summarize } from './skills';
import { lessonById, lessonContext } from '@/science/lessons';

/** Barcha bo'limlar bo'yicha ma'lumot (Nobu tahlili va "statistikam haqida gaplashish" uchun). */
export async function allData() {
  const [skills, brain, chess, sci] = await Promise.all([getLog(), getBrainLog(), getChess(), getSciLog()]);
  return { english: summarize(skills), brain: brainSummary(brain, chess), science: sciSummary(sci) };
}

/** key: 'lesson:f2' | 'stats' | 'science' */
export async function buildContext(key: string): Promise<{ topic: string; ctx: string }> {
  if (key.startsWith('lesson:')) {
    const l = lessonById(key.slice(7));
    if (l) {
      const res = sciSummary((await getSciLog()).filter((e) => e.lesson === l.id))[0];
      return { topic: l.title, ctx: lessonContext(l) + (res ? `\nFoydalanuvchi natijasi: ${JSON.stringify(res)}` : '') };
    }
  }
  if (key === 'science') {
    return { topic: 'Matematika, geometriya, fizika', ctx: `Science natijalari: ${JSON.stringify(sciSummary(await getSciLog()))}` };
  }
  return { topic: 'Mening statistikam', ctx: JSON.stringify(await allData()).slice(0, 11000) };
}
