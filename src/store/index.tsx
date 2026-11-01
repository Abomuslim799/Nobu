/**
 * store — ilovaning yagona holati, ikki bo'lakdan:
 *   progress — o'qish: darslar, kunlik faollik, kartochkalar, kitoblar, iqtiboslar;
 *   rating   — natija: FR, darajalar, faol vaqt, XP, streak, muz, testlar (progress'dan eski kunlarni o'qiydi).
 * Ochilishda avval eski xotira kalitlari yangisiga ko'chiriladi (core/storage → migrate), keyin bo'laklar yuklanadi.
 */
import { ReactNode, useEffect, useState } from 'react';

import { migrate } from '@/core/storage';
import { ProgressProvider } from '@/store/progress';
import { RatingProvider } from '@/store/rating';

export { useProgress, READ_MIN } from '@/store/progress';
export type { Book, CustomWord, Quote, ReadingSession } from '@/store/progress';
export { markActive, useRating, STREAK_SEC } from '@/store/rating';
export type { TestItem, TestLog } from '@/store/rating';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { migrate().catch(() => {}).finally(() => setReady(true)); }, []);
  if (!ready) return null;
  return (
    <ProgressProvider>
      <RatingProvider>{children}</RatingProvider>
    </ProgressProvider>
  );
}
