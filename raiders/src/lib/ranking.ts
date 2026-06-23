import type { Rank, RankTier } from '../types';

export const RANK_TIERS: { tier: RankTier; label: string; icon: string; color: string; minMmr: number; maxMmr: number }[] = [
  { tier: 'bronze',      label: 'Bronze',      icon: '🥉', color: '#cd7f32', minMmr: 0,    maxMmr: 999  },
  { tier: 'silver',      label: 'Silver',      icon: '🥈', color: '#c0c0c0', minMmr: 1000, maxMmr: 1999 },
  { tier: 'gold',        label: 'Gold',        icon: '🥇', color: '#ffd700', minMmr: 2000, maxMmr: 2999 },
  { tier: 'platinum',    label: 'Platinum',    icon: '💎', color: '#4af',    minMmr: 3000, maxMmr: 3999 },
  { tier: 'diamond',     label: 'Diamond',     icon: '💠', color: '#00d4ff', minMmr: 4000, maxMmr: 4999 },
  { tier: 'master',      label: 'Master',      icon: '🔮', color: '#b44aff', minMmr: 5000, maxMmr: 5999 },
  { tier: 'grandmaster', label: 'Grandmaster', icon: '👑', color: '#ff9000', minMmr: 6000, maxMmr: 6999 },
  { tier: 'legend',      label: 'Legend',      icon: '🌟', color: '#ff2d78', minMmr: 7000, maxMmr: 99999 },
];

export function defaultRank(): Rank {
  return { tier: 'bronze', division: 4, mmr: 0, peakMmr: 0, season: 1 };
}

export function getRankInfo(tier: RankTier) {
  return RANK_TIERS.find((r) => r.tier === tier) ?? RANK_TIERS[0];
}

export function mmrToRank(mmr: number): Rank {
  const info = [...RANK_TIERS].reverse().find((r) => mmr >= r.minMmr) ?? RANK_TIERS[0];
  const range = info.maxMmr - info.minMmr;
  const progress = mmr - info.minMmr;
  const divisionSize = range / 4;
  const division = (4 - Math.min(3, Math.floor(progress / divisionSize))) as 1 | 2 | 3 | 4;
  return { tier: info.tier, division, mmr, peakMmr: mmr, season: 1 };
}

export function calculateMmrChange(won: boolean, myMmr: number, opponentMmr: number): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentMmr - myMmr) / 400));
  const actual = won ? 1 : 0;
  return Math.round(K * (actual - expected));
}

export function getRankDisplayString(rank: Rank): string {
  const info = getRankInfo(rank.tier);
  if (rank.tier === 'legend' || rank.tier === 'grandmaster') {
    return `${info.icon} ${info.label}`;
  }
  return `${info.icon} ${info.label} ${rank.division}`;
}
