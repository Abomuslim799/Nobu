/** Science papkasi: matematika, geometriya, fizika darslari. */

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { AREAS, lessonsOf } from '@/features/science/lessons';

export function ScienceFolder({ lessons }: { lessons: Record<string, { correct: number; total: number }> }) {
  return (
    <>
      <Card style={{ gap: 8 }}>
        <T bold>Ustoz Farobiy bilan</T>
        <T dim size={14}>Istalgan mavzuni muhokama qiling, masala so'rang yoki jonli gaplashing.</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button label="💬 Suhbat" onPress={() => router.push({ pathname: '/nobu/chat', params: { key: 'science' } })} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="📊 Tahlil" onPress={() => router.push('/nobu/report')} /></View>
        </View>
      </Card>
      <Pressable onPress={() => router.push('/v2/qiyalik')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Card style={{ gap: 4, borderColor: C.gold }}>
          <T dim size={12}>🧪 Yangi metodika · test</T>
          <T bold size={17}>Qiyalik — 🌱 Urug' · 🌿 Nihol · 🌳 Daraxt</T>
          <T dim size={13}>Interaktiv doska: chiziqqa tegish, nuqtani surish, AI ga tushuntirish</T>
        </Card>
      </Pressable>
      {AREAS.map((a) => {
        const ls = lessonsOf(a.id);
        const done = ls.filter((l) => lessons[`sci-${l.id}`]).length;
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
              const r = lessons[`sci-${l.id}`];
              return (
                <Pressable key={l.id} onPress={() => router.push(`/science/${l.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1,
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.subtle })}>
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
