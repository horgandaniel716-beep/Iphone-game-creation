// Trophy system — earned through wins, streaks, milestones, and achievements
// Displayed in your dojo as flex pieces

export type TrophyCategory = 'win_milestone' | 'streak' | 'style' | 'rank' | 'special' | 'dominance';

export interface Trophy {
  id: string;
  name: string;
  description: string;         // how it's earned
  displayDesc: string;         // what it says on the shelf
  icon: string;
  category: TrophyCategory;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'obsidian';
  model: string;               // visual style for display
  unlockCondition: {
    type: 'wins' | 'streak' | 'rank_reached' | 'flawless' | 'special_move' | 'build_variant' | 'manual';
    value?: number | string;
  };
}

export const TROPHY_RARITY_COLORS = {
  bronze:   '#cd7f32',
  silver:   '#c0c0c0',
  gold:     '#ffd700',
  platinum: '#e5e4e2',
  obsidian: '#b44aff',
};

export const TROPHIES: Trophy[] = [
  // ── WIN MILESTONES ──────────────────────────────────────────────────────────
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first fight',
    displayDesc: 'The first one always means the most.',
    icon: '🩸', category: 'win_milestone', rarity: 'bronze', model: 'cup',
    unlockCondition: { type: 'wins', value: 1 },
  },
  {
    id: 'ten_deep',
    name: 'Ten Deep',
    description: 'Win 10 fights',
    displayDesc: 'Started to figure it out.',
    icon: '🥊', category: 'win_milestone', rarity: 'bronze', model: 'gloves',
    unlockCondition: { type: 'wins', value: 10 },
  },
  {
    id: 'fifty_bodies',
    name: 'Fifty Bodies',
    description: 'Win 50 fights',
    displayDesc: 'Fifty fighters walked in. Fifty walked out broken.',
    icon: '⚰️', category: 'win_milestone', rarity: 'silver', model: 'coffin',
    unlockCondition: { type: 'wins', value: 50 },
  },
  {
    id: 'century',
    name: 'THE CENTURY',
    description: 'Win 100 fights',
    displayDesc: '100 wins. No fluke.',
    icon: '💯', category: 'win_milestone', rarity: 'gold', model: 'plaque',
    unlockCondition: { type: 'wins', value: 100 },
  },
  {
    id: 'war_god',
    name: 'WAR GOD',
    description: 'Win 500 fights',
    displayDesc: 'This room has seen more battles than most arenas.',
    icon: '⚔️', category: 'win_milestone', rarity: 'platinum', model: 'sword',
    unlockCondition: { type: 'wins', value: 500 },
  },
  {
    id: 'untouchable',
    name: 'UNTOUCHABLE',
    description: 'Win 1000 fights',
    displayDesc: 'You are the reason people quit.',
    icon: '👁️', category: 'win_milestone', rarity: 'obsidian', model: 'eye',
    unlockCondition: { type: 'wins', value: 1000 },
  },

  // ── STREAKS ─────────────────────────────────────────────────────────────────
  {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Win 3 in a row',
    displayDesc: 'Momentum is real.',
    icon: '🔥', category: 'streak', rarity: 'bronze', model: 'flame',
    unlockCondition: { type: 'streak', value: 3 },
  },
  {
    id: 'on_fire',
    name: 'ON FIRE',
    description: 'Win 5 in a row',
    displayDesc: 'Five straight. They started talking.',
    icon: '🌋', category: 'streak', rarity: 'silver', model: 'volcano',
    unlockCondition: { type: 'streak', value: 5 },
  },
  {
    id: 'rampage',
    name: 'RAMPAGE',
    description: 'Win 10 in a row',
    displayDesc: 'Didn\'t lose for so long people thought you were broken.',
    icon: '🌪️', category: 'streak', rarity: 'gold', model: 'tornado',
    unlockCondition: { type: 'streak', value: 10 },
  },
  {
    id: 'mythical_streak',
    name: 'MYTHICAL RUN',
    description: 'Win 25 in a row',
    displayDesc: 'Nobody believed the streak was real.',
    icon: '🐉', category: 'streak', rarity: 'platinum', model: 'dragon',
    unlockCondition: { type: 'streak', value: 25 },
  },
  {
    id: 'zero_loss_god',
    name: 'ZERO LOSS',
    description: 'Win 50 in a row',
    displayDesc: 'Fifty consecutive. They wrote about it.',
    icon: '🌑', category: 'streak', rarity: 'obsidian', model: 'void',
    unlockCondition: { type: 'streak', value: 50 },
  },

  // ── STYLE ───────────────────────────────────────────────────────────────────
  {
    id: 'clean_sweep',
    name: 'Clean Sweep',
    description: 'Win a round without taking a hit',
    displayDesc: 'Flawless. They never touched you.',
    icon: '🧹', category: 'style', rarity: 'silver', model: 'broom',
    unlockCondition: { type: 'flawless', value: 1 },
  },
  {
    id: 'ankle_snatcher',
    name: 'ANKLE SNATCHER',
    description: 'Win 20 fights by KO in the final second',
    displayDesc: 'Down to the wire. Every time.',
    icon: '🦶', category: 'style', rarity: 'gold', model: 'boot',
    unlockCondition: { type: 'special_move', value: 'last_second_ko' },
  },
  {
    id: 'no_defense',
    name: 'NO DEFENSE NEEDED',
    description: 'Win 10 fights without blocking',
    displayDesc: 'Didn\'t even need the shield.',
    icon: '😤', category: 'style', rarity: 'gold', model: 'crown',
    unlockCondition: { type: 'special_move', value: 'no_block_wins' },
  },
  {
    id: 'combo_god',
    name: 'COMBO GOD',
    description: 'Land a 20+ hit combo',
    displayDesc: 'Twenty hits. Consecutive. They never escaped.',
    icon: '🔗', category: 'style', rarity: 'platinum', model: 'chain',
    unlockCondition: { type: 'special_move', value: 'combo_20' },
  },

  // ── RANK ────────────────────────────────────────────────────────────────────
  {
    id: 'goon_achieved',
    name: 'Goon Status',
    description: 'Reach Goon rank',
    displayDesc: 'Word spreadin. They know who you are now.',
    icon: '🔱', category: 'rank', rarity: 'silver', model: 'shield',
    unlockCondition: { type: 'rank_reached', value: 'goon' },
  },
  {
    id: 'menace_achieved',
    name: 'Certified Menace',
    description: 'Reach Menace rank',
    displayDesc: 'They\'re checking your profile before they queue.',
    icon: '⚡', category: 'rank', rarity: 'gold', model: 'medal',
    unlockCondition: { type: 'rank_reached', value: 'menace' },
  },
  {
    id: 'technician_achieved',
    name: 'The Technician',
    description: 'Reach Technician rank',
    displayDesc: 'Every move got a reason. They can feel the gap.',
    icon: '🔬', category: 'rank', rarity: 'platinum', model: 'diamond',
    unlockCondition: { type: 'rank_reached', value: 'technician' },
  },
  {
    id: 'legend_achieved',
    name: 'LEGEND',
    description: 'Reach Legend rank',
    displayDesc: 'Your name is the scouting report.',
    icon: '🌟', category: 'rank', rarity: 'obsidian', model: 'star',
    unlockCondition: { type: 'rank_reached', value: 'legend' },
  },

  // ── BUILD VARIANT TROPHIES ──────────────────────────────────────────────────
  {
    id: 'variant_berserker',
    name: 'BERSERKER FLAG',
    description: 'Unlock the BERSERKER build variant',
    displayDesc: 'Blood type. All moves hit harder when you\'re bleeding.',
    icon: '🩸', category: 'special', rarity: 'silver', model: 'banner',
    unlockCondition: { type: 'build_variant', value: 'berserker' },
  },
  {
    id: 'variant_void_walker',
    name: 'VOID WALKER SEAL',
    description: 'Unlock the VOID WALKER build variant',
    displayDesc: 'Shadow type mastery. Certified ghost.',
    icon: '🌑', category: 'special', rarity: 'gold', model: 'seal',
    unlockCondition: { type: 'build_variant', value: 'void_walker' },
  },
  {
    id: 'variant_chaos_god',
    name: 'CHAOS GOD CROWN',
    description: 'Unlock the CHAOS GOD build variant',
    displayDesc: 'The highest chaos. 30 wins and it found you.',
    icon: '🌀', category: 'special', rarity: 'obsidian', model: 'crown',
    unlockCondition: { type: 'build_variant', value: 'chaos_god' },
  },
  {
    id: 'variant_absolute_god',
    name: 'ABSOLUTE GOD RELIC',
    description: 'Unlock the ABSOLUTE GOD build variant',
    displayDesc: 'Four types. Fifty wins. The highest form.',
    icon: '👁️', category: 'special', rarity: 'obsidian', model: 'relic',
    unlockCondition: { type: 'build_variant', value: 'absolute_god' },
  },
  {
    id: 'variant_stoner',
    name: 'ELECTRIC WIZARD PIPE',
    description: 'Unlock the ELECTRIC WIZARD build variant',
    displayDesc: 'The secret path. Found by accident. Somehow still works.',
    icon: '🌿', category: 'special', rarity: 'gold', model: 'pipe',
    unlockCondition: { type: 'build_variant', value: 'stoner' },
  },

  // ── DOMINANCE ───────────────────────────────────────────────────────────────
  {
    id: 'undefeated_season',
    name: 'UNDEFEATED SEASON',
    description: 'Finish a season without a loss',
    displayDesc: 'Perfect record. Framed.',
    icon: '🏆', category: 'dominance', rarity: 'obsidian', model: 'trophy',
    unlockCondition: { type: 'manual', value: 'season_undefeated' },
  },
  {
    id: 'local_legend',
    name: 'LOCAL LEGEND',
    description: 'Beat the same opponent 5 times',
    displayDesc: 'They keep coming back. They keep losing.',
    icon: '📌', category: 'dominance', rarity: 'gold', model: 'pin',
    unlockCondition: { type: 'special_move', value: 'beat_same_5' },
  },
];

// ── TROPHY SHELF POSITIONS ─────────────────────────────────────────────────
// Players can arrange up to 9 trophies on their dojo shelf (3×3 grid)
export type TrophyShelf = (string | null)[];  // array of trophy IDs, length 9

export function checkTrophyUnlock(
  trophyId: string,
  wins: number,
  currentStreak: number,
  rank: string,
  unlockedVariant: string,
  earned: string[]
): boolean {
  if (earned.includes(trophyId)) return false;
  const t = TROPHIES.find((x) => x.id === trophyId);
  if (!t) return false;
  const { type, value } = t.unlockCondition;
  if (type === 'wins') return wins >= (value as number);
  if (type === 'streak') return currentStreak >= (value as number);
  if (type === 'rank_reached') return rankOrder(rank) >= rankOrder(value as string);
  if (type === 'build_variant') return unlockedVariant === value;
  return false;
}

function rankOrder(rank: string): number {
  const order = ['scrapper','goon','stick','menace','problem','technician','sovereign','legend'];
  return order.indexOf(rank);
}

export function getNewTrophies(
  wins: number,
  currentStreak: number,
  rank: string,
  unlockedVariant: string,
  earned: string[]
): Trophy[] {
  return TROPHIES.filter((t) =>
    !earned.includes(t.id) &&
    t.unlockCondition.type !== 'manual' &&
    checkTrophyUnlock(t.id, wins, currentStreak, rank, unlockedVariant, earned)
  );
}
