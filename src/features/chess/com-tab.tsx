/**
 * com-tab.tsx — chess.com o'yinlari:
 *   GamesTab — O'yinlarim: server holati bitta qatorda, filtrlar, kunlar bo'yicha ro'yxat (aniqlik va xatolar soni).
 *   StatsTab — Statistika: davr bo'yicha aniqlik grafigi, xato manbalari, bosqichlar, uslub, debyutlar, haftalik reja.
 * Username — Shaxmat → ⚙︎ sozlamalarida.
 */

import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { C, FONT_INSCR, FONT_UI } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { BAD, CAUSE } from '@/features/chess/analysis';
import { analyseAll, cloudRun, cloudStatus, fetchCom, loadAn, loadCom, syncCloud, type CloudStatus, type ComGame, type GameAn } from '@/features/chess/chesscom';
import { diagnose, style, weeklyPlan } from '@/features/chess/coach';
import { ago, GameRow } from '@/features/chess/home';

const FIR = '#36C2B4', GOLD = '#D9B46A', OK = '#7CC27A', ANOR = '#D2555F', EDGE = '#24345F', TILE = '#121D3B';
const hm = (s: number) => new Date(s * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
type Filter = 'all' | 'win' | 'loss' | 'rapid' | 'blitz' | 'bullet';
const FILTERS: [Filter, string][] = [['all', 'Hammasi'], ['win', "G'alaba"], ['loss', "Mag'lubiyat"], ['rapid', 'Rapid'], ['blitz', 'Blitz'], ['bullet', 'Bullet']];
const speed = (g: ComGame) => (g.base < 180 ? 'bullet' : g.base < 600 ? 'blitz' : 'rapid');

function Chips<V extends string>({ items, v, on }: { items: [V, string][]; v: V; on: (x: V) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map(([id, l]) => (
        <Pressable key={id} onPress={() => on(id)} style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, backgroundColor: v === id ? C.text : 'transparent', borderWidth: 1, borderColor: v === id ? C.text : EDGE }}>
          <T size={12.5} color={v === id ? C.bg : C.dim} style={{ fontFamily: v === id ? FONT_UI.b : FONT_UI.sb }}>{l}</T>
        </Pressable>
      ))}
    </View>
  );
}

/** Server ishlayotganda nuqta "nafas oladi". */
function Dot({ live }: { live: boolean }) {
  const o = useSharedValue(1);
  useEffect(() => { o.value = live ? withRepeat(withTiming(0.25, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true) : withTiming(1); }, [live]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: FIR }, st]} />;
}

export function GamesTab() {
  const [user, setUser] = useState('Abomuslim0');
  const [games, setGames] = useState<ComGame[]>([]);
  const [an, setAn] = useState<Record<string, GameAn>>({});
  const [cs, setCs] = useState<CloudStatus | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [f, setF] = useState<Filter>('all');
  const [prog, setProg] = useState<{ done: number; total: number } | null>(null);
  const seen = useRef(-1), stop = useRef(false);

  const pull = async () => {
    const s = await syncCloud();
    if (s && (s.added || s.analysed)) setNote(`+${s.added} o'yin, ${s.analysed} tahlil olindi`);
    const [c, m] = await Promise.all([loadCom(), loadAn()]);
    setUser(c.user); setGames(c.games); setAn(m);
  };
  useEffect(() => { pull(); cloudStatus().then(setCs).catch(() => {}); return () => { stop.current = true; }; }, []);
  useEffect(() => {                                        // server ishlayotganda — har 4 s holat, har yangi o'yinda natija
    if (!cs?.running) return;
    const t = setInterval(async () => {
      const s = await cloudStatus().catch(() => null);
      if (!s) return;
      if (s.done !== seen.current || !s.running) { seen.current = s.done; await pull(); }
      setCs(s);
    }, 4000);
    return () => clearInterval(t);
  }, [cs?.running]);

  const refresh = async () => {
    setErr(''); setNote("chess.com'dan yangilari olinmoqda…");
    try { await fetchCom(user, 30); setNote(''); } catch (e) { setNote(''); setErr(e instanceof Error ? e.message : String(e)); }
    try { setCs(await cloudRun()); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    const [c, m] = await Promise.all([loadCom(), loadAn()]); setGames(c.games); setAn(m);
  };
  const phone = async () => {
    stop.current = false; setProg({ done: 0, total: 0 });
    const res = await analyseAll((done, total) => setProg({ done, total }), () => stop.current);
    setAn({ ...res }); setProg(null);
  };

  const todo = games.filter((g) => !an[g.id]).length;
  const shown = games.filter((g) => (f === 'all' ? true : f === 'win' ? g.result === 'win' : f === 'loss' ? g.result === 'loss' : speed(g) === f));
  const groups: { day: string; gs: ComGame[] }[] = [];
  shown.slice(0, 80).forEach((g) => { const d = ago(g.at); const last = groups[groups.length - 1]; if (last?.day === d) last.gs.push(g); else groups.push({ day: d, gs: [g] }); });
  const status = cs?.running ? `Server tahlil qilmoqda${cs.total ? `: ${cs.done} / ${cs.total}` : '…'}`
    : cs ? `${games.length - todo} / ${games.length} tahlil tayyor${cs.updated ? `, ${hm(cs.updated)}` : ''}` : 'Server ulanmagan';

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: '#10283A', borderWidth: 1, borderColor: '#1D4A5E' }}>
        <Dot live={!!cs?.running} />
        <View style={{ flex: 1 }}>
          <T size={13} style={{ fontFamily: FONT_UI.sb }}>{status}</T>
          {!!(note || cs?.error || err) && <T size={11.5} color={err || cs?.error ? ANOR : C.dim} lines={2}>{err || note || `⚠️ ${cs?.error}`}</T>}
        </View>
        <Pressable onPress={refresh} disabled={!!cs?.running} hitSlop={8}><T size={13} color={cs?.running ? C.dim : FIR} style={{ fontFamily: FONT_UI.b }}>Yangilash</T></Pressable>
      </View>
      <Chips items={FILTERS} v={f} on={setF} />
      {!games.length && <T dim size={14}>Hali o'yin yo'q. Username: {user} (⚙︎ sozlamalarda o'zgartiriladi). "Yangilash"ni bosing.</T>}
      {groups.map((g) => (
        <View key={g.day}>
          <T dim size={12} style={{ fontFamily: FONT_UI.sb, marginTop: 4 }}>{g.day[0].toUpperCase() + g.day.slice(1)}</T>
          {g.gs.map((x) => <GameRow key={x.id} g={x} a={an[x.id]} />)}
        </View>
      ))}
      {todo > 0 && !cs?.running && (prog
        ? <Pressable onPress={() => { stop.current = true; }}><T dim size={12}>📱 Telefonda: {prog.done} / {prog.total || todo} — to'xtatish</T></Pressable>
        : <Pressable onPress={phone} hitSlop={6}><T dim size={12} style={{ textDecorationLine: 'underline' }}>📱 Server o'rniga telefonda tahlil qilish ({todo})</T></Pressable>)}
    </View>
  );
}

type Period = '7' | '30' | 'all';
export function StatsTab() {
  const [games, setGames] = useState<ComGame[]>([]);
  const [an, setAn] = useState<Record<string, GameAn>>({});
  const [p, setP] = useState<Period>('30');
  const [w, setW] = useState(0);
  useEffect(() => { Promise.all([loadCom(), loadAn()]).then(([c, m]) => { setGames(c.games); setAn(m); }); }, []);

  const since = p === 'all' ? 0 : Date.now() - Number(p) * 86400000;
  const gs = games.filter((g) => g.at >= since && an[g.id]);
  if (!gs.length) return <><Chips items={[['7', '7 kun'], ['30', '30 kun'], ['all', 'Hammasi']]} v={p} on={setP} /><T dim>Bu davrda tahlil qilingan o'yin yo'q.</T></>;
  const d = diagnose(gs, an), st = gs.length >= 5 ? style(gs, an) : [], plan = weeklyPlan(d);
  const wins = Math.round((gs.filter((g) => g.result === 'win').length / gs.length) * 100);
  const errs = gs.reduce((s, g) => s + an[g.id].moves.filter((m) => BAD.includes(m.label)).length, 0) / gs.length;
  const accs = [...gs].reverse().map((g) => an[g.id].acc);           // eskidan yangiga
  const H = 90, min = Math.min(...accs) - 3, max = Math.max(...accs) + 3;
  const pts = accs.map((a, i) => [accs.length > 1 ? (i / (accs.length - 1)) * w : w / 2, H - ((a - min) / Math.max(1, max - min)) * (H - 8) - 4]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const phMax = Math.max(1, ...d.phases.map((x) => x.n));
  const trend = d.accRecent !== null && d.accPrev !== null ? d.accRecent - d.accPrev : null;

  return (
    <View style={{ gap: 12 }}>
      <Chips items={[['7', '7 kun'], ['30', '30 kun'], ['all', 'Hammasi']]} v={p} on={setP} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Kpi v={`${d.acc}%`} l="aniqlik" />
        <Kpi v={`${wins}%`} l="g'alaba" color={wins >= 50 ? OK : C.text} />
        <Kpi v={errs.toFixed(1)} l="xato / o'yin" />
      </View>
      <Box>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T size={14} style={{ fontFamily: FONT_UI.b }}>Aniqlik, {gs.length} o'yin</T>
          {trend !== null && <T size={12} color={trend >= 0 ? OK : ANOR}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)} oxirgi o'yinlarda</T>}
        </View>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H, marginTop: 10 }}>
          {w > 0 && (
            <Svg width={w} height={H}>
              <Defs><LinearGradient id="a" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={FIR} stopOpacity={0.4} /><Stop offset="1" stopColor={FIR} stopOpacity={0} /></LinearGradient></Defs>
              <Path d={`${line} L${w},${H} L0,${H} Z`} fill="url(#a)" />
              <Path d={line} fill="none" stroke={FIR} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            </Svg>
          )}
        </View>
      </Box>
      <Box>
        <T size={14} style={{ fontFamily: FONT_UI.b }}>Xatolar qayerdan</T>
        {d.causes.slice(0, 4).map((c, i) => (
          <View key={c.cause} style={{ marginTop: 10, gap: 5 }}>
            <View style={{ flexDirection: 'row' }}><T size={13} style={{ flex: 1 }}>{CAUSE[c.cause].icon} {CAUSE[c.cause].name}</T><T size={13} style={{ fontFamily: FONT_UI.b }}>{c.pct}%</T></View>
            <View style={{ height: 6, borderRadius: 6, backgroundColor: '#232C48', overflow: 'hidden' }}><View style={{ width: `${c.pct}%`, height: 6, borderRadius: 6, backgroundColor: i === 0 ? ANOR : GOLD }} /></View>
          </View>
        ))}
        {d.causes[0] && <T dim size={12} style={{ marginTop: 10 }}>💡 {CAUSE[d.causes[0].cause].tip}</T>}
      </Box>
      <Box>
        <T size={14} style={{ fontFamily: FONT_UI.b }}>Qaysi bosqichda xato qilasiz</T>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 96, marginTop: 10 }}>
          {d.phases.map((x) => (
            <View key={x.name} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <T size={12} style={{ fontFamily: FONT_UI.b }}>{x.n}</T>
              <View style={{ alignSelf: 'stretch', height: Math.max(6, (x.n / phMax) * 58), borderRadius: 8, backgroundColor: x.n === phMax ? ANOR : '#2B3A66' }} />
              <T dim size={11.5}>{x.name}</T>
            </View>
          ))}
        </View>
      </Box>
      {st.length > 0 && (
        <Box>
          <T size={14} style={{ fontFamily: FONT_UI.b }}>Uslub (taxminiy)</T>
          {st.map((s) => (
            <View key={s.axis} style={{ marginTop: 9, gap: 4 }}>
              <View style={{ flexDirection: 'row' }}><T size={13} style={{ flex: 1 }}>{s.axis}</T><T size={13} style={{ fontFamily: FONT_UI.b }}>{s.v}</T></View>
              <View style={{ height: 5, borderRadius: 5, backgroundColor: '#232C48', overflow: 'hidden' }}><View style={{ width: `${s.v}%`, height: 5, backgroundColor: FIR }} /></View>
            </View>
          ))}
        </Box>
      )}
      {d.openings.length > 0 && (
        <Box>
          <T size={14} style={{ fontFamily: FONT_UI.b }}>Debyutlar</T>
          {d.openings.map((o) => (
            <View key={o.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#1A2547' }}>
              <T size={13} style={{ flex: 1 }} lines={1}>{o.name}</T>
              <T dim size={12} style={{ width: 54, textAlign: 'right' }}>{o.n} o'yin</T>
              <T size={12} color={o.win >= 50 ? OK : ANOR} style={{ width: 48, textAlign: 'right', fontFamily: FONT_UI.b }}>{o.win}%</T>
            </View>
          ))}
          <T size={12} color={GOLD} style={{ marginTop: 8 }}>Natijasi past debyutni Debyut bo'limida mashq qiling.</T>
        </Box>
      )}
      <Box>
        <T size={14} style={{ fontFamily: FONT_UI.b }}>Haftalik reja</T>
        {plan.map((x) => <T key={x.day} size={13} style={{ marginTop: 6 }}><T size={13} style={{ fontFamily: FONT_UI.b }}>{x.day}</T>  {x.task}</T>)}
      </Box>
    </View>
  );
}

function Kpi({ v, l, color }: { v: string; l: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: TILE, borderWidth: 1, borderColor: EDGE }}>
      <T size={22} color={color} style={{ fontFamily: FONT_UI.xb }}>{v}</T>
      <T dim size={11.5}>{l}</T>
    </View>
  );
}
function Box({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 14, borderRadius: 20, backgroundColor: TILE, borderWidth: 1, borderColor: EDGE }}>{children}</View>;
}
