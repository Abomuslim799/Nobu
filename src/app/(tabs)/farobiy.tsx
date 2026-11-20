/**
 * Farobiy — o'qish olami: O'rganish, Miya (shaxmat), Kutubxona, Nobu. Har biri o'z ekraniga ochiladi.
 */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { C, FONT_INSCR } from '@/core/theme';
import { Card, Screen, T } from '@/core/ui/kit';

const ITEMS = [
  { href: '/learn', icon: '📚', title: "O'rganish", about: 'Ingliz tili · IT · Science' },
  { href: '/brain', icon: '♞', title: 'Miya', about: 'Shaxmat masalalari' },
  { href: '/library', icon: '📖', title: 'Kutubxona', about: "Kitoblar va iqtiboslar" },
  { href: '/nobu', icon: '✦', title: 'Nobu', about: 'Yordamchi: suhbat va tahlil' },
] as const;

export default function Farobiy() {
  return (
    <Screen>
      <Text style={s.title}>Farobiy</Text>
      {ITEMS.map((it, i) => (
        <Animated.View key={it.href} entering={FadeInDown.delay(i * 50).duration(300)}>
          <Pressable onPress={() => router.push(it.href)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={s.icon}><Text style={{ fontSize: 26, color: C.gold }}>{it.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <T size={18} bold>{it.title}</T>
                <T dim size={13}>{it.about}</T>
              </View>
              <T dim size={22}>›</T>
            </Card>
          </Pressable>
        </Animated.View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { color: C.gold, fontFamily: FONT_INSCR, fontSize: 32, marginBottom: 6 },
  icon: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
});
