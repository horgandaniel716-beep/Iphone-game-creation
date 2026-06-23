import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { CHARACTERS } from '../lib/characters';
import type { CharacterDef } from '../types';

const ARCHETYPE_LABEL: Record<string, string> = {
  balanced:   'BALANCED',
  rushdown:   'RUSHDOWN',
  powerhouse: 'POWERHOUSE',
  trickster:  'TRICKSTER',
};

type BodySize = 'runt' | 'standard' | 'brute';

const BODY_SIZES: { id: BodySize; label: string; icon: string; desc: string; multipliers: { health: number; attack: number; defense: number; speed: number } }[] = [
  { id: 'runt',     label: 'RUNT',     icon: '🐀', desc: '+SPD +AGI  —  -HP -DEF',  multipliers: { health: 0.75, attack: 0.9,  defense: 0.8,  speed: 1.3  } },
  { id: 'standard', label: 'STANDARD', icon: '⚖️', desc: 'Balanced. Pure skill.',    multipliers: { health: 1.0,  attack: 1.0,  defense: 1.0,  speed: 1.0  } },
  { id: 'brute',    label: 'BRUTE',    icon: '🦍', desc: '+HP +ATK +DEF  —  -SPD',  multipliers: { health: 1.4,  attack: 1.25, defense: 1.3,  speed: 0.7  } },
];

export default function CharacterSelectScreen() {
  const { fighter, setFighter } = useGameStore();
  const [selected, setSelected] = useState<CharacterDef>(
    CHARACTERS.find((c) => c.id === fighter?.selectedCharacter) ?? CHARACTERS[0]
  );
  const [bodySize, setBodySize] = useState<BodySize>(fighter?.bodySize ?? 'standard');

  async function confirmSelect() {
    if (!fighter) return;

    const canAfford = fighter.currency >= selected.unlockCost;
    const alreadyOwned = fighter.selectedCharacter === selected.id || selected.unlockCost === 0;

    if (!alreadyOwned && !canAfford) {
      Alert.alert('Not enough gold', `You need ${selected.unlockCost} gold to unlock ${selected.name}.`);
      return;
    }

    const newCurrency = alreadyOwned ? fighter.currency : fighter.currency - selected.unlockCost;
    const updated = { ...fighter, selectedCharacter: selected.id, currency: newCurrency, bodySize };
    setFighter(updated);

    if (fighter.userId !== 'bot') {
      await updateDoc(doc(db, 'fighters', fighter.userId), {
        selectedCharacter: selected.id,
        currency: newCurrency,
        bodySize,
      });
    }

    Alert.alert('Fighter Ready', `${selected.name} (${bodySize.toUpperCase()}) locked in.`);
  }

  const sizeInfo = BODY_SIZES.find((s) => s.id === bodySize)!;
  const scaledStats = {
    health:  Math.round(selected.stats.health  * sizeInfo.multipliers.health),
    attack:  Math.round(selected.stats.attack  * sizeInfo.multipliers.attack),
    defense: Math.round(selected.stats.defense * sizeInfo.multipliers.defense),
    speed:   Math.round(selected.stats.speed   * sizeInfo.multipliers.speed),
  };

  const currentChar = CHARACTERS.find((c) => c.id === fighter?.selectedCharacter) ?? CHARACTERS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>SELECT FIGHTER</Text>
      <Text style={styles.subtitle}>Current: {currentChar.name} — {currentChar.subtitle}</Text>

      {/* Character grid */}
      <View style={styles.grid}>
        {CHARACTERS.map((char) => {
          const isSelected = selected.id === char.id;
          const isActive   = fighter?.selectedCharacter === char.id;
          const locked     = char.unlockCost > 0 && fighter?.selectedCharacter !== char.id;
          const canAfford  = (fighter?.currency ?? 0) >= char.unlockCost;

          return (
            <TouchableOpacity
              key={char.id}
              style={[
                styles.charCard,
                isSelected && { borderColor: char.primaryColor, borderWidth: 2 },
                isActive   && { backgroundColor: char.primaryColor + '22' },
              ]}
              onPress={() => setSelected(char)}
            >
              <Text style={styles.charIcon}>{char.icon}</Text>
              <Text style={[styles.charName, { color: char.primaryColor }]}>{char.name}</Text>
              <Text style={styles.charSub}>{char.subtitle}</Text>
              <View style={[styles.archetypePill, { backgroundColor: char.primaryColor + '33' }]}>
                <Text style={[styles.archetypeText, { color: char.accentColor }]}>
                  {ARCHETYPE_LABEL[char.archetype]}
                </Text>
              </View>
              {isActive && <Text style={styles.activeBadge}>ACTIVE</Text>}
              {locked && (
                <Text style={[styles.lockBadge, canAfford ? styles.canAfford : styles.cantAfford]}>
                  🔒 {char.unlockCost}g
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected detail */}
      <View style={[styles.detailCard, { borderColor: selected.primaryColor + '66' }]}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailIcon}>{selected.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailName, { color: selected.primaryColor }]}>
              {selected.name}
            </Text>
            <Text style={styles.detailSubtitle}>{selected.subtitle}</Text>
          </View>
        </View>

        {/* Body size selector */}
        <Text style={styles.sizeLabel}>BODY SIZE</Text>
        <View style={styles.sizeRow}>
          {BODY_SIZES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.sizeBtn, bodySize === s.id && { borderColor: selected.primaryColor, backgroundColor: selected.primaryColor + '22' }]}
              onPress={() => setBodySize(s.id)}
            >
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={[styles.sizeName, bodySize === s.id && { color: selected.primaryColor }]}>{s.label}</Text>
              <Text style={styles.sizeDesc}>{s.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsRow}>
          <StatBar label="HP"  value={scaledStats.health}  max={420} color="#e74c3c" />
          <StatBar label="ATK" value={scaledStats.attack}  max={130} color="#e8c84a" />
          <StatBar label="DEF" value={scaledStats.defense} max={130} color="#4a9eff" />
          <StatBar label="SPD" value={scaledStats.speed}   max={200} color="#2ecc71" />
        </View>

        <View style={[styles.specialBox, { backgroundColor: selected.primaryColor + '22' }]}>
          <Text style={[styles.specialName, { color: selected.accentColor }]}>
            ✦ {selected.specialName}
          </Text>
          <Text style={styles.specialDesc}>{selected.specialDesc}</Text>
        </View>

        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: selected.primaryColor }]}
          onPress={confirmSelect}
        >
          <Text style={styles.selectButtonText}>
            {fighter?.selectedCharacter === selected.id && fighter?.bodySize === bodySize
              ? 'SELECTED'
              : selected.unlockCost > 0 && fighter?.selectedCharacter !== selected.id
              ? `UNLOCK — ${selected.unlockCost}g`
              : 'LOCK IN'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  return (
    <View style={styles.statBarRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarBg}>
        <View style={[styles.statBarFill, { width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    color: '#e8c84a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: { color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  charCard: {
    width: '47%',
    backgroundColor: '#12121a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  charIcon: { fontSize: 36, marginBottom: 6 },
  charName: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  charSub: { color: '#555', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  archetypePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  archetypeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  activeBadge: {
    color: '#e8c84a',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 1,
  },
  lockBadge: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  canAfford: { color: '#2ecc71' },
  cantAfford: { color: '#e74c3c' },
  detailCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  detailIcon: { fontSize: 44 },
  detailName: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  detailSubtitle: { color: '#555', fontSize: 12, marginTop: 2 },
  statsRow: { gap: 10, marginBottom: 16 },
  statBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { color: '#555', fontSize: 11, width: 30, fontWeight: '700' },
  statBarBg: { flex: 1, height: 6, backgroundColor: '#2a2a3a', borderRadius: 3 },
  statBarFill: { height: 6, borderRadius: 3 },
  statValue: { fontSize: 12, fontWeight: '700', width: 32, textAlign: 'right' },
  specialBox: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  specialName: { fontSize: 15, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  specialDesc: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  selectButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectButtonText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 2 },
  sizeLabel: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  sizeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sizeBtn: { flex: 1, backgroundColor: '#0e0e18', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  sizeName: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  sizeDesc: { color: '#333', fontSize: 8, textAlign: 'center', marginTop: 2 },
});
