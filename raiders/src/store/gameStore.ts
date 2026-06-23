import { create } from 'zustand';
import type { Fighter, Base, Demon, BattleResult } from '../types';
import { defaultRank, mmrToRank, calculateMmrChange } from '../lib/ranking';

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
  recordBattle: (result: BattleResult, opponentMmr?: number) => void;
  unlockMove: (moveId: string, cost: number) => void;
  equipWeapon: (slot: 1 | 2, weaponId: string | null) => void;
  reset: () => void;
}

function xpForLevel(level: number): number {
  return 500 * level;
}

export const useGameStore = create<GameState>((set) => ({
  fighter: null,
  base: null,
  battleHistory: [],

  setFighter: (fighter) => set({
    fighter: {
      ...fighter,
      rank: fighter.rank ?? defaultRank(),
      unlockedMoves: fighter.unlockedMoves ?? ['jab', 'low_kick'],
      weaponSlot1: fighter.weaponSlot1 ?? null,
      weaponSlot2: fighter.weaponSlot2 ?? null,
    },
  }),

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

  recordBattle: (result, opponentMmr) =>
    set((state) => {
      if (!state.fighter) return {};
      const wins = state.fighter.wins + (result.won ? 1 : 0);
      const losses = state.fighter.losses + (result.won ? 0 : 1);

      let rank = state.fighter.rank ?? defaultRank();
      if (opponentMmr !== undefined) {
        const mmrChange = calculateMmrChange(result.won, rank.mmr, opponentMmr);
        const newMmr = Math.max(0, rank.mmr + mmrChange);
        rank = { ...mmrToRank(newMmr), peakMmr: Math.max(rank.peakMmr, newMmr), season: rank.season };
        result = { ...result, mmrChange };
      }

      return {
        battleHistory: [result, ...state.battleHistory].slice(0, 50),
        fighter: { ...state.fighter, wins, losses, rank },
      };
    }),

  unlockMove: (moveId, cost) =>
    set((state) => {
      if (!state.fighter) return {};
      if ((state.fighter.currency) < cost) return {};
      const unlockedMoves = [...(state.fighter.unlockedMoves ?? [])];
      if (unlockedMoves.includes(moveId)) return {};
      return {
        fighter: {
          ...state.fighter,
          currency: state.fighter.currency - cost,
          unlockedMoves: [...unlockedMoves, moveId],
        },
      };
    }),

  equipWeapon: (slot, weaponId) =>
    set((state) => {
      if (!state.fighter) return {};
      return {
        fighter: {
          ...state.fighter,
          weaponSlot1: slot === 1 ? weaponId : state.fighter.weaponSlot1,
          weaponSlot2: slot === 2 ? weaponId : state.fighter.weaponSlot2,
        },
      };
    }),

  reset: () => set({ fighter: null, base: null, battleHistory: [] }),
}));
