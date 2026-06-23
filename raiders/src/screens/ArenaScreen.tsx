import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { buildArenaHtml, STAGES } from '../game/arenaHtml';
import type { StageId } from '../game/arenaHtml';
import { getCharacter, CHARACTERS } from '../lib/characters';
import StageSelectScreen from './StageSelectScreen';
import type { Fighter, BattleResult } from '../types';

type Phase = 'idle' | 'stage_select' | 'matchmaking' | 'battle';

function makeBotFighter(level: number): Fighter {
  const names = ['Shadow', 'Vex', 'Krom', 'Zira', 'Nox', 'Dusk', 'Cipher', 'Raze'];
  return {
    id: 'bot_' + Date.now(),
    userId: 'bot',
    name: names[Math.floor(Math.random() * names.length)],
    tag: 'BOT',
    level,
    xp: 0,
    currency: 0,
    wins: Math.floor(Math.random() * 20),
    losses: Math.floor(Math.random() * 10),
    selectedCharacter: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id,
    equipment: { head: null, body: null, weapon: null, boots: null },
    stats: { health: 100, attack: 50, defense: 40, speed: 90 },
  };
}

export default function ArenaScreen() {
  const { fighter, addCurrency, addXP, recordBattle } = useGameStore();
  const [phase, setPhase]       = useState<Phase>('idle');
  const [stageId, setStageId]   = useState<StageId>('favelas');
  const [html, setHtml]         = useState('');
  const webRef = useRef<WebView<object>>(null);

  async function startBattle(sid: StageId) {
    if (!fighter) return;
    setStageId(sid);
    setPhase('matchmaking');
    await new Promise((r) => setTimeout(r, 1400));

    let opponent: Fighter;
    try {
      const snap = await getDocs(
        query(collection(db, 'fighters'), where('userId', '!=', fighter.userId), limit(10))
      );
      opponent = !snap.empty
        ? snap.docs.map((d) => d.data() as Fighter)[Math.floor(Math.random() * snap.docs.length)]
        : makeBotFighter(Math.max(1, fighter.level + Math.floor(Math.random() * 3 - 1)));
    } catch {
      opponent = makeBotFighter(Math.max(1, fighter.level + Math.floor(Math.random() * 3 - 1)));
    }

    const playerChar   = getCharacter(fighter.selectedCharacter);
    const opponentChar = getCharacter(opponent.selectedCharacter);
    setHtml(buildArenaHtml(fighter, playerChar, opponent, opponentChar, sid));
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
          roundsWon: data.roundsWon,
          opponentName: 'Opponent',
          opponentCharacter: 'unknown',
          timestamp: Date.now(),
        };
        addCurrency(data.currencyEarned);
        addXP(data.xpEarned);
        recordBattle(result);
        setTimeout(() => setPhase('idle'), 3500);
      }
    } catch {}
  }

  const currentChar = getCharacter(fighter?.selectedCharacter ?? 'apex');

  if (phase === 'battle') {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#000' } as any}
          onMessage={handleWebMessage}
          javaScriptEnabled
          scrollEnabled={false}
        />
      </View>
    );
  }

  if (phase === 'stage_select') {
    return (
      <StageSelectScreen
        onSelect={(sid) => startBattle(sid)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ ARENA</Text>
      <Text style={styles.subtitle}>BEST OF 3 ROUNDS • 99 SECONDS PER ROUND</Text>

      {phase === 'matchmaking' ? (
        <View style={styles.matchmaking}>
          <ActivityIndicator size="large" color="#e8c84a" />
          <Text style={styles.matchText}>Finding opponent...</Text>
          <Text style={styles.matchStage}>
            Stage: {STAGES.find((s) => s.id === stageId)?.icon} {STAGES.find((s) => s.id === stageId)?.name}
          </Text>
        </View>
      ) : (
        <>
          {/* Fighter card */}
          <View style={[styles.fighterCard, { borderColor: currentChar.primaryColor + '66' }]}>
            <Text style={styles.fighterIcon}>{currentChar.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>YOUR FIGHTER</Text>
              <Text style={[styles.cardName, { color: currentChar.primaryColor }]}>
                {fighter?.name}
              </Text>
              <Text style={styles.cardCharacter}>
                {currentChar.name} — {currentChar.subtitle}
              </Text>
              <Text style={styles.cardRecord}>
                LVL {fighter?.level}  •  {fighter?.wins}W / {fighter?.losses}L
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.guide}>
            <Text style={styles.guideTitle}>CONTROLS</Text>
            <View style={styles.guideRow}>
              <View style={styles.guideItem}>
                <Text style={styles.guideKey}>🕹️</Text>
                <Text style={styles.guideDesc}>Left — joystick{'\n'}move + jump + crouch</Text>
              </View>
              <View style={styles.guideItem}>
                <Text style={styles.guideKey}>L / H / K</Text>
                <Text style={styles.guideDesc}>Light, Heavy{'\n'}Kick attacks</Text>
              </View>
              <View style={styles.guideItem}>
                <Text style={[styles.guideKey, { color: currentChar.accentColor }]}>SP</Text>
                <Text style={styles.guideDesc}>{currentChar.specialName}</Text>
              </View>
            </View>
            <Text style={styles.guideTip}>
              💊 Run to artifact pickups mid-fight — risky but worth it
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.battleButton, { backgroundColor: currentChar.primaryColor }]}
            onPress={() => setPhase('stage_select')}
          >
            <Text style={styles.battleButtonText}>SELECT STAGE</Text>
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
  title: { color: '#e8c84a', fontSize: 42, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  subtitle: { color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 28 },
  matchmaking: { alignItems: 'center', gap: 12 },
  matchText: { color: '#aaa', fontSize: 16 },
  matchStage: { color: '#555', fontSize: 13 },
  fighterCard: {
    width: '100%',
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  fighterIcon: { fontSize: 44 },
  cardLabel: { color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  cardName: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  cardCharacter: { color: '#888', fontSize: 12, marginTop: 2 },
  cardRecord: { color: '#555', fontSize: 12, marginTop: 4 },
  guide: {
    width: '100%',
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  guideTitle: { color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  guideRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  guideItem: { flex: 1, alignItems: 'center' },
  guideKey: { color: '#e8c84a', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  guideDesc: { color: '#666', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  guideTip: { color: '#444', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  battleButton: { width: '100%', borderRadius: 14, paddingVertical: 20, alignItems: 'center' },
  battleButtonText: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 4 },
});
