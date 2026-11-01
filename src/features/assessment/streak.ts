/**
 * streak.ts — kun seriyasi. activeDays — streak hisoblanadigan kunlar (≥ 5 daqiqa faol yoki muz).
 * Bugun hali ishlanmagan bo'lsa ham, kechagi seriya "yonib" turadi.
 */
import { addDays, dayKey } from '@/core/date';

export function currentStreak(activeDays: Set<string>, today: string = dayKey()): number {
  let day = activeDays.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (activeDays.has(day)) { count += 1; day = addDays(day, -1); }
  return count;
}

export function bestStreak(activeDays: Set<string>): number {
  let best = 0;
  for (const day of activeDays) {
    if (activeDays.has(addDays(day, -1))) continue;         // seriya boshi emas
    let length = 1;
    while (activeDays.has(addDays(day, length))) length += 1;
    best = Math.max(best, length);
  }
  return best;
}
