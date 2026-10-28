/**
 * O'rganish — IT yo'nalishlari, ingliz tili va fizika (tez kunda).
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
      <Title sub="IT · Ingliz tili · Fizika">O'rganish</Title>
      <Card style={{ gap: 10 }}>
        <T size={20} bold>🇬🇧 Ingliz tili</T>
        <T dim size={14}>Kartochkalar, 3 bosqichli test, talaffuz. Film unitlari (Forrest Gump...) — tayyorlanmoqda.</T>
        <Button label="🎴 So'z kartochkalari va test" onPress={() => router.push('/cards')} />
      </Card>
      <Card style={{ gap: 6, opacity: 0.6 }}>
        <T size={20} bold>⚛️ Fizika</T>
        <T dim size={14}>Tez kunda: mexanika → energiya → elektr, interaktiv simulyatsiyalar bilan.</T>
      </Card>
      <T dim>IT va til darslari</T>
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
