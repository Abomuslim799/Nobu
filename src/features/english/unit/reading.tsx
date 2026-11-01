/** Reading: matn va tushunish savollari. */

import { useState } from 'react';
import { Text, View } from 'react-native';

import { C } from '@/core/theme';
import { type Unit } from '@/features/english/data/units';
import { QuizRunner } from '@/core/ui/quiz-runner';
import { Button, Card, T } from '@/core/ui/kit';
import { SoundButton } from '@/core/ui/sound';
import { s } from './styles';

// ── 2. Reading ──────────────────────────────────────────────────────────────
export function Reading({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const [quiz, setQuiz] = useState(false);
  const stems = [...unit.vocab, ...unit.collocations].map((w) => w.word.replace(/^to /, '').split(' ')[0].toLowerCase());

  if (quiz) {
    return (
      <>
        <T bold size={17}>Tushundingizmi?</T>
        <QuizRunner items={unit.questions} onFinish={onDone} finishLabel="Keyingisi: listening →" />
        <Button kind="ghost" label="← Matnga qaytish" onPress={() => setQuiz(false)} />
      </>
    );
  }
  return (
    <>
      <T dim>Matnni o'qing. Yashil so'zlar — Vocab qadamida o'rgangan so'zlaringiz. Har xatboshini eshitish mumkin.</T>
      {unit.reading.map((p, i) => (
        <Card key={i} style={{ gap: 8 }}>
          <Text style={s.para}>
            {p.split(/(\s+)/).map((tok, j) => {
              const bare = tok.toLowerCase().replace(/[^a-z']/g, '');
              const hit = bare.length > 2 && stems.some((st) => bare.startsWith(st.slice(0, Math.max(4, st.length - 2))));
              return <Text key={j} style={hit ? { color: C.green, fontWeight: '700' } : undefined}>{tok}</Text>;
            })}
          </Text>
          <View style={{ alignSelf: 'flex-start' }}><SoundButton id={unit.id} part={`p${i}`} text={p} label="Eshitish" /></View>
        </Card>
      ))}
      <Button label={`O'qib bo'ldim → ${unit.questions.length} ta savol`} onPress={() => setQuiz(true)} />
    </>
  );
}
