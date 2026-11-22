/**
 * content.ts — mavzular kontenti (content/english/drill/*.json). Kontenti yo'q mavzu — "tez orada".
 *   Yangi mavzu qo'shish: JSON fayl + shu ro'yxatga bitta qator.
 */

import presSimpleCont from '@content/english/drill/pres-simple-cont.json';
import pastSimpleCont from '@content/english/drill/past-simple-cont.json';
import presPerfect from '@content/english/drill/pres-perfect.json';
import ppVsPast from '@content/english/drill/pp-vs-past.json';

export interface DrillItem { uz: string; en: string[] }
export interface DrillContent {
  id: string; title: string;
  recall: string;                                    // "o'zing ayt" savoli
  formula: string[];                                 // 1 ekran nazariya (faqat xato bo'lsa yoki so'ralsa)
  pairs: { a: string; b: string; note_uz: string }[]; // qarama-qarshi juftlar
  items: DrillItem[];                                // UZ → EN tarjima
  speak: string[];                                   // o'z hayotingdan gap tuzish topshiriqlari
  film?: { src: string; en: string; note_uz: string }[]; // 🎬 Filmda — film bazasidan 2–3 misol (sahna/iqtibos)
}

const ALL: DrillContent[] = [presSimpleCont, pastSimpleCont, presPerfect, ppVsPast];

export const contentOf = (id: string) => ALL.find((c) => c.id === id);
export const ALL_CONTENT = ALL;
