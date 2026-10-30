/**
 * nobu.tsx — Nobu (shaxsiy yordamchi) gapirayotgan blok: darslarda va suhbatda bir xil ko'rinish.
 */

import { StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { T } from '@/ui/kit';

export function NobuSays({ text }: { text: string }) {
  return (
    <View style={st.nobu}>
      <View style={st.avatar}><Text style={{ fontSize: 20 }}>🤖</Text></View>
      <View style={{ flex: 1, gap: 2 }}>
        <T bold size={13} color={C.green}>Nobu</T>
        <T size={15}>{text}</T>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  nobu: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
});
