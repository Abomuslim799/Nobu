/**
 * chess/index.tsx — Shaxmat: 🧩 Masalalar (5 ta, reytingga mos) · ⚡ Sprint (3 daqiqa, 3 xato) · 🎯 Mavzular · 🤖 Bot (2-bosqich).
 * Masala reytingi Elo bo'yicha o'zgaradi va FR (shaxmat) ga yoziladi; sprint reytingga ta'sir qilmaydi — faqat rekord.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KEYS } from '@/core/storage';
import { C } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { chessResult, finishGame, getChess, type ChessState } from '@/features/brain/brain';
import { getOwn } from '@/features/chess/bot';
import { ComTab } from '@/features/chess/com-tab';
import { EngineHost } from '@/features/chess/engine/host';
import { OpenTab } from '@/features/chess/open-tab';
import { PuzzleView } from '@/features/chess/puzzle';
import { preloadSounds } from '@/features/chess/sound';
import { pick, SPRINT_LIVES, SPRINT_SEC, sprintRating, THEMES, themesUz, type Row } from '@/features/chess/puzzles';
import { useProgress, useRating } from '@/store';

type Tab = 'puzzles' | 'sprint' | 'themes' | 'open' | 'bot' | 'analysis';
const TABS: { id: Tab; label: string }[] = [
  { id: 'puzzles', label: '🧩 Masalalar' }, { id: 'sprint', label: '⚡ Sprint' }, { id: 'themes', label: '🎯 Mavzular' }, { id: 'open', label: '📖 Debyut' }, { id: 'bot', label: '🤖 Bot' }, { id: 'analysis', label: '🔍 Tahlil' },
];
const SESSION = 5;

export default function ChessScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('puzzles');
  const [st, setSt] = useState<ChessState | null>(null);
  const [lock, setLock] = useState(false);              // barmoq doskada — sahifa aylanmaydi
  useFocusEffect(useCallback(() => { getChess().then(setSt); }, []));
  useEffect(() => { preloadSounds(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <EngineHost />{/* Stockfish — bitta, shu ekran ochiq ekan bot va tahlil ishlatadi */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>♟️ Shaxmat</T>
        {st && <T dim size={13}>Reyting {st.rating}</T>}
        <Pressable onPress={() => router.push('/chess/settings')} hitSlop={10}><T size={20}>⚙️</T></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 8 }}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: tab === t.id ? C.gold : C.card }}>
            <T size={14} bold={tab === t.id} color={tab === t.id ? '#2A1E0A' : C.text}>{t.label}</T>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: insets.bottom + 30 }} scrollEnabled={!lock}>
        {tab === 'puzzles' && st && <Session key="p" st={st} onSt={setSt} onBusy={setLock} />}
        {tab === 'themes' && st && <Themes st={st} onSt={setSt} onBusy={setLock} />}
        {tab === 'sprint' && st && <Sprint base={st.rating} onBusy={setLock} />}
        {tab === 'analysis' && <ComTab />}
        {tab === 'open' && <OpenTab />}
        {tab === 'bot' && (
          <Card style={{ gap: 8 }}>
            <T bold size={17}>🤖 Farobiy bilan o'yin</T>
            <T dim size={14}>Bot darajangizga moslashadi va doim sizdan kuchliroq. Har yurishingizni baholaydi (Best move, Mistake, Blunder…), 2 soniyadan keyin javob beradi. Debyut mashqi: King's Indian, Austrian Attack.</T>
            <Button label="O'ynash" onPress={() => router.push('/chess/bot')} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** Masalalar ketma-ket (cheksiz); har 5 tasi FR va kunlik rejaga yoziladi. Mavzu berilsa — faqat shu mavzudan. */
function Session({ st, onSt, theme, onExit, onBusy, pool }: { st: ChessState; onSt: (s: ChessState) => void; theme?: string; onExit?: () => void; onBusy?: (b: boolean) => void; pool?: Row[] }) {
  const next = (s: ChessState) => (pool?.length ? (pool.find((p) => !s.seen.includes(p[0])) ?? pool[Math.floor(Math.random() * pool.length)]) : pick(s.rating, s.seen, theme));
  const { recordGame } = useProgress();
  const { syncChess } = useRating();
  const [n, setN] = useState(0);
  const [row, setRow] = useState<Row>(() => next(st));
  const [res, setRes] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const fails = useRef<string[]>([]);

  const finish = async (ok: boolean) => {
    const s2 = await chessResult(row[3], ok, row[0]);
    setDelta(s2.rating - st.rating);
    onSt(s2);
    setStreak(ok ? streak + 1 : 0);
    if (!ok) fails.current.push(themesUz(row[4]) || 'taktika');
    const r2 = [...res, ok];
    if (r2.length >= SESSION) {                     // 5 talik blok — FR ga yoziladi, to'xtamasdan davom
      const score = (r2.filter(Boolean).length / SESSION) * 100;
      finishGame('chess', 'chess', score, 1, fails.current).catch(() => {});
      recordGame('chess', score);
      syncChess();
      fails.current = [];
      setRes([]);
    } else setRes(r2);
    setRow(next(s2)); setN(n + 1);
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {onExit && <Pressable onPress={onExit} hitSlop={8}><T dim>‹ Mavzular</T></Pressable>}
        <T bold size={15}>{st.rating}{delta !== null && delta !== 0 ? <T size={13} color={delta > 0 ? '#5B9E2E' : '#D64545'}> {delta > 0 ? '+' : ''}{delta}</T> : ''}</T>
        <T size={15} color={streak ? C.gold : C.dim}>🔥 {streak}</T>
        <T dim size={13} style={{ flex: 1, textAlign: 'right' }} >{theme ? THEMES.find((t) => t.id === theme)?.name : pool ? '📌 Xatolarim' : ''}</T>
        <View style={{ flexDirection: 'row', gap: 3 }}>{Array.from({ length: SESSION }, (_, i) => <T key={i} size={13} color={i < res.length ? (res[i] ? '#5B9E2E' : '#D64545') : C.dim}>{i < res.length ? (res[i] ? '★' : '✗') : '·'}</T>)}</View>
      </View>
      <PuzzleView key={row[0] + n} row={row} onFinish={finish} onBusy={onBusy} />
    </View>
  );
}

function Themes({ st, onSt, onBusy }: { st: ChessState; onSt: (s: ChessState) => void; onBusy?: (b: boolean) => void }) {
  const [theme, setTheme] = useState<string | null>(null);
  const [own, setOwn] = useState<Row[]>([]);
  useEffect(() => { getOwn().then(setOwn); }, [theme]);
  if (theme === 'own') return <Session key="own" st={st} onSt={onSt} pool={own} onExit={() => setTheme(null)} onBusy={onBusy} />;
  if (theme) return <Session key={theme} st={st} onSt={onSt} theme={theme} onExit={() => setTheme(null)} onBusy={onBusy} />;
  return (
    <View style={{ gap: 14 }}>
      {own.length > 0 && (
        <Pressable onPress={() => setTheme('own')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 14, borderRadius: 14, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.gold, gap: 2 })}>
          <T bold size={16}>📌 Xatolarim · {own.length}</T>
          <T dim size={12}>Farobiy bilan o'yinlaringizdagi Mistake, Blunder va Miss — endi masala</T>
        </Pressable>
      )}
      <T dim size={13}>Mavzuni tanlang — 5 ta masala, reytingingizga yaqin.</T>
      {THEME_GROUPS.map((g) => {
        const items = THEMES.filter((t) => g.ids.includes(t.id));
        if (!items.length) return null;
        return (
          <View key={g.title} style={{ gap: 8 }}>
            <T bold size={15}>{g.icon} {g.title}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 }}>
              {items.map((t) => (
                <Pressable key={t.id} onPress={() => setTheme(t.id)} style={({ pressed }) => ({ width: '48.5%', opacity: pressed ? 0.7 : 1, padding: 12, borderRadius: 14,
                  backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderLeftWidth: 4, borderLeftColor: g.color, gap: 2 })}>
                  <T bold size={15}>{t.name}</T>
                  <T dim size={12}>{t.n} ta masala</T>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const THEME_GROUPS: { title: string; icon: string; color: string; ids: string[] }[] = [
  { title: 'Mat', icon: '♚', color: '#D64545', ids: ['mateIn1', 'mateIn2', 'mateIn3', 'backRankMate'] },
  { title: 'Taktika', icon: '⚔️', color: '#E8B84A', ids: ['fork', 'pin', 'skewer', 'discoveredAttack', 'discoveredCheck', 'doubleCheck', 'sacrifice', 'deflection', 'attraction', 'intermezzo', 'clearance', 'hangingPiece', 'trappedPiece'] },
  { title: 'Hujum va himoya', icon: '🛡️', color: '#35D0C2', ids: ['kingsideAttack', 'queensideAttack', 'exposedKing', 'defensiveMove', 'quietMove', 'advancedPawn', 'promotion'] },
  { title: "O'yin bosqichi", icon: '♟️', color: '#8FA3B8', ids: ['opening', 'middlegame', 'endgame', 'rookEndgame', 'pawnEndgame'] },
];

/** ⚡ Sprint: 3 daqiqa, 3 ta xato — tugaydi. Masalalar osondan boshlanib qiyinlashadi. */
function Sprint({ base, onBusy }: { base: number; onBusy?: (b: boolean) => void }) {
  const { recordGame } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'run' | 'end'>('intro');
  const [left, setLeft] = useState(SPRINT_SEC);
  const [solved, setSolved] = useState(0);
  const [lives, setLives] = useState(SPRINT_LIVES);
  const [row, setRow] = useState<Row | null>(null);
  const [best, setBest] = useState(0);
  const seen = useRef<string[]>([]);
  const k = useRef(0);

  useEffect(() => { AsyncStorage.getItem(KEYS.chessSprint).then((r) => setBest(Number(r ?? 0))).catch(() => {}); }, []);
  useEffect(() => {
    if (phase !== 'run') return;
    const t = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  const end = (s: number) => {
    setPhase('end');
    if (s > best) { setBest(s); AsyncStorage.setItem(KEYS.chessSprint, String(s)).catch(() => {}); }
    finishGame('chess', 'chess-sprint', Math.min(100, s * 5), 1, []).catch(() => {});
    recordGame('chess', Math.min(100, s * 5));
  };
  useEffect(() => { if (phase === 'run' && left <= 0) end(solved); }, [left, phase]);

  const next = (s: number) => { const r = pick(sprintRating(base, s), seen.current); seen.current.push(r[0]); k.current++; setRow(r); };
  const start = () => { seen.current = []; setSolved(0); setLives(SPRINT_LIVES); setLeft(SPRINT_SEC); next(0); setPhase('run'); };
  const onFinish = (ok: boolean) => {
    if (phase !== 'run') return;
    if (ok) { const s = solved + 1; setSolved(s); next(s); return; }
    const l = lives - 1; setLives(l);
    if (l <= 0) end(solved); else next(solved);
  };

  if (phase !== 'run') {
    return (
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <T size={40}>⚡</T>
        {phase === 'end' ? <T bold size={26}>{solved} ta masala</T> : <T bold size={20}>Masala sprinti</T>}
        <T dim style={{ textAlign: 'center' }}>3 daqiqa · 3 ta xato bilan tugaydi · osondan boshlanib qiyinlashadi</T>
        <T color={C.gold}>Rekord: {best}{phase === 'end' && solved >= best && solved > 0 ? ' · yangi rekord!' : ''}</T>
        <View style={{ alignSelf: 'stretch' }}><Button label={phase === 'end' ? 'Yana' : 'Boshlash'} onPress={start} /></View>
      </Card>
    );
  }
  const mm = Math.floor(Math.max(0, left) / 60), ss = String(Math.max(0, left) % 60).padStart(2, '0');
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T bold size={20} color={left <= 20 ? C.red : C.text} style={{ flex: 1, fontVariant: ['tabular-nums'] }}>⏱ {mm}:{ss}</T>
        <T bold size={18} style={{ flex: 1, textAlign: 'center' }}>★ {solved}</T>
        <T size={18} style={{ flex: 1, textAlign: 'right' }}>{'❤️'.repeat(lives)}{'🖤'.repeat(SPRINT_LIVES - lives)}</T>
      </View>
      {row && <PuzzleView key={k.current} row={row} sprint onFinish={onFinish} onBusy={onBusy} />}
    </View>
  );
}
