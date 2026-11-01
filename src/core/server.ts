/**
 * server.ts — Railway serveri bilan yagona aloqa nuqtasi.
 *   Manzil va token telefonda saqlanadi (kodda emas — repo ochiq). Barcha so'rovlar api() orqali:
 *   token, kutish vaqti va xato matnlari bir joyda.
 *   Holat (streak, FR, reja) — widget va kechki Telegram eslatmasi uchun.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { dayKey } from '@/core/date';
import { KEYS } from '@/core/storage';

export const API = '/api/farobiy';

export interface ServerConfig { url: string; token: string }
export interface AppStatus {
  streak: number; best: number; today: boolean;
  fr?: number; rank?: string; muz?: number; state?: string; week?: number; areas?: Record<string, number>;
}
export interface PlanStatus { done: number; total: number; left: string[] }

const clean = (url: string) => url.trim().replace(/\/+$/, '');   // "https://x.app/" → "https://x.app"

export async function getConfig(): Promise<ServerConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.server);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveConfig(cfg: ServerConfig) {
  await AsyncStorage.setItem(KEYS.server, JSON.stringify({ url: clean(cfg.url), token: cfg.token.trim() }));
}

/** So'rov: path — API ichidagi yo'l ('/tutor') yoki to'liq yo'l ('/tts/..'). body bo'lsa POST. */
export async function api<T>(path: string, body?: object, { timeoutMs = 150_000, cfg }: { timeoutMs?: number; cfg?: ServerConfig } = {}): Promise<T> {
  const c = cfg ?? (await getConfig());
  if (!c) throw new Error("Server ulanmagan: Nobu → 🔗 Server bo'limini to'ldiring");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  let r: Response;
  try {
    r = await fetch(`${clean(c.url)}${path.startsWith('/api') ? path : API + path}`, {
      method: body ? 'POST' : 'GET', signal: ctl.signal,
      headers: { Authorization: `Bearer ${c.token.trim()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(ctl.signal.aborted ? "Server juda uzoq javob bermadi — qayta urinib ko'ring" : "Serverga ulanib bo'lmadi (internet?)");
  } finally {
    clearTimeout(t);
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
  return d as T;
}

/** Server manzili + nisbiy fayl yo'li ('/tts/x.mp3') → to'liq URL. */
export async function serverUrl(path: string) {
  const c = await getConfig();
  return c ? `${clean(c.url)}${path}` : null;
}

// ── Holat: widget va kechki eslatma ──────────────────────────────────────────
let last: AppStatus | null = null;
let plan: PlanStatus | null = null;
const send = (st: AppStatus, cfg?: ServerConfig) => api('/status', { ...st, ...(plan ?? {}), day: dayKey() }, { timeoutMs: 15_000, cfg });

/** Ekranni kutdirmaydi. Internet bo'lmasa — keyingi o'zgarishda yana yuboriladi. */
export function pushStatus(st: AppStatus) {
  last = st;
  send(st).catch(() => {});
}

/** Bugungi reja o'zgarganda (Bugun ekrani) — holat bilan birga yuboriladi. */
export function pushPlan(p: PlanStatus) {
  if (plan && JSON.stringify(plan) === JSON.stringify(p)) return;
  plan = p;
  if (last) pushStatus(last);
}

/** "Saqlash va tekshirish": joriy holatni darhol yuboradi, xato bo'lsa sababini qaytaradi. */
export async function testConnection(cfg: ServerConfig): Promise<string> {
  await send(last ?? { streak: 0, best: 0, today: false }, cfg);
  return `streak ${last?.streak ?? 0} yuborildi`;
}
