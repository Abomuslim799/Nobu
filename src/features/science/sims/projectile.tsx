/** Simulyatsiya: Projectile. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { C } from '@/core/theme';
import { fmt, projectile, projectileDrag } from '@/features/science/engine';
import { Axes, COLORS, path, sample, Slider, sx, sy, useClock, useWidth, type View2D } from '@/features/science/ui';
import { Box, Chips, PlayBtn, Readout } from './kit';

// ── 6. Otilgan jism ─────────────────────────────────────────────────────────
interface Trace { deg: number; v0: number; drag: boolean; pts: { x: number; y: number }[]; range: number; hMax: number; tF: number }
export function Projectile() {
  const [W, onLayout] = useWidth();
  const [v0, setV0] = useState(20), [deg, setDeg] = useState(45);
  const [drag, setDrag] = useState(false);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [t, setT] = useState<number | null>(null);
  const g = 9.81, k = 0.02;
  const cur = useMemo<Trace>(() => {
    if (drag) { const r = projectileDrag({ v0, deg, g }, k); return { deg, v0, drag, pts: r.pts, range: r.range, hMax: r.hMax, tF: r.tFlight }; }
    const p = projectile({ v0, deg, g });
    return { deg, v0, drag, pts: sample((tt) => p.pos(tt).y, 0, p.tFlight, 100).map((q, i) => ({ x: p.pos((i / 100) * p.tFlight).x, y: q.y })), range: p.range, hMax: p.hMax, tF: p.tFlight };
  }, [v0, deg, drag]);
  useClock(t !== null, (dt) => {
    if (t === null) return;
    const n = t + dt;
    if (n >= cur.tF) { setTraces((tr) => [...tr.slice(-4), cur]); setT(null); } else setT(n);
  });
  const maxR = Math.max(45, ...traces.map((x) => x.range), cur.range) * 1.05;
  const H = 230;
  const v: View2D = { W, H, x0: -2, x1: maxR, y0: -1, y1: 0 };
  if (W) v.y1 = v.y0 + ((v.x1 - v.x0) * H) / W;
  const shown = t === null ? null : cur.pts.filter((_, i) => (i / (cur.pts.length - 1)) * cur.tF <= t);
  const ball = shown && shown.length ? shown[shown.length - 1] : null;
  const colors = [COLORS.a, COLORS.b, COLORS.c, COLORS.d, '#A78BFA'];
  return (
    <View style={{ gap: 10 }}>
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={H}>
            <Axes v={v} stepX={10} stepY={10} labelX="x, m" labelY="y, m" />
            {traces.map((tr, i) => (
              <G key={i}>
                <Path d={path(v, tr.pts)} stroke={colors[i % 5]} strokeWidth={2} fill="none" opacity={0.75} strokeDasharray={tr.drag ? '6 4' : undefined} />
                <SvgText x={sx(v, tr.range)} y={sy(v, 0) - 6} fill={colors[i % 5]} fontSize={10} textAnchor="middle">{`${tr.deg}°`}</SvgText>
              </G>
            ))}
            {t === null && <Path d={path(v, cur.pts)} stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} strokeDasharray="3 5" fill="none" />}
            {shown && <Path d={path(v, shown)} stroke={C.text} strokeWidth={2.5} fill="none" />}
            {ball && <Circle cx={sx(v, ball.x)} cy={sy(v, ball.y)} r={6} fill={C.text} />}
            <Line x1={sx(v, 0)} y1={sy(v, 0)} x2={sx(v, 0) + 26 * Math.cos((deg * Math.PI) / 180)} y2={sy(v, 0) - 26 * Math.sin((deg * Math.PI) / 180)} stroke={COLORS.c} strokeWidth={6} strokeLinecap="round" />
          </Svg>
        )}
      </Box>
      <Slider label="Tezlik v₀" value={v0} min={5} max={30} step={1} unit=" m/s" onChange={setV0} />
      <Slider label="Burchak" value={deg} min={5} max={85} step={1} unit="°" onChange={setDeg} />
      <Chips items={[{ id: 'no', label: 'Havosiz (ideal)' }, { id: 'yes', label: 'Havo qarshiligi bilan' }]} value={drag ? 'yes' : 'no'} onChange={(x) => setDrag(x === 'yes')} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 2 }}><PlayBtn on={t !== null} onPress={() => setT(t === null ? 0 : null)} label={t === null ? '🚀 Otish' : '⏸'} /></View>
        <View style={{ flex: 1 }}><PlayBtn on={false} onPress={() => { setTraces([]); setT(null); }} label="🧹 Tozalash" /></View>
      </View>
      <Readout rows={[
        ['Uchish masofasi', `${fmt(cur.range, 1)} m`, COLORS.d], ['Eng baland nuqta', `${fmt(cur.hMax, 1)} m`, COLORS.a],
        ['Uchish vaqti', `${fmt(cur.tF, 2)} s`], ['vₓ (o\'zgarmas)', `${fmt(v0 * Math.cos((deg * Math.PI) / 180), 1)} m/s`],
      ]} />
    </View>
  );
}
