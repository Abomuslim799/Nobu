/**
 * dump_say.ts — darslardagi barcha o'qiladigan matnlarni JSON'ga chiqaradi (make_audio.py shundan ovoz yasaydi).
 *   npx esbuild scripts/dump_say.ts --bundle --platform=node --outfile=/tmp/ds.js && node /tmp/ds.js > /tmp/say.json
 * Natija: [{ id: "sci-m1", part: "s3" | "s3r", text }]
 */
import { blockSay, LESSONS } from '../src/science/lessons';

const out: { id: string; part: string; text: string }[] = [];
for (const l of LESSONS) {
  l.blocks.forEach((b, i) => {
    const s = blockSay(b);
    if (!s) return;
    out.push({ id: `sci-${l.id}`, part: `s${i}`, text: s.main });
    if (s.after) out.push({ id: `sci-${l.id}`, part: `s${i}r`, text: s.after });
  });
}
console.log(JSON.stringify(out));
