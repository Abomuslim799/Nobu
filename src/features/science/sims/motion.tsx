/** Simulyatsiya: Motion. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { C } from '@/core/theme';
import { fmt, motionV, motionX } from '@/features/science/engine';
import { Axes, COLORS, path, sample, Slider, sx, sy, useClock, useWidth, type View2D } from '@/features/science/ui';
import { Box, PlayBtn, Readout } from '@/features/science/sims/kit';

// ── 5. Harakat: x(t) va v(t) grafiklari bir vaqtda ──────────────────────────
export function Motion() {
  const [W, onLayout] = useWidth();
  const [v0, setV0] = useState(2), [a, setA] = useState(1);
  const [t, setT] = useState(0);
  const [run, setRun] = useState(false);
  const T = 6;
  useClock(run, (dt) => { const n = t + dt; if (n >= T) { setRun(false); setT(T); } else setT(n); });
  const xs = sample((tt) => motionX(0, v0, a, tt), 0, T, 120);
  const xmax = Math.max(10, ...xs.map((p) => p.y)), xmin = Math.min(0, ...xs.map((p) => p.y));
  const vmax = Math.max(Math.abs(v0), Math.abs(motionV(v0, a, T)), 2);
  const road: View2D = { W, H: 54, x0: xmin, x1: xmax, y0: 0, y1: 1 };
  const g1: View2D = { W, H: 150, x0: 0, x1: T, y0: xmin - 1, y1: xmax + 1 };
  const g2: View2D = { W, H: 120, x0: 0, x1: T, y0: -vmax - 1, y1: vmax + 1 };
  const xNow = motionX(0, v0, a, t), vNow = motionV(v0, a, t);
  const tan = [{ x: Math.max(0, t - 1.2), y: xNow - vNow * Math.min(t, 1.2) }, { x: Math.min(T, t + 1.2), y: xNow + vNow * Math.min(T - t, 1.2) }];
  return (
    <View style={{ gap: 10 }}>
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={road.H + g1.H + g2.H + 16}>
            <Line x1={0} x2={W} y1={40} y2={40} stroke="rgba(255,255,255,0.3)" />
            <Line x1={sx(road, 0)} x2={sx(road, 0)} y1={30} y2={46} stroke={C.dim} />
            <Rect x={sx(road, xNow) - 14} y={22} width={28} height={14} rx={4} fill={COLORS.c} />
            <Circle cx={sx(road, xNow) - 8} cy={38} r={4} fill="#fff" /><Circle cx={sx(road, xNow) + 8} cy={38} r={4} fill="#fff" />
            <SvgText x={6} y={14} fill={C.dim} fontSize={11}>{`x = ${fmt(xNow, 1)} m`}</SvgText>
            <G y={road.H + 8}>
              <Axes v={g1} stepX={1} stepY={Math.max(2, Math.round((xmax - xmin) / 5))} labelX="t, s" labelY="x, m" />
              <Path d={path(g1, xs)} stroke="rgba(96,165,250,0.3)" strokeWidth={2} fill="none" />
              <Path d={path(g1, xs.filter((p) => p.x <= t))} stroke={COLORS.a} strokeWidth={2.5} fill="none" />
              <Path d={path(g1, tan)} stroke={COLORS.d} strokeWidth={2} fill="none" />
              <Circle cx={sx(g1, t)} cy={sy(g1, xNow)} r={5} fill={COLORS.a} />
            </G>
            <G y={road.H + g1.H + 16}>
              <Axes v={g2} stepX={1} stepY={Math.max(1, Math.round(vmax / 3))} labelX="t, s" labelY="v, m/s" />
              <Path d={path(g2, [{ x: 0, y: v0 }, { x: T, y: motionV(v0, a, T) }])} stroke="rgba(52,211,153,0.3)" strokeWidth={2} fill="none" />
              <Path d={path(g2, [{ x: 0, y: v0 }, { x: t, y: vNow }])} stroke={COLORS.d} strokeWidth={2.5} fill="none" />
              <Circle cx={sx(g2, t)} cy={sy(g2, vNow)} r={5} fill={COLORS.d} />
            </G>
          </Svg>
        )}
      </Box>
      <Slider label="Boshlang'ich tezlik v₀" value={v0} min={-5} max={5} step={0.5} unit=" m/s" onChange={(x) => { setV0(x); setT(0); setRun(false); }} />
      <Slider label="Tezlanish a" value={a} min={-3} max={3} step={0.25} unit=" m/s²" onChange={(x) => { setA(x); setT(0); setRun(false); }} />
      <Slider label="Vaqt t" value={Number(t.toFixed(2))} min={0} max={T} step={0.05} unit=" s" onChange={(x) => { setRun(false); setT(x); }} />
      <PlayBtn on={run} onPress={() => { if (t >= T) setT(0); setRun(!run); }} />
      {/* Harakat paytida son 0.1 s qadam bilan yangilanadi (har kadrda emas) — ko'z ilg'ab o'qiy oladi */}
      {(() => {
        const tr = run ? Math.floor(t * 10) / 10 : t;
        return <Readout rows={[['t', `${tr.toFixed(run ? 1 : 2)} s`], ['x(t)', `${motionX(0, v0, a, tr).toFixed(1)} m`, COLORS.a],
          ['v(t) = urinma qiyaligi', `${motionV(v0, a, tr).toFixed(1)} m/s`, COLORS.d], ['a', `${a.toFixed(2)} m/s²`]]} />;
      })()}
    </View>
  );
}
