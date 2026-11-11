// @ts-nocheck -- Node skripti (GitHub Actions), esbuild bilan yigiladi; ilova tsconfigida Node tiplari yoq.
/**
 * chess_cloud.ts — GitHub Actions'da (har soatda): chess.com'dan yangi o'yinlarni olib, haqiqiy Stockfish (16, native) bilan
 * tahlil qiladi va natijani chess-data bo'limiga yozadi. Ilova shu tayyor tahlilni yuklab oladi — telefonda hisoblash shart emas.
 * Qoidalar telefondagi bilan bir xil (analyseGame), faqat chuqurroq: depth 18.
 *
 * Ishga tushirish: node cc.js <user> <chiqish papkasi>   (CC_MOCK=papka — chess.com o'rniga mahalliy json, test uchun)
 */

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

import { analyseGame, fetchNew, fresh, type ComGame, type GameAn } from '@/features/chess/chesscom';
import { attachEngine, engineLine } from '@/features/chess/engine/engine';

const USER = process.argv[2] ?? 'Abomuslim0';
const OUT = process.argv[3] ?? '/tmp/chess-out';
const RAW = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY ?? 'Abomuslim799/Nobu'}/chess-data/${USER.toLowerCase()}.json`;
const BUDGET = Number(process.env.CC_MINUTES ?? 45) * 60000;   // bir ishga tushishda ko'pi bilan — qolgani keyingi soatda
const DEPTH = Number(process.env.CC_DEPTH ?? 18), MOVETIME = Number(process.env.CC_MS ?? 1000);
const FIRST = 200;                                              // birinchi marta olinadigan o'yinlar soni

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
  sf.stdin.write('setoption name Threads value 4\nsetoption name Hash value 256\n');

  let data: CloudData = { user: USER, updated: 0, games: [], an: {} };
  if (!process.env.CC_MOCK) {
    try { const r = await fetch(`${RAW}?t=${Date.now()}`); if (r.ok) data = await r.json(); } catch { /* birinchi marta */ }
  }
  const have = new Set(data.games.map((g) => g.id));
  const got = await fetchNew(USER, have, data.games.length ? 100 : FIRST);
  data.games = [...data.games, ...got].sort((a, b) => b.at - a.at);
  console.log(`o'yinlar: ${data.games.length} (yangi ${got.length})`);

  const todo = data.games.filter((g) => !fresh(data.an[g.id]));
  let n = 0;
  for (const g of todo) {
    if (Date.now() - t0 > BUDGET) { console.log('vaqt tugadi — qolgani keyingi safar'); break; }
    data.an[g.id] = { ...(await analyseGame(g, undefined, MOVETIME, [], undefined, DEPTH)), src: 'cloud' };
    n++;
    console.log(`tahlil ${n}/${todo.length}: ${g.oppName} · aniqlik ${data.an[g.id].acc}%`);
  }
  data.updated = Date.now();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${USER.toLowerCase()}.json`, JSON.stringify(data));
  console.log(`tayyor: ${n} ta tahlil, ${Math.round((Date.now() - t0) / 1000)} s`);
  sf.stdin.write('quit\n');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
