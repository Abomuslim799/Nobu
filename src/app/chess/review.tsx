/**
 * chess/review.tsx — o'yin tahlili (chess.com uslubida, qisqa):
 * 📊 Xulosa — ikkala tomon aniqligi, belgilar jadvali, baho grafigi, 3–5 hal qiluvchi lahza.
 * ▶ Ko'rib chiqish — taxta + baho chizig'i, har yurishga 1 jumla izoh, ⚠️ lahzadan lahzaga, 🔁 qayta urinib ko'rish.
 * Chuqur qism (murabbiy savoli, yurishlar ro'yxati, qayta tahlil) — "Batafsil" ichida.
 */

import { Chess, type Square } from 'chess.js';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { C } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { nobuChat } from '@/features/assistant/ai';
import { CAUSE, gameRating, LABEL, winOf } from '@/features/chess/analysis';
import { Avatar } from '@/core/ui/avatar';
import { ChessBoard } from '@/features/chess/board';
import { fresh, loadAn, loadCom, reanalyse, type ComGame, type GameAn } from '@/features/chess/chesscom';
import { analyse } from '@/features/chess/engine/engine';
import { useLook } from '@/features/chess/look';
import { BOOK, evalText, explain, fensOf, keyMoments, lineOf, plies, ROWS, sanOf, summary, UZ, type Kind, type Ply } from '@/features/chess/review';
import { bookMoves, openingName } from '@/features/chess/openings';
import { moveSound, playSound } from '@/features/chess/sound';
import { decide, freshMem, seeded } from '@/features/chess/talk';
import { lineOf as sayLine, useVoice, type Line as SayLine } from '@/features/chess/voice';

const uci = (u: string) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
const meta = (k: Kind) => (k === 'book' ? BOOK : LABEL[k]);
const isBad = (k: Kind) => k === 'inaccuracy' || k === 'mistake' || k === 'blunder' || k === 'miss';
type Retry = { ply: number; fen: string; last: [Square, Square] | null; tries: number; msg: string; ok: boolean | null; busy: boolean };

export default function Review() {
  const insets = useSafeAreaInsets();
  const look = useLook();
  const { id, ply } = useLocalSearchParams<{ id: string; ply?: string }>();
  const [g, setG] = useState<ComGame | null>(null);
  const [a, setA] = useState<GameAn | null>(null);
  const [mode, setMode] = useState<'sum' | 'walk'>('sum');
  const [view, setView] = useState(0);
  const [auto, setAuto] = useState(false);
  const [more, setMore] = useState(false);
  const [retry, setRetry] = useState<Retry | null>(null);
  const [showBest, setShowBest] = useState(false);
  const strip = useRef<{ scrollTo: (o: { x: number; animated?: boolean }) => void } | null>(null);
  const xs = useRef<Record<number, number>>({});
  const [plan, setPlan] = useState('');
  const [coach, setCoach] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [re, setRe] = useState<string | null>(null);

  useEffect(() => {
    loadCom().then((c) => setG(c.games.find((x) => x.id === id) ?? null));
    loadAn().then((m) => setA(m[id] ?? null));
    if (ply !== undefined) { setMode('walk'); setView(Number(ply)); }   // debyut darsidan: nazariyadan chiqqan joy
  }, [id, ply]);
  const fens = useMemo(() => (g ? fensOf(g) : []), [g]);
  const ps = useMemo(() => (g && a ? plies(g, a, fens) : []), [g, a, fens]);
  const last = fens.length - 1;
  const vo = useVoice();
  const talking = useRef<Promise<void>>(Promise.resolve());
  const step = useRef<() => void>(() => {});
  /** Farobiy izohlari: qaysi yurishda nima deydi (har ochilganda bir xil). */
  const script = useMemo(() => {
    const out = new Map<number, SayLine>();
    if (!g) return out;
    const mem = freshMem();
    let opening: string | null = null;
    ps.forEach((p) => {
      const i = p.ply, u = g.moves[i], bm = bookMoves(fens[i]);
      opening = openingName(fens[i + 1]) ?? opening;
      const label = p.mine ? (p.an?.label ?? (p.kind === 'book' ? 'best' : p.kind)) : p.kind === 'book' ? null : p.kind;
      const s = decide({ mode: 'review', ply: i, mine: p.mine, fenBefore: fens[i], fenAfter: fens[i + 1], u, label, leftBook: bm.length > 0 && !bm.includes(u),
        opening, time: g.clocks[i], base: g.base, rnd: seeded(i * 31 + 7) }, mem);
      if (s) out.set(i, sayLine(s, seeded(i * 17 + 3)));
    });
    return out;
  }, [g, ps, fens]);
  useEffect(() => {                                     // ▶ — gap tugagach 1.2 s kutib, keyingi yurish
    if (!auto || mode !== 'walk') return;
    let alive = true;
    talking.current.then(() => new Promise((r) => setTimeout(r, 1200))).then(() => { if (alive) step.current(); });
    return () => { alive = false; };
  }, [auto, view, mode]);

  if (!g || !a) return <View style={{ flex: 1, backgroundColor: C.bg, padding: 40 }}><ActivityIndicator color={C.green} /></View>;

  const sum = summary(ps), moments = keyMoments(ps);
  const flip = g.color === 'b';
  const go = (v: number, fromAuto = false) => {
    if (!fromAuto) setAuto(false);
    setRetry(null); setShowBest(false);
    const nv = Math.max(0, Math.min(last, v));
    if (nv > 0) strip.current?.scrollTo({ x: Math.max(0, (xs.current[nv - 1] ?? 0) - 120), animated: true });
    if (nv === view) return;
    setView(nv);
    if (nv > 0) { try { playSound(moveSound(new Chess(fens[nv - 1]).move(uci(g.moves[nv - 1]))), look.sound); } catch { /* jim */ } }
    const l = nv === view + 1 ? script.get(nv - 1) : undefined;   // faqat oldinga bir qadamda gapiradi
    if (l) talking.current = vo.play(l); else { vo.stop(); talking.current = Promise.resolve(); }
  };
  step.current = () => { if (view >= last) setAuto(false); else go(view + 1, true); };
  const openAt = (v: number) => { go(v); setMode('walk'); };
  const nextMoment = (dir: 1 | -1) => {
    const t = dir > 0 ? moments.find((m) => m.ply + 1 > view) : [...moments].reverse().find((m) => m.ply + 1 < view);
    if (t) go(t.ply + 1);
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Pressable onPress={() => (mode === 'walk' ? setMode('sum') : router.back())} hitSlop={12}><T size={26}>‹</T></Pressable>
      <View style={{ flex: 1 }}>
        <T bold size={16}>vs {g.oppName} <T dim size={13}>({g.opp})</T></T>
        <T dim size={12}>{g.result === 'win' ? 'Yutgansiz' : g.result === 'draw' ? 'Durang' : 'Yutqazgansiz'} · {g.tc}{a.opening ? ` · ${a.opening.split(':')[0]}` : ''}</T>
      </View>
      {mode === 'walk' && <Pressable onPress={() => { vo.stop(); vo.setOn(!vo.on); }} hitSlop={10}><T size={20}>{vo.on ? '🗣️' : '🔇'}</T></Pressable>}
      {mode === 'walk' && <Pressable onPress={() => { vo.stop(); setAuto(false); setMode('sum'); }} hitSlop={10}><T size={20}>📊</T></Pressable>}
    </View>
  );

  const coachLine = g.result === 'win' ? (sum.me.acc >= 90 ? "Excellent game! Let's look at the key moments." : "Nice win. Let's see where it could be even cleaner.")
    : g.result === 'draw' ? "A draw. Let's see who missed what."
    : sum.me.acc >= 88 ? "You played well, but the result slipped. Let's find the turning point." : "Tough game. Every loss hides a lesson — let's find it.";

  // ── 📊 Xulosa ──────────────────────────────────────────────
  if (mode === 'sum') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
        {header}
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: insets.bottom + 110 }}>
          <Coach pose="kitob" text={coachLine} />
          <EvalGraph evals={a.evals} flip={flip} ps={ps} view={-1} onPick={(v) => openAt(v)} />
          <Card style={{ gap: 0, paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ flex: 1 }} />
              <T bold size={13} style={{ width: 92, textAlign: 'center' }} lines={1}>Siz</T>
              <T bold size={13} style={{ width: 92, textAlign: 'center' }} lines={1}>{g.oppName}</T>
            </View>
            <Row label="Aniqlik" a={<Pill v={`${sum.me.acc}`} hi />} b={<Pill v={`${sum.opp.acc}`} />} />
            <Row label="O'yin reytingi" a={<Pill v={`~${gameRating(sum.me.acc)}`} hi />} b={<Pill v={`~${gameRating(sum.opp.acc)}`} />} />
            <View style={{ height: 1, backgroundColor: C.cardBorder, marginVertical: 6 }} />
            {ROWS.filter((k) => sum.me.n[k] || sum.opp.n[k] || ['best', 'mistake', 'blunder'].includes(k)).map((k) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: meta(k).color, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <T bold size={11} color="#fff">{meta(k).sym}</T>
                </View>
                <T size={15} style={{ flex: 1 }}>{UZ[k]}</T>
                <T bold size={17} color={sum.me.n[k] ? meta(k).color : C.dim} style={{ width: 92, textAlign: 'center' }}>{sum.me.n[k]}</T>
                <T bold size={17} color={sum.opp.n[k] ? meta(k).color + 'AA' : C.dim} style={{ width: 92, textAlign: 'center' }}>{sum.opp.n[k]}</T>
              </View>
            ))}
          </Card>

          <T bold>⚡ Hal qiluvchi lahzalar</T>
          {!moments.length && <T dim>Katta xato yo'q.</T>}
          {moments.map((p) => (
            <Pressable key={p.ply} onPress={() => openAt(p.ply + 1)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder })}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: meta(p.kind).color, alignItems: 'center', justifyContent: 'center' }}>
                <T bold size={12} color="#fff">{meta(p.kind).sym}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T size={14}>{Math.floor(p.ply / 2) + 1}{p.ply % 2 ? '…' : '.'} {sanOf(fens[p.ply], g.moves[p.ply])} · <T bold size={14} color={meta(p.kind).color}>{p.mine ? UZ[p.kind] : `Raqib: ${UZ[p.kind].toLowerCase()}`}</T></T>
                <T dim size={12}>{explain(p, fens, g.moves)}</T>
              </View>
              <T dim>›</T>
            </Pressable>
          ))}
          {a.bookOut && <T dim size={12}>📖 Nazariyadan {a.bookOut}-yurishda chiqdingiz.</T>}
          {!fresh(a) && <T color={C.gold} size={12}>Bu o'yin eski qoida bilan tahlil qilingan — server yangisini tayyorlaydi (Tahlil → Hozir tahlil qil).</T>}
        </ScrollView>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: C.bg + 'F2', borderTopWidth: 1, borderTopColor: C.cardBorder }}>
          <Pressable onPress={() => openAt(moments[0] ? moments[0].ply + 1 : 1)}
            style={({ pressed }) => ({ height: 58, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
            <T bold size={20} color="#fff">▶ Ko'rib chiqish</T>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── ▶ Ko'rib chiqish ───────────────────────────────────────
  const cur = view > 0 ? ps[view - 1] : null;
  const said = view > 0 && !retry ? script.get(view - 1) : undefined;
  const lm = view > 0 ? g.moves[view - 1] : null;
  const bestPrev = showBest && cur?.an ? (() => { try { const c = new Chess(fens[cur.ply]); const mv = c.move(uci(cur.an.best)); return { fen: c.fen(), last: [mv.from, mv.to] as [Square, Square], san: mv.san }; } catch { return null; } })() : null;
  const fen = retry ? retry.fen : bestPrev ? bestPrev.fen : fens[view];
  const lastMove: [Square, Square] | null = retry ? retry.last : bestPrev ? bestPrev.last : lm ? [lm.slice(0, 2) as Square, lm.slice(2, 4) as Square] : null;
  const badge = bestPrev ? { sq: bestPrev.last[1], text: '★', color: LABEL.best.color }
    : !retry && cur && lm ? { sq: lm.slice(2, 4) as Square, text: meta(cur.kind).sym, color: meta(cur.kind).color }
    : retry && retry.last && retry.ok !== null ? { sq: retry.last[1], text: retry.ok ? '★' : '✗', color: retry.ok ? LABEL.best.color : LABEL.blunder.color } : null;
  const canRetry = !!cur && cur.mine && isBad(cur.kind) && !!cur.an;
  const canBest = !!cur && cur.mine && !!cur.an && cur.an.best !== g.moves[cur.ply] && cur.kind !== 'book';

  const startRetry = () => { if (!cur) return; setAuto(false); setShowBest(false); setRetry({ ply: cur.ply, fen: fens[cur.ply], last: null, tries: 0, msg: 'Yaxshiroq yurishni toping.', ok: null, busy: false }); };
  const onTry = async (from: Square, to: Square) => {
    if (!retry || retry.busy || retry.ok === true || !cur?.an) return;
    const m = cur.an, base = fens[retry.ply];
    const c = new Chess(base);
    let mv;
    try { mv = c.move({ from, to, promotion: 'q' }); } catch { return; }
    playSound(moveSound(mv), look.sound);
    const u = mv.from + mv.to + (mv.promotion ?? '');
    const shown = { fen: c.fen(), last: [mv.from, mv.to] as [Square, Square] };
    if (u.slice(0, 4) === m.best.slice(0, 4)) { setRetry({ ...retry, ...shown, ok: true, msg: `★ To'g'ri! ${mv.san} — eng kuchli yurish.` }); playSound('good', look.sound); return; }
    setRetry({ ...retry, ...shown, busy: true, ok: null, msg: '⏳ Tekshirilmoqda…' });
    let good = false;
    try { const inf = await analyse(c.fen(), 400, 12); good = m.winBefore - (100 - winOf(inf)) < 5; } catch { good = false; }
    const tries = retry.tries + 1;
    if (good) { setRetry({ ...retry, ...shown, busy: false, ok: true, tries, msg: `✓ ${mv.san} ham yaxshi. Eng kuchlisi: ${sanOf(base, m.best)}.` }); playSound('good', look.sound); return; }
    playSound('bad', look.sound);
    setRetry({ ...retry, ...shown, busy: false, ok: false, tries, msg: tries >= 2 ? `✗ ${mv.san} emas. Yechim: ${lineOf(base, m.pv, 3)}` : `✗ ${mv.san} ham yaxshi emas. Yana bir urinish.` });
    setTimeout(() => setRetry((r) => (r && r.ply === retry.ply && r.ok === false ? { ...r, fen: base, last: null } : r)), 900);
  };

  const ask = async (p: Ply) => {
    if (!p.an) return;
    const m = p.an, f = fens[p.ply];
    setBusy(true); setErr('');
    const ctx = `Siz tajribali shaxmat murabbiyisiz, o'quvchi ~${g.me} reytingli. Faqat quyidagi DVIGATEL FAKTLARIga tayaning, yurish to'qimang.
Pozitsiya (FEN): ${f}
O'quvchi ${g.color === 'w' ? 'oqlar' : 'qoralar'} bilan o'ynadi: ${sanOf(f, g.moves[p.ply])} (${LABEL[m.label].name}, g'alaba ehtimoli ${m.drop}% ga tushdi).
Dvigatelning eng yaxshi varianti: ${lineOf(f, m.pv)}.
Taxminiy sabab: ${m.cause !== 'none' ? CAUSE[m.cause].name : "noma'lum"}. Debyut: ${a.opening ?? "noma'lum"}.
O'quvchining o'sha paytdagi rejasi: "${plan.trim() || 'yozmadi'}".
O'zbekcha, qisqa (5–6 gap), maqtovsiz: 1) rejasining xatosi, 2) nimani tekshirmadi, 3) eng yaxshi yurish g'oyasi, 4) bitta qoida.`;
    try {
      const r = await nobuChat('Shaxmat murabbiyi', ctx, [{ role: 'user', text: plan.trim() || 'Bu yerda nima qilishim kerak edi?' }], true);
      setCoach((x) => ({ ...x, [p.ply]: r }));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const big = (label: string, onPress: () => void, on = false, flex = 1) => (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => ({ flex, height: 54, borderRadius: 14, backgroundColor: on ? C.gold : C.card, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <T size={22} bold color={on ? '#2A1E0A' : C.text}>{label}</T>
    </Pressable>
  );
  const tool = (icon: string, label: string, onPress: () => void, on = false) => (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => ({ width: 58, height: 54, borderRadius: 14, backgroundColor: on ? C.goldSoft : 'transparent', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <T size={18}>{icon}</T><T dim size={10}>{label}</T>
    </Pressable>
  );
  const w = a.evals[retry ? retry.ply : view] ?? 50;
  const bubble = retry ? <T size={14} color={retry.ok === true ? LABEL.best.color : retry.ok === false ? LABEL.blunder.color : C.text} lines={3}>🔁 {retry.msg}</T>
    : bestPrev && cur?.an ? <><T bold size={13} color={LABEL.best.color}>★ Eng yaxshisi: {bestPrev.san}</T><T size={13} lines={2}>{lineOf(fens[cur.ply], cur.an.pv, 5)}</T></>
    : cur ? <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: meta(cur.kind).color, alignItems: 'center', justifyContent: 'center' }}><T bold size={9} color="#fff">{meta(cur.kind).sym}</T></View>
        <T bold size={13} color={meta(cur.kind).color} lines={1}>{sanOf(fens[cur.ply], g.moves[cur.ply])} — {cur.mine ? UZ[cur.kind].toLowerCase() : `raqib: ${UZ[cur.kind].toLowerCase()}`}</T>
      </View>
      {said ? <T size={14} lines={2}>“{said.text}”</T> : <T size={14} lines={2}>{explain(cur, fens, g.moves)}</T>}
      {said && <T dim size={12} lines={1}>{explain(cur, fens, g.moves)}</T>}
    </> : <T size={14}>{coachLine}</T>;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {header}
      <View style={{ paddingHorizontal: 12, gap: 8 }}>
        <Coach pose={cur && isBad(cur.kind) && cur.mine ? 'tushuntir' : 'kitob'} height={86}>{bubble}</Coach>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <EvalBar w={w} flip={flip} />
          <View style={{ flex: 1 }}>
            <ChessBoard fen={fen} orientation={g.color} lastMove={lastMove} badge={badge}
              movable={retry && !retry.busy && retry.ok !== true ? g.color : null} onMove={onTry} clearKey={`${view}-${retry?.fen ?? ''}-${showBest}`} />
          </View>
        </View>
        <ScrollView ref={strip as never} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 2, paddingVertical: 2 }}>
          {ps.map((p) => {
            const mark = (p.mine && (isBad(p.kind) || p.kind === 'brilliant' || p.kind === 'great')) || (!p.mine && (p.kind === 'blunder' || p.kind === 'mistake'));
            return (
              <Pressable key={p.ply} onLayout={(e) => { xs.current[p.ply] = e.nativeEvent.layout.x; }} onPress={() => go(p.ply + 1)} hitSlop={4}
                style={{ paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8, backgroundColor: view === p.ply + 1 ? C.goldSoft : 'transparent' }}>
                <T size={14} bold={view === p.ply + 1} color={mark ? meta(p.kind).color : p.mine ? C.text : C.dim}>{p.ply % 2 === 0 ? `${p.ply / 2 + 1}.` : ''}{sanOf(fens[p.ply], g.moves[p.ply])}{mark ? meta(p.kind).sym : ''}</T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingTop: 4, gap: 10, paddingBottom: 16 }}>
        <EvalGraph evals={a.evals} flip={flip} ps={ps} view={view} onPick={(v) => go(v)} small />
        <Pressable onPress={() => setMore(!more)} hitSlop={6}><T dim size={13}>{more ? '▾ Batafsilni yopish' : '▸ Batafsil: murabbiydan so\'rash, qayta tahlil'}</T></Pressable>
        {more && (
          <>
            {cur?.mine && isBad(cur.kind) && cur.an && (
              <Card style={{ gap: 8, borderColor: C.gold }}>
                <T bold>🧑‍🏫 What was your plan here?</T>
                {!coach[cur.ply] && (
                  <>
                    <TextInput value={plan} onChangeText={setPlan} multiline placeholder="O'sha paytda nima o'ylagan edingiz?" placeholderTextColor={C.dim}
                      style={{ minHeight: 56, color: C.text, fontSize: 15, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.bg }} />
                    <Button label={busy ? "⏳ Murabbiy o'ylayapti…" : "Murabbiyga ko'rsatish"} disabled={busy} onPress={() => ask(cur)} />
                  </>
                )}
                {!!err && <T color={C.red} size={13}>{err}</T>}
                {coach[cur.ply] && <><T size={14}>{coach[cur.ply]}</T><T size={13} color={LABEL.best.color}>★ {lineOf(fens[cur.ply], cur.an.pv)}</T></>}
              </Card>
            )}
            <Button kind="ghost" label={re ?? '📱 Telefonda qayta tahlil (~40 s)'} disabled={!!re}
              onPress={async () => { setRe('⏳ Tahlil…'); try { const r = await reanalyse(g, (i, n) => setRe(`⏳ Tahlil: ${i}/${n}`)); setA(r); } finally { setRe(null); } }} />
            <T dim size={11}>Baho — Stockfish ({a.src === 'cloud' ? 'server' : 'telefon'}). Izohlar — qoidalar asosida; murabbiy javobi — AI.</T>
          </>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: C.cardBorder, backgroundColor: C.bg }}>
        {retry ? tool('✕', 'Yopish', () => setRetry(null), true) : tool('🔁', 'Qayta', canRetry ? startRetry : () => {}, false)}
        {tool('★', 'Eng yaxshi', () => canBest && setShowBest(!showBest), showBest)}
        {tool('⚠️', 'Keyingi', () => nextMoment(1))}
        {big('‹', () => go(view - 1))}
        {big(auto ? '⏸' : '▶', () => { setRetry(null); setShowBest(false); if (auto) { vo.stop(); setAuto(false); return; } if (view >= last) setView(0); talking.current = Promise.resolve(); setAuto(true); }, auto)}
        {big('›', () => go(view + 1))}
      </View>
    </View>
  );
}

/** Farobiy yuzi + gap pufakchasi (chess.com murabbiyi uslubida). */
function Coach({ pose, text, children, height }: { pose: 'kitob' | 'tushuntir' | 'oyla'; text?: string; children?: React.ReactNode; height?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height }}>
      <Avatar who="ustoz" pose={pose} size={54} />
      <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, gap: 2 }}>
        {children ?? <T size={15}>{text}</T>}
      </View>
    </View>
  );
}

function Row({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
      <T size={15} style={{ flex: 1 }}>{label}</T>
      <View style={{ width: 92, alignItems: 'center' }}>{a}</View>
      <View style={{ width: 92, alignItems: 'center' }}>{b}</View>
    </View>
  );
}
function Pill({ v, hi }: { v: string; hi?: boolean }) {
  return (
    <View style={{ minWidth: 76, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: hi ? '#EDEAE3' : C.subtle }}>
      <T bold size={20} color={hi ? '#1A1A1A' : C.text}>{v}</T>
    </View>
  );
}

/** Taxta yonidagi baho chizig'i (o'zingiz pastda). */
function EvalBar({ w, flip }: { w: number; flip: boolean }) {
  const mine = flip ? 100 - w : w;   // pastdagi tomon ulushi
  return (
    <View style={{ width: 16, borderRadius: 4, overflow: 'hidden' }}>
      {/* foiz balandlik iPhone'da (Yoga) ota balandligi noma'lum bo'lganda ekran bo'yi cho'ziladi — shuning uchun flex ulushlar */}
      <View style={{ flex: 100 - Math.max(2, Math.min(98, mine)), backgroundColor: flip ? '#EDEAE3' : '#2B2B2E' }} />
      <View style={{ flex: Math.max(2, Math.min(98, mine)), backgroundColor: flip ? '#2B2B2E' : '#EDEAE3' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: mine >= 50 ? 2 : undefined, top: mine < 50 ? 2 : undefined, alignItems: 'center' }}>
        <T size={8} bold color={(mine >= 50) !== flip ? '#2B2B2E' : '#EDEAE3'}>{evalText(w).replace('+', '').replace('-', '')}</T>
      </View>
    </View>
  );
}

/** Baho grafigi: oq maydon — sizning ustunligingiz; nuqtalar — xatolar; bosilsa o'sha pozitsiya. */
function EvalGraph({ evals, flip, ps, view, onPick, small }: { evals: number[]; flip: boolean; ps: Ply[]; view: number; onPick: (v: number) => void; small?: boolean }) {
  const [W, setW] = useState(0);
  const H = small ? 48 : 84;
  const n = Math.max(1, evals.length - 1);
  const x = (i: number) => (i / n) * W;
  const y = (e: number) => H - ((flip ? 100 - e : e) / 100) * H;
  const top = evals.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(e).toFixed(1)}`).join(' ');
  const area = `${top} L${W},${H} L0,${H} Z`;
  return (
    <Pressable onLayout={(e) => setW(e.nativeEvent.layout.width)} onPress={(e) => W && onPick(Math.round((e.nativeEvent.locationX / W) * n))}
      style={{ height: H, borderRadius: 8, overflow: 'hidden', backgroundColor: '#2B2B2E' }}>
      {W > 0 && (
        <Svg width={W} height={H} pointerEvents="none">
          <Path d={area} fill="#E9E5DC" />
          <Line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="#888" strokeWidth={0.6} strokeDasharray="3,3" />
          {view >= 0 && <Rect x={x(view) - 1} y={0} width={2} height={H} fill={C.gold} />}
          {ps.filter((p) => p.mine && (p.kind === 'blunder' || p.kind === 'mistake' || p.kind === 'miss')).map((p) => (
            <Circle key={p.ply} cx={x(p.ply + 1)} cy={y(evals[p.ply + 1] ?? 50)} r={small ? 3 : 4} fill={LABEL[p.kind as 'blunder'].color} stroke="#fff" strokeWidth={1} />
          ))}
        </Svg>
      )}
    </Pressable>
  );
}
