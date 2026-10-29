/**
 * folders.tsx — papkalar ichidagi kontent (IT va Ingliz tili). Papka sahifasida ham,
 * do'stlar versiyasida to'g'ridan-to'g'ri "Ingliz tili" tabida ham ishlatiladi.
 */

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { IT_TRACKS } from '@/data/subjects';
import type { Track } from '@/data/types';
import { STEPS, UNITS, stepsDone } from '@/data/units';
import { useProgress } from '@/lib/progress';
import { Bar, Button, Card, T } from '@/ui/kit';

export function ItFolder() {
  return (
    <>
      <Card style={{ gap: 8 }}>
        <T bold>🗣 IT inglizchasi</T>
        <T dim size={14}>deploy, debug, dependency... — loyihalarimizda uchragan so'zlar.</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button kind="ghost" label="🎴 Kartochka" onPress={() => router.push('/cards?deck=it')} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="🧪 Test" onPress={() => router.push('/quiz?deck=it')} /></View>
        </View>
      </Card>
      {IT_TRACKS.map((t) => <TrackCard key={t.id} track={t} />)}
    </>
  );
}

export function EnglishFolder() {
  const { data } = useProgress();
  return (
    <>
      <T bold size={18}>🎬 Movies</T>
      {UNITS.map((u) => {
        const done = stepsDone(data.unitSteps[u.id]);
        return (
          <Pressable key={u.id} onPress={() => router.push(`/unit/${u.id}`)}>
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
        <Button label="Kartochkalar va testlar" onPress={() => router.push('/cards')} />
      </Card>

      <Card style={{ opacity: 0.6, gap: 4 }}>
        <T bold>🗣 Talaffuz laboratoriyasi</T>
        <T dim size={14}>Tez kunda: minimal juftlar (ship/sheep, th), intonatsiya mashqlari.</T>
      </Card>
    </>
  );
}

function TrackCard({ track }: { track: Track }) {
  const { data } = useProgress();
  const done = track.lessons.filter((l) => data.lessons[l.id]).length;
  return (
    <Card>
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
              <T dim size={12}>~{lesson.minutes} daq{result ? ` · ${result.correct}/${result.total} to'g'ri` : ''}</T>
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}
