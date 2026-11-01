/** Listening: diktant. */

import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { C } from '@/core/theme';
import { type Unit } from '@/features/english/data/units';
import { Button, Card, T } from '@/core/ui/kit';
import { SoundButton } from '@/core/ui/sound';
import { s } from './styles';

// ── 5. Listening — diktant ──────────────────────────────────────────────────
export function Listening({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const [input, setInput] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const norm = (x: string) => x.trim().toLowerCase().replace(/[^a-z']/g, '');
  const correct = unit.dictation.filter((d, i) => norm(input[i] ?? '') === norm(d.gap)).length;
  return (
    <>
      <T dim>Gapni eshiting (kerak bo'lsa 0.5× tezlikda) va tushib qolgan so'zni yozing. Matnga qaramang!</T>
      {unit.dictation.map((d, i) => {
        const ok = norm(input[i] ?? '') === norm(d.gap);
        return (
          <Card key={i} style={{ gap: 8 }}>
            <View style={{ alignSelf: 'flex-start' }}><SoundButton id={unit.id} part={`d${i}`} text={d.text} label={`${i + 1}-gap`} /></View>
            <T>{d.text.replace(new RegExp(`\\b${d.gap}\\b`), '_____')}</T>
            <TextInput style={[s.input, checked && { borderColor: ok ? C.green : C.red }]} autoCapitalize="none"
              autoCorrect={false} placeholder="so'z" placeholderTextColor={C.dim} value={input[i] ?? ''}
              onChangeText={(t) => setInput((x) => ({ ...x, [i]: t }))} />
            {checked && !ok && <T color={C.red}>To'g'ri: {d.gap}</T>}
          </Card>
        );
      })}
      {checked ? (
        <>
          <T bold>{correct}/{unit.dictation.length} to'g'ri</T>
          <Button label="Keyingisi: writing →" onPress={() => onDone(correct)} />
        </>
      ) : (
        <Button label="Tekshirish" onPress={() => setChecked(true)} />
      )}
    </>
  );
}
