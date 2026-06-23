import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { MOVES, MOVE_TIER_COLORS, getMovesByTier } from '../lib/moves';
import { MOVE_TYPE_MAP, MOVE_TYPES } from '../lib/moveTypes';
import type { Move } from '../types';

const TIERS: Move['tier'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'overpowered'];
const TIER_LABELS: Record<Move['tier'], string> = {
  common:      'COMMON',
  uncommon:    'UNCOMMON',
  rare:        'RARE',
  epic:        'EPIC',
  legendary:   'LEGENDARY',
  overpowered: '⚠️ OVERPOWERED',
};

export default function MovesScreen() {
  const { fighter, unlockMove } = useGameStore();
  const [selectedTier, setSelectedTier] = useState<Move['tier']>('common');
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  const moves = getMovesByTier(selectedTier);
  const unlocked = fighter?.unlockedMoves ?? [];
  const isOverpowered = selectedTier === 'overpowered';
  const meetsOPRequirement = (fighter?.level ?? 0) >= 50;

  async function handleUnlock(move: Move) {
    if (!fighter) return;
    if (unlocked.includes(move.id)) {
      Alert.alert('Already Unlocked', `${move.name} is already in your arsenal.`);
      return;
    }
    if (fighter.level < move.unlockLevel) {
      Alert.alert('Level Required', `You need to be level ${move.unlockLevel} to unlock ${move.name}.`);
      return;
    }
    if (isOverpowered && !meetsOPRequirement) {
      Alert.alert('Level 50 Required', 'Overpowered moves can only be used in God Tier arenas and require Level 50.');
      return;
    }
    if (fighter.currency < move.unlockCost) {
      Alert.alert('Not Enough Gold', `You need ${move.unlockCost.toLocaleString()}g to unlock ${move.name}.`);
      return;
    }

    Alert.alert(
      `Unlock ${move.name}?`,
      `${move.description}\n\nDamage: ${move.damage}\nCost: ${move.unlockCost.toLocaleString()}g`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'UNLOCK',
          onPress: async () => {
            unlockMove(move.id, move.unlockCost);
            if (fighter.userId !== 'bot') {
              await updateDoc(doc(db, 'fighters', fighter.userId), {
                unlockedMoves: [...unlocked, move.id],
                currency: fighter.currency - move.unlockCost,
              });
            }
            Alert.alert('Move Unlocked!', `${move.name} is now part of your arsenal.`);
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ MOVES</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {(fighter?.currency ?? 0).toLocaleString()}g</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        {unlocked.length} moves unlocked  •  LVL {fighter?.level ?? 1}
      </Text>

      {/* Tier tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierScroll}>
        {TIERS.map((tier) => {
          const color = MOVE_TIER_COLORS[tier];
          const isActive = selectedTier === tier;
          return (
            <TouchableOpacity
              key={tier}
              style={[styles.tierTab, isActive && { borderColor: color, backgroundColor: color + '22' }]}
              onPress={() => setSelectedTier(tier)}
            >
              <Text style={[styles.tierTabText, { color: isActive ? color : '#555' }]}>
                {TIER_LABELS[tier]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isOverpowered && (
        <View style={styles.opWarning}>
          <Text style={styles.opWarningText}>
            ⚠️ OVERPOWERED moves are only usable in Level 50+ God Tier arenas.{'\n'}
            Your level: {fighter?.level ?? 1} {meetsOPRequirement ? '✅' : '❌'}
          </Text>
        </View>
      )}

      {/* Moves list */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {moves.map((move) => {
          const isUnlocked = unlocked.includes(move.id);
          const canAfford = (fighter?.currency ?? 0) >= move.unlockCost;
          const meetsLevel = (fighter?.level ?? 0) >= move.unlockLevel;
          const color = MOVE_TIER_COLORS[move.tier];

          const moveType = MOVE_TYPE_MAP[move.id];
          const typeInfo = moveType ? MOVE_TYPES[moveType] : null;

          return (
            <TouchableOpacity
              key={move.id}
              style={[styles.moveCard, isUnlocked && { borderColor: color + '66', backgroundColor: color + '11' }]}
              onPress={() => setSelectedMove(selectedMove?.id === move.id ? null : move)}
            >
              <View style={styles.moveHeader}>
                <Text style={styles.moveIcon}>{move.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.moveName, { color: isUnlocked ? color : '#fff' }]}>{move.name}</Text>
                    {typeInfo && (
                      <View style={[styles.typePill, { backgroundColor: typeInfo.color + '22', borderColor: typeInfo.color + '55' }]}>
                        <Text style={{ fontSize: 9 }}>{typeInfo.icon}</Text>
                        <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.moveDesc}>{move.description}</Text>
                </View>
                <View style={styles.moveRight}>
                  {isUnlocked ? (
                    <Text style={[styles.unlockedBadge, { color }]}>✓ OWNED</Text>
                  ) : (
                    <>
                      <Text style={[styles.moveCost, !canAfford && { color: '#e74c3c' }]}>
                        {move.unlockCost === 0 ? 'FREE' : `${move.unlockCost.toLocaleString()}g`}
                      </Text>
                      {!meetsLevel && (
                        <Text style={styles.levelReq}>LVL {move.unlockLevel}</Text>
                      )}
                    </>
                  )}
                </View>
              </View>

              {selectedMove?.id === move.id && (
                <View style={[styles.moveDetail, { borderTopColor: color + '33' }]}>
                  <View style={styles.moveStats}>
                    <StatChip label="DMG" value={String(move.damage)} color="#e74c3c" />
                    <StatChip label="START" value={String(move.frames.startup)} color="#e8c84a" />
                    <StatChip label="ACTIVE" value={String(move.frames.active)} color="#2ecc71" />
                    <StatChip label="RECOV" value={String(move.frames.recovery)} color="#4a9eff" />
                  </View>
                  <View style={styles.effects}>
                    {move.effects.map((e) => (
                      <View key={e} style={[styles.effectPill, { borderColor: color + '44' }]}>
                        <Text style={[styles.effectText, { color }]}>{e.replace(/_/g, ' ').toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                  {!isUnlocked && (
                    <TouchableOpacity
                      style={[styles.unlockButton, { backgroundColor: canAfford && meetsLevel ? color : '#333' }]}
                      onPress={() => handleUnlock(move)}
                    >
                      <Text style={styles.unlockButtonText}>
                        {!meetsLevel ? `REQUIRES LVL ${move.unlockLevel}` : !canAfford ? 'NOT ENOUGH GOLD' : `UNLOCK — ${move.unlockCost.toLocaleString()}g`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statChipValue, { color }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 4 },
  title: { color: '#e8c84a', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  goldBadge: { backgroundColor: '#e8c84a22', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#e8c84a44' },
  goldText: { color: '#e8c84a', fontWeight: '700', fontSize: 14 },
  subtitle: { color: '#555', fontSize: 12, paddingHorizontal: 20, marginBottom: 12 },
  tierScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44, flexGrow: 0 },
  tierTab: { borderRadius: 20, borderWidth: 1, borderColor: '#2a2a3a', paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  tierTabText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  opWarning: { margin: 16, backgroundColor: '#ff2d7822', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ff2d7844' },
  opWarningText: { color: '#ff2d78', fontSize: 12, lineHeight: 18 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 0, gap: 10 },
  moveCard: { backgroundColor: '#12121a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a3a' },
  moveHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moveIcon: { fontSize: 28 },
  moveName: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  moveDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  moveRight: { alignItems: 'flex-end' },
  moveCost: { color: '#e8c84a', fontWeight: '700', fontSize: 13 },
  levelReq: { color: '#e74c3c', fontSize: 10, marginTop: 2 },
  unlockedBadge: { fontSize: 11, fontWeight: '800' },
  moveDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  moveStats: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statChip: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 8, padding: 8, alignItems: 'center' },
  statChipValue: { fontSize: 16, fontWeight: '800' },
  statChipLabel: { color: '#444', fontSize: 9, letterSpacing: 1 },
  effects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  effectPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  effectText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  unlockButton: { borderRadius: 10, padding: 14, alignItems: 'center' },
  unlockButtonText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});
