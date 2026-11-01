/**
 * Bugun — usturlob (FR va daraja), streak/muz, ⚡ kunlik test, aniq kunlik reja (takror, movie qadami, zaif miya ko'nikmasi, shaxmat, kitob) va haftalik faollik.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAMES } from '@/data/games';
import { pushPlan } from '@/lib/sync';
import { LESSONS as SCI } from '@/science/lessons';
import { BRAIN_SKILLS, brainStats, getBrainLog, type BrainEntry } from '@/lib/brain';

import { C, FONT_DISPLAY } from '@/constants/theme';
import { STREAK_SEC, fmtDur, useMeta } from '@/lib/meta';
import { Astrolabe, fmtN } from '@/ui/astrolabe';
import { ALL_LESSONS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { dayKey, lastDays } from '@/lib/streak';
import { AUDIO } from '@/data/audio';
import { quoteOfDay } from '@/lib/reading';
import { STEPS, UNITS, stepsDone } from '@/data/units';
import { FRIENDS } from '@/lib/edition';
import { VERSION } from '@/lib/version';
import { QuoteCard } from '@/ui/quote-card';
import { Button, Card, Screen, T } from '@/ui/kit';

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];   // Date.getDay(): 0 = yakshanba

export default function Today() {
  const { data, today, todayRead } = useProgress();
  const readGoal = data.settings.readGoal;
  const quote = quoteOfDay(data.quotes);
  // Keyingi dars — hali tugatilmaganlarning birinchisi.
  const next = ALL_LESSONS.find(({ lesson }) => !data.lessons[lesson.id]);
  const unit = UNITS.find((u) => stepsDone(data.unitSteps[u.id]) < STEPS.length) ?? UNITS[0];
  const nextStep = STEPS.find((st) => !(data.unitSteps[unit.id] ?? []).includes(st.id)) ?? STEPS[0];

  // Miya jurnali — ekranga qaytganda yangilanadi
  const [log, setLog] = useState<BrainEntry[]>([]);
  useFocusEffect(useCallback(() => { getBrainLog().then(setLog); }, []));
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const todayLog = log.filter((e) => e.at >= start.getTime());

  // Eng zaif ko'nikma: hali o'ynalmagan yoki oxirgi natijalari eng past (shaxmat alohida rejada)
  const weak = brainStats(log).filter((x) => x.skill !== 'chess')
    .sort((a, b) => (a.count ? a.recent : -1) - (b.count ? b.recent : -1))[0];
  const weakGames = GAMES.filter((g) => g.skill === weak.skill && !g.ai);
  const weakGame = weakGames[new Date().getDate() % Math.max(1, weakGames.length)] ?? GAMES[1];
  const weakTitle = BRAIN_SKILLS.find((x) => x.id === weak.skill)?.title ?? '';

  const due = Object.values(data.cards).filter((c) => c.due <= Date.now()).length;
  const cardGoal = Math.min(20, Math.max(10, due + (today.cards ?? 0)));

  const goals = [
    { icon: '🎴', label: `So'z takrori · ${today.cards ?? 0}/${cardGoal}`, sub: due ? `${due} ta so'z takror kutmoqda` : 'Yangi so\'zlar',
      done: (today.cards ?? 0) >= cardGoal, go: () => router.push('/cards') },
    { icon: unit.emoji, label: `Movie: ${unit.source} — ${nextStep.title}`, sub: `${stepsDone(data.unitSteps[unit.id])}/${STEPS.length} qadam`,
      done: (today.steps ?? 0) >= 1, go: () => router.push(`/unit/${unit.id}`) },
    ...(FRIENDS ? [] : [
      { icon: weakGame.icon, label: `Miya: ${weakGame.title}`, sub: `zaif tomon — ${weakTitle}${weak.count ? ` (oxirgi ${weak.recent}%)` : ' (hali sinalmagan)'}`,
        done: todayLog.some((e) => e.skill !== 'chess'), go: () => router.push(`/game/${weakGame.id}`) },
      { icon: '♟️', label: 'Shaxmat: 5 masala', sub: 'taktika — har kuni',
        done: todayLog.some((e) => e.skill === 'chess'), go: () => router.push('/game/chess') },
      ...(() => {
        const sl = SCI.find((l) => !data.lessons[`sci-${l.id}`]);
        const doneToday = SCI.some((l) => data.lessons[`sci-${l.id}`]?.day === dayKey());
        return sl || doneToday ? [{ icon: '🔬', label: sl ? `Science: ${sl.title}` : 'Science: dars tugatildi', sub: sl ? `${sl.sub} · ~${sl.minutes} daq` : '',
          done: doneToday, go: () => router.push(sl ? `/sci/${sl.id}` : '/subject/science') }] : [];
      })(),
      { icon: '📚', label: `Kitob · ${todayRead}/${readGoal} daq`, sub: data.activeRead ? "o'qilmoqda" : '',
        done: todayRead >= readGoal, go: () => router.push(data.activeRead ? `/book/${data.activeRead.bookId}` : '/library') },
    ]),
  ];
  const goalDone = goals.filter((g) => g.done).length;
  const leftKey = goals.filter((g) => !g.done).map((g) => `${g.icon} ${g.label}`).join('|');
  useEffect(() => {
    pushPlan({ done: goalDone, total: goals.length, left: leftKey ? leftKey.split('|') : [] });
  }, [goalDone, goals.length, leftKey]);

  const meta = useMeta();
  const now = new Date();
  const hour = now.getHours();
  const hello = hour < 5 ? 'Xayrli tun' : hour < 11 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : hour < 23 ? 'Xayrli kech' : 'Xayrli tun';
  const needMin = Math.max(0, Math.ceil((STREAK_SEC - meta.todaySec) / 60));
  const dd = meta.dailyDone;

  return (
    <Screen>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <T dim size={12}>{DAYS[now.getDay()]}, {now.getDate()}-{MONTHS[now.getMonth()]}</T>
          <Text style={s.h1}>{hello}</Text>
        </View>
        <Pressable onPress={() => router.push('/xp')} style={s.chips} hitSlop={8}>
          <View style={[s.chip, { backgroundColor: C.goldSoft }]}><T bold size={13} color={meta.widget === 'ok' ? C.gold : C.dim}>🔥 {meta.streak}</T></View>
          <View style={s.chip}><T bold size={13}>🧊 {meta.m.muz}</T></View>
        </Pressable>
      </View>
      {VERSION.startsWith('sinov') && (
        <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: '#FBBF24' }}>
          <T bold color="#FBBF24">🧪 SINOV versiyasi ({VERSION}) — asosiy ilova emas</T>
        </View>
      )}

      <Pressable onPress={() => router.push('/xp')}>
        <Card style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 12, gap: 6 }}>
          <Astrolabe fr={meta.fr} title={meta.rank.title} rankId={meta.rank.id} size={220} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <View style={[s.chip, { backgroundColor: meta.week >= 0 ? C.greenSoft : C.redSoft }]}>
              <T bold size={12} color={meta.week >= 0 ? C.green : C.red}>{meta.week >= 0 ? '+' : ''}{meta.week} bu hafta</T></View>
            <T dim size={12}>eng yuqori {fmtN(meta.peak)}</T>
          </View>
          <T dim size={12}>
            {meta.widget === 'ok' ? `🔥 ${meta.streak} kun · bugun ✓ · ${fmtDur(meta.todaySec)}, ${meta.todayXP} XP`
              : meta.widget === 'pause' ? `⏸ Kecha muz ishlatildi · streakni saqlash uchun yana ${needMin} daqiqa`
              : meta.widget === 'ice' ? `❄️ 2 kun o'tkazildi — bugun ${needMin} daqiqa ishlamasangiz streak 0 bo'ladi`
              : `Bugun streak uchun yana ${needMin} daqiqa · ${fmtDur(meta.todaySec)} ishlandi`}
          </T>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/test')} style={({ pressed }) => [s.bolt, dd && s.boltDone, pressed && { opacity: 0.8 }]}>
        <Text style={[s.boltT, dd && { color: C.text }]}>{dd ? `✓ Bugungi test · ${dd.ok}/${dd.n}` : '⚡ Kunlik test · 10 savol'}</Text>
        <Text style={[s.boltS, dd && { color: C.dim }]}>{dd ? `${dd.after - dd.before >= 0 ? '+' : ''}${dd.after - dd.before} FR · yana mashq qilish` : 'ingliz · matematika · geometriya · fizika'}</Text>
      </Pressable>

      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.h2}>{goalDone === goals.length ? '✅ Reja bajarildi' : 'Bugungi reja'}</Text>
          <T dim size={13} style={{ fontVariant: ['tabular-nums'] }}>{goalDone}/{goals.length} · {Math.floor(meta.todaySec / 60)} daq</T>
        </View>
        {goals.map((g) => (
          <Pressable key={g.label} onPress={g.go} style={({ pressed }) => [s.row, g.done && s.rowDone, pressed && { opacity: 0.7 }]}>
            <View style={[s.ic, g.done && { backgroundColor: C.greenSoft }]}><Text style={{ fontSize: 19 }}>{g.done ? '✓' : g.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <T bold={!g.done} dim={g.done} size={15}>{g.label}</T>
              {!!g.sub && <T dim size={12}>{g.sub}</T>}
            </View>
            {!g.done && <T dim>›</T>}
          </Pressable>
        ))}
      </Card>

      <Pressable onPress={() => router.push('/xp')}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T dim>Haftalik faollik</T><T dim size={13}>{fmtN(meta.xp)} XP ›</T>
          </View>
          <View style={s.week}>
            {lastDays(7).map((day) => {
              const [y, m, d] = day.split('-').map(Number);
              const mk = meta.mark(day);
              return (
                <View key={day} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={[s.dot, mk === 'ok' && s.dotOn, mk === 'frozen' && s.dotIce, day === dayKey() && s.dotToday]}>
                    {mk === 'frozen' && <Text style={{ fontSize: 12 }}>🧊</Text>}
                  </View>
                  <T dim size={12}>{WEEKDAYS[new Date(y, m - 1, d).getDay()]}</T>
                </View>
              );
            })}
          </View>
        </Card>
      </Pressable>

      {!FRIENDS && quote ? <QuoteCard q={quote} book={data.books.find((b) => b.id === quote.bookId)?.title} /> : null}

      {FRIENDS ? null : next ? (
        <Card>
          <T dim>Keyingi dars · {next.track.icon} {next.track.title}</T>
          <T size={18} bold>{next.lesson.title}</T>
          <T dim>~{next.lesson.minutes} daqiqa</T>
          <Button label="Boshlash" onPress={() => router.push(`/lesson/${next.lesson.id}`)} />
        </Card>
      ) : null}

      <T dim size={12}>Nobu v{VERSION} · ovoz: {Object.keys(AUDIO).length ? `Ryan (${Object.keys(AUDIO).length} so'z)` : 'telefon'}</T>
    </Screen>
  );
}

const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  h1: { color: C.text, fontFamily: FONT_DISPLAY, fontSize: 28 },
  h2: { color: C.text, fontFamily: FONT_DISPLAY, fontSize: 18 },
  chips: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.subtle },
  bolt: { backgroundColor: C.green, borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 2 },
  boltDone: { backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  boltT: { color: C.onAccent, fontSize: 18, fontWeight: '800' },
  boltS: { color: C.onAccent, fontSize: 12, opacity: 0.8 },
  ic: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  dotIce: { backgroundColor: 'rgba(125,211,252,0.35)', alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, backgroundColor: C.subtle },
  rowDone: { opacity: 0.6 },
  dot: { alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 13, backgroundColor: C.subtle },
  dotOn: { backgroundColor: C.green },
  dotToday: { borderWidth: 2, borderColor: C.fire },
});
