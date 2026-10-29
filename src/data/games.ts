/**
 * games.ts — Miya o'yinlari ro'yxati. Har biri game/[id].tsx da o'ynaladi (komponentlar: src/games/).
 * skill — qaysi ko'nikmaga yoziladi (statistika va AI tahlil shu bo'yicha).
 */

import type { BrainSkill } from '@/lib/brain';

export interface Game {
  id: string;
  title: string;
  icon: string;
  skill: BrainSkill;
  about: string;
  ai?: boolean;         // server (AI) kerak
}

export const GAMES: Game[] = [
  { id: 'chess', title: 'Shaxmat masalalari', icon: '♟️', skill: 'chess',
    about: "Lichess'ning haqiqiy masalalari, reytingingizga mos. Xato bo'lsa — AI nega ekanini tushuntiradi." },
  { id: 'sequence', title: 'Ketma-ketlik', icon: '🔢', skill: 'logic', about: 'Qonuniyatni toping: keyingi son qaysi?' },
  { id: 'sudoku', title: 'Sudoku', icon: '🔲', skill: 'logic', about: '4×4 dan boshlanadi, darajaga qarab 6×6.' },
  { id: 'logic-ai', title: 'Mantiqiy masalalar', icon: '🧩', skill: 'logic', ai: true,
    about: 'AI har safar yangi masala tuzadi: kim qayerda, rost/yolg\'on, sillogizm...' },
  { id: 'memory-grid', title: 'Xotira panjarasi', icon: '🧠', skill: 'memory', about: "Yonib-o'chgan kataklarni eslab qoling va bosing." },
  { id: 'n-back', title: 'N-back', icon: '🔁', skill: 'working', about: 'Harf N qadam oldingisi bilan bir xilmi? 1-back → 4-back.' },
  { id: 'stroop', title: 'Rang va so\'z', icon: '🎨', skill: 'attention', about: "So'z qaysi rangda yozilganini tanlang — ma'nosini emas." },
  { id: 'speed-math', title: 'Tezkor hisob', icon: '⚡', skill: 'speed', about: '60 soniya. Xato — 3 soniya jarima.' },
  { id: 'reaction', title: 'Reaksiya', icon: '🚦', skill: 'speed', about: 'Ekran yashil bo\'lishi bilan bosing. 5 urinish.' },
];
