/**
 * srs.ts — so'z takrorlash algoritmi (sof funksiyalar, tests/run.ts da tekshiriladi).
 *
 *   Status: hard / normal / easy — javobning to'g'riligi va tezligidan avtomatik.
 *     xato                    → hard
 *     to'g'ri + tez           → hard→normal; normal→easy (oxirgi takrordan ≥ 1 kun o'tgan bo'lsa)
 *     to'g'ri + sekin         → hard qoladi, normal qoladi, easy→normal
 *     easy 30 kundan ko'p     → normal (material doim ko'p bo'lsin)
 *   Navbat: ball = oxirgi takrordan o'tgan soat × og'irlik (hard 6, normal 2, easy 0.5).
 *   Kutish: bir so'z ketma-ket qaytmasin — hard 3 daq, normal 4 soat, easy 2 kun.
 *   Kunlik reja: yangi so'z kvotasi (kafolatlangan, qarz ko'rinadi) + takror kamida 30, chegarasi yo'q.
 */

export type Kind = 'word' | 'colloc';
export type Status = 'hard' | 'normal' | 'easy';

export interface ItemState {
  st: Status;
  last: number;        // oxirgi takror (ms)
  easySince?: number;  // easy bo'lgan payt
  learnedAt: number;   // birinchi o'rganilgan payt
  seen: number;
  right: number;
}

const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;

export const WEIGHT: Record<Status, number> = { hard: 6, normal: 2, easy: 0.5 };
export const COOLDOWN: Record<Status, number> = { hard: 3 * MIN, normal: 4 * HOUR, easy: 2 * DAY };
export const EASY_DECAY = 30 * DAY;
export const FAST_SEC = 4;
export const QUOTA: Record<Kind, number> = { word: 30, colloc: 10 };
export const REVIEW_MIN = 30;

export const STATUS_UI: Record<Status, { label: string; color: string }> = {
  hard: { label: 'Hard', color: '#F87171' },
  normal: { label: 'Normal', color: '#FBBF24' },
  easy: { label: 'Easy', color: '#34D399' },
};

/** Easy 30 kundan ko'p tursa — normal. */
export function decay(s: ItemState, now = Date.now()): ItemState {
  if (s.st === 'easy' && now - (s.easySince ?? s.last) > EASY_DECAY) return { ...s, st: 'normal', easySince: undefined };
  return s;
}

/** Yangi o'rganilgan so'z — hard dan boshlaydi. */
export const learned = (now = Date.now()): ItemState => ({ st: 'hard', last: now, learnedAt: now, seen: 1, right: 0 });

/** Takror javobi → yangi holat. fastSec — savol turiga qarab (ovozli savolga qo'shimcha vaqt). */
export function grade(prev: ItemState, right: boolean, sec: number, now = Date.now(), fastSec = FAST_SEC): ItemState {
  const s = decay(prev, now);
  const base = { ...s, last: now, seen: s.seen + 1, right: s.right + (right ? 1 : 0) };
  if (!right) return { ...base, st: 'hard', easySince: undefined };
  const fast = sec <= fastSec;
  if (s.st === 'hard') return fast ? { ...base, st: 'normal' } : base;
  if (s.st === 'normal') return fast && now - s.last >= DAY ? { ...base, st: 'easy', easySince: now } : base;
  return fast ? base : { ...base, st: 'normal', easySince: undefined };   // easy
}

/** Takror navbati: kutish vaqti o'tganlar, ball bo'yicha kamayish tartibida. */
export function reviewOrder(states: Record<string, ItemState>, ids: string[], now = Date.now(), skip?: string): string[] {
  return ids
    .filter((id) => states[id] && id !== skip)
    .map((id) => {
      const s = decay(states[id], now);
      const age = now - s.last;
      return { id, ok: age >= COOLDOWN[s.st], score: (age / HOUR) * WEIGHT[s.st] };
    })
    .filter((x) => x.ok)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);
}

/** Keyingi so'z qachon takrorga tayyor bo'ladi (ms) — navbat bo'sh bo'lsa ko'rsatish uchun. */
export function nextReadyIn(states: Record<string, ItemState>, ids: string[], now = Date.now()): number | null {
  let best: number | null = null;
  for (const id of ids) {
    const s = states[id];
    if (!s) continue;
    const d = decay(s, now);
    const wait = d.last + COOLDOWN[d.st] - now;
    if (best === null || wait < best) best = wait;
  }
  return best === null ? null : Math.max(0, best);
}

/** Kunlar farqi (YYYY-MM-DD). */
export function daysBetween(a: string, b: string) {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY);
}

/**
 * Yangi so'z rejasi: start kunidan bugungacha kvota × kunlar − shu davrda o'rganilganlar.
 * today — bugun o'rganish kerak (qarz bilan), debt — kechagi kunlardan qolgani.
 */
export function newPlan(kind: Kind, start: string, today: string, learnedSinceStart: number, learnedToday: number) {
  const days = daysBetween(start, today) + 1;
  const owed = QUOTA[kind] * days - learnedSinceStart;          // hali o'rganilishi kerak
  const debt = Math.max(0, QUOTA[kind] * (days - 1) - (learnedSinceStart - learnedToday));
  return { left: Math.max(0, owed), debt, doneToday: learnedToday, quota: QUOTA[kind] };
}

/** Eski Leitner qutilari → status (0–1 → hard, 2–3 → normal, 4 → easy). */
export function fromBox(box: number, due: number, now = Date.now()): ItemState {
  const st: Status = box >= 4 ? 'easy' : box >= 2 ? 'normal' : 'hard';
  const last = Math.min(now, due - [10 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY][Math.min(box, 4)]);
  return { st, last, learnedAt: 0, seen: box + 1, right: box, ...(st === 'easy' ? { easySince: now } : {}) };
}
