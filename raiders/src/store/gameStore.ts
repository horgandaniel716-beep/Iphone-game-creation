import { create } from 'zustand';
import type { Fighter, Base, Demon, BattleResult } from '../types';

interface GameState {
  fighter: Fighter | null;
  base: Base | null;
  battleHistory: BattleResult[];

  setFighter: (fighter: Fighter) => void;
  setBase: (base: Base) => void;
  addCurrency: (amount: number) => void;
  addXP: (amount: number) => void;
  addDemon: (demon: Demon) => void;
  removeDemon: (demonId: string) => void;
  recordBattle: (result: BattleResult) => void;
  reset: () => void;
}

function xpForLevel(level: number): number {
  return 500 * level;
}

export const useGameStore = create<GameState>((set) => ({
  fighter: null,
  base: null,
  battleHistory: [],

  setFighter: (fighter) => set({ fighter }),
  setBase: (base) => set({ base }),

  addCurrency: (amount) =>
    set((state) => {
      if (!state.fighter) return {};
      return { fighter: { ...state.fighter, currency: Math.max(0, state.fighter.currency + amount) } };
    }),

  addXP: (amount) =>
    set((state) => {
      if (!state.fighter) return {};
      let { xp, level } = state.fighter;
      xp += amount;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
      }
      return { fighter: { ...state.fighter, xp, level } };
    }),

  addDemon: (demon) =>
    set((state) => {
      if (!state.base) return {};
      return { base: { ...state.base, demons: [...state.base.demons, demon] } };
    }),

  removeDemon: (demonId) =>
    set((state) => {
      if (!state.base) return {};
      return { base: { ...state.base, demons: state.base.demons.filter((d) => d.id !== demonId) } };
    }),

  recordBattle: (result) =>
    set((state) => {
      if (!state.fighter) return {};
      const wins = state.fighter.wins + (result.won ? 1 : 0);
      const losses = state.fighter.losses + (result.won ? 0 : 1);
      return {
        battleHistory: [result, ...state.battleHistory].slice(0, 50),
        fighter: { ...state.fighter, wins, losses },
      };
    }),

  reset: () => set({ fighter: null, base: null, battleHistory: [] }),
}));
