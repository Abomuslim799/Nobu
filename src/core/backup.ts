/**
 * backup.ts — zaxira. Ikki yo'l:
 *   • Server (Railway): kuniga bir marta avtomatik, barcha xotira kalitlari; "Serverdan tiklash".
 *   • Fayl: JSON faylni ulashish (Telegram, iCloud) va fayldan tiklash.
 * Qurilmaga xos kalitlar (server manzili, oxirgi zaxira kuni) zaxiraga kirmaydi.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';

import { dayKey } from '@/core/date';
import { api, getConfig } from '@/core/server';
import { KEYS, LOCAL_ONLY } from '@/core/storage';

// ── Server ──────────────────────────────────────────────────────────────────
export async function backupNow(force = false): Promise<{ ts: string; size: number; keys: number }> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => !LOCAL_ONLY.has(k));
  const data: Record<string, string> = {};
  (await AsyncStorage.multiGet(keys)).forEach(([k, v]) => { if (v != null) data[k] = v; });
  const res = await api<{ ts: string; size: number; keys: number }>('/backup', { data, force });
  await AsyncStorage.setItem(KEYS.backupLast, dayKey());
  return res;
}

/** Kuniga bir marta (ilova ochilganda). Server sozlanmagan bo'lsa — jim. */
export function autoBackup() {
  AsyncStorage.getItem(KEYS.backupLast)
    .then((d) => (d === dayKey() ? null : getConfig().then((c) => c && backupNow())))
    .catch(() => {});
}

export const lastBackup = () => api<{ ts: string | null; size?: number }>('/backup?meta=1');

export async function restoreLatest() {
  const d = await api<{ data?: Record<string, string> }>('/backup');
  if (!d.data) throw new Error("Serverda zaxira yo'q");
  await AsyncStorage.multiSet(Object.entries(d.data).filter(([k]) => !LOCAL_ONLY.has(k)));
  await AsyncStorage.setItem(KEYS.backupLast, dayKey());
  try { await Updates.reloadAsync(); } catch { DevSettings.reload(); }   // ochilishda eski kalitlar ko'chiriladi
}

// ── Fayl ────────────────────────────────────────────────────────────────────
export async function exportBackup(json: string) {
  const file = new File(Paths.cache, `farobiy-zaxira-${dayKey()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Farobiy zaxirasi' });
}

export async function pickBackup(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json', '*/*'], copyToCacheDirectory: true });
  if (res.canceled) return null;
  return new File(res.assets[0].uri).text();
}
