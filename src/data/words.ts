/**
 * words.ts — inglizcha so'z kartochkalari. Oldi: so'z; orqasi: tarjima,
 * misol gap va eslab qolish uchun izoh (Nobu'dagi kabi "ilmoq").
 * O'zingiz qo'shgan so'zlar — progress.tsx → myWords da, shu ro'yxatga qo'shiladi.
 */

export interface Word {
  id: string;
  word: string;
  translation: string;
  example: string;
  note?: string;
  ipa?: string;      // britancha (RP) transkripsiya; ˈ — urg'uli bo'g'in oldidan
  emoji?: string;    // kartadagi rasm
  image?: string;    // o'zingiz qo'shgan surat (telefondagi fayl manzili)
  deck: 'work' | 'it' | 'phrasal' | 'my';
}

export const DECKS: Record<Word['deck'], string> = {
  work: 'Ish va ofis',
  it: 'IT va dasturlash',
  phrasal: 'Phrasal verbs',
  my: "Mening so'zlarim",
};

export const WORDS: Word[] = [
  // ── Ish va ofis (Nobu'ning boshlang'ich so'zlari + yangilari) ──
  { id: 'w-deadline', ipa: '/ˈded.laɪn/', emoji: '⏰', deck: 'work', word: 'deadline', translation: 'oxirgi muddat',
    example: 'The deadline for the report is Friday.', note: "So'zma-so'z 'o'lik chiziq'. Tasodif emas." },
  { id: 'w-procrastinate', ipa: '/prəˈkræs.tɪ.neɪt/', emoji: '🛋️', deck: 'work', word: 'procrastinate', translation: 'ishni paysalga solmoq',
    example: 'Stop procrastinating and start the task.', note: 'Bu so\'zni ertaga yodlayman... 🙂' },
  { id: 'w-postpone', ipa: '/pəʊstˈpəʊn/', emoji: '📅', deck: 'work', word: 'to postpone', translation: 'kechiktirmoq (rasmiy)',
    example: 'The meeting was postponed until Monday.' },
  { id: 'w-thorough', ipa: '/ˈθʌr.ə/', emoji: '🔍', deck: 'work', word: 'thorough', translation: 'puxta, sinchkov',
    example: 'She did a thorough review of the budget.', note: "Oxiridagi -ough 'o' deb o'qiladi." },
  { id: 'w-overwhelmed', ipa: '/ˌəʊ.vəˈwelmd/', emoji: '🤯', deck: 'work', word: 'overwhelmed', translation: 'haddan tashqari bosim ostida',
    example: 'I feel overwhelmed by all these tasks.' },
  { id: 'w-efficient', ipa: '/ɪˈfɪʃ.ənt/', emoji: '⚡', deck: 'work', word: 'efficient', translation: 'samarali',
    example: 'This new process is more efficient.' },
  { id: 'w-estimate', ipa: '/ˈes.tɪ.mət/', emoji: '🧮', deck: 'work', word: 'estimate', translation: 'taxmin, baholash',
    example: 'Can you give me a rough estimate of the costs?' },
  { id: 'w-revenue', ipa: '/ˈrev.ən.juː/', emoji: '💰', deck: 'work', word: 'revenue', translation: 'tushum, daromad',
    example: 'Revenue grew by 12% last quarter.', note: 'Ekonomistlar uchun asosiy so\'z: revenue − costs = profit.' },
  { id: 'w-forecast', ipa: '/ˈfɔː.kɑːst/', emoji: '📈', deck: 'work', word: 'forecast', translation: 'prognoz',
    example: 'The sales forecast for next year looks good.' },
  { id: 'w-allocate', ipa: '/ˈæl.ə.keɪt/', emoji: '🥧', deck: 'work', word: 'to allocate', translation: 'taqsimlamoq, ajratmoq',
    example: 'We need to allocate more budget to marketing.' },
  { id: 'w-feasible', ipa: '/ˈfiː.zə.bəl/', emoji: '✅', deck: 'work', word: 'feasible', translation: 'amalga oshirsa bo\'ladigan',
    example: 'Is this plan feasible with our current team?' },
  { id: 'w-insight', ipa: '/ˈɪn.saɪt/', emoji: '💡', deck: 'work', word: 'insight', translation: 'chuqur tushuncha, xulosa',
    example: 'The data gave us a useful insight into customer behavior.' },

  // ── IT va dasturlash (loyihalarimizda uchragan so'zlar) ──
  { id: 'i-deploy', ipa: '/dɪˈplɔɪ/', emoji: '🚀', deck: 'it', word: 'to deploy', translation: 'serverga joylamoq',
    example: 'We deploy the bot to Railway.', note: 'Telegram botingizni Railway\'ga deploy qilgansiz.' },
  { id: 'i-bug', ipa: '/bʌɡ/', emoji: '🐛', deck: 'it', word: 'bug', translation: 'dasturdagi xato',
    example: 'There is a bug in the login screen.' },
  { id: 'i-debug', ipa: '/ˌdiːˈbʌɡ/', emoji: '🔧', deck: 'it', word: 'to debug', translation: 'xatoni izlab tuzatmoq',
    example: 'Run it in debug mode to see the error.', note: 'Nobu\'dagi run_nobu_debug.bat — shu so\'zdan.' },
  { id: 'i-dependency', ipa: '/dɪˈpen.dən.si/', emoji: '🧩', deck: 'it', word: 'dependency', translation: 'bog\'liqlik (kerakli kutubxona)',
    example: 'Install all dependencies with npm install.', note: 'requirements.txt — Python dependency ro\'yxati.' },
  { id: 'i-repository', ipa: '/rɪˈpɒz.ɪ.tər.i/', emoji: '📦', deck: 'it', word: 'repository (repo)', translation: 'kod ombori',
    example: 'Push your code to the GitHub repository.' },
  { id: 'i-refactor', ipa: '/ˌriːˈfæk.tə/', emoji: '♻️', deck: 'it', word: 'to refactor', translation: 'kodni qayta tartiblamoq (natija o\'zgarmasdan)',
    example: 'We refactored three personas into one character.', note: 'Nobu\'da aynan shunday qildik.' },
  { id: 'i-latency', ipa: '/ˈleɪ.tən.si/', emoji: '🐢', deck: 'it', word: 'latency', translation: 'kechikish (javob vaqti)',
    example: 'Low latency is important for live voice chat.' },
  { id: 'i-scalable', ipa: '/ˈskeɪ.lə.bəl/', emoji: '📶', deck: 'it', word: 'scalable', translation: 'kengaytiriladigan',
    example: 'The server must be scalable for many users.' },
  { id: 'i-backend', ipa: '/ˈbæk.end/', emoji: '🖥️', deck: 'it', word: 'backend', translation: 'server tomoni',
    example: 'The backend is written in Python with FastAPI.' },
  { id: 'i-timeout', ipa: '/ˈtaɪm.aʊt/', emoji: '⌛', deck: 'it', word: 'timeout', translation: 'kutish vaqti tugashi',
    example: 'The request timed out because the phone could not reach the PC.',
    note: 'Expo Go\'dagi birinchi xatoyingiz 🙂' },

  // ── Phrasal verbs ──
  { id: 'p-figure-out', ipa: '/ˌfɪɡ.ər ˈaʊt/', emoji: '🧠', deck: 'phrasal', word: 'to figure out', translation: 'tushunib yetmoq, hal qilmoq',
    example: "I'll figure out why the app crashes." },
  { id: 'p-come-up-with', ipa: '/kʌm ˈʌp wɪð/', emoji: '💭', deck: 'phrasal', word: 'to come up with', translation: 'o\'ylab topmoq',
    example: 'We came up with a new name: Nobu.' },
  { id: 'p-look-into', ipa: '/lʊk ˈɪn.tuː/', emoji: '🔎', deck: 'phrasal', word: 'to look into', translation: 'o\'rganib chiqmoq',
    example: "I'll look into the network problem." },
  { id: 'p-run-out-of', ipa: '/rʌn ˈaʊt əv/', emoji: '🪫', deck: 'phrasal', word: 'to run out of', translation: 'tugab qolmoq',
    example: 'We ran out of time.' },
  { id: 'p-set-up', ipa: '/set ˈʌp/', emoji: '🛠️', deck: 'phrasal', word: 'to set up', translation: 'sozlamoq, o\'rnatmoq',
    example: 'It took an hour to set up the project.' },
  { id: 'p-carry-out', ipa: '/ˌkær.i ˈaʊt/', emoji: '🏗️', deck: 'phrasal', word: 'to carry out', translation: 'bajarmoq, amalga oshirmoq',
    example: 'The team carried out a detailed analysis.' },
  { id: 'p-keep-up-with', ipa: '/kiːp ˈʌp wɪð/', emoji: '🏃', deck: 'phrasal', word: 'to keep up with', translation: 'ortda qolmaslik',
    example: "It's hard to keep up with new technologies." },
  { id: 'p-give-up', ipa: '/ɡɪv ˈʌp/', emoji: '🏳️', deck: 'phrasal', word: 'to give up', translation: 'taslim bo\'lmoq, voz kechmoq',
    example: "Don't give up — fall seven times, rise eight." },
];
