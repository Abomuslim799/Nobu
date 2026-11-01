/** So'zlar: filmning 15 so'zi va 5 kollokatsiyasi. */

import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { C } from '@/core/theme';
import { type Unit } from '@/features/english/data/units';
import { Button, Card, T } from '@/core/ui/kit';
import { SoundButton } from '@/core/ui/sound';
import { Stress } from '@/features/english/ui/stress';
import { Hook } from './hook';

// ── 3. So'zlar ──────────────────────────────────────────────────────────────
export function Vocab({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const row = (w: Unit['vocab'][number]) => (
    <Card key={w.id} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 30 }}>{w.emoji}</Text>
        <View style={{ flex: 1 }}>
          <T size={19} bold>{w.word}</T>
          <T color={C.green}>{w.translation}</T>
        </View>
      </View>
      {w.ipa ? <Stress ipa={w.ipa} /> : null}
      <T dim style={{ fontStyle: 'italic' }}>“{w.example}”</T>
      {w.note ? <T dim size={13}>💡 {w.note}</T> : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <SoundButton id={w.id} part="w" text={w.word} label="So'z" />
        <SoundButton id={w.id} part="s" text={w.example} label="Gap" />
      </View>
    </Card>
  );
  return (
    <>
      <Hook unit={unit} />
      <T bold size={18}>{unit.vocab.length} ta so'z</T>
      {unit.vocab.map(row)}
      <T bold size={18}>{unit.collocations.length} ta collocation — birga ishlatiladigan so'zlar</T>
      <T dim>Ingliz tilida so'zlar "juft" yuradi: make a decision, lekin do a decision emas. Ularni yaxlit yodlang.</T>
      {unit.collocations.map(row)}
      <Button kind="ghost" label="🎴 Kartochkada mashq" onPress={() => router.push(`/english/cards?deck=${unit.id}`)} />
      <Button label="Yodladim → grammatika" onPress={onDone} />
    </>
  );
}
