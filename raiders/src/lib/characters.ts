import type { CharacterDef } from '../types';

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'apex',
    name: 'APEX',
    subtitle: 'Tech CEO / Exo-Suit',
    archetype: 'balanced',
    primaryColor: '#1a73e8',
    accentColor: '#4fc3f7',
    glowColor: '#00bcd4',
    stats: { health: 200, attack: 55, defense: 50, speed: 90 },
    specialName: 'Market Crash',
    specialDesc: 'Charges gauntlets and fires a bolt of electric energy forward',
    icon: '⚡',
    unlockCost: 0,
  },
  {
    id: 'venom',
    name: 'VENOM',
    subtitle: 'Street Racer / Drifter',
    archetype: 'rushdown',
    primaryColor: '#e53935',
    accentColor: '#ff6f00',
    glowColor: '#ff5722',
    stats: { health: 175, attack: 60, defense: 40, speed: 130 },
    specialName: 'Burnout',
    specialDesc: 'Lightning-fast slide kick that covers the full screen',
    icon: '🔥',
    unlockCost: 0,
  },
  {
    id: 'titan',
    name: 'TITAN',
    subtitle: 'Pro Athlete / Powerhouse',
    archetype: 'powerhouse',
    primaryColor: '#388e3c',
    accentColor: '#b2ff59',
    glowColor: '#76ff03',
    stats: { health: 250, attack: 80, defense: 65, speed: 65 },
    specialName: 'Overdrive',
    specialDesc: 'Armored super punch — absorbs hits and sends opponent flying',
    icon: '💪',
    unlockCost: 500,
  },
  {
    id: 'ghost',
    name: 'GHOST',
    subtitle: 'Parkour / Free Runner',
    archetype: 'trickster',
    primaryColor: '#7b1fa2',
    accentColor: '#ce93d8',
    glowColor: '#e040fb',
    stats: { health: 175, attack: 55, defense: 35, speed: 120 },
    specialName: 'Phase Shift',
    specialDesc: 'Teleports behind the opponent and strikes from the shadows',
    icon: '👻',
    unlockCost: 500,
  },
];

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
