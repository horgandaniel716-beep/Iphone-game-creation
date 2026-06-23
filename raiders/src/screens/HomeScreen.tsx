import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const RARITY_COLOR = {
  common: '#aaa',
  rare: '#4a9eff',
  epic: '#b44aff',
  legendary: '#ff9000',
};

export default function HomeScreen() {
  const { raider, base, battleHistory } = useGameStore();

  if (!raider) return null;

  const xpPercent = Math.min(
    (raider.xp / (500 * raider.level)) * 100,
    100
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{raider.name}</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Raider Card */}
      <View style={styles.raiderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>🧍</Text>
        </View>
        <View style={styles.raiderInfo}>
          <Text style={styles.levelBadge}>LVL {raider.level}</Text>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {raider.xp} / {500 * raider.level} XP
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatBox label="💰 Gold" value={raider.currency.toLocaleString()} />
        <StatBox label="⚔️ Wins" value={String(raider.wins)} />
        <StatBox label="🛡 Losses" value={String(raider.losses)} />
        <StatBox label="🏴 Raids" value={String(raider.raids)} />
      </View>

      {/* Combat Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COMBAT STATS</Text>
        <View style={styles.combatGrid}>
          <CombatStat label="❤️ HP" value={raider.stats.health} max={300} color="#e74c3c" />
          <CombatStat label="⚔️ ATK" value={raider.stats.attack} max={100} color="#e8c84a" />
          <CombatStat label="🛡 DEF" value={raider.stats.defense} max={100} color="#4a9eff" />
          <CombatStat label="💨 SPD" value={raider.stats.speed} max={200} color="#2ecc71" />
        </View>
      </View>

      {/* Demon Guard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          BASE GUARDIANS ({base?.demons.length ?? 0})
        </Text>
        {base?.demons.length === 0 ? (
          <Text style={styles.emptyText}>
            No demons assigned. Go to your Base to summon guardians.
          </Text>
        ) : (
          base?.demons.map((demon) => (
            <View key={demon.id} style={styles.demonRow}>
              <View
                style={[
                  styles.demonDot,
                  { backgroundColor: RARITY_COLOR[demon.rarity] },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.demonName}>{demon.name}</Text>
                <Text style={styles.demonOrigin}>From {demon.origin}</Text>
              </View>
              <Text
                style={[styles.rarityBadge, { color: RARITY_COLOR[demon.rarity] }]}
              >
                {demon.rarity.toUpperCase()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Battles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT BATTLES</Text>
        {battleHistory.length === 0 ? (
          <Text style={styles.emptyText}>No battles yet. Hit the Arena!</Text>
        ) : (
          battleHistory.slice(0, 5).map((b, i) => (
            <View key={i} style={styles.battleRow}>
              <Text style={b.won ? styles.winLabel : styles.lossLabel}>
                {b.won ? 'WIN' : 'LOSS'}
              </Text>
              <Text style={styles.battleOpponent}>vs {b.opponentName}</Text>
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

function CombatStat({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <View style={styles.combatStat}>
      <View style={styles.combatStatHeader}>
        <Text style={styles.combatLabel}>{label}</Text>
        <Text style={[styles.combatValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.combatBarBg}>
        <View
          style={[
            styles.combatBarFill,
            { width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
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
  greeting: { color: '#666', fontSize: 13 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  signOut: { color: '#e8c84a', fontSize: 13, marginTop: 4 },
  raiderCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarEmoji: { fontSize: 32 },
  raiderInfo: { flex: 1 },
  levelBadge: {
    color: '#e8c84a',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 8,
  },
  xpBarBg: {
    height: 6,
    backgroundColor: '#2a2a3a',
    borderRadius: 3,
    marginBottom: 4,
  },
  xpBarFill: {
    height: 6,
    backgroundColor: '#e8c84a',
    borderRadius: 3,
  },
  xpText: { color: '#666', fontSize: 11 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#12121a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#555', fontSize: 10, marginTop: 2 },
  section: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  sectionTitle: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  combatGrid: { gap: 10 },
  combatStat: {},
  combatStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  combatLabel: { color: '#aaa', fontSize: 13 },
  combatValue: { fontWeight: '700', fontSize: 13 },
  combatBarBg: {
    height: 4,
    backgroundColor: '#2a2a3a',
    borderRadius: 2,
  },
  combatBarFill: { height: 4, borderRadius: 2 },
  demonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  demonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  demonName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  demonOrigin: { color: '#555', fontSize: 11 },
  rarityBadge: { fontSize: 10, fontWeight: '700' },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  battleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  winLabel: {
    color: '#2ecc71',
    fontWeight: '800',
    fontSize: 12,
    width: 40,
  },
  lossLabel: {
    color: '#e74c3c',
    fontWeight: '800',
    fontSize: 12,
    width: 40,
  },
  battleOpponent: { color: '#aaa', flex: 1, fontSize: 13 },
  battleReward: { color: '#e8c84a', fontSize: 13, fontWeight: '600' },
});
