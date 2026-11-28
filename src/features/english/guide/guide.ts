/**
 * guide.ts — o'rganish qo'llanmalari (content/english/guide/all.json, manba: guide-src/*.md → scripts/make_guides.py)
 *   va har hafta kuni uchun qo'shimcha bandlar: speaking texnikasi, talaffuz, skill.
 */

import all from '@content/english/guide/all.json';

export type Block =
  | { t: 'p' | 'tip' | 'warn'; x: string }
  | { t: 'list'; items: string[] }
  | { t: 'table'; head: string[] | null; rows: string[][] }
  | { t: 'ex'; en: string; uz: string };
export interface Section { title: string; blocks: Block[] }
export interface Guide { id: string; title: string; meta: string; sections: Section[] }

const GUIDES = all as unknown as Record<string, Guide>;
export const guideOf = (id: string): Guide | undefined => GUIDES[id];
export const ALL_GUIDES = Object.values(GUIDES);

/** Daraja: 1 Asos, 2 O'rta, 3 Advanced; 0 — har doim ko'rinadi (hiylalar, xatolar, tekshiruv). */
export type Level = 0 | 1 | 2 | 3;
export function levelOf(title: string): Level {
  if (title.startsWith('🟢')) return 1;
  if (title.startsWith('🟡')) return 2;
  if (title.startsWith('🔴')) return 3;
  return 0;
}
/** lvl = 0 — hammasi; aks holda o'sha darajagacha bo'lgan bo'limlar + umumiylar. */
export const visibleSections = (g: Guide, lvl: Level) =>
  g.sections.filter((s) => { const l = levelOf(s.title); return lvl === 0 || l === 0 || l <= lvl; });

export interface DayExtra { speak: string; pron: string; skill: string }
export const DAY_EXTRA: Record<number, DayExtra> = {
  1: { speak: 'sp-story', pron: 'pr-th', skill: 'sk-listening' },
  2: { speak: 'sp-plans', pron: 'pr-vw', skill: 'sk-reading' },
  3: { speak: 'sp-advice', pron: 'pr-weak', skill: 'sk-writing' },
  4: { speak: 'sp-hypo', pron: 'pr-linking', skill: 'sk-listening' },
  5: { speak: 'sp-retell', pron: 'pr-endings', skill: 'sk-reading' },
  6: { speak: 'sp-describe', pron: 'pr-stress', skill: 'sk-writing' },
  7: { speak: 'sp-argue', pron: 'pr-intonation', skill: 'sk-review' },
};

/** "**qalin** va *kursiv*" → bo'laklar. */
export interface Span { x: string; b?: boolean; i?: boolean; s?: boolean }
export function spans(text: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*|~~(.+?)~~|\*(.+?)\*/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ x: text.slice(last, m.index) });
    if (m[1] != null) out.push({ x: m[1], b: true });
    else if (m[2] != null) out.push({ x: m[2], s: true });
    else out.push({ x: m[3], i: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ x: text.slice(last) });
  return out;
}

/** O'qish uchun taxminiy daqiqa (meta'dagi "N daq" yoki matn uzunligi). */
export function minutesOf(g: Guide): number {
  const m = g.meta.match(/(\d+)\s*daq/);
  if (m) return +m[1];
  const chars = g.sections.reduce((a, s) => a + JSON.stringify(s.blocks).length, 0);
  return Math.max(3, Math.round(chars / 900));
}
