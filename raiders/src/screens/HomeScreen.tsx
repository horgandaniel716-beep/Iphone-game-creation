import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { getCharacter } from '../lib/characters';
import { getRankInfo, getRankDisplayString } from '../lib/ranking';

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
  const rank = fighter.rank;
  const rankInfo = rank ? getRankInfo(rank.tier) : null;
  const rankDisplay = rank ? getRankDisplayString(rank) : '🥉 Bronze 4';
  const totalGames = fighter.wins + fighter.losses;
  const winRate = totalGames > 0 ? Math.round((fighter.wins / totalGames) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{fighter.name}</Text>
          {fighter.tag ? <Text style={styles.tag}>#{fighter.tag}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Rank Banner */}
      {rankInfo && (
        <View style={[styles.rankBanner, { borderColor: rankInfo.color + '55', backgroundColor: rankInfo.color + '11' }]}>
          <Text style={styles.rankIcon}>{rankInfo.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rankLabel}>CURRENT RANK</Text>
            <Text style={[styles.rankDisplay, { color: rankInfo.color }]}>{rankDisplay}</Text>
          </View>
          <View style={styles.mmrBox}>
            <Text style={[styles.mmrValue, { color: rankInfo.color }]}>{rank?.mmr ?? 0}</Text>
            <Text style={styles.mmrLabel}>MMR</Text>
          </View>
        </View>
      )}

      {/* Fighter Card */}
      <View style={[styles.fighterCard, { borderColor: char.primaryColor + '55' }]}>
        <Text style={styles.charIcon}>{char.icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.charTopRow}>
            <Text style={[styles.charName, { color: char.primaryColor }]}>{char.name}</Text>
            <View style={[styles.rarityPill, { backgroundColor: char.primaryColor + '22' }]}>
              <Text style={[styles.rarityText, { color: char.accentColor }]}>{char.rarity?.toUpperCase()}</Text>
            </View>
          </View>
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
        <StatBox label="📊 W/R"   value={totalGames > 0 ? `${winRate}%` : '--'} />
      </View>

      {/* Weapon Slots */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WEAPON LOADOUT</Text>
        <View style={styles.weaponRow}>
          <WeaponSlot label="LEFT HAND" weaponId={fighter.weaponSlot1 ?? null} />
          <WeaponSlot label="RIGHT HAND" weaponId={fighter.weaponSlot2 ?? null} />
        </View>
      </View>

      {/* Special Move */}
      <View style={[styles.section, { borderColor: char.primaryColor + '33' }]}>
        <Text style={styles.sectionTitle}>SIGNATURE MOVE</Text>
        <Text style={[styles.specialName, { color: char.accentColor }]}>✦ {char.specialName}</Text>
        <Text style={styles.specialDesc}>{char.specialDesc}</Text>
        <View style={styles.divider} />
        <Text style={[styles.superName, { color: char.primaryColor }]}>★ {char.superName}</Text>
        <Text style={styles.specialDesc}>{char.superDesc}</Text>
      </View>

      {/* Moves */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          MOVES UNLOCKED ({fighter.unlockedMoves?.length ?? 2})
        </Text>
        <View style={styles.movesGrid}>
          {(fighter.unlockedMoves ?? ['jab', 'low_kick']).slice(0, 8).map((moveId) => (
            <View key={moveId} style={styles.movePill}>
              <Text style={styles.movePillText}>{moveId.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          ))}
          {(fighter.unlockedMoves?.length ?? 2) > 8 && (
            <View style={[styles.movePill, { backgroundColor: '#2a2a3a' }]}>
              <Text style={styles.movePillText}>+{(fighter.unlockedMoves?.length ?? 2) - 8} MORE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Base Guardians */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BASE GUARDIANS ({base?.demons.length ?? 0})</Text>
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
              <Text style={b.won ? styles.winLabel : styles.lossLabel}>{b.won ? 'WIN' : 'LOSS'}</Text>
              <Text style={styles.battleOpp}>vs {b.opponentName}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.battleReward}>+{b.currencyEarned}g</Text>
                {b.mmrChange !== undefined && (
                  <Text style={[styles.mmrChange, { color: b.mmrChange >= 0 ? '#2ecc71' : '#e74c3c' }]}>
                    {b.mmrChange >= 0 ? '+' : ''}{b.mmrChange} MMR
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function WeaponSlot({ label, weaponId }: { label: string; weaponId: string | null }) {
  return (
    <View style={styles.weaponSlot}>
      <Text style={styles.weaponSlotLabel}>{label}</Text>
      {weaponId ? (
        <Text style={styles.weaponSlotName}>{weaponId.replace(/_/g, ' ').toUpperCase()}</Text>
      ) : (
        <Text style={styles.weaponSlotEmpty}>EMPTY</Text>
      )}
    </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { color: '#555', fontSize: 12 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  tag: { color: '#444', fontSize: 11, marginTop: 2 },
  signOut: { color: '#e8c84a', fontSize: 13, marginTop: 4 },
  rankBanner: {
    borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  rankIcon: { fontSize: 32 },
  rankLabel: { color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  rankDisplay: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  mmrBox: { alignItems: 'center' },
  mmrValue: { fontSize: 22, fontWeight: '900' },
  mmrLabel: { color: '#444', fontSize: 9, letterSpacing: 1 },
  fighterCard: {
    backgroundColor: '#12121a', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, marginBottom: 14,
  },
  charIcon: { fontSize: 44 },
  charTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  charName: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  rarityPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  rarityText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  charSubtitle: { color: '#555', fontSize: 11, marginBottom: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelText: { color: '#e8c84a', fontWeight: '700', fontSize: 13, width: 46 },
  xpBarBg: { flex: 1, height: 5, backgroundColor: '#2a2a3a', borderRadius: 3 },
  xpBarFill: { height: 5, borderRadius: 3 },
  xpText: { color: '#444', fontSize: 10, width: 50 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a',
  },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#444', fontSize: 9, marginTop: 2 },
  section: {
    backgroundColor: '#12121a', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#2a2a3a',
  },
  sectionTitle: { color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  weaponRow: { flexDirection: 'row', gap: 12 },
  weaponSlot: {
    flex: 1, backgroundColor: '#1e1e2e', borderRadius: 10, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  weaponSlotLabel: { color: '#444', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  weaponSlotName: { color: '#e8c84a', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  weaponSlotEmpty: { color: '#333', fontSize: 11 },
  specialName: { fontSize: 15, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  superName: { fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  specialDesc: { color: '#666', fontSize: 13, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#2a2a3a', marginVertical: 10 },
  movesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  movePill: {
    backgroundColor: '#1e1e2e', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  movePillText: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  demonRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  demonDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  demonName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  demonOrigin: { color: '#444', fontSize: 11 },
  rarityBadge: { fontSize: 10, fontWeight: '700' },
  emptyText: { color: '#333', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  battleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  winLabel: { color: '#2ecc71', fontWeight: '800', fontSize: 11, width: 40 },
  lossLabel: { color: '#e74c3c', fontWeight: '800', fontSize: 11, width: 40 },
  battleOpp: { color: '#888', flex: 1, fontSize: 13 },
  battleReward: { color: '#e8c84a', fontSize: 13, fontWeight: '600' },
  mmrChange: { fontSize: 10, fontWeight: '700' },
});
