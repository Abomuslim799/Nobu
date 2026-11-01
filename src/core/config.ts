/**
 * config.ts — ilova bo'ylab o'zgarmas sozlamalar.
 *   VERSION   — GitHub har nashrda beradi (publish.yml → EXPO_PUBLIC_VERSION); kompyuterda "dev".
 *   SITE_BASE — GitHub Pages: tayyor mp3 ovozlar (Sardor, Ryan) va say.json.
 */
export const APP_NAME = 'Farobiy';
export const VERSION = process.env.EXPO_PUBLIC_VERSION ?? 'dev';
export const SITE_BASE = 'https://abomuslim799.github.io/Nobu/';   // repo Farobiy deb nomlangach — /Farobiy/
export const AUDIO_BASE = `${SITE_BASE}audio/`;
