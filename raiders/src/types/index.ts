export interface Raider {
  id: string;
  userId: string;
  name: string;
  level: number;
  xp: number;
  currency: number;
  wins: number;
  losses: number;
  raids: number;
  equipment: Equipment;
  stats: RaiderStats;
  avatarStyle: AvatarStyle;
}

export interface RaiderStats {
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

export interface AvatarStyle {
  skinTone: string;
  hairColor: string;
  outfit: string;
}

export interface Base {
  id: string;
  userId: string;
  name: string;
  layout: BaseLayout;
  demons: Demon[];
  trophies: number;
  lastRaidedAt: number | null;
}

export interface BaseLayout {
  walls: Tile[];
  floors: Tile[];
  traps: Tile[];
}

export interface Tile {
  x: number;
  y: number;
  type: string;
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
  durationSeconds: number;
  opponentId: string;
  opponentName: string;
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'base_piece' | 'demon_slot';
  slot?: keyof Equipment;
  cost: number;
  statBoosts?: Partial<RaiderStats>;
  icon: string;
}
