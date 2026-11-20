/**
 * home.tsx — Shaxmat bosh sahifasi ("Samarqand tuni"): girih medalyoni (bugungi masalalar bilan to'ladi, o'rtada reyting),
 * Masalalar, Farobiy bilan, Debyut, zaif joy eslatmasi, so'nggi o'yinlar. Yagona orkestrlangan animatsiya:
 * ochilganda yulduz cheti chiziladi, reyting sanaladi, qolgani ohista ko'tariladi.
 */

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { C, FONT_INSCR, FONT_UI } from '@/core/theme';
import { T } from '@/core/ui/kit';
import type { ChessState } from '@/features/brain/brain';
import { CAUSE } from '@/features/chess/analysis';
import { BOT_GAP } from '@/features/chess/analysis';
import { getBot } from '@/features/chess/bot';
import { loadAn, loadCom, type ComGame, type GameAn } from '@/features/chess/chesscom';
import { diagnose } from '@/features/chess/coach';
import { DAY_GOAL, getDay, type Day } from '@/features/chess/day';
import { isDue, loadBoxes } from '@/features/chess/lessons';

export type Section = 'home' | 'puzzles' | 'themes' | 'open' | 'games' | 'stats';
const GOLD = '#D9B46A', FIR = '#36C2B4', IVORY = '#EFE8DA', OK = '#7CC27A', ANOR = '#D2555F';

/** 8 qirrali girih yulduzi (ikki kvadrat) — 16 nuqtali ko'pburchak va uning perimetri. */
export function starPts(cx: number, cy: number, r: number, inner = 0.78) {
  const p: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2, rr = i % 2 === 0 ? r : r * inner;
    p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  const d = 'M' + p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L') + ' Z';
  let len = 0;
  for (let i = 0; i < 16; i++) { const [a, b] = p[i], [c, e] = p[(i + 1) % 16]; len += Math.hypot(c - a, e - b); }
  return { d, len };
}

const APath = Animated.createAnimatedComponent(Path);

/** Medalyon: yulduz cheti firuza bilan to'ladi (progress 0…1), o'rtada raqam sanab chiqadi. */
export function Medallion({ value, progress, label, sub, size = 200 }: { value: number; progress: number; label: string; sub?: { text: string; color: string }; size?: number }) {
  const s = useMemo(() => starPts(90, 90, 80), []);
  const p = useSharedValue(0);
  const [shown, setShown] = useState(0);
  useEffect(() => { p.value = withTiming(Math.max(0.02, Math.min(1, progress)), { duration: 1100, easing: Easing.out(Easing.cubic) }); }, [progress]);
  useEffect(() => {                                           // raqam sanab chiqadi (≈0.9 s)
    let raf = 0; const t0 = Date.now(), from = Math.max(0, value - 120);
    const tick = () => { const k = Math.min(1, (Date.now() - t0) / 900); setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: s.len * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="-10 -10 200 200" style={{ position: 'absolute' }}>
        <Path d={s.d} fill="#0E1833" stroke="#2A3B66" strokeWidth={7} strokeLinejoin="round" />
        <APath d={s.d} fill="none" stroke={FIR} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${s.len} ${s.len}`} animatedProps={ap} />
        <Circle cx={90} cy={90} r={50} fill="none" stroke={GOLD} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <T size={40} style={{ fontFamily: FONT_INSCR, lineHeight: 46 }}>{shown}</T>
        <T size={12} dim style={{ fontFamily: FONT_UI.r, marginTop: 2 }}>{label}</T>
        {sub && <T size={12.5} color={sub.color} style={{ fontFamily: FONT_UI.b, marginTop: 2 }}>{sub.text}</T>}
      </View>
    </View>
  );
}

/** Orqa fondagi koshin naqshi — markazdan chetga qarab so'nadi. */
export function GirihField({ w, h, opacity = 0.07 }: { w: number; h: number; opacity?: number }) {
  const cells = useMemo(() => {
    const out: string[] = [];
    for (let y = 0; y < h + 60; y += 60) for (let x = 0; x < w + 60; x += 60) out.push(starPts(x, y, 22, 0.72).d);
    return out.join(' ');
  }, [w, h]);
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      <Defs>
        <RadialGradient id="fade" cx="50%" cy="45%" r="60%"><Stop offset="0" stopColor={C.bg} stopOpacity={0} /><Stop offset="1" stopColor={C.bg} stopOpacity={1} /></RadialGradient>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={FIR} stopOpacity={0.2} /><Stop offset="1" stopColor={FIR} stopOpacity={0} /></RadialGradient>
      </Defs>
      <G opacity={opacity}><Path d={cells} fill="none" stroke={GOLD} strokeWidth={1} /></G>
      <Rect width={w} height={h} fill="url(#fade)" />
      <Circle cx={w / 2} cy={h * 0.52} r={Math.min(w, h) * 0.48} fill="url(#glow)" />
    </Svg>
  );
}

const enter = (i: number) => FadeInDown.delay(250 + i * 70).duration(420).easing(Easing.out(Easing.cubic));

export function ChessHome({ st, open, width }: { st: ChessState; open: (s: Section) => void; width: number }) {
  const [day, setDay] = useState<Day | null>(null);
  const [games, setGames] = useState<ComGame[]>([]);
  const [an, setAn] = useState<Record<string, GameAn>>({});
  const [bot, setBot] = useState<number | null>(null);
  const [due, setDue] = useState(0);
  useEffect(() => {
    getDay(st.rating).then(setDay);
    Promise.all([loadCom(), loadAn()]).then(([c, m]) => { setGames(c.games); setAn(m); });
    getBot().then((b) => setBot(b.rating + BOT_GAP));
    loadBoxes().then((b) => setDue(Object.values(b).filter((x) => isDue(x)).length));
  }, [st.rating]);

  const d = games.length ? diagnose(games, an) : null;
  const top = d?.causes[0];
  const delta = day ? st.rating - day.start : 0;
  const com = games.find((g) => g.me)?.me;
  const recent = games.slice(0, 2);

  return (
    <View>
      <View style={{ height: 250, alignItems: 'center', justifyContent: 'center' }}>
        <GirihField w={width} h={270} />
        <Medallion value={st.rating} progress={(day?.n ?? 0) / DAY_GOAL} label="masala reytingi"
          sub={delta ? { text: `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)} bugun`, color: delta > 0 ? OK : ANOR } : undefined} />
      </View>
      <Animated.View entering={enter(0)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: -6, flexWrap: 'wrap' }}>
        {!!day?.streak && <Chip text={`🔥 ${day.streak} kun ketma-ket`} />}
        <Chip text={`Bugun ${Math.min(day?.n ?? 0, DAY_GOAL)} / ${DAY_GOAL}`} />
        {!!com && <Chip text={`chess.com ${com}`} />}
      </Animated.View>

      <View style={{ padding: 16, gap: 10 }}>
        <Animated.View entering={enter(1)}>
          <Pressable onPress={() => open('puzzles')} style={({ pressed }) => [tile, { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#16244A', transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <MiniBoard />
            <View style={{ flex: 1 }}>
              <T size={17} style={{ fontFamily: FONT_UI.xb }}>Masalalar</T>
              <T dim size={12.5} style={{ fontFamily: FONT_UI.r, marginTop: 3 }}>{(day?.n ?? 0) >= DAY_GOAL ? 'Kunlik vazifa bajarildi — davom eting' : `Kunlik vazifadan ${DAY_GOAL - (day?.n ?? 0)} tasi qoldi`}</T>
            </View>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: FIR, alignItems: 'center', justifyContent: 'center' }}><T bold size={18} color="#06221F">›</T></View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={enter(2)} style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => router.push('/chess/bot')} style={({ pressed }) => [tile, { flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <T size={20}>🧔🏻</T>
            <T size={14.5} style={{ fontFamily: FONT_UI.xb, marginTop: 8 }}>Farobiy bilan</T>
            <T dim size={12} style={{ fontFamily: FONT_UI.r }}>{bot ? `Taxminan ${bot} kuchida` : 'Darajangizga moslashadi'}</T>
          </Pressable>
          <Pressable onPress={() => open('open')} style={({ pressed }) => [tile, { flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <T size={20}>📖</T>
            <T size={14.5} style={{ fontFamily: FONT_UI.xb, marginTop: 8 }}>Debyut</T>
            <T size={12} color={due ? GOLD : C.dim} style={{ fontFamily: FONT_UI.r }}>{due ? `${due} ta dars takrorlashni kutyapti` : '8 ta dars, mashq va takrorlash'}</T>
          </Pressable>
        </Animated.View>

        {top && (
          <Animated.View entering={enter(3)}>
            <Pressable onPress={() => open('themes')} style={{ paddingVertical: 12, paddingHorizontal: 14, borderLeftWidth: 2, borderLeftColor: GOLD, backgroundColor: '#181C2C', borderTopRightRadius: 14, borderBottomRightRadius: 14 }}>
              <T size={14} style={{ fontFamily: FONT_UI.b }}>Zaif joyingiz: {CAUSE[top.cause].name.toLowerCase()}</T>
              <T dim size={12.5} style={{ fontFamily: FONT_UI.r, marginTop: 3 }}>Xatolaringizning {top.pct}% shu turdan. {CAUSE[top.cause].tip}</T>
              <T size={12.5} color={GOLD} style={{ fontFamily: FONT_UI.b, marginTop: 6 }}>Shu mavzuda mashq qilish ›</T>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={enter(4)}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6, marginBottom: 2 }}>
            <T size={19} style={{ fontFamily: FONT_INSCR }}>O'yinlarim</T>
            <Pressable onPress={() => open('games')} hitSlop={10}><T size={13} color={FIR} style={{ fontFamily: FONT_UI.sb }}>Hammasi</T></Pressable>
          </View>
          {!recent.length && <Pressable onPress={() => open('games')}><T dim size={13} style={{ paddingVertical: 10 }}>chess.com o'yinlaringizni ulash uchun bosing</T></Pressable>}
          {recent.map((g) => <GameRow key={g.id} g={g} a={an[g.id]} />)}
          <Pressable onPress={() => open('stats')} style={{ paddingVertical: 12 }}><T size={13} color={C.dim} style={{ fontFamily: FONT_UI.sb }}>📈 Statistika va tashxis ›</T></Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const tile = { padding: 14, borderRadius: 20, backgroundColor: '#121D3B', borderWidth: 1, borderColor: '#24345F' } as const;

function Chip({ text }: { text: string }) {
  return <View style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#24345F', backgroundColor: '#0E1730' }}><T size={12} style={{ fontFamily: FONT_UI.sb }}>{text}</T></View>;
}

function MiniBoard() {
  return (
    <View style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: 16 }, (_, i) => <View key={i} style={{ width: 19, height: 19, backgroundColor: (Math.floor(i / 4) + i) % 2 ? '#3F7F86' : '#EDE3CC' }} />)}
    </View>
  );
}

/** O'yin qatori: chapda natija chizig'i, o'rtada raqib va debyut, o'ngda aniqlik (Marcellus). */
export function GameRow({ g, a, onAsk, busy }: { g: ComGame; a?: GameAn; onAsk?: (g: ComGame) => void; busy?: boolean }) {
  const col = g.result === 'win' ? OK : g.result === 'draw' ? C.dim : ANOR;
  const word = g.result === 'win' ? "g'alaba" : g.result === 'draw' ? 'durang' : "mag'lubiyat";
  const bad = a ? a.moves.filter((m) => m.label === 'blunder' || m.label === 'mistake' || m.label === 'miss').length : 0;
  return (
    <Pressable onPress={() => a && router.push({ pathname: '/chess/review', params: { id: g.id } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#1A2547', opacity: pressed ? 0.6 : 1 })}>
      <View style={{ width: 5, height: 32, borderRadius: 3, backgroundColor: col }} />
      <View style={{ flex: 1 }}>
        <T size={14} style={{ fontFamily: FONT_UI.b }} lines={1}>{g.oppName} bilan {word} <T dim size={12} style={{ fontFamily: FONT_UI.r }}>{g.opp}</T></T>
        <T dim size={12} style={{ fontFamily: FONT_UI.r }} lines={1}>{[a?.opening?.split(':')[0], g.color === 'w' ? 'oqlar' : 'qoralar', ago(g.at)].filter(Boolean).join(', ')}</T>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {a || !onAsk
          ? <T size={17} style={{ fontFamily: FONT_UI.xb }}>{a ? `${a.acc}%` : '…'}</T>
          : <Pressable onPress={() => onAsk(g)} disabled={busy} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: busy ? '#24345F' : '#36C2B4' }}>
              <T size={12} color={busy ? C.dim : '#36C2B4'} style={{ fontFamily: FONT_UI.b }}>☁️ Tahlil</T>
            </Pressable>}
        {!!a && <T size={11} color={bad ? ANOR : OK} style={{ fontFamily: FONT_UI.sb }}>{bad ? `${bad} xato` : 'toza'}</T>}
      </View>
    </Pressable>
  );
}

export function ago(at: number) {
  const d = new Date(at), now = new Date();
  const day = (x: Date) => Math.floor((x.getTime() - x.getTimezoneOffset() * 60000) / 86400000);
  const k = day(now) - day(d);
  return k === 0 ? 'bugun' : k === 1 ? 'kecha' : k < 7 ? `${k} kun oldin` : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
export { IVORY };
