/** Kutubxona ma'lumot turlari (holat store/progress'da saqlanadi). */

export interface Book {
  id: string; title: string; author: string; lang: 'uz' | 'en' | 'ru';
  pages?: number;            // jami sahifa (bo'lmasa — foizda kuzatiladi)
  progress: number;          // 0..1 — qayergacha o'qildi
  cover?: string;            // muqova surati (telefondagi fayl)
  summary?: string;          // umumiy xulosa (o'zingiz yozasiz)
  finished?: boolean;
  created: number;
}
export interface ReadingSession {
  id: string; bookId: string; day: string; start: number;
  minutes: number; note: string; upto?: string;   // "120-bet" yoki "45%"
}
export interface Quote {
  id: string; text: string; author: string; bookId?: string;
  tags: string[]; fav: boolean; created: number;
}
/** Hozir o'qilayotgan kitob (Mutolaa'ga o'tib ketganda ham vaqt yo'qolmasin). */
export interface ActiveRead { bookId: string; start: number }
