export type FighterArchetype = 'balanced' | 'rushdown' | 'powerhouse' | 'trickster';

export interface Fighter {
  id: string;
  userId: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  currency: number;
  wins: number;
  losses: number;
  selectedCharacter: CharacterDef['id'];
  equipment: Equipment;
  stats: FighterStats;
}

export interface FighterStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface Equipment {
  head: string | null;
  body: string | null;
  weapon: string | null;
  boots: string | null;
}

export interface CharacterDef {
  id: string;
  name: string;
  subtitle: string;
  archetype: FighterArchetype;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  stats: FighterStats;
  specialName: string;
  specialDesc: string;
  icon: string;
  unlockCost: number;
}

export interface Base {
  id: string;
  userId: string;
  name: string;
  demons: Demon[];
  trophies: number;
  lastRaidedAt: number | null;
}

export interface Demon {
  id: string;
  name: string;
  lore: string;
  origin: string;
  abilities: DemonAbility[];
  stats: DemonStats;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  visualTraits: VisualTraits;
  createdAt: number;
}

export interface DemonAbility {
  name: string;
  description: string;
  damage: number;
  cooldown: number;
  type: 'attack' | 'defense' | 'debuff' | 'aura';
}

export interface DemonStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  aggroRange: number;
}

export interface VisualTraits {
  primaryColor: string;
  secondaryColor: string;
  size: 'small' | 'medium' | 'large' | 'massive';
  features: string[];
  glowColor: string;
}

export interface BattleResult {
  won: boolean;
  currencyEarned: number;
  xpEarned: number;
  roundsWon: number;
  opponentName: string;
  opponentCharacter: string;
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'demon_slot';
  slot?: keyof Equipment;
  cost: number;
  statBoosts?: Partial<FighterStats>;
  icon: string;
}
