/**
 * elo.ts — shaxmat reytingi formulasi: FR va shaxmat masalalari reytingi uchun umumiy.
 *   expected — reyting r bo'lgan o'yinchi qiyinligi d bo'lgan savolni yechish ehtimoli.
 */
export const expected = (r: number, d: number) => 1 / (1 + 10 ** ((d - r) / 400));

/** Yangi reyting: s — natija 0…1, k — o'zgarish kuchi. */
export const eloStep = (r: number, d: number, s: number, k: number) => r + k * (s - expected(r, d));
