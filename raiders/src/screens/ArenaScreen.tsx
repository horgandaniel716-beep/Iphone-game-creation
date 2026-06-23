import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { buildArenaHtml } from '../game/arenaHtml';
import type { Raider, Base, BattleResult } from '../types';

type Phase = 'matchmaking' | 'battle' | 'idle';

export default function ArenaScreen() {
  const { raider, addCurrency, addXP, recordBattle } = useGameStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [html, setHtml] = useState('');
  const webRef = useRef<WebView<object>>(null);

  async function findOpponent(): Promise<{ raider: Raider; base: Base } | null> {
    if (!raider) return null;
    try {
      // Get a random opponent (not the current player)
      const snap = await getDocs(
        query(collection(db, 'raiders'), where('userId', '!=', raider.userId), limit(10))
      );
      if (snap.empty) return null;
      const docs = snap.docs.map((d) => d.data() as Raider);
      const oppRaider = docs[Math.floor(Math.random() * docs.length)];
      const baseSnap = await getDocs(
        query(collection(db, 'bases'), where('userId', '==', oppRaider.userId), limit(1))
      );
      const oppBase = baseSnap.empty ? null : (baseSnap.docs[0].data() as Base);
      return oppBase ? { raider: oppRaider, base: oppBase } : null;
    } catch {
      return null;
    }
  }

  function createBotOpponent(): { raider: Raider; base: Base } {
    const names = ['Shadow', 'Vex', 'Krom', 'Zira', 'Nox', 'Dusk'];
    const name = names[Math.floor(Math.random() * names.length)] + ' the ' +
      ['Cursed', 'Fallen', 'Vile', 'Dark', 'Grim'][Math.floor(Math.random() * 5)];
    const lvl = Math.max(1, (raider?.level ?? 1) + Math.floor(Math.random() * 3 - 1));

    const botRaider: Raider = {
      id: 'bot_' + Date.now(),
      userId: 'bot',
      name,
      level: lvl,
      xp: 0,
      currency: 0,
      wins: Math.floor(Math.random() * 20),
      losses: Math.floor(Math.random() * 10),
      raids: 0,
      equipment: { head: null, body: null, weapon: null, boots: null },
      stats: {
        health: 80 + lvl * 15,
        attack: 15 + lvl * 4,
        defense: 8 + lvl * 2,
        speed: 70 + lvl * 3,
      },
      avatarStyle: { skinTone: '#8B4513', hairColor: '#000', outfit: 'default' },
    };

    const botBase: Base = {
      id: 'bot_base_' + Date.now(),
      userId: 'bot',
      name: `${name}'s Lair`,
      layout: { walls: [], floors: [], traps: [] },
      demons: [],
      trophies: 0,
      lastRaidedAt: null,
    };

    return { raider: botRaider, base: botBase };
  }

  async function startBattle() {
    if (!raider) return;
    setPhase('matchmaking');
    await new Promise((r) => setTimeout(r, 1500));

    let opponent = await findOpponent();
    if (!opponent) opponent = createBotOpponent();

    const gameHtml = buildArenaHtml(raider, opponent.raider, opponent.base.demons);
    setHtml(gameHtml);
    setPhase('battle');
  }

  function handleWebMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'BATTLE_RESULT') {
        const result: BattleResult = {
          won: data.won,
          currencyEarned: data.currencyEarned,
          xpEarned: data.xpEarned,
          durationSeconds: 60,
          opponentId: 'unknown',
          opponentName: 'Opponent',
          timestamp: Date.now(),
        };
        addCurrency(data.currencyEarned);
        addXP(data.xpEarned);
        recordBattle(result);
        setTimeout(() => setPhase('idle'), 3000);
      }
    } catch {}
  }

  if (phase === 'battle') {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#0a0a0f' } as any}
          onMessage={handleWebMessage}
          javaScriptEnabled
          allowsInlineMediaPlayback
          scrollEnabled={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ ARENA</Text>
      <Text style={styles.subtitle}>Fight raiders. Earn gold. Rise up.</Text>

      {phase === 'matchmaking' ? (
        <View style={styles.matchmaking}>
          <ActivityIndicator size="large" color="#e8c84a" />
          <Text style={styles.matchText}>Finding opponent...</Text>
        </View>
      ) : (
        <>
          <View style={styles.playerCard}>
            <Text style={styles.cardLabel}>YOUR RAIDER</Text>
            <Text style={styles.cardName}>{raider?.name}</Text>
            <Text style={styles.cardStat}>Level {raider?.level}  •  {raider?.wins}W / {raider?.losses}L</Text>
            <Text style={styles.cardStat}>
              HP {raider?.stats.health}  ATK {raider?.stats.attack}  DEF {raider?.stats.defense}
            </Text>
          </View>

          <View style={styles.rules}>
            <Text style={styles.rulesTitle}>HOW TO FIGHT</Text>
            <Text style={styles.rulesText}>🕹  Left side — virtual joystick to move</Text>
            <Text style={styles.rulesText}>⚔️  Right side — tap to attack</Text>
            <Text style={styles.rulesText}>💀  Deplete enemy HP or survive the timer</Text>
            <Text style={styles.rulesText}>🔮  Defeat their base demons too</Text>
          </View>

          <TouchableOpacity style={styles.battleButton} onPress={startBattle}>
            <Text style={styles.battleButtonText}>ENTER BATTLE</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#e8c84a',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    color: '#555',
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 32,
    textTransform: 'uppercase',
  },
  playerCard: {
    width: '100%',
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  cardLabel: { color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  cardName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardStat: { color: '#888', fontSize: 13, marginTop: 2 },
  rules: {
    width: '100%',
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    gap: 8,
  },
  rulesTitle: { color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  rulesText: { color: '#aaa', fontSize: 14 },
  battleButton: {
    backgroundColor: '#e8c84a',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 60,
  },
  battleButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
  },
  matchmaking: { alignItems: 'center', gap: 16 },
  matchText: { color: '#aaa', fontSize: 16 },
});
