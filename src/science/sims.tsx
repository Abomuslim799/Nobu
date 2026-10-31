/**
 * sims.tsx — interaktiv simulyatsiyalar. Har biri: chizma (SVG) + boshqaruv (slayderlar) + o'lchangan qiymatlar.
 * Hisob-kitob — engine.ts (testlangan), bu yerda faqat chizish.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { C } from '@/constants/theme';
import {
  add, angleDeg, FUNCS, fmt, fnById, len, motionV, motionX, pendulumPeriodSmall, pendulumStep, polar, projectile,
  projectileDrag, riemann, secantSlope,
} from './engine';
import { Axes, COLORS, path, sample, Slider, sx, sy, useClock, useWidth, type View2D } from './ui';

const Box = ({ children, onLayout }: { children: React.ReactNode; onLayout?: (e: any) => void }) => (
  <View onLayout={onLayout} style={{ backgroundColor: '#0E1512', borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' }}>{children}</View>
);
// Qiymatlar: 2 ustunli qat'iy to'r va bir xil kenglikdagi raqamlar — son o'zgarganda qutilar sakramaydi
const Readout = ({ rows }: { rows: [string, string, string?][] }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    {rows.map(([k, v, c]) => (
      <View key={k} style={{ flexBasis: '48%', flexGrow: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <Text style={{ color: C.dim, fontSize: 11 }} numberOfLines={1}>{k}</Text>
        <Text style={{ color: c ?? C.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v}</Text>
      </View>
    ))}
  </View>
);
const Chips = <T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    {items.map((it) => (
      <Pressable key={it.id} onPress={() => onChange(it.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
        borderWidth: 1, borderColor: value === it.id ? C.green : C.cardBorder, backgroundColor: value === it.id ? C.greenSoft : 'transparent' }}>
        <Text style={{ color: C.text, fontSize: 13 }}>{it.label}</Text>
      </Pressable>
    ))}
  </View>
);
const PlayBtn = ({ on, onPress, label }: { on: boolean; onPress: () => void; label?: string }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: on ? C.redSoft : C.greenSoft,
    borderWidth: 1, borderColor: on ? C.red : C.green }}>
    <Text style={{ color: C.text, fontWeight: '700' }}>{label ?? (on ? '⏸ To\'xtatish' : '▶ Boshlash')}</Text>
  </Pressable>
);

// ── 0. Qiyalik: y = kx + b ──────────────────────────────────────────────────
function Slope() {
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
            <Circle cx={sx(v, x1)} cy={sy(v, f(x1))} r={5} fill="#fff" /><Circle cx={sx(v, x2)} cy={sy(v, f(x2))} r={5} fill="#fff" />
          </Svg>
        )}
      </Box>
      <Slider label="Qiyalik k" value={k} min={-3} max={3} step={0.1} onChange={setK} color={COLORS.b} />
      <Slider label="Siljish b" value={b} min={-2} max={2} step={0.5} onChange={setB} />
      <Readout rows={[['Tenglama', `y = ${fmt(k, 1)}x ${b >= 0 ? '+' : '−'} ${fmt(Math.abs(b), 1)}`, COLORS.a], ['Qiyalik Δy/Δx', fmt(k, 2), COLORS.b], ['Burchak', `${fmt(deg, 1)}°`]]} />
    </View>
  );
}

// ── 1. Hosila: kesuvchidan urinmaga ─────────────────────────────────────────
function Derivative() {
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

// ── 2. Integral: to'rtburchaklar yig'indisi → yuza ──────────────────────────
function Integral() {
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
                fill={r.h >= 0 ? 'rgba(52,211,153,0.28)' : 'rgba(248,113,113,0.28)'} stroke={r.h >= 0 ? COLORS.d : COLORS.red} strokeWidth={n > 40 ? 0 : 1} />;
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

// ── 3. Birlik aylana: sin va cos qayerdan keladi ────────────────────────────
function UnitCircle() {
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
            <Line x1={cx} y1={cy} x2={px} y2={py} stroke="#fff" strokeWidth={2} />
            <Line x1={cx} y1={cy} x2={px} y2={cy} stroke={COLORS.a} strokeWidth={4} />
            <Line x1={px} y1={cy} x2={px} y2={py} stroke={COLORS.b} strokeWidth={4} />
            <Circle cx={px} cy={py} r={6} fill="#fff" />
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

// ── 4. Vektorlar: qo'shish va tashkil etuvchilar ────────────────────────────
function Vectors() {
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

// ── 5. Harakat: x(t) va v(t) grafiklari bir vaqtda ──────────────────────────
function Motion() {
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

// ── 6. Otilgan jism ─────────────────────────────────────────────────────────
interface Trace { deg: number; v0: number; drag: boolean; pts: { x: number; y: number }[]; range: number; hMax: number; tF: number }
function Projectile() {
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
            {shown && <Path d={path(v, shown)} stroke="#fff" strokeWidth={2.5} fill="none" />}
            {ball && <Circle cx={sx(v, ball.x)} cy={sy(v, ball.y)} r={6} fill="#fff" />}
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

// ── 7. Mayatnik: davr amplitudaga bog'liqmi? ────────────────────────────────
function Pendulum() {
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
            <Line x1={px} y1={py} x2={bx} y2={by} stroke="#fff" strokeWidth={2} />
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

export const SIMS: Record<string, { title: string; C: () => React.JSX.Element }> = {
  slope: { title: 'Qiyalik', C: Slope },
  derivative: { title: 'Kesuvchidan urinmaga', C: Derivative },
  integral: { title: "To'rtburchaklardan yuzaga", C: Integral },
  unitcircle: { title: 'Birlik aylana', C: UnitCircle },
  vectors: { title: "Vektorlarni qo'shish", C: Vectors },
  motion: { title: 'Harakat grafiklari', C: Motion },
  projectile: { title: 'Otilgan jism', C: Projectile },
  pendulum: { title: 'Mayatnik', C: Pendulum },
};
