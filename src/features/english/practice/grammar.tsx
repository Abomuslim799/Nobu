/** Grammatika mashqi: unit mavzusi bo'yicha AI yangi savollar beradi. */

import { useState } from 'react';

import { C } from '@/core/theme';
import { UNITS, type Unit } from '@/features/english/data/units';
import { grammarSet, type GrammarItem } from '@/features/english/ai';
import { logSkill } from '@/features/english/skills';
import { QuizRunner, Rich } from '@/core/ui/quiz-runner';
import { Button, Card, T } from '@/core/ui/kit';
import { Pick } from './kit';

// ── Grammar ─────────────────────────────────────────────────────────────────
export function GrammarPractice() {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [items, setItems] = useState<GrammarItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!unit) {
    return (
      <>
        <T dim>Mavzuni tanlang. Qoida → darsdagi mashqlar → AI yaratgan yangi mashqlar (cheksiz).</T>
        {UNITS.map((u) => <Pick key={u.id} label={u.grammar.title} sub={`${u.emoji} ${u.source} · ${u.level}`} onPress={() => setUnit(u)} />)}
      </>
    );
  }
  const g = unit.grammar;
  const done = (correct: number) => {
    const n = items?.length ?? 1;
    logSkill('grammar', (correct / n) * 100, g.title);   // QuizRunner xatolarni ekranda o'zi ko'rsatadi
    setItems(null);
  };
  const aiSet = async () => {
    setBusy(true); setErr('');
    try {
      setItems(await grammarSet(g.title, unit.level, g.exercises.map((e) => e.q)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (items) {
    return (
      <>
        <T bold size={17}>{g.title}</T>
        <QuizRunner items={items} onFinish={done} finishLabel="Saqlash" />
        <Button kind="ghost" label="← Mavzuga qaytish" onPress={() => setItems(null)} />
      </>
    );
  }
  return (
    <>
      <T bold size={19}>{g.title}</T>
      {g.explain.map((e, i) => <Card key={i}><Rich text={e} /></Card>)}
      <Button label={`Darsdagi mashqlar (${g.exercises.length})`} onPress={() => setItems(g.exercises)} />
      <Button kind="ghost" label={busy ? '⏳ AI mashq tayyorlamoqda...' : '🤖 Yangi 10 ta mashq (AI)'} disabled={busy} onPress={aiSet} />
      {!!err && <T color={C.red} size={13}>{err}</T>}
      <Button kind="ghost" label="← Boshqa mavzu" onPress={() => setUnit(null)} />
    </>
  );
}
