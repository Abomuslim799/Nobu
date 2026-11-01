/** O'yinlar ro'yxati: catalog.ts dagi id → komponent. */
import type { ReactNode } from 'react';

import { ChessPuzzles } from './chess';
import type { GameProps } from './kit';
import { LogicAI } from './logic';
import { MemoryGrid } from './memory-grid';
import { NBack } from './n-back';
import { Reaction } from './reaction';
import { Sequence } from './sequence';
import { SpeedMath } from './speed-math';
import { Stroop } from './stroop';
import { Sudoku } from './sudoku';

export const GAME_COMPONENTS: Record<string, (p: GameProps) => ReactNode> = {
  chess: ChessPuzzles, sequence: Sequence, sudoku: Sudoku, 'logic-ai': LogicAI, 'memory-grid': MemoryGrid,
  'n-back': NBack, stroop: Stroop, 'speed-math': SpeedMath, reaction: Reaction,
};
