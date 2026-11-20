/**
 * bayt/ui.tsx — Bayt ul-mol ekranlari uchun umumiy bo'laklar: raqam klaviaturasi, tanlov tugmasi (chip), sarlavha.
 */

import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT_INSCR, FONT_UI } from '@/core/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'];

/** Summa klaviaturasi: digits — matn ("36980"), onChange — yangi matn. */
export function Keypad({ digits, onChange, h = 52 }: { digits: string; onChange: (d: string) => void; h?: number }) {
  const press = (k: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (k === 'del') return onChange(digits.slice(0, -1));
    if (digits.length >= 10) return;
    onChange((digits + k).replace(/^0+/, ''));
  };
  return (
    <View style={s.keys}>
      {KEYS.map((k) => (
        <Pressable key={k} onPress={() => press(k)} accessibilityLabel={k === 'del' ? "O'chirish" : k}
          style={({ pressed }) => [s.key, { height: h }, pressed && { backgroundColor: C.surface2 }]}>
          <Text style={s.keyText}>{k === 'del' ? '⌫' : k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Chip({ label, on, color, onPress, dot }: { label: string; on?: boolean; color?: string; onPress: () => void; dot?: string }) {
  const c = color ?? C.gold;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.chip, on && { backgroundColor: c, borderColor: c }, pressed && { opacity: 0.75 }]}>
      {dot ? <View style={[s.dot, { backgroundColor: dot }]} /> : null}
      <Text style={[s.chipText, on && { color: C.bg, fontFamily: FONT_UI.b }]}>{label}</Text>
    </Pressable>
  );
}

/** Ichki ekran sarlavhasi: chapda yopish/orqaga, o'rtada nom, o'ngda ixtiyoriy narsa. */
export function Head({ title, right, close }: { title: string; right?: ReactNode; close?: boolean }) {
  return (
    <View style={s.head}>
      <Pressable onPress={() => router.back()} accessibilityLabel={close ? 'Yopish' : 'Orqaga'} style={s.round}>
        <Text style={{ color: C.dim, fontSize: 18 }}>{close ? '✕' : '‹'}</Text>
      </Pressable>
      <Text style={s.headTitle}>{title}</Text>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/** Ichki ekran ramkasi: tepada Dynamic Island, pastda home chizig'i uchun joy (tab paneli yo'q). */
export function Page({ children }: { children: ReactNode }) {
  const i = useSafeAreaInsets();
  return <View style={[s.page, { paddingTop: i.top + 6, paddingBottom: i.bottom + 10 }]}>{children}</View>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20, gap: 12 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: { width: '31.9%', borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  keyText: { color: C.text, fontSize: 22, fontFamily: FONT_UI.sb },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: C.subtle2,
    backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chipText: { color: C.text, fontSize: 14, fontFamily: FONT_UI.sb },
  dot: { width: 8, height: 8, borderRadius: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headTitle: { color: C.text, fontFamily: FONT_INSCR, fontSize: 24 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.subtle2, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center' },
});
