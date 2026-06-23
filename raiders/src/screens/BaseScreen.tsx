import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { generateDemon } from '../lib/ai';
import type { Demon } from '../types';

const RARITY_COLOR = {
  common: '#aaa',
  rare: '#4a9eff',
  epic: '#b44aff',
  legendary: '#ff9000',
};

const MAX_DEMONS = 5;

export default function BaseScreen() {
  const { fighter: raider, base, addDemon, removeDemon, addCurrency } = useGameStore();
  const [summonPrompt, setSummonPrompt] = useState('');
  const [summoning, setSummoning] = useState(false);
  const [selectedDemon, setSelectedDemon] = useState<Demon | null>(null);

  const SUMMON_COST = 200;

  async function handleSummon() {
    if (!raider || !base) return;
    if (!summonPrompt.trim()) {
      Alert.alert('Describe your demon', 'Tell us what kind of guardian you want to summon.');
      return;
    }
    if (raider.currency < SUMMON_COST) {
      Alert.alert('Not enough gold', `You need ${SUMMON_COST} gold to summon a demon.`);
      return;
    }
    if (base.demons.length >= MAX_DEMONS) {
      Alert.alert('Base full', `You can only have ${MAX_DEMONS} demons guarding your base.`);
      return;
    }

    setSummoning(true);
    try {
      const demon = await generateDemon(summonPrompt);
      addDemon(demon);
      addCurrency(-SUMMON_COST);

      // Persist to Firestore
      if (raider?.userId !== 'bot') {
        await updateDoc(doc(db, 'bases', raider?.userId), {
          demons: [...base.demons, demon],
        });
        await updateDoc(doc(db, 'fighters', raider?.userId), {
          currency: raider.currency - SUMMON_COST,
        });
      }

      setSummonPrompt('');
      Alert.alert(
        `${demon.rarity.toUpperCase()} SUMMONED!`,
        `${demon.name} has emerged from ${demon.origin}.\n\n"${demon.lore}"`
      );
    } catch (err: any) {
      Alert.alert('Summoning failed', err.message || 'The ritual failed. Try again.');
    } finally {
      setSummoning(false);
    }
  }

  async function handleDismiss(demonId: string) {
    Alert.alert('Dismiss Demon', 'Send this demon back to its dimension?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        style: 'destructive',
        onPress: async () => {
          removeDemon(demonId);
          if (raider && raider?.userId !== 'bot') {
            const remaining = base?.demons.filter((d) => d.id !== demonId) ?? [];
            await updateDoc(doc(db, 'bases', raider?.userId), { demons: remaining });
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.baseName}>{base?.name ?? 'Your Fortress'}</Text>
      <Text style={styles.subtitle}>
        {base?.demons.length ?? 0}/{MAX_DEMONS} Guardians Active
      </Text>

      {/* Summon Section */}
      <View style={styles.summonCard}>
        <Text style={styles.sectionTitle}>SUMMON A DEMON</Text>
        <Text style={styles.summonHint}>
          Describe the demon from another universe you want to guard your base. Be specific — the
          AI will bring it to life.
        </Text>
        <TextInput
          style={styles.summonInput}
          placeholder='e.g. "A shadow serpent from the void realm with ice breath and psychic screams"'
          placeholderTextColor="#444"
          multiline
          numberOfLines={3}
          value={summonPrompt}
          onChangeText={setSummonPrompt}
        />
        <View style={styles.summonFooter}>
          <Text style={styles.costLabel}>💰 {SUMMON_COST} gold</Text>
          <TouchableOpacity
            style={[styles.summonButton, summoning && { opacity: 0.6 }]}
            onPress={handleSummon}
            disabled={summoning}
          >
            {summoning ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.summonButtonText}>SUMMON</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Demons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVE GUARDIANS</Text>
        {base?.demons.length === 0 ? (
          <Text style={styles.emptyText}>
            No guardians yet. Summon demons above to protect your base from raiders.
          </Text>
        ) : (
          base?.demons.map((demon) => (
            <TouchableOpacity
              key={demon.id}
              style={styles.demonCard}
              onPress={() => setSelectedDemon(demon)}
            >
              <View style={styles.demonHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demonName}>{demon.name}</Text>
                  <Text style={styles.demonOrigin}>From {demon.origin}</Text>
                </View>
                <Text style={[styles.rarity, { color: RARITY_COLOR[demon.rarity] }]}>
                  {demon.rarity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.demonLore} numberOfLines={2}>
                {demon.lore}
              </Text>
              <View style={styles.demonStats}>
                <StatPill label="HP" value={demon.stats.health} color="#e74c3c" />
                <StatPill label="ATK" value={demon.stats.attack} color="#e8c84a" />
                <StatPill label="DEF" value={demon.stats.defense} color="#4a9eff" />
                <StatPill label="SPD" value={demon.stats.speed} color="#2ecc71" />
              </View>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(demon.id)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Demon Detail Modal */}
      <Modal visible={!!selectedDemon} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedDemon && (
              <>
                <Text
                  style={[styles.modalTitle, { color: RARITY_COLOR[selectedDemon.rarity] }]}
                >
                  {selectedDemon.name}
                </Text>
                <Text style={styles.modalOrigin}>
                  Dimension: {selectedDemon.origin}
                </Text>
                <Text style={styles.modalLore}>{selectedDemon.lore}</Text>
                <Text style={styles.modalSection}>ABILITIES</Text>
                {selectedDemon.abilities.map((ab, i) => (
                  <View key={i} style={styles.abilityRow}>
                    <Text style={styles.abilityName}>{ab.name}</Text>
                    <Text style={styles.abilityDesc}>{ab.description}</Text>
                    <Text style={styles.abilityMeta}>
                      DMG {ab.damage}  •  Cooldown {ab.cooldown}s  •  {ab.type}
                    </Text>
                  </View>
                ))}
                <Text style={styles.modalSection}>VISUAL TRAITS</Text>
                <Text style={styles.traitText}>
                  {selectedDemon.visualTraits.features.join(', ')} •{' '}
                  {selectedDemon.visualTraits.size} •{' '}
                  {selectedDemon.visualTraits.primaryColor}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedDemon(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + '44' }]}>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingBottom: 40 },
  baseName: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#555', fontSize: 13, marginBottom: 20 },
  summonCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b44aff44',
  },
  sectionTitle: { color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  summonHint: { color: '#666', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  summonInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 12,
  },
  summonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costLabel: { color: '#e8c84a', fontSize: 15, fontWeight: '700' },
  summonButton: {
    backgroundColor: '#b44aff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  summonButtonText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  section: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingVertical: 16, lineHeight: 20 },
  demonCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  demonHeader: { flexDirection: 'row', marginBottom: 6 },
  demonName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  demonOrigin: { color: '#555', fontSize: 11, marginTop: 2 },
  rarity: { fontSize: 11, fontWeight: '700', alignSelf: 'flex-start' },
  demonLore: { color: '#777', fontSize: 12, lineHeight: 16, marginBottom: 10 },
  demonStats: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pillLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  pillValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dismissButton: { alignSelf: 'flex-end' },
  dismissText: { color: '#e74c3c', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#12121a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  modalOrigin: { color: '#555', fontSize: 13, marginBottom: 12 },
  modalLore: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modalSection: { color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  abilityRow: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  abilityName: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  abilityDesc: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  abilityMeta: { color: '#555', fontSize: 11 },
  traitText: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  closeButton: {
    backgroundColor: '#e8c84a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
