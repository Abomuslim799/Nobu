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
export interface Step { say: string; sub?: string; draw?: Act[]; ask?: Ask; card?: string }

export interface Feynman { task: string; checklist: string[]; followups: string[] }
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

/** Son kiritish: "−3/4", "-0,75", "1 000", "-6/8=-0.75" — hammasi son. */
export function parseNum(s: string): number | null {
  // "−6/8 = −0.75" kabi yechim bilan yozilsa — oxirgi "=" dan keyingi qism javob
  const t = (s.split('=').map((x) => x.trim()).filter(Boolean).pop() ?? '').replace(/[−–]/g, '-').replace(/,/g, '.').replace(/\s/g, '');
  if (!t) return null;
  const m = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  const v = m ? Number(m[1]) / Number(m[2]) : Number(t);
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
