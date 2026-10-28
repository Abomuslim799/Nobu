/**
 * Bugun — streak, kunlik maqsad, keyingi dars va haftalik faollik.
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { ALL_LESSONS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { dayKey, lastDays } from '@/lib/streak';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];   // Date.getDay(): 0 = yakshanba
const GOAL = { lessons: 1, games: 1 };

export default function Today() {
  const { data, streak, best, today } = useProgress();
  // Keyingi dars — hali tugatilmaganlarning birinchisi.
  const next = ALL_LESSONS.find(({ lesson }) => !data.lessons[lesson.id]);
  const goalDone = Math.min(today.lessons, GOAL.lessons) + Math.min(today.games, GOAL.games);

  return (
    <Screen>
      <Title sub="Har kuni oz-ozdan — ming kunda usta.">Bugun</Title>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Text style={s.fire}>{streak > 0 ? '🔥' : '🪵'}</Text>
        <View style={{ flex: 1 }}>
          <T size={28} bold>{streak} kun</T>
          <T dim>{streak > 0 ? `Seriya davom etmoqda · rekord ${best}` : 'Bugun boshlang — seriya 1 dan'}</T>
        </View>
      </Card>

      <Card>
        <T bold>Kunlik maqsad · {goalDone}/2</T>
        <Bar value={goalDone / 2} />
        <T dim>{today.lessons >= 1 ? '✓' : '○'} 1 ta dars    {today.games >= 1 ? '✓' : '○'} 1 ta miya mashqi    ·  {today.xp} XP</T>
      </Card>

      <Card>
        <T dim>Haftalik faollik</T>
        <View style={s.week}>
          {lastDays(7).map((day) => {
            const [y, m, d] = day.split('-').map(Number);
            const active = !!data.days[day];
            return (
              <View key={day} style={{ alignItems: 'center', gap: 6 }}>
                <View style={[s.dot, active && s.dotOn, day === dayKey() && s.dotToday]} />
                <T dim size={12}>{WEEKDAYS[new Date(y, m - 1, d).getDay()]}</T>
              </View>
            );
          })}
        </View>
      </Card>

      {next ? (
        <Card>
          <T dim>Keyingi dars · {next.track.icon} {next.track.title}</T>
          <T size={18} bold>{next.lesson.title}</T>
          <T dim>~{next.lesson.minutes} daqiqa</T>
          <Button label="Boshlash" onPress={() => router.push(`/lesson/${next.lesson.id}`)} />
        </Card>
      ) : (
        <Card><T>Barcha darslar tugadi. Yangilari tez orada!</T></Card>
      )}

      <Button kind="ghost" label="⚡ Miya mashqi — 60 soniya" onPress={() => router.push('/game/speed-math')} />
      <Button kind="ghost" label="🎴 So'z kartochkalari" onPress={() => router.push('/cards')} />
    </Screen>
  );
}

const s = StyleSheet.create({
  fire: { fontSize: 44 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)' },
  dotOn: { backgroundColor: C.green },
  dotToday: { borderWidth: 2, borderColor: C.fire },
});
