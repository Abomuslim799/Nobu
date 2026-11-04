/**
 * engine.ts — Stockfish 10 (asm.js) bilan ishlash: telefonda yashirin WebView ichidagi Worker'da (host.tsx),
 * brauzerda — to'g'ridan-to'g'ri Worker'da. Internetsiz ishlaydi.
 * So'rovlar navbat bilan bajariladi: analyse (baho va eng yaxshi variant) va play (bot yurishi, Skill Level bilan).
 */

import { Platform } from 'react-native';

export interface Info { cp?: number; mate?: number; depth: number; pv: string[]; best: string }   // baho — yurish navbatidagi tomon nuqtai nazaridan

type Send = (cmd: string) => void;
let send: Send | null = null;
let ready = false;
const waiters: (() => void)[] = [];
let onLine: ((l: string) => void) | null = null;

/** Transportdan kelgan har bir qator. */
export function engineLine(l: string) {
  if (l === '__ready' || l.startsWith('uciok')) { if (!ready) { ready = true; waiters.splice(0).forEach((f) => f()); } return; }
  onLine?.(l);
}
/** Transportni ulash (host.tsx yoki web Worker). */
export function attachEngine(s: Send | null) {
  send = s; ready = false;
  if (s) s('uci');
}

// Brauzer: to'g'ridan-to'g'ri Worker
let webWorker: Worker | null = null;
export function ensureWebEngine() {
  if (Platform.OS !== 'web' || webWorker) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SF: string = require('@/features/chess/engine/sf10').default;
  webWorker = new Worker(URL.createObjectURL(new Blob([SF], { type: 'application/javascript' })));
  webWorker.onmessage = (e) => engineLine(String(e.data));
  attachEngine((c) => webWorker?.postMessage(c));
}

const whenReady = () => (ready ? Promise.resolve() : new Promise<void>((r) => waiters.push(r)));
let chain: Promise<unknown> = Promise.resolve();
function job<T>(run: () => Promise<T>): Promise<T> {
  const p = chain.then(run, run);
  chain = p.catch(() => {});
  return p;
}

function go(fen: string, goCmd: string, skill: number, timeoutMs: number): Promise<Info> {
  return job(async () => {
    await whenReady();
    return new Promise<Info>((resolve) => {
      let last: Info = { depth: 0, pv: [], best: '' };
      const done = (best: string) => { onLine = null; clearTimeout(t); resolve({ ...last, best: best || last.pv[0] || '' }); };
      const t = setTimeout(() => { send?.('stop'); }, timeoutMs);
      onLine = (l) => {
        if (l.startsWith('info') && l.includes(' pv ') && !l.includes('lowerbound') && !l.includes('upperbound')) {
          const d = Number(/ depth (\d+)/.exec(l)?.[1] ?? 0);
          const cp = / score cp (-?\d+)/.exec(l), mate = / score mate (-?\d+)/.exec(l);
          const pv = (/ pv (.+)$/.exec(l)?.[1] ?? '').trim().split(/\s+/);
          if (/ multipv (\d+)/.exec(l)?.[1] && / multipv (\d+)/.exec(l)?.[1] !== '1') return;
          last = { depth: d, pv, best: pv[0], cp: cp ? Number(cp[1]) : undefined, mate: mate ? Number(mate[1]) : undefined };
        } else if (l.startsWith('bestmove')) done(l.split(/\s+/)[1] === '(none)' ? '' : l.split(/\s+/)[1]);
      };
      send?.(`setoption name Skill Level value ${skill}`);
      send?.(`position fen ${fen}`);
      send?.(goCmd);
    });
  });
}

/** Pozitsiyani baholash (to'liq kuch). */
export const analyse = (fen: string, movetime = 900, depth = 18) => go(fen, `go depth ${depth} movetime ${movetime}`, 20, movetime + 3000);
/** Bot yurishi: kuch — Skill Level va chuqurlik bilan cheklanadi. */
export const botMove = (fen: string, p: { skill: number; depth: number; movetime: number }) =>
  go(fen, `go depth ${p.depth} movetime ${p.movetime}`, p.skill, p.movetime + 3000).then((i) => i.best);
export const engineReady = () => ready;
