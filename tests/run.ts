/**
 * run.ts — mantiq testlari (CI'da, har nashrdan oldin): fizika, darslar javoblari, test savollari, FR/XP, xotira ko'chirishi, sana.
 * Ishga tushirish: npm test
 */
import {
  checkNumber, FUNCS, motionV, motionX, pendulumPeriodSmall, pendulumStep, projectile, projectileDrag, riemann, secantSlope, polar, add, len,
} from '@/features/science/engine';
import { LESSONS } from '@/features/science/lessons';
import { sayText } from '@/features/science/speech';
import m0b from '@content/science/boards/m0.json';
import m1b from '@content/science/boards/m1.json';
import { GENS, makeQ, dailyTest, seeded } from '@/features/assessment/questions';
import { KEYS, legacyTarget } from '@/core/keys';
import { addDays, lastDays } from '@/core/date';
import { update, START, dayXP, streakBonus, overall, rankOf } from '@/features/assessment/rating';
import { TOPICS2 } from '@/features/lesson2/topics';
import { MODES, parseNum, slope, type XY } from '@/features/lesson2/types';
const BOARDS: Record<string, { steps: { say: string; draw: { t: string; ids?: string[]; id?: string }[] }[] }> = { m0: m0b, m1: m1b };

let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fails++; console.error('✗ ' + msg); } };
const near = (a: number, b: number, rel: number, msg: string, abs = 1e-9) => ok(Math.abs(a - b) <= Math.abs(b) * rel + abs, `${msg}: ${a} ≠ ${b}`);
const g = 9.81;

// 1) Hosila: h → 0 da kesuvchi qiyaligi hosilaga yaqinlashadi (hamma funksiya, bir necha nuqta)
for (const f of FUNCS) for (const x of [-1.2, 0, 0.7, 1.5]) near(secantSlope(f.f, x, 1e-6), f.df(x), 1e-4, `hosila ${f.id} x=${x}`, 1e-5);
// 2) Integral: n katta bo'lganda Riman yig'indisi aniq integralga teng; F′ = f
for (const f of FUNCS) {
  near(riemann(f.f, 0, 2, 4000, 'mid').sum, f.F(2) - f.F(0), 1e-5, `integral ${f.id}`);
  for (const x of [-1, 0.3, 1.1]) near(secantSlope(f.F, x, 1e-6), f.f(x), 1e-4, `F′=f ${f.id}`, 1e-5);
}
// 3) Vektorlar
const s = add(polar(3, 0), polar(4, 90)); near(len(s), 5, 1e-9, 'vektor 3-4-5');
// 4) Kinematika: x(t) hosilasi = v(t)
for (const t of [0, 1.3, 4]) near((motionX(0, 4, -2, t + 1e-6) - motionX(0, 4, -2, t)) / 1e-6, motionV(4, -2, t), 1e-4, `x′=v t=${t}`);
// 5) Otilgan jism: analitik vs RK4 (k=0) va formulalar
for (const deg of [15, 30, 45, 60, 80]) {
  const p = projectile({ v0: 20, deg, g });
  near(p.range, (400 * Math.sin((2 * deg * Math.PI) / 180)) / g, 1e-9, `L formula ${deg}`);
  near(p.pos(p.tFlight).y + 1, 1, 1e-9, `yerga tushish ${deg}`);
  const d = projectileDrag({ v0: 20, deg, g }, 0);
  near(d.range, p.range, 2e-3, `RK4 k=0 masofa ${deg}`);
  near(d.hMax, p.hMax, 2e-3, `RK4 k=0 balandlik ${deg}`);
}
near(projectile({ v0: 20, deg: 30, g }).range, projectile({ v0: 20, deg: 60, g }).range, 1e-9, '30° = 60°');
// Havo qarshiligi: masofa kamayadi va eng yaxshi burchak < 45°
const best = [30, 35, 40, 45, 50].map((d) => ({ d, r: projectileDrag({ v0: 30, deg: d, g }, 0.02).range })).sort((a, b) => b.r - a.r)[0];
ok(best.d < 45, `qarshilik bilan eng yaxshi burchak ${best.d}`);
ok(projectileDrag({ v0: 30, deg: 45, g }, 0.02).range < projectile({ v0: 30, deg: 45, g }).range, 'qarshilik masofani kamaytiradi');
// 6) Mayatnik: kichik burchakda davr formulaga mos, energiya saqlanadi, katta burchakda davr uzunroq
function period(L: number, deg: number) {
  let th = (deg * Math.PI) / 180, w = 0, t = 0, last = 0; const dt = 1e-4; const ps: number[] = [];
  const E0 = 0.5 * L * L * w * w + g * L * (1 - Math.cos(th)); let maxDE = 0;
  while (ps.length < 3 && t < 60) {
    const pw = w; [th, w] = pendulumStep(th, w, g, L, dt); t += dt;
    maxDE = Math.max(maxDE, Math.abs(0.5 * L * L * w * w + g * L * (1 - Math.cos(th)) - E0) / E0);
    if (pw > 0 && w <= 0) { ps.push(t - last); last = t; }
  }
  return { T: ps[ps.length - 1], maxDE };
}
for (const L of [0.25, 1, 2]) { const r = period(L, 5); near(r.T, pendulumPeriodSmall(g, L), 2e-3, `mayatnik T L=${L}`); ok(r.maxDE < 1e-6, `energiya L=${L}: ${r.maxDE}`); }
const big = period(1, 160).T / pendulumPeriodSmall(g, 1); ok(big > 1.9 && big < 2.2, `160° davr nisbati ${big}`);
// Simulyatsiyadagi kabi katta qadam (60 fps, 20 bo'lak): energiya baribir saqlanadi
{ let th = 2.8, w = 0; const E0 = g * (1 - Math.cos(th)); for (let i = 0; i < 60 * 60 * 20; i++) [th, w] = pendulumStep(th, w, g, 1, 1 / 1200);
  ok(Math.abs(0.5 * w * w + g * (1 - Math.cos(th)) - E0) / E0 < 1e-3, 'mayatnik 1 daqiqa energiya'); }

// 7) Darslar: tuzilish va sonli javoblar mustaqil hisob bilan
const expect: Record<string, number> = {
  'm0-1': 3, 'm0-2': (8 - 2) / (3 - 1), 'm0-3': 120 / 2,
  'm1-1': (3.1 ** 2 - 9) / 0.1, 'm1-2': 10 * 2 - 4, 'm1-3': 8 * 3, 'm1-4': Math.cos(0),
  'm2-1': 9, 'm2-2': 2 ** 3, 'm2-3': riemann((x) => x * x, 0, 2, 2, 'left').sum,
  'g1-1': Math.sin((210 * Math.PI) / 180), 'g1-2': Math.PI / 2, 'g1-3': Math.cos((300 * Math.PI) / 180), 'g1-4': Math.sqrt(1 - 0.36),
  'g2-1': 5 * Math.cos((53.13 * Math.PI) / 180), 'g2-2': len({ x: 4, y: 3 }), 'g2-3': Math.hypot(6, 8), 'g2-4': polar(20, 60).y,
  'f1-1': motionX(0, 0, 3, 4), 'f1-2': (72 * 1000) / 3600, 'f1-3': 20 / 5, 'f1-4': motionX(0, 20, -5, 4),
  'f2-1': projectile({ v0: 20, deg: 30, g }).tFlight, 'f2-2': projectile({ v0: 15, deg: 45, g }).range,
  'f2-3': projectile({ v0: 2, deg: 0, g, h0: 1.25 }).range,
  'f3-1': pendulumPeriodSmall(g, 0.25), 'f3-2': g * (3 / (2 * Math.PI)) ** 2, 'f3-3': pendulumPeriodSmall(1.62, 1),
};
const ids = new Set<string>();
for (const l of LESSONS) {
  ok(!ids.has(l.id), `takror dars ${l.id}`); ids.add(l.id);
  for (const n of l.needs ?? []) ok(LESSONS.some((x) => x.id === n), `${l.id}: yo'q dars ${n}`);
  for (const b of l.blocks) {
    if (b.k === 'predict' || b.k === 'choice') ok(b.options.includes(b.answer), `${l.id}: javob variantlarda yo'q — ${b.q}`);
    if (b.k === 'sim') ok(['slope', 'derivative', 'integral', 'unitcircle', 'vectors', 'motion', 'projectile', 'pendulum'].includes(b.id), `${l.id}: sim ${b.id}`);
    if (b.k === 'board') {
      const bd = BOARDS[b.id]; ok(!!bd, `${l.id}: doska ${b.id} yo'q`);
      if (bd) { const seen = new Set<string>(); for (const st of bd.steps) { ok(st.say.length > 10 && !/[²³√Δπθ]/.test(st.say), `doska ${b.id}: ovoz matnida belgi (o'qilmaydi): ${st.say.slice(0, 40)}`);
        for (const a of st.draw) { if (a.id) seen.add(a.id); for (const h of a.ids ?? []) ok(seen.has(h), `doska ${b.id}: yashiriladigan '${h}' hali chizilmagan`); } } }
    }
    if (b.k === 'ex') {
      ok(b.id in expect, `${b.id}: mustaqil tekshiruv yo'q`);
      if (b.id in expect) {
        ok(checkNumber(String(expect[b.id]), b.answer, b.tol ?? 0.02), `${b.id}: javob ${b.answer}, hisob ${expect[b.id]}`);
        ok(checkNumber(String(Number(expect[b.id].toFixed(2))), b.answer, b.tol ?? 0.02), `${b.id}: 2 xonali javob qabul qilinmaydi (tol juda kichik)`);
      }
    }
  }
}
ok(checkNumber('6,1', 6.1, 0.003) && !checkNumber('6.3', 6.1, 0.003) && !checkNumber('abc', 1), 'checkNumber');

// Ovoz matni: o'zbekcha so'zlar buzilmasin, oʻ/gʻ to'g'ri, yolg'iz harflar nomi bilan
ok(sayText("yaxshi xona yo'l") === 'yaxshi xona yoʻl', `sayText 1: ${sayText("yaxshi xona yo'l")}`);
ok(sayText("Δy bo'linsin x") === 'delta igrek boʻlinsin iks', `sayText 2: ${sayText("Δy bo'linsin x")}`);
ok(sayText("ma'no") === 'maʼno', 'sayText 3');

// Test savollari: har generator 40 marta — 4 ta noyob variant, to'g'ri javob ichida, son cheksiz emas
{
  const r = seeded('test');
  for (const [area, gens] of Object.entries(GENS)) for (const g of gens) for (let i = 0; i < 40; i++) {
    const x = g.make(r);
    ok(x.opts.length === 4 && new Set(x.opts).size === 4, `${area}/${g.id}: variantlar ${x.opts}`);
    ok(x.ans >= 0 && x.ans < 4, `${area}/${g.id}: javob yo'q ${x.q} ${x.opts}`);
    ok(x.opts.every((o) => !/NaN|Infinity|undefined/.test(o)), `${area}/${g.id}: ${x.opts}`);
  }
  for (let i = 0; i < 200; i++) {
    const q = makeQ('en', r, 800 + (i % 10) * 100);
    ok(q.opts.length >= 2 && q.ans >= 0 && new Set(q.opts).size === q.opts.length, `en: ${q.key} ${q.q} ${q.opts}`);
  }
  const t = dailyTest(seeded('2026-11-01'), START);
  ok(t.length === 10 && new Set(t.map((q) => q.key)).size === 10, 'kunlik test 10 noyob savol');
  ok(JSON.stringify(dailyTest(seeded('d'), START).map((q) => q.key)) === JSON.stringify(dailyTest(seeded('d'), START).map((q) => q.key)), 'kunlik test bir kunda bir xil');
}
// FR va XP
{
  const a = update(START.math, 1000, 1, 'daily');
  ok(a.r > 1000 && a.r < 1011, `FR o'sishi ${a.r}`);
  ok(update(START.math, 1000, 0, 'daily').r < 1000, 'FR tushishi');
  ok(dayXP(4) === 0 && dayXP(5) === 1 && dayXP(19) === 1 && dayXP(20) === 2 && dayXP(35) === 5, 'dayXP');
  ok(streakBonus(1) === 5 && streakBonus(3) === 10 && streakBonus(7) === 15 && streakBonus(14) === 20 && streakBonus(30) === 20 && streakBonus(2) === 0, 'streakBonus');
  ok(overall(START) === 1067 && overall({ ...START, math: { ...START.math, r: 900 } }) < 1067 && rankOf(1250).title === 'Mutaallim', `overall/rank ${overall(START)}`);
}

// Xotira: eski kalitlar yangisiga to'g'ri ko'chadi, yangilari tegilmaydi
{
  ok(legacyTarget('dojo.progress.v1') === KEYS.progress && legacyTarget('nobu.meta.v1') === KEYS.rating, 'migratsiya: asosiy omborlar');
  ok(legacyTarget('nobu.sync.config') === KEYS.server && legacyTarget('dojo.rate') === KEYS.speakRate, 'migratsiya: sozlamalar');
  ok(legacyTarget('nobu.sci.pos.m1') === KEYS.sciPos('m1') && legacyTarget('nobu.writing.fg1') === KEYS.writing('fg1'), 'migratsiya: dars joyi, yozuv');
  ok(legacyTarget('nobu.brain.chess.v1') === KEYS.chess && legacyTarget('nobu.tts.v1') === KEYS.tts, 'migratsiya: miya, ovoz');
  ok(legacyTarget(KEYS.progress) === null && legacyTarget('boshqa') === null, 'migratsiya: yangi kalitga tegmaydi');
  const all = Object.values(KEYS).map((v) => (typeof v === 'string' ? v : v('x')));
  ok(all.every((k) => k.startsWith('farobiy.')) && new Set(all).size === all.length, 'kalitlar: farobiy. va takrorsiz');
}

// v2 darslar: kasr/minus kiritish; har savol to'g'ri tuzilgan (javob variantlarda, tap nishoni doskada, drag boshida javob emas);
// shablon mashqlarda javob = chizilgan nuqtalar qiyaligi
ok(parseNum('−3/4') === -0.75 && parseNum('-0,75') === -0.75 && parseNum('1 000') === 1000 && parseNum('abc') === null && parseNum('-6/8=-0.75') === -0.75
  && parseNum('18:00') === 18 && parseNum('−10%') === -10 && parseNum('40 km/soat') === 40 && parseNum("1 000 so'm") === 1000 && parseNum('6/8-1') === null, 'parseNum');
for (const t of Object.values(TOPICS2)) for (const m of MODES) for (let rep = 0; rep < 25; rep++) {
  const steps = [t.recap, ...t.modes[m]()];
  let ids = new Set<string>();
  steps.forEach((st, k) => {
    for (const a of st.draw ?? []) { if (a.t === 'scene') ids = new Set(); else if ('id' in a) ids.add(a.id); }
    const q = st.ask?.q, w = `${t.id}/${m}/${k}`;
    if (!q) return;
    if (q.t === 'choice') ok(q.options.includes(q.answer), `${w}: variant`);
    if (q.t === 'tap') ok(q.targets.includes(q.answer) && q.targets.every((x) => ids.has(x)), `${w}: tap nishon`);
    if (q.t === 'drag') ok(!q.ok(q.start), `${w}: drag boshida javob`);
    if (q.t === 'steps') ok(q.wrong >= 0 && q.wrong < q.lines.length, `${w}: xato qadam`);
    if (q.t === 'num') {
      ok(Number.isFinite(q.answer) && !(q.traps ?? []).some((tr) => tr.v === q.answer), `${w}: son/tuzoq`);
      const pts = (st.draw ?? []).filter((a) => a.t === 'point' && (a.id === 'A' || a.id === 'B')).map((a) => (a as { at: XY }).at);
      if (/^(Mashq|Yakuniy test 1)/.test(st.sub ?? '') && pts.length === 2) near(slope(pts[0], pts[1]), q.answer, 1e-9, `${w}: shablon qiyalik`);
    }
  });
}
// Sana
ok(addDays('2026-02-28', 1) === '2026-03-01' && addDays('2026-01-01', -1) === '2025-12-31', 'addDays oy/yil');
ok(lastDays(3, '2026-11-02').join() === '2026-10-31,2026-11-01,2026-11-02', 'lastDays');

if (fails) { console.error(`\n${fails} ta xato`); process.exit(1); }
console.log(`OK — ${LESSONS.length} dars, ${Object.keys(expect).length} mashq; fizika, savollar, FR, xotira, sana testlari o'tdi`);
