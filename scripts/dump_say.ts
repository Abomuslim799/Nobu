/**
 * dump_say.ts — Ustoz o'qiydigan BARCHA matnlar (darslar + doskalar) ro'yxati.
 *   npx esbuild scripts/dump_say.ts --bundle --platform=node --outfile=/tmp/ds.js && node /tmp/ds.js > /tmp/say.json
 * Natija: [{ id, part, text (asl), speak (ovoz uchun tayyor), h (ilova ishlatadigan xesh — fayl nomi) }]
 * Sayt (GitHub Pages) uni /say.json qilib joylaydi; server shu ro'yxat bo'yicha ovozlarni o'zi yasab qo'yadi.
 */
import { textHash } from '@/core/hash';
import { blockSay, LESSONS } from '@/features/science/lessons';
import { sayText } from '@/features/science/speech';
import m0 from '@content/science/boards/m0.json';
import m1 from '@content/science/boards/m1.json';
import { TOPICS2 } from '@/features/lesson2/topics';
import { MODES, type Step } from '@/features/lesson2/types';

const VOICE = 'Iapetus';    // lib/tts.ts dagi USTOZ_VOICE bilan bir xil
const out: { id: string; part: string; text: string; speak: string; h: string }[] = [];
const add = (id: string, part: string, text: string) => {
  const speak = sayText(text);
  out.push({ id, part, text, speak, h: textHash(`${VOICE}|${speak}`) });
};
for (const l of LESSONS) {
  l.blocks.forEach((b, i) => {
    const s = blockSay(b);
    if (!s) return;
    add(`sci-${l.id}`, `s${i}`, s.main);
    if (s.after) add(`sci-${l.id}`, `s${i}r`, s.after);
  });
}
for (const b of [m0, m1]) b.steps.forEach((st, i) => add(`sci-${b.id}`, `b${i}`, st.say));
// v2 darslar: o'zgarmas matnlar (shablon matnlari har safar boshqa — ikki marta yasab, ikkalasida bor bo'lganlari olinadi)
for (const t of Object.values(TOPICS2)) {
  const texts = (steps: Step[]) => steps.flatMap((st) => [st.say, st.ask?.ok, st.ask?.no,
    ...(st.ask?.q.t === 'num' ? (st.ask.q.traps ?? []).map((tr) => tr.msg) : [])]).filter((x): x is string => !!x);
  const all = (): string[] => [t.recap, ...MODES.flatMap((m) => t.modes[m]())].flatMap((st) => texts([st]));
  const b = new Set(all());
  for (const x of new Set(all())) if (b.has(x)) { const speak = sayText(x); add(`v2-${t.id}`, `s${textHash(speak)}`, x); }
}
console.log(JSON.stringify(out));
