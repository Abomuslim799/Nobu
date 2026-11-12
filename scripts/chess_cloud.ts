// @ts-nocheck -- Node skripti (GitHub Actions), esbuild bilan yigiladi; ilova tsconfigida Node tiplari yoq.
/**
 * chess_cloud.ts — Railway serverida (har soatda va "Hozir tahlil qil" tugmasida): chess.com'dan yangi o'yinlarni olib,
 * rasmiy Stockfish bilan tahlil qiladi va natijani faylga yozadi. Ilova tayyor tahlilni serverdan oladi.
 * Qoidalar telefondagi bilan bir xil (analyseGame), faqat chuqurroq: depth 18. Sayt (site.yml) uni dist/chess/cc.js ga yig'adi.
 *
 * Ishga tushirish: node cc.js <user> <chiqish papkasi>
 *   CC_IN — oldingi natija fayli (bo'lmasa chess-data bo'limidagi eski GitHub natijasi urug' sifatida olinadi)
 *   STOCKFISH, CC_THREADS, CC_MINUTES, CC_DEPTH, CC_MS; CC_MOCK=papka — chess.com o'rniga mahalliy json (test)
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

import { analyseGame, fetchNew, fresh, type ComGame, type GameAn } from '@/features/chess/chesscom';
import { attachEngine, engineLine } from '@/features/chess/engine/engine';

const USER = process.argv[2] ?? 'Abomuslim0';
const OUT = process.argv[3] ?? '/tmp/chess-out';
const RAW = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY ?? 'Abomuslim799/Nobu'}/chess-data/${USER.toLowerCase()}.json`;
const BUDGET = Number(process.env.CC_MINUTES ?? 45) * 60000;   // bir ishga tushishda ko'pi bilan — qolgani keyingi soatda
const DEPTH = Number(process.env.CC_DEPTH ?? 18), MOVETIME = Number(process.env.CC_MS ?? 1000);
const FIRST = 60;                                               // birinchi marta: telefondagi ~55 ta va yangilari

export interface CloudData { user: string; updated: number; games: ComGame[]; an: Record<string, GameAn> }

if (process.env.CC_MOCK) {                                       // test: chess.com javoblari papkadan
  const dir = process.env.CC_MOCK;
  globalThis.fetch = (async (u: string) => {
    const f = String(u).includes('/archives') ? 'arch.json' : 'month.json';
    return new Response(readFileSync(`${dir}/${f}`, 'utf8'), { status: 200 });
  }) as typeof fetch;
}

async function main() {
  const t0 = Date.now();
  const sf = spawn(process.env.STOCKFISH ?? '/usr/games/stockfish');
  createInterface({ input: sf.stdout }).on('line', engineLine);
  attachEngine((c) => sf.stdin.write(c + '\n'));
  sf.stdin.write(`setoption name Threads value ${process.env.CC_THREADS ?? 2}\nsetoption name Hash value 128\n`);

  let data: CloudData = { user: USER, updated: 0, games: [], an: {} };
  const IN = process.env.CC_IN;
  if (IN && existsSync(IN)) data = JSON.parse(readFileSync(IN, 'utf8'));
  else if (!process.env.CC_MOCK) {
    try { const r = await fetch(`${RAW}?t=${Date.now()}`); if (r.ok) data = await r.json(); } catch { /* birinchi marta */ }
  }
  const save = () => { data.updated = Date.now(); mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/${USER.toLowerCase()}.json`, JSON.stringify(data)); };
  const have = new Set(data.games.map((g) => g.id));
  const got = await fetchNew(USER, have, data.games.length ? 100 : FIRST);
  data.games = [...data.games, ...got].sort((a, b) => b.at - a.at);
  console.log(`o'yinlar: ${data.games.length} (yangi ${got.length}) · navbat ${data.games.filter((g) => !fresh(data.an[g.id])).length}`);

  const todo = data.games.filter((g) => !fresh(data.an[g.id]));
  let n = 0;
  for (const g of todo) {
    if (Date.now() - t0 > BUDGET) { console.log('vaqt tugadi — qolgani keyingi safar'); break; }
    data.an[g.id] = { ...(await analyseGame(g, undefined, MOVETIME, [], undefined, DEPTH)), src: 'cloud' };
    n++;
    console.log(`tahlil ${n}/${todo.length}: ${g.oppName} · aniqlik ${data.an[g.id].acc}%`);
    save();                                          // har o'yindan keyin — ilova darhol ko'radi
  }
  save();
  console.log(`tayyor: ${n} ta tahlil, ${Math.round((Date.now() - t0) / 1000)} s`);
  sf.stdin.write('quit\n');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
