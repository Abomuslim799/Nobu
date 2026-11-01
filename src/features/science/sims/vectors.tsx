/** Simulyatsiya: Vectors. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Polygon } from 'react-native-svg';

import { add, angleDeg, fmt, len, polar } from '@/features/science/engine';
import { Axes, COLORS, Slider, sx, sy, useWidth, type View2D } from '@/features/science/ui';
import { Box, Readout } from './kit';

// ── 4. Vektorlar: qo'shish va tashkil etuvchilar ────────────────────────────
export function Vectors() {
  const [W, onLayout] = useWidth();
  const [a, setA] = useState(4), [ad, setAd] = useState(20);
  const [b, setB] = useState(3), [bd, setBd] = useState(110);
  const A = polar(a, ad), B = polar(b, bd), S = add(A, B);
  const v: View2D = { W, H: 260, x0: -6, x1: 8, y0: -2, y1: 8 };
  if (W) { const k = (v.H / W) * (v.x1 - v.x0); v.y0 = -2; v.y1 = v.y0 + k; }
  const arrow = (from: { x: number; y: number }, to: { x: number; y: number }, color: string, w = 3, dash?: string) => {
    const x1 = sx(v, from.x), y1 = sy(v, from.y), x2 = sx(v, to.x), y2 = sy(v, to.y);
    const ang = Math.atan2(y2 - y1, x2 - x1), hl = 11;
    const p = `${x2},${y2} ${x2 - hl * Math.cos(ang - 0.4)},${y2 - hl * Math.sin(ang - 0.4)} ${x2 - hl * Math.cos(ang + 0.4)},${y2 - hl * Math.sin(ang + 0.4)}`;
    return <G><Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeDasharray={dash} /><Polygon points={p} fill={color} /></G>;
  };
  const O = { x: 0, y: 0 };
  return (
    <View style={{ gap: 10 }}>
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={v.H}>
            <Axes v={v} />
            {arrow(A, S, 'rgba(244,114,182,0.45)', 2, '5 4')}
            {arrow(B, S, 'rgba(96,165,250,0.45)', 2, '5 4')}
            <Line x1={sx(v, S.x)} x2={sx(v, S.x)} y1={sy(v, 0)} y2={sy(v, S.y)} stroke={COLORS.c} strokeDasharray="3 4" />
            <Line x1={sx(v, 0)} x2={sx(v, S.x)} y1={sy(v, S.y)} y2={sy(v, S.y)} stroke={COLORS.c} strokeDasharray="3 4" />
            {arrow(O, A, COLORS.a)}
            {arrow(O, B, COLORS.b)}
            {arrow(O, S, COLORS.d, 4)}
          </Svg>
        )}
      </Box>
      <Slider label="|A|" value={a} min={0} max={6} step={0.1} color={COLORS.a} onChange={setA} />
      <Slider label="A burchagi" value={ad} min={0} max={360} step={1} unit="°" color={COLORS.a} onChange={setAd} />
      <Slider label="|B|" value={b} min={0} max={6} step={0.1} color={COLORS.b} onChange={setB} />
      <Slider label="B burchagi" value={bd} min={0} max={360} step={1} unit="°" color={COLORS.b} onChange={setBd} />
      <Readout rows={[
        ['A = (Ax; Ay)', `(${fmt(A.x, 2)}; ${fmt(A.y, 2)})`, COLORS.a],
        ['B = (Bx; By)', `(${fmt(B.x, 2)}; ${fmt(B.y, 2)})`, COLORS.b],
        ['A+B', `(${fmt(S.x, 2)}; ${fmt(S.y, 2)})`, COLORS.d],
        ['|A+B|', fmt(len(S), 2), COLORS.d], ['|A|+|B|', fmt(a + b, 2)], ['A+B burchagi', `${fmt(angleDeg(S), 1)}°`],
      ]} />
    </View>
  );
}
