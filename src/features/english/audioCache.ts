/**
 * audioCache.ts — ovozlarni telefon xotirasida saqlash (Documents/audio).
 *
 *   • Chalingan har bir ovoz fonda avtomatik saqlanadi — ikkinchi marta internetsiz, darhol chalinadi.
 *   • "Bazani yangilash" (Sozlamalar): serverdagi ro'yxat (AUDIO + manifest.json) bilan telefondagini solishtiradi,
 *     yetishmagan yoki matni o'zgargan fayllarni yuklab oladi.
 *   manifest.json — har fayl qaysi matndan yasalgan (hash); hash o'zgarsa fayl qayta yuklanadi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { AUDIO_BASE } from '@/core/config';
import { AUDIO } from '@/features/english/data/audio';

export type Scope = 'words' | 'examples' | 'all';
export const SCOPES: { id: Scope; label: string; sub: string; avgKB: number }[] = [
  { id: 'words', label: "Faqat so'zlar", sub: "so'z talaffuzi", avgKB: 7 },
  { id: 'examples', label: "So'z + misol gaplar", sub: "takror va o'rganishdagi barcha ovozlar", avgKB: 16 },
  { id: 'all', label: 'Hammasi', sub: 'filmlar matnlari, tarjimalar, darslar ham', avgKB: 20 },
];

const HASHES = 'farobiy.audio.hashes';   // telefondagi fayllar qaysi hash bilan yuklangan (zaxiraga kirmaydi — qurilmaga xos)
const dir = () => {
  const d = new Directory(Paths.document, 'audio');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
};
const name = (id: string, part: string) => `${id}-${part}.mp3`;

/** Telefonda bo'lsa — mahalliy manzil, aks holda null. */
export function localUri(id: string, part: string): string | null {
  try {
    const f = new File(dir(), name(id, part));
    return f.exists && (f.size ?? 0) > 0 ? f.uri : null;
  } catch {
    return null;
  }
}

const inflight = new Set<string>();
/** Chalingan ovozni fonda saqlash (xato bo'lsa — jim). */
export function cacheInBackground(id: string, part: string) {
  const n = name(id, part);
  if (inflight.has(n)) return;
  inflight.add(n);
  File.downloadFileAsync(`${AUDIO_BASE}${n}`, new File(dir(), n), { idempotent: true })
    .catch(() => {})
    .finally(() => inflight.delete(n));
}

/** Qaysi fayllar kerak (tanlangan hajm bo'yicha). */
export function wanted(scope: Scope): string[] {
  const out: string[] = [];
  for (const [id, parts] of Object.entries(AUDIO)) {
    for (const p of parts) {
      const word = p === 'w', ex = p === 's';
      if (scope === 'words' ? word : scope === 'examples' ? word || ex : true) out.push(name(id, p));
    }
  }
  return out;
}

export interface SyncState { total: number; have: number; todo: number; changed: number; failed: number; done: number; running: boolean }

async function serverHashes(): Promise<Record<string, string> | null> {
  try {
    const r = await fetch(`${AUDIO_BASE}manifest.json`, { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** Solishtirish: nechta bor, nechta yetishmaydi, nechtasi eskirgan. */
export async function compare(scope: Scope) {
  const need = wanted(scope);
  const local = new Set(dir().list().filter((x) => x instanceof File && (x.size ?? 0) > 0).map((x) => x.name));
  const server = await serverHashes();
  const mine: Record<string, string> = JSON.parse((await AsyncStorage.getItem(HASHES)) ?? '{}');
  const missing = need.filter((n) => !local.has(n));
  const changed = server ? need.filter((n) => local.has(n) && server[n] && mine[n] && mine[n] !== server[n]) : [];
  return { need, missing, changed, server, mine, online: server !== null };
}

/**
 * Bazani yangilash: yetishmagan va eskirgan fayllarni 4 tadan parallel yuklaydi.
 * onProgress — har faylda; cancel() true qaytarsa to'xtaydi.
 */
export async function syncAudio(scope: Scope, onProgress: (s: SyncState) => void, cancel: () => boolean) {
  const { need, missing, changed, server, mine } = await compare(scope);
  const queue = [...missing, ...changed];
  const st: SyncState = { total: need.length, have: need.length - missing.length, todo: queue.length, changed: changed.length, failed: 0, done: 0, running: true };
  onProgress({ ...st });
  const hashes = { ...mine };
  const d = dir();
  let i = 0;
  const worker = async () => {
    while (i < queue.length && !cancel()) {
      const n = queue[i++];
      try {
        await File.downloadFileAsync(`${AUDIO_BASE}${n}`, new File(d, n), { idempotent: true });
        if (server?.[n]) hashes[n] = server[n];
      } catch {
        st.failed++;
      }
      st.done++;
      if (st.done % 10 === 0 || st.done === queue.length) onProgress({ ...st });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  // Yuklanmay qolgan hash'lar ham yoziladi — keyingi solishtirishda faqat haqiqatan o'zgarganlar chiqadi.
  if (server) for (const n of need) if (!hashes[n] && server[n]) hashes[n] = server[n];
  await AsyncStorage.setItem(HASHES, JSON.stringify(hashes));
  st.running = false;
  onProgress({ ...st });
  return st;
}

/** Telefondagi ovozlar hajmi (MB) va soni. */
export function usage() {
  let bytes = 0, count = 0;
  try {
    for (const x of dir().list()) if (x instanceof File) { bytes += x.size ?? 0; count++; }
  } catch { /* papka yo'q */ }
  return { mb: bytes / 1048576, count };
}

export async function clearAudio() {
  try { dir().delete(); } catch { /* yo'q */ }
  await AsyncStorage.removeItem(HASHES);
}
