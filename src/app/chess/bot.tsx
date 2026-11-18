/**
 * chess/bot.tsx — Farobiy bilan o'yin. Bot darajangizga moslashadi (doim ~275 kuchliroq), har yurishingizni baholaydi
 * (Brilliant, Best, Good, Inaccuracy, Mistake, Blunder, Miss) va qisqa inglizcha gapiradi, 2 soniyadan keyin javob beradi.
 * Oldindan maslahat yo'q. Retry — yomon yurishni qaytarib, qayta urinish (aniqlikka baribir kiradi). Premove, soat, debyut mashqi.
 * O'yin har yurishda saqlanadi (ilova yopilsa ham davom etadi). Xato yurishlar "Xatolarim" masalalariga qo'shiladi.
 */

import { Chess, type Square } from 'chess.js';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, ZoomIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT_INSCR, FONT_UI } from '@/core/theme';
import { Avatar } from '@/core/ui/avatar';
import { Button, Card, T } from '@/core/ui/kit';
import { finishGame } from '@/features/brain/brain';
import { BAD, BOT_GAP, LABEL, botParams, classify, gameAccuracy, rateGame, type Label } from '@/features/chess/analysis';
import { ChessBoard, type Badge } from '@/features/chess/board';
import { addOwn, getBot, getSaved, saveBot, saveGame, type BotState, type GameRec, type PhraseKind, type Saved } from '@/features/chess/bot';
import { analyse, botMove, type Info } from '@/features/chess/engine/engine';
import { starPts } from '@/features/chess/home';
import { sanOf } from '@/features/chess/review';
import { useLook } from '@/features/chess/look';
import { PRACTICES, bookMoves, inPractice, openingName, practiceNext, type Practice } from '@/features/chess/openings';
import type { Row } from '@/features/chess/puzzles';
import { moveSound, playSound, preloadSounds } from '@/features/chess/sound';
import { decide, freshMem } from '@/features/chess/talk';
import { lineOf, useVoice } from '@/features/chess/voice';
import { useProgress } from '@/store';

const TCS: { label: string; tc: number; inc: number }[] = [{ label: '∞', tc: 0, inc: 0 }, { label: '10+0', tc: 600, inc: 0 }, { label: '5+3', tc: 300, inc: 3 }];
const uci = (u: string) => ({ from: u.slice(0, 2) as Square, to: u.slice(2, 4) as Square, promotion: u[4] ?? 'q' });
const clock = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

type End = { result: 'win' | 'loss' | 'draw'; why: string; acc: number; rating: number; dRating: number; prevAcc: number | null; own: number };

export default function BotGame() {
  const insets = useSafeAreaInsets();
  const look = useLook();
  const { recordGame } = useProgress();
  const [bot, setBot] = useState<BotState | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [phase, setPhase] = useState<'setup' | 'play' | 'end'>('setup');
  // sozlash
  const [color, setColor] = useState<'w' | 'b' | 'r'>('w');
  const [prac, setPrac] = useState<Practice['id'] | null>(null);
  const [tcI, setTcI] = useState(0);
  // o'yin
  const [g, setG] = useState<Saved | null>(null);
  const game = useRef(new Chess());
  const fens = useRef<string[]>([new Chess().fen()]);
  const [fen, setFen] = useState(game.current.fen());
  const [last, setLast] = useState<[Square, Square] | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [bubble, setBubble] = useState<{ text: string; color?: string } | null>(null);
  const [bubOn, setBubOn] = useState(false);
  const [hint, setHint] = useState<Square | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const strip = useRef<{ scrollToEnd: (o: { animated: boolean }) => void } | null>(null);
  useEffect(() => {                                       // gap 4.5 s ko'rinadi, keyin ism qaytadi
    if (!bubble) return;
    setBubOn(true);
    const t = setTimeout(() => setBubOn(false), 4500);
    return () => clearTimeout(t);
  }, [bubble]);
  const [thinking, setThinking] = useState(false);
  const [pre, setPre] = useState<[Square, Square] | null>(null);
  const [view, setView] = useState<number | null>(null);
  const [lock, setLock] = useState(false);
  const [pen, setPen] = useState(false);
  const vo = useVoice();
  const mem = useRef(freshMem());
  const [book, setBook] = useState<{ name: string | null; out: number | null }>({ name: null, out: null });
  const [end, setEnd] = useState<End | null>(null);
  const [auto, setAuto] = useState(false);   // ▶ — har 1.5 s keyingi yurish
  const cache = useRef(new Map<string, Promise<Info>>());
  const token = useRef(0);
  const extra = useRef<number[]>([]);                 // Retry qilingan yurishlar yo'qotishi (aniqlikka kiradi)
  const own = useRef<Row[]>([]);
  const gRef = useRef<Saved | null>(null);
  gRef.current = g;
  const st = useRef({ phase, thinking, view, out: book.out });   // taymer va premove ichida eski qiymat qolmasin
  st.current = { phase, thinking, view, out: book.out };

  useEffect(() => {
    preloadSounds();
    getBot().then(setBot); getSaved().then(setSaved);
    return () => { token.current++; };
  }, []);

  const say = (kind: PhraseKind, color?: string) => {
    const l = lineOf({ parts: [kind] });
    setBubble({ text: l.text, color });
    return vo.play(l);
  };
  const before = (f: string) => {
    let p = cache.current.get(f);
    if (!p) { p = analyse(f, 1500, 14); cache.current.set(f, p); }
    return p;
  };
  const persist = (x: Saved) => { setG(x); saveGame(x); };

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setView((v) => { const N = fens.current.length - 1, n = (v ?? N) + 1; if (n >= N) { setAuto(false); return null; } return n; }), 1500);
    return () => clearInterval(t);
  }, [auto]);
  // ── soat ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'play' || !g || !g.tc || thinking || game.current.turn() !== g.color) return;
    const t0 = Date.now(), base = g.myTime;
    const id = setInterval(() => {
      const left = base - (Date.now() - t0) / 1000;
      if (left <= 0) { clearInterval(id); finish('loss', 'Vaqt tugadi'); return; }
      setG((x) => (x ? { ...x, myTime: left } : x));
    }, 250);
    return () => clearInterval(id);
  }, [phase, thinking, fen, g?.tc]);

  // ── o'yin boshlash / davom ettirish ────────────────────────────────────
  const begin = (x: Saved, fresh = true) => {
    token.current++;
    game.current = new Chess(); fens.current = [game.current.fen()];
    for (const u of x.moves) { game.current.move(uci(u)); fens.current.push(game.current.fen()); }
    const lm = x.moves.length ? x.moves[x.moves.length - 1] : null;
    setFen(game.current.fen()); setLast(lm ? [lm.slice(0, 2) as Square, lm.slice(2, 4) as Square] : null);
    setBadge(null); setPre(null); setView(null); setEnd(null); setThinking(false);
    if (fresh) { extra.current = []; own.current = []; mem.current = freshMem(); }
    cache.current.clear();
    setBook({ name: x.opening ?? null, out: null });
    persist(x); setPhase('play'); st.current.phase = 'play'; st.current.view = null;
    if (!x.moves.length) say('start');
    if (game.current.turn() !== x.color) botTurn(x, 800);
    else before(game.current.fen());
  };
  const startNew = () => {
    if (!bot) return;
    const pr = PRACTICES.find((p) => p.id === prac);
    const c = pr ? pr.color : color === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : color;
    const t = TCS[tcI];
    begin({ color: c, practice: prac, tc: t.tc, inc: t.inc, botElo: bot.rating + BOT_GAP, moves: [], labels: [], drops: [], myTime: t.tc, retries: 0 });
  };

  const apply = (x: Saved, u: string, lab: Label | null, drop: number | null): Saved => {
    const m = game.current.move(uci(u));
    fens.current.push(game.current.fen());
    playSound(moveSound(m), look.sound);
    setFen(game.current.fen()); setLast([m.from, m.to]);
    const name = openingName(game.current.fen());
    const y: Saved = { ...x, moves: [...x.moves, m.from + m.to + (m.promotion ?? '')], labels: [...x.labels, lab], drops: [...x.drops, drop], opening: name ?? x.opening };
    if (name) setBook((b) => ({ ...b, name }));
    return y;
  };
  const over = (x: Saved): boolean => {
    const c = game.current;
    if (c.isCheckmate()) { finish(c.turn() === x.color ? 'loss' : 'win', 'Mat', x); return true; }
    if (c.isDraw() || c.isStalemate()) { finish('draw', c.isStalemate() ? 'Pat' : 'Durang', x); return true; }
    return false;
  };

  // ── bot yurishi ────────────────────────────────────────────────────────
  const botTurn = async (x: Saved, wait: number) => {
    const my = ++token.current;
    setThinking(true); st.current.thinking = true;
    const t0 = Date.now(), f = game.current.fen();
    let u: string | null = x.practice ? practiceNext(x.practice, x.moves) : null;
    if (!u) u = await botMove(f, botParams(x.botElo));
    const rest = wait - (Date.now() - t0);
    if (rest > 0) await new Promise((r) => setTimeout(r, rest));
    if (my !== token.current || !u) return;
    const y = apply(x, u, null, null);
    setThinking(false); st.current.thinking = false; setBadge(null);
    persist(y);
    if (over(y)) return;
    before(game.current.fen());
    // premove
    const p = preRef.current;
    if (p) {
      setPre(null); preRef.current = null;
      const ok = game.current.moves({ verbose: true }).some((mv) => mv.from === p[0] && mv.to === p[1]);
      if (ok) setTimeout(() => userMove(p[0], p[1]), 120);
    }
  };
  const preRef = useRef<[Square, Square] | null>(null);

  // ── sizning yurishingiz ────────────────────────────────────────────────
  const askHint = async () => {                          // 💡 qaysi dona yurishi kerak (qayerga — o'zingiz toping)
    if (!g || thinking || game.current.turn() !== g.color) return;
    try { const inf = await analyse(game.current.fen(), 500, 12); if (inf.best) setHint(inf.best.slice(0, 2) as Square); } catch { /* dvigatel band */ }
  };
  const userMove = async (from: Square, to: Square) => {
    setHint(null);
    const x = gRef.current;
    const S = st.current;
    if (!x || S.phase !== 'play' || S.thinking || S.view !== null || game.current.turn() !== x.color) return;
    const legal = game.current.moves({ verbose: true }).find((m) => m.from === from && m.to === to);
    if (!legal) return;
    const fenBefore = game.current.fen();
    const u = from + to + (legal.promotion ? 'q' : '');
    let y = apply(x, u, null, null);
    if (x.tc) y = { ...y, myTime: y.myTime + x.inc };
    persist(y);
    if (x.practice && S.out === null && !inPractice(x.practice, y.moves)) setBook((b) => ({ ...b, out: Math.ceil(y.moves.length / 2) }));
    if (over(y)) return;
    const my = ++token.current;
    setThinking(true); st.current.thinking = true;
    const t0 = Date.now();
    const b = await before(fenBefore);
    const a = await analyse(game.current.fen(), 1200, Math.max(8, Math.min(14, b.depth - 1)));   // taxminan bir xil chuqurlik — soxta "yo'qotish" chiqmasin
    if (my !== token.current) return;
    const c = classify({ fenBefore, played: u, before: b, after: a, book: bookMoves(fenBefore).includes(u) });
    const ply = y.moves.length - 1;
    const z: Saved = { ...y, labels: y.labels.map((l, i) => (i === ply ? c.label : l)), drops: y.drops.map((d, i) => (i === ply ? c.drop : d)) };
    persist(z);
    setBadge({ sq: to, text: LABEL[c.label].sym, color: LABEL[c.label].color });
    const leftBook = bookMoves(fenBefore).length > 0 && !bookMoves(fenBefore).includes(u);
    const s = decide({ mode: 'bot', ply, mine: true, fenBefore, fenAfter: game.current.fen(), u, label: c.label, leftBook, opening: z.opening ?? null, time: x.tc ? z.myTime : null, base: x.tc, rnd: Math.random }, mem.current);
    if (BAD.includes(c.label) && ply >= 1 && b.pv.length) {
      const line = b.pv.slice(0, b.pv.length >= 3 ? 3 : 1);
      own.current.push([`own-${Date.now()}`, fens.current[ply - 1], [z.moves[ply - 1], ...line].join(' '), z.botElo - BOT_GAP, `own ${c.label}`]);
    }
    if (s) {                                             // avval gapiradi, keyin yuradi
      const l = lineOf(s);
      setBubble({ text: l.text, color: BAD.includes(c.label) ? LABEL[c.label].color : undefined });
      await vo.play(l);
      if (my !== token.current) return;
    }
    setThinking(false); st.current.thinking = false;
    botTurn(z, Math.max(0, 1200 - (Date.now() - t0)));
  };

  const retry = () => {
    const x = gRef.current;
    if (!x) return;
    const myLast = [...x.labels.keys()].reverse().find((i) => (x.color === 'w' ? i % 2 === 0 : i % 2 === 1));
    if (myLast === undefined || !x.labels[myLast] || !BAD.includes(x.labels[myLast]!)) return;
    token.current++;
    extra.current.push(x.drops[myLast] ?? 0);
    const keep = x.moves.slice(0, myLast);
    begin({ ...x, moves: keep, labels: x.labels.slice(0, myLast), drops: x.drops.slice(0, myLast), retries: x.retries + 1 }, false);
    setBubble({ text: 'Take your time. Try again.' });
  };

  const finish = async (result: 'win' | 'loss' | 'draw', why: string, xx?: Saved) => {
    const x = xx ?? gRef.current;
    if (!x || !bot) return;
    token.current++;
    setThinking(false);
    const myDrops = x.drops.filter((d, i) => d !== null && (x.color === 'w' ? i % 2 === 0 : i % 2 === 1)) as number[];
    const acc = gameAccuracy([...myDrops, ...extra.current]);
    const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    const rating = rateGame(bot.rating, bot.games.length, x.botElo, score);
    const labels: Partial<Record<Label, number>> = {};
    x.labels.forEach((l) => { if (l) labels[l] = (labels[l] ?? 0) + 1; });
    const rec: GameRec = { at: Date.now(), result, acc, botElo: x.botElo, rating, moves: Math.ceil(x.moves.length / 2), labels, opening: x.opening };
    const prev = bot.games.length ? bot.games[bot.games.length - 1] : null;
    const nb = { rating, games: [...bot.games, rec] };
    setBot(nb); saveBot(nb); saveGame(null); setSaved(null);
    await addOwn(own.current);
    finishGame('chess', 'chess-bot', acc, 1, []).catch(() => {});
    recordGame('chess', acc);
    setEnd({ result, why, acc, rating, dRating: rating - bot.rating, prevAcc: prev?.acc ?? null, own: own.current.length });
    setShowEnd(true); setHint(null);
    say(why === 'Taslim' ? 'resign' : result);
    setPhase('end');
  };

  const shownFen = view === null ? fen : fens.current[view];
  const myTurn = !!g && game.current.turn() === g.color;
  const canRetry = !!g && phase === 'play' && !thinking ? (() => {
    const i = [...g.labels.keys()].reverse().find((k) => (g.color === 'w' ? k % 2 === 0 : k % 2 === 1));
    return i !== undefined && !!g.labels[i] && BAD.includes(g.labels[i]!);
  })() : false;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26} color={C.dim}>‹</T></Pressable>
        <T size={22} style={{ flex: 1, fontFamily: FONT_INSCR }}>Farobiy bilan</T>
        <Pressable onPress={() => { vo.stop(); vo.setOn(!vo.on); }} hitSlop={10}><T size={18}>{vo.on ? '🗣️' : '🔇'}</T></Pressable>
      </View>

      {phase === 'setup' && bot && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 30 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar who="ustoz" size={56} />
            <View style={{ flex: 1 }}>
              <T bold size={17}>Farobiy · ~{bot.rating + BOT_GAP}</T>
              <T dim size={13}>Sizning reytingingiz: {bot.rating} · {bot.games.length} o'yin</T>
              {bot.games.length > 0 && <T dim size={13}>Oxirgi o'yin: aniqlik {bot.games[bot.games.length - 1].acc}%</T>}
            </View>
          </Card>
          {saved && (
            <Card style={{ gap: 8, borderColor: C.gold }}>
              <T bold>Tugallanmagan o'yin · {Math.ceil(saved.moves.length / 2)}-yurish</T>
              <Button label="▶ Davom ettirish" onPress={() => begin(saved)} />
            </Card>
          )}
          <T bold>Rejim</T>
          <Chips items={[{ id: null, label: "Erkin o'yin" }, ...PRACTICES.map((p) => ({ id: p.id, label: `📖 ${p.name} (${p.color === 'w' ? 'oq' : 'qora'})` }))]}
            value={prac} onChange={(v) => setPrac(v as Practice['id'] | null)} />
          {prac && <T dim size={13}>{PRACTICES.find((p) => p.id === prac)?.about}. Bot nazariyani davom ettiradi; siz chiqib ketsangiz — aytadi.</T>}
          {!prac && (<><T bold>Rang</T><Chips items={[{ id: 'w', label: '⚪ Oq' }, { id: 'b', label: '⚫ Qora' }, { id: 'r', label: '🎲 Tasodifiy' }]} value={color} onChange={(v) => setColor(v as 'w' | 'b' | 'r')} /></>)}
          <T bold>Vaqt</T>
          <Chips items={TCS.map((t, i) => ({ id: i, label: t.label }))} value={tcI} onChange={(v) => setTcI(v as number)} />
          <Button label="Boshlash" onPress={() => { if (saved) saveGame(null); setSaved(null); startNew(); }} />
          {bot.games.length > 0 && (
            <Card style={{ gap: 4 }}>
              <T bold>Oxirgi o'yinlar</T>
              {bot.games.slice(-6).reverse().map((r) => (
                <T key={r.at} size={13}>{r.result === 'win' ? '🏆' : r.result === 'draw' ? '🤝' : '✗'} {r.acc}% · reyting {r.rating} · {r.moves} yurish{r.opening ? ` · ${r.opening.split(':')[0]}` : ''}</T>
              ))}
            </Card>
          )}
          <T dim size={11}>Dvigatel: Stockfish 10 (GPL-3.0), telefonda — internetsiz.</T>
        </ScrollView>
      )}

      {phase !== 'setup' && g && (() => {
        const N = fens.current.length - 1, cur = view ?? N;
        const mine = (i: number) => (g.color === 'w' ? i % 2 === 0 : i % 2 === 1);
        const vm = cur > 0 ? g.moves[cur - 1] : null, vl = cur > 0 ? g.labels[cur - 1] : null;
        const go = (i: number) => setView(i >= N ? null : Math.max(0, i));
        const sans = g.moves.map((u, i) => sanOf(fens.current[i], u));
        const jumpBad = (dir: 1 | -1) => {
          for (let i = cur - 1 + dir; i >= 0 && i < g.moves.length; i += dir) {
            const l = g.labels[i];
            if (mine(i) && l && (BAD.includes(l) || l === 'inaccuracy')) return go(i + 1);
          }
        };
        return (
          <>
            {/* O'yinchi qatorlari (chess.com uslubida) — Farobiy gapi uning ismi o'rnida chiqib, so'nadi */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, height: 62 }}>
              <Avatar who="ustoz" pose={thinking ? 'tushuntir' : 'kitob'} size={42} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {bubOn && bubble && view === null ? (
                  <Animated.View key={bubble.text} entering={FadeIn.duration(260)} exiting={FadeOut.duration(400)}
                    style={{ alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: '#EFE8DA' }}>
                    <T size={13.5} lines={2} color={bubble.color && bubble.color !== C.text ? '#7a2a2f' : '#141B30'} style={{ fontFamily: FONT_UI.sb }}>{bubble.text}</T>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn.duration(300)}>
                    <T size={14.5} style={{ fontFamily: FONT_UI.b }}>Farobiy <T dim size={12}>~{g.botElo}</T></T>
                    <Captured fen={shownFen} side={g.color === 'w' ? 'b' : 'w'} />
                  </Animated.View>
                )}
              </View>
              {thinking && view === null && !(bubOn && bubble) ? <T dim size={13} style={{ fontFamily: FONT_UI.sb }}>o'ylayapti…</T> : null}
            </View>

            <View>
              <ChessBoard fen={shownFen} orientation={g.color} movable={phase === 'play' && view === null ? g.color : null}
                premove={thinking || !myTurn} onPremove={(a, b) => { setPre([a, b]); preRef.current = [a, b]; }} premoveSq={pre}
                lastMove={view === null ? last : vm ? [vm.slice(0, 2) as Square, vm.slice(2, 4) as Square] : null}
                badge={view === null ? badge : vm && vl ? { sq: vm.slice(2, 4) as Square, text: LABEL[vl].sym, color: LABEL[vl].color } : null}
                hint={view === null ? hint : null}
                onMove={userMove} pen={pen} clearKey={g.moves.length} onBusy={setLock} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#1D4D4A', alignItems: 'center', justifyContent: 'center' }}><T size={18} style={{ fontFamily: FONT_INSCR }}>S</T></View>
              <View style={{ flex: 1 }}>
                <T size={14.5} style={{ fontFamily: FONT_UI.b }}>Siz <T dim size={12}>{bot?.rating ?? ''}</T></T>
                <Captured fen={shownFen} side={g.color} />
              </View>
              {g.tc > 0 && (
                <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: g.myTime < 30 ? C.red : myTurn && phase === 'play' ? '#EFE8DA' : 'transparent', borderWidth: 1, borderColor: myTurn ? 'transparent' : C.cardBorder }}>
                  <T size={24} color={g.myTime < 30 ? '#fff' : myTurn && phase === 'play' ? '#0A1124' : C.dim} style={{ fontFamily: FONT_INSCR, fontVariant: ['tabular-nums'] }}>{clock(g.myTime)}</T>
                </View>
              )}
            </View>

            <ScrollView ref={strip as never} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingVertical: 4, alignItems: 'center' }}
              onContentSizeChange={() => view === null && strip.current?.scrollToEnd({ animated: true })}>
              {g.moves.map((u, i) => {
                const l = g.labels[i], on = cur === i + 1, bad = !!l && mine(i) && (BAD.includes(l) || l === 'inaccuracy');
                return (
                  <Pressable key={i} onPress={() => go(i + 1)} hitSlop={4} style={{ flexDirection: 'row', gap: 4 }}>
                    {i % 2 === 0 && <T dim size={13}>{i / 2 + 1}.</T>}
                    <View style={{ paddingHorizontal: on ? 7 : 0, borderRadius: 7, backgroundColor: on ? '#36C2B4' : 'transparent' }}>
                      <T size={14} color={on ? '#0A1124' : bad ? LABEL[l!].color : C.text} style={{ fontFamily: FONT_UI.sb }}>{sans[i]}{bad || l === 'brilliant' || l === 'great' ? LABEL[l!].sym : ''}</T>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView scrollEnabled={!lock} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, gap: 6, paddingBottom: 12 }}>
              {pre && <T dim size={12}>⏩ Oldindan yurish: {pre[0]}–{pre[1]} (bot yurgach bajariladi)</T>}
              {(book.name || book.out) && <T dim size={12.5}>📖 {book.name ?? ''}{book.out ? `, nazariyadan ${book.out}-yurishda chiqdingiz` : ''}</T>}
              {phase === 'end' && end && !showEnd && <Pressable onPress={() => setShowEnd(true)}><T size={13} color={C.gold}>Natijani ko'rish ›</T></Pressable>}
            </ScrollView>

            {/* Pastki panel — doim joyida: o'yin paytida Retry / Reja / Taslim, keyin ⚠️ va ▶ */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: C.cardBorder, backgroundColor: C.bg }}>
              {phase === 'play' ? (
                <>
                  {canRetry ? <Tool icon="↺" label="Retry" on onPress={retry} /> : <Tool icon="💡" label="Ishora" on={!!hint} onPress={askHint} />}
                  <Tool icon="✏️" label="Reja" on={pen} onPress={() => setPen(!pen)} />
                  <Tool icon="🏳" label="Taslim" onPress={() => finish('loss', 'Taslim')} />
                </>
              ) : (
                <>
                  <Tool icon="⚠️" label="Xato" onPress={() => { setAuto(false); jumpBad(1); }} />
                  <Tool icon={auto ? '⏸' : '▶'} label="Avto" on={auto} onPress={() => { if (!auto && view === null) setView(0); setAuto(!auto); }} />
                </>
              )}
              <Big label="‹" onPress={() => { setAuto(false); go(cur - 1); }} />
              <Big label="›" onPress={() => { setAuto(false); go(cur + 1); }} />
            </View>

            {phase === 'end' && end && showEnd && (
              <Animated.View entering={FadeIn.duration(250)} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#050914B8', justifyContent: 'center', padding: 22 }}>
                <Animated.View entering={SlideInDown.duration(480).easing(Easing.out(Easing.cubic))}
                  style={{ borderRadius: 28, padding: 22, alignItems: 'center', backgroundColor: '#14214A', borderWidth: 1, borderColor: '#2E4380', overflow: 'hidden' }}>
                  <WinStar result={end.result} />
                  <T size={32} style={{ fontFamily: FONT_INSCR, marginTop: 6 }}>{end.result === 'win' ? "G'alaba" : end.result === 'draw' ? 'Durang' : "Mag'lubiyat"}</T>
                  <T dim size={13}>{end.why}</T>
                  <View style={{ flexDirection: 'row', alignSelf: 'stretch', marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2A3C70' }}>
                    <Stat v={`${end.acc}%`} l="aniqlik" />
                    <Stat v={`${end.dRating >= 0 ? '+' : ''}${end.dRating}`} l="reyting" color={end.dRating >= 0 ? '#7CC27A' : '#D2555F'} border />
                    <Stat v={`${g.labels.filter((l, i) => mine(i) && l && BAD.includes(l)).length}`} l="xato" border />
                  </View>
                  {end.own > 0 && <T dim size={12} style={{ marginTop: 10, textAlign: 'center' }}>📌 {end.own} ta xatoingiz masalalarga qo'shildi</T>}
                  <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch', marginTop: 16 }}>
                    <Pressable onPress={() => { setShowEnd(false); setView(0); }} style={({ pressed }) => ({ flex: 1, paddingVertical: 15, borderRadius: 16, backgroundColor: '#36C2B4', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
                      <T size={14.5} color="#06221F" style={{ fontFamily: FONT_UI.xb }}>O'yinni tahlil qilish</T>
                    </Pressable>
                    <Pressable onPress={() => { setShowEnd(false); setPhase('setup'); setG(null); }} style={({ pressed }) => ({ flex: 1, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#2E4380', alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
                      <T size={14.5} style={{ fontFamily: FONT_UI.b }}>Yana o'ynash</T>
                    </Pressable>
                  </View>
                </Animated.View>
              </Animated.View>
            )}
          </>
        );
      })()}
    </View>
  );
}

const START: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const GLYPH: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
/** side olgan donalar (raqibning yo'qolgan donalari) va material farqi. */
function Captured({ fen, side }: { fen: string; side: 'w' | 'b' }) {
  const board = fen.split(' ')[0];
  const cnt = (c: 'w' | 'b', t: string) => [...board].filter((ch) => ch === (c === 'w' ? t.toUpperCase() : t)).length;
  const opp = side === 'w' ? 'b' : 'w';
  const took = ['q', 'r', 'b', 'n', 'p'].flatMap((t) => Array(Math.max(0, START[t] - cnt(opp, t))).fill(t));
  const mat = (c: 'w' | 'b') => ['p', 'n', 'b', 'r', 'q'].reduce((s, t) => s + cnt(c, t) * VAL[t], 0);
  const diff = mat(side) - mat(opp);
  if (!took.length && diff <= 0) return null;
  return <T dim size={12} style={{ letterSpacing: -1 }}>{took.map((t) => GLYPH[t]).join('')}{diff > 0 ? <T size={12} color="#7CC27A" style={{ letterSpacing: 0 }}>  +{diff}</T> : null}</T>;
}
function WinStar({ result }: { result: 'win' | 'loss' | 'draw' }) {
  const big = starPts(90, 90, 80), small = starPts(90, 90, 56);
  const [a, b] = result === 'win' ? ['#D9B46A', '#F3DFA8'] : result === 'draw' ? ['#8E97B3', '#C9CEDC'] : ['#5A6585', '#8E97B3'];
  return (
    <Animated.View entering={ZoomIn.delay(250).duration(500).springify()}>
      <Svg width={68} height={68} viewBox="0 0 180 180"><Path d={big.d} fill={a} /><Path d={small.d} fill={b} /></Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}><T size={26} color="#3b2a08">{result === 'loss' ? '♚' : '♔'}</T></View>
    </Animated.View>
  );
}
function Stat({ v, l, color, border }: { v: string; l: string; color?: string; border?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderLeftWidth: border ? 1 : 0, borderColor: '#2A3C70' }}>
      <T size={23} color={color} style={{ fontFamily: FONT_UI.xb }}>{v}</T>
      <T dim size={11.5}>{l}</T>
    </View>
  );
}

function Tool({ icon, label, onPress, on }: { icon: string; label: string; onPress: () => void; on?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => ({ width: 58, height: 54, borderRadius: 14, backgroundColor: on ? C.goldSoft : 'transparent', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <T size={18}>{icon}</T><T dim size={10}>{label}</T>
    </Pressable>
  );
}
function Big({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => ({ flex: 1, height: 54, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <T size={22} bold>{label}</T>
    </Pressable>
  );
}

function Chips<V extends string | number | null>({ items, value, onChange }: { items: { id: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map((it) => (
        <Pressable key={String(it.id)} onPress={() => onChange(it.id)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: value === it.id ? C.gold : C.card, borderWidth: 1, borderColor: C.cardBorder }}>
          <T size={14} bold={value === it.id} color={value === it.id ? '#2A1E0A' : C.text}>{it.label}</T>
        </Pressable>
      ))}
    </View>
  );
}
