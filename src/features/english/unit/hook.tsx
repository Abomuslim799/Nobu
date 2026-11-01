/** Film kirishi: iqtibos, kim aytgan, sahna. */

import { Linking, Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { type Unit } from '@/features/english/data/units';
import { Rich } from '@/core/ui/quiz-runner';
import { Card, T } from '@/core/ui/kit';
import { SoundButton } from '@/core/ui/sound';
import { s } from './styles';

// ── Kirish kartasi (Vocab tepasida) ─────────────────────────────────────────
export function Hook({ unit }: { unit: Unit }) {
  return (
    <>
      <Card style={{ gap: 12, borderColor: C.green }}>
        <Text style={s.quote}>“{unit.hook.quote}”</Text>
        <T dim>— {unit.hook.who}, {unit.source}</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <SoundButton id={unit.id} part="q" text={unit.hook.quote} label="Eshitish" />
          <Pressable style={s.ghostBtn} onPress={() => Linking.openURL(unit.hook.link)}>
            <Text style={{ color: C.text, fontWeight: '600' }}>▶ Sahnani YouTube'da</Text>
          </Pressable>
        </View>
      </Card>
      <Card><Rich text={unit.hook.context} /></Card>
      <T dim>Daraja: {unit.level} · Reja: so'zlar → grammatika → matn → tinglash → yozish → gapirish → test</T>
    </>
  );
}
