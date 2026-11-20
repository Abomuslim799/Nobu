/**
 * (tabs)/_layout.tsx — pastdagi 3 ta tab: Bugun · Bayt ul-mol · Farobiy.
 * O'rganish, Miya, Kutubxona va Nobu endi Farobiy tabi ichida (alohida ekranlar: /learn, /brain, /library, /nobu).
 * NativeTabs — iPhone'ning o'z tab paneli. sf — Apple SF Symbols belgilari; src — Android/web uchun.
 */

import { NativeTabs } from 'expo-router/native-tabs';

import { C } from '@/core/theme';

const home = require('@/assets/images/tabIcons/home.png');
const explore = require('@/assets/images/tabIcons/explore.png');

export default function TabsLayout() {
  return (
    <NativeTabs backgroundColor={C.bg} labelStyle={{ selected: { color: C.green } }} tintColor={C.green}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Bugun</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'flame', selected: 'flame.fill' }} src={home} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bayt">
        <NativeTabs.Trigger.Label>Bayt ul-mol</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'building.columns', selected: 'building.columns.fill' }} src={explore} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="farobiy">
        <NativeTabs.Trigger.Label>Farobiy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} src={explore} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
