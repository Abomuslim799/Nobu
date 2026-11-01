/**
 * theme.ts — Nobu ranglari: Samarqand gumbazlari — lojuvard (tun) va feruza; oltin faqat yutuqlar uchun.
 * Telefonning tun/kun sozlamasiga qarab tanlanadi (ilova ochilganda). Sozlama o'zgarsa — ilova qayta yuklanadi
 * (_layout.tsx), shuning uchun barcha StyleSheet'lar to'g'ri rangni oladi.
 */

import { Appearance } from 'react-native';

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

export const SCHEME: 'dark' | 'light' = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
export const C = SCHEME === 'light' ? KUN : TUN;

/** Sarlavha shrifti (madrasa kitobi ruhi). Yuklanmagan bo'lsa — tizim shrifti. */
export const FONT_DISPLAY = 'YoungSerif_400Regular';

export const R = 16;              // burchak radiusi
export const PAD = 16;            // ekran chetidan bo'shliq
