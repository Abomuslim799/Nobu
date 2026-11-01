/** Simulyatsiya: Derivative. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { FUNCS, fmt, fnById, secantSlope } from '@/features/science/engine';
import { Axes, COLORS, path, sample, Slider, sx, sy, useWidth, type View2D } from '@/features/science/ui';
import { Box, Chips, Readout } from './kit';

// ── 1. Hosila: kesuvchidan urinmaga ─────────────────────────────────────────
export function Derivative() {
  const [W, onLayout] = useWidth();
  const [fid, setFid] = useState('sq');
  const [x, setX] = useState(1);
  const [h, setH] = useState(1.5);
  const fn = fnById(fid);
  const ys = sample(fn.f, fn.xmin, fn.xmax).map((p) => p.y);
  const v: View2D = { W, H: 240, x0: fn.xmin, x1: fn.xmax, y0: Math.min(...ys, -1) - 0.5, y1: Math.max(...ys, 1) + 0.5 };
  const xx = Math.min(x, fn.xmax - 0.01), x2 = xx + h;
  const ms = secantSlope(fn.f, xx, h), mt = fn.df(xx);
  const lineAt = (m: number) => [{ x: v.x0, y: fn.f(xx) + m * (v.x0 - xx) }, { x: v.x1, y: fn.f(xx) + m * (v.x1 - xx) }];
  return (
    <View style={{ gap: 10 }}>
      <Chips items={FUNCS.map((f) => ({ id: f.id, label: f.label }))} value={fid} onChange={(id) => { setFid(id); setX(fnById(id).id === 'exp' ? 0.5 : 1); }} />
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={v.H}>
            <Axes v={v} stepX={1} stepY={fid === 'exp' ? 1 : 2} />
            <Path d={path(v, sample(fn.f, fn.xmin, fn.xmax))} stroke={COLORS.a} strokeWidth={2.5} fill="none" />
            <Path d={path(v, lineAt(ms))} stroke={COLORS.b} strokeWidth={2} fill="none" />
            <Path d={path(v, lineAt(mt))} stroke={COLORS.d} strokeWidth={1.5} strokeDasharray="6 5" fill="none" />
            <Line x1={sx(v, xx)} x2={sx(v, x2)} y1={sy(v, fn.f(xx))} y2={sy(v, fn.f(xx))} stroke={COLORS.c} strokeDasharray="3 3" />
            <Line x1={sx(v, x2)} x2={sx(v, x2)} y1={sy(v, fn.f(xx))} y2={sy(v, fn.f(x2))} stroke={COLORS.c} strokeDasharray="3 3" />
            <Circle cx={sx(v, xx)} cy={sy(v, fn.f(xx))} r={6} fill={COLORS.d} />
            <Circle cx={sx(v, x2)} cy={sy(v, fn.f(x2))} r={6} fill={COLORS.b} />
          </Svg>
        )}
      </Box>
      <Slider label="Nuqta x" value={x} min={fn.xmin + 0.5} max={fn.xmax - 0.5} step={0.05} onChange={setX} />
      <Slider label="Qadam h (Δx)" value={h} min={0.01} max={2} step={0.01} color={COLORS.b} onChange={setH} />
      <Readout rows={[
        ['Kesuvchi qiyaligi Δy/Δx', fmt(ms, 3), COLORS.b],
        ['Urinma qiyaligi f′(x)', fmt(mt, 3), COLORS.d],
        ['Farq', fmt(Math.abs(ms - mt), 3)],
      ]} />
    </View>
  );
}
