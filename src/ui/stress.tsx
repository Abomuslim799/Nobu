import { StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { T } from '@/ui/kit';

/**
 * Urg'uni ko'rsatish: /ˈded.laɪn/ → DED · laɪn. ˈ — asosiy urg'u (yashil, katta),
 * ˌ — ikkinchi darajali (oq), qolganlari — kulrang. Shu bo'g'inni kuchliroq ayting.
 */
export function Stress({ ipa }: { ipa: string }) {
  const words = ipa.replace(/^\/|\/$/g, '').split(/\s+/);
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={s.ipa}>
        {words.map((w, wi) => (
          <Text key={wi}>
            {wi > 0 ? '   ' : ''}
            {w.split(/\.|(?=[ˈˌ])/).filter(Boolean).map((syl, i) => (
              <Text key={i}>
                {i > 0 ? <Text style={{ color: C.dim }}>·</Text> : null}
                <Text style={syl.startsWith('ˈ') ? s.primary : syl.startsWith('ˌ') ? { color: C.text } : null}>
                  {syl.replace(/[ˈˌ]/, '')}
                </Text>
              </Text>
            ))}
          </Text>
        ))}
      </Text>
      <T dim size={11}>yashil — urg'uli bo'g'in</T>
    </View>
  );
}

const s = StyleSheet.create({
  ipa: { color: C.dim, fontSize: 20, letterSpacing: 0.5 },
  primary: { color: C.green, fontWeight: '800', fontSize: 24 },
});
