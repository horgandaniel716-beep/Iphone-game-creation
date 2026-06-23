import type { Weapon } from '../types';

export const WEAPONS: Weapon[] = [
  // ── COMMON ──────────────────────────────────────────────────────────────────
  { id: 'iron_knuckles',  name: 'Iron Knuckles',   type: 'gauntlets',   description: 'Reinforced fists deal extra impact', icon: '🥊', cost: 200,   rarity: 'common',    statBoosts: { attack: 8,  defense: 4  }, specialEffect: 'Stun chance +10%',         effectColor: '#e8c84a' },
  { id: 'short_blade',    name: 'Short Blade',     type: 'blade',       description: 'Quick cuts with high hit rate',      icon: '🔪', cost: 250,   rarity: 'common',    statBoosts: { attack: 12, speed: 5    }, specialEffect: 'Bleed on hit 3s',          effectColor: '#e74c3c' },
  { id: 'chain_whip',     name: 'Chain Whip',      type: 'chain',       description: 'Extended reach, trips enemies',      icon: '⛓️', cost: 300,   rarity: 'common',    statBoosts: { attack: 10, speed: 8    }, specialEffect: 'Trip on low kick',         effectColor: '#aaa' },
  { id: 'wood_staff',     name: 'Oak Staff',       type: 'staff',       description: 'Two-handed reach weapon',            icon: '🪵', cost: 220,   rarity: 'common',    statBoosts: { attack: 9,  defense: 6  }, specialEffect: 'Block bonus +15',          effectColor: '#8B4513' },
  { id: 'combat_boots',   name: 'Combat Boots',    type: 'fists',       description: 'Reinforced kick attacks',            icon: '🥾', cost: 180,   rarity: 'common',    statBoosts: { attack: 6,  speed: 12   }, specialEffect: 'Kick damage +20%',         effectColor: '#2ecc71' },

  // ── RARE ────────────────────────────────────────────────────────────────────
  { id: 'katana',         name: 'Katana',          type: 'katana',      description: 'Precise blade with high crit rate',  icon: '⚔️', cost: 800,   rarity: 'rare',      statBoosts: { attack: 22, speed: 10   }, specialEffect: 'Critical hit +20% damage', effectColor: '#e8c84a' },
  { id: 'war_axe',        name: 'War Axe',         type: 'axe',         description: 'Heavy blows break guard',            icon: '🪓', cost: 900,   rarity: 'rare',      statBoosts: { attack: 28, defense: -5 }, specialEffect: 'Guard break on heavy',     effectColor: '#ff6600' },
  { id: 'pistol',         name: 'Glock',           type: 'gun',         description: 'Ranged shots mid-combo',             icon: '🔫', cost: 1000,  rarity: 'rare',      statBoosts: { attack: 18, speed: 8    }, specialEffect: 'Ranged light attack',      effectColor: '#4a9eff' },
  { id: 'nunchaku',       name: 'Nunchaku',        type: 'nunchaku',    description: 'Rapid multi-hit spinning attacks',   icon: '🥋', cost: 850,   rarity: 'rare',      statBoosts: { attack: 20, speed: 15   }, specialEffect: 'Multi-hit +1 on combos',   effectColor: '#ffd700' },
  { id: 'claws',          name: 'Razor Claws',     type: 'claws',       description: 'Fast slashing attacks',              icon: '🐾', cost: 950,   rarity: 'rare',      statBoosts: { attack: 24, speed: 12   }, specialEffect: 'Bleed stacks on slash',    effectColor: '#e74c3c' },
  { id: 'spear',          name: 'War Spear',       type: 'spear',       description: 'Long range poking weapon',           icon: '🏹', cost: 1100,  rarity: 'rare',      statBoosts: { attack: 25, defense: 8  }, specialEffect: 'Poke from safe distance',  effectColor: '#4af' },
  { id: 'whip',           name: 'Scorpion Whip',   type: 'whip',        description: 'Pull opponent to you',               icon: '💥', cost: 1200,  rarity: 'rare',      statBoosts: { attack: 16, speed: 18   }, specialEffect: 'GET OVER HERE pull',       effectColor: '#ff9000' },

  // ── EPIC ────────────────────────────────────────────────────────────────────
  { id: 'dual_katanas',   name: 'Twin Katanas',    type: 'dual_blades', description: 'Dual-wield slashing fury',           icon: '🗡️', cost: 2500,  rarity: 'epic',      statBoosts: { attack: 40, speed: 20   }, specialEffect: 'Combo speed +25%',         effectColor: '#ff2d78' },
  { id: 'plasma_gauntlet',name: 'Plasma Gauntlet', type: 'gauntlets',   description: 'Energy-charged power fists',         icon: '⚡', cost: 3000,  rarity: 'epic',      statBoosts: { attack: 45, defense: 15 }, specialEffect: 'Electric shock on heavy',  effectColor: '#00d4ff' },
  { id: 'scythe',         name: 'Reaper Scythe',   type: 'scythe',      description: 'Wide sweeping death weapon',         icon: '☠️', cost: 3200,  rarity: 'epic',      statBoosts: { attack: 50, defense: -8 }, specialEffect: 'HP drain 5% on hit',       effectColor: '#b44aff' },
  { id: 'war_hammer',     name: 'Mjolnir Hammer',  type: 'hammer',      description: 'Slow but devastating blows',         icon: '🔨', cost: 2800,  rarity: 'epic',      statBoosts: { attack: 55, speed: -15  }, specialEffect: 'Stun 2s on heavy hit',     effectColor: '#ffd700' },
  { id: 'fire_sword',     name: 'Inferno Blade',   type: 'blade',       description: 'Blade wreathed in hellfire',         icon: '🔥', cost: 3500,  rarity: 'epic',      statBoosts: { attack: 48, defense: 10 }, specialEffect: 'Burn 3s, 5 dmg/tick',      effectColor: '#ff6600' },

  // ── LEGENDARY ───────────────────────────────────────────────────────────────
  { id: 'soul_edge',      name: 'Soul Edge',       type: 'blade',       description: 'Cursed blade that grows on kills',   icon: '🩸', cost: 8000,  rarity: 'legendary', statBoosts: { attack: 70, health: 30  }, specialEffect: '+10 ATK per round win',    effectColor: '#ff2d78' },
  { id: 'god_staff',      name: "God's Staff",     type: 'staff',       description: 'Divine weapon of the ancients',      icon: '🌟', cost: 10000, rarity: 'legendary', statBoosts: { attack: 65, defense: 30 }, specialEffect: 'Block converts to HP',     effectColor: '#ffd700' },
  { id: 'void_claws',     name: 'Void Claws',      type: 'claws',       description: 'Dimensional tear claws',             icon: '🌌', cost: 9000,  rarity: 'legendary', statBoosts: { attack: 75, speed: 25   }, specialEffect: 'Phase through blocks',     effectColor: '#b44aff' },
  { id: 'railgun',        name: 'Railgun',         type: 'gun',         description: 'Fires projectile through shield',    icon: '🎯', cost: 12000, rarity: 'legendary', statBoosts: { attack: 60, speed: 10   }, specialEffect: 'Pierce: ignore 50% DEF',   effectColor: '#00d4ff' },
];

export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}

export function getWeaponsByRarity(rarity: Weapon['rarity']): Weapon[] {
  return WEAPONS.filter((w) => w.rarity === rarity);
}

export const WEAPON_RARITY_COLORS: Record<Weapon['rarity'], string> = {
  common:    '#aaa',
  rare:      '#4a9eff',
  epic:      '#b44aff',
  legendary: '#ff9000',
};
