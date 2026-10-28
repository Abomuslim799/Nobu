/**
 * types.ts — darslar qanday tuzilganini TypeScript'ga tushuntiramiz.
 *
 * TypeScript = JavaScript + TURLAR. Tur — "bu qiymat qanday shaklda" degan
 * va'da. Xato shaklda ma'lumot yozsangiz, ilova ishga tushmasdan oldin
 * tahrirlovchi (VS Code) qizil chiziq bilan ko'rsatadi.
 *
 * Bu fayl TypeScript yo'nalishidagi 1-darsda MISOL sifatida ishlatiladi.
 */

// ── 1. Dars qadami: "union" tur ─────────────────────────────────────────────
// `|` — "yoki". Qadam to'rt xil bo'lishi mumkin, har birining o'z maydonlari bor.
// `type` maydoni qaysi biri ekanini aytadi — bunga "discriminated union" deyiladi.
export type Step =
  | { type: 'text'; body: string }
  | {
      type: 'code';
      lang: string;           // 'python' | 'typescript' | 'java' | 'sql'
      project: string;        // qaysi loyihadan: 'Nobu', 'Nobu Dojo'
      file: string;           // fayl yo'li: 'nobu/config.py'
      code: string;
      explain: string;        // shu kod nima qilishi, nega shunday yozilgan
    }
  | { type: 'quiz'; question: string; options: string[]; answer: number; why: string }
  | { type: 'fill'; prompt: string; code: string; answer: string; hint: string };

// ── 2. Dars va yo'nalish ────────────────────────────────────────────────────
export interface Lesson {
  id: string;                 // butun ilova bo'yicha yagona: 'py-dataclass'
  title: string;
  minutes: number;            // taxminiy davomiyligi
  steps: Step[];
}

export interface Track {
  id: string;                 // 'python', 'typescript', 'java', 'sql', 'english'
  title: string;
  icon: string;               // emoji
  color: string;
  about: string;
  lessons: Lesson[];
}
