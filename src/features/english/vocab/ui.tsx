/**
 * ui.tsx — so'z bazasi qismlari: o'rganish kartasi (so'z + rasm birga) va javobdan keyingi rasm animatsiyasi.
 *   Dizayn keyin butun ilova bilan birga qayta ishlanadi (glass/solid) — hozir qolip.
 */

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { C, R } from '@/core/theme';
import { Card, T } from '@/core/ui/kit';
import { say } from '@/features/english/speak';
import { SoundButton } from '@/features/english/ui/sound';
import { Stress } from '@/features/english/ui/stress';
import type { Item } from '@/features/english/vocab/base';
import type { VQuestion } from '@/features/english/vocab/question';

/** Rasm: o'z surati yoki emoji. */
export function Picture({ item, size = 96 }: { item: Item; size?: number }) {
  if (item.image) return <Image source={{ uri: item.image }} style={{ width: size * 1.6, height: size * 1.6, borderRadius: R }} contentFit="cover" />;
  return <Text style={{ fontSize: size, lineHeight: size * 1.2 }}>{item.emoji ?? '📝'}</Text>;
}

/** Rasm yengil "pop" bilan chiqadi (scale + fade) — key o'zgarganda qayta o'ynaydi. */
export function PicturePop({ item, size = 96 }: { item: Item; size?: number }) {
  const [a] = useState(() => new Animated.Value(0));
  useEffect(() => {
    a.setValue(0);
    Animated.spring(a, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [a, item.id]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return <Animated.View style={{ opacity: a, transform: [{ scale }], alignItems: 'center' }}><Picture item={item} size={size} /></Animated.View>;
}

/** Yangi so'z kartasi: so'z va rasm birga, tarjima, misol, ovoz. */
export function LearnCard({ item }: { item: Item }) {
  return (
    <View style={s.card}>
      <PicturePop item={item} size={88} />
      <Text style={s.word} adjustsFontSizeToFit numberOfLines={2}>{item.word}</Text>
      {item.ipa ? <Stress ipa={item.ipa} /> : null}
      <T size={20} bold color={C.green} style={{ textAlign: 'center' }}>{item.translation}</T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SoundButton id={item.id} part="w" text={item.word} label="So'z" />
        {item.example ? <SoundButton id={item.id} part="s" text={item.example} label="Gap" /> : null}
      </View>
      {item.example ? <T dim style={{ textAlign: 'center' }}>{item.example}</T> : null}
      {item.note ? <T dim size={13} style={{ textAlign: 'center' }}>💡 {item.note}</T> : null}
    </View>
  );
}

/** Savol matni (ovozli savolda — qayta eshitish tugmasi). */
export function Prompt({ q }: { q: VQuestion }) {
  if (q.type === 'audio') {
    return (
      <Pressable onPress={() => say(q.item.id, 'w', q.item.word)}>
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}><T size={44}>🔊</T><T dim>bosing — qayta eshitish</T></Card>
      </Pressable>
    );
  }
  return <Card style={{ paddingVertical: 24 }}><T bold size={q.type === 'cloze' ? 18 : 24} style={{ textAlign: 'center' }}>{q.prompt}</T></Card>;
}

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R * 1.5, borderWidth: 1, borderColor: C.cardBorder, padding: 22, alignItems: 'center', gap: 12 },
  word: { color: C.text, fontSize: 40, fontWeight: '800', textAlign: 'center' },
  opt: { borderRadius: R, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card, paddingVertical: 16, paddingHorizontal: 14 },
});
