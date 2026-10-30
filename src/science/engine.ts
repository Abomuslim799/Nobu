/**
 * engine.ts — Science bo'limining matematik va fizik "dvigateli". React'siz, sof funksiyalar:
 * simulyatsiyalar shu yerdan hisoblaydi, scripts/test_science.ts esa har push'da ularni tekshiradi
 * (formula bilan solishtirish, energiya saqlanishi va h.k.). Test o'tmasa — ilova chiqmaydi.
 */

// ── Funksiyalar (hosila va integral darslari uchun) ─────────────────────────
export interface Fn { id: string; label: string; f: (x: number) => number; df: (x: number) => number; F: (x: number) => number; xmin: number; xmax: number }
export const FUNCS: Fn[] = [
  { id: 'sq', label: 'f(x) = x²', f: (x) => x * x, df: (x) => 2 * x, F: (x) => x ** 3 / 3, xmin: -3, xmax: 3 },
  { id: 'cube', label: 'f(x) = x³ − 3x', f: (x) => x ** 3 - 3 * x, df: (x) => 3 * x * x - 3, F: (x) => x ** 4 / 4 - 1.5 * x * x, xmin: -2.5, xmax: 2.5 },
  { id: 'sin', label: 'f(x) = sin x', f: Math.sin, df: Math.cos, F: (x) => -Math.cos(x), xmin: -Math.PI, xmax: Math.PI },
  { id: 'exp', label: 'f(x) = eˣ', f: Math.exp, df: Math.exp, F: Math.exp, xmin: -2, xmax: 2 },
];
export const fnById = (id: string) => FUNCS.find((f) => f.id === id) ?? FUNCS[0];

/** Kesuvchi (sekant) qiyaligi: (f(x+h) − f(x)) / h. h → 0 da hosilaga intiladi. */
export const secantSlope = (f: (x: number) => number, x: number, h: number) => (f(x + h) - f(x)) / h;

/** Riman yig'indisi: [a,b] ni n ta to'rtburchakka bo'lib, balandlik — chap / o'rta / o'ng nuqtada. */
export function riemann(f: (x: number) => number, a: number, b: number, n: number, mode: 'left' | 'mid' | 'right' = 'mid') {
  const dx = (b - a) / n;
  let s = 0;
  const rects: { x: number; w: number; h: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const xs = mode === 'left' ? x0 : mode === 'right' ? x0 + dx : x0 + dx / 2;
    const h = f(xs);
    s += h * dx;
    rects.push({ x: x0, w: dx, h });
  }
  return { sum: s, rects };
}

// ── Vektorlar ───────────────────────────────────────────────────────────────
export interface Vec { x: number; y: number }
export const polar = (r: number, deg: number): Vec => ({ x: r * Math.cos((deg * Math.PI) / 180), y: r * Math.sin((deg * Math.PI) / 180) });
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const len = (a: Vec) => Math.hypot(a.x, a.y);
export const angleDeg = (a: Vec) => (Math.atan2(a.y, a.x) * 180) / Math.PI;
export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;

// ── Kinematika: tekis tezlanuvchan harakat ──────────────────────────────────
export const motionX = (x0: number, v0: number, a: number, t: number) => x0 + v0 * t + 0.5 * a * t * t;
export const motionV = (v0: number, a: number, t: number) => v0 + a * t;

// ── Otilgan jism (havo qarshiligisiz — analitik; qarshilik bilan — RK4) ──────
export interface Shot { v0: number; deg: number; g: number; h0?: number }
export function projectile({ v0, deg, g, h0 = 0 }: Shot) {
  const r = (deg * Math.PI) / 180;
  const vx = v0 * Math.cos(r), vy = v0 * Math.sin(r);
  const tFlight = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;      // y(t) = h0 + vy·t − g·t²/2 = 0
  return {
    vx, vy, tFlight,
    range: vx * tFlight,
    hMax: h0 + (vy * vy) / (2 * g),
    pos: (t: number) => ({ x: vx * t, y: h0 + vy * t - 0.5 * g * t * t }),
  };
}

/** Havo qarshiligi bilan (F = −k·|v|·v, m = 1) — RK4 integratsiya. Yerga tushguncha nuqtalar. */
export function projectileDrag({ v0, deg, g, h0 = 0 }: Shot, k: number, dt = 0.002) {
  const r = (deg * Math.PI) / 180;
  let s = [0, h0, v0 * Math.cos(r), v0 * Math.sin(r)];
  const der = (q: number[]) => {
    const sp = Math.hypot(q[2], q[3]);
    return [q[2], q[3], -k * sp * q[2], -g - k * sp * q[3]];
  };
  const pts: Vec[] = [{ x: s[0], y: s[1] }];
  let t = 0;
  while (s[1] >= 0 && t < 120) {
    const k1 = der(s);
    const k2 = der(s.map((v, i) => v + (dt / 2) * k1[i]));
    const k3 = der(s.map((v, i) => v + (dt / 2) * k2[i]));
    const k4 = der(s.map((v, i) => v + dt * k3[i]));
    const next = s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    if (next[1] < 0) {                       // yerga tegish nuqtasini chiziqli aniqlaymiz
      const f = s[1] / (s[1] - next[1]);
      pts.push({ x: s[0] + f * (next[0] - s[0]), y: 0 });
      t += f * dt;
      break;
    }
    s = next; t += dt;
    pts.push({ x: s[0], y: s[1] });
  }
  return { pts, range: pts[pts.length - 1].x, tFlight: t, hMax: Math.max(...pts.map((p) => p.y)) };
}

// ── Matematik mayatnik (chiziqsiz) — RK4 ────────────────────────────────────
export function pendulumStep(th: number, w: number, g: number, L: number, dt: number): [number, number] {
  const f = (a: number) => -(g / L) * Math.sin(a);
  const k1t = w, k1w = f(th);
  const k2t = w + (dt / 2) * k1w, k2w = f(th + (dt / 2) * k1t);
  const k3t = w + (dt / 2) * k2w, k3w = f(th + (dt / 2) * k2t);
  const k4t = w + dt * k3w, k4w = f(th + dt * k3t);
  return [th + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t), w + (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w)];
}
export const pendulumPeriodSmall = (g: number, L: number) => 2 * Math.PI * Math.sqrt(L / g);

// ── Yordamchi ───────────────────────────────────────────────────────────────
export const fmt = (x: number, d = 2) => (Math.abs(x) < 1e-9 ? '0' : Number(x.toFixed(d)).toString());
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** Sonli javobni tekshirish: nisbiy xato ≤ tol (yoki javob 0 bo'lsa — mutlaq). */
export function checkNumber(input: string, answer: number, tol = 0.02) {
  const v = Number(input.replace(',', '.').replace(/\s/g, ''));
  if (!Number.isFinite(v)) return false;
  return answer === 0 ? Math.abs(v) <= tol : Math.abs(v - answer) <= Math.abs(answer) * tol;
}
