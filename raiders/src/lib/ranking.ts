import type { Rank, RankTier } from '../types';

export const RANK_TIERS: {
  tier: RankTier;
  label: string;
  icon: string;
  color: string;
  minMmr: number;
  maxMmr: number;
  flavor: string;       // short vibe line shown in UI
  fightStyle: string;   // shown in scouting/arena
  winLine: string;      // post-KO text
  loseLine: string;     // post-KO text
}[] = [
  {
    tier: 'scrapper',
    label: 'Scrapper',
    icon: '🩸',
    color: '#c0392b',
    minMmr: 0,
    maxMmr: 999,
    flavor: 'Out here tryin to make a name',
    fightStyle: 'Raw & desperate — anything goes',
    winLine: 'Send em home leaking',
    loseLine: 'You got rocked, get back up',
  },
  {
    tier: 'goon',
    label: 'Goon',
    icon: '🔱',
    color: '#e67e22',
    minMmr: 1000,
    maxMmr: 1999,
    flavor: 'Word spreadin about you in the block',
    fightStyle: 'Reckless aggression, no gameplan',
    winLine: 'They know your name now',
    loseLine: 'Got caught slipping',
  },
  {
    tier: 'stick',
    label: 'Stick',
    icon: '🗡️',
    color: '#f1c40f',
    minMmr: 2000,
    maxMmr: 2999,
    flavor: 'You got hands and you know it',
    fightStyle: 'Street pressure, starting to learn range',
    winLine: 'Hands too heavy for em',
    loseLine: 'They out-fundamentaled you',
  },
  {
    tier: 'menace',
    label: 'Menace',
    icon: '⚡',
    color: '#2ecc71',
    minMmr: 3000,
    maxMmr: 3999,
    flavor: 'People duckin your matchup',
    fightStyle: 'Smart pressure, reading habits',
    winLine: 'They dodged you for a reason',
    loseLine: 'Got exposed. Adapt or stay stuck',
  },
  {
    tier: 'problem',
    label: 'Problem',
    icon: '🔥',
    color: '#1abc9c',
    minMmr: 4000,
    maxMmr: 4999,
    flavor: 'Coaches put you on film',
    fightStyle: 'Calculated — mixing setups with power',
    winLine: 'Cooked em on both sides of the screen',
    loseLine: 'They scouted you. Fix the holes',
  },
  {
    tier: 'technician',
    label: 'Technician',
    icon: '🔬',
    color: '#9b59b6',
    minMmr: 5000,
    maxMmr: 5999,
    flavor: 'Every move got a reason behind it',
    fightStyle: 'Frame data, punishes, optimal routes',
    winLine: 'Perfect execution. They never had a chance',
    loseLine: 'The gap was technical. Go lab it',
  },
  {
    tier: 'sovereign',
    label: 'Sovereign',
    icon: '👑',
    color: '#e8c84a',
    minMmr: 6000,
    maxMmr: 6999,
    flavor: 'The city knows your rank',
    fightStyle: 'Disciplined — suffocating neutral control',
    winLine: 'Methodical. They couldn\'t breathe',
    loseLine: 'Even kings fall. Study the tape',
  },
  {
    tier: 'legend',
    label: 'Legend',
    icon: '🌟',
    color: '#ff2d78',
    minMmr: 7000,
    maxMmr: 99999,
    flavor: 'Your name is the scouting report',
    fightStyle: 'Transcendent — opponents crack before touch',
    winLine: 'Another one. Send the next one.',
    loseLine: 'That loss becomes lore',
  },
];

export function defaultRank(): Rank {
  return { tier: 'scrapper', division: 4, mmr: 0, peakMmr: 0, season: 1 };
}

export function getRankInfo(tier: RankTier) {
  return RANK_TIERS.find((r) => r.tier === tier) ?? RANK_TIERS[0];
}

export function mmrToRank(mmr: number): Rank {
  const info = [...RANK_TIERS].reverse().find((r) => mmr >= r.minMmr) ?? RANK_TIERS[0];
  const range = info.maxMmr === 99999 ? 1000 : info.maxMmr - info.minMmr;
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
  if (rank.tier === 'legend' || rank.tier === 'sovereign') {
    return `${info.icon} ${info.label}`;
  }
  return `${info.icon} ${info.label} ${rank.division}`;
}

// Returns true if this rank tier is "street" level (raw, scrappy feel)
export function isStreetTier(tier: RankTier): boolean {
  return tier === 'scrapper' || tier === 'goon' || tier === 'stick';
}

// Returns true if this rank tier is "tech" level (disciplined, clinical feel)
export function isTechTier(tier: RankTier): boolean {
  return tier === 'technician' || tier === 'sovereign' || tier === 'legend';
}

export function getRankProgressPercent(mmr: number): number {
  const info = [...RANK_TIERS].reverse().find((r) => mmr >= r.minMmr) ?? RANK_TIERS[0];
  const range = info.maxMmr === 99999 ? 1000 : info.maxMmr - info.minMmr;
  return Math.min(100, Math.round(((mmr - info.minMmr) / range) * 100));
}
