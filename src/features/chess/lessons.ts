/**
 * lessons.ts — debyut darslari: repertuar (~1000 reyting uchun asosiy variantlar), har muhim yurishga 1 qator g'oya,
 * reja va tipik xatolar. Mashq (yoddan yurish), takrorlash (Leitner qutilari) va o'yinlaringizda nazariyadan chiqish joyi.
 * Variantlar SAN da yozilgan, yuklanganda uci ga o'giriladi (testda hammasi qonuniyligi tekshiriladi).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chess } from 'chess.js';

import { KEYS } from '@/core/keys';
import type { ComGame } from '@/features/chess/chesscom';

interface RawLine { name: string; san: string; notes: Record<number, string> }   // notes: yurish raqami (1 dan, ply) → g'oya
interface RawLesson { id: string; name: string; color: 'w' | 'b'; key: number; about: string; plan: string[]; traps: string[]; lines: RawLine[] }

export interface Line { name: string; san: string[]; uci: string[]; notes: Record<number, string> }
export interface Lesson extends Omit<RawLesson, 'lines'> { lines: Line[] }

const RAW: RawLesson[] = [
  {
    id: 'italian', name: 'Italyan partiyasi', color: 'w', key: 5,
    about: "1.e4 e5 2.Nf3 Nc6 3.Bc4 — fil f7 ga qaraydi (qoralarning eng zaif nuqtasi). Shoshilmasdan rivojlanish, c3 + d4 yoki d3 bilan mustahkam markaz.",
    plan: ["Tez rivojlaning va rokirovka qiling — keyin markaz.", "c3 → d4 tayyorlang; d3 bilan esa e4 ni mustahkam ushlang.", "Manevr: Nbd2 → f1 → g3 — ot shoh qanotiga hujumga boradi."],
    traps: ["Ng5 bilan erta hujum (Fried Liver) faqat qoralar 4...Nf6 dan keyin d5 ni noto'g'ri olsa ishlaydi — har doim emas.", "h3 siz Bg4 bog'lashi otingizni bog'lab qo'yadi."],
    lines: [
      { name: 'Giuoco Pianissimo (3...Bc5)', san: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 h3', notes: {
        1: 'Markazni egallaydi, fil va farzinga yo\'l ochadi.', 3: 'e5 ga hujum va rivojlanish.', 5: "f7 — faqat shoh himoya qiladigan nuqta.",
        7: 'd4 ga tayyorgarlik (fil c5 ni yopish).', 9: "Sekin, lekin mustahkam: e4 himoyalangan.", 11: 'Shoh xavfsiz, ruk markazga yaqin.',
        13: 'Ruk e4 ni qo\'llab-quvvatlaydi, keyin d4.', 15: 'Filni ...d5 va ...Na5 dan oldindan qochiradi.', 17: '...Bg4 bog\'lashini to\'xtatadi.' } },
      { name: 'Ikki ot (3...Nf6)', san: 'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3', notes: {
        6: "Qoralar e4 ga hujum qiladi.", 7: 'Xavfsiz yo\'l: e4 himoyalandi, Ng5 avantyurasi shart emas.', 9: 'Rokirovka — keyin markaz.',
        11: 'e4 yana mustahkam.', 13: 'd4 va Nbd2-f1-g3 rejasiga tayyor.' } },
    ],
  },
  {
    id: 'austrian', name: 'Pirk: Avstriya hujumi', color: 'w', key: 2,
    about: "1.e4 d6 (Pirk) ga qarshi 4.f4 — markazni uchta piyoda bilan egallaysiz va e5 bilan otni haydashga tayyor turasiz.",
    plan: ["e4-d4-f4 markaz — e5 surilsa qoralar oti joyidan qochadi.", "Shoh tomonga rokirovka, keyin f5 yoki e5 bilan hujum.", "Markaz piyodalarini himoyasiz qoldirmang: c5 zarbasiga d5 yoki dxc5 bilan javob."],
    traps: ["f4 dan keyin g1–a7 diagonali ochiq: shohni tez rokirovka qiling.", "Juda erta e5 — piyodalar ortiqcha cho'zilib qoladi; avval Nf3 va Bd3."],
    lines: [
      { name: 'Asosiy: 5...O-O 6.Bd3', san: 'e4 d6 d4 Nf6 Nc3 g6 f4 Bg7 Nf3 O-O Bd3 Na6 O-O c5 d5', notes: {
        1: 'Markaz.', 3: 'Ikkinchi markaz piyodasi — qoralar unga ruxsat berdi.', 5: 'e4 ni himoya qiladi.', 7: 'Avstriya hujumi: f4 — markazning uchinchi piyodasi.',
        9: 'Rivojlanish va e5 ni qo\'llab-quvvatlash.', 11: 'Fil e4 ni himoya qiladi, shoh tomonga qaraydi.', 13: 'Shoh xavfsiz.',
        15: 'd5 — markazni yopib, kenglikni ushlaysiz.' } },
      { name: '5...c5 6.dxc5', san: 'e4 d6 d4 Nf6 Nc3 g6 f4 Bg7 Nf3 c5 dxc5 Qa5 Bd3 Qxc5 Qe2 O-O Be3', notes: {
        10: 'Qoralar markazga zarba beradi.', 11: 'Olish — eng sodda javob.', 12: 'Farzin c5 ni qaytarib olishga tayyor va Nc3 ni bog\'laydi.',
        13: 'e4 himoyalandi, rivojlanish.', 15: 'Farzin e4 va e5 surilishini qo\'llaydi.', 17: 'Farzinni haydab, uzun rokirovkaga ham tayyor.' } },
    ],
  },
  {
    id: 'alapin', name: 'Sitsiliya: Alapin (2.c3)', color: 'w', key: 2,
    about: "1.e4 c5 ga qarshi 2.c3 — d4 ni tayyorlaysiz. Murakkab Sitsiliya nazariyasisiz to'liq markaz.",
    plan: ["Maqsad — d4 va ikki piyodali markaz.", "...Nf6 ga e5 bilan otni haydang.", "...d5 ga exd5 Qxd5, keyin d4 va Nf3 — farzin markazda hujumga ochiq."],
    traps: ["2.c3 dan keyin Nc3 qo'yib bo'lmaydi — ot o'rni d2 yoki a3.", "e5 dan keyin e5 piyodasini himoyasiz qoldirmang (d4, Nf3)."],
    lines: [
      { name: '2...Nf6 3.e5', san: 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4', notes: {
        3: 'd4 ga tayyorgarlik.', 4: 'Qoralar e4 ga hujum qiladi.', 5: 'Otni haydaysiz — kenglik.', 7: 'Markaz.',
        9: 'Rivojlanish; piyodani keyin olasiz.', 11: 'Ikki piyodali markaz tiklandi.', 13: "Fil d5 dagi otga bosim qiladi." } },
      { name: '2...d5 3.exd5', san: 'e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 Bg4 Be2 e6 O-O Nc6 h3 Bh5 Be3', notes: {
        5: 'Olish — farzin erta chiqadi.', 7: 'Markaz, farzinga tazyiq.', 9: 'Rivojlanish.', 11: 'Bog\'lashni yechadi.',
        13: 'Shoh xavfsiz.', 15: 'Filni so\'raydi.', 17: 'd4 ni himoya qiladi, rivojlanish tugadi.' } },
    ],
  },
  {
    id: 'french-adv', name: 'Fransuz: Ilgarilash (3.e5)', color: 'w', key: 2,
    about: "1.e4 e6 2.d4 d5 3.e5 — kenglik olasiz. Qoralar c5 va Qb6 bilan d4 ga bosadi; siz uni c3 va Nf3 bilan ushlaysiz.",
    plan: ["d4 — markazning asosi, uni c3 + Nf3 bilan himoya qiling.", "Shoh tomonda kenglik: keyin Bd3, O-O, hujum.", "Qoralarning c8 dagi fili yomon — almashtirmang."],
    traps: ["d4 ni bir marta ortiq himoya qilmasangiz, ...cxd4 va ...Qxd4 piyodani oladi.", "a3 + b4 — ...c4 dan keyin ferz qanotida kenglik."],
    lines: [
      { name: 'Asosiy', san: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4 Nbd2', notes: {
        5: 'Kenglik: qoralar oti f6 ga chiqa olmaydi.', 6: 'Qoralar zanjirning asosiga — d4 ga zarba.', 7: 'd4 ni himoya qiladi.',
        9: 'd4 ni uchinchi marta himoya.', 10: 'd4 va b2 ga bosim.', 11: 'b4 ni tayyorlaydi, ...Nb4 ni to\'xtatadi.',
        13: 'Ot b3 yoki f1-g3 ga boradi.' } },
    ],
  },
  {
    id: 'caro-adv', name: 'Karo-Kann: Ilgarilash (3.e5)', color: 'w', key: 2,
    about: "1.e4 c6 2.d4 d5 3.e5 — kenglik. Qoralar fili f5 ga chiqadi; siz tinch rivojlanib, keyin c4 yoki shoh tomonda hujum qilasiz.",
    plan: ["Nf3, Be2, O-O — oddiy rivojlanish.", "...c5 zarbasiga Be3 bilan d4 ni qo'llang.", "Fil f5 ni Nh4 yoki Bd3 bilan almashtirish — foydali."],
    traps: ["Erta g4 hujumi ~1000 darajada ko'pincha shohingizni ochib qo'yadi."],
    lines: [
      { name: 'Short varianti', san: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3', notes: {
        5: 'Kenglik.', 6: 'Qoralar yaxshi filini zanjirdan tashqariga chiqaradi.', 7: 'Rivojlanish, d4 himoyasi.',
        9: 'Rokirovkaga tayyorgarlik.', 10: 'd4 ga zarba.', 11: 'd4 ni himoya qiladi, c5 ni olishga tayyor.' } },
    ],
  },
  {
    id: 'scandi', name: 'Skandinaviya (1...d5)', color: 'w', key: 2,
    about: "1.e4 d5 2.exd5 — qoralar farzini erta chiqaradi. Siz Nc3 bilan vaqt yutasiz va tez rivojlanasiz.",
    plan: ["Farzinga hujum qilib rivojlaning (Nc3, Bd2, Nd5 tahdidi).", "d4, Nf3, Bc4 — tez rokirovka.", "Ochiq liniyalardan foydalaning: Re1, d5 zarbasi."],
    traps: ["Bd2 dan keyin Nd5 tahdidi — farzin a5 da qolsa, ot bilan hujum qiling.", "2...Nf6 da piyodani ushlab qolishga urinmang (c4 shart emas) — oddiy d4."],
    lines: [
      { name: '2...Qxd5 3.Nc3', san: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6', notes: {
        3: 'Olish.', 5: 'Farzinga hujum — vaqt yutasiz.', 7: 'Markaz.', 9: 'Rivojlanish.', 11: 'Fil faol diagonalda.',
        13: 'Nd5 tahdidi: ot farzinni ochib qo\'yadi.' } },
      { name: '2...Nf6 3.d4', san: 'e4 d5 exd5 Nf6 d4 Nxd5 Nf3 g6 c4 Nb6 Nc3 Bg7 h3', notes: {
        5: 'Oddiy markaz — piyodani ushlamaysiz.', 7: 'Rivojlanish.', 9: 'Otni haydaysiz, kenglik.', 11: 'Ikkala ot chiqdi.',
        13: '...Bg4 ga yo\'l yo\'q.' } },
    ],
  },
  {
    id: 'e5-black', name: '1...e5 (qoralar bilan)', color: 'b', key: 2,
    about: "1.e4 ga 1...e5 — klassik javob. Asosiy yo'llar: Italyan (3.Bc4), Ispan (3.Bb5), Shotland (3.d4). Har biriga tayyor javob.",
    plan: ["Nc6, Nf6/Bc5 — tez rivojlaning, e5 ni bo'shatmang.", "Italyanda ...d6 va ...a6/...Ba7 — fil xavfsiz.", "Ng5 hujumiga (Fried Liver) 4...d5 5.exd5 Na5! — Nxd5 emas."],
    traps: ["4.Ng5 d5 5.exd5 Nxd5?? 6.Nxf7! — qo'pol xato. To'g'risi 5...Na5.", "Ispanda erta ...Nxe4 — markaz ochilib qoladi, ehtiyot."],
    lines: [
      { name: 'Italyan: 3...Bc5', san: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7', notes: {
        2: 'Markazda teng ulush.', 4: 'e5 ni himoya qiladi.', 6: 'Fil f2 ga qaraydi — oqlarning zaif nuqtasi.',
        8: 'e4 ga hujum.', 10: 'e5 mustahkam, Bg4 ga yo\'l.', 12: 'Shoh xavfsiz.', 14: 'Filga b5/a7 joy.', 16: 'Fil d4 zarbasidan oldindan qochdi.' } },
      { name: 'Ikki ot: 4.Ng5 d5!', san: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5', notes: {
        6: 'Faol: e4 ga hujum.', 7: 'Oqlar f7 ga hujum qiladi.', 8: "Yagona yaxshi javob — markazni ochib, filni yopish.",
        10: 'Nxd5?? emas! Ot filga hujum qiladi.', 12: 'Vaqt yutib rivojlanasiz.', 14: 'Piyoda qurbon — evaziga tez rivojlanish.',
        16: 'Otni haydaydi.', 18: 'Kenglik va hujum.' } },
      { name: 'Ispan: 3.Bb5', san: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3', notes: {
        6: 'Filni so\'raydi.', 8: 'e4 ga hujum.', 10: 'Rokirovkaga tayyorgarlik.', 12: 'Filni haydab, ferz qanotida kenglik.',
        14: 'e5 mustahkam.', 16: 'Shoh xavfsiz — rivojlanish tugadi.' } },
      { name: 'Shotland: 3.d4', san: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4', notes: {
        6: 'Olish — markaz ochiladi.', 8: 'e4 ga hujum, rivojlanish.', 10: 'Markazga oladi, b-liniya ochildi.',
        12: 'e5 ni bog\'laydi (e-liniyada farzin).', 14: 'Ot markazda.' } },
    ],
  },
  {
    id: 'kid', name: 'Qirol hind mudofaasi', color: 'b', key: 1,
    about: "1.d4 Nf6 2.c4 g6 — oqlarga markazni berasiz, keyin ...e5 va ...f5 bilan zarba berib, shoh tomonda hujum qilasiz.",
    plan: ["...Nf6, ...g6, ...Bg7, ...O-O — avval shoh xavfsiz.", "...d6 va ...e5 — markazga zarba.", "d5 yopilsa: ...Ne8/...Nd7 va ...f5 — shoh tomonda hujum."],
    traps: ["...e5 ni d6 siz o'ynash — piyoda bepul ketadi.", "Markaz yopilganda ferz qanotida o'ynash — oqlar u yerda kuchliroq."],
    lines: [
      { name: 'Klassik: 6.Be2 e5', san: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7', notes: {
        2: 'Egiluvchan: e4 ni to\'xtatadi.', 4: 'Fianketto tayyorgarligi.', 6: 'Fil uzun diagonalda — markazga bosim.',
        8: '...e5 uchun tayyorgarlik.', 10: 'Shoh xavfsiz.', 12: 'Markazga zarba.', 14: 'd4 ga bosim.',
        16: 'Ot f5 ni qo\'llashga boradi.', 18: 'Yo\'l ochildi: ...f5!' } },
      { name: 'Semish: 5.f3', san: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5', notes: {
        9: 'Oqlar e4 ni mustahkamlab, g4 hujumiga tayyor.', 10: 'Avval xavfsizlik.', 12: 'Yana markazga zarba.',
        14: 'Ot ...f5 ga yo\'l ochadi va f4 ga qaraydi.' } },
      { name: 'London (2.Nf3 3.Bf4)', san: 'd4 Nf6 Nf3 g6 Bf4 Bg7 e3 d6 h3 O-O Be2 c5 c3', notes: {
        5: 'London tizimi — fil e3 dan oldin chiqadi.', 6: 'Odatdagi tuzilma.', 8: '...e5 ga tayyorgarlik.', 10: 'Shoh xavfsiz.',
        12: 'd4 ga zarba — Londonga qarshi eng yaxshi g\'oya.' } },
    ],
  },
];

const toUci = (san: string[]) => { const g = new Chess(); return san.map((m) => { const x = g.move(m); return x.from + x.to + (x.promotion ?? ''); }); };
export const LESSONS: Lesson[] = RAW.map((l) => ({ ...l, lines: l.lines.map((x) => { const san = x.san.split(' '); return { name: x.name, san, uci: toUci(san), notes: x.notes }; }) }));

/** O'ynalgan yurishlar bilan boshlanadigan variantlar. */
export const consistent = (lesson: Lesson, played: string[]) => lesson.lines.filter((l) => l.uci.length > played.length && played.every((u, i) => l.uci[i] === u));
/** Keyingi to'g'ri yurishlar (bir nechta variant bo'lishi mumkin). */
export const nextMoves = (lesson: Lesson, played: string[]) => [...new Set(consistent(lesson, played).map((l) => l.uci[played.length]))];
/** Yurish izohi (qaysi variantda bo'lsa). */
export function noteFor(lesson: Lesson, played: string[]): string | null {
  const n = played.length;
  for (const l of lesson.lines) if (l.uci.length >= n && played.every((u, i) => l.uci[i] === u) && l.notes[n]) return l.notes[n];
  return null;
}

/** O'yin shu darsga tegishlimi: rang mos va birinchi `key` yarim yurish bir xil. */
export const matches = (lesson: Lesson, g: Pick<ComGame, 'color' | 'moves'>) =>
  g.color === lesson.color && lesson.lines.some((l) => l.uci.slice(0, lesson.key).every((u, i) => g.moves[i] === u));

export interface Deviation { game: ComGame; ply: number; played: string; want: string[] }
/** O'yinda nazariyadan qayerda chiqdingiz (raqib birinchi chiqsa — sizda xato yo'q). */
export function deviation(lesson: Lesson, g: ComGame): Deviation | null {
  for (let i = 0; i < g.moves.length; i++) {
    const want = nextMoves(lesson, g.moves.slice(0, i));
    if (!want.length) return null;                         // dars tugadi — nazariya bo'yicha o'tdingiz
    if (want.includes(g.moves[i])) continue;
    const mine = (g.color === 'w') === (i % 2 === 0);
    return mine ? { game: g, ply: i, played: g.moves[i], want } : null;
  }
  return null;
}

/** Repertuar: sizning o'yinlaringizda qaysi darslar ko'p uchraydi va qayerda chiqib ketasiz. */
export function repertoire(games: ComGame[]) {
  return LESSONS.map((l) => {
    const gs = games.filter((g) => matches(l, g));
    const devs = gs.map((g) => deviation(l, g)).filter((d): d is Deviation => !!d);
    return { lesson: l, games: gs.length, devs };
  }).sort((a, b) => b.games - a.games);
}

// ── Takrorlash (Leitner): toza o'tsangiz quti oshadi, xato — qayta 1-qutiga ──
export interface Box { box: number; due: number; done: number }
const GAPS = [1, 3, 7, 14, 30];
const DAY = 86400000;
export function nextBox(b: Box | undefined, clean: boolean, now = Date.now()): Box {
  const box = clean ? Math.min(GAPS.length, (b?.box ?? 0) + 1) : 1;
  return { box, due: now + GAPS[box - 1] * DAY, done: (b?.done ?? 0) + 1 };
}
export const isDue = (b: Box | undefined, now = Date.now()) => !!b && b.due <= now;

export async function loadBoxes(): Promise<Record<string, Box>> {
  try { return JSON.parse((await AsyncStorage.getItem(KEYS.chessOpen)) ?? '{}'); } catch { return {}; }
}
export async function saveBox(id: string, clean: boolean) {
  const all = await loadBoxes();
  all[id] = nextBox(all[id], clean);
  await AsyncStorage.setItem(KEYS.chessOpen, JSON.stringify(all)).catch(() => {});
  return all;
}
