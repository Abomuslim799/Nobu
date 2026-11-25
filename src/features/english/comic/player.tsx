/**
 * player.tsx — komiks pleyer: kadrlar o'zi almashadi (rasmlar galma-gal), effekt ovozi, pufakcha, BOOM yozuvi,
 * tezlik chiziqlari, silkinish, vaqt chizig'i va gap (kalit so'zlar rangli). Panelga bosish — pauza / davom.
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { C } from '@/core/theme';
import { Button, T } from '@/core/ui/kit';
import { say, stopSpeaking } from '@/features/english/speak';
import type { Scene, Sfx, Shot, Sprite } from '@/features/english/comic/types';

const SFX_SRC: Record<Sfx, number> = {
  boom: require('../../../../assets/sounds/sfx/boom.wav'),
  whoosh: require('../../../../assets/sounds/sfx/whoosh.wav'),
  pop: require('../../../../assets/sounds/sfx/pop.wav'),
  ding: require('../../../../assets/sounds/sfx/ding.wav'),
  bonk: require('../../../../assets/sounds/sfx/bonk.wav'),
};
const sfxPlayers: Partial<Record<Sfx, AudioPlayer>> = {};
function playSfx(k: Sfx) {
  try {
    const p = sfxPlayers[k] ?? (sfxPlayers[k] = createAudioPlayer(SFX_SRC[k]));
    p.seekTo(0).then(() => p.play()).catch(() => p.play());
  } catch { /* jim */ }
}

const INK = '#111';
const shotLength = (s: Shot) => s.frames.length * (s.ms ?? 380) * (s.loops ?? 2) + (s.hold ?? 0) + (s.say ? 1200 : 0);

export function ComicPlayer({ scene, onDone }: { scene: Scene; onDone?: () => void }) {
  const [w, setW] = useState(0);
  const [shot, setShot] = useState(0);
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [shake] = useState(() => new Animated.Value(0));
  const s = scene.shots[shot];
  const h = w * 0.75;

  // Kadr boshlanganda: effekt ovozi, gap, silkinish.
  useEffect(() => {
    if (!s || paused) return;
    if (s.sfx) playSfx(s.sfx);
    if (s.say) setTimeout(() => say(`comic-${scene.id}-${shot}`, 's', s.say!), s.sfx === 'boom' ? 700 : 150);
    if (s.fx?.includes('shake')) {
      shake.setValue(0);
      Animated.sequence([0, 1, 2, 3, 4, 5].map((i) => Animated.timing(shake, { toValue: i % 2 ? 8 : -8, duration: 45, useNativeDriver: true }))
        .concat(Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }))).start();
    }
    return () => { stopSpeaking(); };
  }, [shot, paused]);

  // Rasmlar galma-gal, keyin keyingi kadr.
  useEffect(() => {
    if (!s || paused || done) return;
    const ms = s.ms ?? 380;
    const total = s.frames.length * (s.loops ?? 2);
    let n = 0;
    const tick = setInterval(() => {
      n++;
      if (n < total) setFrame(n % s.frames.length);
    }, ms);
    const next = setTimeout(() => {
      if (shot + 1 < scene.shots.length) { setShot(shot + 1); setFrame(0); } else { setDone(true); }
    }, shotLength(s));
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [shot, paused, done, s, scene.shots.length]);

  const replay = () => { setDone(false); setPaused(false); setShot(0); setFrame(0); };
  const skip = () => { if (shot + 1 < scene.shots.length) { setShot(shot + 1); setFrame(0); } else setDone(true); };

  // Vaqt chizig'i va gap — oxirgi ko'rsatilgani saqlanadi (keyingi kadrlarda ham ko'rinib tursin).
  const tl = useMemo(() => [...scene.shots.slice(0, shot + 1)].reverse().find((x) => x.timeline)?.timeline, [scene.shots, shot]);
  const sentence = s?.sentence;

  return (
    <View style={{ gap: 10 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <T bold size={17}>🎬 {scene.title}</T>
      {w > 0 && s && (
        <Pressable onPress={() => setPaused(!paused)}>
          <Animated.View style={{ width: w, height: h, backgroundColor: s.bg ?? '#F4EFE6', borderWidth: 4, borderColor: INK, borderRadius: 6, overflow: 'hidden', transform: [{ translateX: shake }] }}>
            <Effects s={s} w={w} h={h} />
            {s.frames[frame % s.frames.length].map((sp, i) => <SpriteView key={i} sp={sp} w={w} h={h} />)}
            {s.bubble && <Bubble text={s.bubble.text} x={s.bubble.x * w} y={s.bubble.y * h} />}
            {s.sound && (
              <Text style={{ position: 'absolute', left: 0, right: 0, top: s.sound.y * h - 30, textAlign: 'center', fontSize: 52, fontWeight: '900',
                color: '#FFD23F', textShadowColor: INK, textShadowRadius: 1, textShadowOffset: { width: 4, height: 4 }, transform: [{ rotate: '-8deg' }] }}>
                {s.sound.text}
              </Text>
            )}
            {paused && <View style={{ position: 'absolute', right: 8, top: 6 }}><T size={22}>⏸</T></View>}
          </Animated.View>
        </Pressable>
      )}
      {!!s?.caption && <T bold size={16}>{s.caption}</T>}
      {!!sentence && <Sentence text={sentence.text} hi={sentence.hi} />}
      {!!s?.sub && <T dim size={13}>{s.sub}</T>}
      {tl && w > 0 && <Timeline tl={tl} w={w} />}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button kind="ghost" label="↺ Qayta" onPress={replay} /></View>
        {!done && <View style={{ flex: 1 }}><Button kind="ghost" label="⏭ Keyingi kadr" onPress={skip} /></View>}
        {done && onDone && <View style={{ flex: 1 }}><Button label="Davom →" onPress={onDone} /></View>}
      </View>
    </View>
  );
}

function SpriteView({ sp, w, h }: { sp: Sprite; w: number; h: number }) {
  const size = (sp.s ?? 0.2) * w;
  const tf = [{ rotate: `${sp.r ?? 0}deg` }, { scaleX: sp.flip ? -1 : 1 }];
  const pos = { position: 'absolute' as const, left: sp.x * w - size / 2, top: sp.y * h - size / 2, width: size, height: size, transform: tf };
  if (sp.img) return <Image source={{ uri: sp.img }} style={pos} contentFit="contain" />;
  return <Text style={[pos, { fontSize: size * 0.82, lineHeight: size, textAlign: 'center' }]}>{sp.e}</Text>;
}

/** Manga tezlik chiziqlari (speed) va zarba nurlari (impact). */
function Effects({ s, w, h }: { s: Shot; w: number; h: number }) {
  if (!s.fx?.some((f) => f === 'speed' || f === 'impact')) return null;
  const lines = [];
  if (s.fx.includes('impact')) {
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, r0 = w * 0.22, r1 = w * 0.9;
      lines.push(<Line key={`i${i}`} x1={w / 2 + Math.cos(a) * r0} y1={h * 0.55 + Math.sin(a) * r0} x2={w / 2 + Math.cos(a) * r1} y2={h * 0.55 + Math.sin(a) * r1} stroke={INK} strokeWidth={i % 2 ? 2 : 4} opacity={0.5} />);
    }
  }
  if (s.fx.includes('speed')) {
    for (let i = 0; i < 9; i++) {
      const y = (i + 0.5) * (h / 9);
      lines.push(<Line key={`s${i}`} x1={w * (0.55 + (i % 3) * 0.1)} y1={y - w * 0.12} x2={w} y2={y - w * 0.3} stroke={INK} strokeWidth={2} opacity={0.35} />);
    }
  }
  return <Svg width={w} height={h} style={{ position: 'absolute' }}>{lines}</Svg>;
}

function Bubble({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <View style={{ position: 'absolute', left: Math.max(6, x - 80), top: Math.max(6, y - 26), maxWidth: 170 }}>
      <View style={{ backgroundColor: '#fff', borderWidth: 3, borderColor: INK, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 }}>
        <Text style={{ color: INK, fontWeight: '800', fontSize: 16 }}>{text}</Text>
      </View>
      <View style={{ width: 0, height: 0, marginLeft: 26, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: INK }} />
    </View>
  );
}

/** Gap: kalit so'zlar rangli va katta (urg'u). */
function Sentence({ text, hi }: { text: string; hi: string[] }) {
  const parts: { t: string; on: boolean }[] = [];
  let rest = text;
  while (rest) {
    const m = hi.map((x) => ({ x, i: rest.indexOf(x) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i)[0];
    if (!m) { parts.push({ t: rest, on: false }); break; }
    if (m.i) parts.push({ t: rest.slice(0, m.i), on: false });
    parts.push({ t: m.x, on: true });
    rest = rest.slice(m.i + m.x.length);
  }
  return (
    <Text style={{ fontSize: 22, color: C.text, fontWeight: '600' }}>
      {parts.map((p, i) => <Text key={i} style={p.on ? { color: C.gold, fontWeight: '900', fontSize: 25 } : null}>{p.t}</Text>)}
    </Text>
  );
}

/** Vaqt chizig'i: PAST ——— NOW. Nuqta — tugagan voqea, chiziq — davom etgan harakat. */
function Timeline({ tl, w }: { tl: NonNullable<Shot['timeline']>; w: number }) {
  const H = 70, y = 36, x0 = 20, x1 = w - 20, X = (t: number) => x0 + t * (x1 - x0);
  const now = 0.9;
  return (
    <Svg width={w} height={H}>
      <Line x1={x0} y1={y} x2={x1} y2={y} stroke={C.dim} strokeWidth={2} />
      <Polygon points={`${x1},${y} ${x1 - 10},${y - 6} ${x1 - 10},${y + 6}`} fill={C.dim} />
      <SvgText x={x0} y={y + 26} fill={C.dim} fontSize={12}>PAST</SvgText>
      <Line x1={X(now)} y1={y - 10} x2={X(now)} y2={y + 10} stroke={C.green} strokeWidth={3} />
      <SvgText x={X(now) - 14} y={y + 26} fill={C.green} fontSize={12} fontWeight="bold">NOW</SvgText>
      {(tl.kind === 'line' || tl.kind === 'line+point') && (
        <Line x1={X(tl.from ?? 0.1)} y1={y} x2={X(tl.kind === 'line' ? tl.at : tl.at)} y2={y} stroke="#60A5FA" strokeWidth={8} strokeLinecap="round" />
      )}
      {(tl.kind === 'point' || tl.kind === 'line+point') && <Circle cx={X(tl.at)} cy={y} r={9} fill="#F87171" stroke={INK} strokeWidth={2} />}
      {tl.kind === 'arrow' && <Line x1={X(tl.from ?? 0.3)} y1={y} x2={X(now)} y2={y} stroke="#F87171" strokeWidth={6} />}
      {!!tl.label && <SvgText x={Math.min(X(tl.at), x1 - 120)} y={y - 16} fill={C.text} fontSize={13} fontWeight="bold">{tl.label}</SvgText>}
    </Svg>
  );
}
