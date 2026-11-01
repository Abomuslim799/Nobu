/** Ingliz tili papkasi: filmlar (unitlar), kartochkalar, alohida mashqlar. */

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { STEPS, UNITS, stepsDone } from '@/features/english/data/units';

export function EnglishFolder({ unitSteps }: { unitSteps: Record<string, string[]> }) {
  return (
    <>
      <T bold size={18}>🎬 Movies</T>
      {UNITS.map((u) => {
        const done = stepsDone(unitSteps[u.id]);
        return (
          <Pressable key={u.id} onPress={() => router.push(`/english/unit/${u.id}`)}>
            <Card style={{ gap: 8, borderColor: C.green }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 36 }}>{u.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <T size={18} bold>{u.source}</T>
                  <T dim size={13}>{u.level} · {u.grammar.title}</T>
                </View>
              </View>
              <Bar value={done / STEPS.length} />
              <T dim size={13}>{done}/{STEPS.length} qadam · {u.vocab.length} so'z + {u.collocations.length} collocation</T>
            </Card>
          </Pressable>
        );
      })}

      <T bold size={18}>🎴 So'z boyligi</T>
      <Card style={{ gap: 8 }}>
        <T dim size={14}>Barcha so'zlar — Leitner takrorlash bilan. Test — har bir to'plam bo'yicha 3 bosqich.</T>
        <T dim size={14}>📚 Core: eng ko'p ishlatiladigan 2 801 so'z, 200 tadan to'plamlarda — "Test" ro'yxatidan boshlang.</T>
        <T dim size={11}>Core ro'yxati: New General Service List 1.2 (Browne, Culligan, Phillips), CC BY-SA 4.0.</T>
        <Button label="Kartochkalar va testlar" onPress={() => router.push('/english/cards')} />
      </Card>

      <T bold size={18}>🏋️ Mashq — alohida ko'nikmalar</T>
      <Card style={{ gap: 8 }}>
        <T dim size={14}>Movie'dan tashqari: bitta ko'nikmaning o'zi bilan shug'ullaning. Har bir natija statistikaga yoziladi.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['grammar', '🧩 Grammar'], ['listening', '🎧 Listening'],
            ['writing', '✍️ Writing'], ['speaking', '🗣 Speaking + talaffuz'],
          ].map(([id, label]) => (
            <Pressable key={id} onPress={() => router.push(`/english/practice/${id}`)} style={({ pressed }) => [{
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder,
            }, pressed && { opacity: 0.6 }]}>
              <Text style={{ color: C.text, fontWeight: '600' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Button label="📊 Statistika va AI tahlil" onPress={() => router.push('/english/practice/report')} />
      </Card>
    </>
  );
}
