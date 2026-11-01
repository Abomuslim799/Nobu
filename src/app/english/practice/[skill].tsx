/**
 * practice/[skill].tsx — alohida mashq bo'limlari (movie'ga bog'lanmagan):
 *   grammar   — mavzu tanlash → darsdagi mashqlar yoki AI yaratgan yangi 10 ta
 *   listening — gapni eshitib to'liq yozish, so'zma-so'z tekshiruv
 *   writing   — topshiriq tanlash → yozish → AI tekshiruvi
 *   speaking  — mavzu tanlash → AI bilan ovozli suhbat
 *   report    — barcha ko'nikmalar statistikasi + AI tahlil (kuchli/zaif tomonlar, reja)
 * Har bir natija lib/skills.ts jurnaliga yoziladi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { stopSpeaking } from '@/core/audio/speak';
import { T } from '@/core/ui/kit';
import { RateSwitch } from '@/core/ui/sound';
import { s } from '@/features/english/practice/kit';
import { GrammarPractice } from '@/features/english/practice/grammar';
import { ListeningPractice } from '@/features/english/practice/listening';
import { WritingPractice } from '@/features/english/practice/writing';
import { SpeakingPractice } from '@/features/english/practice/speaking';
import { Report } from '@/features/english/practice/report';

const TITLES: Record<string, string> = {
  grammar: '🧩 Grammar', listening: '🎧 Listening', writing: '✍️ Writing', speaking: '🗣 Speaking', report: '📊 Statistika va AI tahlil',
};

export default function Practice() {
  const insets = useSafeAreaInsets();
  const { skill = 'report' } = useLocalSearchParams<{ skill: string }>();
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => { stopSpeaking(); router.back(); }} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>{TITLES[skill] ?? skill}</T>
        {skill === 'listening' && <RateSwitch />}
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {skill === 'grammar' && <GrammarPractice />}
        {skill === 'listening' && <ListeningPractice />}
        {skill === 'writing' && <WritingPractice />}
        {skill === 'speaking' && <SpeakingPractice />}
        {skill === 'report' && <Report />}
      </ScrollView>
    </View>
  );
}

