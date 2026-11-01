/**
 * storage.ts — telefon xotirasi (AsyncStorage): BARCHA kalitlar shu yerda.
 *   Kalitlar "farobiy." bilan boshlanadi. Eski nomlar (dojo., nobu.) ilova ochilganda bir marta ko'chiriladi —
 *   eski zaxiradan tiklanganda ham (zaxira ichida eski nomlar bo'lsa) shu ko'chirish ishlaydi.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { legacyTarget } from './keys';

export { KEYS, LOCAL_ONLY } from './keys';

/** Eski kalitlarni yangisiga ko'chiradi (eski qiymat ustun — u yangiroq zaxiradan kelgan bo'lishi mumkin). */
export async function migrate(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const old = keys.filter((k) => legacyTarget(k));
  if (!old.length) return 0;
  const pairs = await AsyncStorage.multiGet(old);
  await AsyncStorage.multiSet(pairs.filter(([, v]) => v != null).map(([k, v]) => [legacyTarget(k)!, v!]));
  await AsyncStorage.multiRemove(old);
  return old.length;
}

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const writeJSON = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
