/**
 * nobu.tsx — kim gapiryapti: Nobu (shaxsiy yordamchi — statistika, tahlil) yoki Ustoz Farobiy (darslar).
 *   Ustoz — rasm (assets/images/ustoz): kitob (tinch), oyla (o'ylayapti), tushuntir (tushuntiryapti).
 *   Nobu — girih yulduzi belgisi.
 */

import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';

const USTOZ = {
  kitob: require('@/assets/images/ustoz/kitob.png'),
  oyla: require('@/assets/images/ustoz/oyla.png'),
  tushuntir: require('@/assets/images/ustoz/tushuntir.png'),
};
export type UstozPose = keyof typeof USTOZ;
export type Who = 'nobu' | 'ustoz';

/** 8 qirrali girih yulduzi — Nobu belgisi. */
function NobuMark({ size = 20, color = C.green }: { size?: number; color?: string }) {
  const p: string[] = [];
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2, r = i % 2 ? 7.2 : 10; p.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`); }
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Polygon points={p.join(' ')} fill={color} /></Svg>;
}

/** Dumaloq avatar: Ustozning yuzi yoki Nobu belgisi. */
export function Avatar({ who, pose = 'kitob', size = 38 }: { who: Who; pose?: UstozPose; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: who === 'ustoz' ? C.surface2 : C.greenSoft,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: who === 'ustoz' ? C.goldSoft : C.cardBorder }}>
      {who === 'ustoz'
        ? <Image source={USTOZ[pose]} style={{ width: size * 1.7, height: size * 2.25, marginTop: size * 1.05 }} contentFit="contain" contentPosition="top" />
        : <NobuMark size={size * 0.6} />}
    </View>
  );
}

/** Gapirayotgan blok (dars matni, suhbat javobi). */
export function NobuSays({ text, who = 'nobu', pose = 'tushuntir' }: { text: string; who?: Who; pose?: UstozPose }) {
  return (
    <View style={[st.box, who === 'ustoz' && { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <Avatar who={who} pose={pose} />
      <View style={{ flex: 1, gap: 2 }}>
        <T bold size={13} color={who === 'ustoz' ? C.gold : C.green}>{who === 'ustoz' ? 'Ustoz Farobiy' : 'Nobu'}</T>
        <T size={15}>{text}</T>
      </View>
    </View>
  );
}

/** Katta Ustoz rasmi (natija ekrani, dars boshi). */
export function UstozPicture({ pose = 'kitob', height = 160 }: { pose?: UstozPose; height?: number }) {
  return <Image source={USTOZ[pose]} style={{ height, width: height * 0.8 }} contentFit="contain" />;
}

const st = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.cardBorder },
});
