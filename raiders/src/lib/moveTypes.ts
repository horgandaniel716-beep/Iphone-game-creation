// Move type system — like Pokémon types but for fighters
// Mixing move types unlocks named BUILD VARIANTS

export type MoveType =
  | 'physical'  // raw fist / kick
  | 'fire'      // burning attacks
  | 'electric'  // lightning / volt
  | 'shadow'    // dark / void energy
  | 'ice'       // freeze / slow
  | 'wind'      // speed / air
  | 'earth'     // ground / seismic
  | 'holy'      // light / radiant
  | 'poison'    // toxic / drain
  | 'psychic'   // mind / time
  | 'blood'     // berserker / lifesteal
  | 'chaos'     // random / unpredictable

export interface MoveTypeInfo {
  id: MoveType;
  label: string;
  icon: string;
  color: string;
  glow: string;
  desc: string;
  strong: MoveType[];   // deals bonus damage against
  weak: MoveType[];     // takes extra damage from
}

export const MOVE_TYPES: Record<MoveType, MoveTypeInfo> = {
  physical: { id:'physical', label:'PHYSICAL', icon:'👊', color:'#e0c080', glow:'#ffdd88', desc:'Grounded, reliable strikes', strong:['ice','earth'], weak:['wind','psychic'] },
  fire:     { id:'fire',     label:'FIRE',     icon:'🔥', color:'#ff4400', glow:'#ff8800', desc:'Burning damage over time',   strong:['ice','wind'],  weak:['earth','water'] },
  electric: { id:'electric', label:'ELECTRIC', icon:'⚡', color:'#ffcc00', glow:'#ffff44', desc:'Stuns and chains',           strong:['physical','water'], weak:['earth','shadow'] },
  shadow:   { id:'shadow',   label:'SHADOW',   icon:'🌑', color:'#9b59b6', glow:'#cc44ff', desc:'Ignores defenses',          strong:['holy','psychic'],   weak:['fire','blood'] },
  ice:      { id:'ice',      label:'ICE',       icon:'❄️', color:'#4fc3f7', glow:'#88eeff', desc:'Slows and freezes',         strong:['wind','poison'],    weak:['fire','earth'] },
  wind:     { id:'wind',     label:'WIND',     icon:'💨', color:'#b2dfdb', glow:'#ccffee', desc:'Evasive and fast',          strong:['fire','poison'],    weak:['electric','ice'] },
  earth:    { id:'earth',    label:'EARTH',    icon:'🪨', color:'#8d6e63', glow:'#c4a882', desc:'Armored and heavy',         strong:['fire','electric'],  weak:['wind','shadow'] },
  holy:     { id:'holy',     label:'HOLY',     icon:'✨', color:'#fff176', glow:'#ffff99', desc:'Cleanses and purifies',     strong:['shadow','poison'],  weak:['chaos','blood'] },
  poison:   { id:'poison',   label:'POISON',   icon:'🧪', color:'#66bb6a', glow:'#88ff88', desc:'DoT and debuffs',           strong:['earth','physical'], weak:['holy','ice'] },
  psychic:  { id:'psychic',  label:'PSYCHIC',  icon:'🔮', color:'#ec407a', glow:'#ff66aa', desc:'Disrupts and reverses',    strong:['shadow','chaos'],   weak:['electric','blood'] },
  blood:    { id:'blood',    label:'BLOOD',    icon:'🩸', color:'#e53935', glow:'#ff4444', desc:'Lifesteal and berserk',     strong:['holy','psychic'],   weak:['ice','wind'] },
  chaos:    { id:'chaos',    label:'CHAOS',    icon:'🌀', color:'#ff6e40', glow:'#ff9966', desc:'Unpredictable wildcards',  strong:['all'],              weak:[] },
};

// ── BUILD VARIANT DETECTION ───────────────────────────────────────────────────
export interface BuildVariant {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  glow: string;
  icon: string;
  requires: { type: MoveType; minCount: number }[];
  minWins: number;
}

export const BUILD_VARIANTS: BuildVariant[] = [
  // Pure archetypes
  { id: 'street_brawler',  name: 'STREET BRAWLER',  subtitle: 'Raw power, no tricks',        color: '#e0c080', glow: '#ffdd88', icon: '👊', requires: [{ type:'physical', minCount:4 }],  minWins: 0 },
  { id: 'inferno',         name: 'INFERNO',          subtitle: 'Everything burns',             color: '#ff4400', glow: '#ff8800', icon: '🔥', requires: [{ type:'fire', minCount:4 }],      minWins: 0 },
  { id: 'thundergod',      name: 'THUNDERGOD',       subtitle: 'Shock everything, chain fast', color: '#ffcc00', glow: '#ffff44', icon: '⚡', requires: [{ type:'electric', minCount:4 }],  minWins: 0 },
  { id: 'void_walker',     name: 'VOID WALKER',      subtitle: 'Fade in, fade out',            color: '#9b59b6', glow: '#cc44ff', icon: '🌑', requires: [{ type:'shadow', minCount:4 }],    minWins: 0 },
  { id: 'cryo',            name: 'CRYO',             subtitle: 'Freeze and shatter',           color: '#4fc3f7', glow: '#88eeff', icon: '❄️', requires: [{ type:'ice', minCount:4 }],       minWins: 0 },
  { id: 'speedster',       name: 'SPEEDSTER',        subtitle: 'Too fast to track',            color: '#b2dfdb', glow: '#ccffee', icon: '💨', requires: [{ type:'wind', minCount:4 }],      minWins: 0 },
  { id: 'ironclad',        name: 'IRONCLAD',         subtitle: 'Unmovable, unstoppable',       color: '#8d6e63', glow: '#c4a882', icon: '🪨', requires: [{ type:'earth', minCount:4 }],     minWins: 0 },
  { id: 'seraph',          name: 'SERAPH',           subtitle: 'Pure light, no mercy',         color: '#fff176', glow: '#ffff99', icon: '✨', requires: [{ type:'holy', minCount:4 }],      minWins: 0 },
  { id: 'plaguebearer',    name: 'PLAGUEBEARER',     subtitle: 'You don\'t die, you rot',      color: '#66bb6a', glow: '#88ff88', icon: '🧪', requires: [{ type:'poison', minCount:4 }],    minWins: 0 },
  { id: 'mindbreaker',     name: 'MINDBREAKER',      subtitle: 'They don\'t know what hit them', color: '#ec407a', glow: '#ff66aa', icon: '🔮', requires: [{ type:'psychic', minCount:4 }], minWins: 0 },
  { id: 'berserker',       name: 'BERSERKER',        subtitle: 'Bleeds more, hits harder',     color: '#e53935', glow: '#ff4444', icon: '🩸', requires: [{ type:'blood', minCount:4 }],     minWins: 0 },
  { id: 'wildcard',        name: 'WILDCARD',         subtitle: 'No one knows what\'s next',    color: '#ff6e40', glow: '#ff9966', icon: '🌀', requires: [{ type:'chaos', minCount:3 }],     minWins: 0 },

  // Hybrid archetypes (2 types)
  { id: 'demon_knight',    name: 'DEMON KNIGHT',     subtitle: 'Dark steel and old blood',     color: '#c0392b', glow: '#ff2244', icon: '⚔️', requires: [{ type:'shadow', minCount:2 }, { type:'blood', minCount:2 }], minWins: 5 },
  { id: 'storm_dancer',    name: 'STORM DANCER',     subtitle: 'Light as air, hot as lightning', color: '#ffd600', glow: '#ffff00', icon: '🌩️', requires: [{ type:'electric', minCount:2 }, { type:'wind', minCount:2 }], minWins: 5 },
  { id: 'plague_shadow',   name: 'PLAGUE SHADOW',    subtitle: 'Invisible, infectious',        color: '#558b2f', glow: '#88cc44', icon: '🦠', requires: [{ type:'shadow', minCount:2 }, { type:'poison', minCount:2 }], minWins: 5 },
  { id: 'holy_fire',       name: 'HOLY FIRE',        subtitle: 'Burn the sinners, purge all',  color: '#ffb300', glow: '#ffcc44', icon: '🕊️', requires: [{ type:'holy', minCount:2 }, { type:'fire', minCount:2 }], minWins: 5 },
  { id: 'iron_glacier',    name: 'IRON GLACIER',     subtitle: 'Slow, cold, impossible to move', color: '#78909c', glow: '#aaccdd', icon: '🏔️', requires: [{ type:'earth', minCount:2 }, { type:'ice', minCount:2 }], minWins: 5 },
  { id: 'psycho_electric', name: 'PSYCHO ELECTRIC',  subtitle: 'Reads your mind, shocks it',   color: '#ce93d8', glow: '#ee88ff', icon: '🧠', requires: [{ type:'psychic', minCount:2 }, { type:'electric', minCount:2 }], minWins: 5 },

  // Triple archetypes — very rare
  { id: 'demi_god',        name: 'DEMI GOD',         subtitle: 'Beyond human limits',          color: '#ff9000', glow: '#ffcc00', icon: '🌟', requires: [{ type:'physical', minCount:3 }, { type:'fire', minCount:2 }, { type:'electric', minCount:2 }], minWins: 20 },
  { id: 'death_incarnate', name: 'DEATH INCARNATE',  subtitle: 'Why are you still fighting',   color: '#b44aff', glow: '#dd88ff', icon: '💀', requires: [{ type:'shadow', minCount:3 }, { type:'blood', minCount:2 }, { type:'psychic', minCount:2 }], minWins: 20 },
  { id: 'chaos_god',       name: 'CHAOS GOD',        subtitle: 'Rules don\'t apply here',      color: '#ff6e40', glow: '#ff9966', icon: '🌀', requires: [{ type:'chaos', minCount:4 }, { type:'psychic', minCount:2 }], minWins: 30 },

  // Secret variants
  { id: 'stoner',          name: 'ELECTRIC WIZARD',  subtitle: 'Slow hits, weird effects, still wins', color: '#66bb6a', glow: '#88ff44', icon: '🌿', requires: [{ type:'chaos', minCount:2 }, { type:'poison', minCount:2 }, { type:'earth', minCount:1 }], minWins: 0 },
  { id: 'absolute_god',    name: 'ABSOLUTE GOD',     subtitle: 'The highest form',             color: '#ffffff', glow: '#ffffff', icon: '👁️', requires: [{ type:'physical', minCount:2 }, { type:'fire', minCount:2 }, { type:'shadow', minCount:2 }, { type:'holy', minCount:2 }], minWins: 50 },
];

// Move ID → type mapping
export const MOVE_TYPE_MAP: Record<string, MoveType> = {
  jab: 'physical', low_kick: 'physical', uppercut: 'physical', roundhouse: 'physical',
  body_blow: 'physical', knee_strike: 'physical', elbow_smash: 'physical', back_kick: 'physical',
  palm_strike: 'physical', axe_kick: 'physical', spinning_heel: 'physical', drop_kick: 'wind',
  stomp: 'earth', shoulder_ram: 'physical', flying_knee: 'wind', hip_toss: 'physical',
  leg_sweep: 'physical', headbutt: 'earth', piledriver: 'earth', backbreaker: 'physical',
  shoryuken: 'fire', hadoken: 'physical', spin_kick_ex: 'wind', tiger_knee: 'wind',
  soul_drain: 'shadow', earthquake: 'earth', counter_strike: 'physical', ghost_step: 'shadow',
  magnet_grab: 'electric', volt_dash: 'electric', berserker_rush: 'blood', phoenix_flame: 'fire',
  time_stop: 'psychic', meteor_crash: 'fire', void_slash: 'shadow', blood_rage: 'blood',
  mirage_barrage: 'psychic', shadow_world: 'shadow', pulse_cannon: 'electric', earth_armor: 'earth',
  revelation: 'holy', god_fist: 'physical', black_hole: 'shadow', eternal_night: 'shadow',
  true_form: 'chaos', apocalypse: 'chaos', omnislash: 'wind', dimension_break: 'psychic',
  death_star: 'shadow', reality_rend: 'chaos',
  // Poison
  venom_fang: 'poison', toxic_cloud: 'poison',
  // Ice
  ice_lance: 'ice', frozen_earth: 'ice',
  // Holy
  divine_fist: 'holy', angel_descent: 'holy',
};

export function detectBuildVariant(unlockedMoves: string[], wins: number): BuildVariant {
  // Count types
  const counts: Partial<Record<MoveType, number>> = {};
  for (const moveId of unlockedMoves) {
    const t = MOVE_TYPE_MAP[moveId];
    if (t) counts[t] = (counts[t] ?? 0) + 1;
  }

  // Find best matching variant (most specific first — triple > hybrid > pure)
  const sorted = [...BUILD_VARIANTS].sort((a, b) => {
    const aReqs = a.requires.reduce((s, r) => s + r.minCount, 0);
    const bReqs = b.requires.reduce((s, r) => s + r.minCount, 0);
    return bReqs - aReqs;
  });

  for (const variant of sorted) {
    if (wins < variant.minWins) continue;
    const matches = variant.requires.every((req) => (counts[req.type] ?? 0) >= req.minCount);
    if (matches) return variant;
  }

  return { id: 'rookie', name: 'ROOKIE', subtitle: 'Just getting started', color: '#555', glow: '#888', icon: '🥊', requires: [], minWins: 0 };
}
