/**
 * activity.ts — faol vaqt belgisi. Ildiz View har teginishda, dars ovozi chalinayotganda markActive() chaqiriladi;
 * store/rating har 10 s da tekshiradi: oxirgi faollikdan 60 s o'tmagan bo'lsa — vaqt hisoblanadi (XP, streak).
 */
import { Platform } from 'react-native';

let lastActive = Date.now();
export const markActive = () => { lastActive = Date.now(); };
export const idleFor = () => Date.now() - lastActive;

// Brauzerda (kompyuter) — sichqoncha, klaviatura va g'ildirak ham faollik
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown', 'wheel']) document.addEventListener(ev, markActive, { passive: true, capture: true });
}
