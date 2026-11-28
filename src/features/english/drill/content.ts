/**
 * content.ts — mavzular kontenti (content/english/drill/*.json). Kontenti yo'q mavzu — "tez orada".
 *   Yangi mavzu qo'shish: JSON fayl + shu ro'yxatga bitta qator.
 */

import articles from '@content/english/drill/articles.json';
import canCould from '@content/english/drill/can-could.json';
import cleft from '@content/english/drill/cleft.json';
import cond02 from '@content/english/drill/cond-0-2.json';
import cond3Mixed from '@content/english/drill/cond-3-mixed.json';
import futureContPerf from '@content/english/drill/future-cont-perf.json';
import futureForms from '@content/english/drill/future-forms.json';
import haveDone from '@content/english/drill/have-done.json';
import hedging from '@content/english/drill/hedging.json';
import ingTo from '@content/english/drill/ing-to.json';
import inversion from '@content/english/drill/inversion.json';
import mayMight from '@content/english/drill/may-might.json';
import mustShould from '@content/english/drill/must-should.json';
import passive from '@content/english/drill/passive.json';
import pastPerfect from '@content/english/drill/past-perfect.json';
import pastSimpleCont from '@content/english/drill/past-simple-cont.json';
import perfectModals from '@content/english/drill/perfect-modals.json';
import ppVsPast from '@content/english/drill/pp-vs-past.json';
import presPerfect from '@content/english/drill/pres-perfect.json';
import presSimpleCont from '@content/english/drill/pres-simple-cont.json';
import questions from '@content/english/drill/questions.json';
import relative from '@content/english/drill/relative.json';
import reported from '@content/english/drill/reported.json';
import usedTo from '@content/english/drill/used-to.json';
import wish from '@content/english/drill/wish.json';

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

const ALL: DrillContent[] = [
  articles, canCould, cleft, cond02, cond3Mixed, futureContPerf, futureForms, haveDone, hedging, ingTo, inversion, mayMight, mustShould, passive, pastPerfect, pastSimpleCont, perfectModals, ppVsPast, presPerfect, presSimpleCont, questions, relative, reported, usedTo, wish,
];

export const contentOf = (id: string) => ALL.find((c) => c.id === id);
export const ALL_CONTENT = ALL;
