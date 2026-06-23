import { ref, set, onValue, off, remove, update, get } from 'firebase/database';
import { rtdb } from './firebase';
import type { Fighter } from '../types';

export type MatchPhase = 'waiting' | 'ready' | 'fighting' | 'done';

export interface MatchInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  light: boolean;
  heavy: boolean;
  kick: boolean;
  special: boolean;
  super: boolean;
  frame: number;
  ts: number;
}

export interface MatchState {
  id: string;
  phase: MatchPhase;
  stageId: string;
  player1: Fighter;
  player2: Fighter | null;
  p1Input: MatchInput | null;
  p2Input: MatchInput | null;
  result: { winner: 'p1' | 'p2' | 'draw'; p1Currency: number; p2Currency: number; p1Xp: number; p2Xp: number } | null;
}

function matchRef(matchId: string) {
  return ref(rtdb, `matches/${matchId}`);
}

export function generateMatchId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function createMatch(fighter: Fighter, stageId: string): Promise<string> {
  const matchId = generateMatchId();
  const state: MatchState = {
    id: matchId,
    phase: 'waiting',
    stageId,
    player1: fighter,
    player2: null,
    p1Input: null,
    p2Input: null,
    result: null,
  };
  await set(matchRef(matchId), state);
  // auto-cleanup after 10 minutes
  setTimeout(() => remove(matchRef(matchId)), 10 * 60 * 1000);
  return matchId;
}

export async function joinMatch(matchId: string, fighter: Fighter): Promise<boolean> {
  const snap = await get(matchRef(matchId));
  if (!snap.exists()) return false;
  const state = snap.val() as MatchState;
  if (state.phase !== 'waiting' || state.player2 !== null) return false;
  await update(matchRef(matchId), { player2: fighter, phase: 'ready' });
  return true;
}

export function subscribeToMatch(matchId: string, cb: (state: MatchState) => void) {
  const r = matchRef(matchId);
  onValue(r, (snap) => { if (snap.exists()) cb(snap.val() as MatchState); });
  return () => off(r);
}

export async function pushInput(matchId: string, role: 'p1' | 'p2', input: MatchInput) {
  await update(matchRef(matchId), { [`${role}Input`]: input });
}

export async function pushResult(matchId: string, result: MatchState['result']) {
  await update(matchRef(matchId), { phase: 'done', result });
}

export async function cleanupMatch(matchId: string) {
  await remove(matchRef(matchId));
}
