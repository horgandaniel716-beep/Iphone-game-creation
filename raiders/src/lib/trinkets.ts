// Trinkets — Binding of Isaac style special effect items
// Players can equip 2 trinkets. Effects stack and create unexpected synergies.

export interface Trinket {
  id: string;
  name: string;
  description: string;
  effect: string;      // mechanic description
  icon: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  // In-engine effect keys read by the arena HTML
  engineEffect: string;
  engineValue: number;
}

export const TRINKETS: Trinket[] = [
  // COMMON
  { id: 'bloodstone',    name: 'Bloodstone',       description: 'Ancient red gem',          effect: 'Gain 2 HP per hit landed',             icon: '🔴', cost: 200,   rarity: 'common',    color: '#e74c3c', engineEffect: 'lifesteal',    engineValue: 2   },
  { id: 'lucky_coin',    name: 'Lucky Coin',        description: 'Warm to the touch',        effect: '10% chance to dodge any hit',          icon: '🪙', cost: 250,   rarity: 'common',    color: '#e8c84a', engineEffect: 'dodge_chance', engineValue: 0.1 },
  { id: 'ghost_ring',    name: 'Ghost Ring',        description: 'Phases through solid matter', effect: 'Block one hit per round (invisible shield)', icon: '💍', cost: 300, rarity: 'common',  color: '#b2dfdb', engineEffect: 'ghost_shield', engineValue: 1   },
  { id: 'iron_skin',     name: 'Iron Skin',         description: 'Hardened surface',         effect: 'Reduce all damage by 8%',              icon: '🛡️', cost: 300,   rarity: 'common',    color: '#95a5a6', engineEffect: 'dmg_reduce',   engineValue: 0.08},
  { id: 'speed_drug',    name: 'Adrenaline Shot',   description: 'Your hands move faster',   effect: '+12 speed permanently',                icon: '💉', cost: 350,   rarity: 'common',    color: '#4fc3f7', engineEffect: 'speed_boost',  engineValue: 12  },
  { id: 'rage_pill',     name: 'Rage Pill',         description: 'Tastes like anger',        effect: '+8 attack when below 30% HP',          icon: '💊', cost: 300,   rarity: 'common',    color: '#e53935', engineEffect: 'low_hp_atk',   engineValue: 8   },
  { id: 'mirror_shard',  name: 'Mirror Shard',      description: 'Cuts both ways',           effect: 'Reflect 15% of damage taken',          icon: '🪞', cost: 400,   rarity: 'common',    color: '#78909c', engineEffect: 'dmg_reflect',  engineValue: 0.15},
  { id: 'bone_charm',    name: 'Bone Charm',        description: 'Rattles when danger nears', effect: 'Combo timer lasts 30 frames longer',  icon: '🦴', cost: 250,   rarity: 'common',    color: '#bcaaa4', engineEffect: 'combo_extend', engineValue: 30  },

  // RARE
  { id: 'void_shard',    name: 'Void Shard',        description: 'Cold nothingness',         effect: 'Super meter fills 20% faster',         icon: '🌑', cost: 800,   rarity: 'rare',      color: '#9b59b6', engineEffect: 'super_rate',   engineValue: 1.2 },
  { id: 'thunder_bead',  name: 'Thunder Bead',      description: 'Hums with electricity',    effect: 'Every 3rd hit shocks (stun 0.3s)',     icon: '⚡', cost: 900,   rarity: 'rare',      color: '#ffcc00', engineEffect: 'thunder_every', engineValue: 3  },
  { id: 'shadow_eye',    name: 'Shadow Eye',        description: 'Sees in the dark',         effect: 'Stealth for 2s after blocking a hit',  icon: '👁️', cost: 1000,  rarity: 'rare',      color: '#6a1b9a', engineEffect: 'block_stealth', engineValue: 120 },
  { id: 'phoenix_ash',   name: 'Phoenix Ash',       description: 'Still smells like smoke',  effect: 'Revive once with 20% HP per match',    icon: '🔥', cost: 1200,  rarity: 'rare',      color: '#ff6d00', engineEffect: 'revive',        engineValue: 0.2 },
  { id: 'frozen_tear',   name: 'Frozen Tear',       description: 'Never quite melts',        effect: 'Heavy attacks apply a 0.5s slow',      icon: '❄️', cost: 1000,  rarity: 'rare',      color: '#4fc3f7', engineEffect: 'heavy_slow',    engineValue: 30  },
  { id: 'poison_gland',  name: 'Poison Gland',      description: 'Secretes on contact',      effect: 'Light attacks apply 3 HP poison/s',    icon: '🧪', cost: 950,   rarity: 'rare',      color: '#66bb6a', engineEffect: 'light_poison',  engineValue: 3   },
  { id: 'demon_horn',    name: 'Demon Horn',        description: 'Broke off something big',  effect: '+20 ATK, -15 DEF',                     icon: '🦌', cost: 1100,  rarity: 'rare',      color: '#b71c1c', engineEffect: 'atk_for_def',   engineValue: 20  },
  { id: 'psy_crystal',   name: 'Psy Crystal',       description: 'Vibrates with thought',    effect: 'Predict opponent\'s next move (ghost image appears)', icon: '🔮', cost: 1300, rarity: 'rare', color: '#ec407a', engineEffect: 'predict',    engineValue: 1   },

  // EPIC
  { id: 'chaos_gem',     name: 'Chaos Gem',         description: 'Reacts differently every fight', effect: 'Random buff each round (ATK/SPD/HP/SHIELD)', icon: '🌀', cost: 2500, rarity: 'epic',  color: '#ff6e40', engineEffect: 'chaos_buff',    engineValue: 1   },
  { id: 'soul_anchor',   name: 'Soul Anchor',       description: 'Chains you to this plane',  effect: 'Cannot be knocked down (no floor bounce)', icon: '⚓', cost: 3000, rarity: 'epic',   color: '#546e7a', engineEffect: 'no_knockdown',  engineValue: 1   },
  { id: 'rage_crystal',  name: 'Rage Crystal',      description: 'Shatters when angry',      effect: 'ATK +5 for each hit you take (caps at +50)', icon: '💎', cost: 2800, rarity: 'epic', color: '#e53935', engineEffect: 'rage_stack',     engineValue: 5   },
  { id: 'void_heart',    name: 'Void Heart',        description: 'Beats out of sync',        effect: 'Heal 10 HP every 3 seconds',           icon: '🖤', cost: 3200,  rarity: 'epic',      color: '#6a1b9a', engineEffect: 'regen',         engineValue: 10  },
  { id: 'time_capsule',  name: 'Time Capsule',      description: 'Frozen in a moment',       effect: 'Reset your HP to last round\'s HP at the start of each round', icon: '⏳', cost: 4000, rarity: 'epic', color: '#f57f17', engineEffect: 'hp_memory',    engineValue: 1   },
  { id: 'twin_soul',     name: 'Twin Soul',         description: 'Two minds, one body',      effect: 'Mirror your last move automatically for 0.5x damage', icon: '🪬', cost: 3500, rarity: 'epic', color: '#8e24aa', engineEffect: 'auto_mirror',   engineValue: 0.5 },

  // LEGENDARY
  { id: 'gods_eye',      name: 'God\'s Eye',        description: 'Sees every timeline',      effect: 'All attacks become unblockable',        icon: '👁️', cost: 8000,  rarity: 'legendary', color: '#ff9000', engineEffect: 'unblockable',   engineValue: 1   },
  { id: 'death_wish',    name: 'Death Wish',        description: 'For those with nothing to lose', effect: 'When below 10% HP: ATK ×3, invincible for 5s', icon: '💀', cost: 10000, rarity: 'legendary', color: '#e53935', engineEffect: 'death_wish',   engineValue: 3 },
  { id: 'weed_pen',      name: 'Cosmic Pen',        description: 'Smells like the void',     effect: 'All cooldowns halved. Random type buffs. Win conditions are different.', icon: '🌿', cost: 4200, rarity: 'legendary', color: '#4caf50', engineEffect: 'stoner_mode', engineValue: 1 },
  { id: 'zero_gravity',  name: 'Zero Gravity',      description: 'Weight means nothing',     effect: 'Infinite jumps. Air attacks deal 2× damage.', icon: '🚀', cost: 9000, rarity: 'legendary', color: '#4fc3f7', engineEffect: 'zero_grav',    engineValue: 2   },
];

export const TRINKET_RARITY_COLORS = {
  common: '#888',
  rare: '#4a9eff',
  epic: '#b44aff',
  legendary: '#ff9000',
};

export function getTrinketById(id: string): Trinket | undefined {
  return TRINKETS.find((t) => t.id === id);
}
