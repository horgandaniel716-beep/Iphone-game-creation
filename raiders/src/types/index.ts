export type FighterArchetype = 'balanced' | 'rushdown' | 'powerhouse' | 'trickster' | 'assassin' | 'tank' | 'zoner' | 'summoner';

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' | 'legend';

export interface Rank {
  tier: RankTier;
  division: 1 | 2 | 3 | 4;
  mmr: number;
  peakMmr: number;
  season: number;
}

export type MoveTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'overpowered';

export type MoveCategory = 'strike' | 'grab' | 'counter' | 'air' | 'projectile' | 'combo' | 'finisher' | 'special' | 'super';

export interface Move {
  id: string;
  name: string;
  description: string;
  tier: MoveTier;
  category: MoveCategory;
  damage: number;
  unlockCost: number;
  unlockLevel: number;
  frames: { startup: number; active: number; recovery: number };
  effects: string[];
  icon: string;
}

export type WeaponType = 'fists' | 'blade' | 'chain' | 'staff' | 'gun' | 'claws' | 'gauntlets' | 'whip' | 'axe' | 'scythe' | 'katana' | 'dual_blades' | 'hammer' | 'spear' | 'nunchaku';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  description: string;
  icon: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  statBoosts: Partial<FighterStats>;
  specialEffect: string;
  effectColor: string;
}

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
  rank?: Rank;
  unlockedMoves?: string[];
  weaponSlot1?: string | null;
  weaponSlot2?: string | null;
  trinket1?: string | null;
  trinket2?: string | null;
  bodySize?: 'runt' | 'standard' | 'brute';
  earnedTrophies?: string[];   // trophy IDs
  currentStreak?: number;
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
  superName: string;
  superDesc: string;
  icon: string;
  unlockCost: number;
  unlockLevel: number;
  lore: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
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
  mmrChange?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'demon_slot' | 'weapon' | 'move';
  slot?: keyof Equipment;
  cost: number;
  statBoosts?: Partial<FighterStats>;
  icon: string;
  rarity?: string;
  requiresLevel?: number;
}
