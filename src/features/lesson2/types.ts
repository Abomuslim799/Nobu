/**
 * types.ts — Farobiy metodikasi (v2) darslari: 3 rejim (low/medium/high), interaktiv doska qadamlari.
 * Sof (React'siz) — tests/run.ts tekshiradi.
 */

export type XY = [number, number];
export type Mode = 'low' | 'medium' | 'high';

/** Doska sahnasi: koordinata oralig'i va o'qlar. */
export interface Scene { x0: number; x1: number; y0: number; y1: number; stepX?: number; stepY?: number; labelX?: string; labelY?: string; axes?: boolean }

export type Act =
  | { t: 'scene'; v: Scene }                                   // doskani tozalaydi va yangi o'qlar
  | { t: 'hide'; ids: string[] }
  | { t: 'formula'; text: string }
  | { t: 'line'; id: string; p: [XY, XY]; c?: string }       // ikki nuqtadan o'tgan cheksiz chiziq (vertikal ham)
  | { t: 'seg' | 'arrow'; id: string; from: XY; to: XY; c?: string; dash?: boolean }
  | { t: 'point'; id: string; at: XY; c?: string; label?: string }
  | { t: 'text'; id: string; at: XY; text: string; c?: string };

export type Q =
  | { t: 'tap'; targets: string[]; answer: string }
  | { t: 'num'; answer: number; tol?: number; unit?: string; traps?: { v: number; msg: string }[] }
  | { t: 'choice'; options: string[]; answer: string }
  | { t: 'drag'; fixed: XY; start: XY; ok: (p: XY) => boolean }
  | { t: 'steps'; lines: string[]; wrong: number }
  | { t: 'feynman' };

export interface Ask { prompt: string; q: Q; ok: string; no: string }
/** Bitta qadam: Ustoz aytadi (say), doskada chiziladi (draw), kerak bo'lsa savol (ask). */
export interface Step { say: string; sub?: string; draw?: Act[]; ask?: Ask; card?: string; regen?: () => Step }   // regen — shablon: yangi raqamlar bilan qayta yasash

/** 🌳 sharti: Daraxt rejimida birinchi urinishda to'g'ri javoblar ulushi. */
export const MASTERY = 0.8;

/** Qadamning doskasi mustaqil bo'lishi uchun: oxirgi sahnadan shu qadamgacha chizilganlarning hammasi (xatolarni qayta ishlashda). */
export function standalone(steps: Step[], i: number): Step {
  let j = i;
  while (j > 0 && !(steps[j].draw ?? []).some((a) => a.t === 'scene')) j--;
  const hasScene = (steps[j].draw ?? []).some((a) => a.t === 'scene');
  return hasScene ? { ...steps[i], draw: steps.slice(j, i + 1).flatMap((st) => st.draw ?? []) } : steps[i];
}

/** Feynman: core — to'g'ri bilim (AI tekshirishi uchun), checklist — 4 nuqta (har biri 25 ball), review — nuqta bo'yicha qayta ko'rish joyi. */
export interface Feynman { task: string; core: string; checklist: { point: string; review: string }[]; followups: string[] }

/** AI bahosi: "BALL: 25,10,0,0" → har nuqta 0/10/25 ga yaxlitlanadi, umumiy 0–100. */
export function feynScore(reply: string, n: number): { items: number[]; total: number } | null {
  const m = reply.match(/BALL:\s*([\d,\s/]+)/i);
  if (!m) return null;
  const raw = m[1].split(/[,\s/]+/).filter(Boolean).map(Number).slice(0, n);
  if (raw.length < n) return null;
  const items = raw.map((v) => [0, 10, 25].reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)));
  return { items, total: Math.round((items.reduce((a, b) => a + b, 0) * 100) / (25 * n)) };
}
export interface Topic2 {
  id: string; title: string; subject: string; idea: string;
  modes: Record<Mode, () => Step[]>;
  recap: Step;                 // 30 soniyalik eslatma (chuqurroq rejimga qaytganda)
  feynman: Feynman;
  next?: string;               // keyingi mavzu nomi
}

export const MODE_INFO: Record<Mode, { icon: string; name: string; time: string }> = {
  low: { icon: '🌱', name: "Urug'", time: '0–5 daq' },
  medium: { icon: '🌿', name: 'Nihol', time: '5–10 daq' },
  high: { icon: '🌳', name: 'Daraxt', time: '10–20 daq' },
};
export const MODES: Mode[] = ['low', 'medium', 'high'];

/** Son kiritish: "−3/4", "-0,75", "1 000", "-6/8=-0.75", "18:00", "-10%", "40 km/soat" — hammasi son. */
export function parseNum(s: string): number | null {
  // yechim bilan yozilsa ("−6/8 = −0.75") — oxirgi "=" dan keyingi qism javob
  const t = (s.split('=').map((x) => x.trim()).filter(Boolean).pop() ?? '').replace(/[−–]/g, '-').replace(/,/g, '.').replace(/\s/g, '');
  const time = t.match(/^(\d{1,2}):(\d{2})$/);                       // soat: 18:00 → 18
  if (time) return Number(time[1]) + Number(time[2]) / 60;
  const m = t.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?(.*)$/u);
  if (!m || !/^[%\p{L}'ʻ’/.]*$/u.test(m[3])) return null;          // oxirida faqat birlik bo'lishi mumkin (%, km/soat, so'm)
  const v = m[2] !== undefined ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  return Number.isFinite(v) ? v : null;
}
export const near = (a: number, b: number, tol = 0.01) => (b === 0 ? Math.abs(a) <= tol : Math.abs(a - b) <= Math.abs(b) * tol);

/** Son javobni tekshirish: 'ok' | tuzoq izohi | 'no'. */
export function checkNum(input: string, q: Extract<Q, { t: 'num' }>): { ok: boolean; trap?: string } {
  const v = parseNum(input);
  if (v === null) return { ok: false };
  if (near(v, q.answer, q.tol)) return { ok: true };
  const trap = q.traps?.find((tr) => near(v, tr.v, 0.01));
  return { ok: false, trap: trap?.msg };
}

export const slope = (a: XY, b: XY) => (b[1] - a[1]) / (b[0] - a[0]);
