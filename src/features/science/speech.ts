/**
 * speech.ts — darsdagi matnni ovoz uchun tayyorlash (Ustoz ovozi — Gemini Iapetus).
 * Formulalar so'z bilan, o'zbekcha tutuq belgilari to'g'ri (oʻ, gʻ), yolg'iz harflar nomi bilan (x → iks).
 * scripts/make_audio.py dagi say_text bilan bir xil qoidalar.
 */

const RULES: [RegExp, string][] = [
  [/(?<=[oOgG])['’`‘]/g, 'ʻ'],
  [/(?<=\p{L})['’](?=\p{L})/gu, 'ʼ'],
  [/km\/soat/g, 'kilometr soatiga'], [/m\/s²/g, 'metr sekund kvadratga'], [/m\/s/g, 'metr sekundiga'],
  [/Δ\s*/g, 'delta '], [/²/g, ' kvadrat'], [/³/g, ' kub'], [/√/g, ' ildiz '], [/π/g, ' pi '], [/θ/g, ' teta '],
  [/α/g, ' alfa '], [/′/g, ' shtrix'], [/[·×]/g, ' karra '], [/∫/g, ' integral '], [/Σ/g, ' yigʻindi '],
  [/∞/g, ' cheksizlik '], [/≈/g, ' taxminan '], [/→/g, ', '], [/−/g, ' minus '], [/\s\+\s/g, ' plyus '],
  [/\s=\s|=/g, ' teng '], [/\s<\s/g, ' kichik '], [/\s>\s/g, ' katta '], [/°/g, ' gradus'], [/%/g, ' foiz'],
  [/₀/g, ' nol'], [/ₓ/g, ' iks'], [/±/g, ' plyus-minus '],
  [/(?<=\d)x(?![\p{L}ʻʼ])/gu, ' iks'], [/(?<=\d)y(?![\p{L}ʻʼ])/gu, ' igrek'],
  [/(?<=[\p{L}\d])\s*\/\s*(?=[\p{L}\d])/gu, ' boʻlinsin '],
  [/[()[\]{}|]/g, ' '], [/\blim\b/g, 'limit'],
];
const LETTERS: Record<string, string> = { x: 'iks', y: 'igrek', f: 'ef', g: 'ge', h: 'ha', k: 'ka', t: 'te', v: 've', L: 'el', F: 'ef', T: 'te', H: 'ha' };

export function sayText(t: string): string {
  for (const [rx, rep] of RULES) t = t.replace(rx, rep);
  t = t.replace(/(?<![\p{L}\d_ʻʼ'’])([xyfghktvLFTH])(?![\p{L}\d_ʻʼ'’])/gu, (_, c: string) => LETTERS[c]);
  return t.replace(/\s+/g, ' ').trim();
}
