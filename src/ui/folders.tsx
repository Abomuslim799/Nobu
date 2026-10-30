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
import { FRIENDS } from '@/lib/edition';
import { useProgress } from '@/lib/progress';
import { AREAS, lessonsOf } from '@/science/lessons';
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
        <T dim size={14}>📚 Core: eng ko'p ishlatiladigan 2 801 so'z, 200 tadan to'plamlarda — "Test" ro'yxatidan boshlang.</T>
        <T dim size={11}>Core ro'yxati: New General Service List 1.2 (Browne, Culligan, Phillips), CC BY-SA 4.0.</T>
        <Button label="Kartochkalar va testlar" onPress={() => router.push('/cards')} />
      </Card>

      <T bold size={18}>🏋️ Mashq — alohida ko'nikmalar</T>
      <Card style={{ gap: 8 }}>
        <T dim size={14}>Movie'dan tashqari: bitta ko'nikmaning o'zi bilan shug'ullaning. Har bir natija statistikaga yoziladi.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['grammar', '🧩 Grammar'], ['listening', '🎧 Listening'],
            ...(FRIENDS ? [] : [['writing', '✍️ Writing'], ['speaking', '🗣 Speaking + talaffuz']]),
          ].map(([id, label]) => (
            <Pressable key={id} onPress={() => router.push(`/practice/${id}`)} style={({ pressed }) => [{
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder,
            }, pressed && { opacity: 0.6 }]}>
              <Text style={{ color: C.text, fontWeight: '600' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {!FRIENDS && <Button label="📊 Statistika va AI tahlil" onPress={() => router.push('/practice/report')} />}
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

/** 🔬 Science: Matematika · Geometriya · Fizika. Darslar tartib bilan, lekin hammasi ochiq (muddat yo'q). */
export function ScienceFolder() {
  const { data } = useProgress();
  return (
    <>
      <Card style={{ gap: 8 }}>
        <T bold>🤖 Nobu bilan</T>
        <T dim size={14}>Istalgan mavzuni muhokama qiling, masala so'rang yoki jonli gaplashing.</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button label="💬 Suhbat" onPress={() => router.push({ pathname: '/nobu', params: { key: 'science' } })} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="📊 Tahlil" onPress={() => router.push('/nobu-report')} /></View>
        </View>
      </Card>
      {AREAS.map((a) => {
        const ls = lessonsOf(a.id);
        const done = ls.filter((l) => data.lessons[`sci-${l.id}`]).length;
        return (
          <Card key={a.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: a.color + '33' }}>
                <Text style={{ fontSize: 20, color: a.color, fontWeight: '800' }}>{a.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <T bold size={17}>{a.title}</T>
                <T dim size={13}>{a.about}</T>
              </View>
              <T dim size={13}>{done}/{ls.length}</T>
            </View>
            <Bar value={ls.length ? done / ls.length : 0} color={a.color} />
            {ls.map((l) => {
              const r = data.lessons[`sci-${l.id}`];
              return (
                <Pressable key={l.id} onPress={() => router.push(`/sci/${l.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1,
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' })}>
                  <T size={16}>{r ? '✅' : `${l.n}.`}</T>
                  <View style={{ flex: 1 }}>
                    <T size={15} bold={!r}>{l.title}</T>
                    <T dim size={12}>{l.sub} · ~{l.minutes} daq{r ? ` · ${r.correct}/${r.total}` : ''}</T>
                  </View>
                  <T dim>›</T>
                </Pressable>
              );
            })}
          </Card>
        );
      })}
      <T dim size={12}>Darslar asta-sekin qo'shiladi. Har dars: taxmin → simulyatsiya → qonuniyat → misol → mashqlar. Tayanch: OpenStax University Physics (CC BY).</T>
    </>
  );
}
