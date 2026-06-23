import type { Move } from '../types';

export const MOVES: Move[] = [
  // ── COMMON STRIKES ──────────────────────────────────────────────────────────
  { id: 'jab',           name: 'Quick Jab',         description: 'Fast two-punch combo', tier: 'common', category: 'strike',    damage: 8,   unlockCost: 0,     unlockLevel: 1,  frames: { startup: 3,  active: 3,  recovery: 6  }, effects: [],                icon: '👊' },
  { id: 'low_kick',      name: 'Low Kick',           description: 'Sweeps at the ankles', tier: 'common', category: 'strike',    damage: 10,  unlockCost: 0,     unlockLevel: 1,  frames: { startup: 5,  active: 4,  recovery: 8  }, effects: ['trip'],          icon: '🦵' },
  { id: 'uppercut',      name: 'Uppercut',           description: 'Rising fist strike',   tier: 'common', category: 'strike',    damage: 14,  unlockCost: 50,    unlockLevel: 2,  frames: { startup: 6,  active: 4,  recovery: 12 }, effects: ['launch'],        icon: '💥' },
  { id: 'roundhouse',    name: 'Roundhouse',         description: 'Wide spinning kick',   tier: 'common', category: 'strike',    damage: 16,  unlockCost: 75,    unlockLevel: 2,  frames: { startup: 8,  active: 5,  recovery: 14 }, effects: ['knockback'],     icon: '🌀' },
  { id: 'body_blow',     name: 'Body Blow',          description: 'Gut punch that stuns', tier: 'common', category: 'strike',    damage: 12,  unlockCost: 100,   unlockLevel: 3,  frames: { startup: 7,  active: 4,  recovery: 10 }, effects: ['stun_short'],    icon: '😤' },
  { id: 'knee_strike',   name: 'Knee Strike',        description: 'Close-range knee',     tier: 'common', category: 'strike',    damage: 11,  unlockCost: 80,    unlockLevel: 3,  frames: { startup: 4,  active: 3,  recovery: 9  }, effects: [],                icon: '🦿' },
  { id: 'elbow_smash',   name: 'Elbow Smash',        description: 'Crushing elbow drop',  tier: 'common', category: 'strike',    damage: 15,  unlockCost: 120,   unlockLevel: 4,  frames: { startup: 6,  active: 5,  recovery: 11 }, effects: ['dizzy'],         icon: '🔨' },
  { id: 'back_kick',     name: 'Back Kick',          description: 'Reverse mule kick',    tier: 'common', category: 'strike',    damage: 17,  unlockCost: 150,   unlockLevel: 4,  frames: { startup: 9,  active: 4,  recovery: 13 }, effects: ['knockback'],     icon: '↩️' },
  { id: 'palm_strike',   name: 'Palm Strike',        description: 'Open-palm shockwave',  tier: 'common', category: 'strike',    damage: 13,  unlockCost: 100,   unlockLevel: 3,  frames: { startup: 5,  active: 4,  recovery: 10 }, effects: ['push'],          icon: '🤚' },
  { id: 'axe_kick',      name: 'Axe Kick',           description: 'Overhead stomp kick',  tier: 'common', category: 'strike',    damage: 18,  unlockCost: 175,   unlockLevel: 5,  frames: { startup: 10, active: 5,  recovery: 15 }, effects: ['ground_bounce'], icon: '🪓' },

  // ── UNCOMMON STRIKES ────────────────────────────────────────────────────────
  { id: 'spinning_heel', name: 'Spinning Heel',      description: '360° heel kick',        tier: 'uncommon', category: 'strike',  damage: 22,  unlockCost: 200,   unlockLevel: 5,  frames: { startup: 10, active: 6,  recovery: 16 }, effects: ['knockdown'],     icon: '💫' },
  { id: 'drop_kick',     name: 'Drop Kick',          description: 'Leaping double kick',   tier: 'uncommon', category: 'air',     damage: 24,  unlockCost: 250,   unlockLevel: 6,  frames: { startup: 12, active: 6,  recovery: 18 }, effects: ['knockback'],     icon: '🚀' },
  { id: 'stomp',         name: 'Ground Stomp',       description: 'Shockwave on landing',  tier: 'uncommon', category: 'strike',  damage: 20,  unlockCost: 300,   unlockLevel: 6,  frames: { startup: 14, active: 8,  recovery: 20 }, effects: ['aoe_small'],     icon: '🌊' },
  { id: 'shoulder_ram',  name: 'Shoulder Ram',       description: 'Full-speed charge',     tier: 'uncommon', category: 'strike',  damage: 26,  unlockCost: 350,   unlockLevel: 7,  frames: { startup: 16, active: 5,  recovery: 22 }, effects: ['wall_splat'],    icon: '🐏' },
  { id: 'flying_knee',   name: 'Flying Knee',        description: 'Airborne knee strike',  tier: 'uncommon', category: 'air',     damage: 28,  unlockCost: 400,   unlockLevel: 8,  frames: { startup: 14, active: 6,  recovery: 20 }, effects: ['launch'],        icon: '✈️' },
  { id: 'hip_toss',      name: 'Hip Toss',           description: 'Judo throw',            tier: 'uncommon', category: 'grab',    damage: 22,  unlockCost: 300,   unlockLevel: 6,  frames: { startup: 8,  active: 3,  recovery: 18 }, effects: ['ground_bounce'], icon: '🤼' },
  { id: 'leg_sweep',     name: 'Dragon Sweep',       description: 'Low sliding sweep',     tier: 'uncommon', category: 'strike',  damage: 20,  unlockCost: 280,   unlockLevel: 7,  frames: { startup: 7,  active: 5,  recovery: 16 }, effects: ['knockdown'],     icon: '🐉' },
  { id: 'headbutt',      name: 'Bull Headbutt',      description: 'Armored headbash',      tier: 'uncommon', category: 'strike',  damage: 24,  unlockCost: 320,   unlockLevel: 7,  frames: { startup: 11, active: 5,  recovery: 17 }, effects: ['stun'],          icon: '🐂' },
  { id: 'piledriver',    name: 'Piledriver',         description: 'Grab and slam down',    tier: 'uncommon', category: 'grab',    damage: 30,  unlockCost: 450,   unlockLevel: 9,  frames: { startup: 10, active: 4,  recovery: 24 }, effects: ['hard_knockdown'], icon: '⬇️' },
  { id: 'backbreaker',   name: 'Backbreaker',        description: 'Aerial grab slam',      tier: 'uncommon', category: 'grab',    damage: 28,  unlockCost: 400,   unlockLevel: 8,  frames: { startup: 12, active: 4,  recovery: 22 }, effects: ['hard_knockdown'], icon: '💢' },

  // ── RARE MOVES ──────────────────────────────────────────────────────────────
  { id: 'shoryuken',     name: 'Rising Dragon',      description: 'Invincible rising uppercut', tier: 'rare', category: 'special', damage: 35,  unlockCost: 600,   unlockLevel: 10, frames: { startup: 4,  active: 8,  recovery: 28 }, effects: ['invincible_startup', 'launch'], icon: '🐲' },
  { id: 'hadoken',       name: 'Spirit Ball',        description: 'Slow-moving energy orb',    tier: 'rare', category: 'projectile', damage: 30, unlockCost: 500,  unlockLevel: 9,  frames: { startup: 14, active: 30, recovery: 20 }, effects: ['projectile'],    icon: '🔵' },
  { id: 'spin_kick_ex',  name: 'Whirlwind Kick',     description: 'Multi-hit spin attack',     tier: 'rare', category: 'combo',   damage: 38,  unlockCost: 700,   unlockLevel: 11, frames: { startup: 10, active: 12, recovery: 24 }, effects: ['multi_hit'],     icon: '🌪️' },
  { id: 'tiger_knee',    name: 'Tiger Knee Rush',    description: 'Knee to mid-air cancel',    tier: 'rare', category: 'air',     damage: 32,  unlockCost: 650,   unlockLevel: 10, frames: { startup: 8,  active: 6,  recovery: 18 }, effects: ['juggle'],        icon: '🐯' },
  { id: 'soul_drain',    name: 'Soul Drain',         description: 'Drains opponent HP',        tier: 'rare', category: 'special', damage: 25,  unlockCost: 800,   unlockLevel: 12, frames: { startup: 18, active: 10, recovery: 30 }, effects: ['lifesteal'],     icon: '💜' },
  { id: 'earthquake',    name: 'Earthquake Slam',    description: 'Massive ground shockwave',  tier: 'rare', category: 'strike',  damage: 40,  unlockCost: 900,   unlockLevel: 12, frames: { startup: 20, active: 10, recovery: 32 }, effects: ['aoe_medium', 'knockdown'], icon: '🌍' },
  { id: 'counter_strike','name': 'Shadow Counter',   description: 'Auto-counter on hit',       tier: 'rare', category: 'counter', damage: 28,  unlockCost: 750,   unlockLevel: 11, frames: { startup: 2,  active: 4,  recovery: 16 }, effects: ['counter'],       icon: '🔁' },
  { id: 'ghost_step',    name: 'Ghost Step',         description: 'Phase through attacks',     tier: 'rare', category: 'special', damage: 20,  unlockCost: 700,   unlockLevel: 11, frames: { startup: 6,  active: 20, recovery: 14 }, effects: ['intangible'],    icon: '👻' },
  { id: 'magnet_grab',   name: 'Magnet Grab',        description: 'Pulls opponent from range', tier: 'rare', category: 'grab',    damage: 32,  unlockCost: 850,   unlockLevel: 12, frames: { startup: 20, active: 6,  recovery: 22 }, effects: ['command_grab'],  icon: '🧲' },
  { id: 'volt_dash',     name: 'Volt Dash',          description: 'Electric teleport strike',  tier: 'rare', category: 'special', damage: 36,  unlockCost: 950,   unlockLevel: 13, frames: { startup: 6,  active: 8,  recovery: 20 }, effects: ['electric', 'teleport'], icon: '⚡' },

  // ── EPIC MOVES ───────────────────────────────────────────────────────────────
  { id: 'berserker_rush','name': 'Berserker Rush',   description: '8-hit dashing combo',       tier: 'epic', category: 'combo',   damage: 55,  unlockCost: 1500,  unlockLevel: 15, frames: { startup: 10, active: 24, recovery: 28 }, effects: ['multi_hit', 'armor'], icon: '💀' },
  { id: 'phoenix_flame',  name: 'Phoenix Flame',     description: 'Burning aerial dive',       tier: 'epic', category: 'air',     damage: 60,  unlockCost: 1800,  unlockLevel: 16, frames: { startup: 12, active: 10, recovery: 24 }, effects: ['fire', 'burn'],   icon: '🔥' },
  { id: 'time_stop',      name: 'Time Fracture',     description: 'Briefly freezes opponent',  tier: 'epic', category: 'special', damage: 15,  unlockCost: 2000,  unlockLevel: 18, frames: { startup: 24, active: 2,  recovery: 30 }, effects: ['time_stop'],     icon: '⏱️' },
  { id: 'meteor_crash',   name: 'Meteor Crash',      description: 'Slam from the sky',         tier: 'epic', category: 'air',     damage: 65,  unlockCost: 2200,  unlockLevel: 19, frames: { startup: 20, active: 12, recovery: 36 }, effects: ['ground_bounce', 'aoe_large'], icon: '☄️' },
  { id: 'void_slash',     name: 'Void Slash',        description: 'Dimensional blade strike',  tier: 'epic', category: 'special', damage: 58,  unlockCost: 2500,  unlockLevel: 20, frames: { startup: 14, active: 10, recovery: 26 }, effects: ['phase', 'bleed'], icon: '🌌' },
  { id: 'blood_rage',     name: 'Blood Rage',        description: 'Buff: ATK +40% for 5s',     tier: 'epic', category: 'special', damage: 0,   unlockCost: 2000,  unlockLevel: 17, frames: { startup: 8,  active: 1,  recovery: 12 }, effects: ['buff_attack'],   icon: '🩸' },
  { id: 'mirage_barrage', name: 'Mirage Barrage',    description: 'Clone-assisted 12-hit combo', tier: 'epic', category: 'combo', damage: 70,  unlockCost: 2800,  unlockLevel: 22, frames: { startup: 16, active: 28, recovery: 32 }, effects: ['multi_hit', 'clone'], icon: '🪞' },
  { id: 'shadow_world',   name: 'Shadow World',      description: 'Pulls to dark dimension',   tier: 'epic', category: 'special', damage: 50,  unlockCost: 3000,  unlockLevel: 22, frames: { startup: 30, active: 4,  recovery: 40 }, effects: ['arena_shift'],   icon: '🌑' },
  { id: 'pulse_cannon',   name: 'Pulse Cannon',      description: 'Full-screen energy beam',   tier: 'epic', category: 'projectile', damage: 62, unlockCost: 2600, unlockLevel: 20, frames: { startup: 28, active: 20, recovery: 38 }, effects: ['beam', 'electric'], icon: '🔆' },
  { id: 'earth_armor',    name: 'Earth Armor',       description: 'Rock armor, absorbs 1 hit', tier: 'epic', category: 'special', damage: 0,   unlockCost: 2400,  unlockLevel: 19, frames: { startup: 12, active: 1,  recovery: 10 }, effects: ['armor_buff'],    icon: '🪨' },

  // ── LEGENDARY MOVES ──────────────────────────────────────────────────────────
  { id: 'revelation',     name: 'Revelation',        description: '20-hit cinematic combo',    tier: 'legendary', category: 'finisher', damage: 120, unlockCost: 5000,  unlockLevel: 30, frames: { startup: 20, active: 60, recovery: 40 }, effects: ['cinematic', 'multi_hit'], icon: '✨' },
  { id: 'god_fist',       name: 'God Fist',          description: 'Reality-shattering punch',  tier: 'legendary', category: 'super',    damage: 100, unlockCost: 6000,  unlockLevel: 32, frames: { startup: 16, active: 10, recovery: 44 }, effects: ['wall_break', 'screen_shatter'], icon: '👁️' },
  { id: 'black_hole',     name: 'Black Hole',        description: 'Pulls all to center',       tier: 'legendary', category: 'special',  damage: 80,  unlockCost: 7000,  unlockLevel: 35, frames: { startup: 40, active: 30, recovery: 50 }, effects: ['aoe_full', 'gravity'], icon: '🕳️' },
  { id: 'eternal_night',  name: 'Eternal Night',     description: 'Blinds + 30-hit storm',     tier: 'legendary', category: 'super',    damage: 140, unlockCost: 8000,  unlockLevel: 38, frames: { startup: 24, active: 80, recovery: 48 }, effects: ['blind', 'multi_hit', 'cinematic'], icon: '🌙' },
  { id: 'true_form',      name: 'True Form',         description: 'Transforms into true self', tier: 'legendary', category: 'special',  damage: 0,   unlockCost: 9000,  unlockLevel: 40, frames: { startup: 60, active: 1,  recovery: 20 }, effects: ['transform', 'full_buff'], icon: '🦋' },

  // ── OVERPOWERED — LEVEL 50+ ONLY ────────────────────────────────────────────
  { id: 'apocalypse',     name: 'Apocalypse',        description: 'End-of-round nuke: massive AOE', tier: 'overpowered', category: 'super', damage: 200, unlockCost: 20000, unlockLevel: 50, frames: { startup: 60, active: 40, recovery: 80 }, effects: ['aoe_full', 'cinematic', 'screen_shake'], icon: '💣' },
  { id: 'time_erase',     name: 'Time Erase',        description: 'Resets opponent to round start', tier: 'overpowered', category: 'special', damage: 0, unlockCost: 25000, unlockLevel: 52, frames: { startup: 80, active: 1,  recovery: 60 }, effects: ['time_reset'],    icon: '⏰' },
  { id: 'omnislash',      name: 'Omnislash',         description: '50-hit teleport assault',   tier: 'overpowered', category: 'combo', damage: 350, unlockCost: 30000, unlockLevel: 55, frames: { startup: 30, active: 150, recovery: 60 }, effects: ['multi_hit', 'teleport', 'cinematic'], icon: '⚔️' },
  { id: 'divine_judgment','name': 'Divine Judgment', description: 'Instant KO if opponent < 20% HP', tier: 'overpowered', category: 'finisher', damage: 999, unlockCost: 50000, unlockLevel: 60, frames: { startup: 48, active: 6,  recovery: 80 }, effects: ['execution'],     icon: '⚖️' },
  { id: 'reality_break',  name: 'Reality Break',     description: 'Shatters stage + triple damage', tier: 'overpowered', category: 'super', damage: 250, unlockCost: 40000, unlockLevel: 58, frames: { startup: 50, active: 20, recovery: 70 }, effects: ['arena_break', 'triple_damage', 'cinematic'], icon: '🌐' },
];

export function getMovesByTier(tier: Move['tier']): Move[] {
  return MOVES.filter((m) => m.tier === tier);
}

export function getMove(id: string): Move | undefined {
  return MOVES.find((m) => m.id === id);
}

export function getMovesForLevel(level: number): Move[] {
  return MOVES.filter((m) => m.unlockLevel <= level && m.tier !== 'overpowered');
}

export function getOPMoves(): Move[] {
  return MOVES.filter((m) => m.tier === 'overpowered');
}

export const MOVE_TIER_COLORS: Record<Move['tier'], string> = {
  common:      '#aaa',
  uncommon:    '#2ecc71',
  rare:        '#4a9eff',
  epic:        '#b44aff',
  legendary:   '#ff9000',
  overpowered: '#ff2d78',
};
