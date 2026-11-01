/** O'yinlar ro'yxati: catalog.ts dagi id → komponent. */
import type { ReactNode } from 'react';

import { ChessPuzzles } from '@/features/brain/games/chess';
import type { GameProps } from '@/features/brain/games/kit';
import { LogicAI } from '@/features/brain/games/logic';
import { MemoryGrid } from '@/features/brain/games/memory-grid';
import { NBack } from '@/features/brain/games/n-back';
import { Reaction } from '@/features/brain/games/reaction';
import { Sequence } from '@/features/brain/games/sequence';
import { SpeedMath } from '@/features/brain/games/speed-math';
import { Stroop } from '@/features/brain/games/stroop';
import { Sudoku } from '@/features/brain/games/sudoku';

export const GAME_COMPONENTS: Record<string, (p: GameProps) => ReactNode> = {
  chess: ChessPuzzles, sequence: Sequence, sudoku: Sudoku, 'logic-ai': LogicAI, 'memory-grid': MemoryGrid,
  'n-back': NBack, stroop: Stroop, 'speed-math': SpeedMath, reaction: Reaction,
};
