/** Saytda (do'stlar versiyasi) jonli suhbat yo'q — WebView faqat telefonda ishlaydi. */
import { router } from 'expo-router';
import { View } from 'react-native';

import { C, PAD } from '@/constants/theme';
import { Button, T } from '@/ui/kit';

export default function LiveWeb() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: PAD, gap: 12 }}>
      <T>Jonli suhbat faqat Nobu ilovasida ishlaydi.</T>
      <Button label="Orqaga" onPress={() => router.back()} />
    </View>
  );
}
