import type { Fighter, CharacterDef } from '../types';
import { CHARACTERS } from './characters';

export interface Boss {
  id: string;
  name: string;
  title: string;
  lore: string;
  icon: string;
  color: string;
  glowColor: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  difficultyLabel: string;
  rewards: { currency: number; xp: number; itemDesc: string };
  statMultiplier: number;  // multiplied onto base character stats
  characterId: string;
  locked: boolean;
  lockedReason?: string;
  specialRules: string[];
}

export const BOSSES: Boss[] = [
  {
    id: 'iron_mike',
    name: 'IRON MIKE',
    title: 'The Punisher',
    lore: 'Retired champion. Undefeated in 22 consecutive fights. Came out of retirement when someone said his name wrong.',
    icon: '🥊',
    color: '#e74c3c',
    glowColor: '#ff2200',
    difficulty: 1,
    difficultyLabel: 'STREET',
    rewards: { currency: 200, xp: 300, itemDesc: 'Iron Fist Trinket' },
    statMultiplier: 1.4,
    characterId: 'titan',
    locked: false,
    specialRules: ['50% more HP', 'Heavy hits knock you down guaranteed'],
  },
  {
    id: 'shadow_queen',
    name: 'SHADOW QUEEN',
    title: 'The Unseen',
    lore: 'Nobody knows her real name. She fights in the dark and wins before you realize you lost.',
    icon: '👁️',
    color: '#9b59b6',
    glowColor: '#8800ff',
    difficulty: 2,
    difficultyLabel: 'UNDERGROUND',
    rewards: { currency: 400, xp: 600, itemDesc: 'Shadow Eye Trinket (Rare)' },
    statMultiplier: 1.7,
    characterId: 'phantom',
    locked: false,
    specialRules: ['Goes invisible every 10 seconds', 'Teleports behind you on special'],
  },
  {
    id: 'electric_god',
    name: 'ELECTRIC GOD',
    title: 'The Circuit',
    lore: 'Moves so fast the cameras miss frames. Scientists want to study him. He just wants to fight.',
    icon: '⚡',
    color: '#f1c40f',
    glowColor: '#ffdd00',
    difficulty: 3,
    difficultyLabel: 'STADIUM',
    rewards: { currency: 700, xp: 1000, itemDesc: 'Thunder Bead (Epic)' },
    statMultiplier: 2.0,
    characterId: 'apex',
    locked: false,
    specialRules: ['Speed doubled', 'Lightning strikes randomly during fight'],
  },
  {
    id: 'war_god',
    name: 'WAR GOD',
    title: 'The Destroyer',
    lore: 'Ancient warrior. They say he cannot die. Multiple fighters have tried to prove them wrong.',
    icon: '⚔️',
    color: '#e67e22',
    glowColor: '#ff8800',
    difficulty: 4,
    difficultyLabel: 'COLOSSEUM',
    rewards: { currency: 1200, xp: 1800, itemDesc: 'War God Trophy (Legendary)' },
    statMultiplier: 2.5,
    characterId: 'titan',
    locked: true,
    lockedReason: 'Defeat Electric God first',
    specialRules: ['Starts fight with full Super meter', 'Cannot be knocked down', 'Regenerates 5 HP per second'],
  },
  {
    id: 'the_void',
    name: 'THE VOID',
    title: 'End of All Things',
    lore: 'Not a person. A force. Appeared in the tournament brackets one day. No one has beaten it.',
    icon: '🌀',
    color: '#ff2d78',
    glowColor: '#ff00aa',
    difficulty: 5,
    difficultyLabel: 'LEGEND',
    rewards: { currency: 5000, xp: 10000, itemDesc: 'Void Crown — Rarest item in the game' },
    statMultiplier: 3.5,
    characterId: 'phantom',
    locked: true,
    lockedReason: 'Defeat War God first',
    specialRules: ['3x HP', 'Full super every 15 seconds', 'Dimension pulls you to center', 'Gets stronger as your HP drops'],
  },
];

export function makeBossFighter(boss: Boss): Fighter {
  const char = CHARACTERS.find((c) => c.id === boss.characterId) ?? CHARACTERS[0];
  return {
    id: 'boss_' + boss.id,
    userId: 'boss',
    name: boss.name,
    tag: boss.title.toUpperCase().split(' ').map((w) => w[0]).join(''),
    level: 50 + boss.difficulty * 10,
    xp: 0,
    currency: 0,
    wins: 999,
    losses: 0,
    selectedCharacter: boss.characterId,
    equipment: { head: null, body: null, weapon: null, boots: null },
    stats: {
      health: Math.round(char.stats.health * boss.statMultiplier),
      attack: Math.round(char.stats.attack * boss.statMultiplier),
      defense: Math.round(char.stats.defense * boss.statMultiplier),
      speed: Math.round(char.stats.speed * (boss.id === 'electric_god' ? boss.statMultiplier * 1.5 : boss.statMultiplier)),
    },
    rank: { tier: 'legend', division: 1, mmr: 9999, peakMmr: 9999, season: 1 },
  };
}
