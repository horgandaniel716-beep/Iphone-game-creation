import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { WEAPONS, WEAPON_RARITY_COLORS } from '../lib/weapons';
import type { Weapon } from '../types';

const RARITY_TABS: Weapon['rarity'][] = ['common', 'rare', 'epic', 'legendary'];

export default function WeaponsScreen() {
  const { fighter, equipWeapon, addCurrency } = useGameStore();
  const [selectedRarity, setSelectedRarity] = useState<Weapon['rarity']>('common');
  const [expanded, setExpanded] = useState<string | null>(null);

  const weapons = WEAPONS.filter((w) => w.rarity === selectedRarity);

  function isEquipped(weaponId: string): 1 | 2 | null {
    if (fighter?.weaponSlot1 === weaponId) return 1;
    if (fighter?.weaponSlot2 === weaponId) return 2;
    return null;
  }

  async function handleEquip(weapon: Weapon, slot: 1 | 2) {
    if (!fighter) return;
    if (fighter.currency < weapon.cost) {
      Alert.alert('Not Enough Gold', `You need ${weapon.cost.toLocaleString()}g to equip ${weapon.name}.`);
      return;
    }

    const alreadyEquipped = isEquipped(weapon.id);
    if (alreadyEquipped) {
      equipWeapon(alreadyEquipped, null);
      return;
    }

    Alert.alert(
      `Equip ${weapon.name}?`,
      `Slot ${slot}\n${weapon.description}\n\nSpecial: ${weapon.specialEffect}\nCost: ${weapon.cost.toLocaleString()}g`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `SLOT ${slot}`,
          onPress: async () => {
            addCurrency(-weapon.cost);
            equipWeapon(slot, weapon.id);
            if (fighter.userId !== 'bot') {
              await updateDoc(doc(db, 'fighters', fighter.userId), {
                weaponSlot1: slot === 1 ? weapon.id : (fighter.weaponSlot1 ?? null),
                weaponSlot2: slot === 2 ? weapon.id : (fighter.weaponSlot2 ?? null),
                currency: fighter.currency - weapon.cost,
              });
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗡️ WEAPONS</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {(fighter?.currency ?? 0).toLocaleString()}g</Text>
        </View>
      </View>

      {/* Equipped slots */}
      <View style={styles.slotsRow}>
        <WeaponSlotDisplay
          slot={1}
          weaponId={fighter?.weaponSlot1 ?? null}
          label="LEFT HAND"
        />
        <WeaponSlotDisplay
          slot={2}
          weaponId={fighter?.weaponSlot2 ?? null}
          label="RIGHT HAND"
        />
      </View>

      {/* Rarity tabs */}
      <View style={styles.rarityTabs}>
        {RARITY_TABS.map((rarity) => {
          const color = WEAPON_RARITY_COLORS[rarity];
          const isActive = selectedRarity === rarity;
          return (
            <TouchableOpacity
              key={rarity}
              style={[styles.rarityTab, isActive && { borderColor: color, backgroundColor: color + '22' }]}
              onPress={() => setSelectedRarity(rarity)}
            >
              <Text style={[styles.rarityTabText, { color: isActive ? color : '#555' }]}>
                {rarity.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {weapons.map((weapon) => {
          const equippedSlot = isEquipped(weapon.id);
          const canAfford = (fighter?.currency ?? 0) >= weapon.cost;
          const color = WEAPON_RARITY_COLORS[weapon.rarity];
          const isExpanded = expanded === weapon.id;

          return (
            <TouchableOpacity
              key={weapon.id}
              style={[styles.weaponCard, equippedSlot !== null && { borderColor: color + '88' }]}
              onPress={() => setExpanded(isExpanded ? null : weapon.id)}
            >
              <View style={styles.weaponRow}>
                <Text style={styles.weaponIcon}>{weapon.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.weaponName, equippedSlot !== null && { color }]}>{weapon.name}</Text>
                  <Text style={styles.weaponType}>{weapon.type.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.weaponRight}>
                  {equippedSlot !== null ? (
                    <Text style={[styles.equippedText, { color }]}>SLOT {equippedSlot}</Text>
                  ) : (
                    <Text style={[styles.costText, !canAfford && { color: '#e74c3c' }]}>
                      {weapon.cost.toLocaleString()}g
                    </Text>
                  )}
                </View>
              </View>

              {isExpanded && (
                <View style={[styles.weaponDetail, { borderTopColor: color + '33' }]}>
                  <Text style={styles.weaponDesc}>{weapon.description}</Text>
                  <View style={[styles.specialBox, { backgroundColor: color + '11', borderColor: color + '33' }]}>
                    <Text style={[styles.specialLabel, { color }]}>⚡ SPECIAL EFFECT</Text>
                    <Text style={styles.specialText}>{weapon.specialEffect}</Text>
                  </View>
                  <View style={styles.boostRow}>
                    {Object.entries(weapon.statBoosts).map(([stat, val]) => (
                      <View key={stat} style={styles.boostChip}>
                        <Text style={[styles.boostVal, { color: val > 0 ? '#2ecc71' : '#e74c3c' }]}>
                          {val > 0 ? '+' : ''}{val}
                        </Text>
                        <Text style={styles.boostStat}>{stat.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                  {equippedSlot !== null ? (
                    <TouchableOpacity
                      style={[styles.equipButton, { backgroundColor: '#e74c3c' }]}
                      onPress={() => { equipWeapon(equippedSlot, null); }}
                    >
                      <Text style={styles.equipButtonText}>UNEQUIP</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.equipButtons}>
                      <TouchableOpacity
                        style={[styles.equipButton, { backgroundColor: canAfford ? color : '#333', flex: 1 }]}
                        onPress={() => handleEquip(weapon, 1)}
                      >
                        <Text style={styles.equipButtonText}>LEFT HAND</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.equipButton, { backgroundColor: canAfford ? color : '#333', flex: 1 }]}
                        onPress={() => handleEquip(weapon, 2)}
                      >
                        <Text style={styles.equipButtonText}>RIGHT HAND</Text>
                      </TouchableOpacity>
                    </View>
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

function WeaponSlotDisplay({ slot, weaponId, label }: { slot: number; weaponId: string | null; label: string }) {
  const weapon = weaponId ? WEAPONS.find((w) => w.id === weaponId) : null;
  const color = weapon ? WEAPON_RARITY_COLORS[weapon.rarity] : '#2a2a3a';

  return (
    <View style={[styles.slotBox, { borderColor: color }]}>
      <Text style={styles.slotLabel}>{label}</Text>
      {weapon ? (
        <>
          <Text style={styles.slotIcon}>{weapon.icon}</Text>
          <Text style={[styles.slotName, { color }]}>{weapon.name}</Text>
        </>
      ) : (
        <>
          <Text style={styles.slotIcon}>✋</Text>
          <Text style={styles.slotEmpty}>EMPTY</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  title: { color: '#e8c84a', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  goldBadge: { backgroundColor: '#e8c84a22', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#e8c84a44' },
  goldText: { color: '#e8c84a', fontWeight: '700', fontSize: 14 },
  slotsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  slotBox: { flex: 1, backgroundColor: '#12121a', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },
  slotLabel: { color: '#444', fontSize: 9, letterSpacing: 1, marginBottom: 8 },
  slotIcon: { fontSize: 28, marginBottom: 4 },
  slotName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  slotEmpty: { color: '#333', fontSize: 11 },
  rarityTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  rarityTab: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#2a2a3a', padding: 8, alignItems: 'center' },
  rarityTabText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 0, gap: 10 },
  weaponCard: { backgroundColor: '#12121a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a3a' },
  weaponRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weaponIcon: { fontSize: 28 },
  weaponName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  weaponType: { color: '#444', fontSize: 9, letterSpacing: 1, marginTop: 2 },
  weaponRight: { alignItems: 'flex-end' },
  equippedText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  costText: { color: '#e8c84a', fontSize: 13, fontWeight: '700' },
  weaponDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  weaponDesc: { color: '#777', fontSize: 13, marginBottom: 10 },
  specialBox: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10 },
  specialLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  specialText: { color: '#aaa', fontSize: 12 },
  boostRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  boostChip: { backgroundColor: '#1e1e2e', borderRadius: 8, padding: 8, alignItems: 'center', flex: 1 },
  boostVal: { fontSize: 16, fontWeight: '800' },
  boostStat: { color: '#444', fontSize: 9, letterSpacing: 1 },
  equipButtons: { flexDirection: 'row', gap: 10 },
  equipButton: { borderRadius: 10, padding: 12, alignItems: 'center' },
  equipButtonText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
