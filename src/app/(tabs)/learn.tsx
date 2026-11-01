/**
 * O'rganish — 3 ta papka: 💻 IT, 🇬🇧 Ingliz tili, 🔬 Science. Ichiga kirsangiz — bo'limlar.
 */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { SUBJECTS, subjectProgress } from '@/features/subjects';
import { useProgress } from '@/core/store/progress';
import { Bar, Card, Screen, T, Title } from '@/core/ui/kit';

export default function Learn() {
  const { data } = useProgress();
  return (
    <Screen>
      <Title sub="Papkani tanlang">O'rganish</Title>
      {SUBJECTS.map((sub) => {
        const p = subjectProgress(sub.id, data);
        return (
          <Pressable key={sub.id} disabled={sub.soon} onPress={() => router.push(`/subject/${sub.id}`)}
            style={({ pressed }) => ({ opacity: sub.soon ? 0.5 : pressed ? 0.7 : 1 })}>
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={[s.sticker, { backgroundColor: sub.color + '33' }]}>
                  <Text style={{ fontSize: 34 }}>{sub.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T size={22} bold>{sub.title}</T>
                  <T dim size={14}>{sub.about}</T>
                </View>
                {!sub.soon && <T size={22} dim>›</T>}
              </View>
              {sub.soon ? <T dim size={13}>Tez kunda</T> : (
                <>
                  <Bar value={p.total ? p.done / p.total : 0} color={sub.color} />
                  <T dim size={13}>{p.done}/{p.total} bajarildi</T>
                </>
              )}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  sticker: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
