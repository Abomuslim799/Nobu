/**
 * _layout.tsx (ildiz) — ilovaning skeleti.
 *
 * Stack — sahifalar ustma-ust ochiladi: pastda tablar, dars ochilganda
 * u tablar USTIGA chiqadi, "orqaga" bilan yopiladi.
 * ProgressProvider — barcha ekranlarga natijalarni (streak, darslar) beradi.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/constants/theme';
import { ProgressProvider } from '@/lib/progress';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <StatusBar style="light" />
      {/* Barcha sahifalar o'ngdan kiradi; chapdan o'ngga surib (ekranning istalgan joyidan) orqaga qaytiladi. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg },
        gestureEnabled: true, fullScreenGestureEnabled: true, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen name="cards" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="quote/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="subject/[id]" />
        <Stack.Screen name="unit/[id]" />
        <Stack.Screen name="practice/[skill]" />
        <Stack.Screen name="live" />
      </Stack>
    </ProgressProvider>
  );
}
