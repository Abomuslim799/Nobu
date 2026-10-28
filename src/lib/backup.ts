/**
 * backup.ts — barcha natijalarni faylga saqlash va qaytarish.
 * Muhim: hozir ma'lumot faqat telefonda (Expo Go ichida). Expo Go o'chirilsa — yo'qoladi.
 * Shuning uchun vaqti-vaqti bilan zaxira faylini Telegram "Saved Messages" yoki iCloud'ga yuboring.
 */

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { dayKey } from '@/lib/streak';

export async function exportBackup(json: string) {
  const file = new File(Paths.cache, `nobu-zaxira-${dayKey()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Nobu zaxirasi' });
}

/** Fayl tanlatadi va matnini qaytaradi (bekor qilinsa — null). */
export async function pickBackup(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json', '*/*'], copyToCacheDirectory: true });
  if (res.canceled) return null;
  return new File(res.assets[0].uri).text();
}
