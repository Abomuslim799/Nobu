/**
 * chess/opening.tsx — bitta debyut darsi: 📖 O'rganish (variant yurishma-yurish, har yurishga g'oya),
 * 🎯 Mashq (yoddan: raqib yurishlarini Farobiy qiladi, siz nazariyani topasiz), ♟️ O'yinlaringizda (qayerda chiqib ketgansiz).
 */

import { Chess, type Square } from 'chess.js';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { LABEL } from '@/features/chess/analysis';
import { ChessBoard, type Badge } from '@/features/chess/board';
import { loadCom, type ComGame } from '@/features/chess/chesscom';
import { consistent, deviation, LESSONS, matches, nextMoves, noteFor, saveBox, type Deviation, type Lesson } from '@/features/chess/lessons';
import { useLook } from '@/features/chess/look';
import { sanOf } from '@/features/chess/review';
import { moveSound, playSound } from '@/features/chess/sound';

type Mode = 'learn' | 'drill' | 'games';
const uci = (u: string) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
const fenOf = (moves: string[]) => { const g = new Chess(); moves.forEach((u) => g.move(uci(u))); return g.fen(); };
const sq2 = (u: string | undefined): [Square, Square] | null => (u ? [u.slice(0, 2) as Square, u.slice(2, 4) as Square] : null);

export default function Opening() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = LESSONS.find((l) => l.id === id);
  const [mode, setMode] = useState<Mode>('learn');
  const [lock, setLock] = useState(false);
  if (!lesson) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: lesson.color === 'w' ? '#F4F1EA' : '#222', borderWidth: 1, borderColor: C.dim }} />
        <T bold size={17} style={{ flex: 1 }}>{lesson.name}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 8 }}>
        {([['learn', "📖 O'rganish"], ['drill', '🎯 Mashq'], ['games', "♟️ O'yinlarim"]] as [Mode, string][]).map(([m, l]) => (
          <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999, backgroundColor: mode === m ? C.gold : C.card }}>
            <T size={13} bold={mode === m} color={mode === m ? '#2A1E0A' : C.text}>{l}</T>
          </Pressable>
        ))}
      </View>
      <ScrollView scrollEnabled={!lock} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10, paddingBottom: insets.bottom + 30 }}>
        {mode === 'learn' && <Learn lesson={lesson} onBusy={setLock} />}
        {mode === 'drill' && <Drill lesson={lesson} onBusy={setLock} />}
        {mode === 'games' && <Games lesson={lesson} />}
      </ScrollView>
    </View>
  );
}

/** 📖 Variantni ko'rib chiqish: ‹ › yoki ▶, har yurishda g'oya. */
function Learn({ lesson, onBusy }: { lesson: Lesson; onBusy: (b: boolean) => void }) {
  const [li, setLi] = useState(0);
  const [n, setN] = useState(0);
  const [auto, setAuto] = useState(false);
  const line = lesson.lines[li];
  const played = line.uci.slice(0, n);
  const fen = useMemo(() => fenOf(played), [li, n]);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setN((x) => { if (x + 1 >= line.uci.length) setAuto(false); return Math.min(line.uci.length, x + 1); }), 1800);
    return () => clearInterval(t);
  }, [auto, line]);
  const note = n ? line.notes[n] ?? null : null;
  const btn = (l: string, f: () => void, on = false) => (
    <Pressable onPress={f} style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: on ? C.gold : C.subtle, alignItems: 'center', justifyContent: 'center' }}><T size={17} color={on ? '#2A1E0A' : C.text}>{l}</T></Pressable>
  );
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {lesson.lines.map((l, i) => (
          <Pressable key={l.name} onPress={() => { setLi(i); setN(0); setAuto(false); }} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: i === li ? C.gold : C.cardBorder, backgroundColor: i === li ? C.goldSoft : C.card }}>
            <T size={13}>{l.name}</T>
          </Pressable>
        ))}
      </ScrollView>
      <ChessBoard fen={fen} orientation={lesson.color} lastMove={sq2(played[n - 1])} onBusy={onBusy} clearKey={`${li}-${n}`} />
      <View style={{ minHeight: 58, padding: 10, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: note ? C.gold : C.cardBorder, justifyContent: 'center' }}>
        {n ? <>
          <T bold size={13} color={C.gold}>{Math.ceil(n / 2)}{n % 2 ? '.' : '…'} {line.san[n - 1]}{(n % 2 === 1) === (lesson.color === 'w') ? ' · siz' : ' · raqib'}</T>
          <T size={14}>{note ?? '—'}</T>
        </> : <T dim size={14}>{lesson.about}</T>}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {btn('⏮', () => { setAuto(false); setN(0); })}
        {btn('‹', () => { setAuto(false); setN(Math.max(0, n - 1)); })}
        {btn('›', () => { setAuto(false); setN(Math.min(line.uci.length, n + 1)); })}
        {btn(auto ? '⏸' : '▶', () => { if (!auto && n >= line.uci.length) setN(0); setAuto(!auto); }, auto)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 8, borderRadius: 10, backgroundColor: C.card }}>
        {line.san.map((s, i) => (
          <Pressable key={i} onPress={() => { setAuto(false); setN(i + 1); }} hitSlop={4} style={{ paddingHorizontal: 3, paddingVertical: 2, borderRadius: 6, backgroundColor: n === i + 1 ? C.goldSoft : 'transparent' }}>
            <T size={14} color={line.notes[i + 1] ? C.text : C.dim}>{i % 2 === 0 ? `${i / 2 + 1}.` : ''}{s}</T>
          </Pressable>
        ))}
      </View>
      <Card style={{ gap: 4 }}>
        <T bold>🧭 Reja</T>
        {lesson.plan.map((p) => <T key={p} size={14}>• {p}</T>)}
      </Card>
      <Card style={{ gap: 4 }}>
        <T bold>⚠️ Tipik xatolar</T>
        {lesson.traps.map((p) => <T key={p} size={14}>• {p}</T>)}
      </Card>
    </>
  );
}

/** 🎯 Yoddan mashq: raqib nazariya yurishlarini qiladi; xato — dona qaytadi, 2-xatoda to'g'risi ko'rsatiladi. */
function Drill({ lesson, onBusy }: { lesson: Lesson; onBusy: (b: boolean) => void }) {
  const look = useLook();
  const [played, setPlayed] = useState<string[]>([]);
  const [shown, setShown] = useState<{ fen: string; last: [Square, Square] | null; badge: Badge | null } | null>(null);
  const [wrong, setWrong] = useState(0);            // shu pozitsiyadagi xatolar
  const [errs, setErrs] = useState(0);              // jami xato pozitsiyalar
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const busy = useRef(false);
  const errRef = useRef(0);
  const fen = useMemo(() => fenOf(played), [played]);
  const myTurn = (played.length % 2 === 0) === (lesson.color === 'w');
  const want = nextMoves(lesson, played);

  const play = (u: string, badge: Badge | null = null) => {
    const g = new Chess(fenOf(played)), m = g.move(uci(u));
    playSound(moveSound(m), look.sound);
    const p2 = [...played, u];
    setPlayed(p2); setShown(badge ? { fen: g.fen(), last: [m.from, m.to], badge } : null); setWrong(0);
    if (!nextMoves(lesson, p2).length) finish(p2);
    return p2;
  };
  const finish = (p2: string[]) => {
    setDone(true);
    const clean = errRef.current === 0;
    setMsg(clean ? `✓ Toza o'tdingiz — ${consistentName(lesson, p2)}` : `${errRef.current} ta xato bilan — takrorlash ertaga`);
    playSound(clean ? 'good' : 'bad', look.sound);
    saveBox(lesson.id, clean).catch(() => {});
  };

  useEffect(() => {                                   // raqib navbati — nazariyadan tasodifiy variant
    if (done || myTurn || !want.length) return;
    const t = setTimeout(() => { play(want[Math.floor(Math.random() * want.length)]); }, 550);
    return () => clearTimeout(t);
  }, [played, done, round]);

  const onMove = (from: Square, to: Square) => {
    if (done || !myTurn || busy.current) return;
    const g = new Chess(fen);
    let m;
    try { m = g.move({ from, to, promotion: 'q' }); } catch { return; }
    const u = m.from + m.to + (m.promotion ?? '');
    if (want.includes(u)) {
      play(u, { sq: m.to, text: '✓', color: LABEL.best.color });
      setMsg(noteFor(lesson, [...played, u]) ?? '');
      return;
    }
    playSound('bad', look.sound);
    if (wrong === 0) { errRef.current++; setErrs(errRef.current); }
    setShown({ fen: g.fen(), last: [m.from, m.to], badge: { sq: m.to, text: '✗', color: LABEL.blunder.color } });
    busy.current = true;
    if (wrong >= 1) {
      setMsg(`To'g'risi: ${sanOf(fen, want[0])}`);
      setTimeout(() => { busy.current = false; play(want[0], { sq: want[0].slice(2, 4) as Square, text: '★', color: LABEL.best.color }); }, 900);
    } else {
      setWrong(1); setMsg(`${m.san} — nazariyada emas. Yana urinib ko'ring.`);
      setTimeout(() => { busy.current = false; setShown(null); }, 800);
    }
  };
  const restart = () => { setPlayed([]); setShown(null); setWrong(0); setErrs(0); errRef.current = 0; setMsg(''); setDone(false); setRound((r) => r + 1); };

  const hint = !done && myTurn && wrong >= 1 && want[0] ? (want[0].slice(0, 2) as Square) : null;
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T bold style={{ flex: 1 }}>{done ? 'Tugadi' : myTurn ? 'Sizning yurishingiz' : 'Raqib o\'ylayapti…'}</T>
        <T dim size={13}>{Math.ceil(played.length / 2)}-yurish · xato {errs}</T>
      </View>
      <ChessBoard fen={shown?.fen ?? fen} orientation={lesson.color} movable={!done && myTurn ? lesson.color : null} onMove={onMove}
        lastMove={shown?.last ?? sq2(played[played.length - 1])} badge={shown?.badge ?? null} hint={hint} onBusy={onBusy} clearKey={played.length} />
      <View style={{ minHeight: 48, padding: 10, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, justifyContent: 'center' }}>
        <T size={14} color={msg.startsWith('✓') ? LABEL.best.color : C.text}>{msg || (myTurn ? 'Nazariya yurishini yoddan toping.' : ' ')}</T>
      </View>
      {done && <Button label="Yana bir variant" onPress={restart} />}
      {!done && played.length === 0 && myTurn && <T dim size={12}>Darsdagi variantlardan biri — raqib har safar boshqasini tanlashi mumkin.</T>}
    </>
  );
}
const consistentName = (lesson: Lesson, played: string[]) => lesson.lines.find((l) => l.uci.length === played.length && played.every((u, i) => l.uci[i] === u))?.name ?? consistent(lesson, played.slice(0, -1))[0]?.name ?? lesson.name;

/** ♟️ chess.com o'yinlaringizda shu debyut va nazariyadan chiqqan joylar. */
function Games({ lesson }: { lesson: Lesson }) {
  const [games, setGames] = useState<ComGame[] | null>(null);
  useEffect(() => { loadCom().then((c) => setGames(c.games)); }, []);
  if (!games) return null;
  const gs = games.filter((g) => matches(lesson, g));
  const devs = gs.map((g) => deviation(lesson, g)).filter((d): d is Deviation => !!d);
  if (!games.length) return <T dim>Avval Shaxmat → 🔍 Tahlil bo'limida chess.com o'yinlaringizni yuklang.</T>;
  return (
    <>
      <T dim size={13}>{gs.length} ta o'yinda shu debyut · {devs.length} tasida o'zingiz nazariyadan chiqqansiz.</T>
      {devs.map((d) => {
        const f = fenOf(d.game.moves.slice(0, d.ply));
        return (
          <Pressable key={d.game.id} onPress={() => router.push({ pathname: '/chess/review', params: { id: d.game.id, ply: String(d.ply) } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 12, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, gap: 2 })}>
            <T size={14}>vs {d.game.oppName} · {Math.floor(d.ply / 2) + 1}-yurish</T>
            <T size={14}>Siz <T bold size={14} color={LABEL.mistake.color}>{sanOf(f, d.played)}</T> — darsda <T bold size={14} color={LABEL.best.color}>{d.want.map((u) => sanOf(f, u)).join(' yoki ')}</T></T>
            <T dim size={11}>{new Date(d.game.at).toLocaleDateString()} · bosing — o'yin tahlili</T>
          </Pressable>
        );
      })}
      {gs.length > 0 && !devs.length && <T dim>Bu debyutda nazariyadan chiqmagansiz.</T>}
    </>
  );
}
