/**
 * Statistika — umumiy natijalar, oxirgi 14 kun grafigi, yo'nalishlar bo'yicha. Sozlamalar — /settings.
 */

import { router } from 'expo-router';
import { View } from 'react-native';

import { C } from '@/core/theme';
import { TRACKS } from '@/features/it/tracks';
import { useRating, useProgress } from '@/store';
import { lastDays } from '@/core/date';
import { Bar, Button, Card, Screen, T, Title } from '@/core/ui/kit';

export default function Stats() {
  const { data } = useProgress();
  const { streak, best, fr, rank, m: rating } = useRating();

  const days = lastDays(14);
  const maxXp = Math.max(10, ...days.map((d) => Math.floor((rating.sec[d] ?? 0) / 60)));

  return (
    <Screen>
      <Title sub="Shaxsiy yordamchingiz: natijalar va tahlil">Nobu</Title>
      <Button label="🤖 Nobu tahlili — barcha bo'limlar" onPress={() => router.push('/nobu/report')} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Seriya" value={`${streak}🔥`} />
        <Stat label="Rekord" value={`${best}`} />
        <Stat label={rank.title} value={`${fr}`} />
      </View>

      <Card>
        <T dim>Oxirgi 14 kun · faol daqiqa</T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
          {days.map((d) => {
            const xp = Math.floor((rating.sec[d] ?? 0) / 60);
            return (
              <View key={d} style={{ flex: 1, height: `${Math.max(3, (xp / maxXp) * 100)}%`,
                borderRadius: 4, backgroundColor: xp ? C.green : C.subtle2 }} />
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

      <Button kind="ghost" label="⚙️ Sozlamalar" onPress={() => router.push('/settings')} />
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

