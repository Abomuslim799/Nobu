/**
 * types.ts — komiks dars (manga uslubi, "limited animation"): sahna → kadrlar (shot) → galma-gal almashadigan rasmlar.
 *   Kam rasm, ko'p harakat: bir lahza uchun 2–3 rasm, ular bir necha marta almashadi — deyarli video.
 *   Rasm hozircha emoji (sprite); keyin haqiqiy manga rasmi qo'yiladigan bo'lsa — Sprite.img.
 */

export type Sfx = 'boom' | 'whoosh' | 'pop' | 'ding' | 'bonk';

/** Kadrdagi bitta rasm: markaz (x, y) 0..1, s — panel kengligiga nisbatan o'lcham. */
export interface Sprite { e: string; x: number; y: number; s?: number; r?: number; flip?: boolean; img?: string }

export interface Shot {
  frames: Sprite[][];                 // galma-gal almashadigan rasmlar
  ms?: number;                        // bitta rasm davomiyligi (standart 380)
  loops?: number;                     // necha marta aylanadi (standart 2)
  hold?: number;                      // oxirida qo'shimcha kutish (ms)
  bg?: string;                        // panel foni
  sfx?: Sfx;                          // kadr boshida effekt ovozi
  fx?: ('speed' | 'impact' | 'shake')[];
  bubble?: { text: string; x: number; y: number };   // pufakcha (inglizcha)
  sound?: { text: string; x: number; y: number };    // onomatopeya: BOOM!!
  say?: string;                       // ovozda o'qiladi (inglizcha)
  caption?: string;                   // panel ostidagi qisqa matn
  sub?: string;                       // o'zbekcha subtitr — faqat qiyin joyda
  timeline?: { kind: 'point' | 'line' | 'line+point' | 'arrow'; at: number; from?: number; label?: string };
  sentence?: { text: string; hi: string[] };         // gap; hi — rangli (kalit/urg'uli) so'zlar
}

export interface Scene { id: string; title: string; shots: Shot[] }
