/**
 * look.ts — shaxmat ko'rinishi: doska temalari, dona to'plamlari va sozlamalar (telefonda saqlanadi).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { KEYS } from '@/core/storage';

export interface BoardTheme { id: string; name: string; light: string; dark: string; last: string; sel: string }
export const BOARDS: BoardTheme[] = [
  { id: 'wood', name: "Yog'och", light: '#F0D9B5', dark: '#B58863', last: 'rgba(205,210,106,0.75)', sel: 'rgba(20,85,30,0.45)' },
  { id: 'green', name: 'Yashil', light: '#EBECD0', dark: '#779556', last: 'rgba(245,246,130,0.8)', sel: 'rgba(20,85,30,0.45)' },
  { id: 'blue', name: "Ko'k", light: '#DEE3E6', dark: '#8CA2AD', last: 'rgba(155,199,0,0.45)', sel: 'rgba(20,85,30,0.45)' },
  { id: 'marble', name: 'Marmar', light: '#E8E4DE', dark: '#A39C92', last: 'rgba(214,190,110,0.7)', sel: 'rgba(40,60,90,0.45)' },
  { id: 'night', name: 'Tun', light: '#7D8BA1', dark: '#4A586E', last: 'rgba(232,184,74,0.55)', sel: 'rgba(53,208,194,0.45)' },
];
export const PIECE_SETS: { id: string; name: string }[] = [
  { id: 'klassik', name: 'Klassik' }, { id: 'seltik', name: 'Seltik' }, { id: 'neo', name: 'Neo' },
  { id: 'iliq', name: 'Iliq' }, { id: 'minimal', name: 'Minimal' },
];

export interface Look { board: string; pieces: string; sound: boolean; coords: boolean }
const DEF: Look = { board: 'wood', pieces: 'klassik', sound: true, coords: true };
export const boardOf = (l: Look) => BOARDS.find((b) => b.id === l.board) ?? BOARDS[0];

// Bir nechta ekran bir vaqtda ishlatadi — umumiy holat va obunachilar
let cur: Look = DEF, loaded = false;
const subs = new Set<(l: Look) => void>();
export function setLook(p: Partial<Look>) {
  cur = { ...cur, ...p };
  subs.forEach((f) => f(cur));
  AsyncStorage.setItem(KEYS.chessLook, JSON.stringify(cur)).catch(() => {});
}
export function useLook(): Look {
  const [l, setL] = useState(cur);
  useEffect(() => {
    subs.add(setL);
    if (!loaded) {
      loaded = true;
      AsyncStorage.getItem(KEYS.chessLook).then((r) => { if (r) { try { cur = { ...DEF, ...JSON.parse(r) }; subs.forEach((f) => f(cur)); } catch { /* eski — standart */ } } });
    }
    return () => { subs.delete(setL); };
  }, []);
  return l;
}
