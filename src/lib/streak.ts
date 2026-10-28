/**
 * streak.ts — "kun seriyasi" (day streak) hisobi.
 *
 * Har kuni kamida bitta dars yoki mashq qilsangiz — seriya davom etadi.
 * Bir kun o'tkazib yuborsangiz — 0 dan boshlanadi.
 *
 * Kunlar "YYYY-MM-DD" matni sifatida saqlanadi (mahalliy vaqt bo'yicha):
 * solishtirish oson, vaqt zonasi chalkashmaydi.
 * Bu fayl TypeScript yo'nalishidagi 2-darsda misol sifatida ishlatiladi.
 */

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');   // oylar 0 dan sanaladi!
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));             // Date o'zi oy/yilni to'g'rilaydi
}

/** Hozirgi seriya: bugundan (yoki kechadan) orqaga qarab uzluksiz kunlar soni.
 *  Bugun hali hech narsa qilmagan bo'lsangiz ham, kechagi seriya "yonib" turadi. */
export function currentStreak(activeDays: Set<string>, today: string = dayKey()): number {
  let day = activeDays.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (activeDays.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

/** Eng uzun seriya — tarix bo'yicha. */
export function bestStreak(activeDays: Set<string>): number {
  let best = 0;
  for (const day of activeDays) {
    if (activeDays.has(addDays(day, -1))) continue;         // seriya boshi emas — o'tkazamiz
    let length = 1;
    while (activeDays.has(addDays(day, length))) length += 1;
    best = Math.max(best, length);
  }
  return best;
}

/** Oxirgi n kun (eskisidan yangisiga) — haftalik nuqtalar va grafik uchun. */
export function lastDays(n: number, today: string = dayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}
