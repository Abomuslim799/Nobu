/**
 * chess/review.tsx — murabbiy rejimi: bitta chess.com o'yini. Hal qiluvchi lahzalar (eng katta yo'qotishlar),
 * har birida avval "What was your plan here?" — siz yozasiz, keyin murabbiy (AI, dvigatel faktlari bilan) fikrlashingizni tuzatadi.
 */

import { Chess, type Square } from 'chess.js';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { nobuChat } from '@/features/assistant/ai';
import { CAUSE, LABEL, type Label } from '@/features/chess/analysis';
import { ChessBoard } from '@/features/chess/board';
import { loadAn, loadCom, type ComGame, type GameAn, type MoveAn } from '@/features/chess/chesscom';

const san = (fen: string, u: string) => { try { return new Chess(fen).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san; } catch { return u; } };
const line = (fen: string, pv: string[]) => { const g = new Chess(fen), out: string[] = []; for (const u of pv) { try { out.push(g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san); } catch { break; } } return out.join(' '); };

export default function Review() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [g, setG] = useState<ComGame | null>(null);
  const [a, setA] = useState<GameAn | null>(null);
  const [view, setView] = useState(0);
  const [mom, setMom] = useState<MoveAn | null>(null);
  const [plan, setPlan] = useState('');
  const [reveal, setReveal] = useState(false);
  const [coach, setCoach] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    loadCom().then((c) => setG(c.games.find((x) => x.id === id) ?? null));
    loadAn().then((m) => setA(m[id] ?? null));
  }, [id]);
  const fens = useMemo(() => {
    if (!g) return [];
    const c = new Chess(), out = [c.fen()];
    for (const u of g.moves) { c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); out.push(c.fen()); }
    return out;
  }, [g]);
  if (!g || !a) return <View style={{ flex: 1, backgroundColor: C.bg, padding: 40 }}><ActivityIndicator color={C.green} /></View>;

  const moments = a.moves.filter((m) => m.drop >= 8 && !['best', 'good', 'brilliant'].includes(m.label)).sort((x, y) => y.drop - x.drop).slice(0, 5).sort((x, y) => x.ply - y.ply);
  const byPly = new Map(a.moves.map((m) => [m.ply, m]));
  const goMoment = (m: MoveAn) => { setMom(m); setView(m.ply); setPlan(''); setReveal(false); setErr(''); };
  const ask = async (m: MoveAn) => {
    setBusy(true); setErr('');
    const fen = fens[m.ply];
    const ctx = `Siz tajribali shaxmat murabbiyisiz (grossmeyster darajasida tushuntirasiz), o'quvchi ~${g.me} reytingli. Faqat quyidagi DVIGATEL FAKTLARIga tayaning, yurish to'qimang.
Pozitsiya (FEN): ${fen}
O'quvchi ${g.color === 'w' ? 'oqlar' : 'qoralar'} bilan o'ynadi: ${san(fen, g.moves[m.ply])} (${LABEL[m.label].name}, g'alaba ehtimoli ${m.drop}% ga tushdi).
Dvigatelning eng yaxshi varianti: ${line(fen, m.pv)}.
Taxminiy sabab: ${m.cause !== 'none' ? CAUSE[m.cause].name : "noma'lum"}${m.clock !== null ? `; soatda ${Math.round(m.clock)} s qolgan edi` : ''}. Debyut: ${a.opening ?? "noma'lum"}.
O'quvchining o'sha paytdagi rejasi (o'zi yozdi): "${plan.trim() || "yozmadi"}".
O'zbekcha, qisqa (6–8 gap), maqtovsiz javob bering, 4 qism:
1) Rejangiz: nimasi to'g'ri, nimasi xato edi.
2) Fikrlashdagi xato: nimani tekshirmadingiz (shax, olish, tahdid, hisob, pozitsiya).
3) To'g'ri g'oya: eng yaxshi yurish nima uchun kuchli (variantni tushuntiring).
4) Tamoyil: bu xatoni keyingi o'yinlarda takrorlamaslik uchun bitta qisqa qoida.`;
    try {
      const r = await nobuChat('Shaxmat murabbiyi', ctx, [{ role: 'user', text: plan.trim() || 'Bu yerda nima qilishim kerak edi?' }], true);
      setCoach((c) => ({ ...c, [m.ply]: r })); setReveal(true);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const fen = fens[view], lm = view > 0 ? g.moves[view - 1] : null, mv = byPly.get(view - 1);
  const best = mom && reveal && view === mom.ply ? mom.best : null;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <T bold size={16}>🔍 Murabbiy · vs {g.oppName}</T>
          <T dim size={12}>{g.result === 'win' ? "Yutgansiz" : g.result === 'draw' ? 'Durang' : 'Yutqazgansiz'} · aniqlik {a.acc}% · {a.opening ?? ''}{a.bookOut ? ` · nazariyadan ${a.bookOut}-yurishda chiqqansiz` : ''}</T>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10, paddingBottom: insets.bottom + 30 }}>
        <ChessBoard fen={fen} orientation={g.color} lastMove={lm ? [lm.slice(0, 2) as Square, lm.slice(2, 4) as Square] : null}
          badge={best ? { sq: best.slice(2, 4) as Square, text: '★', color: LABEL.best.color } : mv && lm ? { sq: lm.slice(2, 4) as Square, text: LABEL[mv.label].sym, color: LABEL[mv.label].color } : null} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {[['⏮', 0], ['‹', Math.max(0, view - 1)], ['›', Math.min(fens.length - 1, view + 1)], ['⏭', fens.length - 1]].map(([l, to]) => (
            <Pressable key={l as string} onPress={() => { setView(to as number); setReveal(false); }} style={{ width: 48, height: 38, borderRadius: 10, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' }}><T size={17}>{l as string}</T></Pressable>
          ))}
          <T dim style={{ flex: 1, textAlign: 'right' }}>{Math.ceil(view / 2)}-yurish</T>
        </View>
        {mv && <T size={13} color={LABEL[mv.label].color}>{san(fens[view - 1], g.moves[view - 1])} — {LABEL[mv.label].name}{mv.drop >= 5 ? ` (−${mv.drop}%)` : ''}{mv.cause !== 'none' ? ` · ${CAUSE[mv.cause].icon} ${CAUSE[mv.cause].name}` : ''}</T>}

        <T bold>⚡ Hal qiluvchi lahzalar</T>
        {!moments.length && <T dim>Katta xato yo'q — yaxshi o'yin.</T>}
        {moments.map((m) => (
          <Pressable key={m.ply} onPress={() => goMoment(m)} style={{ padding: 10, borderRadius: 10, backgroundColor: C.card, borderWidth: 1.5, borderColor: mom?.ply === m.ply ? C.gold : C.cardBorder }}>
            <T size={14}>{Math.floor(m.ply / 2) + 1}-yurish · <T bold size={14} color={LABEL[m.label].color}>{LABEL[m.label].sym} {LABEL[m.label].name}</T> · −{m.drop}%{m.cause !== 'none' ? ` · ${CAUSE[m.cause].icon}` : ''}</T>
          </Pressable>
        ))}

        {mom && (
          <Card style={{ gap: 8, borderColor: C.gold }}>
            <T bold>🧑‍🏫 What was your plan here?</T>
            <T dim size={13}>{Math.floor(mom.ply / 2) + 1}-yurish, yurishdan oldingi pozitsiya. Siz {san(fens[mom.ply], g.moves[mom.ply])} o'ynagansiz. O'sha paytda nima o'ylagan edingiz?</T>
            {!coach[mom.ply] && (
              <>
                <TextInput value={plan} onChangeText={setPlan} multiline placeholder="Masalan: otni markazga olib chiqmoqchi edim…" placeholderTextColor={C.dim}
                  style={{ minHeight: 64, color: C.text, fontSize: 15, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.bg }} />
                <Button label={busy ? '⏳ Murabbiy o\'ylayapti…' : 'Murabbiyga ko\'rsatish'} disabled={busy} onPress={() => ask(mom)} />
              </>
            )}
            {!!err && <T color={C.red} size={13}>{err}</T>}
            {coach[mom.ply] && (
              <>
                <T size={14}>{coach[mom.ply]}</T>
                <T size={13} color={LABEL.best.color}>★ Eng yaxshi: {line(fens[mom.ply], mom.pv)}</T>
              </>
            )}
          </Card>
        )}
        <T dim size={11}>Baho — Stockfish 10 (telefonda, ~0.5 s har pozitsiya); tushuntirish — AI, dvigatel faktlari asosida.</T>
      </ScrollView>
    </View>
  );
}
