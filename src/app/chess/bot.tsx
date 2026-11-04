/**
 * chess/bot.tsx — Farobiy bilan o'yin. Bot darajangizga moslashadi (doim ~275 kuchliroq), har yurishingizni baholaydi
 * (Brilliant, Best, Good, Inaccuracy, Mistake, Blunder, Miss) va qisqa inglizcha gapiradi, 2 soniyadan keyin javob beradi.
 * Oldindan maslahat yo'q. Retry — yomon yurishni qaytarib, qayta urinish (aniqlikka baribir kiradi). Premove, soat, debyut mashqi.
 * O'yin har yurishda saqlanadi (ilova yopilsa ham davom etadi). Xato yurishlar "Xatolarim" masalalariga qo'shiladi.
 */

import { Chess, type Square } from 'chess.js';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUDIO_BASE } from '@/core/config';
import { C } from '@/core/theme';
import { Avatar } from '@/core/ui/avatar';
import { Button, Card, T } from '@/core/ui/kit';
import { finishGame } from '@/features/brain/brain';
import { BAD, BOT_GAP, LABEL, botParams, classify, gameAccuracy, rateGame, type Label } from '@/features/chess/analysis';
import { ChessBoard, type Badge } from '@/features/chess/board';
import { addOwn, getBot, getSaved, phrase, saveBot, saveGame, type BotState, type GameRec, type PhraseKind, type Saved } from '@/features/chess/bot';
import { analyse, botMove, type Info } from '@/features/chess/engine/engine';
import { useLook } from '@/features/chess/look';
import { PRACTICES, bookMoves, inPractice, openingName, practiceNext, type Practice } from '@/features/chess/openings';
import type { Row } from '@/features/chess/puzzles';
import { moveSound, playSound, preloadSounds } from '@/features/chess/sound';
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
  const [thinking, setThinking] = useState(false);
  const [pre, setPre] = useState<[Square, Square] | null>(null);
  const [view, setView] = useState<number | null>(null);
  const [lock, setLock] = useState(false);
  const [pen, setPen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [book, setBook] = useState<{ name: string | null; out: number | null }>({ name: null, out: null });
  const [end, setEnd] = useState<End | null>(null);
  const [auto, setAuto] = useState(false);   // ▶ — har 1.5 s keyingi yurish
  const cache = useRef(new Map<string, Promise<Info>>());
  const token = useRef(0);
  const extra = useRef<number[]>([]);                 // Retry qilingan yurishlar yo'qotishi (aniqlikka kiradi)
  const own = useRef<Row[]>([]);
  const voice = useRef<AudioPlayer | null>(null);
  const gRef = useRef<Saved | null>(null);
  gRef.current = g;
  const st = useRef({ phase, thinking, view, voiceOn, out: book.out });   // taymer va premove ichida eski qiymat qolmasin
  st.current = { phase, thinking, view, voiceOn, out: book.out };

  useEffect(() => {
    preloadSounds();
    getBot().then(setBot); getSaved().then(setSaved);
    try { voice.current = createAudioPlayer(null); } catch { /* ovozsiz */ }
    return () => { token.current++; voice.current?.remove(); };
  }, []);

  const say = (kind: PhraseKind, color?: string) => {
    const p = phrase(kind);
    setBubble({ text: p.text, color });
    if (st.current.voiceOn && voice.current) { try { voice.current.replace({ uri: AUDIO_BASE + p.file }); voice.current.play(); } catch { /* jim */ } }
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
    if (fresh) { extra.current = []; own.current = []; }
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
  const userMove = async (from: Square, to: Square) => {
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
    say(c.label, LABEL[c.label].color);
    if (BAD.includes(c.label) && ply >= 1 && b.pv.length) {
      const line = b.pv.slice(0, b.pv.length >= 3 ? 3 : 1);
      own.current.push([`own-${Date.now()}`, fens.current[ply - 1], [z.moves[ply - 1], ...line].join(' '), z.botElo - BOT_GAP, `own ${c.label}`]);
    }
    setThinking(false); st.current.thinking = false;
    botTurn(z, Math.max(0, 2000 - (Date.now() - t0)));
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
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>🤖 Farobiy</T>
        <Pressable onPress={() => setVoiceOn(!voiceOn)} hitSlop={10}><T size={18}>{voiceOn ? '🗣️' : '🔇'}</T></Pressable>
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
        const jumpBad = (dir: 1 | -1) => {
          for (let i = cur - 1 + dir; i >= 0 && i < g.moves.length; i += dir) {
            const l = g.labels[i];
            if (mine(i) && l && (BAD.includes(l) || l === 'inaccuracy')) return go(i + 1);
          }
        };
        return (
          <>
            {/* Doska va boshqaruv — doim ko'rinib turadi (pastga aylantirish shart emas) */}
            <View style={{ paddingHorizontal: 16, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar who="ustoz" pose={thinking ? 'tushuntir' : 'kitob'} size={30} />
                <View style={{ flex: 1 }}>
                  <T bold size={14}>Farobiy <T dim size={12}>~{g.botElo}{thinking ? " · o'ylayapti…" : ''}</T></T>
                  {bubble && view === null && <T size={13} color={bubble.color ?? C.text}>“{bubble.text}”</T>}
                  {view !== null && <T size={13} color={vl ? LABEL[vl].color : C.dim}>{cur === 0 ? "Boshlang'ich pozitsiya" : `${Math.ceil(cur / 2)}-yurish${vl ? ` · ${LABEL[vl].sym} ${LABEL[vl].name}` : ''}`}</T>}
                </View>
                {g.tc > 0 && <T bold size={17} color={g.myTime < 30 ? C.red : C.text} style={{ fontVariant: ['tabular-nums'] }}>⏱ {clock(g.myTime)}</T>}
              </View>
              <ChessBoard fen={shownFen} orientation={g.color} movable={phase === 'play' && view === null ? g.color : null}
                premove={thinking || !myTurn} onPremove={(a, b) => { setPre([a, b]); preRef.current = [a, b]; }} premoveSq={pre}
                lastMove={view === null ? last : vm ? [vm.slice(0, 2) as Square, vm.slice(2, 4) as Square] : null}
                badge={view === null ? badge : vm && vl ? { sq: vm.slice(2, 4) as Square, text: LABEL[vl].sym, color: LABEL[vl].color } : null}
                onMove={userMove} pen={pen} clearKey={g.moves.length} onBusy={setLock} />
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <Small label="⏮" onPress={() => { setAuto(false); go(0); }} />
                <Small label="‹" onPress={() => { setAuto(false); go(cur - 1); }} />
                <Small label="›" onPress={() => { setAuto(false); go(cur + 1); }} />
                <Small label="⏭" onPress={() => { setAuto(false); go(N); }} />
                {phase === 'end' && <Small label={auto ? '⏸' : '▶'} gold={auto} onPress={() => { if (!auto && view === null) setView(0); setAuto(!auto); }} />}
                <Small label="‹⚠️" onPress={() => { setAuto(false); jumpBad(-1); }} />
                <Small label="⚠️›" onPress={() => { setAuto(false); jumpBad(1); }} />
                <T dim size={12} style={{ flex: 1, textAlign: 'right' }}>{cur}/{N}</T>
              </View>
            </View>

            <ScrollView scrollEnabled={!lock} contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 8, paddingBottom: insets.bottom + 30 }}>
              {phase === 'play' && (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {canRetry && <Small label="↺ Retry" onPress={retry} gold />}
                  <Small label={pen ? '✏️ Reja ✓' : '✏️ Reja'} onPress={() => setPen(!pen)} />
                  <Small label="🏳 Taslim" onPress={() => finish('loss', 'Taslim')} />
                </View>
              )}
              {pre && <T dim size={12}>⏩ Oldindan yurish: {pre[0]}–{pre[1]} (bot yurgach bajariladi)</T>}
              {(book.name || book.out) && <T dim size={13}>📖 {book.name ?? ''}{book.out ? ` · nazariyadan ${book.out}-yurishda chiqdingiz` : ''}</T>}

              {phase === 'end' && end && (
                <Card style={{ gap: 6, alignItems: 'center' }}>
                  <T bold size={18}>{end.result === 'win' ? '🏆 Siz yutdingiz' : end.result === 'draw' ? '🤝 Durang' : '♚ Farobiy yutdi'} · {end.why}</T>
                  <T size={14}>Aniqlik {end.acc}%{end.prevAcc !== null ? ` · oldingi o'yinga nisbatan ${end.acc - end.prevAcc >= 0 ? '+' : ''}${end.acc - end.prevAcc}%` : ''}</T>
                  <T size={14} color={end.dRating >= 0 ? C.good : C.red}>Reyting {end.rating} ({end.dRating >= 0 ? '+' : ''}{end.dRating})</T>
                  <LabelCounts labels={g.labels} color={g.color} />
                  {g.retries > 0 && <T dim size={12}>Retry: {g.retries} marta (aniqlikka kiritildi)</T>}
                  {end.own > 0 && <T dim size={12}>📌 {end.own} ta xatoingiz "Xatolarim" masalalariga qo'shildi</T>}
                  <T dim size={12}>⚠️› — keyingi xatoingizga o'tish · yurishni bossangiz — doskada ochiladi</T>
                  <View style={{ alignSelf: 'stretch' }}><Button label="Yangi o'yin" onPress={() => { setPhase('setup'); setG(null); }} /></View>
                </Card>
              )}
              <MoveList moves={g.moves} labels={g.labels} start={fens.current[0]} cur={cur} onPick={(i) => go(i + 1)} />
            </ScrollView>
          </>
        );
      })()}
    </View>
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
function Small({ label, onPress, gold }: { label: string; onPress: () => void; gold?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: gold ? C.gold : C.subtle }}>
      <T size={14} bold={gold} color={gold ? '#2A1E0A' : C.text}>{label}</T>
    </Pressable>
  );
}
function MoveList({ moves, labels, start, cur, onPick }: { moves: string[]; labels: (Label | null)[]; start: string; cur?: number; onPick?: (i: number) => void }) {
  const g = new Chess(start), sans: string[] = [];
  for (const u of moves) { try { sans.push(g.move(uci(u)).san); } catch { sans.push(u); } }
  if (!sans.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 8, borderRadius: 10, backgroundColor: C.card }}>
      {sans.map((s, i) => {
        const l = labels[i];
        return (
          <Pressable key={i} onPress={() => onPick?.(i)} hitSlop={4} style={{ paddingHorizontal: 3, paddingVertical: 2, borderRadius: 6, backgroundColor: cur === i + 1 ? C.goldSoft : 'transparent' }}>
            <T size={14} color={l && l !== 'best' && l !== 'good' ? LABEL[l].color : C.text}>
              {i % 2 === 0 ? `${i / 2 + 1}.` : ''}{s}{l && l !== 'good' ? LABEL[l].sym.replace('★', '') : ''}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
function LabelCounts({ labels, color }: { labels: (Label | null)[]; color: 'w' | 'b' }) {
  const n: Partial<Record<Label, number>> = {};
  labels.forEach((l, i) => { if (l && (color === 'w' ? i % 2 === 0 : i % 2 === 1)) n[l] = (n[l] ?? 0) + 1; });
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
      {(Object.keys(LABEL) as Label[]).filter((k) => n[k]).map((k) => (
        <View key={k} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: LABEL[k].color }}>
          <T size={12} bold color="#fff">{LABEL[k].sym} {LABEL[k].name} × {n[k]}</T>
        </View>
      ))}
    </View>
  );
}
