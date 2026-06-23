import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { getCharacter } from '../lib/characters';

const RARITY_COLOR = {
  common: '#aaa',
  rare: '#4a9eff',
  epic: '#b44aff',
  legendary: '#ff9000',
};

export default function HomeScreen() {
  const { fighter, base, battleHistory } = useGameStore();
  if (!fighter) return null;

  const char = getCharacter(fighter.selectedCharacter);
  const xpPercent = Math.min((fighter.xp / (500 * fighter.level)) * 100, 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{fighter.name}</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Fighter Card */}
      <View style={[styles.fighterCard, { borderColor: char.primaryColor + '55' }]}>
        <Text style={styles.charIcon}>{char.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.charName, { color: char.primaryColor }]}>{char.name}</Text>
          <Text style={styles.charSubtitle}>{char.subtitle}</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>LVL {fighter.level}</Text>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpPercent}%`, backgroundColor: char.primaryColor }]} />
            </View>
            <Text style={styles.xpText}>{fighter.xp}/{500 * fighter.level}</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatBox label="💰 Gold"  value={fighter.currency.toLocaleString()} />
        <StatBox label="⚔️ Wins"  value={String(fighter.wins)} />
        <StatBox label="💀 Losses" value={String(fighter.losses)} />
        <StatBox label="📊 W/R"   value={fighter.wins + fighter.losses > 0
          ? Math.round((fighter.wins / (fighter.wins + fighter.losses)) * 100) + '%'
          : '--'} />
      </View>

      {/* Special Move */}
      <View style={[styles.section, { borderColor: char.primaryColor + '33' }]}>
        <Text style={styles.sectionTitle}>SIGNATURE MOVE</Text>
        <Text style={[styles.specialName, { color: char.accentColor }]}>
          ✦ {char.specialName}
        </Text>
        <Text style={styles.specialDesc}>{char.specialDesc}</Text>
      </View>

      {/* Base Guardians */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          BASE GUARDIANS ({base?.demons.length ?? 0})
        </Text>
        {!base?.demons.length ? (
          <Text style={styles.emptyText}>No guardians. Summon AI demons in your Base tab.</Text>
        ) : (
          base.demons.map((demon) => (
            <View key={demon.id} style={styles.demonRow}>
              <View style={[styles.demonDot, { backgroundColor: RARITY_COLOR[demon.rarity] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.demonName}>{demon.name}</Text>
                <Text style={styles.demonOrigin}>From {demon.origin}</Text>
              </View>
              <Text style={[styles.rarityBadge, { color: RARITY_COLOR[demon.rarity] }]}>
                {demon.rarity.toUpperCase()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Battles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT BATTLES</Text>
        {!battleHistory.length ? (
          <Text style={styles.emptyText}>No battles yet. Enter the Arena!</Text>
        ) : (
          battleHistory.slice(0, 5).map((b, i) => (
            <View key={i} style={styles.battleRow}>
              <Text style={b.won ? styles.winLabel : styles.lossLabel}>
                {b.won ? 'WIN' : 'LOSS'}
              </Text>
              <Text style={styles.battleOpp}>vs {b.opponentName}</Text>
              <Text style={styles.battleReward}>+{b.currencyEarned}g</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { color: '#555', fontSize: 12 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  signOut: { color: '#e8c84a', fontSize: 13, marginTop: 4 },
  fighterCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  charIcon: { fontSize: 44 },
  charName: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  charSubtitle: { color: '#555', fontSize: 11, marginBottom: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelText: { color: '#e8c84a', fontWeight: '700', fontSize: 13, width: 46 },
  xpBarBg: { flex: 1, height: 5, backgroundColor: '#2a2a3a', borderRadius: 3 },
  xpBarFill: { height: 5, borderRadius: 3 },
  xpText: { color: '#444', fontSize: 10, width: 50 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: '#12121a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#444', fontSize: 9, marginTop: 2 },
  section: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  sectionTitle: { color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  specialName: { fontSize: 15, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  specialDesc: { color: '#666', fontSize: 13, lineHeight: 18 },
  demonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  demonDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  demonName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  demonOrigin: { color: '#444', fontSize: 11 },
  rarityBadge: { fontSize: 10, fontWeight: '700' },
  emptyText: { color: '#333', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  battleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  winLabel: { color: '#2ecc71', fontWeight: '800', fontSize: 11, width: 40 },
  lossLabel: { color: '#e74c3c', fontWeight: '800', fontSize: 11, width: 40 },
  battleOpp: { color: '#888', flex: 1, fontSize: 13 },
  battleReward: { color: '#e8c84a', fontSize: 13, fontWeight: '600' },
});
