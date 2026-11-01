/** Simulyatsiya: UnitCircle. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { C } from '@/core/theme';
import { COLORS, Slider, useClock, useWidth } from '@/features/science/ui';
import { Box, PlayBtn, Readout } from './kit';

// ── 3. Birlik aylana: sin va cos qayerdan keladi ────────────────────────────
export function UnitCircle() {
  const [W, onLayout] = useWidth();
  const [deg, setDeg] = useState(40);
  const [run, setRun] = useState(false);
  useClock(run, (dt) => setDeg((d) => (d + dt * 60) % 360));
  const R = Math.round(Math.min(85, Math.max(55, W * 0.21))), H = 2 * R + 50, cx = R + 18, cy = H / 2;
  const r = (deg * Math.PI) / 180;
  const rr = ((run ? Math.round(deg / 5) * 5 : Math.round(deg)) * Math.PI) / 180;   // aylanayotganda son 5° qadam bilan
  const px = cx + R * Math.cos(r), py = cy - R * Math.sin(r);
  const gx0 = cx + R + 22, gw = Math.max(40, W - gx0 - 12);           // o'ngda sin to'lqini
  const wave = Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * 2 * Math.PI; return `${i ? 'L' : 'M'}${(gx0 + (a / (2 * Math.PI)) * gw).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const nDone = Math.max(2, Math.round((deg / 360) * 120) + 1);
  const done = Array.from({ length: nDone }, (_, i) => { const a = (i / (nDone - 1)) * r; return `${i ? 'L' : 'M'}${(gx0 + (a / (2 * Math.PI)) * gw).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const wx = gx0 + (r / (2 * Math.PI)) * gw;
  return (
    <View style={{ gap: 10 }}>
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={H}>
            <Line x1={cx - R - 10} x2={cx + R + 10} y1={cy} y2={cy} stroke="rgba(255,255,255,0.3)" />
            <Line x1={cx} x2={cx} y1={cy - R - 10} y2={cy + R + 10} stroke="rgba(255,255,255,0.3)" />
            <Circle cx={cx} cy={cy} r={R} stroke="rgba(255,255,255,0.4)" fill="none" />
            <Path d={`M${cx + 22},${cy} A22,22 0 ${deg > 180 ? 1 : 0},0 ${cx + 22 * Math.cos(r)},${cy - 22 * Math.sin(r)}`} stroke={COLORS.c} fill="none" strokeWidth={2} />
            <Line x1={cx} y1={cy} x2={px} y2={py} stroke={C.text} strokeWidth={2} />
            <Line x1={cx} y1={cy} x2={px} y2={cy} stroke={COLORS.a} strokeWidth={4} />
            <Line x1={px} y1={cy} x2={px} y2={py} stroke={COLORS.b} strokeWidth={4} />
            <Circle cx={px} cy={py} r={6} fill={C.text} />
            <SvgText x={cx + 4} y={cy + 16} fill={COLORS.a} fontSize={12}>cos</SvgText>
            <SvgText x={px + 5} y={(py + cy) / 2} fill={COLORS.b} fontSize={12}>sin</SvgText>
            {gw > 50 && <>
              <Line x1={gx0} x2={gx0 + gw} y1={cy} y2={cy} stroke="rgba(255,255,255,0.3)" />
              <Path d={wave} stroke="rgba(244,114,182,0.25)" strokeWidth={2} fill="none" />
              <Path d={done} stroke={COLORS.b} strokeWidth={2.5} fill="none" />
              <Line x1={px} x2={wx} y1={py} y2={py} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 4" />
              <Circle cx={wx} cy={py} r={5} fill={COLORS.b} />
              <SvgText x={gx0 + gw} y={cy + 14} fill={C.dim} fontSize={10} textAnchor="end">360°</SvgText>
            </>}
          </Svg>
        )}
      </Box>
      <Slider label="Burchak θ" value={Math.round(deg)} min={0} max={360} step={1} unit="°" onChange={(d) => { setRun(false); setDeg(d); }} />
      <PlayBtn on={run} onPress={() => setRun(!run)} label={run ? '⏸ To\'xtatish' : '▶ Aylantirish'} />
      <Readout rows={[
        ['cos θ (x)', Math.cos(rr).toFixed(2), COLORS.a], ['sin θ (y)', Math.sin(rr).toFixed(2), COLORS.b],
        ['sin²+cos²', (Math.sin(rr) ** 2 + Math.cos(rr) ** 2).toFixed(2)], ['θ', `${Math.round((rr * 180) / Math.PI)}° = ${rr.toFixed(2)} rad`],
      ]} />
    </View>
  );
}
