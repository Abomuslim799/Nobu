/**
 * topics.ts — 6 oylik grammar rejasi: 25 mavzu, haftalik sikl (har hafta hammasi), kunlik 3 blok.
 *   Manba: Murphy — English Grammar in Use (EGU) va Advanced Grammar in Use (AGU).
 *   Reja hujjati: Project → claude/english-6-oylik-reja.md
 */

export interface DrillTopic {
  id: string;
  title: string;
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;   // haftaning kuni (1 = dushanba)
  block: 1 | 2;                     // B1 yoki B2 (B3 — har kuni mistake bank + collocation)
  min: number;                      // asosiy vaqt (daqiqa), holatga qarab o'zgaradi
  murphy: string;                   // qaysi unitlar
  speak?: number;                   // blokdagi qo'shimcha speaking (daqiqa)
}

export const TOPICS: DrillTopic[] = [
  { id: 'pres-simple-cont', title: 'Present simple / continuous', day: 1, block: 1, min: 8, murphy: 'EGU 1–4' },
  { id: 'past-simple-cont', title: 'Past simple / continuous', day: 1, block: 1, min: 8, murphy: 'EGU 5–6' },
  { id: 'pres-perfect', title: 'Present perfect simple / continuous', day: 1, block: 2, min: 12, murphy: 'EGU 7–12' },
  { id: 'pp-vs-past', title: 'Present perfect vs Past simple', day: 1, block: 2, min: 10, murphy: 'EGU 13–14' },

  { id: 'past-perfect', title: 'Past perfect simple / continuous', day: 2, block: 1, min: 10, murphy: 'EGU 15–16' },
  { id: 'used-to', title: 'used to / would', day: 2, block: 1, min: 6, murphy: 'EGU 18, AGU' },
  { id: 'future-forms', title: 'Future: will / going to / present cont.', day: 2, block: 2, min: 10, murphy: 'EGU 19–23' },
  { id: 'future-cont-perf', title: 'Future continuous / perfect', day: 2, block: 2, min: 8, murphy: 'EGU 24–25' },

  { id: 'can-could', title: 'can / could / be able to', day: 3, block: 1, min: 6, murphy: 'EGU 26' },
  { id: 'must-should', title: 'must / have to / should', day: 3, block: 1, min: 8, murphy: 'EGU 31–35' },
  { id: 'may-might', title: 'may / might / could — taxmin', day: 3, block: 1, min: 8, murphy: 'EGU 29–30' },
  { id: 'perfect-modals', title: 'should / would / could / must have', day: 3, block: 2, min: 12, murphy: 'EGU 27–28, AGU', speak: 8 },

  { id: 'cond-0-2', title: 'Conditionals 0–2', day: 4, block: 1, min: 10, murphy: 'EGU 38–39' },
  { id: 'cond-3-mixed', title: '3rd + mixed conditionals', day: 4, block: 1, min: 10, murphy: 'EGU 40, AGU' },
  { id: 'wish', title: "wish / if only / I'd rather / it's time", day: 4, block: 2, min: 10, murphy: 'EGU 41, AGU', speak: 10 },

  { id: 'passive', title: 'Passive — barcha zamonlarda', day: 5, block: 1, min: 10, murphy: 'EGU 42–44' },
  { id: 'have-done', title: 'have sth done / it is said', day: 5, block: 1, min: 6, murphy: 'EGU 45–46' },
  { id: 'reported', title: 'Reported speech', day: 5, block: 2, min: 10, murphy: 'EGU 47–48' },
  { id: 'questions', title: 'Indirect questions + tags', day: 5, block: 2, min: 8, murphy: 'EGU 49–52' },

  { id: 'ing-to', title: '-ing vs to', day: 6, block: 1, min: 12, murphy: 'EGU 53–66' },
  { id: 'articles', title: 'Articles', day: 6, block: 1, min: 8, murphy: 'EGU 69–81' },
  { id: 'relative', title: 'Relative clauses', day: 6, block: 2, min: 10, murphy: 'EGU 92–97', speak: 10 },

  { id: 'inversion', title: 'Inversion', day: 7, block: 1, min: 8, murphy: 'AGU' },
  { id: 'cleft', title: 'Cleft + emphasis', day: 7, block: 1, min: 8, murphy: 'AGU' },
  { id: 'hedging', title: 'Hedging + discourse markers', day: 7, block: 2, min: 10, murphy: 'AGU', speak: 10 },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

/** Reja boshlanishi (dushanba) va davomiyligi. */
export const START = '2026-11-23';
export const WEEKS = 24;

/** 6 oylik spiral: mavzular bir xil, qiyinlik oshadi. limit — bitta gapga soniya. */
export const PHASES = [
  { from: 1, to: 4, name: 'Asos', limit: 25, about: 'Murphy intermediate, oddiy gaplar' },
  { from: 5, to: 12, name: 'Ishlatish', limit: 18, about: 'Uzun gaplar, zamonlar aralash' },
  { from: 13, to: 20, name: 'Advanced', limit: 15, about: 'Nozik farqlar, xato topish' },
  { from: 21, to: 24, name: 'Fluency', limit: 12, about: "To'xtamay gapirish, yakuniy imtihon" },
] as const;
