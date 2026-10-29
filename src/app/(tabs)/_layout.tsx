/**
 * (tabs)/_layout.tsx — pastdagi 5 ta tab (iPhone'da 5 tadan ko'pi "More"ga yashirinadi). NativeTabs — iPhone'ning o'z tab paneli
 * (iOS 26'da shisha ko'rinishida). sf — Apple SF Symbols belgilari; src — Android/web uchun.
 */

import { NativeTabs } from 'expo-router/native-tabs';

import { C } from '@/constants/theme';
import { FRIENDS } from '@/lib/edition';

const home = require('@/assets/images/tabIcons/home.png');
const explore = require('@/assets/images/tabIcons/explore.png');

export default function TabsLayout() {
  return (
    <NativeTabs backgroundColor={C.bg} labelStyle={{ selected: { color: C.green } }} tintColor={C.green}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Bugun</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'flame', selected: 'flame.fill' }} src={home} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Label>{FRIENDS ? 'Ingliz tili' : "O'rganish"}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} src={explore} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="brain">
        <NativeTabs.Trigger.Label>Miya</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="brain.head.profile" src={explore} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library" hidden={FRIENDS}>
        <NativeTabs.Trigger.Label>Kutubxona</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }} src={explore} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Statistika</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" src={explore} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
