/** Ingliz tili papkasi: so'z bazasi, 6 oylik grammar reja, alohida mashqlar; filmlar — arxivda (material grammar mavzularida ishlatiladi). */

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { STEPS, UNITS, stepsDone } from '@/features/english/data/units';

export function EnglishFolder({ unitSteps }: { unitSteps: Record<string, string[]> }) {
  const [films, setFilms] = useState(false);
  return (
    <>
      <Pressable onPress={() => router.push('/english/vocab')}>
        <Card style={{ gap: 6, borderColor: C.green }}>
          <T bold size={18}>🎴 So'z bazasi</T>
          <T dim size={13}>So'zlar va Collocation · kuniga 30 + 10 yangi · cheksiz takror · Hard / Normal / Easy</T>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/english/drill')}>
        <Card style={{ gap: 6, borderColor: C.gold }}>
          <T bold size={18}>🔁 6 oylik reja — Grammar drill</T>
          <T dim size={13}>25 mavzu har hafta · kuniga 3 blok · UZ → EN tezkor tarjima · mistake bank · Zaif/O'rta/Mustahkam</T>
        </Card>
      </Pressable>

      <Pressable onPress={() => setFilms(!films)}>
        <T bold size={18}>🗄 Filmlar (arxiv) {films ? '▴' : '▾'}</T>
      </Pressable>
      {films && UNITS.map((u) => {
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
