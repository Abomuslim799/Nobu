/* global __dirname */
/**
 * core_emoji.cjs — Core (NGSL) so'zlariga emoji biriktiradi → content/english/core-emoji.json ({ so'z: emoji }).
 *   Ishga tushirish (bir marta, qo'lda):  npm i --no-save emojilib@4 unicode-emoji-json && node scripts/core_emoji.cjs
 *   Tartib: 1) emoji nomi so'zning o'zi ("dog" → 🐕)  2) emoji kalit so'zlarida so'z bor (oldinroq turgani ustun).
 *   Yordamchi so'zlar, olmoshlar, modal fe'llar va ko'p ma'noli so'zlar o'tkazib yuboriladi (noto'g'ri rasm yo'qdan yomon).
 */
const fs = require('fs');
const path = require('path');
const lib = require('emojilib');
const meta = require('unicode-emoji-json');

const ROOT = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/english/core.json'), 'utf8'));

const SKIP = new Set(`the be and of to a in have it you he for they not that we on with this i do as at she but from by will my or
say an what his if can there all get her their would about one them who which go me when make like time no just him know take into
your some could see other than then now only its come over think also back after use two how our work first well way even new want
because any these give day most us may should must might shall need lot mean kind thing much very still own also however such per
yes ok via etc both each few more less least many every either neither though although unless whether while yet so too quite rather
around above below under between through during before against among within without upon toward towards across along behind beyond
off out up down here where why whose whom himself herself itself themselves myself yourself ourselves something nothing anything
everything someone anyone everyone nobody somebody anybody everybody other another same different able become seem let put set keep
turn run point right left case part place number fact face matter state mind mean bit sort type form term level order line side end
present close fine fair free last long late light like mark match miss note play post press rest ring rock sign sound spring stick
strike suit tip top watch wave well yard bear bat bank bark bow can fan fly fire file trip lead
die period activity cause position cover break control stand care away together second offer view full black agree`.split(/\s+/));

// emoji → { name tokens, keywords }
const list = Object.keys(lib)
  .filter((e) => meta[e] && meta[e].group !== 'Flags' && !/skin tone/.test(meta[e].name))
  .map((e) => ({ e, name: meta[e].name.toLowerCase(), kw: lib[e].map((k) => k.toLowerCase().replace(/_/g, ' ')) }));

// Qo'lda: tez-tez uchraydigan so'zlarda avtomatik tanlov noto'g'ri chiqqanlari.
const FIX = {
  car: '🚗', friend: '🧑‍🤝‍🧑', year: '📅', month: '🗓️', hour: '🕐', room: '🛋️', money: '💵', change: '🔄', open: '🔓',
  big: '🐘', small: '🐜', early: '🌅', bad: '👎', good: '👍', great: '🌟', age: '🎂', low: '⬇️', word: '🔤', large: '🐘',
  hold: '✊', move: '🏃', system: '⚙️', business: '🏢', city: '🏙️', night: '🌙', head: '🗣️', hand: '✋', build: '🏗️',
  old: '👴', young: '👶', high: '⬆️', start: '🏁', life: '🌱', experience: '🧗', service: '🛎️', program: '💻',
  water: '💧', food: '🍲', walk: '🚶', music: '🎵', game: '🎮', father: '👨', human: '🧑', paper: '📄', team: '👥',
  people: '👥', hear: '👂', speak: '🗣️', record: '🎙️', stop: '🛑', wait: '⏳', body: '🧍', letter: '✉️', love: '❤️',
  country: '🏞️', next: '➡️', question: '❓', book: '📖', read: '📖',
  finger: '👆', gold: '🥇', wine: '🍷', tea: '🍵', swim: '🏊', fruit: '🍎', cup: '☕', hurt: '🤕', fashion: '👗', stone: '🪨',
  bottle: '🍾', birth: '👶', future: '🔮', film: '🎬', party: '🎉', office: '🏢', lock: '🔒', instrument: '🎻',
  tear: '', tape: '', entry: '', load: '', engine: '',
};
const STRONG_GROUPS = new Set(['Animals & Nature', 'Food & Drink', 'Travel & Places', 'Objects', 'Activities', 'People & Body']);

function pick(word) {
  const w = word.toLowerCase();
  if (w in FIX) return FIX[w] || null;
  const tok = (x) => x.name.split(/[\s:-]+/);
  // 1) nomning o'zi yoki nomidagi so'z ("dog", "red apple" → apple)
  const named = list.filter((x) => x.name === w || tok(x).at(-1) === w)   // "red apple" → apple; "water buffalo" ≠ water
    .sort((a, b) => (a.name === w ? 0 : 1) - (b.name === w ? 0 : 1) || tok(a).length - tok(b).length);
  if (named.length) return named[0].e;
  // 2) kalit so'z — faqat birinchi uchtasida va aniq narsalar guruhida (belgilar, bayroqlar emas)
  let best = null, bestScore = Infinity;
  for (const x of list) {
    const i = x.kw.indexOf(w);
    if (i < 0 || i > 2 || !STRONG_GROUPS.has(meta[x.e].group)) continue;
    const score = i * 10 + x.kw.length;
    if (score < bestScore) { best = x.e; bestScore = score; }
  }
  return best;
}

const out = {};
for (const [word] of rows) {
  const w = String(word).toLowerCase();
  if (SKIP.has(w) || w.length < 3) continue;
  const e = pick(w);
  if (e) out[w] = e;
}
fs.writeFileSync(path.join(ROOT, 'content/english/core-emoji.json'), JSON.stringify(out, null, 0));
console.log(`${Object.keys(out).length}/${rows.length} so'zga emoji biriktirildi`);
