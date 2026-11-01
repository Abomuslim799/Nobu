/**
 * kit — miya o'yinlari uchun umumiy: o'yin shakli (GameProps), taymer, tasodif, uslublar.
 *   <Game level={n} onDone={(ball 0..100, xatolar[]) => ...} /> — daraja natijaga qarab brain/[id] ekranida moslanadi.
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { C } from '@/core/theme';

export interface GameProps { level: number; onDone: (score: number, mistakes: string[]) => void }
export const rnd = (n: number) => Math.floor(Math.random() * n);
export const shuffle = <X,>(a: X[]) => [...a].sort(() => Math.random() - 0.5);

/** Taymer: soniya qolganini qaytaradi; 0 bo'lsa onEnd bir marta chaqiriladi. */
export function useCountdown(seconds: number, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const ended = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 0.1)), 100);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0 && !ended.current) { ended.current = true; onEnd(); }
  }, [left, onEnd]);
  return [left, setLeft] as const;
}

export const s = StyleSheet.create({
  big: { color: C.text, fontSize: 52, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  btn: { width: '47%', flexGrow: 1, paddingVertical: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card },
  btnText: { color: C.text, fontSize: 24, fontWeight: '700' },
  reaction: { height: 360, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
