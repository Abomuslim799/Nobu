/**
 * brain-report.tsx — Miya statistikasi: har ko'nikma bo'yicha ball, daraja, o'sish,
 * shaxmat masalalari va ko'p takrorlanayotgan xatolar + AI tahlil (kuchli/zaif tomonlar, reja).
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { brainReport, type BrainReport } from '@/lib/ai';
import { BRAIN_SKILLS, brainStats, brainSummary, getBrainLog, getChess, type BrainEntry, type ChessState } from '@/lib/brain';
import { Bar, Button, Card, T } from '@/ui/kit';

export default function BrainReportScreen() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState<BrainEntry[] | null>(null);
  const [chess, setChess] = useState<ChessState | null>(null);
  const [ai, setAi] = useState<BrainReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { getBrainLog().then(setLog); getChess().then(setChess); }, []);

  const analyse = async () => {
    if (!log || !chess) return;
    setBusy(true); setErr('');
    try { setAi(await brainReport(brainSummary(log, chess))); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const top = (() => {
    const c: Record<string, number> = {};
    (log ?? []).slice(-200).forEach((e) => e.mistakes.forEach((m) => { c[m] = (c[m] ?? 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18}>📊 Miya statistikasi</T>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        {!log || !chess ? <T dim>Yuklanmoqda...</T> : (
          <>
            <Card style={{ gap: 4 }}>
              <T bold>♟️ Shaxmat masalalari</T>
              <T>Reyting: <Text style={{ fontWeight: '800', color: C.green }}>{chess.rating}</Text> · yechildi {chess.solved} · xato {chess.failed}
                {chess.solved + chess.failed ? ` · ${Math.round((chess.solved / (chess.solved + chess.failed)) * 100)}%` : ''}</T>
            </Card>
            {brainStats(log).map((x) => {
              const meta = BRAIN_SKILLS.find((k) => k.id === x.skill)!;
              return (
                <Card key={x.skill} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T bold>{meta.icon} {meta.title}</T>
                    <T bold color={x.count ? (x.recent >= 80 ? C.green : x.recent >= 60 ? C.text : C.red) : C.dim}>
                      {x.count ? `${x.recent}%` : "ma'lumot yo'q"}
                    </T>
                  </View>
                  <Bar value={x.recent / 100} />
                  <T dim size={13}>{x.count} ta o'yin · daraja {x.level || '—'} · o'rtacha {x.avg}%{x.trend ? ` · ${x.trend > 0 ? '▲' : '▼'} ${Math.abs(x.trend)}` : ''}</T>
                </Card>
              );
            })}
            {top.length > 0 && (
              <Card style={{ gap: 4 }}>
                <T bold>Ko'p takrorlanayotgan xatolar</T>
                {top.map(([m, n]) => <T key={m} size={14}>• {m} <Text style={{ color: C.dim }}>×{n}</Text></T>)}
              </Card>
            )}
            <Button label={busy ? '⏳ AI tahlil qilmoqda...' : '🤖 AI to\'liq tahlil'} disabled={busy || log.length < 3} onPress={analyse} />
            {log.length < 3 && <T dim size={13}>AI tahlil uchun kamida 3 ta o'yin natijasi kerak.</T>}
            {!!err && <T color={C.red} size={13}>{err}</T>}
            {ai && (
              <>
                <Card style={{ gap: 6, borderColor: C.green }}>
                  <T size={14}>{ai.summary_uz}</T>
                  {ai.skills.map((k) => <T key={k.skill} size={14}>• {k.skill}: {k.comment_uz}</T>)}
                </Card>
                <Card style={{ gap: 4 }}><T bold color={C.green}>💪 Kuchli tomonlar</T>{ai.strengths_uz.map((x, k) => <T key={k} size={14}>• {x}</T>)}</Card>
                <Card style={{ gap: 4 }}><T bold color={C.red}>⚠️ Zaif tomonlar</T>{ai.weaknesses_uz.map((x, k) => <T key={k} size={14}>• {x}</T>)}</Card>
                <Card style={{ gap: 4 }}><T bold>🗓 2 haftalik reja</T>{ai.plan_uz.map((x, k) => <T key={k} size={14}>{k + 1}. {x}</T>)}</Card>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
});
