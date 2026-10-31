/**
 * board.tsx — Nobu doskada tushuntiradi: har qadamda ovoz (Sardor, mp3) va shu paytda doskada chizish.
 * Ssenariy — src/science/boards/<dars>.json: { say (ovoz matni), sub? (subtitr), draw: [amallar] }.
 * Ovoz CI'da yasaladi (scripts/make_audio.py → sci-<dars>-b<n>.mp3). mp3 bo'lmasa — subtitr bilan vaqt bo'yicha davom etadi.
 * Amallar: axes, fn (y = kx + b), curve (FUNCS), seg, arrow, point, text, formula, hide, clear.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import { C } from '@/constants/theme';
import { AUDIO } from '@/data/audio';
import { fnById } from './engine';
import { Axes, COLORS, path, sample, sx, sy, useClock, useWidth, type View2D } from './ui';

import m0 from './boards/m0.json';

type XY = [number, number];
export type Act =
  | { t: 'axes' } | { t: 'clear' } | { t: 'hide'; ids: string[] } | { t: 'formula'; text: string }
  | { t: 'fn'; id: string; k: number; b: number; c?: string }
  | { t: 'curve'; id: string; f: string; c?: string }
  | { t: 'seg' | 'arrow'; id: string; from: XY; to: XY; c?: string; dash?: boolean }
  | { t: 'point'; id: string; at: XY; c?: string }
  | { t: 'text'; id: string; at: XY; text: string; c?: string; anchor?: 'start' | 'middle' | 'end' };
export interface BoardScript { id: string; view: { x0: number; x1: number; y0: number; y1: number }; steps: { say: string; sub?: string; draw: Act[] }[] }

export const BOARDS: Record<string, BoardScript> = { m0: m0 as BoardScript };

const AUDIO_BASE = 'https://abomuslim799.github.io/Nobu/audio/';
const col = (c?: string) => (c === 'w' ? '#FFFFFF' : c && c in COLORS ? COLORS[c as keyof typeof COLORS] : c ?? COLORS.a);
const DRAW_MS = 700;        // bitta amalning chizilish vaqti
const STAGGER_MS = 350;     // bir qadamdagi amallar orasidagi kechikish

/** n-qadamgacha bo'lgan holat: ko'rinadigan amallar va har birining chizilish boshlanish vaqti (joriy qadam ichida). */
function stateAt(sc: BoardScript, n: number) {
  let items: { a: Act; delay: number; cur: boolean }[] = [];
  let axes = false, formula = '';
  sc.steps.slice(0, n + 1).forEach((st, si) => {
    let order = 0;
    st.draw.forEach((a) => {
      if (a.t === 'axes') axes = true;
      else if (a.t === 'clear') items = [];
      else if (a.t === 'hide') items = items.filter((x) => !('id' in x.a) || !a.ids.includes(x.a.id));
      else if (a.t === 'formula') formula = a.text;
      else items.push({ a, delay: si === n ? order++ * STAGGER_MS : 0, cur: si === n });
    });
  });
  return { items, axes, formula };
}

export function Board({ id }: { id: string }) {
  const sc = BOARDS[id];
  const [W, onLayout] = useWidth();
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ms, setMs] = useState(10_000);             // joriy qadam boshidan o'tgan vaqt (chizish animatsiyasi uchun)
  const player = useRef<AudioPlayer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef({ n: 0, playing: false });
  stepRef.current = { n, playing };

  useClock(ms < 4000, (dt) => setMs((x) => x + dt * 1000));

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(null);
    player.current = p;
    const sub = p.addListener('playbackStatusUpdate', (st) => {
      if (st.didJustFinish && stepRef.current.playing) advanceLater(800);
    });
    return () => { sub.remove(); p.remove(); if (timer.current) clearTimeout(timer.current); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!sc) return null;
  const steps = sc.steps;

  const advanceLater = (delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = stepRef.current.n + 1;
      if (next < steps.length) play(next); else { setPlaying(false); }
    }, delay);
  };

  const play = (k: number) => {
    if (timer.current) clearTimeout(timer.current);
    setN(k); setMs(0); setPlaying(true);
    stepRef.current = { n: k, playing: true };
    const p = player.current;
    const part = `b${k}`;
    if (p && AUDIO[`sci-${sc.id}`]?.includes(part)) {
      p.replace({ uri: `${AUDIO_BASE}sci-${sc.id}-${part}.mp3` });
      p.play();
    } else {
      advanceLater(Math.max(2500, steps[k].say.length * 70));     // ovoz yo'q — o'qish vaqti bo'yicha
    }
  };
  const pause = () => { setPlaying(false); player.current?.pause(); if (timer.current) clearTimeout(timer.current); };
  const go = (k: number) => { pause(); setN(k); setMs(10_000); };

  const { items, axes, formula } = stateAt(sc, n);
  const H = Math.round(W * 0.78);
  const v: View2D = { W, H, ...sc.view };
  const prog = (it: { delay: number; cur: boolean }) => (it.cur ? Math.max(0, Math.min(1, (ms - it.delay) / DRAW_MS)) : 1);
  const lerp = (a: XY, b: XY, p: number): XY => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];

  return (
    <View style={{ gap: 10 }}>
      <View onLayout={onLayout} style={{ backgroundColor: '#0E1512', borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' }}>
        {W > 0 && (
          <Svg width={W} height={H}>
            {axes && <Axes v={v} />}
            {items.map((it, i) => {
              const p = prog(it);
              if (p <= 0) return null;
              const a = it.a, c = col('c' in a ? a.c : undefined);
              switch (a.t) {
                case 'fn': {
                  const x1 = v.x0 + (v.x1 - v.x0) * p;
                  return <Path key={i} d={path(v, [{ x: v.x0, y: a.k * v.x0 + a.b }, { x: x1, y: a.k * x1 + a.b }])} stroke={c} strokeWidth={3} fill="none" />;
                }
                case 'curve': {
                  const f = fnById(a.f);
                  return <Path key={i} d={path(v, sample(f.f, v.x0, v.x0 + (v.x1 - v.x0) * p))} stroke={c} strokeWidth={3} fill="none" />;
                }
                case 'seg': case 'arrow': {
                  const e = lerp(a.from, a.to, p);
                  const x1 = sx(v, a.from[0]), y1 = sy(v, a.from[1]), x2 = sx(v, e[0]), y2 = sy(v, e[1]);
                  const ang = Math.atan2(y2 - y1, x2 - x1), hl = 11;
                  return (
                    <G key={i}>
                      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={3} strokeDasharray={a.dash ? '6 5' : undefined} />
                      {a.t === 'arrow' && p > 0.9 && <Polygon points={`${x2},${y2} ${x2 - hl * Math.cos(ang - 0.4)},${y2 - hl * Math.sin(ang - 0.4)} ${x2 - hl * Math.cos(ang + 0.4)},${y2 - hl * Math.sin(ang + 0.4)}`} fill={c} />}
                    </G>
                  );
                }
                case 'point': return <Circle key={i} cx={sx(v, a.at[0])} cy={sy(v, a.at[1])} r={6 * p} fill={c} />;
                case 'text': return <SvgText key={i} x={sx(v, a.at[0])} y={sy(v, a.at[1])} fill={c} fontSize={15} fontWeight="bold" opacity={p} textAnchor={a.anchor ?? 'middle'}>{a.text}</SvgText>;
              }
              return null;
            })}
          </Svg>
        )}
      </View>
      {/* Formula — doska ostida (chizmani to'smasin) */}
      <View style={{ minHeight: 44, padding: 10, borderRadius: 10, backgroundColor: C.codeBg, justifyContent: 'center', opacity: formula ? 1 : 0 }}>
        <Text style={{ color: '#FDE68A', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{formula || ' '}</Text>
      </View>

      {/* Subtitr */}
      <View style={{ minHeight: 72, padding: 12, borderRadius: 12, backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' }}>
        <Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>🤖 Nobu · {n + 1}/{steps.length}</Text>
        <Text style={{ color: C.text, fontSize: 16, lineHeight: 23 }}>{steps[n].sub ?? steps[n].say}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Ctl label="‹" onPress={() => go(Math.max(0, n - 1))} disabled={n === 0} />
        <Pressable onPress={() => (playing ? pause() : play(n >= steps.length - 1 && !playing && ms > 4000 ? 0 : n))}
          style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: playing ? C.redSoft : C.green }}>
          <Text style={{ color: playing ? C.text : C.bg, fontWeight: '800', fontSize: 16 }}>
            {playing ? '⏸ Pauza' : n === 0 && ms > 4000 ? '▶ Nobu tushuntirsin' : n >= steps.length - 1 ? '🔁 Boshidan' : '▶ Davom'}
          </Text>
        </Pressable>
        <Ctl label="›" onPress={() => go(Math.min(steps.length - 1, n + 1))} disabled={n >= steps.length - 1} />
      </View>
    </View>
  );
}

function Ctl({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)', opacity: disabled ? 0.3 : 1 }}>
      <Text style={{ color: C.text, fontSize: 22 }}>{label}</Text>
    </Pressable>
  );
}
