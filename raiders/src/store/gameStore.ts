import { create } from 'zustand';
import type { Raider, Base, Demon, BattleResult } from '../types';

interface GameState {
  raider: Raider | null;
  base: Base | null;
  battleHistory: BattleResult[];
  isInBattle: boolean;

  setRaider: (raider: Raider) => void;
  setBase: (base: Base) => void;
  addCurrency: (amount: number) => void;
  addXP: (amount: number) => void;
  addDemon: (demon: Demon) => void;
  removeDemon: (demonId: string) => void;
  recordBattle: (result: BattleResult) => void;
  setInBattle: (val: boolean) => void;
  reset: () => void;
}

const BASE_XP_PER_LEVEL = 500;

function xpForLevel(level: number): number {
  return BASE_XP_PER_LEVEL * level;
}

export const useGameStore = create<GameState>((set) => ({
  raider: null,
  base: null,
  battleHistory: [],
  isInBattle: false,

  setRaider: (raider) => set({ raider }),
  setBase: (base) => set({ base }),

  addCurrency: (amount) =>
    set((state) => {
      if (!state.raider) return {};
      return { raider: { ...state.raider, currency: state.raider.currency + amount } };
    }),

  addXP: (amount) =>
    set((state) => {
      if (!state.raider) return {};
      let { xp, level } = state.raider;
      xp += amount;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
      }
      return { raider: { ...state.raider, xp, level } };
    }),

  addDemon: (demon) =>
    set((state) => {
      if (!state.base) return {};
      const demons = [...state.base.demons, demon];
      return { base: { ...state.base, demons } };
    }),

  removeDemon: (demonId) =>
    set((state) => {
      if (!state.base) return {};
      const demons = state.base.demons.filter((d) => d.id !== demonId);
      return { base: { ...state.base, demons } };
    }),

  recordBattle: (result) =>
    set((state) => {
      if (!state.raider) return {};
      const wins = state.raider.wins + (result.won ? 1 : 0);
      const losses = state.raider.losses + (result.won ? 0 : 1);
      return {
        battleHistory: [result, ...state.battleHistory].slice(0, 50),
        raider: { ...state.raider, wins, losses },
      };
    }),

  setInBattle: (val) => set({ isInBattle: val }),

  reset: () => set({ raider: null, base: null, battleHistory: [], isInBattle: false }),
}));
