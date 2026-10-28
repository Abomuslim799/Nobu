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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="game/[id]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="cards" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="quiz" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="book/[id]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="quote/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </ProgressProvider>
  );
}
