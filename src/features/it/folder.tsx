/** IT papkasi: yo'nalishlar va darslar ro'yxati. */

import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useProgress } from '@/core/store';
import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { TRACKS } from '@/features/it/tracks';
import type { Track } from '@/features/it/types';

export function ItFolder() {
  return (
    <>
      <Card style={{ gap: 8 }}>
        <T bold>🗣 IT inglizchasi</T>
        <T dim size={14}>deploy, debug, dependency... — loyihalarimizda uchragan so'zlar.</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button kind="ghost" label="🎴 Kartochka" onPress={() => router.push('/english/cards?deck=it')} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="🧪 Test" onPress={() => router.push('/english/quiz?deck=it')} /></View>
        </View>
      </Card>
      {TRACKS.map((t) => <TrackCard key={t.id} track={t} />)}
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
          <Pressable key={lesson.id} onPress={() => router.push(`/it/${lesson.id}`)}
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

/** 🔬 Science: Matematika · Geometriya · Fizika. Darslar tartib bilan, lekin hammasi ochiq (muddat yo'q). */
