import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useGameStore } from '../store/gameStore';
import { getCharacter, CHARACTERS } from '../lib/characters';
import { buildArenaHtml } from '../game/arenaHtml';
import type { Fighter } from '../types';

interface Props {
  onBack: () => void;
}

// Zombie wave data — escalating difficulty
const WAVE_CONFIG = [
  { wave: 1, label: 'THE BLOCK',      count: 2, mult: 0.7,  reward: 80,   desc: 'Scrappy neighborhood hands. No technique.' },
  { wave: 2, label: 'THE CREW',       count: 3, mult: 0.85, reward: 130,  desc: 'They move in packs. Watch the sides.' },
  { wave: 3, label: 'THE VETERANS',   count: 3, mult: 1.0,  reward: 200,  desc: 'They\'ve been in fights before. They know.' },
  { wave: 4, label: 'THE UNDEAD',     count: 4, mult: 1.2,  reward: 300,  desc: 'HP doesn\'t matter anymore. They keep coming.' },
  { wave: 5, label: 'THE POSSESSED',  count: 4, mult: 1.5,  reward: 450,  desc: 'Something wrong with them. Twice the speed.' },
  { wave: 6, label: 'THE NIGHTMARE',  count: 5, mult: 1.8,  reward: 650,  desc: 'They\'re not stopping. Ever.' },
  { wave: 7, label: 'BOSS WAVE',      count: 1, mult: 3.0,  reward: 1200, desc: 'One. Extremely op. Good luck.' },
];

const ZOMBIE_NAMES = [
  'REANIMATED', 'THE HOLLOW', 'DEAD HANDS', 'GHOST WALKER', 'NIGHT CRAWLER',
  'THE ROTTING', 'SOULLESS', 'BLOOD HUNGRY', 'THE CURSED', 'VOID SPAWN',
];

function makeZombieFighter(wave: number, index: number): Fighter {
  const waveData = WAVE_CONFIG[wave - 1] ?? WAVE_CONFIG[WAVE_CONFIG.length - 1];
  const name = ZOMBIE_NAMES[(wave * 3 + index) % ZOMBIE_NAMES.length];
  const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  return {
    id: `zombie_w${wave}_${index}_${Date.now()}`,
    userId: 'zombie',
    name,
    tag: `W${wave}`,
    level: wave * 5,
    xp: 0,
    currency: 0,
    wins: wave * 3,
    losses: 0,
    selectedCharacter: char.id,
    equipment: { head: null, body: null, weapon: null, boots: null },
    stats: {
      health: Math.round(char.stats.health * waveData.mult),
      attack:  Math.round(char.stats.attack  * waveData.mult),
      defense: Math.round(char.stats.defense * waveData.mult),
      speed:   Math.round(char.stats.speed   * (wave >= 5 ? waveData.mult * 1.3 : waveData.mult)),
    },
  };
}

export default function ZombiesScreen({ onBack }: Props) {
  const { fighter, addCurrency, addXP } = useGameStore();
  const [phase, setPhase] = useState<'menu' | 'wave_intro' | 'fighting' | 'wave_clear' | 'dead'>('menu');
  const [currentWave, setCurrentWave] = useState(1);
  const [currentEnemy, setCurrentEnemy] = useState(0);
  const [html, setHtml] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [hp, setHp] = useState(100);  // player persistent HP across wave

  const waveData = WAVE_CONFIG[currentWave - 1];

  function startZombies() {
    setCurrentWave(1);
    setCurrentEnemy(0);
    setTotalEarned(0);
    setTotalXp(0);
    setHp(100);
    beginWave(1, 0, 100);
  }

  function beginWave(wave: number, enemyIndex: number, playerHp: number) {
    if (!fighter) return;
    const data = WAVE_CONFIG[wave - 1];
    if (!data) return;
    const zombie = makeZombieFighter(wave, enemyIndex);
    const playerChar = getCharacter(fighter.selectedCharacter);
    const zombieChar = getCharacter(zombie.selectedCharacter);
    const stageId = wave <= 2 ? 'back_alley' : wave <= 5 ? 'underground' : 'void_throne';
    // Carry player HP between fights
    const scaledPlayer = {
      ...fighter,
      stats: { ...fighter.stats, health: playerHp },
    };
    setHtml(buildArenaHtml(scaledPlayer as any, playerChar, zombie, zombieChar, stageId));
    setCurrentWave(wave);
    setCurrentEnemy(enemyIndex);
    setPhase('fighting');
  }

  function handleWebMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type !== 'BATTLE_RESULT') return;

      const waveInfo = WAVE_CONFIG[currentWave - 1];
      const perKillReward = Math.round(waveInfo.reward / waveInfo.count);
      const perKillXp     = perKillReward * 2;

      if (!data.won) {
        // Player died
        addCurrency(totalEarned);
        addXP(totalXp);
        setPhase('dead');
        return;
      }

      const newTotal = totalEarned + perKillReward;
      const newXp    = totalXp + perKillXp;
      setTotalEarned(newTotal);
      setTotalXp(newXp);

      // Slight HP recovery between fights
      const survivorHp = Math.min(100, hp + 15);
      setHp(survivorHp);

      const nextEnemy = currentEnemy + 1;
      if (nextEnemy < waveInfo.count) {
        // More enemies this wave
        setTimeout(() => beginWave(currentWave, nextEnemy, survivorHp), 1500);
      } else {
        // Wave cleared
        const waveBonus = waveInfo.reward;
        setTotalEarned(newTotal + waveBonus);
        setTotalXp(newXp + waveBonus * 2);
        setPhase('wave_clear');
      }
    } catch {}
  }

  function continueToNextWave() {
    const nextWave = currentWave + 1;
    if (nextWave > WAVE_CONFIG.length) {
      // Survived all waves
      addCurrency(totalEarned);
      addXP(totalXp);
      Alert.alert(
        '🏆 YOU SURVIVED ALL WAVES',
        `+${totalEarned} gold  •  +${totalXp} XP\n\nYou ran through every wave. Respect.`,
        [{ text: 'TAKE IT', onPress: () => { setPhase('menu'); } }]
      );
    } else {
      beginWave(nextWave, 0, Math.min(100, hp + 20));
    }
  }

  // ── FIGHTING ──────────────────────────────────────────────────────────────
  if (phase === 'fighting') {
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

  // ── WAVE CLEAR ─────────────────────────────────────────────────────────────
  if (phase === 'wave_clear') {
    const nextWave = WAVE_CONFIG[currentWave];
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.waveClearTitle}>WAVE {currentWave} CLEARED</Text>
        <Text style={styles.waveClearLabel}>{waveData.label}</Text>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLine}>+{totalEarned} gold</Text>
          <Text style={styles.earningsLineXp}>+{totalXp} XP</Text>
        </View>
        {nextWave ? (
          <>
            <View style={styles.nextWaveBox}>
              <Text style={styles.nextWaveLabel}>NEXT: WAVE {currentWave + 1}</Text>
              <Text style={styles.nextWaveName}>{nextWave.label}</Text>
              <Text style={styles.nextWaveDesc}>{nextWave.desc}</Text>
              <View style={styles.waveEnemyCount}>
                {Array.from({ length: nextWave.count }).map((_, i) => (
                  <Text key={i} style={styles.skull}>💀</Text>
                ))}
              </View>
            </View>
            <View style={styles.waveBtnRow}>
              <TouchableOpacity style={styles.continueBtn} onPress={continueToNextWave}>
                <Text style={styles.continueBtnText}>NEXT WAVE →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cashOutBtn} onPress={() => {
                addCurrency(totalEarned);
                addXP(totalXp);
                setPhase('menu');
              }}>
                <Text style={styles.cashOutText}>CASH OUT</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.continueBtn} onPress={continueToNextWave}>
            <Text style={styles.continueBtnText}>FINAL WAVE →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── DEAD ───────────────────────────────────────────────────────────────────
  if (phase === 'dead') {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.deadTitle}>YOU DIED</Text>
        <Text style={styles.deadWave}>Made it to Wave {currentWave}</Text>
        <Text style={styles.deadEnemy}>Enemy {currentEnemy + 1} of {waveData.count} took you out</Text>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLine}>+{totalEarned} gold collected</Text>
          <Text style={styles.earningsLineXp}>+{totalXp} XP</Text>
        </View>
        <View style={styles.waveBtnRow}>
          <TouchableOpacity style={styles.continueBtn} onPress={startZombies}>
            <Text style={styles.continueBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cashOutBtn} onPress={() => setPhase('menu')}>
            <Text style={styles.cashOutText}>BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── MENU ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>← BACK</Text></TouchableOpacity>
        <Text style={styles.title}>🧟 ZOMBIES</Text>
        <View style={{ width: 50 }} />
      </View>
      <Text style={styles.subtitle}>Survive waves solo or with your crew</Text>

      <View style={styles.modeInfo}>
        <Text style={styles.modeInfoTitle}>HOW IT WORKS</Text>
        <Text style={styles.modeInfoLine}>• Each wave sends multiple fighters at you one by one</Text>
        <Text style={styles.modeInfoLine}>• Your HP carries over between fights — use it wisely</Text>
        <Text style={styles.modeInfoLine}>• You earn gold every kill. Cash out between waves or risk it</Text>
        <Text style={styles.modeInfoLine}>• Wave 7 is a boss. Nobody makes it to wave 7.</Text>
      </View>

      <ScrollView style={styles.waveList} showsVerticalScrollIndicator={false}>
        {WAVE_CONFIG.map((w, i) => (
          <View key={i} style={styles.waveRow}>
            <View style={[styles.wavePip, { backgroundColor: i < 3 ? '#e74c3c' : i < 6 ? '#9b59b6' : '#ff2d78' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.waveName}>WAVE {i + 1}: {w.label}</Text>
              <Text style={styles.waveDesc}>{w.desc}</Text>
            </View>
            <View style={styles.waveEnemies}>
              {Array.from({ length: Math.min(w.count, 5) }).map((_, j) => (
                <Text key={j} style={{ fontSize: 12 }}>💀</Text>
              ))}
            </View>
            <Text style={styles.waveReward}>+{w.reward}g</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.startBtn} onPress={startZombies}>
        <Text style={styles.startBtnText}>START SOLO RUN</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.coopBtn} onPress={() => Alert.alert('COMING SOON', 'Co-op with friends is in development. Solo run is live now.')}>
        <Text style={styles.coopBtnText}>CO-OP WITH FRIENDS — SOON</Text>
      </TouchableOpacity>
    </View>
  );
}

const C = '#080810';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 8 },
  back: { color: '#555', fontSize: 14 },
  title: { color: '#e8c84a', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  subtitle: { color: '#333', fontSize: 10, letterSpacing: 2, textAlign: 'center', marginBottom: 16 },

  modeInfo: { marginHorizontal: 20, backgroundColor: '#0e0e18', borderRadius: 14, padding: 16, gap: 6, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a2e' },
  modeInfoTitle: { color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  modeInfoLine: { color: '#666', fontSize: 12, lineHeight: 18 },

  waveList: { flex: 1, paddingHorizontal: 20 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  wavePip: { width: 4, height: 36, borderRadius: 2 },
  waveName: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  waveDesc: { color: '#555', fontSize: 10, marginTop: 2 },
  waveEnemies: { flexDirection: 'row', gap: 2 },
  waveReward: { color: '#e8c84a', fontSize: 11, fontWeight: '800', minWidth: 44, textAlign: 'right' },

  startBtn: { margin: 20, backgroundColor: '#e74c3c', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 4 },
  coopBtn: { marginHorizontal: 20, marginBottom: 32, borderWidth: 1, borderColor: '#2a2a3a', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  coopBtnText: { color: '#333', fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  // Wave clear / dead
  fullCenter: { flex: 1, backgroundColor: C, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  waveClearTitle: { color: '#2ecc71', fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  waveClearLabel: { color: '#e8c84a', fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  earningsBox: { backgroundColor: '#0e0e18', borderRadius: 14, padding: 20, alignItems: 'center', width: '100%', gap: 6 },
  earningsLine: { color: '#e8c84a', fontSize: 24, fontWeight: '900' },
  earningsLineXp: { color: '#4a9eff', fontSize: 16, fontWeight: '800' },
  nextWaveBox: { backgroundColor: '#12121a', borderRadius: 14, padding: 16, width: '100%', gap: 6 },
  nextWaveLabel: { color: '#444', fontSize: 9, letterSpacing: 2 },
  nextWaveName: { color: '#e74c3c', fontSize: 18, fontWeight: '900' },
  nextWaveDesc: { color: '#666', fontSize: 12 },
  waveEnemyCount: { flexDirection: 'row', gap: 6, marginTop: 4 },
  skull: { fontSize: 18 },
  waveBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  continueBtn: { flex: 2, backgroundColor: '#e74c3c', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 3 },
  cashOutBtn: { flex: 1, backgroundColor: '#12121a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  cashOutText: { color: '#888', fontWeight: '800', fontSize: 12 },
  deadTitle: { color: '#e74c3c', fontSize: 48, fontWeight: '900', letterSpacing: 4 },
  deadWave: { color: '#e8c84a', fontSize: 18, fontWeight: '800' },
  deadEnemy: { color: '#555', fontSize: 13 },
});
