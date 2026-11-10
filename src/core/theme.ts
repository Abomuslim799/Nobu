/**
 * theme.ts — Nobu ranglari: Samarqand gumbazlari — lojuvard (tun) va feruza; oltin faqat yutuqlar uchun.
 * Telefonning tun/kun sozlamasiga qarab tanlanadi (ilova ochilganda). Sozlama o'zgarsa — ilova qayta yuklanadi
 * (_layout.tsx), shuning uchun barcha StyleSheet'lar to'g'ri rangni oladi.
 */

import { getSync, setSync } from '@/core/theme-store';

const TUN = {
  bg: '#0A1220',
  card: '#14223A',
  cardBorder: 'rgba(120,170,220,0.16)',
  surface2: '#1B2C47',
  text: '#EAF1F7',
  dim: '#8FA3B8',
  green: '#35D0C2',          // asosiy rang (feruza) — eski nom saqlandi
  greenSoft: 'rgba(53,208,194,0.16)',
  onAccent: '#062A28',       // feruza ustidagi matn
  red: '#F87171',
  redSoft: 'rgba(248,113,113,0.16)',
  good: '#4ADE80',
  fire: '#E8B84A',           // oltin: XP, streak, daraja
  gold: '#E8B84A',
  goldSoft: 'rgba(232,184,74,0.16)',
  codeBg: '#0F1A2C',
  subtle: 'rgba(255,255,255,0.06)',
  subtle2: 'rgba(255,255,255,0.12)',
  simBg: '#0E1A24',
  chalk: '#0C2A26',
};

const KUN: typeof TUN = {
  bg: '#F4F7F8',
  card: '#FFFFFF',
  cardBorder: 'rgba(19,60,80,0.12)',
  surface2: '#EAF0F2',
  text: '#102030',
  dim: '#5E7180',
  green: '#0E8C86',
  greenSoft: 'rgba(14,140,134,0.12)',
  onAccent: '#FFFFFF',
  red: '#DC4B4B',
  redSoft: 'rgba(220,75,75,0.12)',
  good: '#15A34A',
  fire: '#B7861A',
  gold: '#B7861A',
  goldSoft: 'rgba(183,134,26,0.14)',
  codeBg: '#EEF3F5',
  subtle: 'rgba(16,32,48,0.05)',
  subtle2: 'rgba(16,32,48,0.10)',
  simBg: '#F7FAFB',
  chalk: '#13403A',
};

/** Uch to'q mavzu (foydalanuvchi tanlaydi) — nafis: urg'u rangi faqat urg'u uchun, nozik chegaralar. */
const SAMARQAND: typeof TUN = {
  ...TUN, bg: '#0B1020', card: '#141B30', cardBorder: 'rgba(255,255,255,0.07)', surface2: '#1C2540', text: '#ECE7DC', dim: '#8C96AD',
  green: '#2FC6C0', greenSoft: 'rgba(47,198,192,0.14)', onAccent: '#06201F', red: '#F07A7A', redSoft: 'rgba(240,122,122,0.14)', good: '#6BD49A',
  fire: '#E3B860', gold: '#E3B860', goldSoft: 'rgba(227,184,96,0.15)', codeBg: '#0E1426', subtle: 'rgba(255,255,255,0.05)', subtle2: 'rgba(255,255,255,0.10)',
  simBg: '#0E1528', chalk: '#0C2A2A',
};
const LOJUVARD: typeof TUN = {
  ...TUN, bg: '#090D18', card: '#121A2C', cardBorder: 'rgba(255,255,255,0.07)', surface2: '#1A2440', text: '#E9EDF5', dim: '#8792AA',
  green: '#6E97FF', greenSoft: 'rgba(110,151,255,0.15)', onAccent: '#0A1430', red: '#F07A7A', redSoft: 'rgba(240,122,122,0.14)', good: '#6BD49A',
  fire: '#D9B36A', gold: '#D9B36A', goldSoft: 'rgba(217,179,106,0.15)', codeBg: '#0C1222', subtle: 'rgba(255,255,255,0.05)', subtle2: 'rgba(255,255,255,0.10)',
  simBg: '#0C1324', chalk: '#101C3A',
};
const KOMIR: typeof TUN = {
  ...TUN, bg: '#0E0E11', card: '#17171C', cardBorder: 'rgba(255,255,255,0.07)', surface2: '#212128', text: '#EDE6DA', dim: '#8E8A84',
  green: '#D98A5F', greenSoft: 'rgba(217,138,95,0.15)', onAccent: '#2A140A', red: '#E9776E', redSoft: 'rgba(233,119,110,0.14)', good: '#8FB8A3',
  fire: '#D9B07A', gold: '#D9B07A', goldSoft: 'rgba(217,176,122,0.15)', codeBg: '#131316', subtle: 'rgba(255,255,255,0.05)', subtle2: 'rgba(255,255,255,0.10)',
  simBg: '#141418', chalk: '#23201C',
};
export const THEMES = [
  { id: 'samarqand', name: 'Samarqand tuni', c: SAMARQAND },
  { id: 'lojuvard', name: 'Lojuvard', c: LOJUVARD },
  { id: 'komir', name: "Ko'mir va mis", c: KOMIR },
  { id: 'klassik', name: 'Klassik', c: TUN },
  { id: 'kun', name: 'Kunduzgi (yorug\')', c: KUN },
] as const;
export const THEME_KEY = 'farobiy.theme';
/** Tanlangan mavzu ilova ochilganda sinxron o'qiladi (StyleSheet'lar shu ranglar bilan yasaladi). */
function chosen(): string {
  return getSync(THEME_KEY) ?? 'samarqand';
}
export const THEME_ID = chosen();
export const SCHEME: 'dark' | 'light' = THEME_ID === 'kun' ? 'light' : 'dark';
export const C = (THEMES.find((t) => t.id === THEME_ID) ?? THEMES[0]).c;
/** Mavzuni almashtirish — saqlaydi va ilovani qayta yuklaydi. */
export function setTheme(id: string) { setSync(THEME_KEY, id); }

/** Sarlavha shrifti (madrasa kitobi ruhi). Yuklanmagan bo'lsa — tizim shrifti. */
export const FONT_DISPLAY = 'YoungSerif_400Regular';

export const R = 16;              // burchak radiusi
export const PAD = 16;            // ekran chetidan bo'shliq
