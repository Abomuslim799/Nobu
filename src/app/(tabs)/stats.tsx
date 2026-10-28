/**
 * Statistika — umumiy natijalar, oxirgi 14 kun grafigi, yo'nalishlar bo'yicha.
 */

import { Alert, View } from 'react-native';

import { C } from '@/constants/theme';
import { TRACKS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { lastDays } from '@/lib/streak';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';

export default function Stats() {
  const { data, streak, best, reset } = useProgress();
  const results = Object.values(data.lessons);
  const correct = results.reduce((sum, r) => sum + r.correct, 0);
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const days = lastDays(14);
  const maxXp = Math.max(10, ...days.map((d) => data.days[d]?.xp ?? 0));

  return (
    <Screen>
      <Title>Statistika</Title>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Seriya" value={`${streak}🔥`} />
        <Stat label="Rekord" value={`${best}`} />
        <Stat label="Aniqlik" value={total ? `${Math.round((correct / total) * 100)}%` : '—'} />
      </View>

      <Card>
        <T dim>Oxirgi 14 kun · XP</T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
          {days.map((d) => {
            const xp = data.days[d]?.xp ?? 0;
            return (
              <View key={d} style={{ flex: 1, height: `${Math.max(3, (xp / maxXp) * 100)}%`,
                borderRadius: 4, backgroundColor: xp ? C.green : 'rgba(255,255,255,0.08)' }} />
            );
          })}
        </View>
      </Card>

      <Card>
        <T dim>Yo'nalishlar</T>
        {TRACKS.map((t) => {
          const done = t.lessons.filter((l) => data.lessons[l.id]).length;
          return (
            <View key={t.id} style={{ gap: 4, marginTop: 6 }}>
              <T>{t.icon} {t.title} · {done}/{t.lessons.length}</T>
              <Bar value={done / t.lessons.length} color={t.color} />
            </View>
          );
        })}
      </Card>

      <Button kind="ghost" label="Natijalarni tozalash"
        onPress={() => Alert.alert('Tozalash', "Barcha natijalar o'chiriladi.", [
          { text: 'Bekor', style: 'cancel' },
          { text: "O'chirish", style: 'destructive', onPress: reset },
        ])} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <T size={24} bold>{value}</T>
      <T dim size={13}>{label}</T>
    </Card>
  );
}
