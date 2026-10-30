/**
 * nobu-report.tsx — Nobu tahlili: barcha bo'limlar (ingliz tili, miya, shaxmat, science) bo'yicha bitta umumiy tahlil.
 * Pastda — Nobu bilan statistikangiz haqida matnli yoki jonli suhbat.
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { nobuOverview, type Overview } from '@/lib/ai';
import { allData, buildContext } from '@/lib/nobuContext';
import { getSciLog, type SciEntry } from '@/lib/science';
import { AREAS } from '@/science/lessons';
import { Button, Card, T } from '@/ui/kit';
import { NobuSays } from '@/ui/nobu';

export default function NobuReport() {
  const insets = useSafeAreaInsets();
  const [sci, setSci] = useState<SciEntry[]>([]);
  const [ai, setAi] = useState<Overview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { getSciLog().then(setSci); }, []);

  const analyse = async () => {
    setBusy(true); setErr('');
    try { setAi(await nobuOverview(await allData())); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const call = async () => {
    const c = await buildContext('stats');
    router.push({ pathname: '/live', params: { mode: 'nobu', topic: c.topic, ctx: c.ctx.slice(0, 9000) } });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <T bold size={18}>🤖 Nobu tahlili</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: PAD, gap: 12, paddingBottom: insets.bottom + 40 }}>
        <Card style={{ gap: 6 }}>
          <T bold>🔬 Science</T>
          {AREAS.map((a) => {
            const xs = sci.filter((e) => e.area === a.id);
            const c = xs.reduce((n, e) => n + e.correct, 0), t = xs.reduce((n, e) => n + e.total, 0);
            const p = xs.reduce((n, e) => n + e.predicted, 0), pt = xs.reduce((n, e) => n + e.predictTotal, 0);
            return <T key={a.id} size={14}>{a.icon} {a.title}: {xs.length ? `${new Set(xs.map((e) => e.lesson)).size} dars · mashqlar ${t ? Math.round((c / t) * 100) : 0}% · taxmin ${p}/${pt}` : "hali boshlanmagan"}</T>;
          })}
        </Card>
        <Button label={busy ? '⏳ Nobu tahlil qilmoqda...' : '🤖 Umumiy tahlil (barcha bo\'limlar)'} disabled={busy} onPress={analyse} />
        {!!err && <T color={C.red}>{err}</T>}
        {ai && (
          <>
            <NobuSays text={ai.summary_uz} />
            {ai.areas?.map((x) => <T key={x.area} size={14}><T bold size={14}>{x.area}:</T> {x.comment_uz}</T>)}
            <Card style={{ gap: 4 }}><T bold color={C.green}>💪 Kuchli</T>{ai.strengths_uz?.map((x) => <T key={x} size={14}>• {x}</T>)}</Card>
            <Card style={{ gap: 4 }}><T bold color={C.red}>🎯 Zaif</T>{ai.weaknesses_uz?.map((x) => <T key={x} size={14}>• {x}</T>)}</Card>
            <Card style={{ gap: 4 }}><T bold>🗓 2 haftalik reja</T>{ai.plan_uz?.map((x, i) => <T key={x} size={14}>{i + 1}. {x}</T>)}</Card>
          </>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button kind="ghost" label="💬 Yozishish" onPress={() => router.push({ pathname: '/nobu', params: { key: 'stats' } })} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="📞 Jonli gaplashish" onPress={call} /></View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 8 },
});
