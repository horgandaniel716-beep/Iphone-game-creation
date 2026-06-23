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
import type { ShopItem } from '../types';
import { TRINKETS, TRINKET_RARITY_COLORS, type Trinket } from '../lib/trinkets';

const SHOP_ITEMS: ShopItem[] = [
  { id: 'iron_helmet',    name: 'Iron Helm',       description: '+15 HP, +3 DEF',                type: 'equipment', slot: 'head',   cost: 150,  statBoosts: { health: 15, defense: 3 },          icon: '⛑️'  },
  { id: 'battle_armor',  name: 'Battle Armor',     description: '+30 HP, +8 DEF',                type: 'equipment', slot: 'body',   cost: 300,  statBoosts: { health: 30, defense: 8 },          icon: '🥋'  },
  { id: 'iron_sword',    name: 'Iron Sword',        description: '+12 ATK, +5 DEF',               type: 'equipment', slot: 'weapon', cost: 250,  statBoosts: { attack: 12, defense: 5 },          icon: '⚔️'  },
  { id: 'shadow_blade',  name: 'Shadow Blade',      description: '+25 ATK',                       type: 'equipment', slot: 'weapon', cost: 500,  statBoosts: { attack: 25 },                      icon: '🗡️'  },
  { id: 'swift_boots',   name: 'Swift Boots',       description: '+30 SPD, +5 ATK',               type: 'equipment', slot: 'boots',  cost: 200,  statBoosts: { speed: 30, attack: 5 },            icon: '👟'  },
  { id: 'void_crown',    name: 'Void Crown',        description: '+20 ATK, +15 DEF, +25 HP',      type: 'equipment', slot: 'head',   cost: 800,  statBoosts: { attack: 20, defense: 15, health: 25 }, icon: '👑' },
  { id: 'berserker_plate', name: 'Berserker Plate', description: '+50 HP, +15 DEF, +10 ATK',      type: 'equipment', slot: 'body',   cost: 900,  statBoosts: { health: 50, defense: 15, attack: 10 }, icon: '🛡️' },
  { id: 'demon_slot',    name: 'Demon Slot +1',     description: 'Hold one more demon guardian',  type: 'demon_slot',               cost: 600,                                                   icon: '🔮'  },
];

type Tab = 'equipment' | 'trinkets';
type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

export default function ShopScreen() {
  const { fighter, addCurrency } = useGameStore();
  const [tab, setTab] = useState<Tab>('equipment');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');

  function buyEquipment(item: ShopItem) {
    if (!fighter) return;
    if (fighter.currency < item.cost) {
      Alert.alert('Not enough gold', `You need ${item.cost} gold.`);
      return;
    }
    Alert.alert(
      `Buy ${item.name}?`,
      `Cost: ${item.cost}g\n${item.description}\n\nYou have ${fighter.currency}g.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            addCurrency(-item.cost);
            if (item.statBoosts && fighter.userId !== 'bot') {
              const newStats = { ...fighter.stats };
              for (const [key, val] of Object.entries(item.statBoosts)) {
                (newStats as any)[key] = ((newStats as any)[key] ?? 0) + val;
              }
              const newEquipment = { ...fighter.equipment };
              if (item.slot) newEquipment[item.slot] = item.id;
              await updateDoc(doc(db, 'fighters', fighter.userId), {
                stats: newStats, equipment: newEquipment, currency: fighter.currency - item.cost,
              });
            }
            Alert.alert('Purchased!', `${item.name} equipped.`);
          },
        },
      ]
    );
  }

  function buyTrinket(trinket: Trinket) {
    if (!fighter) return;
    if (fighter.currency < trinket.cost) {
      Alert.alert('Not enough gold', `You need ${trinket.cost}g.`);
      return;
    }
    const slot1 = fighter.trinket1;
    const slot2 = fighter.trinket2;
    if (slot1 === trinket.id || slot2 === trinket.id) {
      Alert.alert('Already owned', 'You already have this trinket equipped.');
      return;
    }
    const targetSlot = !slot1 ? 'trinket1' : !slot2 ? 'trinket2' : null;
    if (!targetSlot) {
      Alert.alert('Trinket slots full', 'Unequip a trinket before buying a new one.\n\n(Coming soon: trinket management)');
      return;
    }
    Alert.alert(
      `Equip ${trinket.name}?`,
      `${trinket.effect}\n\nCost: ${trinket.cost}g\nYou have: ${fighter.currency}g`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Equip',
          onPress: async () => {
            addCurrency(-trinket.cost);
            if (fighter.userId !== 'bot') {
              await updateDoc(doc(db, 'fighters', fighter.userId), {
                [targetSlot]: trinket.id,
                currency: fighter.currency - trinket.cost,
              });
            }
            Alert.alert('Equipped!', `${trinket.name} is now active.`);
          },
        },
      ]
    );
  }

  const equipped = fighter?.equipment ?? { head: null, body: null, weapon: null, boots: null };
  const filteredTrinkets = rarityFilter === 'all' ? TRINKETS : TRINKETS.filter((t) => t.rarity === rarityFilter);
  const equippedTrinkets = [fighter?.trinket1, fighter?.trinket2].filter(Boolean) as string[];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏪 SHOP</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {fighter?.currency.toLocaleString()}g</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'equipment' && styles.tabActive]}
          onPress={() => setTab('equipment')}
        >
          <Text style={[styles.tabText, tab === 'equipment' && styles.tabTextActive]}>⚔️ GEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'trinkets' && styles.tabActive]}
          onPress={() => setTab('trinkets')}
        >
          <Text style={[styles.tabText, tab === 'trinkets' && styles.tabTextActive]}>🔮 TRINKETS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {tab === 'equipment' ? (
          <View style={styles.grid}>
            {SHOP_ITEMS.map((item) => {
              const isEquipped = item.slot && equipped[item.slot] === item.id;
              const canAfford = (fighter?.currency ?? 0) >= item.cost;
              return (
                <View key={item.id} style={[styles.itemCard, isEquipped && styles.equippedCard]}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  {isEquipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  {item.slot && <Text style={styles.itemSlot}>{item.slot.toUpperCase()}</Text>}
                  <TouchableOpacity
                    style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                    onPress={() => buyEquipment(item)}
                    disabled={!canAfford}
                  >
                    <Text style={[styles.buyText, !canAfford && { color: '#555' }]}>{item.cost}g</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <>
            {/* Trinket slots */}
            <View style={styles.trinketSlots}>
              <Text style={styles.slotsLabel}>EQUIPPED TRINKETS</Text>
              <View style={styles.slotsRow}>
                {[0, 1].map((i) => {
                  const tid = equippedTrinkets[i];
                  const t = TRINKETS.find((x) => x.id === tid);
                  return (
                    <View key={i} style={[styles.trinketSlotBox, t ? { borderColor: TRINKET_RARITY_COLORS[t.rarity] + '88' } : {}]}>
                      {t ? (
                        <>
                          <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                          <Text style={[styles.slotName, { color: TRINKET_RARITY_COLORS[t.rarity] }]}>{t.name}</Text>
                          <Text style={styles.slotEffect} numberOfLines={2}>{t.effect}</Text>
                        </>
                      ) : (
                        <Text style={styles.emptySlot}>EMPTY SLOT {i + 1}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Rarity filter */}
            <View style={styles.rarityRow}>
              {(['all', 'common', 'rare', 'epic', 'legendary'] as RarityFilter[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rarityBtn, rarityFilter === r && { backgroundColor: rarityColor(r) + '33', borderColor: rarityColor(r) }]}
                  onPress={() => setRarityFilter(r)}
                >
                  <Text style={[styles.rarityBtnText, rarityFilter === r && { color: rarityColor(r) }]}>
                    {r === 'all' ? 'ALL' : r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trinket grid */}
            <View style={styles.grid}>
              {filteredTrinkets.map((trinket) => {
                const isOwned = equippedTrinkets.includes(trinket.id);
                const canAfford = (fighter?.currency ?? 0) >= trinket.cost;
                const rc = TRINKET_RARITY_COLORS[trinket.rarity];
                return (
                  <View key={trinket.id} style={[styles.trinketCard, { borderColor: rc + (isOwned ? 'cc' : '44') }, isOwned && { backgroundColor: '#0e1a0e' }]}>
                    <View style={styles.trinketTop}>
                      <Text style={{ fontSize: 28 }}>{trinket.icon}</Text>
                      <View style={[styles.rarityTag, { backgroundColor: rc + '22', borderColor: rc + '66' }]}>
                        <Text style={[styles.rarityTagText, { color: rc }]}>{trinket.rarity.toUpperCase()}</Text>
                      </View>
                    </View>
                    {isOwned && <Text style={[styles.equippedBadge, { color: rc }]}>EQUIPPED</Text>}
                    <Text style={[styles.itemName, { color: rc }]}>{trinket.name}</Text>
                    <Text style={styles.trinketFlavor}>{trinket.description}</Text>
                    <Text style={styles.trinketEffect}>{trinket.effect}</Text>
                    <TouchableOpacity
                      style={[styles.buyButton, { backgroundColor: rc + '33', borderWidth: 1, borderColor: rc + '66' }, (!canAfford || isOwned) && styles.buyButtonDisabled]}
                      onPress={() => buyTrinket(trinket)}
                      disabled={!canAfford || isOwned}
                    >
                      <Text style={[styles.buyText, { color: canAfford && !isOwned ? rc : '#555' }]}>
                        {isOwned ? 'OWNED' : `${trinket.cost}g`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function rarityColor(r: RarityFilter): string {
  if (r === 'all') return '#888';
  return TRINKET_RARITY_COLORS[r];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { color: '#e8c84a', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  goldBadge: { backgroundColor: '#e8c84a22', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#e8c84a44' },
  goldText: { color: '#e8c84a', fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e' },
  tabActive: { backgroundColor: '#1e1e2e', borderColor: '#e8c84a55' },
  tabText: { color: '#444', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  tabTextActive: { color: '#e8c84a' },
  content: { padding: 16, paddingBottom: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: { width: '47%', backgroundColor: '#12121a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a3a', alignItems: 'center' },
  equippedCard: { borderColor: '#e8c84a66', backgroundColor: '#1a1a12' },
  equippedBadge: { color: '#e8c84a', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  itemIcon: { fontSize: 32, marginBottom: 6 },
  itemName: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  itemDesc: { color: '#555', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  itemSlot: { color: '#333', fontSize: 8, letterSpacing: 1, marginBottom: 8 },
  buyButton: { backgroundColor: '#e8c84a', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 18 },
  buyButtonDisabled: { backgroundColor: '#1e1e2e' },
  buyText: { color: '#000', fontWeight: '900', fontSize: 12 },
  // Trinket styles
  trinketSlots: { marginBottom: 16 },
  slotsLabel: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  slotsRow: { flexDirection: 'row', gap: 12 },
  trinketSlotBox: { flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a', minHeight: 90 },
  slotName: { fontSize: 11, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  slotEffect: { color: '#555', fontSize: 9, textAlign: 'center', marginTop: 2 },
  emptySlot: { color: '#333', fontSize: 10, letterSpacing: 1 },
  rarityRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  rarityBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#2a2a3a' },
  rarityBtnText: { color: '#444', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  trinketCard: { width: '47%', backgroundColor: '#12121a', borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center' },
  trinketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 6 },
  rarityTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  rarityTagText: { fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  trinketFlavor: { color: '#333', fontSize: 9, fontStyle: 'italic', textAlign: 'center', marginBottom: 4 },
  trinketEffect: { color: '#aaa', fontSize: 10, textAlign: 'center', marginBottom: 10 },
});
