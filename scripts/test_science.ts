/**
 * test_science.ts — Science bo'limi fizikasi va darslardagi javoblarni tekshiradi (CI'da, nashrdan oldin).
 * Ishga tushirish: npx esbuild scripts/test_science.ts --bundle --platform=node --outfile=/tmp/ts.js && node /tmp/ts.js
 */
import {
  checkNumber, FUNCS, motionV, motionX, pendulumPeriodSmall, pendulumStep, projectile, projectileDrag, riemann, secantSlope, polar, add, len,
} from '../src/science/engine';
import { LESSONS } from '../src/science/lessons';

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

if (fails) { console.error(`\n${fails} ta xato`); process.exit(1); }
console.log(`OK — science: ${LESSONS.length} dars, ${Object.keys(expect).length} mashq, fizika testlari o'tdi`);
