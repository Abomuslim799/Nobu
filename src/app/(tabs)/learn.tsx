/**
 * Darslar — yo'nalishlar (Python, TypeScript, Java, SQL, English) va ularning darslari.
 */

import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { C } from '@/constants/theme';
import { TRACKS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';

export default function Learn() {
  const { data } = useProgress();
  return (
    <Screen>
      <Title sub="Har bir kod misoli — bizning loyihalarimizdan.">Darslar</Title>
      <Button label="🎴 Inglizcha so'z kartochkalari" onPress={() => router.push('/cards')} />
      {TRACKS.map((track) => {
        const done = track.lessons.filter((l) => data.lessons[l.id]).length;
        return (
          <Card key={track.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={20} bold>{track.icon} {track.title}</T>
              <T dim>{done}/{track.lessons.length}</T>
            </View>
            <T dim size={14}>{track.about}</T>
            <Bar value={done / track.lessons.length} color={track.color} />
            {track.lessons.map((lesson, i) => {
              const result = data.lessons[lesson.id];
              return (
                <Pressable key={lesson.id} onPress={() => router.push(`/lesson/${lesson.id}`)}
                  style={({ pressed }) => ({ paddingVertical: 8, opacity: pressed ? 0.6 : 1,
                    flexDirection: 'row', gap: 10, alignItems: 'center' })}>
                  <T color={result ? C.green : C.dim}>{result ? '✓' : `${i + 1}.`}</T>
                  <View style={{ flex: 1 }}>
                    <T>{lesson.title}</T>
                    <T dim size={12}>
                      ~{lesson.minutes} daq{result ? ` · ${result.correct}/${result.total} to'g'ri` : ''}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}
