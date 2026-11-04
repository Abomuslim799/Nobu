/**
 * _layout.tsx (ildiz) — ilova skeleti.
 *   StoreProvider — yagona holat (xotira ko'chirilgandan keyin yuklanadi).
 *   Ildiz View har teginishda markActive() — faol vaqt (XP, streak) shundan hisoblanadi.
 *   Stack — ekranlar o'ngdan kiradi, chapdan surib orqaga qaytiladi (dars va testda o'chirilgan — slayder/tasodifiy chiqish).
 */

import { useFonts, YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Appearance, DevSettings, View } from 'react-native';

import { StoreProvider, markActive } from '@/store';
import { C, SCHEME } from '@/core/theme';

const NO_SWIPE = { gestureEnabled: false, fullScreenGestureEnabled: false };

export default function RootLayout() {
  useFonts({ YoungSerif_400Regular });
  // Telefon tun/kun rejimini almashtirsa — ilova yangi ranglar bilan qayta yuklanadi
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if ((colorScheme === 'light' ? 'light' : 'dark') !== SCHEME) Updates.reloadAsync().catch(() => DevSettings.reload());
    });
    return () => sub.remove();
  }, []);
  return (
    <StoreProvider>
      <View style={{ flex: 1 }} onTouchStart={markActive}>
        <StatusBar style={SCHEME === 'light' ? 'dark' : 'light'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg },
          gestureEnabled: true, fullScreenGestureEnabled: true, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="science/[id]" options={NO_SWIPE} />
          <Stack.Screen name="v2/[id]" options={NO_SWIPE} />
          <Stack.Screen name="chess/index" options={NO_SWIPE} />
          <Stack.Screen name="chess/bot" options={NO_SWIPE} />
          <Stack.Screen name="chess/review" options={NO_SWIPE} />
          <Stack.Screen name="test" options={NO_SWIPE} />
          <Stack.Screen name="library/quote/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </View>
    </StoreProvider>
  );
}
