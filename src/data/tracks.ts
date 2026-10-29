/**
 * tracks.ts — darslar mazmuni. Har bir kod misoli BIZNING loyihalarimizdan
 * olingan (Nobu PC yordamchisi va Nobu telefon ilovasi) va qaysi faylda turgani ko'rsatilgan — shunda
 * "bu qayerda ishlatiladi?" degan savolga darhol javob bor.
 *
 * Yangi dars qo'shish = shu ro'yxatga bitta obyekt qo'shish.
 * Keyin (server bosqichi) darslar bazadan keladi, tuzilish o'sha qoladi.
 *
 * String.raw`...` — teskari chiziq (\) ni o'zgartirmasdan saqlaydi. Regex
 * misollarida \d, \s kabi belgilar buzilmasligi uchun kerak.
 */

import type { Track } from './types';

export const TRACKS: Track[] = [
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'python',
    title: 'Python',
    icon: '🐍',
    color: '#34D399',
    about: "Nobu yordamchisi butunlay Python'da yozilgan. Har dars — uning bir qismi.",
    lessons: [
      {
        id: 'py-dataclass',
        title: '@dataclass — sozlamalar bitta joyda',
        minutes: 5,
        steps: [
          {
            type: 'text',
            body:
              "Nobu'da o'nlab sozlama bor: ovoz, ism, vaqt oraliqlari. Ularni kod ichida " +
              "tarqatib yuborsak, keyin topib bo'lmaydi. Yechim — bitta klass, har bir " +
              'maydon bitta sozlama.',
          },
          {
            type: 'code',
            lang: 'python',
            project: 'Nobu',
            file: 'nobu/config.py',
            code: `@dataclass
class Settings:
    name: str = "Nobu"
    voice_pitch: str = "-22Hz"
    voice_enabled: bool = True
    chatter_min_minutes: int = 20
    quiet_hours: tuple[int, int] = (23, 8)`,
            explain:
              "@dataclass Python'ga __init__ ni o'zi yozib berishni aytadi. Har bir qator: " +
              'nom, tur va standart qiymat. Settings() — hammasi standart; ' +
              'Settings(name="Temur") — faqat ism o\'zgaradi.',
          },
          {
            type: 'quiz',
            question: 's = Settings(voice_enabled=False) dan keyin s.name nimaga teng?',
            options: ['None', '"Nobu"', 'Xato beradi', '""'],
            answer: 1,
            why: "Berilmagan maydon standart qiymatini oladi — name standarti \"Nobu\".",
          },
          {
            type: 'fill',
            prompt: "Ovoz balandligi uchun float turidagi maydon qo'shing (standart 0.9):",
            code: 'voice_volume: ___ = 0.9',
            answer: 'float',
            hint: "O'nli kasr soni uchun tur.",
          },
          {
            type: 'quiz',
            question: "Nega quiet_hours uchun list emas, tuple ishlatilgan?",
            options: [
              'Tuple tezroq chiziladi',
              "Standart qiymat o'zgarmas bo'lishi kerak — list dataclass'da standart bo'lolmaydi",
              'Tuple ichida faqat int bo\'ladi',
              'Farqi yo\'q',
            ],
            answer: 1,
            why:
              "dataclass o'zgaruvchan standartlarni (list, dict) to'g'ridan-to'g'ri qabul " +
              "qilmaydi — hamma obyekt bitta ro'yxatni bo'lishib qolardi. Shuning uchun " +
              "Nobu'da apps uchun field(default_factory=...) ishlatilgan.",
          },
        ],
      },
      {
        id: 'py-regex',
        title: 'Regex — matndan buyruq ajratish',
        minutes: 7,
        steps: [
          {
            type: 'text',
            body:
              '"eslat 15 daqiqada choy" — bu matndan 15, "daqiqa" va "choy" ni ajratib ' +
              "olish kerak. Buning uchun regex (muntazam ifoda) — matn qolipi ishlatiladi.",
          },
          {
            type: 'code',
            lang: 'python',
            project: 'Nobu',
            file: 'nobu/core/commands.py',
            code: String.raw`re.compile(
    r"^(?:eslat|remind(?: me)?)\s+(?P<num>\d+)\s*"
    r"(?P<unit>daqiqa|minut|min|m|soat|hours?|h)\w*\s+(?P<text>.+)$",
    re.I)`,
            explain:
              '^ — boshi, $ — oxiri. \\d+ — bir yoki ko\'p raqam. (?P<num>...) — nomli guruh: ' +
              'natijadan match["num"] bilan olinadi. (?:...) — guruh, lekin natijaga kirmaydi. ' +
              're.I — katta-kichik harf farqsiz ("Eslat" ham ishlaydi).',
          },
          {
            type: 'quiz',
            question: '"eslat 2 soatda majlis" uchun guruh "unit" nimaga teng?',
            options: ['"soatda"', '"soat"', '"2 soat"', '"majlis"'],
            answer: 1,
            why: 'Guruh faqat "soat" ni ushlaydi; "da" qo\'shimchasini keyingi \\w* yutadi.',
          },
          {
            type: 'fill',
            prompt: 'Bir yoki ko\'p RAQAM uchun regex belgisi:',
            code: String.raw`(?P<num>___)`,
            answer: String.raw`\d+`,
            hint: 'd — digit (raqam), + — bir yoki ko\'p.',
          },
        ],
      },
      {
        id: 'py-deque',
        title: 'deque — hazil ketma-ket takrorlanmasin',
        minutes: 5,
        steps: [
          {
            type: 'text',
            body:
              "random.choice bir hazilni ketma-ket ikki marta aytishi mumkin — bu " +
              '"robotdek" tuyuladi. Nobu oxirgi aytilganlarini eslab, ularni chetlab o\'tadi.',
          },
          {
            type: 'code',
            lang: 'python',
            project: 'Nobu',
            file: 'nobu/core/content.py',
            code: `self._recent = deque(maxlen=3)

def pick(self) -> str:
    choices = [x for x in self._items if x not in self._recent] or self._items
    choice = random.choice(choices)
    self._recent.append(choice)
    return choice`,
            explain:
              'deque(maxlen=3) — eng oxirgi 3 ta element saqlanadi, 4-si qo\'shilganda eng ' +
              'eskisi o\'zi chiqib ketadi. "... or self._items" — agar hammasi yaqinda ' +
              'aytilgan bo\'lsa, ro\'yxat bo\'sh qolmasligi uchun zaxira.',
          },
          {
            type: 'quiz',
            question: 'd = deque(maxlen=2); d.append(1); d.append(2); d.append(3) → d = ?',
            options: ['[1, 2, 3]', '[1, 2]', '[2, 3]', 'Xato'],
            answer: 2,
            why: "maxlen=2 — joy tugaganda eng eski (1) chiqib ketadi.",
          },
          {
            type: 'quiz',
            question: '[x for x in items if x not in recent] — bu nima?',
            options: ["List comprehension (ro'yxat yig'ish)", 'Generator', 'Lambda', 'Dekorator'],
            answer: 0,
            why: "Kvadrat qavs ichida for + if — yangi ro'yxat yig'adi.",
          },
        ],
      },
      {
        id: 'py-lerp',
        title: 'Interpolyatsiya — qilich qanday harakatlanadi',
        minutes: 6,
        steps: [
          {
            type: 'text',
            body:
              "Nobu qilichini har kadrda qo'lda chizmaymiz. Faqat muhim lahzalar (kalit " +
              'kadrlar) yoziladi, oradagisini formula hisoblaydi.',
          },
          {
            type: 'code',
            lang: 'python',
            project: 'Nobu',
            file: 'nobu/ui/swordplay.py',
            code: `k = (t - t0) / (t1 - t0)        # oraliqning qayerida: 0…1
k = k * k * (3 - 2 * k)          # silliq boshlanish/tugash
hx = a.hx + (b.hx - a.hx) * k    # qo'l o'rni
angle = a.angle + turn * k       # qilich burchagi`,
            explain:
              "a + (b − a) · k — chiziqli interpolyatsiya (lerp). k=0 da a, k=1 da b, " +
              "k=0.5 da o'rtasi. k·k·(3−2k) — 'smoothstep': harakat sekin boshlanib, sekin " +
              "tugaydi, shuning uchun tabiiy ko'rinadi.",
          },
          {
            type: 'fill',
            prompt: 'a=10, b=30, k=0.5 bo\'lsa, a + (b − a) · k = ?',
            code: '10 + (30 - 10) * 0.5 = ___',
            answer: '20',
            hint: "O'rtasi.",
          },
          {
            type: 'quiz',
            question: "Data Science'da bu formula qayerda uchraydi?",
            options: [
              "Yo'qolgan qiymatlarni to'ldirishda (pandas interpolate)",
              'Faqat o\'yinlarda',
              'Hech qayerda',
              'Faqat grafik chizishda',
            ],
            answer: 0,
            why: "df.interpolate() xuddi shu ishni qiladi: ikki ma'lum nuqta orasini to'ldiradi.",
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'typescript',
    title: 'TypeScript',
    icon: '🟦',
    color: '#60A5FA',
    about: 'Shu ilovaning o\'zi TypeScript\'da. Darslardagi kod — ilovaning haqiqiy fayllari.',
    lessons: [
      {
        id: 'ts-union',
        title: 'Turlar va union — dars qadami',
        minutes: 6,
        steps: [
          {
            type: 'text',
            body:
              "Siz hozir o'qiyotgan dars qadamlardan iborat: matn, kod, test, bo'sh joy. " +
              "TypeScript'ga ularning shaklini shunday tushuntirganmiz:",
          },
          {
            type: 'code',
            lang: 'typescript',
            project: 'Nobu (telefon ilovasi)',
            file: 'src/data/types.ts',
            code: `export type Step =
  | { type: 'text'; body: string }
  | { type: 'quiz'; question: string; options: string[];
      answer: number; why: string }
  | { type: 'fill'; prompt: string; code: string;
      answer: string; hint: string };`,
            explain:
              "(Qisqartirilgan: faylda 4-turi — 'code' ham bor.) | — \"yoki\". type maydoniga qarab TypeScript qolgan " +
              "maydonlarni biladi: if (step.type === 'quiz') ichida step.options mavjud, " +
              'step.body esa — xato.',
          },
          {
            type: 'quiz',
            question: "Python'dagi qaysi tushuncha TypeScript'dagi `string[]` ga o'xshaydi?",
            options: ['tuple[str]', 'list[str]', 'dict[str, str]', 'set'],
            answer: 1,
            why: 'string[] — matnlar ro\'yxati, Python type hint\'da list[str].',
          },
          {
            type: 'fill',
            prompt: 'To\'g\'ri javob raqami uchun tur:',
            code: 'answer: ___;',
            answer: 'number',
            hint: "TypeScript'da int va float yo'q — bitta tur.",
          },
        ],
      },
      {
        id: 'ts-streak',
        title: 'Streak — kunlar seriyasi qanday hisoblanadi',
        minutes: 6,
        steps: [
          {
            type: 'code',
            lang: 'typescript',
            project: 'Nobu (telefon ilovasi)',
            file: 'src/lib/streak.ts',
            code: `export function currentStreak(active: Set<string>, today: string): number {
  let day = active.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (active.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}`,
            explain:
              "Set — takrorlanmas qiymatlar to'plami, .has() juda tez. Bugundan orqaga " +
              "qarab kunlar uzluksiz bo'lsa — sanaymiz. Bugun hali mashq qilmagan bo'lsangiz, " +
              'kechadan boshlaymiz — seriya kechgacha "yonib" turadi.',
          },
          {
            type: 'quiz',
            question: 'Faol kunlar: 26, 27, 28-oktabr. Bugun 28-oktabr. Streak = ?',
            options: ['1', '2', '3', '0'],
            answer: 2,
            why: '28 → 27 → 26: uch kun uzluksiz.',
          },
          {
            type: 'quiz',
            question: 'Faol kunlar: 25, 27-oktabr. Bugun 28-oktabr (hali mashq yo\'q). Streak = ?',
            options: ['0', '1', '2', '3'],
            answer: 1,
            why: "Bugun yo'q → kechadan (27) boshlaymiz: 27 bor, 26 yo'q → 1.",
          },
          {
            type: 'fill',
            prompt: "JavaScript'da oylar nechadan sanaladi? (yanvar = ?)",
            code: 'new Date(2026, ___, 1)  // 1-yanvar',
            answer: '0',
            hint: 'Shuning uchun streak.ts\'da getMonth() + 1 yozilgan.',
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'java',
    title: 'Java',
    icon: '☕',
    color: '#F59E0B',
    about:
      "Loyihalarimizda Java hali yo'q. Shuning uchun darslar Python kodimizning " +
      "Java'dagi ko'rinishi bilan quriladi — taqqoslab o'rganish.",
    lessons: [
      {
        id: 'java-record',
        title: "Python dataclass → Java record",
        minutes: 6,
        steps: [
          {
            type: 'code',
            lang: 'python',
            project: 'Nobu',
            file: 'nobu/core/storage.py',
            code: `@dataclass
class Word:
    word: str
    translation: str
    box: int`,
            explain: "Nobu'dagi yodlanadigan so'z. Endi xuddi shuni Java'da yozamiz.",
          },
          {
            type: 'code',
            lang: 'java',
            project: 'Nobu → Java',
            file: 'Word.java',
            code: `public record Word(String word, String translation, int box) {}

Word w = new Word("deadline", "muddat", 0);
System.out.println(w.word());   // deadline`,
            explain:
              "record — Java 16+ dagi dataclass. Farqlar: tur nomdan OLDIN yoziladi " +
              "(String word), har qator ; bilan tugaydi, obyekt `new` bilan yaratiladi, " +
              'maydon w.word() — qavs bilan.',
          },
          {
            type: 'quiz',
            question: "Java'da butun son turi qaysi?",
            options: ['integer', 'int', 'num', 'Int32'],
            answer: 1,
            why: 'int — oddiy butun son (Python\'dagi int ga mos).',
          },
          {
            type: 'fill',
            prompt: 'Yangi obyekt yaratish kalit so\'zi:',
            code: 'Word w = ___ Word("focus", "diqqat", 0);',
            answer: 'new',
            hint: "Python'da bu so'z yo'q.",
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'sql',
    title: 'SQL va baza',
    icon: '🗄️',
    color: '#A78BFA',
    about: "Nobu eslatmalari SQLite'da. Railway serveri esa PostgreSQL'da bo'ladi.",
    lessons: [
      {
        id: 'sql-create',
        title: 'Jadval yaratish va yozish',
        minutes: 6,
        steps: [
          {
            type: 'code',
            lang: 'sql',
            project: 'Nobu',
            file: 'nobu/core/storage.py',
            code: `CREATE TABLE IF NOT EXISTS items (
    id          TEXT PRIMARY KEY,
    kind        TEXT NOT NULL,
    text        TEXT NOT NULL,
    done        INTEGER NOT NULL DEFAULT 0,
    deleted     INTEGER NOT NULL DEFAULT 0
);`,
            explain:
              "PRIMARY KEY — har qatorning yagona raqami. NOT NULL — bo'sh bo'lishi mumkin " +
              "emas. DEFAULT 0 — berilmasa 0. IF NOT EXISTS — jadval bor bo'lsa, qayta " +
              'yaratmaydi (dastur har ochilganda xavfsiz).',
          },
          {
            type: 'code',
            lang: 'python',
            project: 'Nobu',
            file: 'nobu/core/storage.py',
            code: `self._conn.execute(
    "INSERT INTO items (id, kind, text) VALUES (?, ?, ?)",
    (item.id, kind, item.text),
)`,
            explain:
              "? — joy egallovchi. Qiymatlar alohida beriladi. Hech qachon matnni f-string " +
              "bilan SQL ichiga qo'ymang — bu SQL injection xavfi.",
          },
          {
            type: 'quiz',
            question: "Nega o'chirishda qator yo'qotilmay, deleted = 1 qilinadi?",
            options: [
              'Tezroq ishlaydi',
              "Server bilan sinxronda boshqa qurilma ham 'o'chirildi'ni bilishi uchun",
              'SQLite DELETE ni bilmaydi',
              'Xotira tejaladi',
            ],
            answer: 1,
            why: '"Yumshoq o\'chirish" — kelajakdagi Railway sinxroni uchun.',
          },
          {
            type: 'fill',
            prompt: 'Faqat bajarilmagan vazifalar:',
            code: "SELECT * FROM items WHERE kind = 'task' AND done = ___",
            answer: '0',
            hint: 'done ustuni 0 yoki 1.',
          },
        ],
      },
    ],
  },

];

export function findLesson(id: string) {
  for (const track of TRACKS) {
    const index = track.lessons.findIndex((l) => l.id === id);
    if (index >= 0) return { track, lesson: track.lessons[index], index };
  }
  return null;
}

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ track: t, lesson: l })));
