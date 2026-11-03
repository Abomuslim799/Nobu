/**
 * board.tsx — interaktiv doska (v2): qadamlar bo'yicha chiziladi, savolda doskaning o'zida javob beriladi —
 * chiziq yoki nuqtaga tegish (tap) va nuqtani surish (drag, butun nuqtalarga yopishadi).
 */

import { useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { C, SCHEME } from '@/core/theme';
import { Axes, COLORS, sx, sy, useClock, useWidth, type View2D } from '@/features/science/ui';
import type { Act, Scene, Step, XY } from '@/features/lesson2/types';

export const FORMULA_C = SCHEME === 'light' ? '#8A5A00' : '#FDE68A';
const DRAW_MS = 600, STAGGER_MS = 300, HIT_PX = 30;
const col = (c?: string) => (c === 'w' ? C.text : c && c in COLORS ? COLORS[c as keyof typeof COLORS] : c ?? COLORS.a);

type Item = { a: Exclude<Act, { t: 'scene' | 'hide' | 'formula' }>; delay: number; cur: boolean };
/** n-qadamgacha doska holati. */
export function boardAt(steps: Step[], n: number) {
  let items: Item[] = [], scene: Scene | null = null, formula = '';
  steps.slice(0, n + 1).forEach((st, si) => {
    let order = 0;
    (st.draw ?? []).forEach((a) => {
      if (a.t === 'scene') { scene = a.v; items = []; formula = ''; }
      else if (a.t === 'hide') items = items.filter((x) => !a.ids.includes(x.a.id));
      else if (a.t === 'formula') formula = a.text;
      else items.push({ a, delay: si === n ? order++ * STAGGER_MS : 0, cur: si === n });
    });
  });
  return { items, scene: scene as Scene | null, formula };
}

/** Ekrandagi nuqtadan (px) segment/chiziqqacha masofa. */
function distSeg(p: XY, a: XY, b: XY, infinite: boolean) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L;
  if (!infinite) t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export interface BoardInput {
  tap?: { targets: string[]; onTap: (id: string) => void };
  drag?: { fixed: XY; pos: XY; onMove: (p: XY) => void };
  marks?: Record<string, string>;            // id → rang (tanlangan / to'g'ri / xato)
}

export function Board2({ steps, n, input }: { steps: Step[]; n: number; input?: BoardInput }) {
  const [W, onLayout] = useWidth();
  const [ms, setMs] = useState(0);
  const lastN = useRef(-1);
  if (lastN.current !== n) { lastN.current = n; if (ms !== 0) setMs(0); }
  useClock(ms < 3500, (dt) => setMs((x) => x + dt * 1000));

  const { items, scene, formula } = boardAt(steps, n);
  const H = Math.round(W * 0.72);
  const v: View2D | null = scene && W ? { W, H, x0: scene.x0, x1: scene.x1, y0: scene.y0, y1: scene.y1 } : null;

  // Teginish va surish — PanResponder bitta marta yaratiladi, joriy holat ref orqali o'qiladi
  const live = useRef({ v, items, input, start: [0, 0] as XY, dragging: false });
  live.current = { ...live.current, v, items, input };
  const toMath = (px: XY, vv: View2D): XY => [vv.x0 + (px[0] / vv.W) * (vv.x1 - vv.x0), vv.y0 + ((vv.H - px[1]) / vv.H) * (vv.y1 - vv.y0)];
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !!(live.current.input?.tap || live.current.input?.drag),
    onMoveShouldSetPanResponder: () => !!live.current.input?.drag,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      const L = live.current, p: XY = [e.nativeEvent.locationX, e.nativeEvent.locationY];
      L.start = p;
      if (!L.v) return;
      if (L.input?.drag) {
        const d = L.input.drag, q: XY = [sx(L.v, d.pos[0]), sy(L.v, d.pos[1])];
        L.dragging = Math.hypot(p[0] - q[0], p[1] - q[1]) < HIT_PX * 1.6;
        if (!L.dragging) { const m = toMath(p, L.v); d.onMove([Math.round(m[0]), Math.round(m[1])]); L.dragging = true; }
        return;
      }
      if (L.input?.tap) {
        let best = '', bd = HIT_PX;
        for (const it of L.items) {
          const a = it.a;
          if (!L.input.tap.targets.includes(a.id)) continue;
          let d = Infinity;
          if (a.t === 'point') d = Math.hypot(p[0] - sx(L.v, a.at[0]), p[1] - sy(L.v, a.at[1]));
          else if (a.t === 'line') d = distSeg(p, [sx(L.v, a.p[0][0]), sy(L.v, a.p[0][1])], [sx(L.v, a.p[1][0]), sy(L.v, a.p[1][1])], true);
          else if (a.t === 'seg' || a.t === 'arrow') d = distSeg(p, [sx(L.v, a.from[0]), sy(L.v, a.from[1])], [sx(L.v, a.to[0]), sy(L.v, a.to[1])], false);
          if (d < bd) { bd = d; best = a.id; }
        }
        if (best) L.input.tap.onTap(best);
      }
    },
    onPanResponderMove: (_e, g) => {
      const L = live.current;
      if (!L.v || !L.input?.drag || !L.dragging) return;
      const m = toMath([L.start[0] + g.dx, L.start[1] + g.dy], L.v);
      const r: XY = [Math.round(Math.max(L.v.x0, Math.min(L.v.x1, m[0]))), Math.round(Math.max(L.v.y0, Math.min(L.v.y1, m[1])))];
      if (r[0] !== L.input.drag.pos[0] || r[1] !== L.input.drag.pos[1]) L.input.drag.onMove(r);
    },
    onPanResponderRelease: () => { live.current.dragging = false; },
  })).current;

  const prog = (it: Item) => (it.cur ? Math.max(0, Math.min(1, (ms - it.delay) / DRAW_MS)) : 1);
  const lerp = (a: XY, b: XY, p: number): XY => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
  const marks = input?.marks ?? {};
  const tapIds = new Set(input?.tap?.targets ?? []);

  /** Cheksiz chiziqni doska chegarasigacha cho'zish. */
  const extend = (vv: View2D, a: XY, b: XY): [XY, XY] => {
    if (Math.abs(b[0] - a[0]) < 1e-9) return [[a[0], vv.y0], [a[0], vv.y1]];
    const k = (b[1] - a[1]) / (b[0] - a[0]);
    return [[vv.x0, a[1] + k * (vv.x0 - a[0])], [vv.x1, a[1] + k * (vv.x1 - a[0])]];
  };

  return (
    <View onLayout={onLayout} {...pan.panHandlers}
      style={{ backgroundColor: C.simBg, borderRadius: 14, borderWidth: 1, borderColor: input?.tap || input?.drag ? C.gold : C.cardBorder, overflow: 'hidden' }}>
      <View pointerEvents="none">
        {v ? (
          <Svg width={W} height={H}>
            {scene?.axes !== false && <Axes v={v} stepX={scene?.stepX} stepY={scene?.stepY} labelX={scene?.labelX} labelY={scene?.labelY} />}
            {items.map((it, i) => {
              const p = prog(it);
              if (p <= 0) return null;
              const a = it.a, c = marks[a.id] ?? col(a.c);
              const sw = tapIds.has(a.id) ? 4.5 : 3;
              switch (a.t) {
                case 'line': {
                  const [e0, e1] = extend(v, a.p[0], a.p[1]);
                  const e = lerp(e0, e1, p);
                  return <Line key={i} x1={sx(v, e0[0])} y1={sy(v, e0[1])} x2={sx(v, e[0])} y2={sy(v, e[1])} stroke={c} strokeWidth={sw} />;
                }
                case 'seg': case 'arrow': {
                  const e = lerp(a.from, a.to, p);
                  const x1 = sx(v, a.from[0]), y1 = sy(v, a.from[1]), x2 = sx(v, e[0]), y2 = sy(v, e[1]);
                  const ang = Math.atan2(y2 - y1, x2 - x1), hl = 11;
                  return (
                    <G key={i}>
                      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={sw} strokeDasharray={a.dash ? '6 5' : undefined} />
                      {a.t === 'arrow' && p > 0.9 && <Polygon points={`${x2},${y2} ${x2 - hl * Math.cos(ang - 0.4)},${y2 - hl * Math.sin(ang - 0.4)} ${x2 - hl * Math.cos(ang + 0.4)},${y2 - hl * Math.sin(ang + 0.4)}`} fill={c} />}
                    </G>
                  );
                }
                case 'point': return (
                  <G key={i} opacity={p}>
                    <Circle cx={sx(v, a.at[0])} cy={sy(v, a.at[1])} r={6} fill={c} />
                    {a.label && <SvgText x={sx(v, a.at[0]) + 9} y={sy(v, a.at[1]) - 9} fill={c} fontSize={14} fontWeight="bold">{a.label}</SvgText>}
                  </G>
                );
                case 'text': return <SvgText key={i} x={sx(v, a.at[0])} y={sy(v, a.at[1])} fill={c} fontSize={15} fontWeight="bold" opacity={p} textAnchor="middle">{a.text}</SvgText>;
              }
              return null;
            })}
            {input?.drag && (() => {
              const d = input.drag, [e0, e1] = d.pos[0] === d.fixed[0] && d.pos[1] === d.fixed[1] ? [d.fixed, d.fixed] : extend(v, d.fixed, d.pos);
              return (
                <G>
                  <Line x1={sx(v, e0[0])} y1={sy(v, e0[1])} x2={sx(v, e1[0])} y2={sy(v, e1[1])} stroke={COLORS.c} strokeWidth={3} />
                  <Line x1={sx(v, d.fixed[0])} y1={sy(v, d.fixed[1])} x2={sx(v, d.pos[0])} y2={sy(v, d.fixed[1])} stroke={COLORS.c} strokeWidth={2} strokeDasharray="5 4" />
                  <Line x1={sx(v, d.pos[0])} y1={sy(v, d.fixed[1])} x2={sx(v, d.pos[0])} y2={sy(v, d.pos[1])} stroke={COLORS.c} strokeWidth={2} strokeDasharray="5 4" />
                  <Circle cx={sx(v, d.fixed[0])} cy={sy(v, d.fixed[1])} r={6} fill={C.text} />
                  <Circle cx={sx(v, d.pos[0])} cy={sy(v, d.pos[1])} r={13} fill={COLORS.c} opacity={0.35} />
                  <Circle cx={sx(v, d.pos[0])} cy={sy(v, d.pos[1])} r={7} fill={COLORS.c} />
                </G>
              );
            })()}
          </Svg>
        ) : <View style={{ height: W ? 0 : 1 }} />}
      </View>
      {!!formula && v && (
        <View pointerEvents="none" style={{ padding: 10, backgroundColor: C.codeBg, borderTopWidth: 1, borderTopColor: C.cardBorder }}>
          <SvgFormula text={formula} />
        </View>
      )}
    </View>
  );
}

function SvgFormula({ text }: { text: string }) {
  return <Text style={{ color: FORMULA_C, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{text}</Text>;
}

/** Board bormi (birinchi sahna chizilganmi). */
export const hasBoard = (steps: Step[], n: number) => !!boardAt(steps, n).scene;
