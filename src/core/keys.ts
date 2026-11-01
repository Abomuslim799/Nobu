/**
 * keys.ts — telefon xotirasi kalitlari va eski nomlardan ko'chirish qoidasi (sof, testlanadi).
 */

export const KEYS = {
  progress: 'farobiy.progress.v1',      // darslar, kunlar, kartochkalar, kitoblar, iqtiboslar
  rating: 'farobiy.rating.v1',          // FR, darajalar, faol vaqt, XP, streak, muz, testlar
  brainLog: 'farobiy.brain.log.v1',
  brainLevels: 'farobiy.brain.levels.v1',
  chess: 'farobiy.brain.chess.v1',
  scienceLog: 'farobiy.science.v1',
  skills: 'farobiy.skills.v1',          // ingliz tili ko'nikmalar jurnali
  tts: 'farobiy.tts.v1',                // Ustoz ovozi manzillari keshi
  autoread: 'farobiy.sci.autoread',
  speakRate: 'farobiy.speak.rate',
  server: 'farobiy.server',             // server manzili va token (zaxiraga kirmaydi)
  backupLast: 'farobiy.backup.last',    // oxirgi zaxira kuni (zaxiraga kirmaydi)
  sciPos: (lesson: string) => `farobiy.sci.pos.${lesson}`,
  writing: (unit: string) => `farobiy.writing.${unit}`,
} as const;

/** Zaxiraga kirmaydigan kalitlar (qurilmaga xos). */
export const LOCAL_ONLY = new Set<string>([KEYS.server, KEYS.backupLast]);

const RENAMED: Record<string, string> = {
  'dojo.progress.v1': KEYS.progress,
  'nobu.meta.v1': KEYS.rating,
  'dojo.rate': KEYS.speakRate,
  'nobu.sync.config': KEYS.server,
};
/** Eski kalit → yangi kalit (yoki null — eski emas). */
export function legacyTarget(key: string): string | null {
  if (key in RENAMED) return RENAMED[key];
  if (key.startsWith('nobu.') || key.startsWith('dojo.')) return `farobiy.${key.slice(key.indexOf('.') + 1)}`;
  return null;
}
