import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useGameStore } from '../store/gameStore';
import { getCharacter } from '../lib/characters';
import { BOSSES, makeBossFighter } from '../lib/bosses';
import { buildArenaHtml } from '../game/arenaHtml';
import type { BattleResult } from '../types';

interface Props {
  onBack: () => void;
}

export default function BossRushScreen({ onBack }: Props) {
  const { fighter, addCurrency, addXP } = useGameStore();
  const [phase, setPhase] = useState<'select' | 'battle'>('select');
  const [html, setHtml] = useState('');
  const [activeBossId, setActiveBossId] = useState('');

  const defeatedBosses: string[] = (fighter as any)?.defeatedBosses ?? [];

  function isBossUnlocked(bossId: string): boolean {
    const boss = BOSSES.find((b) => b.id === bossId);
    if (!boss) return false;
    if (!boss.locked) return true;
    // Check if the prerequisite boss was defeated
    const prevBoss = BOSSES[BOSSES.findIndex((b) => b.id === bossId) - 1];
    return prevBoss ? defeatedBosses.includes(prevBoss.id) : true;
  }

  function startBossFight(bossId: string) {
    if (!fighter) return;
    const boss = BOSSES.find((b) => b.id === bossId);
    if (!boss) return;
    if (!isBossUnlocked(bossId)) {
      Alert.alert('LOCKED', boss.lockedReason ?? 'Defeat previous boss first');
      return;
    }
    const bossFighter = makeBossFighter(boss);
    const playerChar  = getCharacter(fighter.selectedCharacter);
    const bossChar    = getCharacter(boss.characterId);
    // Boss fights always use the appropriate arena for their difficulty
    const stageMap: Record<number, any> = {
      1: 'back_alley',
      2: 'underground',
      3: 'stadium',
      4: 'colosseum',
      5: 'void_throne',
    };
    const stageId = stageMap[boss.difficulty] ?? 'stadium';
    setHtml(buildArenaHtml(fighter, playerChar, bossFighter, bossChar, stageId));
    setActiveBossId(bossId);
    setPhase('battle');
  }

  function handleWebMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'BATTLE_RESULT') {
        const boss = BOSSES.find((b) => b.id === activeBossId);
        if (!boss) { setTimeout(() => setPhase('select'), 2000); return; }

        if (data.won) {
          addCurrency(boss.rewards.currency);
          addXP(boss.rewards.xp);
          setTimeout(() => {
            Alert.alert(
              `🏆 BOSS DEFEATED`,
              `You beat ${boss.name}!\n\n+${boss.rewards.currency} gold  •  +${boss.rewards.xp} XP\n\nREWARD: ${boss.rewards.itemDesc}`,
              [{ text: 'TAKE IT', onPress: () => setPhase('select') }]
            );
          }, 1500);
        } else {
          setTimeout(() => {
            Alert.alert(
              `💀 DEFEATED`,
              `${boss.name} sent you home.\n\nStudy the tape. Come back stronger.`,
              [{ text: 'REMATCH', onPress: () => startBossFight(activeBossId) },
               { text: 'BACK',   onPress: () => setPhase('select') }]
            );
          }, 1500);
        }
      }
    } catch {}
  }

  if (phase === 'battle') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <WebView
          source={{ html }}
          style={{ flex: 1 } as any}
          onMessage={handleWebMessage}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>← BACK</Text></TouchableOpacity>
        <Text style={styles.title}>BOSS RUSH</Text>
        <View style={{ width: 50 }} />
      </View>
      <Text style={styles.subtitle}>Defeat legendary fighters for rare rewards</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {BOSSES.map((boss, i) => {
          const unlocked = isBossUnlocked(boss.id);
          const defeated = defeatedBosses.includes(boss.id);
          return (
            <TouchableOpacity
              key={boss.id}
              style={[
                styles.bossCard,
                { borderColor: unlocked ? boss.color + '44' : '#1a1a2e' },
                !unlocked && styles.bossCardLocked,
              ]}
              onPress={() => startBossFight(boss.id)}
              activeOpacity={unlocked ? 0.7 : 0.5}
            >
              {/* Difficulty pips */}
              <View style={styles.diffRow}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <View
                    key={j}
                    style={[styles.diffPip, { backgroundColor: j < boss.difficulty ? boss.color : '#1a1a2e' }]}
                  />
                ))}
                <Text style={[styles.diffLabel, { color: boss.color }]}>{boss.difficultyLabel}</Text>
              </View>

              <View style={styles.bossRow}>
                <Text style={[styles.bossIcon, !unlocked && { opacity: 0.3 }]}>{unlocked ? boss.icon : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bossName, { color: unlocked ? boss.color : '#333' }]}>{boss.name}</Text>
                  <Text style={[styles.bossTitle, { color: unlocked ? '#666' : '#2a2a2a' }]}>{boss.title}</Text>
                  {unlocked && <Text style={styles.bossLore} numberOfLines={2}>{boss.lore}</Text>}
                  {!unlocked && <Text style={styles.lockedText}>{boss.lockedReason}</Text>}
                </View>
                {defeated && <Text style={styles.defeatedBadge}>✓ DONE</Text>}
              </View>

              {unlocked && (
                <>
                  <View style={styles.rulesRow}>
                    {boss.specialRules.map((rule, ri) => (
                      <View key={ri} style={[styles.rulePill, { borderColor: boss.color + '33' }]}>
                        <Text style={[styles.ruleText, { color: boss.color }]}>⚠ {rule}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardIcon}>💰</Text>
                    <Text style={styles.rewardText}>{boss.rewards.currency} gold  •  {boss.rewards.xp} XP</Text>
                    <Text style={styles.rewardItem}>+ {boss.rewards.itemDesc}</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const C = '#080810';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 8 },
  back: { color: '#555', fontSize: 14 },
  title: { color: '#e8c84a', fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  subtitle: { color: '#333', fontSize: 10, letterSpacing: 2, textAlign: 'center', marginBottom: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },

  bossCard: {
    backgroundColor: '#0e0e18', borderRadius: 18, padding: 16,
    borderWidth: 1, gap: 12,
  },
  bossCardLocked: { opacity: 0.6 },

  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  diffPip: { width: 20, height: 4, borderRadius: 2 },
  diffLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginLeft: 4 },

  bossRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  bossIcon: { fontSize: 44 },
  bossName: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  bossTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  bossLore: { color: '#555', fontSize: 11, marginTop: 6, lineHeight: 16 },
  lockedText: { color: '#2a2a3a', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  defeatedBadge: { color: '#2ecc71', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  rulesRow: { flexDirection: 'column', gap: 6 },
  rulePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  ruleText: { fontSize: 10, fontWeight: '700' },

  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#12121a', borderRadius: 10, padding: 10 },
  rewardIcon: { fontSize: 16 },
  rewardText: { color: '#e8c84a', fontSize: 11, fontWeight: '800' },
  rewardItem: { color: '#666', fontSize: 10, flex: 1, textAlign: 'right' },
});
