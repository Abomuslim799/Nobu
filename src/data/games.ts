/**
 * games.ts — miya mashqlari ro'yxati. Har biri game/[id].tsx da o'ynaladi.
 * Hozircha bittasi tayyor; qolganlari "tez orada" bo'lib turadi.
 */

export interface Game {
  id: string;
  title: string;
  icon: string;
  skill: string;        // qaysi qobiliyatni rivojlantiradi
  about: string;
  ready: boolean;
}

export const GAMES: Game[] = [
  { id: 'speed-math', title: 'Tezkor hisob', icon: '⚡', skill: 'Tezlik · diqqat',
    about: "60 soniyada iloji boricha ko'p misol yeching. Xato — 3 soniya jarima.", ready: true },
  { id: 'memory-grid', title: 'Xotira panjarasi', icon: '🧩', skill: 'Ko\'rish xotirasi',
    about: 'Yonib-o\'chgan kataklarni eslab qoling va qaytaring.', ready: false },
  { id: 'stroop', title: 'Rang va so\'z', icon: '🎨', skill: 'Diqqatni boshqarish',
    about: "So'z qaysi rangda yozilganini ayting — so'zning o'zini emas.", ready: false },
  { id: 'n-back', title: 'N-back', icon: '🔁', skill: 'Ishchi xotira',
    about: 'Hozirgi belgi N qadam oldingisi bilan bir xilmi?', ready: false },
];
