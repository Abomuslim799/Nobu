/**
 * sync.ts — Nobu → Railway serveri: faqat widget uchun holat (day streak).
 *
 * Nobu va Kundalik — ikki alohida ilova. Nobu o'z ma'lumotini telefonda
 * saqlaydi; serverga faqat kichik holat yuboriladi: POST /api/nobu/status
 * { streak, best, today }. iPhone'dagi Scriptable widget shuni o'qiydi.
 *
 * Server manzili va token telefonda saqlanadi — kodda emas, chunki repo ochiq.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { FRIENDS } from './edition';
import { dayKey } from './streak';

export interface SyncConfig { url: string; token: string }
export interface NobuStatus { streak: number; best: number; today: boolean }

const CFG_KEY = 'nobu.sync.config';
const clean = (url: string) => url.trim().replace(/\/+$/, '');   // "https://x.app/" → "https://x.app"

// ── 1. Sozlamalar (Statistika ekranidan kiritiladi) ─────────────────────────
export async function getConfig(): Promise<SyncConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CFG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveConfig(cfg: SyncConfig) {
  await AsyncStorage.setItem(CFG_KEY, JSON.stringify({ url: clean(cfg.url), token: cfg.token.trim() }));
}

// ── 2. Holatni yuborish ─────────────────────────────────────────────────────
let last: NobuStatus | null = null;   // ulanish tekshiruvida qayta yuborish uchun
export interface PlanStatus { done: number; total: number; left: string[] }
let plan: PlanStatus | null = null;   // Bugun ekranidagi reja — kechki Telegram eslatmasi uchun

async function post(cfg: SyncConfig, st: NobuStatus) {
  const r = await fetch(`${clean(cfg.url)}/api/nobu/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...st, ...(plan ?? {}), day: dayKey() }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error ?? `HTTP ${r.status}`);
  }
}

/** Ekranni kutdirmaydi. Internet bo'lmasa — keyingi o'zgarishda yana yuboriladi. */
export function pushStatus(st: NobuStatus) {
  last = st;
  if (FRIENDS) return;   // do'stlar versiyasi serverga ulanmaydi
  getConfig().then((cfg) => cfg && post(cfg, st)).catch(() => {});
}

/** Bugungi reja o'zgarganda (Bugun ekrani) — holat bilan birga yuboriladi. */
export function pushPlan(p: PlanStatus) {
  const key = JSON.stringify(p);
  if (plan && JSON.stringify(plan) === key) return;
  plan = p;
  if (last) pushStatus(last);
}

/** "Saqlash va tekshirish": joriy streak'ni darhol yuboradi, xato bo'lsa sababini qaytaradi. */
export async function testConnection(cfg: SyncConfig): Promise<string> {
  await post(cfg, last ?? { streak: 0, best: 0, today: false });
  return `streak ${last?.streak ?? 0} yuborildi`;
}
