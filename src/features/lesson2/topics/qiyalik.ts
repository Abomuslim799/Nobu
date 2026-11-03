/**
 * qiyalik.ts — namuna dars (Farobiy metodikasi v2, 18+): Qiyalik, 3 rejimda.
 * Matn: loyiha hujjati claude/namuna-qiyalik.md. Mashqlar — shablon (raqamlar har safar yangi).
 */

import { type Act, type Scene, type Step, type Topic2, type XY } from '@/features/lesson2/types';

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const grid = (x0: number, x1: number, y0: number, y1: number, extra: Partial<Scene> = {}): Act => ({ t: 'scene', v: { x0, x1, y0, y1, ...extra } });
const pt = (id: string, at: XY, label?: string, c = 'w'): Act => ({ t: 'point', id, at, label, c });
/** Zinapoya uchburchak: a dan o'ngga (yurish), keyin yuqoriga/pastga (ko'tarilish). */
const stair = (id: string, a: XY, b: XY, dxText?: string, dyText?: string, dxAt?: XY, dyAt?: XY): Act[] => [
  { t: 'seg', id: `${id}x`, from: a, to: [b[0], a[1]], c: 'c', dash: true },
  { t: 'arrow', id: `${id}y`, from: [b[0], a[1]], to: b, c: 'c' },
  ...(dxText && dxAt ? [{ t: 'text', id: `${id}tx`, at: dxAt, text: dxText, c: 'c' } as Act] : []),
  ...(dyText && dyAt ? [{ t: 'text', id: `${id}ty`, at: dyAt, text: dyText, c: 'c' } as Act] : []),
];
const fmtP = (p: XY) => `(${p[0]}; ${p[1]})`.replace(/-/g, '−');
const word = (n: number) => String(n).replace('-', 'minus ');
const neg = (n: number) => String(n).replace('-', '−');
const par = (n: number) => (n < 0 ? `(${neg(n)})` : String(n));

/** Shablon: ikki nuqta orqali qiyalik (k butun son). */
function tplTwoPoints(sub: string): Step {
  return { ...twoPoints(sub), regen: () => tplTwoPoints(sub) };
}
function twoPoints(sub: string): Step {
  const k = pick([-3, -2, -1, 1, 2, 3]);
  const x1 = ri(-3, 1), x2 = x1 + ri(1, 3), y1 = ri(-3, 3), y2 = y1 + k * (x2 - x1);
  const a: XY = [x1, y1], b: XY = [x2, y2];
  const ys = [y1, y2, 0], span = Math.max(...ys) - Math.min(...ys);
  const traps = [{ v: 1 / k, msg: `Teskari oldingiz: avval ko'tarilish Δy, keyin yurish Δx.` }, { v: -k, msg: `Ishorani tekshiring: chiziq ${k > 0 ? 'ko\'tariladi — k musbat' : 'tushadi — k manfiy'}.` }]
    .filter((t) => t.v !== k);
  return {
    say: `Nuqtalar: ${word(x1)} va ${word(y1)}, ${word(x2)} va ${word(y2)}. Qiyalikni toping.`,
    sub,
    draw: [grid(Math.min(x1, 0) - 1.5, Math.max(x2, 0) + 1.5, Math.min(...ys) - 1.5, Math.max(...ys) + 1.5, { stepY: span > 12 ? 2 : 1 }),
      { t: 'line', id: 'L', p: [a, b], c: 'a' }, pt('A', a, 'A'), pt('B', b, 'B')],
    ask: { prompt: `A${fmtP(a)} va B${fmtP(b)}. k = ?`, q: { t: 'num', answer: k, traps },
      ok: `To'g'ri: k = (${neg(y2)} − ${par(y1)}) / (${neg(x2)} − ${par(x1)}) = ${neg(k)}.`,
      no: `k = Δy / Δx = ${y2 - y1} / ${x2 - x1} = ${k}.`.replace(/-/g, '−') },
  };
}

/** Shablon: nuqtani surib, berilgan qiyalikdagi chiziq. */
function tplDrag(sub: string): Step {
  return { ...dragK(sub), regen: () => tplDrag(sub) };
}
function dragK(sub: string): Step {
  const k = pick([2, -1, 3, -2]);
  return {
    say: `Koordinata boshidan qiyaligi ${word(k)} bo'lgan chiziq o'tkazing. Ikkinchi nuqtani suring.`,
    sub,
    draw: [grid(-4, 4, -5, 5)],
    ask: { prompt: `Nuqtani suring: k = ${k}`.replace('-', '−'), q: { t: 'drag', fixed: [0, 0], start: [3, 1], ok: (p) => p[0] !== 0 && p[1] === k * p[0] },
      ok: `To'g'ri: o'ngga 1 yursangiz, ${Math.abs(k)} ga ${k > 0 ? 'ko\'tariladi' : 'tushadi'}.`,
      no: `k = ${k}: o'ngga 1 → ${k > 0 ? 'yuqoriga' : 'pastga'} ${Math.abs(k)}. Masalan (1; ${k}).`.replace(/-/g, '−') },
  };
}

const INCOME: Scene = { x0: -0.7, x1: 5.9, y0: -40, y1: 340, stepX: 1, stepY: 50, labelX: 'soat', labelY: "ming so'm" };
const MAP: Act[] = [
  { t: 'scene', v: { x0: 0, x1: 12.4, y0: 0, y1: 4, axes: false } },
  { t: 'seg', id: 'm1', from: [0.6, 1], to: [2.6, 3.5], c: 'd' }, { t: 'text', id: 'm1t', at: [1.6, 0.35], text: 'k > 0', c: 'd' },
  { t: 'seg', id: 'm2', from: [3.6, 3.5], to: [5.6, 1], c: 'b' }, { t: 'text', id: 'm2t', at: [4.6, 0.35], text: 'k < 0', c: 'b' },
  { t: 'seg', id: 'm3', from: [6.6, 2.2], to: [8.6, 2.2], c: 'c' }, { t: 'text', id: 'm3t', at: [7.6, 0.35], text: 'k = 0', c: 'c' },
  { t: 'seg', id: 'm4', from: [10.4, 1], to: [10.4, 3.5], c: 'red' }, { t: 'text', id: 'm4t', at: [10.4, 0.35], text: 'aniqlanmagan', c: 'red' },
];

// ═══════════════ 🌱 URUG' ═══════════════
const low = (): Step[] => [
  { say: "Avval o'tgan mavzudan bitta savol.", sub: 'Takror · O\'zgarish tezligi',
    ask: { prompt: 'Mashina 2 soatda 80 km yurdi. Tezligi?', q: { t: 'num', answer: 40, unit: 'km/soat',
      traps: [{ v: 160, msg: "Ko'paytirdingiz. Tezlik — masofa bo'linadi vaqtga: 80 / 2." }, { v: 0.025, msg: "Teskari: masofani vaqtga bo'lamiz — 80 / 2." }] },
    ok: "To'g'ri: 80 / 2 = 40 km/soat. Bugungi mavzu ham shu bo'lishdan boshlanadi.", no: 'Tezlik = masofa / vaqt = 80 / 2 = 40 km/soat.' } },
  { say: "Sizga ikki ish taklif qilishdi. A — soatiga qirq ming so'm, B — soatiga oltmish ming so'm. Grafikda iks — ishlagan soat, igrek — topgan pul. Qaysi chiziq pulni tezroq ko'paytiradi?",
    sub: 'Ikki ish taklifi: A va B. Qaysi biri tezroq boyitadi?',
    draw: [{ t: 'scene', v: INCOME }, { t: 'line', id: 'A', p: [[0, 0], [5, 200]], c: 'a' }, { t: 'line', id: 'B', p: [[0, 0], [5, 300]], c: 'b' },
      { t: 'text', id: 'At', at: [5.45, 196], text: 'A', c: 'a' }, { t: 'text', id: 'Bt', at: [4.75, 312], text: 'B', c: 'b' }],
    ask: { prompt: 'Tezroq boyitadigan chiziqqa teging', q: { t: 'tap', targets: ['A', 'B'], answer: 'B' },
      ok: "To'g'ri — B tikroq: har soatda daromad ko'proq o'sadi.", no: "Qarang: 5 soatda A — 200 ming, B — 300 ming. Tikroq chiziq — B." } },
  { say: "Chiziq qanchalik tik bo'lsa, narsa shunchalik tez o'zgaradi. Shu tiklikni o'lchaydigan son qiyalik deyiladi.",
    sub: 'Qiyalik — qanchalik tez o\'zgarishi', draw: [{ t: 'formula', text: 'Qiyalik = qanchalik tez o\'zgaradi' }] },
  { say: "A chizig'ida bir soat o'ngga yuramiz. Shu vaqtda chiziq qirqqa ko'tariladi. Qiyalik — ko'tarilish bo'linadi yurishga: qirq bo'linsin bir, ya'ni qirq.",
    sub: 'Δx = 1 soat, Δy = 40 → k = 40',
    draw: [pt('a1', [1, 40]), pt('a2', [2, 80]), ...stair('ta', [1, 40], [2, 80], '1 soat', '+40', [1.5, 18], [2.5, 58]), { t: 'formula', text: 'k = Δy / Δx = 40 / 1 = 40' }] },
  { say: "B chizig'ida ham bir soat yuramiz — chiziq oltmishga ko'tariladi. Qiyaligi oltmish. Kattaroq qiyalik — tikroq chiziq.",
    sub: 'Katta k — tik chiziq',
    draw: [pt('b1', [3, 180]), pt('b2', [4, 240]), ...stair('tb', [3, 180], [4, 240], '1 soat', '+60', [3.5, 158], [4.5, 205]), { t: 'formula', text: 'A: k = 40 · B: k = 60' }] },
  { say: "Endi o'zingiz. C chizig'ida o'ngga ikki birlik yurganda yuzga ko'tarildi. Qiyalik nechaga teng?",
    sub: 'C chizig\'i: Δx = 2, Δy = 100',
    draw: [grid(-0.6, 3.6, -25, 125, { stepY: 25 }), { t: 'line', id: 'C', p: [[0, 0], [2, 100]], c: 'd' }, pt('c1', [0, 0]), pt('c2', [2, 100]),
      ...stair('tc', [0, 0], [2, 100], 'Δx = 2', 'Δy = 100', [1, -14], [2.8, 50])],
    ask: { prompt: 'C chizig\'ining qiyaligi?', q: { t: 'num', answer: 50,
      traps: [{ v: 0.02, msg: "Teskari oldingiz: avval ko'tarilish (Δy), keyin yurish (Δx): 100 / 2." }, { v: 200, msg: "Ko'paytirdingiz. Ko'tarilishni yurishga bo'lamiz: 100 / 2." }] },
    ok: "To'g'ri: k = 100 / 2 = 50.", no: 'k = Δy / Δx = 100 / 2 = 50.' } },
  { say: 'Shu qoidani esda saqlang: qiyalik — ko\'tarilish bo\'linadi yurishga.', sub: 'Asosiy qoida',
    draw: [{ t: 'formula', text: 'k = Δy / Δx' }], card: 'Qiyalik = Δy ÷ Δx — ko\'tarilish ÷ yurish' },
];

// ═══════════════ 🌿 NIHOL ═══════════════
const medium = (): Step[] => [
  { say: "Endi ixtiyoriy ikki nuqta. Ikkinchi nuqtaning igregidan birinchisinikini ayiramiz — bu ko'tarilish: sakkiz minus ikki, olti. Iksdan ham xuddi shunday: to'rt minus bir, uch. Olti bo'linsin uch — qiyalik ikki.",
    sub: 'Ikki nuqta orqali qiyalik',
    draw: [grid(-1, 6, -1, 10), { t: 'line', id: 'L', p: [[1, 2], [4, 8]], c: 'a' }, pt('P1', [1, 2], 'P₁'), pt('P2', [4, 8], 'P₂'),
      ...stair('t', [1, 2], [4, 8], 'Δx = 3', 'Δy = 6', [2.5, 1.3], [4.9, 5]), { t: 'formula', text: 'k = (y₂ − y₁) / (x₂ − x₁) = 6 / 3 = 2' }] },
  { say: "Nega aynan igrekni iksga bo'lamiz, teskarisi emas? Chunki qiyalik shu savolga javob beradi: iks bir birlikka o'zgarsa, igrek qanchaga o'zgaradi? Soat bitta oshsa — pul qancha oshadi. Shuning uchun nima o'zgarishini, ya'ni igrekni, nimaga nisbatan, ya'ni iksga bo'lamiz.",
    sub: "Nega Δy / Δx: x 1 ga o'zgarsa, y qanchaga o'zgaradi",
    draw: [{ t: 'scene', v: INCOME }, { t: 'line', id: 'A', p: [[0, 0], [5, 200]], c: 'a' }, pt('a1', [2, 80]), pt('a2', [3, 120]),
      ...stair('t', [2, 80], [3, 120], 'x: +1 soat', "y: +40", [2.5, 58], [3.75, 100]), { t: 'formula', text: "k = 40 → har 1 soatda +40 ming so'm" }],
    ask: { prompt: 'k = 40 nimani bildiradi?', q: { t: 'choice', options: ["Har 1 soatda 40 ming so'm qo'shiladi", "40 soatda 1 ming so'm qo'shiladi", "Jami 40 ming so'm topiladi"], answer: "Har 1 soatda 40 ming so'm qo'shiladi" },
      ok: "To'g'ri: qiyalik — x ning bir birligiga to'g'ri keladigan y o'zgarishi. Δx / Δy olsak, savol teskari bo'lib qoladi: 1 ming so'm uchun necha soat.",
      no: "Qiyalik — x bir birlikka (1 soat) o'zgarganda y qanchaga o'zgarishi: har soatda +40 ming. Jami emas, va teskari ham emas." } },
  { say: "Bu chiziq chapdan o'ngga pastga tushyapti. Iks oshganda igrek kamayadi. Delta igrek qanday bo'ladi?",
    sub: 'Pastga tushayotgan chiziq',
    draw: [grid(-1, 5, -2, 8), { t: 'line', id: 'L', p: [[0, 6], [3, 0]], c: 'b' }, pt('p1', [0, 6]), pt('p2', [3, 0])],
    ask: { prompt: 'Δy qanday?', q: { t: 'choice', options: ['Musbat', 'Manfiy', 'Nol'], answer: 'Manfiy' },
      ok: "To'g'ri: Δy = 0 − 6 = −6.", no: 'Chiziq tushyapti: y 6 dan 0 ga kamaydi — Δy = −6, manfiy.' } },
  { say: 'Endi qiyalikni hisoblang.', sub: 'Δx = 3, Δy = −6',
    draw: [...stair('t', [0, 6], [3, 0], 'Δx = 3', 'Δy = −6', [1.5, 6.6], [3.9, 3])],
    ask: { prompt: 'k = ?', q: { t: 'num', answer: -2,
      traps: [{ v: 2, msg: "Ishora yo'qoldi: chiziq pastga tushyapti — k manfiy." }, { v: -0.5, msg: 'Teskari oldingiz: Δy / Δx = −6 / 3.' }] },
    ok: "To'g'ri: k = −6 / 3 = −2. Manfiy qiyalik — pasayish, masalan oy davomida kamayib borayotgan karta balansi.", no: 'k = Δy / Δx = −6 / 3 = −2.' } },
  { say: "Bu chiziq gorizontal: igrek umuman o'zgarmaydi. Qiyaligi qancha?", sub: 'Gorizontal chiziq',
    draw: [grid(-1, 5, -1, 5), { t: 'line', id: 'L', p: [[0, 3], [4, 3]], c: 'c' }, pt('p1', [0, 3]), pt('p2', [4, 3])],
    ask: { prompt: 'k = ?', q: { t: 'num', answer: 0 },
      ok: "To'g'ri: Δy = 0, demak k = 0 / 4 = 0. O'zgarish yo'q — qiyalik nol.", no: 'Δy = 3 − 3 = 0, k = 0 / 4 = 0.' } },
  { say: "Bu esa vertikal chiziq. Iks o'zgarmaydi — delta iks nol. Besh bo'linsin nolga — nima chiqadi?", sub: 'Vertikal chiziq: Δx = 0',
    draw: [grid(-1, 5, -1, 6), { t: 'line', id: 'L', p: [[2, 0], [2, 5]], c: 'red' }, pt('p1', [2, 0]), pt('p2', [2, 5])],
    ask: { prompt: 'k = 5 / 0 = ?', q: { t: 'choice', options: ['0', 'Juda katta son', 'Aniqlanmagan'], answer: 'Aniqlanmagan' },
      ok: "To'g'ri. 0 ga bo'lib bo'lmaydi — vertikal chiziq qiyaligi aniqlanmagan. Bu 0 emas!",
      no: "0 ga bo'lib bo'lmaydi. Vertikal chiziq qiyaligi aniqlanmagan — 0 emas: 0 qiyalik gorizontal chiziqda." } },
  { say: "Endi qo'lingiz bilan. Ikkinchi nuqtani shunday suringki, qiyalik ikkidan bir bo'lsin: o'ngga ikki yurganda bir ko'tarilsin.", sub: 'Qiyalik ½ bo\'lsin',
    draw: [grid(-1, 7, -1, 5)],
    ask: { prompt: 'Nuqtani suring: k = ½', q: { t: 'drag', fixed: [0, 0], start: [3, 3], ok: (p) => p[0] !== 0 && 2 * p[1] === p[0] },
      ok: "To'g'ri: Δy / Δx = 1/2.", no: 'Δy / Δx ½ bo\'lishi kerak: masalan (2; 1) yoki (4; 2).' } },
  { say: "Yechilgan misol. Nuqtalar: minus bir va uch, ikki va minus uch. Birinchi qadam — ko'tarilishni topamiz: minus uch minus uch, minus olti.",
    sub: 'Yechilgan misol · 1) ko\'tarilishni top',
    draw: [grid(-3, 4, -5, 5), { t: 'line', id: 'L', p: [[-1, 3], [2, -3]], c: 'a' }, pt('A', [-1, 3], 'A'), pt('B', [2, -3], 'B'),
      ...stair('t', [-1, 3], [2, -3], undefined, 'Δy = −6', undefined, [3.1, 0]), { t: 'formula', text: '1) Δy = −3 − 3 = −6' }] },
  { say: "Ikkinchi qadam — yurish. Ikki minus minus bir — bu ikki plyus bir, uch. Minusni ayirish — qo'shish.", sub: '2) yurishni top',
    draw: [{ t: 'text', id: 'tx', at: [0.5, 3.6], text: 'Δx = 3', c: 'c' }, { t: 'formula', text: '2) Δx = 2 − (−1) = 3' }] },
  { say: 'Uchinchi qadam — bo\'lamiz: minus olti bo\'linsin uch, minus ikki.', sub: '3) bo\'l', draw: [{ t: 'formula', text: '3) k = −6 / 3 = −2' }] },
  { say: "To'rtinchi qadam — tekshiruv. Chiziq pastga tushyapti, demak qiyalik manfiy bo'lishi kerak. Javob mos keldi.", sub: '4) tekshir',
    draw: [{ t: 'formula', text: '4) chiziq ↘ → k manfiy ✓' }] },
  { say: "Endi yarim yechilgan misol. Nuqtalar: minus ikki va minus bir, ikki va yetti. Ko'tarilishni toping.", sub: 'Yarim yechilgan misol',
    draw: [grid(-3, 4, -2, 8), { t: 'line', id: 'L', p: [[-2, -1], [2, 7]], c: 'a' }, pt('A', [-2, -1], 'A'), pt('B', [2, 7], 'B'), { t: 'formula', text: 'Δy = 7 − (−1) = ?' }],
    ask: { prompt: 'Δy = ?', q: { t: 'num', answer: 8, traps: [{ v: 6, msg: 'Minusni ayirish — qo\'shish: 7 − (−1) = 7 + 1 = 8.' }] },
      ok: "To'g'ri: Δy = 8.", no: 'Δy = 7 − (−1) = 7 + 1 = 8.' } },
  { say: "Yurish berilgan: to'rt. Qiyalikni toping.", sub: 'Δx = 4',
    draw: [{ t: 'formula', text: 'Δx = 2 − (−2) = 4 · k = ?' }],
    ask: { prompt: 'k = ?', q: { t: 'num', answer: 2, traps: [{ v: 0.5, msg: 'Teskari: Δy / Δx = 8 / 4.' }] }, ok: "To'g'ri: k = 8 / 4 = 2.", no: 'k = 8 / 4 = 2.' } },
  tplTwoPoints('Mashq 1/3'),
  tplTwoPoints('Mashq 2/3'),
  { say: "Grafikdan o'qing. Diqqat: igrek o'qi o'ntadan bo'lingan.", sub: 'Mashq 3/3 · grafikdan o\'qish',
    draw: [grid(-0.6, 5.5, -8, 75, { stepY: 10 }), { t: 'line', id: 'L', p: [[0, 20], [4, 60]], c: 'a' }, pt('p1', [0, 20]), pt('p2', [4, 60])],
    ask: { prompt: 'k = ?', q: { t: 'num', answer: 10,
      traps: [{ v: 1, msg: "Kataklarni sanadingiz. O'qdagi qiymatlarga qarang: bir katak — 10. Δy = 60 − 20 = 40, Δx = 4." }] },
    ok: "To'g'ri: k = (60 − 20) / (4 − 0) = 10.", no: 'k = (60 − 20) / 4 = 10.' } },
  { say: "Qisqacha xarita: chiziq ko'tarilsa qiyalik musbat, tushsa manfiy, gorizontal bo'lsa nol, vertikal bo'lsa aniqlanmagan.", sub: 'Vizual xarita',
    draw: MAP, card: '↗ k>0 · ↘ k<0 · → k=0 · ↑ aniqlanmagan' },
];

// ═══════════════ 🌳 DARAXT ═══════════════
const high = (): Step[] => {
  const tests: Step[] = [
    tplTwoPoints('Yakuniy test 1/6'),
    { say: "Chiziq minus bir va to'rt, uch va nol nuqtalaridan o'tadi. Qiyalik ishorasi qanday?", sub: 'Yakuniy test 2/6',
      draw: [grid(-2, 4, -1, 5), { t: 'line', id: 'L', p: [[-1, 4], [3, 0]], c: 'a' }, pt('p1', [-1, 4]), pt('p2', [3, 0])],
      ask: { prompt: 'k ishorasi?', q: { t: 'choice', options: ['Musbat', 'Manfiy', 'Nol'], answer: 'Manfiy' }, ok: "To'g'ri: chiziq tushadi, k = −4 / 4 = −1.", no: 'Chiziq pastga tushadi — k manfiy (−1).' } },
    { say: 'Bu chiziqning qiyaligi qancha?', sub: 'Yakuniy test 3/6',
      draw: [grid(-3, 3, -3, 4), { t: 'line', id: 'L', p: [[-1, 0], [-1, 3]], c: 'a' }, { t: 'text', id: 'tx', at: [-1.9, 3.3], text: 'x = −1', c: 'a' }],
      ask: { prompt: 'x = −1 chizig\'ining qiyaligi?', q: { t: 'choice', options: ['0', '−1', 'Aniqlanmagan'], answer: 'Aniqlanmagan' }, ok: "To'g'ri: vertikal chiziq — Δx = 0.", no: 'Vertikal chiziq — Δx = 0, qiyalik aniqlanmagan.' } },
    { say: 'Qaysi biri tikroq?', sub: 'Yakuniy test 4/6',
      ask: { prompt: 'Qaysi biri tikroq: k = −4 yoki k = 2?', q: { t: 'choice', options: ['k = −4', 'k = 2', 'Bir xil'], answer: 'k = −4' }, ok: "To'g'ri: |−4| = 4 > 2.", no: 'Tiklik |k| bilan o\'lchanadi: |−4| = 4 > 2.' } },
    tplDrag('Yakuniy test 5/6'),
    { say: "Idishga suv quyilmoqda: ikkinchi daqiqada o'n litr, oltinchi daqiqada o'ttiz litr. Qiyalik — litr daqiqasiga — qancha?", sub: 'Yakuniy test 6/6',
      draw: [grid(-0.6, 8, -4, 40, { stepY: 10, labelX: 'daq', labelY: 'litr' }), { t: 'line', id: 'L', p: [[2, 10], [6, 30]], c: 'a' }, pt('p1', [2, 10]), pt('p2', [6, 30])],
      ask: { prompt: 'k = ? (litr/daqiqa)', q: { t: 'num', answer: 5, unit: 'l/daq', traps: [{ v: 0.2, msg: 'Teskari: litrni daqiqaga bo\'lamiz — 20 / 4.' }, { v: 20, msg: 'Bu 4 daqiqadagi jami o\'sish. Bir daqiqaga: 20 / 4.' }] },
        ok: "To'g'ri: (30 − 10) / (6 − 2) = 5 litr daqiqasiga.", no: '(30 − 10) / (6 − 2) = 20 / 4 = 5.' } },
  ];
  return [
    { say: "Mustaqil masalalar. Nuqtalar: minus uch va to'rt, besh va minus ikki. Qiyalikni toping. Kasr yoki o'nli son yozishingiz mumkin.", sub: 'Masala 1 · kasr javob',
      draw: [grid(-4, 6, -3, 5), { t: 'line', id: 'L', p: [[-3, 4], [5, -2]], c: 'a' }, pt('A', [-3, 4], 'A'), pt('B', [5, -2], 'B')],
      ask: { prompt: 'A(−3; 4), B(5; −2). k = ?', q: { t: 'num', answer: -0.75,
        traps: [{ v: 0.75, msg: 'Ishora: chiziq pastga tushyapti — k manfiy.' }, { v: -4 / 3, msg: 'Teskari oldingiz: Δy / Δx = −6 / 8.' }] },
      ok: "To'g'ri: k = −6 / 8 = −3/4 = −0.75.", no: 'Δy = −2 − 4 = −6, Δx = 5 − (−3) = 8, k = −6 / 8 = −0.75.' } },
    { say: "Telefon batareyasi: soat sakkizda yuz foiz, soat o'n ikkida oltmish foiz. Qiyalik nechaga teng?", sub: 'Masala 2 · batareya',
      draw: [grid(7, 19.5, -12, 112, { stepX: 2, stepY: 20, labelX: 'soat', labelY: '%' }), { t: 'line', id: 'L', p: [[8, 100], [12, 60]], c: 'b' }, pt('p1', [8, 100], '8:00'), pt('p2', [12, 60], '12:00')],
      ask: { prompt: 'k = ? (% soatiga)', q: { t: 'num', answer: -10, unit: '%/soat', traps: [{ v: 10, msg: 'Batareya kamaymoqda — qiyalik manfiy.' }, { v: -0.1, msg: 'Teskari: Δy / Δx = −40 / 4.' }] },
        ok: "To'g'ri: k = (60 − 100) / (12 − 8) = −40 / 4 = −10% soatiga.", no: '(60 − 100) / (12 − 8) = −10% soatiga.' } },
    { say: 'Shu tezlikda batareya soat nechida nolga tushadi?', sub: 'Qiyalik kelajakni aytadi',
      draw: [pt('p3', [18, 0], '?', 'red')],
      ask: { prompt: 'Soat nechida 0%?', q: { t: 'num', answer: 18, unit: ':00',
        traps: [{ v: 6, msg: '6 soat — qancha vaqt qolgani. Savol — soat nechida: 12 + 6.' }, { v: 16, msg: 'Soat 12 dan boshlang: 60% qoldi, har soatda 10% — yana 6 soat.' }] },
        ok: "To'g'ri: 60 / 10 = 6 soat, 12 + 6 = 18:00.", no: 'Qoldi 60%, har soatda −10% → 6 soat. 12 + 6 = 18:00.' } },
    { say: "Narx uch oyda o'n ikki ming so'mdan o'n besh ming so'mga oshdi. Qiyalik — so'm oyiga — qancha?", sub: 'Masala 3 · narx',
      draw: [grid(-0.5, 4.5, 11400, 15600, { stepY: 1000, labelX: 'oy', labelY: "so'm" }), { t: 'line', id: 'L', p: [[0, 12000], [3, 15000]], c: 'c' }, pt('p1', [0, 12000]), pt('p2', [3, 15000])],
      ask: { prompt: "k = ? (so'm/oy)", q: { t: 'num', answer: 1000, unit: "so'm/oy", traps: [{ v: 3000, msg: "Bu 3 oydagi jami o'sish. Bir oyga: 3 000 / 3." }] },
        ok: "To'g'ri: (15 000 − 12 000) / 3 = 1 000 so'm oyiga.", no: '(15 000 − 12 000) / 3 = 1 000.' } },
    { say: "Bir va bir nuqtadan qiyaligi minus ikki bo'lgan chiziq o'tkazing — ikkinchi nuqtani suring.", sub: 'Masala 4 · chizing',
      draw: [grid(-3, 5, -4, 5)],
      ask: { prompt: 'Nuqtani suring: k = −2', q: { t: 'drag', fixed: [1, 1], start: [3, 3], ok: (p) => p[0] !== 1 && p[1] - 1 === -2 * (p[0] - 1) },
        ok: "To'g'ri: o'ngga 1 yursangiz, 2 ga tushadi.", no: 'k = −2: o\'ngga 1 → pastga 2. Masalan (2; −1) yoki (0; 3).' } },
    { say: 'Ikki chiziq: biri qiyaligi uch, ikkinchisi minus besh. Qaysi biri tikroq? Doskada teging.', sub: 'Masala 5 · tiklik',
      draw: [grid(-3, 3, -5, 5), { t: 'line', id: 'k3', p: [[0, 0], [1, 3]], c: 'd' }, { t: 'line', id: 'k5', p: [[0, 0], [1, -5]], c: 'b' },
        { t: 'text', id: 't3', at: [2.2, 4.3], text: 'k = 3', c: 'd' }, { t: 'text', id: 't5', at: [1.7, -4.5], text: 'k = −5', c: 'b' }],
      ask: { prompt: 'Tikroq chiziqqa teging', q: { t: 'tap', targets: ['k3', 'k5'], answer: 'k5' },
        ok: "To'g'ri: tiklik |k| ga bog'liq, ishoraga emas. |−5| = 5 > 3.", no: 'Manfiy son kichik ko\'rinadi, lekin tiklik |k| bilan o\'lchanadi: |−5| = 5 > 3.' } },
    { say: 'Xato topish. Kimdir bu chiziqning qiyaligini hisobladi. Qaysi qadamda xato bor? Qatorga teging.', sub: 'Xato topish 1',
      draw: [grid(-1, 8, -1, 7), { t: 'line', id: 'L', p: [[2, 5], [6, 1]], c: 'a' }, pt('A', [2, 5], 'A(2; 5)'), pt('B', [6, 1], 'B(6; 1)')],
      ask: { prompt: 'Xato qadamga teging', q: { t: 'steps', lines: ['1) Δy = 1 − 5 = −4', '2) Δx = 2 − 6 = −4', '3) k = −4 / −4 = 1'], wrong: 1 },
        ok: "To'g'ri: 2-qadamda tartib aralashgan. Δy da y₂ − y₁ olingan, demak Δx da ham x₂ − x₁: 6 − 2 = 4. To'g'ri javob k = −1. Tekshiruv: chiziq tushadi — k musbat chiqishi mumkin emas edi.",
        no: 'Qarang: chiziq pastga tushyapti, javob esa musbat chiqdi. Xato 2-qadamda: Δx = 6 − 2 = 4 bo\'lishi kerak.' } },
    { say: "Doskadagi yozuvga qarang: vertikal chiziq yonida k teng nol deb yozilgan. To'g'rimi?", sub: 'Xato topish 2',
      draw: [grid(-1, 5, -1, 6), { t: 'line', id: 'L', p: [[2, 0], [2, 5]], c: 'a' }, { t: 'text', id: 'tx', at: [3.4, 4], text: 'k = 0 ?', c: 'red' }],
      ask: { prompt: "Yozuv to'g'rimi?", q: { t: 'choice', options: ["Ha, to'g'ri", "Yo'q, xato"], answer: "Yo'q, xato" },
        ok: "To'g'ri: vertikal chiziq qiyaligi aniqlanmagan. k = 0 — gorizontal chiziqda.", no: 'Vertikal chiziqda Δx = 0 — qiyalik aniqlanmagan. k = 0 gorizontal chiziqqa tegishli.' } },
    { say: "Qiyalik hamma joyda. Fizikada masofa — vaqt grafigining qiyaligi — bu tezlik. Iqtisodda — daromad yoki narx qanchalik tez o'sishi. Keyingi mavzuda bu chiziqni tenglama bilan yozamiz, IT darsida esa sikl bilan chizamiz.",
      sub: 'Fizika: tezlik · Iqtisod: o\'sish sur\'ati · IT: sikl bilan chizish',
      draw: [grid(-0.6, 5.8, -30, 330, { stepY: 50, labelX: 't, soat', labelY: 's, km' }), { t: 'line', id: 'L', p: [[0, 0], [5, 300]], c: 'd' },
        ...stair('t', [2, 120], [3, 180], '1 soat', '+60 km', [2.5, 98], [3.75, 150]), { t: 'formula', text: 's–t grafigida k = tezlik = 60 km/soat' }] },
    { say: "Endi siz ustoz bo'lasiz. Menga qiyalik nima ekanini o'z so'zlaringiz bilan tushuntiring. Men qiziquvchan shogirdman — savollar beraman.", sub: "O'zing tushuntirasan",
      ask: { prompt: 'Shogirdga tushuntiring', q: { t: 'feynman' }, ok: '', no: '' } },
    ...tests,
  ];
};

export const QIYALIK: Topic2 = {
  id: 'qiyalik', title: 'Qiyalik', subject: 'Matematika · 7/12', idea: 'Qiyalik — bir narsa ikkinchisiga nisbatan qanchalik tez o\'zgarishi.',
  modes: { low, medium, high },
  recap: { say: "Eslatma: qiyalik — ko'tarilish bo'linadi yurishga. Ko'tarilsa musbat, tushsa manfiy, gorizontal — nol, vertikal — aniqlanmagan.",
    sub: 'Eslatma · 30 soniya', draw: [...MAP, { t: 'formula', text: 'k = Δy / Δx' }] },
  feynman: {
    task: "Salom! Men qiyalik haqida hech narsa bilmayman. Menga tushuntirib bera olasizmi? Bu nima va nimaga kerak?",
    core: "Qiyalik k = Δy / Δx = (y₂ − y₁) / (x₂ − x₁): x bir birlikka o'zgarganda y qanchaga o'zgarishi (shuning uchun Δx/Δy emas). "
      + "k > 0 — chiziq ko'tariladi, k < 0 — tushadi. Gorizontal chiziq: k = 0. Vertikal chiziq: Δx = 0, qiyalik aniqlanmagan (0 emas). "
      + "Tiklik |k| ga bog'liq. Misollar: masofa–vaqt grafigida tezlik, soatlik daromad, narx o'sishi.",
    checklist: [
      { point: "Ma'nosi: k = Δy / Δx — x bir birlikka o'zgarganda y qanchaga o'zgaradi (nega Δx/Δy emas)", review: "🌿 Nihol — \"Nega Δy / Δx\" qadami" },
      { point: "Ishora: k > 0 — chiziq ko'tariladi, k < 0 — tushadi", review: '🌿 Nihol — pastga tushayotgan chiziq' },
      { point: "Maxsus holatlar: gorizontal chiziq k = 0, vertikal — aniqlanmagan", review: '🌿 Nihol — gorizontal va vertikal chiziq' },
      { point: 'Hayotdan aniq misol (tezlik, daromad, narx...) va uning qiyaligi nimani bildirishi', review: "🌳 Daraxt — Ko'prik qadami" },
    ],
    followups: ['Nega Δx / Δy emas?', 'Gorizontal chiziqning qiyaligi qancha?', 'Vertikal chiziqda nima bo\'ladi?', 'Manfiy qiyalikka hayotdan misol?'],
  },
  next: 'To\'g\'ri chiziq: y = kx + b',
};

