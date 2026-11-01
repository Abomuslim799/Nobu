/** Ingliz tili ko'nikmalari statistikasi va AI tahlili. */

import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { C } from '@/core/theme';
import { skillsReport, type SkillsReport } from '@/features/english/ai';
import { getLog, SKILLS, stats, summarize, type SkillEntry } from '@/features/english/skills';
import { Bar, Button, Card, T } from '@/core/ui/kit';

// ── Statistika va AI tahlil ─────────────────────────────────────────────────
export function Report() {
  const [log, setLog] = useState<SkillEntry[] | null>(null);
  const [ai, setAi] = useState<SkillsReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { getLog().then(setLog); }, []);
  const st = useMemo(() => (log ? stats(log) : []), [log]);

  if (!log) return <T dim>Yuklanmoqda...</T>;
  const analyse = async () => {
    setBusy(true); setErr('');
    try {
      setAi(await skillsReport(summarize(log)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const topMistakes = (() => {
    const c: Record<string, number> = {};
    log.slice(-150).forEach((e) => e.mistakes.forEach((m) => { c[m] = (c[m] ?? 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  return (
    <>
      <T dim>{log.length} ta mashq natijasi saqlangan. Ball — oxirgi 5 ta mashq o'rtachasi.</T>
      {st.map((x) => {
        const meta = SKILLS.find((k) => k.id === x.skill)!;
        return (
          <Card key={x.skill} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold>{meta.icon} {meta.title}</T>
              <T bold color={x.count ? (x.recent >= 80 ? C.green : x.recent >= 60 ? C.text : C.red) : C.dim}>
                {x.count ? `${x.recent}%` : "ma'lumot yo'q"}
              </T>
            </View>
            <Bar value={x.recent / 100} />
            <T dim size={13}>
              {x.count} ta mashq · umumiy o'rtacha {x.avg}%{x.trend ? ` · ${x.trend > 0 ? '▲' : '▼'} ${Math.abs(x.trend)}` : ''}
            </T>
          </Card>
        );
      })}
      {topMistakes.length > 0 && (
        <Card style={{ gap: 4 }}>
          <T bold>Ko'p takrorlanayotgan xatolar</T>
          {topMistakes.map(([m, n]) => <T key={m} size={14}>• {m} <Text style={{ color: C.dim }}>×{n}</Text></T>)}
        </Card>
      )}
      <Button label={busy ? '⏳ AI tahlil qilmoqda...' : '🤖 AI to\'liq tahlil'} disabled={busy || log.length < 3} onPress={analyse} />
      {log.length < 3 && <T dim size={13}>AI tahlil uchun kamida 3 ta mashq natijasi kerak.</T>}
      {!!err && <T color={C.red} size={13}>{err}</T>}
      {ai && (
        <>
          <Card style={{ gap: 6, borderColor: C.green }}>
            <T bold size={18}>Taxminiy daraja: {ai.level}</T>
            <T size={14}>{ai.summary_uz}</T>
            {ai.skills.map((k) => <T key={k.skill} size={14}>• {k.skill}: <Text style={{ fontWeight: '700', color: C.text }}>{k.level}</Text> — {k.comment_uz}</T>)}
          </Card>
          <Card style={{ gap: 4 }}>
            <T bold color={C.green}>💪 Kuchli tomonlar</T>
            {ai.strengths_uz.map((x, k) => <T key={k} size={14}>• {x}</T>)}
          </Card>
          <Card style={{ gap: 4 }}>
            <T bold color={C.red}>⚠️ Zaif tomonlar</T>
            {ai.weaknesses_uz.map((x, k) => <T key={k} size={14}>• {x}</T>)}
          </Card>
          <Card style={{ gap: 4 }}>
            <T bold>🗓 Keyingi 2 hafta rejasi</T>
            {ai.plan_uz.map((x, k) => <T key={k} size={14}>{k + 1}. {x}</T>)}
          </Card>
        </>
      )}
    </>
  );
}
