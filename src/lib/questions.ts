/**
 * questions.ts — test savollari: matematika, geometriya, fizika (parametrli — har safar yangi sonlar)
 * va ingliz tili (so'zlar + unit grammatikasi). Har savolning qiyinligi D (FR shkalasida) bor.
 * Noto'g'ri variantlar — odatiy xatolardan (formulada 2 ni unutish, sin o'rniga cos va h.k.).
 * Sof funksiyalar: scripts/test_science.ts har generatorni tekshiradi.
 */

import { ALL_WORDS } from '@/data/vocab';
import { UNITS } from '@/data/units';
import type { Area } from './rating';

export interface Q {
  key: string;            // takrorlanmasligi uchun (2 hafta)
  area: Area;
  d: number;              // qiyinlik (FR)
  topic: string;          // "Hosila", "Vektor" ...
  q: string;
  opts: string[];
  ans: number;            // to'g'ri variant indeksi
  why: string;            // to'g'ri javobning qisqa izohi
  sec: number;            // vaqt chegarasi (soniya)
}
export type Rng = () => number;

const G = 9.81;
const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const pick = <T,>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
function shuffle<T>(r: Rng, xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Sonni chiroyli yozish: butun bo'lsa butun, aks holda `dp` xona. */
const fmt = (x: number, dp = 1) => {
  const v = Math.round(x * 10 ** dp) / 10 ** dp;
  return (Object.is(v, -0) ? 0 : v).toString();
};

/** To'g'ri javob + xato variantlar → 4 ta noyob variant (yetmasa ±% bilan to'ldiriladi). */
function numOpts(r: Rng, right: number, wrong: number[], dp = 1) {
  const R = fmt(right, dp);
  const set = new Set<string>([R]);
  for (const w of wrong) if (Number.isFinite(w) && set.size < 4) set.add(fmt(w, dp));
  const muls = [1.5, 0.5, 2, 0.75, 1.25, 3, 0.25];
  for (let i = 0; set.size < 4 && i < muls.length; i++) set.add(fmt(right * muls[i] + (right === 0 ? i + 1 : 0), dp));
  const opts = shuffle(r, [...set].slice(0, 4));
  return { opts, ans: opts.indexOf(R) };
}
function textOpts(r: Rng, right: string, wrong: string[]) {
  const uniq = [...new Set(wrong.filter((w) => w !== right))].slice(0, 3);
  const opts = shuffle(r, [right, ...uniq]);
  return { opts, ans: opts.indexOf(right) };
}

type Gen = { id: string; area: Area; d: number; make: (r: Rng) => Omit<Q, 'area' | 'd' | 'sec'> & { sec?: number } };

// ── Matematika ───────────────────────────────────────────────────────────────
const MATH: Gen[] = [
  { id: 'slope', area: 'math', d: 900, make: (r) => {
    const x1 = ri(r, -3, 2), dx = ri(r, 1, 4), k = pick(r, [-3, -2, -1, 1, 2, 3, 4]), y1 = ri(r, -4, 4);
    const x2 = x1 + dx, y2 = y1 + k * dx;
    return { key: `slope:${x1},${y1},${x2},${y2}`, topic: 'Qiyalik', q: `To'g'ri chiziq (${x1}; ${y1}) va (${x2}; ${y2}) nuqtalardan o'tadi. Qiyaligi k = ?`,
      ...numOpts(r, k, [dx / (k * dx || 1), -k, k * dx, (y2 + y1) / (x2 + x1 || 1)]), why: `k = Δy / Δx = ${k * dx} / ${dx} = ${k}` };
  } },
  { id: 'linval', area: 'math', d: 850, make: (r) => {
    const k = pick(r, [-3, -2, 2, 3, 4, 5]), b = ri(r, -6, 6), x = ri(r, -3, 4);
    return { key: `linval:${k},${b},${x}`, topic: 'Chiziqli funksiya', q: `y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. x = ${x} bo'lganda y = ?`,
      ...numOpts(r, k * x + b, [k * x - b, k + x + b, k * (x + b)]), why: `y = ${k}·(${x}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${k * x + b}` };
  } },
  { id: 'deriv-pow', area: 'math', d: 1150, make: (r) => {
    const a = ri(r, 2, 5), n = ri(r, 2, 4), x = ri(r, 1, 3);
    const right = a * n * x ** (n - 1);
    return { key: `dpow:${a},${n},${x}`, topic: 'Hosila', q: `f(x) = ${a}x${'⁰¹²³⁴⁵'[n]}. f′(${x}) = ?`,
      ...numOpts(r, right, [a * x ** n, a * n * x ** n, a * (n - 1) * x ** (n - 1), n * x ** (n - 1)]),
      why: `f′(x) = ${a * n}x${n - 1 > 1 ? '⁰¹²³⁴⁵'[n - 1] : ''} → f′(${x}) = ${right}` };
  } },
  { id: 'deriv-poly', area: 'math', d: 1250, make: (r) => {
    const a = ri(r, 1, 4), b = pick(r, [-5, -3, -2, 2, 3, 6]), c = ri(r, -5, 5), x = ri(r, -2, 3);
    const right = 2 * a * x + b;
    return { key: `dpoly:${a},${b},${c},${x}`, topic: 'Hosila', q: `f(x) = ${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}. f′(${x}) = ?`,
      ...numOpts(r, right, [a * x * x + b * x + c, 2 * a * x + b + c, a * x + b, 2 * a * x]),
      why: `f′(x) = ${2 * a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} (o'zgarmas c ning hosilasi 0) → ${right}` };
  } },
  { id: 'tangent', area: 'math', d: 1300, make: (r) => {
    const x = ri(r, -2, 3);
    return { key: `tan:${x}`, topic: 'Urinma', q: `y = x² egri chiziqqa x = ${x} nuqtada o'tkazilgan urinmaning qiyaligi?`,
      ...numOpts(r, 2 * x, [x * x, x, 2 * x * x, 2]), why: `Urinma qiyaligi = hosila: (x²)′ = 2x = ${2 * x}` };
  } },
  { id: 'integral-lin', area: 'math', d: 1350, make: (r) => {
    const k = ri(r, 1, 4), a = ri(r, 2, 6);
    return { key: `ilin:${k},${a}`, topic: 'Integral', q: `∫₀^${a} ${k === 1 ? '' : k}x dx = ? (y = ${k === 1 ? '' : k}x ostidagi yuza)`,
      ...numOpts(r, (k * a * a) / 2, [k * a * a, k * a, k / 2, (k * a) / 2]), why: `Uchburchak yuzasi: ½·${a}·${k * a} = ${fmt((k * a * a) / 2)}` };
  } },
  { id: 'integral-sq', area: 'math', d: 1450, make: (r) => {
    const a = pick(r, [1, 2, 3]);
    return { key: `isq:${a}`, topic: 'Integral', q: `∫₀^${a} x² dx = ?`,
      ...numOpts(r, a ** 3 / 3, [a ** 3, a ** 2 / 2, 2 * a, a ** 3 / 2], 2), why: `∫x² dx = x³/3 → ${a ** 3}/3 = ${fmt(a ** 3 / 3, 2)}` };
  } },
];

// ── Geometriya ───────────────────────────────────────────────────────────────
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
const SPECIAL: [string, number, string][] = [
  ['sin 30°', 0.5, '½'], ['cos 60°', 0.5, '½'], ['sin 90°', 1, '1'], ['cos 0°', 1, '1'], ['tan 45°', 1, '1'],
  ['cos 90°', 0, '0'], ['sin 0°', 0, '0'], ['sin 60°', Math.sqrt(3) / 2, '√3/2'], ['cos 30°', Math.sqrt(3) / 2, '√3/2'],
  ['sin 45°', Math.SQRT1_2, '√2/2'], ['cos 45°', Math.SQRT1_2, '√2/2'],
];
const SPECIAL_TXT = ['0', '½', '√2/2', '√3/2', '1'];
const RAD: [number, string][] = [[30, 'π/6'], [45, 'π/4'], [60, 'π/3'], [90, 'π/2'], [120, '2π/3'], [180, 'π'], [270, '3π/2'], [360, '2π']];
const GEO: Gen[] = [
  { id: 'special', area: 'geo', d: 1000, make: (r) => {
    const [name, , txt] = pick(r, SPECIAL);
    return { key: `sp:${name}`, topic: 'Birlik aylana', q: `${name} = ?`, ...textOpts(r, txt, shuffle(r, SPECIAL_TXT)),
      why: `Birlik aylanada: ${name} = ${txt}` };
  } },
  { id: 'rad', area: 'geo', d: 1050, make: (r) => {
    const [deg, txt] = pick(r, RAD);
    return { key: `rad:${deg}`, topic: 'Radian', q: `${deg}° necha radian?`, ...textOpts(r, txt, shuffle(r, RAD.map((x) => x[1]))),
      why: `180° = π → ${deg}° = ${txt}` };
  } },
  { id: 'vmag', area: 'geo', d: 1000, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES), sa = pick(r, [1, -1]), sb = pick(r, [1, -1]);
    return { key: `vm:${a * sa},${b * sb}`, topic: 'Vektor', q: `v = (${a * sa}; ${b * sb}). |v| = ?`,
      ...numOpts(r, c, [a + b, Math.abs(a * sa + b * sb), a * a + b * b, b - a]), why: `|v| = √(${a}² + ${b}²) = √${a * a + b * b} = ${c}` };
  } },
  { id: 'pyth', area: 'geo', d: 1150, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES);
    return { key: `py:${a},${b}`, topic: 'sin² + cos² = 1', q: `α — o'tkir burchak, sin α = ${a}/${c}. cos α = ?`,
      ...textOpts(r, `${b}/${c}`, [`${a}/${b}`, `${c - a}/${c}`, `${b}/${a}`, `${a}/${c}`]), why: `cos α = √(1 − sin²α) = √(1 − ${a * a}/${c * c}) = ${b}/${c}` };
  } },
  { id: 'dot', area: 'geo', d: 1150, make: (r) => {
    const a = ri(r, -3, 4), b = ri(r, 1, 4), c = ri(r, 1, 4), d = ri(r, -3, 3);
    return { key: `dot:${a},${b},${c},${d}`, topic: 'Skalyar ko\'paytma', q: `a = (${a}; ${b}), b = (${c}; ${d}). a · b = ?`,
      ...numOpts(r, a * c + b * d, [a * d + b * c, a * c - b * d, (a + c) * (b + d), a * b + c * d]), why: `a·b = ${a}·${c} + ${b}·(${d}) = ${a * c + b * d}` };
  } },
  { id: 'vcomp', area: 'geo', d: 1200, make: (r) => {
    const m = pick(r, [10, 20, 40, 50]), al = pick(r, [30, 60]), cos = al === 30;
    const vx = m * Math.cos((al * Math.PI) / 180);
    return { key: `vc:${m},${al}`, topic: 'Vektor tashkil etuvchisi', q: `|v| = ${m}, gorizontga ${al}° burchak ostida. vₓ = ?`,
      ...numOpts(r, vx, [m * Math.sin((al * Math.PI) / 180), m / 2 === vx ? m : m / 2, m, m * Math.SQRT1_2]),
      why: `vₓ = |v|·cos ${al}° = ${m}·${cos ? '√3/2' : '½'} ≈ ${fmt(vx)}` };
  } },
];

// ── Fizika ───────────────────────────────────────────────────────────────────
const PHYS: Gen[] = [
  { id: 'kmh', area: 'phys', d: 900, make: (r) => {
    const v = pick(r, [18, 36, 54, 72, 90, 108, 144]);
    return { key: `kmh:${v}`, topic: 'Birliklar', q: `${v} km/soat necha m/s?`, ...numOpts(r, v / 3.6, [v * 3.6, v / 60, v / 3, v / 10]),
      why: `1 km/soat = 1000 m / 3600 s → ${v} / 3,6 = ${fmt(v / 3.6, 0)} m/s` };
  } },
  { id: 'uniform', area: 'phys', d: 950, make: (r) => {
    const v = pick(r, [5, 12, 15, 20, 25]), t = ri(r, 4, 12);
    return { key: `uni:${v},${t}`, topic: 'Tekis harakat', q: `Jism ${v} m/s tezlik bilan ${t} s tekis harakatlandi. Bosib o'tgan yo'li (m)?`,
      ...numOpts(r, v * t, [v + t, v / t, (v * t) / 2]), why: `s = v·t = ${v}·${t} = ${v * t} m` };
  } },
  { id: 'stoptime', area: 'phys', d: 1050, make: (r) => {
    const a = pick(r, [2, 3, 4, 5]), v = a * ri(r, 3, 8);
    return { key: `st:${v},${a}`, topic: 'Tormozlanish', q: `Mashina ${v} m/s tezlikda, tormoz sekinlanishi ${a} m/s². To'xtashigacha necha soniya?`,
      ...numOpts(r, v / a, [v * a, a / v, (v * v) / (2 * a), v / (2 * a)]), why: `t = v / a = ${v} / ${a} = ${fmt(v / a)} s` };
  } },
  { id: 'accel', area: 'phys', d: 1150, make: (r) => {
    const v0 = pick(r, [0, 2, 4, 5]), a = pick(r, [1, 2, 3, 4]), t = ri(r, 2, 6);
    const s = v0 * t + (a * t * t) / 2;
    return { key: `acc:${v0},${a},${t}`, topic: 'Tezlanuvchan harakat', q: `v₀ = ${v0} m/s, a = ${a} m/s², t = ${t} s. Yo'l s (m) = ?`,
      ...numOpts(r, s, [v0 * t + a * t * t, v0 * t + a * t, (v0 + a * t) * t, (a * t * t) / 2 + v0]), why: `s = v₀t + at²/2 = ${v0 * t} + ${fmt((a * t * t) / 2)} = ${fmt(s)} m` };
  } },
  { id: 'fall', area: 'phys', d: 1200, make: (r) => {
    const h = pick(r, [5, 20, 45, 80, 125]);
    const t = Math.sqrt((2 * h) / G);
    return { key: `fall:${h}`, topic: 'Erkin tushish', q: `Tosh ${h} m balandlikdan boshlang'ich tezliksiz tushdi. Tushish vaqti (s)? (g = 9,81)`,
      ...numOpts(r, t, [Math.sqrt(h / G), (2 * h) / G, h / G, Math.sqrt(2 * h)]), why: `h = gt²/2 → t = √(2h/g) = √(${2 * h}/9,81) ≈ ${fmt(t)} s` };
  } },
  { id: 'stopdist', area: 'phys', d: 1300, make: (r) => {
    const v = pick(r, [10, 15, 20, 30]), a = pick(r, [4, 5, 6, 8]);
    return { key: `sd:${v},${a}`, topic: 'Tormoz yo\'li', q: `v = ${v} m/s, sekinlanish ${a} m/s². Tormoz yo'li (m)?`,
      ...numOpts(r, (v * v) / (2 * a), [(v * v) / a, v / a, (v * a) / 2, (v * v) / (4 * a)]), why: `s = v² / (2a) = ${v * v} / ${2 * a} = ${fmt((v * v) / (2 * a))} m` };
  } },
  { id: 'pend', area: 'phys', d: 1300, make: (r) => {
    const L = pick(r, [0.25, 0.5, 1, 2, 4]);
    const T = 2 * Math.PI * Math.sqrt(L / G);
    return { key: `pend:${L}`, topic: 'Mayatnik', q: `Uzunligi ${fmt(L, 2)} m bo'lgan mayatnikning tebranish davri (s)? (kichik burchak, g = 9,81)`,
      ...numOpts(r, T, [2 * Math.PI * Math.sqrt(G / L), Math.PI * Math.sqrt(L / G), 2 * Math.PI * (L / G), Math.sqrt(L / G)], 2),
      why: `T = 2π√(L/g) = 2π√(${fmt(L, 2)}/9,81) ≈ ${fmt(T, 2)} s` };
  } },
  { id: 'range', area: 'phys', d: 1400, make: (r) => {
    const v = pick(r, [10, 15, 20, 25]), al = pick(r, [15, 30, 45, 60]);
    const s2 = Math.sin((2 * al * Math.PI) / 180), L = (v * v * s2) / G;
    return { key: `rng:${v},${al}`, topic: 'Otilgan jism', q: `v₀ = ${v} m/s, α = ${al}°. Uchish masofasi (m)? (havo qarshiligisiz, g = 9,81)`,
      ...numOpts(r, L, [(v * v) / G, (v * v * Math.sin((al * Math.PI) / 180)) / G, (v * v * s2) / (2 * G), (v * s2) / G]),
      why: `L = v₀²·sin 2α / g = ${v * v}·${fmt(s2, 3)} / 9,81 ≈ ${fmt(L)} m` };
  } },
  { id: 'hmax', area: 'phys', d: 1450, make: (r) => {
    const v = pick(r, [10, 20, 30]), al = pick(r, [30, 45, 60, 90]);
    const s = Math.sin((al * Math.PI) / 180), H = (v * v * s * s) / (2 * G);
    return { key: `hm:${v},${al}`, topic: 'Otilgan jism', q: `v₀ = ${v} m/s, α = ${al}°. Eng katta balandlik (m)? (g = 9,81)`,
      ...numOpts(r, H, [(v * v * s) / (2 * G), (v * v * s * s) / G, (v * v) / (2 * G), (v * s) / G]),
      why: `H = v₀²·sin²α / (2g) ≈ ${fmt(H)} m` };
  } },
];

// ── Ingliz tili ──────────────────────────────────────────────────────────────
const LEVEL_D: Record<string, number> = { A2: 950, 'A2+': 1050, B1: 1200, 'B1+': 1320, B2: 1500, 'B2+': 1620, C1: 1800 };
const unitD = (lvl: string) => LEVEL_D[lvl.replace(/\s/g, '')] ?? 1400;
const UNIT_LVL: Record<string, number> = Object.fromEntries(UNITS.map((u) => [u.id, unitD(u.level)]));
/** So'z qiyinligi: Core to'plamlari 800 (eng ko'p ishlatiladigan) → 1500 (B2), movie — unit darajasi. */
function wordD(deck: string) {
  const m = /^ng(\d+)$/.exec(deck);
  if (m) return 800 + (Number(m[1]) - 1) * 50;
  return UNIT_LVL[deck] ?? 1300;
}
const WORDS = ALL_WORDS.filter((w) => w.translation && w.word && !/\s{2,}/.test(w.word));

function vocabQ(r: Rng, target: number): Q {
  // maqsad qiyinligiga yaqin so'zlardan tanlaymiz
  const pool = WORDS.filter((w) => Math.abs(wordD(w.deck) - target) <= 150);
  const w = pick(r, pool.length >= 8 ? pool : WORDS);
  const d = wordD(w.deck);
  const same = WORDS.filter((x) => x.deck === w.deck && x.id !== w.id);
  const others = shuffle(r, same.length >= 3 ? same : WORDS).slice(0, 6);
  const kind = pick(r, ['en-uz', 'uz-en', 'cloze'] as const);
  const ex = w.cloze ?? w.word;
  if (kind === 'cloze' && w.example && w.example.toLowerCase().includes(ex.toLowerCase())) {
    const gap = w.example.replace(new RegExp(ex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____');
    return { key: `en:c:${w.id}`, area: 'en', d: d + 120, topic: "So'z (gapda)", q: gap, sec: 25,
      ...textOpts(r, ex, others.map((o) => o.cloze ?? o.word)), why: `${w.word} — ${w.translation}` };
  }
  if (kind === 'uz-en') {
    return { key: `en:r:${w.id}`, area: 'en', d: d + 80, topic: "So'z", q: `«${w.translation}» inglizchasi?`, sec: 20,
      ...textOpts(r, w.word, others.map((o) => o.word)), why: `${w.word} — ${w.translation}` };
  }
  return { key: `en:v:${w.id}`, area: 'en', d, topic: "So'z", q: `${w.word} — ma'nosi?`, sec: 20,
    ...textOpts(r, w.translation, others.map((o) => o.translation)), why: w.example ? `${w.example}` : `${w.word} — ${w.translation}` };
}

const GRAMMAR = UNITS.flatMap((u) => u.grammar.exercises.map((e, i) => ({ u, e, i })));
function grammarQ(r: Rng, target: number): Q {
  const pool = GRAMMAR.filter((g) => Math.abs(unitD(g.u.level) - target) <= 200);
  const { u, e, i } = pick(r, pool.length >= 5 ? pool : GRAMMAR);
  const opts = shuffle(r, e.options);
  return { key: `en:g:${u.id}:${i}`, area: 'en', d: unitD(u.level), topic: `Grammatika · ${u.grammar.title}`, q: e.q, sec: 30,
    opts, ans: opts.indexOf(e.answer), why: e.why };
}

// ── Yig'ish ──────────────────────────────────────────────────────────────────
export const GENS: Record<'math' | 'geo' | 'phys', Gen[]> = { math: MATH, geo: GEO, phys: PHYS };
const SEC: Record<string, number> = { math: 60, geo: 45, phys: 75 };

export function makeQ(area: Area, r: Rng, target: number, seen: Record<string, number> = {}, now = Date.now()): Q {
  const fresh = (k: string) => !seen[k] || now - seen[k] > 14 * 86_400_000;
  for (let tries = 0; ; tries++) {
    let q: Q;
    if (area === 'en') q = r() < 0.35 ? grammarQ(r, target) : vocabQ(r, target);
    else {
      const gens = GENS[area as 'math' | 'geo' | 'phys'];
      // maqsadga eng yaqin 3 generatordan biri
      const near = [...gens].sort((a, b) => Math.abs(a.d - target) - Math.abs(b.d - target)).slice(0, 3);
      const g = pick(r, near);
      const x = g.make(r);
      q = { sec: SEC[area], ...x, area, d: g.d };
    }
    if (fresh(q.key) || tries >= 12) return q;
  }
}

/** Kunlik test: 10 savol (ingliz 4, matematika 2, geometriya 2, fizika 2), oson — reytingdan biroz past. */
const DAILY_PLAN: Area[] = ['en', 'math', 'en', 'geo', 'phys', 'en', 'math', 'geo', 'en', 'phys'];
export function dailyTest(r: Rng, fr: Record<Area, { r: number }>, seen: Record<string, number> = {}, disabled: Area[] = []) {
  const plan = DAILY_PLAN.filter((a) => !disabled.includes(a));
  const keys = new Set<string>(), topics = new Set<string>();
  return plan.map((a) => {
    let q = makeQ(a, r, fr[a].r - 120, seen);
    for (let i = 0; (keys.has(q.key) || (a !== 'en' && topics.has(q.topic))) && i < 10; i++) q = makeQ(a, r, fr[a].r - 120, seen);
    keys.add(q.key); topics.add(q.topic);
    return q;
  });
}

/** Kunlik test o'sha kun uchun bir xil bo'lsin (ilovani yopib ochsa ham) — sanadan urug'. */
export function seeded(seed: string): Rng {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
