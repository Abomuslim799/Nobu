/**
 * edition.ts — ilovaning qaysi versiyasi.
 *   full    — sizning to'liq versiyangiz (Expo Go)
 *   friends — do'stlar uchun sayt: faqat Ingliz tili + Miya (+ Bugun, Statistika)
 * GitHub saytni yasayotganda EXPO_PUBLIC_EDITION=friends beradi.
 */
import { Platform } from 'react-native';

export const FRIENDS = process.env.EXPO_PUBLIC_EDITION === 'friends';
export const IS_WEB = Platform.OS === 'web';
