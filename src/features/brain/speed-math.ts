/**
 * speed-math.ts — "Tezkor hisob" o'yini uchun misol yasash.
 * Ball oshgani sari sonlar kattalashadi va yangi amallar qo'shiladi.
 * Ekrandan ajratilgan — shuning uchun alohida tekshirish oson.
 */

export interface Problem { text: string; answer: number; options: number[] }

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeProblem(score: number): Problem {
  const level = Math.min(4, Math.floor(score / 5));             // har 5 ballda yangi daraja
  const ops = ['+', '−', '×', '÷'].slice(0, 2 + Math.min(2, level));
  const op = ops[rand(0, ops.length - 1)];
  const top = [9, 20, 50, 99, 199][level];
  let a = rand(2, top);
  let b = rand(2, top);
  let answer: number;
  if (op === '+') {
    answer = a + b;
  } else if (op === '−') {
    if (b > a) [a, b] = [b, a];                                  // manfiy javob bo'lmasin
    answer = a - b;
  } else if (op === '×') {
    a = rand(2, 9 + level * 2);
    b = rand(2, 9);
    answer = a * b;
  } else {
    b = rand(2, 9);
    answer = rand(2, 9 + level * 2);
    a = answer * b;                                              // butun bo'linsin
  }
  // Chalg'ituvchi variantlar: to'g'ri javobga yaqin, takrorlanmas, manfiy emas.
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const wrong = answer + rand(-10, 10);
    if (wrong !== answer && wrong >= 0) options.add(wrong);
  }
  return { text: `${a} ${op} ${b}`, answer, options: [...options].sort(() => Math.random() - 0.5) };
}
