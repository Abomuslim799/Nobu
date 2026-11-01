/** Simulyatsiya: Pendulum. Hisob — engine.ts (testlangan), bu yerda faqat chizish. */

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { C } from '@/core/theme';
import { fmt, pendulumPeriodSmall, pendulumStep } from '@/features/science/engine';
import { COLORS, Slider, useClock, useWidth } from '@/features/science/ui';
import { Box, PlayBtn, Readout } from '@/features/science/sims/kit';

// ── 7. Mayatnik: davr amplitudaga bog'liqmi? ────────────────────────────────
export function Pendulum() {
  const [W, onLayout] = useWidth();
  const [L, setL] = useState(1), [amp, setAmp] = useState(20);
  const [st, setSt] = useState({ th: (20 * Math.PI) / 180, w: 0, t: 0, lastCross: 0, period: 0, prevW: 0 });
  const [run, setRun] = useState(false);
  const g = 9.81;
  const reset = (a = amp) => setSt({ th: (a * Math.PI) / 180, w: 0, t: 0, lastCross: 0, period: 0, prevW: 0 });
  useClock(run, (dt) => setSt((s) => {
    let { th, w, t, lastCross, period } = s;
    const n = 20, h = dt / n;
    for (let i = 0; i < n; i++) {
      const pw = w;
      [th, w] = pendulumStep(th, w, g, L, h); t += h;
      if (pw > 0 && w <= 0) { period = t - lastCross; lastCross = t; }   // o'ng chekkada to'xtash — har davrda bir marta
    }
    return { th, w, t, lastCross, period, prevW: w };
  }));
  // Katta og'ishda (>80°) yuk osilish nuqtasidan yuqoriga chiqadi — o'shanda nuqtani pastroq qo'yamiz
  const Lpx = 40 + L * 45, px = W / 2, py = amp > 80 ? Lpx + 22 : 22, H = py + Lpx + 30;
  const bx = px + Lpx * Math.sin(st.th), by = py + Lpx * Math.cos(st.th);
  return (
    <View style={{ gap: 10 }}>
      <Box onLayout={onLayout}>
        {W > 0 && (
          <Svg width={W} height={H}>
            <Line x1={px - 40} x2={px + 40} y1={py} y2={py} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
            <Line x1={px} x2={px} y1={py} y2={py + Lpx} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <Line x1={px} y1={py} x2={bx} y2={by} stroke={C.text} strokeWidth={2} />
            <Circle cx={bx} cy={by} r={13} fill={COLORS.c} />
          </Svg>
        )}
      </Box>
      <Slider label="Uzunlik L" value={L} min={0.25} max={2} step={0.05} unit=" m" onChange={(x) => { setL(x); setRun(false); reset(); }} />
      <Slider label="Boshlang'ich og'ish" value={amp} min={5} max={170} step={5} unit="°" onChange={(x) => { setAmp(x); setRun(false); reset(x); }} />
      <PlayBtn on={run} onPress={() => setRun(!run)} />
      <Readout rows={[
        ['O\'lchangan davr T', st.period ? `${fmt(st.period, 3)} s` : '…', COLORS.c],
        ['Formula 2π√(L/g)', `${fmt(pendulumPeriodSmall(g, L), 3)} s`, COLORS.d],
        ['Farq', st.period ? `${fmt(((st.period / pendulumPeriodSmall(g, L)) - 1) * 100, 1)}%` : '…'],
      ]} />
    </View>
  );
}
