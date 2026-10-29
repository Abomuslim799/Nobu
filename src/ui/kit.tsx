/**
 * kit.tsx — qayta ishlatiladigan kichik UI bo'laklari: Screen, Card, Title, Button, Bar.
 * Har ekranda bir xil stilni qayta yozmaslik uchun.
 */

import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';

/** Tab ichidagi ekran. iPhone'da tepada "Dynamic Island", pastda tab paneli va
 *  "home" chizig'i bor — kontent ularning ostida qolmasligi kerak.
 *  iOS ScrollView o'zi ham bo'shliq qo'shishga harakat qiladi (automatic insets),
 *  SafeAreaView ham — natijada bo'shliq IKKI MARTA qo'shilib qolardi. Shuning uchun
 *  avtomatikni o'chirib (never), bo'shliqni o'zimiz aniq hisoblaymiz. */
const TAB_BAR = 56;

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  // Brauzerda tab paneli TEPADA turadi — kontent uning ostidan boshlansin.
  const pad = Platform.OS === 'web'
    ? { paddingTop: 72, paddingBottom: 32 }
    : { paddingTop: insets.top + 8, paddingBottom: insets.bottom + TAB_BAR + 24 };
  return (
    <View style={s.screen}>
      {scroll ? (
        <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={[s.scroll, pad]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[s.scroll, pad, { flex: 1 }]}>{children}</View>
      )}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {/* Tor ekranda (iPhone 14 — 390 pt) sig'masa, shrift o'zi kichrayadi. */}
      <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>{children}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

export function T({ children, dim, size = 15, bold, color, style }: {
  children: ReactNode; dim?: boolean; size?: number; bold?: boolean; color?: string; style?: TextStyle;
}) {
  return (
    <Text style={[{ color: color ?? (dim ? C.dim : C.text), fontSize: size,
                   fontWeight: bold ? '700' : '400', lineHeight: size * 1.4 }, style]}>
      {children}
    </Text>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled }: {
  label: string; onPress: () => void; kind?: 'primary' | 'ghost'; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        kind === 'ghost' && s.btnGhost,
        (pressed || disabled) && { opacity: 0.55 },
      ]}>
      <Text style={[s.btnText, kind === 'ghost' && { color: C.green }]}>{label}</Text>
    </Pressable>
  );
}

/** Progress chizig'i: value 0…1. */
export function Bar({ value, color = C.green }: { value: number; color?: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.round(Math.min(1, value) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: PAD, gap: 12 },
  card: {
    backgroundColor: C.card, borderColor: C.cardBorder, borderWidth: 1,
    borderRadius: R, padding: 16, gap: 8,
  },
  title: { color: C.text, fontSize: 30, fontWeight: '800' },
  sub: { color: C.dim, fontSize: 15, marginTop: 2 },
  btn: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnGhost: { backgroundColor: C.greenSoft },
  btnText: { color: '#04140D', fontSize: 16, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});
