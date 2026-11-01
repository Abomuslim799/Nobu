/**
 * dump_say.ts — Ustoz o'qiydigan BARCHA matnlar (darslar + doskalar) ro'yxati.
 *   npx esbuild scripts/dump_say.ts --bundle --platform=node --outfile=/tmp/ds.js && node /tmp/ds.js > /tmp/say.json
 * Natija: [{ id, part, text (asl), speak (ovoz uchun tayyor), h (ilova ishlatadigan xesh — fayl nomi) }]
 * Sayt (GitHub Pages) uni /say.json qilib joylaydi; server shu ro'yxat bo'yicha ovozlarni o'zi yasab qo'yadi.
 */
import { blockSay, LESSONS, textHash } from '../src/science/lessons';
import { sayText } from '../src/science/speech';
import m0 from '../src/science/boards/m0.json';
import m1 from '../src/science/boards/m1.json';

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
console.log(JSON.stringify(out));
