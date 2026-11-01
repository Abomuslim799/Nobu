/** Grammatika: qoida va mashqlar. */

import { useState } from 'react';

import { type Unit } from '@/features/english/data/units';
import { QuizRunner, Rich } from '@/core/ui/quiz-runner';
import { Button, Card, T } from '@/core/ui/kit';

// ── 4. Grammatika ───────────────────────────────────────────────────────────
export function Grammar({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const g = unit.grammar;
  const [quiz, setQuiz] = useState(false);
  if (quiz) {
    return (
      <>
        <T bold size={17}>Mashq · {g.title}</T>
        <QuizRunner items={g.exercises} onFinish={onDone} finishLabel="Keyingisi: reading →" />
        <Button kind="ghost" label="← Qoidani qayta o'qish" onPress={() => setQuiz(false)} />
      </>
    );
  }
  return (
    <>
      <T bold size={19}>{g.title}</T>
      {g.explain.map((e, i) => <Card key={i}><Rich text={e} /></Card>)}
      <Button label={`Tushundim → ${g.exercises.length} ta mashq`} onPress={() => setQuiz(true)} />
    </>
  );
}
