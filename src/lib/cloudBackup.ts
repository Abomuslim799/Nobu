/**
 * cloudBackup.ts — Nobu ma'lumotlarining zaxirasi Railway serverida.
 *   • Kuniga bir marta avtomatik (ilova ochilganda) — barcha AsyncStorage kalitlari.
 *   • "Serverdan tiklash" — oxirgi zaxirani telefonga yozadi va ilovani qayta yuklaydi.
 * Server ulanish sozlamasi (manzil + token) zaxiraga kirmaydi — u telefonda qoladi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';

import { FRIENDS } from './edition';
import { dayKey } from './streak';
import { getConfig } from './sync';

const LAST = 'nobu.backup.last';                 // oxirgi zaxira kuni (zaxiraga kirmaydi)
const SKIP = new Set(['nobu.sync.config', LAST]);

async function call(path: string, init?: RequestInit) {
  const cfg = await getConfig();
  if (!cfg) throw new Error('Avval server manzili va tokenni kiriting');
  const r = await fetch(`${cfg.url}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
  return d;
}

export async function backupNow(force = false): Promise<{ ts: string; size: number; keys: number }> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => !SKIP.has(k));
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, string> = {};
  pairs.forEach(([k, v]) => { if (v != null) data[k] = v; });
  const res = await call('/api/nobu/backup', { method: 'POST', body: JSON.stringify({ data, force }) });
  await AsyncStorage.setItem(LAST, dayKey());
  return res;
}

/** Kuniga bir marta, ekranni kutdirmasdan. Xato bo'lsa — keyingi ochilishda yana urinadi. */
export function autoBackup() {
  if (FRIENDS) return;
  AsyncStorage.getItem(LAST)
    .then((d) => (d === dayKey() ? null : getConfig().then((c) => c && backupNow())))
    .catch(() => {});
}

export async function lastBackup(): Promise<{ ts: string | null; size?: number }> {
  return call('/api/nobu/backup?meta=1');
}

/** Oxirgi zaxirani tiklaydi (telefondagi joriy ma'lumot ustiga yoziladi) va ilovani qayta yuklaydi. */
export async function restoreLatest() {
  const d = await call('/api/nobu/backup');
  if (!d.data) throw new Error("Serverda zaxira yo'q");
  const pairs = Object.entries(d.data as Record<string, string>).filter(([k]) => !SKIP.has(k));
  await AsyncStorage.multiSet(pairs);
  await AsyncStorage.setItem(LAST, dayKey());
  try { await Updates.reloadAsync(); } catch { DevSettings.reload(); }
}
