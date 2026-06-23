import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { buildArenaHtml, STAGES } from '../game/arenaHtml';
import type { StageId } from '../game/arenaHtml';
import { getCharacter, CHARACTERS } from '../lib/characters';
import StageSelectScreen from './StageSelectScreen';
import MultiplayerLobbyScreen from './MultiplayerLobbyScreen';
import ScoutingReportScreen from './ScoutingReportScreen';
import { getNewTrophies } from '../lib/trophies';
import { detectBuildVariant } from '../lib/moveTypes';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Fighter, BattleResult } from '../types';
import type { MatchState } from '../lib/matchmaking';

type Phase = 'idle' | 'mode_select' | 'stage_select' | 'matchmaking' | 'scouting' | 'battle' | 'multiplayer_lobby';

function makeBotFighter(level: number): Fighter {
  const names = ['Shadow', 'Vex', 'Krom', 'Zira', 'Nox', 'Dusk', 'Cipher', 'Raze', 'Blaze', 'Hex'];
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
  const [phase, setPhase]   = useState<Phase>('idle');
  const [stageId, setStageId] = useState<StageId>('favelas');
  const [html, setHtml]     = useState('');
  const [pendingOpponent, setPendingOpponent] = useState<Fighter | null>(null);
  const webRef = useRef<WebView<object>>(null);

  async function startBattle(sid: StageId) {
    if (!fighter) return;
    setStageId(sid);
    setPhase('matchmaking');
    await new Promise((r) => setTimeout(r, 1200));
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
    setPendingOpponent(opponent);
    setPhase('scouting');
  }

  function startMultiplayerBattle(matchState: MatchState, role: 'p1' | 'p2') {
    if (!fighter || !matchState.player2) return;
    const p1 = matchState.player1;
    const p2 = matchState.player2;
    const playerFighter = role === 'p1' ? p1 : p2;
    const opponentFighter = role === 'p1' ? p2 : p1;
    const playerChar   = getCharacter(playerFighter.selectedCharacter);
    const opponentChar = getCharacter(opponentFighter.selectedCharacter);
    setHtml(buildArenaHtml(
      playerFighter, playerChar,
      opponentFighter, opponentChar,
      (matchState.stageId as StageId) || 'neon_city',
      true, role, matchState.id
    ));
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

        // Check trophies BEFORE recordBattle updates state
        if (data.won && fighter) {
          const newWins = fighter.wins + 1;
          const newStreak = (fighter.currentStreak ?? 0) + 1;
          const variant = detectBuildVariant(fighter.unlockedMoves ?? [], newWins);
          const earned = fighter.earnedTrophies ?? [];
          const newTrophies = getNewTrophies(newWins, newStreak, fighter.rank?.tier ?? 'bronze', variant.id, earned);
          if (newTrophies.length > 0) {
            setTimeout(() => {
              Alert.alert(
                '🏆 TROPHY UNLOCKED',
                newTrophies.map((t) => `${t.icon} ${t.name}\n"${t.displayDesc}"`).join('\n\n') +
                '\n\nDisplay it in your Dojo.',
                [{ text: 'LET\'S GO' }]
              );
            }, 2000);
          }
        }

        recordBattle(result);

        // Persist wins/losses/streak/trophies to Firestore
        if (fighter && fighter.userId !== 'bot') {
          const newWins2  = fighter.wins + (data.won ? 1 : 0);
          const newLosses = fighter.losses + (data.won ? 0 : 1);
          const newStreak = data.won ? (fighter.currentStreak ?? 0) + 1 : 0;
          const variant2  = detectBuildVariant(fighter.unlockedMoves ?? [], newWins2);
          const earned2   = fighter.earnedTrophies ?? [];
          const newTrophies2 = getNewTrophies(newWins2, newStreak, fighter.rank?.tier ?? 'bronze', variant2.id, earned2);
          const earnedTrophies2 = [...earned2, ...newTrophies2.map((t) => t.id)];
          updateDoc(doc(db, 'fighters', fighter.userId), {
            wins: newWins2,
            losses: newLosses,
            currency: fighter.currency + data.currencyEarned,
            currentStreak: newStreak,
            earnedTrophies: earnedTrophies2,
          }).catch(() => {});
        }

        setTimeout(() => setPhase('idle'), 3500);
      }
    } catch {}
  }

  const currentChar = getCharacter(fighter?.selectedCharacter ?? 'apex');

  if (phase === 'scouting' && fighter && pendingOpponent) {
    return (
      <ScoutingReportScreen
        player={fighter}
        opponent={pendingOpponent}
        onBack={() => { setPendingOpponent(null); setPhase('stage_select'); }}
        onConfirm={() => {
          const playerChar   = getCharacter(fighter.selectedCharacter);
          const opponentChar = getCharacter(pendingOpponent.selectedCharacter);
          setHtml(buildArenaHtml(fighter, playerChar, pendingOpponent, opponentChar, stageId));
          setPhase('battle');
        }}
      />
    );
  }

  if (phase === 'battle') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <WebView
          ref={webRef}
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#000' } as any}
          onMessage={handleWebMessage}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    );
  }

  if (phase === 'multiplayer_lobby') {
    return (
      <MultiplayerLobbyScreen
        onMatchReady={startMultiplayerBattle}
        onBack={() => setPhase('idle')}
      />
    );
  }

  if (phase === 'stage_select') {
    return <StageSelectScreen onSelect={(sid) => startBattle(sid)} />;
  }

  if (phase === 'matchmaking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e8c84a" />
        <Text style={styles.matchText}>Finding opponent...</Text>
        <Text style={styles.matchStage}>
          {STAGES.find((s) => s.id === stageId)?.icon} {STAGES.find((s) => s.id === stageId)?.name}
        </Text>
      </View>
    );
  }

  // ── MODE SELECT ──────────────────────────────────────────────────────────────
  if (phase === 'mode_select') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('idle')}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SELECT MODE</Text>
        <Text style={styles.subtitle}>HOW DO YOU WANT TO FIGHT?</Text>

        <TouchableOpacity
          style={[styles.modeCard, { borderColor: currentChar.primaryColor + '66' }]}
          onPress={() => setPhase('stage_select')}
        >
          <Text style={styles.modeIcon}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeName}>RANKED vs AI</Text>
            <Text style={styles.modeDesc}>Fight an opponent. Earn gold, XP and MMR.</Text>
          </View>
          <Text style={styles.modeArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeCard, { borderColor: '#4a9eff66' }]}
          onPress={() => setPhase('multiplayer_lobby')}
        >
          <Text style={styles.modeIcon}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeName}>1v1 LIVE</Text>
            <Text style={styles.modeDesc}>Fight a friend side by side in real time. Share a code.</Text>
          </View>
          <Text style={styles.modeArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeCard, { borderColor: '#ff440066', opacity: 0.5 }]}
          onPress={() => {}}
        >
          <Text style={styles.modeIcon}>🧟</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeName}>ZOMBIES — COMING SOON</Text>
            <Text style={styles.modeDesc}>Survive wave after wave with your clan.</Text>
          </View>
          <Text style={styles.modeArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── IDLE / HOME ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ ARENA</Text>
      <Text style={styles.subtitle}>BEST OF 3 ROUNDS  •  99 SECONDS</Text>

      <View style={[styles.fighterCard, { borderColor: currentChar.primaryColor + '66' }]}>
        <Text style={styles.fighterIcon}>{currentChar.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>YOUR FIGHTER</Text>
          <Text style={[styles.cardName, { color: currentChar.primaryColor }]}>{fighter?.name}</Text>
          <Text style={styles.cardCharacter}>{currentChar.name} — {currentChar.subtitle}</Text>
          <Text style={styles.cardRecord}>LVL {fighter?.level}  •  {fighter?.wins}W / {fighter?.losses}L</Text>
        </View>
      </View>

      {/* Stats preview */}
      <View style={styles.statsRow}>
        <StatBubble icon="❤️" label="HP" value={String(currentChar.stats.health)} />
        <StatBubble icon="⚔️" label="ATK" value={String(currentChar.stats.attack)} />
        <StatBubble icon="🛡" label="DEF" value={String(currentChar.stats.defense)} />
        <StatBubble icon="💨" label="SPD" value={String(currentChar.stats.speed)} />
      </View>

      {/* Controls guide */}
      <View style={styles.guide}>
        <Text style={styles.guideTitle}>CONTROLS</Text>
        <View style={styles.guideRow}>
          <GuideItem icon="🕹️" label="Move / Jump" />
          <GuideItem icon="L H K" label="Light Heavy Kick" accent />
          <GuideItem icon="SP" label={currentChar.specialName} accent />
          <GuideItem icon="↑↑" label={currentChar.superName} superBtn />
        </View>
        <Text style={styles.guideTip}>Collect power-ups mid-fight  •  Fill ↑↑ bar for Super</Text>
      </View>

      <TouchableOpacity
        style={[styles.fightBtn, { backgroundColor: currentChar.primaryColor }]}
        onPress={() => setPhase('mode_select')}
      >
        <Text style={styles.fightBtnText}>FIGHT</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatBubble({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statBubble}>
      <Text style={styles.statBubbleIcon}>{icon}</Text>
      <Text style={styles.statBubbleVal}>{value}</Text>
      <Text style={styles.statBubbleLabel}>{label}</Text>
    </View>
  );
}

function GuideItem({ icon, label, accent, superBtn }: { icon: string; label: string; accent?: boolean; superBtn?: boolean }) {
  return (
    <View style={styles.guideItem}>
      <Text style={[styles.guideKey, superBtn && { color: '#ff4400' }, accent && { color: '#e8c84a' }]}>{icon}</Text>
      <Text style={styles.guideDesc}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 24, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20 },
  backText: { color: '#555', fontSize: 14 },
  title: { color: '#e8c84a', fontSize: 40, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  subtitle: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 20 },
  fighterCard: {
    width: '100%', backgroundColor: '#12121a', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, marginBottom: 12,
  },
  fighterIcon: { fontSize: 42 },
  cardLabel: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  cardName: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  cardCharacter: { color: '#666', fontSize: 11, marginTop: 2 },
  cardRecord: { color: '#444', fontSize: 11, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 12 },
  statBubble: { flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e2e' },
  statBubbleIcon: { fontSize: 14, marginBottom: 2 },
  statBubbleVal: { color: '#fff', fontSize: 14, fontWeight: '800' },
  statBubbleLabel: { color: '#333', fontSize: 8, letterSpacing: 1, marginTop: 1 },
  guide: { width: '100%', backgroundColor: '#12121a', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#1e1e2e' },
  guideTitle: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  guideRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  guideItem: { flex: 1, alignItems: 'center' },
  guideKey: { color: '#555', fontWeight: '900', fontSize: 13, marginBottom: 3 },
  guideDesc: { color: '#444', fontSize: 9, textAlign: 'center', lineHeight: 13 },
  guideTip: { color: '#333', fontSize: 10, textAlign: 'center', fontStyle: 'italic' },
  fightBtn: { width: '100%', borderRadius: 14, paddingVertical: 20, alignItems: 'center' },
  fightBtnText: { color: '#fff', fontWeight: '900', fontSize: 24, letterSpacing: 5 },
  matchText: { color: '#aaa', fontSize: 16, marginTop: 16 },
  matchStage: { color: '#555', fontSize: 13, marginTop: 8 },
  // mode select
  modeCard: {
    width: '100%', backgroundColor: '#12121a', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, marginBottom: 12,
  },
  modeIcon: { fontSize: 32 },
  modeName: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 3 },
  modeDesc: { color: '#555', fontSize: 11, lineHeight: 15 },
  modeArrow: { color: '#333', fontSize: 22 },
});
