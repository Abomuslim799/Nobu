/**
 * date.ts — kunlar "YYYY-MM-DD" matni sifatida (mahalliy vaqt): solishtirish oson, vaqt zonasi chalkashmaydi.
 */

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');   // oylar 0 dan sanaladi
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));             // Date o'zi oy/yilni to'g'rilaydi
}

/** Oxirgi n kun (eskisidan yangisiga). */
export function lastDays(n: number, today: string = dayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

/** "1 soat 25 daq" */
export function fmtDur(sec: number) {
  const mnt = Math.floor(sec / 60), h = Math.floor(mnt / 60);
  return h ? `${h} soat ${mnt % 60} daq` : `${mnt} daq`;
}
