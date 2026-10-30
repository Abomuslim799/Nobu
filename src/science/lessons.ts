/**
 * lessons.ts — Science darslari: Matematika, Geometriya, Fizika. Darslarni Nobu olib boradi.
 * Tuzilish: Nobu kirish so'zi → taxmin (avval o'ylang) → simulyatsiya → qonuniyat → yechilgan misol → mashqlar.
 * Sonli javoblar scripts/test_science.ts da formulalar bilan qayta hisoblanib tekshiriladi.
 */

export type Area = 'math' | 'geo' | 'phys';
export type Block =
  | { k: 'nobu'; text: string }
  | { k: 'text'; text: string }
  | { k: 'predict'; q: string; options: string[]; answer: string; reveal: string }
  | { k: 'sim'; id: string; task: string }
  | { k: 'law'; title: string; formula: string[]; meaning: string }
  | { k: 'example'; title: string; steps: string[] }
  | { k: 'ex'; id: string; q: string; answer: number; tol?: number; unit?: string; hint: string; solution: string }
  | { k: 'choice'; q: string; options: string[]; answer: string; why: string };

export interface SciLesson { id: string; area: Area; n: number; title: string; sub: string; minutes: number; needs?: string[]; blocks: Block[] }

export const AREAS: { id: Area; title: string; icon: string; color: string; about: string }[] = [
  { id: 'math', title: 'Matematika', icon: '∫', color: '#60A5FA', about: 'Hosila, integral — fizikaning tili' },
  { id: 'geo', title: 'Geometriya', icon: '△', color: '#F472B6', about: 'Trigonometriya, vektorlar' },
  { id: 'phys', title: 'Fizika', icon: '⚛️', color: '#FBBF24', about: 'Mexanika: harakat, otilgan jism, tebranish' },
];

export const LESSONS: SciLesson[] = [
  // ════════════════════════ MATEMATIKA ════════════════════════
  {
    id: 'm1', area: 'math', n: 1, title: 'Hosila — lahzadagi o\'zgarish tezligi', sub: 'Kesuvchidan urinmaga', minutes: 20,
    blocks: [
      { k: 'nobu', text: "Litseydan (x²)′ = 2x ni yodlagansiz. Bugun formulani emas, uning ma'nosini ko'ramiz: hosila — biror narsa aynan shu lahzada qanchalik tez o'zgarayotgani. Fizikadagi tezlik, tezlanish, quvvat — hammasi hosila." },
      { k: 'predict', q: "Mashina 2 soatda 120 km yurdi. 1-soat oxirida spidometr aniq 60 km/soat ko'rsatganmi?",
        options: ['Ha, albatta', "Yo'q, shart emas", "Spidometr bilan bog'liq emas"], answer: "Yo'q, shart emas",
        reveal: "120 / 2 = 60 — bu o'rtacha tezlik. Lahzadagi tezlik butunlay boshqacha bo'lishi mumkin (svetoforda 0, trassada 100). Lahzadagi tezlikni topish uchun oraliqni juda kichik qilib olish kerak — hosila g'oyasi shu." },
      { k: 'text', text: "Ikki nuqta orasidagi o'rtacha o'zgarish tezligi: Δy / Δx = (f(x + h) − f(x)) / h. Grafikda bu — ikki nuqtadan o'tgan kesuvchi chiziqning qiyaligi. Endi h ni kichraytirib ko'ramiz." },
      { k: 'sim', id: 'derivative', task: "h ni 2 dan 0.01 gacha asta kamaytiring. Pushti kesuvchi chiziq nimaga aylanyapti? Uning qiyaligi qaysi songa yaqinlashyapti?" },
      { k: 'law', title: 'Hosilaning ta\'rifi', formula: ["f′(x) = lim (h → 0) [f(x + h) − f(x)] / h"],
        meaning: "Hosila — grafikka shu nuqtada o'tkazilgan urinmaning qiyaligi. h nolga intilganda kesuvchi urinmaga aylanadi. Fizikada: yo'l x(t) dan hosila — tezlik v(t), tezlikdan hosila — tezlanish a(t)." },
      { k: 'example', title: "(x²)′ = 2x ni ta'rifdan chiqaramiz", steps: [
        'f(x + h) − f(x) = (x + h)² − x² = x² + 2xh + h² − x² = 2xh + h²',
        "h ga bo'lamiz: (2xh + h²) / h = 2x + h",
        "h → 0 da h yo'qoladi: f′(x) = 2x",
        "Tekshiruv: simulyatsiyada x = 1 da urinma qiyaligi 2 ga teng.",
      ] },
      { k: 'choice', q: "Simulyatsiyada f(x) = x³ − 3x ni tanlang. Qaysi nuqtalarda urinma gorizontal (f′(x) = 0)?",
        options: ['x = 0', 'x = ±1', 'x = ±√3', 'x = ±3'], answer: 'x = ±1',
        why: "f′(x) = 3x² − 3 = 0 → x² = 1 → x = ±1. Bu nuqtalarda funksiya cho'qqi (x = −1) va chuqurlikka (x = 1) ega. Optimallashtirish masalalari shu g'oya bilan yechiladi." },
      { k: 'ex', id: 'm1-1', q: "f(x) = x². x = 3 va h = 0.1 bo'lganda kesuvchi qiyaligi qancha?", answer: 6.1, tol: 0.003,
        hint: '(f(3.1) − f(3)) / 0.1', solution: '(3.1² − 3²) / 0.1 = (9.61 − 9) / 0.1 = 6.1. Hosila f′(3) = 6 — h kichrayganda shu songa yaqinlashadi.' },
      { k: 'ex', id: 'm1-2', q: "f(x) = 5x² − 4x. f′(2) = ?", answer: 16,
        hint: "Har bir hadni alohida: (5x²)′ = 10x, (4x)′ = 4", solution: "f′(x) = 10x − 4 → f′(2) = 20 − 4 = 16." },
      { k: 'ex', id: 'm1-3', q: "Jism yo'li x(t) = 4t² (metr, t — soniya). t = 3 s dagi tezlik (m/s)?", answer: 24, unit: 'm/s',
        hint: 'Tezlik — yo\'lning hosilasi: v(t) = x′(t)', solution: "v(t) = 8t → v(3) = 24 m/s." },
      { k: 'ex', id: 'm1-4', q: "f(x) = sin x. f′(0) = ? (urinma qiyaligi koordinata boshida)", answer: 1, tol: 0.01,
        hint: '(sin x)′ = cos x', solution: "f′(0) = cos 0 = 1. Simulyatsiyada sin x ni tanlab, x = 0 ga yaqin qiyalikni tekshiring." },
    ],
  },
  {
    id: 'm2', area: 'math', n: 2, title: "Integral — yig'indidan yuzaga", sub: "To'rtburchaklar → aniq yuza", minutes: 20, needs: ['m1'],
    blocks: [
      { k: 'nobu', text: "Hosila savoli: 'qanchalik tez o'zgaryapti?'. Integral teskari savol beradi: 'tezlik ma'lum — jami qancha to'plandi?'. Yurilgan yo'l, bajarilgan ish, sarflangan energiya — bular integral." },
      { k: 'predict', q: "Mashina 3 soat davomida 40 km/soat bilan yurdi. Tezlik–vaqt grafigida yurilgan yo'l nimaga teng?",
        options: ['Grafik ostidagi yuzaga', 'Grafikning qiyaligiga', 'Grafikning balandligiga'], answer: 'Grafik ostidagi yuzaga',
        reveal: "40 · 3 = 120 km — bu balandligi 40, eni 3 bo'lgan to'rtburchakning yuzasi. Tezlik o'zgarsa ham qoida o'sha: yo'l = grafik ostidagi yuza. Faqat endi yuza egri chiziq ostida." },
      { k: 'text', text: "Egri chiziq ostidagi yuzani topish uchun uni n ta ingichka to'rtburchakka bo'lamiz va yuzalarini qo'shamiz: Σ f(xᵢ) · Δx. To'rtburchak qancha ingichka bo'lsa — xato shuncha kichik." },
      { k: 'sim', id: 'integral', task: "n ni 1 dan 100 gacha oshiring. Keyin chap, o'rta va o'ng nuqta usullarini solishtiring: qaysi biri n = 4 da ham aniq javobga eng yaqin?" },
      { k: 'law', title: 'Aniq integral va asosiy teorema', formula: ['∫ₐᵇ f(x) dx = lim (n → ∞) Σ f(xᵢ) · Δx', '∫ₐᵇ f(x) dx = F(b) − F(a), bunda F′(x) = f(x)'],
        meaning: "Integral va hosila — bir-biriga teskari amallar (Nyuton–Leybnits teoremasi). Shuning uchun yuzani topish uchun to'rtburchak sanash shart emas: hosilasi f bo'lgan F funksiyani topib, ikki chegaradagi qiymatlar farqini olamiz." },
      { k: 'example', title: '∫₀² x² dx', steps: ["F(x) = x³/3, chunki (x³/3)′ = x²", 'F(2) − F(0) = 8/3 − 0 ≈ 2.667',
        "Simulyatsiyada: o'rta nuqta, n = 100 → 2.6666 — mos keladi."] },
      { k: 'choice', q: "Simulyatsiyada sin x ni tanlang: [0; π] oraliqdagi yuza nechaga teng?", options: ['1', '2', 'π', '0'], answer: '2',
        why: "F(x) = −cos x. F(π) − F(0) = −cos π − (−cos 0) = 1 + 1 = 2." },
      { k: 'choice', q: "x³ − 3x uchun [0; 2] dagi integral manfiy chiqadi (−2). Nega?",
        options: ['Hisoblashda xato bor', "Grafikning bir qismi x o'qidan pastda — u yuza minus ishora bilan qo'shiladi", 'Integral doim manfiy bo\'ladi'],
        answer: "Grafikning bir qismi x o'qidan pastda — u yuza minus ishora bilan qo'shiladi",
        why: "Integral — 'ishorali yuza'. Fizikada bu muhim: orqaga yurilgan yo'l siljishni kamaytiradi." },
      { k: 'ex', id: 'm2-1', q: '∫₀³ 2x dx = ?', answer: 9, hint: 'F(x) = x²', solution: 'F(3) − F(0) = 9 − 0 = 9. Tekshiruv: bu asosi 3, balandligi 6 bo\'lgan uchburchak yuzasi: ½ · 3 · 6 = 9.' },
      { k: 'ex', id: 'm2-2', q: "Tezlik v(t) = 3t² (m/s). 0 dan 2 s gacha yurilgan yo'l (m)?", answer: 8, unit: 'm',
        hint: "Yo'l = ∫ v dt; (t³)′ = 3t²", solution: "∫₀² 3t² dt = t³ |₀² = 8 − 0 = 8 m." },
      { k: 'ex', id: 'm2-3', q: "f(x) = x², [0; 2], n = 2, CHAP nuqta usuli. To'rtburchaklar yig'indisi?", answer: 1,
        hint: 'Δx = 1; balandliklar f(0) va f(1)', solution: "f(0)·1 + f(1)·1 = 0 + 1 = 1. Aniq javob 2.667 — chap usul o'suvchi funksiyada yuzani kamaytirib ko'rsatadi." },
    ],
  },
  // ════════════════════════ GEOMETRIYA ════════════════════════
  {
    id: 'g1', area: 'geo', n: 1, title: 'Trigonometriya — birlik aylana', sub: 'sin va cos qayerdan keladi', minutes: 20,
    blocks: [
      { k: 'nobu', text: "sin va cos ni to'g'ri burchakli uchburchak tomonlarining nisbati sifatida bilasiz. Lekin 150° yoki 300° uchun uchburchak qayerda? Javob — birlik aylana. Tebranish, to'lqin, aylanish, o'zgaruvchan tok — fizikaning yarmi shu tilda yozilgan." },
      { k: 'predict', q: 'sin 150° nechaga teng?', options: ['0.5', '−0.5', '0.866', '−0.866'], answer: '0.5',
        reveal: "Aylanada 150° nuqta yuqori-chapda turadi. Uning balandligi (y) 30° dagi nuqta bilan bir xil — 0.5. Simulyatsiyada θ = 150° qilib tekshiring." },
      { k: 'text', text: "Radiusi 1 bo'lgan aylanada θ burchakka mos nuqta: x = cos θ, y = sin θ. Burchak x o'qining musbat yo'nalishidan soat strelkasiga teskari o'lchanadi. Shunday qilib sin va cos har qanday burchak uchun aniqlanadi — manfiy qiymatlari ham bor." },
      { k: 'sim', id: 'unitcircle', task: "'Aylantirish'ni bosing va o'ngdagi grafikka qarang: nuqtaning balandligi vaqt o'tishi bilan qanday chiziq chizyapti? Keyin θ ni qo'lda 90°, 180°, 270° ga qo'ying." },
      { k: 'law', title: 'Asosiy ayniyat va radian', formula: ['sin²θ + cos²θ = 1', 'θ (rad) = θ (°) · π / 180', "To'liq aylana = 360° = 2π rad"],
        meaning: "Birinchi formula — birlik aylanadagi Pifagor teoremasi (katetlar cos θ va sin θ, gipotenuza 1). Aylana bo'ylab tekis harakatning 'soyasi' — sinusoida: shuning uchun prujina, mayatnik va to'lqinlar sin bilan yoziladi. Fizikada burchak deyarli doim radianda." },
      { k: 'example', title: 'cos 120° = ?', steps: ["120° nuqta yuqori-chapda (II chorak) — x manfiy.", "Unga mos o'tkir burchak: 180° − 120° = 60°.", 'cos 120° = −cos 60° = −0.5'] },
      { k: 'choice', q: 'sin θ < 0 va cos θ > 0 bo\'lsa, θ qaysi chorakda?', options: ['I', 'II', 'III', 'IV'], answer: 'IV',
        why: "x > 0 (o'ngda), y < 0 (pastda) — IV chorak (270° dan 360° gacha)." },
      { k: 'ex', id: 'g1-1', q: 'sin 210° = ?', answer: -0.5, tol: 0.01, hint: "210° = 180° + 30° — III chorak, y manfiy", solution: 'sin 210° = −sin 30° = −0.5.' },
      { k: 'ex', id: 'g1-2', q: '90° radianda nechaga teng? (3 xona aniqlikda)', answer: Math.PI / 2, tol: 0.003, hint: 'θ · π / 180', solution: '90 · π / 180 = π/2 ≈ 1.571 rad.' },
      { k: 'ex', id: 'g1-3', q: 'cos 300° = ?', answer: 0.5, tol: 0.01, hint: '300° = 360° − 60°', solution: 'IV chorak, x musbat: cos 300° = cos 60° = 0.5.' },
      { k: 'ex', id: 'g1-4', q: "sin θ = 0.6 va θ I chorakda. cos θ = ?", answer: 0.8, tol: 0.01, hint: 'sin²θ + cos²θ = 1', solution: 'cos θ = √(1 − 0.36) = √0.64 = 0.8 (I chorakda musbat).' },
    ],
  },
  {
    id: 'g2', area: 'geo', n: 2, title: "Vektorlar — yo'nalishi bor kattaliklar", sub: "Tashkil etuvchilar va qo'shish", minutes: 20, needs: ['g1'],
    blocks: [
      { k: 'nobu', text: "Tezlik, kuch, siljish — bularning kattaligi ham, yo'nalishi ham bor. 3 + 4 har doim 7 emas. Bugungi g'oya: har qanday vektorni gorizontal va vertikal qismlarga ajratsangiz, murakkab masala ikkita oddiy masalaga aylanadi." },
      { k: 'predict', q: '3 N va 4 N kuch bitta jismga ta\'sir qilyapti. Natijaviy kuch qancha?',
        options: ['Doim 7 N', 'Doim 5 N', "1 N dan 7 N gacha — yo'nalishga bog'liq", 'Doim 1 N'], answer: "1 N dan 7 N gacha — yo'nalishga bog'liq",
        reveal: "Bir tomonga — 7 N, qarama-qarshi — 1 N, perpendikulyar — 5 N (3-4-5 uchburchak). Simulyatsiyada |A| = 3, |B| = 4 qilib, B burchagini o'zgartirib ko'ring." },
      { k: 'text', text: "Vektor A ning tashkil etuvchilari: Ax = |A| · cos θ, Ay = |A| · sin θ (birlik aylana darsidagi g'oya — faqat radius |A|). Vektorlarni qo'shish — tashkil etuvchilarni alohida qo'shish." },
      { k: 'sim', id: 'vectors', task: "|A| = 3 (0°), |B| = 4 (90°) qiling: |A+B| = 5 chiqadimi? Keyin B burchagini 180° ga keltiring. |A+B| va |A| + |B| qachon teng bo'ladi?" },
      { k: 'law', title: "Vektorlar bilan amallar", formula: ['A = (Ax; Ay),  Ax = |A|cos θ,  Ay = |A|sin θ', 'A + B = (Ax + Bx; Ay + By)', '|A| = √(Ax² + Ay²)'],
        meaning: "Gorizontal va vertikal yo'nalishlar bir-biriga ta'sir qilmaydi — har birini alohida hisoblab, oxirida birlashtiramiz. Otilgan jism, qiya tekislik, kuchlar muvozanati — hammasi shu usulda yechiladi." },
      { k: 'example', title: '10 birlik, 30° — tashkil etuvchilar', steps: ['Ax = 10 · cos 30° = 10 · 0.866 = 8.66', 'Ay = 10 · sin 30° = 10 · 0.5 = 5', 'Tekshiruv: √(8.66² + 5²) = √(75 + 25) = 10 ✓'] },
      { k: 'choice', q: "Ikki vektor uzunligi teng (|A| = |B|), orasidagi burchak 120°. |A + B| = ?", options: ['0', '|A|', '2|A|', '√3·|A|'], answer: '|A|',
        why: "A = (1; 0), B = (cos120°; sin120°) = (−0.5; 0.866). Yig'indi (0.5; 0.866), uzunligi 1. Simulyatsiyada tekshiring: |A| = |B| = 4, burchaklar 0° va 120°." },
      { k: 'ex', id: 'g2-1', q: "|A| = 5, burchagi 53.13°. Ax = ?", answer: 3, tol: 0.01, hint: 'Ax = |A| · cos θ', solution: '5 · cos 53.13° = 5 · 0.6 = 3 (bu 3-4-5 uchburchak).' },
      { k: 'ex', id: 'g2-2', q: 'A = (3; 4), B = (1; −1). |A + B| = ?', answer: 5, hint: "Avval tashkil etuvchilarni qo'shing", solution: 'A + B = (4; 3), |A + B| = √(16 + 9) = 5.' },
      { k: 'ex', id: 'g2-3', q: "6 N va 8 N kuch o'zaro perpendikulyar. Natijaviy kuch (N)?", answer: 10, unit: 'N', hint: 'Pifagor', solution: '√(36 + 64) = 10 N.' },
      { k: 'ex', id: 'g2-4', q: "To'p 20 m/s tezlik bilan gorizontga 60° burchak ostida tepildi. Tezlikning vertikal tashkil etuvchisi (m/s)?", answer: 20 * Math.sin(Math.PI / 3), tol: 0.01, unit: 'm/s',
        hint: 'vy = v · sin θ', solution: '20 · sin 60° = 20 · 0.866 ≈ 17.32 m/s.' },
    ],
  },
  // ════════════════════════ FIZIKA ════════════════════════
  {
    id: 'f1', area: 'phys', n: 1, title: 'Harakat — tezlik va tezlanish', sub: 'x(t), v(t) grafiklari — hosila va integral amalda', minutes: 25, needs: ['m1', 'm2'],
    blocks: [
      { k: 'nobu', text: "Kinematikani litseyda formulalar bilan o'tgansiz. Endi uni matematika darslariga ulaymiz: tezlik — yo'lning hosilasi, yo'l — tezlik grafigi ostidagi yuza. Formulalar shu ikki g'oyadan o'zi chiqadi." },
      { k: 'predict', q: "Jismning x(t) grafigi qiya to'g'ri chiziq. Uning tezlanishi qanday?", options: ['Nolga teng', 'Musbat', 'Manfiy', "Aniqlab bo'lmaydi"], answer: 'Nolga teng',
        reveal: "To'g'ri chiziqning qiyaligi hamma joyda bir xil → tezlik o'zgarmas → tezlanish 0. Tezlanish bo'lsa, x(t) egri chiziq (parabola) bo'ladi." },
      { k: 'text', text: "v = dx/dt — x–t grafigida urinma qiyaligi. a = dv/dt — v–t grafigining qiyaligi. Tezlanish o'zgarmas bo'lsa, v–t to'g'ri chiziq, uning ostidagi yuza (trapetsiya) — siljish." },
      { k: 'sim', id: 'motion', task: "v₀ = 4 m/s, a = −2 m/s² qiling va boshlang. Mashina qachon to'xtaydi? Shu lahzada x–t grafigidagi yashil urinma qanday? Keyin nima bo'ladi?" },
      { k: 'law', title: 'Tekis tezlanuvchan harakat', formula: ['v(t) = v₀ + a·t', 'x(t) = x₀ + v₀·t + ½·a·t²', 'v² − v₀² = 2·a·Δx'],
        meaning: "Birinchisi — a o'zgarmasligidan. Ikkinchisi — v(t) ning integrali (trapetsiya yuzasi) yoki boshqacha: x(t) ning hosilasi v(t) ni beradi, tekshirib ko'ring. Uchinchisi — vaqtsiz formula: tormozlash masalalarida juda qulay." },
      { k: 'example', title: 'v₀ = 4 m/s, a = −2 m/s²', steps: ["To'xtash: v = 0 → 4 − 2t = 0 → t = 2 s", "Shu paytgacha yo'l: x(2) = 4·2 − ½·2·4 = 4 m (x–t grafigining cho'qqisi, urinma gorizontal)",
        "Keyin mashina orqaga yuradi: t = 4 s da x = 16 − 16 = 0 — boshlang'ich nuqtaga qaytdi."] },
      { k: 'choice', q: "v–t grafigi v = 5 m/s gorizontal chiziq. 3 s da siljish?", options: ['5 m', '15 m', '1.67 m', '0'], answer: '15 m', why: "Grafik ostidagi yuza: 5 · 3 = 15 m." },
      { k: 'ex', id: 'f1-1', q: "Jism tinch holatdan 3 m/s² tezlanish bilan harakatlandi. 4 s da qancha yo'l bosdi (m)?", answer: 24, unit: 'm', hint: 'x = ½·a·t²', solution: '½ · 3 · 16 = 24 m.' },
      { k: 'ex', id: 'f1-2', q: '72 km/soat necha m/s?', answer: 20, unit: 'm/s', hint: '1 km/soat = 1000 m / 3600 s', solution: '72 · 1000 / 3600 = 20 m/s. (Tez usul: 3.6 ga bo\'lish.)' },
      { k: 'ex', id: 'f1-3', q: "Mashina 20 m/s tezlikda, tormoz −5 m/s². To'xtaguncha necha soniya?", answer: 4, unit: 's', hint: 'v = v₀ + a·t = 0', solution: '0 = 20 − 5t → t = 4 s.' },
      { k: 'ex', id: 'f1-4', q: "O'sha mashinaning tormoz yo'li (m)?", answer: 40, unit: 'm', hint: 'v² − v₀² = 2·a·Δx', solution: '0 − 400 = 2·(−5)·Δx → Δx = 40 m. Tekshiruv: 20·4 − ½·5·16 = 80 − 40 = 40 m ✓. Diqqat: tezlik 2 marta oshsa, tormoz yo\'li 4 marta oshadi!' },
    ],
  },
  {
    id: 'f2', area: 'phys', n: 2, title: 'Otilgan jism', sub: 'Ikki mustaqil harakat', minutes: 25, needs: ['g2', 'f1'],
    blocks: [
      { k: 'nobu', text: "Bugungi butun mavzu bitta g'oyadan chiqadi: gorizontal va vertikal harakat bir-biriga xalaqit bermaydi. Vektorlar darsidagi tashkil etuvchilar + harakat darsidagi formulalar = otilgan jism." },
      { k: 'predict', q: "Bir o'q gorizontal otildi, ikkinchisi xuddi shu balandlikdan shunchaki qo'yib yuborildi. Qaysi biri yerga birinchi tushadi?",
        options: ['Otilgani', "Qo'yib yuborilgani", 'Bir vaqtda'], answer: 'Bir vaqtda',
        reveal: "Ikkalasining vertikal harakati bir xil: boshlang'ich vertikal tezlik 0, tezlanish g. Gorizontal tezlik tushish vaqtiga ta'sir qilmaydi (havo qarshiligi hisobga olinmasa)." },
      { k: 'text', text: "v₀ ni tashkil etuvchilarga ajratamiz: vₓ = v₀·cos α — o'zgarmaydi (gorizontal kuch yo'q); v_y = v₀·sin α − g·t — xuddi yuqoriga otilgan tosh kabi. Traektoriya — parabola." },
      { k: 'predict', q: 'Bir xil tezlikda qaysi burchakda eng uzoqqa uchadi?', options: ['30°', '45°', '60°', '75°'], answer: '45°',
        reveal: "Havo qarshiligisiz — 45°. Qiziq tomoni: 30° va 60° aynan bir xil masofa beradi! Simulyatsiyada ikkalasini ketma-ket otib tekshiring." },
      { k: 'sim', id: 'projectile', task: "v₀ = 20 m/s: 30°, 45°, 60° ni ketma-ket oting. Keyin 'Havo qarshiligi bilan'ni yoqib 45° va 35° ni solishtiring — eng yaxshi burchak o'zgaradimi?" },
      { k: 'law', title: 'Otilgan jism formulalari (g = 9.81 m/s²)', formula: ['L = v₀²·sin 2α / g', 'H = v₀²·sin²α / (2g)', 'T = 2·v₀·sin α / g'],
        meaning: "T — vertikal harakatdan: jism ko'tarilib qaytguncha. L = vₓ·T = v₀cos α · 2v₀sin α / g, va 2·sin α·cos α = sin 2α. sin 2α eng katta qiymatga (1) 2α = 90° da erishadi → α = 45°. sin 60° = sin 120°, shuning uchun 30° va 60° bir xil masofa." },
      { k: 'example', title: 'v₀ = 20 m/s, α = 45°', steps: ['L = 400 · sin 90° / 9.81 = 40.8 m', 'H = 400 · 0.5 / 19.62 = 10.2 m', 'T = 2 · 20 · 0.707 / 9.81 = 2.88 s', 'Simulyatsiya ko\'rsatgan qiymatlar bilan solishtiring.'] },
      { k: 'choice', q: "Havo qarshiligi bilan eng uzoqqa uchish burchagi qanday?", options: ['45° dan katta', '45° dan kichik', 'Aynan 45°'], answer: '45° dan kichik',
        why: "Havo qarshiligi jism havoda qancha uzoq bo'lsa, shuncha ko'p tezlikni yeydi. Pastroq burchakda uchish vaqti qisqa — yo'qotish kam. Simulyatsiyada ko'ring: qarshilik bilan eng uzoq masofa 45° dan pastroq burchakda chiqadi." },
      { k: 'ex', id: 'f2-1', q: 'v₀ = 20 m/s, α = 30°. Uchish vaqti (s)?', answer: (2 * 20 * 0.5) / 9.81, tol: 0.01, unit: 's', hint: 'T = 2·v₀·sin α / g', solution: '2 · 20 · 0.5 / 9.81 ≈ 2.04 s.' },
      { k: 'ex', id: 'f2-2', q: 'v₀ = 15 m/s, α = 45°. Uchish masofasi (m)?', answer: 225 / 9.81, tol: 0.01, unit: 'm', hint: 'L = v₀²·sin 2α / g', solution: '225 · 1 / 9.81 ≈ 22.9 m.' },
      { k: 'ex', id: 'f2-3', q: "Stol balandligi 1.25 m. Undan to'p gorizontal 2 m/s tezlik bilan dumalab tushdi. Stoldan qancha uzoqqa tushadi (m)?", answer: 2 * Math.sqrt(2.5 / 9.81), tol: 0.015, unit: 'm',
        hint: "Avval tushish vaqti: h = ½·g·t²; keyin x = vₓ·t", solution: 't = √(2·1.25 / 9.81) = 0.505 s → x = 2 · 0.505 ≈ 1.01 m.' },
    ],
  },
  {
    id: 'f3', area: 'phys', n: 3, title: 'Mayatnik — garmonik tebranish', sub: 'Davr nimaga bog\'liq?', minutes: 20, needs: ['g1', 'g2'],
    blocks: [
      { k: 'nobu', text: "Mayatnik — fizikaning eng kuchli modellaridan biri. Soatlar, binolarning tebranishi, kristalldagi atomlar, tovush, elektr zanjirlari — hammasi 'garmonik tebranish' bilan tasvirlanadi. Bugun uning davri nimaga bog'liqligini o'zingiz kashf qilasiz." },
      { k: 'predict', q: 'Mayatnikni 10° ga og\'dirsangiz bir davr 2 s. 20° ga og\'dirsangiz-chi?', options: ['4 s', 'Deyarli 2 s', '1 s', '2.8 s'], answer: 'Deyarli 2 s',
        reveal: "Kichik burchaklarda davr amplitudaga deyarli bog'liq emas — buni Galiley cherkovdagi qandilni kuzatib payqagan. Lekin katta burchaklarda-chi? Simulyatsiyada 90° va 160° ni sinang." },
      { k: 'text', text: "Og'irlik kuchini ikki qismga ajratamiz (Vektorlar): ipga parallel qismi ip taranglashi bilan muvozanatlashadi, aylanaga urinma qismi F = −m·g·sin θ jismni pastga qaytaradi. Kichik burchakda sin θ ≈ θ (radianda) — kuch og'ishga proporsional bo'ladi, bu garmonik tebranish shartidir." },
      { k: 'sim', id: 'pendulum', task: "1) L = 0.5 m va L = 2 m da davrni o'lchang — L 4 marta oshganda T necha marta oshdi? 2) L = 1 m da og'ishni 10°, 90°, 160° qilib, davrni formulaga solishtiring." },
      { k: 'law', title: 'Matematik mayatnik davri', formula: ['T = 2π·√(L / g)   (kichik burchaklar uchun)'],
        meaning: "Davr massaga bog'liq emas va uzunlikning kvadrat ildiziga proporsional: L ni 4 marta oshirsangiz, T 2 marta oshadi. Katta burchaklarda sin θ < θ — qaytaruvchi kuch kutilganidan kuchsiz, shuning uchun davr uzayadi (160° da ~2 marta!)." },
      { k: 'example', title: 'L = 1 m', steps: ['T = 2π · √(1 / 9.81) = 2π · 0.319 = 2.006 s', "Shuning uchun 1 metrli mayatnik 'sekundli' deyiladi: bir tomonga borishi ~1 s."] },
      { k: 'choice', q: "Mayatnik yukining massasini 2 marta oshirsak, davr qanday o'zgaradi?", options: ['2 marta oshadi', "√2 marta oshadi", "O'zgarmaydi", '2 marta kamayadi'], answer: "O'zgarmaydi",
        why: "Og'irlik kuchi ham (mg), inersiya ham (m) bir xil marta oshadi — ular qisqarib ketadi. Erkin tushishda ham shu sabab: og'ir va yengil jism bir xil tezlanadi." },
      { k: 'ex', id: 'f3-1', q: 'L = 0.25 m bo\'lgan mayatnik davri (s)?', answer: 2 * Math.PI * Math.sqrt(0.25 / 9.81), tol: 0.01, unit: 's', hint: 'T = 2π√(L/g)', solution: '2π · √(0.0255) = 2π · 0.1597 ≈ 1.003 s. (L 4 marta kichik → T 2 marta kichik.)' },
      { k: 'ex', id: 'f3-2', q: 'Davri aniq 3 s bo\'lgan mayatnik uzunligi (m)?', answer: 9.81 * (3 / (2 * Math.PI)) ** 2, tol: 0.01, unit: 'm', hint: 'L = g · (T / 2π)²', solution: '9.81 · (3 / 6.283)² = 9.81 · 0.228 ≈ 2.24 m.' },
      { k: 'ex', id: 'f3-3', q: "Oyda g = 1.62 m/s². 1 metrli mayatnik davri (s)?", answer: 2 * Math.PI * Math.sqrt(1 / 1.62), tol: 0.01, unit: 's', hint: 'Xuddi shu formula, g boshqa', solution: '2π · √(1/1.62) = 2π · 0.786 ≈ 4.94 s — Yerdagidan ~2.5 marta sekin.' },
    ],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const lessonsOf = (area: Area) => LESSONS.filter((l) => l.area === area).sort((a, b) => a.n - b.n);
/** Darsning qisqa mazmuni — Nobu suhbati uchun kontekst. */
export function lessonContext(l: SciLesson) {
  const parts = l.blocks.map((b) =>
    b.k === 'law' ? `Qonun: ${b.title}: ${b.formula.join('; ')}. ${b.meaning}` :
    b.k === 'text' || b.k === 'nobu' ? b.text :
    b.k === 'example' ? `Misol: ${b.title}: ${b.steps.join(' ')}` : '');
  return `Dars: ${l.title} (${AREAS.find((a) => a.id === l.area)?.title}).\n${parts.filter(Boolean).join('\n')}`.slice(0, 6000);
}
