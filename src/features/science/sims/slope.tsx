/** Simulyatsiya: Slope. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { C } from '@/core/theme';
import { fmt } from '@/features/science/engine';
import { Axes, COLORS, path, Slider, sx, sy, useWidth, type View2D } from '@/features/science/ui';
import { Box, Readout } from '@/features/science/sims/kit';

// ── 0. Qiyalik: y = kx + b ──────────────────────────────────────────────────
export function Slope() {
  const [W, onLayout] = useWidth();
  const [k, setK] = useState(1), [b, setB] = useState(0);
  const v: View2D = { W, H: 240, x0: -4, x1: 4, y0: -4, y1: 4 };
  if (W) { const half = ((v.x1 - v.x0) * v.H) / W / 2; v.y0 = -half; v.y1 = half; }
  const f = (x: number) => k * x + b;
  const x1 = 0.5, x2 = 1.5;          // Δx = 1 bo'lgan uchburchak
  const deg = (Math.atan(k) * 180) / Math.PI;
  return (
    <View style={{ gap: 10 }}>
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={v.H}>
            <Axes v={v} />
            <Path d={path(v, [{ x: v.x0, y: f(v.x0) }, { x: v.x1, y: f(v.x1) }])} stroke={COLORS.a} strokeWidth={3} fill="none" />
            <Line x1={sx(v, x1)} x2={sx(v, x2)} y1={sy(v, f(x1))} y2={sy(v, f(x1))} stroke={COLORS.c} strokeWidth={3} />
            <Line x1={sx(v, x2)} x2={sx(v, x2)} y1={sy(v, f(x1))} y2={sy(v, f(x2))} stroke={COLORS.b} strokeWidth={3} />
            <SvgText x={(sx(v, x1) + sx(v, x2)) / 2} y={sy(v, f(x1)) + (k >= 0 ? 16 : -8)} fill={COLORS.c} fontSize={13} textAnchor="middle">Δx = 1</SvgText>
            <SvgText x={sx(v, x2) + 6} y={(sy(v, f(x1)) + sy(v, f(x2))) / 2 + 4} fill={COLORS.b} fontSize={13}>{`Δy = ${fmt(k, 2)}`}</SvgText>
            <Circle cx={sx(v, x1)} cy={sy(v, f(x1))} r={5} fill={C.text} /><Circle cx={sx(v, x2)} cy={sy(v, f(x2))} r={5} fill={C.text} />
          </Svg>
        )}
      </Box>
      <Slider label="Qiyalik k" value={k} min={-3} max={3} step={0.1} onChange={setK} color={COLORS.b} />
      <Slider label="Siljish b" value={b} min={-2} max={2} step={0.5} onChange={setB} />
      <Readout rows={[['Tenglama', `y = ${fmt(k, 1)}x ${b >= 0 ? '+' : '−'} ${fmt(Math.abs(b), 1)}`, COLORS.a], ['Qiyalik Δy/Δx', fmt(k, 2), COLORS.b], ['Burchak', `${fmt(deg, 1)}°`]]} />
    </View>
  );
}
