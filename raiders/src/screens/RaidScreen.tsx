import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import type { Base, Raider } from '../types';
import { useNavigation } from '@react-navigation/native';

interface RaidTarget {
  raider: Raider;
  base: Base;
}

const RARITY_COLOR = {
  common: '#aaa',
  rare: '#4a9eff',
  epic: '#b44aff',
  legendary: '#ff9000',
};

export default function RaidScreen() {
  const { raider } = useGameStore();
  const [targets, setTargets] = useState<RaidTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  async function loadTargets() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'raiders'), where('userId', '!=', raider?.userId ?? ''), limit(20))
      );
      const raiders = snap.docs.map((d) => d.data() as Raider);
      const results: RaidTarget[] = [];

      for (const r of raiders.slice(0, 6)) {
        const baseSnap = await getDocs(
          query(collection(db, 'bases'), where('userId', '==', r.userId), limit(1))
        );
        if (!baseSnap.empty) {
          results.push({ raider: r, base: baseSnap.docs[0].data() as Base });
        }
      }

      // Fill with bots if needed
      while (results.length < 4) {
        results.push(generateBotTarget());
      }

      setTargets(results);
    } catch {
      // Fallback to bots
      setTargets(Array.from({ length: 4 }, generateBotTarget));
    } finally {
      setLoading(false);
    }
  }

  function generateBotTarget(): RaidTarget {
    const lvl = Math.max(1, (raider?.level ?? 1) + Math.floor(Math.random() * 4 - 1));
    const names = ['Deimos', 'Raven', 'Vex', 'Kali', 'Mortis', 'Shade'];
    const name = names[Math.floor(Math.random() * names.length)];
    const botRaider: Raider = {
      id: 'bot_' + Math.random().toString(36).slice(2),
      userId: 'bot_' + Math.random().toString(36).slice(2),
      name,
      level: lvl,
      xp: 0,
      currency: 0,
      wins: Math.floor(Math.random() * 30),
      losses: Math.floor(Math.random() * 15),
      raids: Math.floor(Math.random() * 20),
      equipment: { head: null, body: null, weapon: null, boots: null },
      stats: {
        health: 80 + lvl * 15,
        attack: 15 + lvl * 4,
        defense: 8 + lvl * 2,
        speed: 70 + lvl * 3,
      },
      avatarStyle: { skinTone: '#8B4513', hairColor: '#000', outfit: 'default' },
    };

    const demonCount = Math.floor(Math.random() * 3);
    const botBase: Base = {
      id: 'bot_base_' + Date.now(),
      userId: botRaider.userId,
      name: `${name}'s Lair`,
      layout: { walls: [], floors: [], traps: [] },
      demons: [],
      trophies: Math.floor(Math.random() * 500),
      lastRaidedAt: null,
    };

    return { raider: botRaider, base: botBase };
  }

  useEffect(() => { loadTargets(); }, []);

  function raidTarget(target: RaidTarget) {
    Alert.alert(
      `Raid ${target.raider.name}?`,
      `Level ${target.raider.level} • ${target.base.demons.length} demons defending\n\nWin to steal gold and trophies.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RAID',
          onPress: () => {
            navigation.navigate('Arena', { opponent: target });
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e8c84a" />
        <Text style={styles.loadingText}>Scouting targets...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTargets} tintColor="#e8c84a" />}
    >
      <Text style={styles.title}>🏴 RAID MAP</Text>
      <Text style={styles.subtitle}>Choose a base to raid. Stronger enemies yield more gold.</Text>

      {targets.map((target, i) => {
        const diffLabel =
          target.raider.level > (raider?.level ?? 1) + 1
            ? '🔴 HARD'
            : target.raider.level >= (raider?.level ?? 1)
            ? '🟡 MEDIUM'
            : '🟢 EASY';

        return (
          <View key={i} style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetName}>{target.raider.name}</Text>
                <Text style={styles.targetMeta}>
                  Level {target.raider.level}  •  {target.raider.wins}W/{target.raider.losses}L
                </Text>
              </View>
              <Text style={styles.diffLabel}>{diffLabel}</Text>
            </View>

            <Text style={styles.baseName}>{target.base.name}</Text>

            {target.base.demons.length > 0 ? (
              <View style={styles.demonList}>
                {target.base.demons.map((d) => (
                  <Text
                    key={d.id}
                    style={[styles.demonChip, { borderColor: RARITY_COLOR[d.rarity] + '88' }]}
                  >
                    <Text style={{ color: RARITY_COLOR[d.rarity] }}>●</Text> {d.name}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.noDemons}>No demon guardians</Text>
            )}

            <View style={styles.rewardRow}>
              <Text style={styles.rewardText}>
                Est. reward: 💰 {40 + target.raider.level * 15}–{80 + target.raider.level * 20}g
              </Text>
              <TouchableOpacity style={styles.raidButton} onPress={() => raidTarget(target)}>
                <Text style={styles.raidButtonText}>RAID</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingBottom: 40 },
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { color: '#aaa', fontSize: 14 },
  title: { color: '#e8c84a', fontSize: 28, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  subtitle: { color: '#555', fontSize: 13, marginBottom: 20 },
  targetCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  targetHeader: { flexDirection: 'row', marginBottom: 6 },
  targetName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  targetMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  diffLabel: { fontSize: 12, fontWeight: '700', alignSelf: 'flex-start' },
  baseName: { color: '#888', fontSize: 13, marginBottom: 10, fontStyle: 'italic' },
  demonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  demonChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#aaa',
    fontSize: 11,
  },
  noDemons: { color: '#333', fontSize: 12, marginBottom: 12 },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: { color: '#e8c84a', fontSize: 13 },
  raidButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  raidButtonText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
});
