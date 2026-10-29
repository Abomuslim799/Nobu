/**
 * subject/[id].tsx — papka ichi: IT (yo'nalishlar va darslar) yoki Ingliz tili
 * (film unitlari, so'z boyligi, qisqa darslar). Chapdan o'ngga surib — orqaga.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { SUBJECTS } from '@/data/subjects';
import { EnglishFolder, ItFolder } from '@/ui/folders';
import { T } from '@/ui/kit';

export default function SubjectScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sub = SUBJECTS.find((x) => x.id === id);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={28}>‹</T></Pressable>
        <T size={24} bold>{sub?.icon} {sub?.title}</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: PAD, gap: 12, paddingBottom: insets.bottom + 40 }}>
        {id === 'it' && <ItFolder />}
        {id === 'en' && <EnglishFolder />}
      </ScrollView>
    </View>
  );
}

