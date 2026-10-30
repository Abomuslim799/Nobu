/**
 * ui.tsx — simulyatsiyalar uchun umumiy bo'laklar: Slider (barmoq bilan suriladi), koordinata o'qlari,
 * animatsiya sikli. react-native-svg — telefon va brauzerda bir xil ishlaydi.
 */

import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import { Line, Text as SvgText } from 'react-native-svg';

import { C } from '@/constants/theme';
import { clamp, fmt } from './engine';

// ── Slider ──────────────────────────────────────────────────────────────────
export function Slider({ label, value, min, max, step, unit = '', onChange, color = C.green }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void; color?: string;
}) {
  const [w, setW] = useState(1);
  const ref = useRef({ w: 1, min, max, step, onChange, x0: 0 });
  ref.current = { ...ref.current, w, min, max, step, onChange };
  const set = (px: number) => {
    const r = ref.current;
    const raw = r.min + clamp(px / r.w, 0, 1) * (r.max - r.min);
    const v = Math.round(raw / r.step) * r.step;
    r.onChange(Number(clamp(v, r.min, r.max).toFixed(6)));
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => { ref.current.x0 = e.nativeEvent.locationX; set(e.nativeEvent.locationX); },
    onPanResponderMove: (_e, g) => set(ref.current.x0 + g.dx),
  })).current;
  const frac = (value - min) / (max - min);
  const nudge = (d: number) => onChange(Number(clamp(value + d * step, min, max).toFixed(6)));
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: C.dim, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{fmt(value, step < 1 ? 2 : 0)}{unit}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => nudge(-1)} hitSlop={8}><Text style={{ color: C.dim, fontSize: 20, width: 18, textAlign: 'center' }}>−</Text></Pressable>
        <View style={{ flex: 1, height: 32, justifyContent: 'center' }} onLayout={(e) => setW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
          <View pointerEvents="none" style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <View style={{ width: `${frac * 100}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', left: frac * w - 11, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 3, borderColor: color }} />
        </View>
        <Pressable onPress={() => nudge(1)} hitSlop={8}><Text style={{ color: C.dim, fontSize: 20, width: 18, textAlign: 'center' }}>+</Text></Pressable>
      </View>
    </View>
  );
}

// ── Koordinatalar: matematik (x,y) → ekran (px) ──────────────────────────────
export interface View2D { W: number; H: number; x0: number; x1: number; y0: number; y1: number }
export const sx = (v: View2D, x: number) => ((x - v.x0) / (v.x1 - v.x0)) * v.W;
export const sy = (v: View2D, y: number) => v.H - ((y - v.y0) / (v.y1 - v.y0)) * v.H;
export const path = (v: View2D, pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${sx(v, p.x).toFixed(1)},${sy(v, p.y).toFixed(1)}`).join(' ');
export function sample(f: (x: number) => number, a: number, b: number, n = 160) {
  return Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return { x, y: f(x) }; });
}

/** O'qlar va to'r (har `step` da chiziq, yonida son). */
export function Axes({ v, stepX = 1, stepY = 1, labelX = 'x', labelY = 'y' }: { v: View2D; stepX?: number; stepY?: number; labelX?: string; labelY?: string }) {
  const lines = [];
  for (let x = Math.ceil(v.x0 / stepX) * stepX; x <= v.x1 + 1e-9; x += stepX) {
    lines.push(<Line key={`gx${x}`} x1={sx(v, x)} x2={sx(v, x)} y1={0} y2={v.H} stroke="rgba(255,255,255,0.06)" />);
    if (Math.abs(x) > 1e-9 && sx(v, x) > 12 && sx(v, x) < v.W - 12) lines.push(<SvgText key={`lx${x}`} x={sx(v, x)} y={clamp(sy(v, 0) + 14, 12, v.H - 2)} fill={C.dim} fontSize={10} textAnchor="middle">{fmt(x, 1)}</SvgText>);
  }
  for (let y = Math.ceil(v.y0 / stepY) * stepY; y <= v.y1 + 1e-9; y += stepY) {
    lines.push(<Line key={`gy${y}`} y1={sy(v, y)} y2={sy(v, y)} x1={0} x2={v.W} stroke="rgba(255,255,255,0.06)" />);
    if (Math.abs(y) > 1e-9 && sy(v, y) > 10 && sy(v, y) < v.H - 6) lines.push(<SvgText key={`ly${y}`} y={sy(v, y) + 3} x={clamp(sx(v, 0) - 4, 14, v.W)} fill={C.dim} fontSize={10} textAnchor="end">{fmt(y, 1)}</SvgText>);
  }
  const ax = clamp(sx(v, 0), 0, v.W), ay = clamp(sy(v, 0), 0, v.H);
  return (
    <>
      {lines}
      <Line x1={0} x2={v.W} y1={ay} y2={ay} stroke="rgba(255,255,255,0.35)" />
      <Line x1={ax} x2={ax} y1={0} y2={v.H} stroke="rgba(255,255,255,0.35)" />
      <SvgText x={v.W - 4} y={ay - 5} fill={C.dim} fontSize={11} textAnchor="end">{labelX}</SvgText>
      <SvgText x={ax + 5} y={11} fill={C.dim} fontSize={11}>{labelY}</SvgText>
    </>
  );
}

// ── Animatsiya: t (soniya) — haqiqiy vaqt bo'yicha, kadrlar soniga bog'liq emas ──
export function useClock(running: boolean, onTick: (dt: number) => void) {
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    if (!running) return;
    let raf = 0, last = 0;
    const loop = (now: number) => {
      if (last) cb.current(Math.min(0.05, (now - last) / 1000));   // fon/sekinlashuvda sakramasin
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

/** Simulyatsiya kengligi (ekranga moslashadi). */
export function useWidth(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

export const COLORS = { a: '#60A5FA', b: '#F472B6', c: '#FBBF24', d: '#34D399', red: '#F87171' };
