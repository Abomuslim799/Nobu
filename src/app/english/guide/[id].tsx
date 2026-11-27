/**
 * english/guide/[id].tsx — mavzu qo'llanmasi: Asos → O'rta → Advanced, hiylalar, tipik xatolar, o'zini tekshirish.
 *   Daraja tanlansa — faqat o'sha darajagacha bo'limlar (tanlov saqlanadi). Grammar mavzusida — drill tugmasi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dayKey } from '@/core/date';
import { KEYS, readJSON, writeJSON } from '@/core/storage';
import { C, R } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { contentOf } from '@/features/english/drill/content';
import { toggleCheck, useDrill } from '@/features/english/drill/store';
import { guideOf, spans, visibleSections, type Block, type Level } from '@/features/english/guide/guide';
import { s } from '@/features/english/practice/kit';
import { say } from '@/features/english/speak';

const LEVELS: { l: Level; label: string }[] = [
  { l: 0, label: 'Hammasi' }, { l: 1, label: '🟢 Asos' }, { l: 2, label: "🟡 O'rta" }, { l: 3, label: '🔴 Advanced' },
];

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const g = guideOf(id);
  const drill = contentOf(id);
  const { data, reload } = useDrill();
  const [lvl, setLvl] = useState<Level>(0);
  useEffect(() => { readJSON<Level>(KEYS.guideLevel, 0).then(setLvl); }, []);
  const pick = (l: Level) => { setLvl(l); writeJSON(KEYS.guideLevel, l); };

  const today = dayKey();
  const checked = data?.checks[today]?.includes(id) ?? false;

  if (!g) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.top}><Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable></View>
        <View style={s.body}><T dim>Qo'llanma topilmadi.</T></View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={17} style={{ flex: 1 }} lines={1}>{g.title}</T>
        <Pressable onPress={() => router.push({ pathname: '/nobu/chat', params: { key: `drill:${id}` } })} hitSlop={10}>
          <T size={15} color={C.green}>❓ Savol</T>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        <T dim size={13}>{g.meta}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {LEVELS.map((x) => (
            <Pressable key={x.l} onPress={() => pick(x.l)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                borderColor: lvl === x.l ? C.green : C.cardBorder, backgroundColor: lvl === x.l ? C.greenSoft : 'transparent' }}>
              <T size={13} bold={lvl === x.l} color={lvl === x.l ? C.green : C.dim}>{x.label}</T>
            </Pressable>
          ))}
        </View>

        {visibleSections(g, lvl).map((sec) => (
          <Card key={sec.title} style={{ gap: 10 }}>
            <T bold size={17}>{sec.title}</T>
            {sec.blocks.map((b, i) => <BlockView key={i} b={b} />)}
          </Card>
        ))}

        {drill && <Button label="▶︎ Drill: gaplarni tarjima qil" onPress={() => router.push(`/english/drill/${id}`)} />}
        <Button kind="ghost" label={checked ? '✅ Bugun bajarildi' : "☐ Bajardim deb belgilash"}
          onPress={() => { toggleCheck(today, id).then(reload); }} />
      </ScrollView>
    </View>
  );
}

function Rich({ x, size = 15, color }: { x: string; size?: number; color?: string }) {
  return (
    <Text style={{ color: color ?? C.text, fontSize: size, lineHeight: size * 1.45 }}>
      {spans(x).map((p, i) => (
        <Text key={i} style={[p.b && { fontWeight: '700', color: C.green }, p.i && { fontStyle: 'italic' },
          p.s && { textDecorationLine: 'line-through', color: C.red }]}>{p.x}</Text>
      ))}
    </Text>
  );
}

const plain = (x: string) => x.replace(/\*\*|~~|\*/g, '');

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'p': return <Rich x={b.x} />;
    case 'list':
      return (
        <View style={{ gap: 6 }}>
          {b.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <T color={C.green}>•</T>
              <View style={{ flex: 1 }}><Rich x={it} /></View>
            </View>
          ))}
        </View>
      );
    case 'tip':
    case 'warn': {
      const warn = b.t === 'warn';
      return (
        <View style={{ padding: 12, borderRadius: R - 4, backgroundColor: warn ? C.redSoft : C.goldSoft }}>
          <Rich x={b.x} size={14} />
        </View>
      );
    }
    case 'ex':
      return (
        <Pressable onPress={() => { say('guide', 'en', plain(b.en)); }}
          style={({ pressed }) => [{ padding: 10, borderRadius: R - 4, backgroundColor: C.codeBg, gap: 2, opacity: pressed ? 0.7 : 1 }]}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Rich x={b.en} /></View>
            <T size={14}>🔊</T>
          </View>
          {!!b.uz && <Rich x={b.uz} size={13} color={C.dim} />}
        </Pressable>
      );
    case 'table':
      return (
        <View style={{ borderWidth: 1, borderColor: C.cardBorder, borderRadius: R - 6, overflow: 'hidden' }}>
          {b.head && <Row cells={b.head} head />}
          {b.rows.map((r, i) => <Row key={i} cells={r} odd={i % 2 === 1} />)}
        </View>
      );
  }
}

/** Jadval qatori: ekran eniga sig'adi; 3+ ustunda birinchisi torroq va shrift kichikroq. */
function Row({ cells, head, odd }: { cells: string[]; head?: boolean; odd?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: head ? C.surface2 : odd ? C.subtle : 'transparent' }}>
      {cells.map((c, i) => (
        <View key={i} style={{ flex: i === 0 && cells.length > 2 ? 0.7 : 1, padding: cells.length > 3 ? 5 : 7, borderLeftWidth: i ? 1 : 0, borderColor: C.cardBorder }}>
          {head ? <T bold size={cells.length > 3 ? 11 : 12}>{plain(c)}</T> : <Rich x={c} size={cells.length > 3 ? 11 : 12.5} />}
        </View>
      ))}
    </View>
  );
}
