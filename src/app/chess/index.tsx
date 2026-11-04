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
import { PuzzleView } from '@/features/chess/puzzle';
import { preloadSounds } from '@/features/chess/sound';
import { pick, SPRINT_LIVES, SPRINT_SEC, sprintRating, THEMES, themesUz, type Row } from '@/features/chess/puzzles';
import { useProgress, useRating } from '@/store';

type Tab = 'puzzles' | 'sprint' | 'themes' | 'bot';
const TABS: { id: Tab; label: string }[] = [
  { id: 'puzzles', label: '🧩 Masalalar' }, { id: 'sprint', label: '⚡ Sprint' }, { id: 'themes', label: '🎯 Mavzular' }, { id: 'bot', label: '🤖 Bot' },
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
        {tab === 'bot' && (
          <Card style={{ gap: 6 }}>
            <T bold size={17}>🤖 Farobiy bilan o'yin</T>
            <T dim>2-bosqichda: bot darajangizga moslashadi, har yurishingizni baholaydi (Best move, Mistake, Blunder…) va 2 soniyadan keyin javob beradi.</T>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** 5 ta masala; mavzu berilsa — faqat shu mavzudan. Natija reyting, FR va kunlik rejaga yoziladi. */
function Session({ st, onSt, theme, onExit, onBusy }: { st: ChessState; onSt: (s: ChessState) => void; theme?: string; onExit?: () => void; onBusy?: (b: boolean) => void }) {
  const { recordGame } = useProgress();
  const { syncChess } = useRating();
  const [n, setN] = useState(0);
  const [row, setRow] = useState<Row>(() => pick(st.rating, st.seen, theme));
  const [res, setRes] = useState<boolean[]>([]);
  const fails = useRef<string[]>([]);
  const done = res.length >= SESSION;

  const finish = async (ok: boolean) => {
    const s2 = await chessResult(row[3], ok, row[0]);
    onSt(s2);
    if (!ok) fails.current.push(themesUz(row[4]) || 'taktika');
    const r2 = [...res, ok];
    setRes(r2);
    if (r2.length >= SESSION) {
      const score = (r2.filter(Boolean).length / SESSION) * 100;
      await finishGame('chess', 'chess', score, 1, fails.current);
      recordGame('chess', score);
      syncChess();
    } else { setRow(pick(s2.rating, s2.seen, theme)); setN(n + 1); }
  };

  if (done) {
    const ok = res.filter(Boolean).length;
    return (
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <T size={40}>{ok >= 4 ? '🏆' : ok >= 2 ? '👍' : '💪'}</T>
        <T bold size={22}>{ok} / {SESSION}</T>
        <T dim>Reyting: {st.rating}</T>
        <View style={{ flexDirection: 'row', gap: 6 }}>{res.map((x, i) => <T key={i} size={20}>{x ? '★' : '✗'}</T>)}</View>
        {fails.current.length > 0 && <T dim size={13}>Xato mavzular: {[...new Set(fails.current)].join(' · ')}</T>}
        <View style={{ alignSelf: 'stretch', gap: 8 }}>
          <Button label="Yana 5 ta" onPress={() => { fails.current = []; setRes([]); setN(0); setRow(pick(st.rating, st.seen, theme)); }} />
          {onExit && <Button kind="ghost" label="Mavzular" onPress={onExit} />}
        </View>
      </Card>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {onExit && <Pressable onPress={onExit} hitSlop={8}><T dim>‹ Mavzular</T></Pressable>}
        <T dim size={13} style={{ flex: 1 }}>{theme ? `${THEMES.find((t) => t.id === theme)?.name} · ` : ''}Masala {n + 1}/{SESSION}</T>
        <View style={{ flexDirection: 'row', gap: 3 }}>{Array.from({ length: SESSION }, (_, i) => <T key={i} size={14} color={i < res.length ? (res[i] ? '#5B9E2E' : '#D64545') : C.dim}>{i < res.length ? (res[i] ? '★' : '✗') : '·'}</T>)}</View>
      </View>
      <PuzzleView key={row[0] + n} row={row} onFinish={finish} onBusy={onBusy} />
    </View>
  );
}

function Themes({ st, onSt, onBusy }: { st: ChessState; onSt: (s: ChessState) => void; onBusy?: (b: boolean) => void }) {
  const [theme, setTheme] = useState<string | null>(null);
  if (theme) return <Session key={theme} st={st} onSt={onSt} theme={theme} onExit={() => setTheme(null)} onBusy={onBusy} />;
  return (
    <View style={{ gap: 14 }}>
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
