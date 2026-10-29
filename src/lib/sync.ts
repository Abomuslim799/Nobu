/**
 * sync.ts — Nobu ilovasi → kundalik tracker (Railway serveri) bog'lanishi.
 *
 * Ilovada nimadir bajarilganda (unit qadami, IT darsi, kartalar, kitob)
 * serverga kichik "hodisa" yuboriladi: POST /api/nobu. Server bugungi
 * vazifani o'zi ✓ qiladi — trackerda qo'lda belgilash kerak emas.
 *
 * Internet bo'lmasa hodisa navbatga (queue) yoziladi va keyingi safar
 * yuboriladi. Server manzili va token telefonda saqlanadi — kodda emas,
 * chunki repo ochiq (public).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { FRIENDS } from './edition';
import { dayKey } from './streak';

// ── 1. Turlar ───────────────────────────────────────────────────────────────
export type SyncEvent =
  | { type: 'english'; title?: string }          // ingliz tili qadami
  | { type: 'it'; title?: string }               // IT darsi (95%+ bilan)
  | { type: 'cards' }                            // kunlik kartalar takrori
  | { type: 'reading'; minutes: number; title?: string };   // kitob daqiqalari

export interface SyncConfig { url: string; token: string }
type Queued = SyncEvent & { day: string };

const CFG_KEY = 'nobu.sync.config';
const QUEUE_KEY = 'nobu.sync.queue';

// ── 2. Sozlamalar (Statistika ekranidan kiritiladi) ─────────────────────────
export async function getConfig(): Promise<SyncConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CFG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveConfig(cfg: SyncConfig | null) {
  if (!cfg) return AsyncStorage.removeItem(CFG_KEY);
  // Oxiridagi "/" ni olib tashlaymiz: "https://x.app/" → "https://x.app"
  await AsyncStorage.setItem(CFG_KEY, JSON.stringify({ url: cfg.url.trim().replace(/\/+$/, ''), token: cfg.token.trim() }));
}

/** Ulanishni tekshirish: server javob bersa bugungi "done/total" qaytadi. */
export async function testConnection(cfg: SyncConfig): Promise<string> {
  const r = await fetch(`${cfg.url.trim().replace(/\/+$/, '')}/api/widget`, {
    headers: { Authorization: `Bearer ${cfg.token.trim()}` },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
  return `${d.weekday}: ${d.done}/${d.total} bajarildi`;
}

// ── 3. Navbat ───────────────────────────────────────────────────────────────
async function readQueue(): Promise<Queued[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]');
  } catch {
    return [];
  }
}

async function post(cfg: SyncConfig, e: Queued): Promise<boolean> {
  try {
    const r = await fetch(`${cfg.url}/api/nobu`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    });
    // 4xx — server rad etdi (masalan, eski kun): qayta yuborishdan foyda yo'q
    return r.ok || (r.status >= 400 && r.status < 500);
  } catch {
    return false;   // internet yo'q — navbatda qoladi
  }
}

let flushing = false;

/** Navbatdagi barcha hodisalarni yuborishga urinadi. */
export async function flush() {
  if (FRIENDS || flushing) return;
  const cfg = await getConfig();
  if (!cfg) return;
  flushing = true;
  try {
    const queue = await readQueue();
    const left: Queued[] = [];
    for (const e of queue) {
      if (!(await post(cfg, e))) left.push(e);
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(left.slice(-100)));
  } finally {
    flushing = false;
  }
}

// ── 4. Asosiy funksiya: hodisa yuborish ─────────────────────────────────────
/** Ekranlarni kutdirmaydi: navbatga yozadi va fonda yuboradi. */
export function report(e: SyncEvent) {
  if (FRIENDS) return;   // do'stlar versiyasi trackerga ulanmaydi
  (async () => {
    const queue = await readQueue();
    queue.push({ ...e, day: dayKey() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100)));
    await flush();
  })().catch(() => {});
}
