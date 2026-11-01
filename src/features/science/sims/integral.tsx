/** Simulyatsiya: Integral. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { C } from '@/core/theme';
import { FUNCS, fmt, fnById, riemann } from '@/features/science/engine';
import { Axes, COLORS, path, sample, Slider, sx, sy, useWidth, type View2D } from '@/features/science/ui';
import { Box, Chips, Readout } from './kit';

// ── 2. Integral: to'rtburchaklar yig'indisi → yuza ──────────────────────────
export function Integral() {
  const [W, onLayout] = useWidth();
  const [fid, setFid] = useState('sq');
  const [n, setN] = useState(4);
  const [mode, setMode] = useState<'left' | 'mid' | 'right'>('left');
  const fn = fnById(fid);
  const a = 0, b = fid === 'sin' ? Math.PI : 2;
  const ys = sample(fn.f, fn.xmin, fn.xmax).map((p) => p.y);
  const v: View2D = { W, H: 240, x0: fn.xmin, x1: fn.xmax, y0: Math.min(...ys, -1) - 0.5, y1: Math.max(...ys, 1) + 0.5 };
  const R = riemann(fn.f, a, b, n, mode);
  const exact = fn.F(b) - fn.F(a);
  return (
    <View style={{ gap: 10 }}>
      <Chips items={FUNCS.map((f) => ({ id: f.id, label: f.label }))} value={fid} onChange={setFid} />
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={v.H}>
            <Axes v={v} stepX={1} stepY={fid === 'exp' ? 1 : 2} />
            {R.rects.map((r, i) => {
              const top = Math.max(r.h, 0), bot = Math.min(r.h, 0);
              return <Rect key={i} x={sx(v, r.x)} width={Math.max(0.5, sx(v, r.x + r.w) - sx(v, r.x))} y={sy(v, top)} height={sy(v, bot) - sy(v, top)}
                fill={r.h >= 0 ? C.cardBorder : 'rgba(248,113,113,0.28)'} stroke={r.h >= 0 ? COLORS.d : COLORS.red} strokeWidth={n > 40 ? 0 : 1} />;
            })}
            <Path d={path(v, sample(fn.f, fn.xmin, fn.xmax))} stroke={COLORS.a} strokeWidth={2.5} fill="none" />
            <Line x1={sx(v, a)} x2={sx(v, a)} y1={0} y2={v.H} stroke={COLORS.c} strokeDasharray="4 4" />
            <Line x1={sx(v, b)} x2={sx(v, b)} y1={0} y2={v.H} stroke={COLORS.c} strokeDasharray="4 4" />
          </Svg>
        )}
      </Box>
      <Chips items={[{ id: 'left', label: 'Chap nuqta' }, { id: 'mid', label: "O'rta nuqta" }, { id: 'right', label: "O'ng nuqta" }]} value={mode} onChange={setMode} />
      <Slider label="To'rtburchaklar soni n" value={n} min={1} max={100} step={1} onChange={setN} />
      <Readout rows={[
        [`Yig'indi (n=${n})`, fmt(R.sum, 4), COLORS.d],
        [`Aniq integral [${fmt(a)}; ${fmt(b)}]`, fmt(exact, 4), COLORS.a],
        ['Xato', fmt(Math.abs(R.sum - exact), 4)],
      ]} />
    </View>
  );
}
