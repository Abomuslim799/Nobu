/**
 * Bugun — streak, kunlik maqsad, keyingi dars va haftalik faollik.
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { ALL_LESSONS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { dayKey, lastDays } from '@/lib/streak';
import { AUDIO } from '@/data/audio';
import { quoteOfDay } from '@/lib/reading';
import { STEPS, UNITS, stepsDone } from '@/data/units';
import { FRIENDS } from '@/lib/edition';
import { VERSION } from '@/lib/version';
import { QuoteCard } from '@/ui/quote-card';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];   // Date.getDay(): 0 = yakshanba

export default function Today() {
  const { data, streak, best, today, todayRead } = useProgress();
  const readGoal = data.settings.readGoal;
  const quote = quoteOfDay(data.quotes);
  // Keyingi dars — hali tugatilmaganlarning birinchisi.
  const next = ALL_LESSONS.find(({ lesson }) => !data.lessons[lesson.id]);
  const goals = [
    { done: today.lessons >= 1, label: '1 dars' },
    { done: today.games >= 1, label: '1 miya mashqi' },
    ...(FRIENDS ? [{ done: (today.cards ?? 0) >= 10, label: `${today.cards ?? 0}/10 kartochka` }]
      : [{ done: todayRead >= readGoal, label: `${todayRead}/${readGoal} daq kitob` }]),
  ];
  const unit = UNITS.find((u) => stepsDone(data.unitSteps[u.id]) < STEPS.length) ?? UNITS[0];
  const goalDone = goals.filter((g) => g.done).length;

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
        <T bold>Kunlik maqsad · {goalDone}/{goals.length}</T>
        <Bar value={goalDone / goals.length} />
        <T dim>{goals.map((g) => `${g.done ? '✓' : '○'} ${g.label}`).join('   ')}   · {today.xp} XP</T>
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

      {FRIENDS ? (
        <Card>
          <T dim>Ingliz tili · {unit.emoji} {unit.source}</T>
          <T size={18} bold>{unit.title}</T>
          <T dim>{stepsDone(data.unitSteps[unit.id])}/{STEPS.length} qadam</T>
          <Button label="Davom etish" onPress={() => router.push(`/unit/${unit.id}`)} />
        </Card>
      ) : null}

      {!FRIENDS && quote ? <QuoteCard q={quote} book={data.books.find((b) => b.id === quote.bookId)?.title} /> : null}

      {!FRIENDS && <Button kind="ghost" label={data.activeRead ? '⏱ Kitob o\'qilmoqda — tugatish' : '📚 Kitob o\'qish'}
        onPress={() => router.push(data.activeRead ? `/book/${data.activeRead.bookId}` : '/library')} />}

      {FRIENDS ? null : next ? (
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
      <T dim size={12}>Nobu v{VERSION} · ovoz: {Object.keys(AUDIO).length ? `Ryan (${Object.keys(AUDIO).length} so'z)` : 'telefon'}</T>
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
