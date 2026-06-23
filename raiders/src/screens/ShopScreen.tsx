import React from 'react';
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

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'iron_helmet',
    name: 'Iron Helm',
    description: '+15 HP, +3 DEF',
    type: 'equipment',
    slot: 'head',
    cost: 150,
    statBoosts: { health: 15, defense: 3 },
    icon: '⛑️',
  },
  {
    id: 'battle_armor',
    name: 'Battle Armor',
    description: '+30 HP, +8 DEF',
    type: 'equipment',
    slot: 'body',
    cost: 300,
    statBoosts: { health: 30, defense: 8 },
    icon: '🥋',
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: '+12 ATK, +5 DEF',
    type: 'equipment',
    slot: 'weapon',
    cost: 250,
    statBoosts: { attack: 12, defense: 5 },
    icon: '⚔️',
  },
  {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    description: '+25 ATK',
    type: 'equipment',
    slot: 'weapon',
    cost: 500,
    statBoosts: { attack: 25 },
    icon: '🗡️',
  },
  {
    id: 'swift_boots',
    name: 'Swift Boots',
    description: '+30 SPD, +5 ATK',
    type: 'equipment',
    slot: 'boots',
    cost: 200,
    statBoosts: { speed: 30, attack: 5 },
    icon: '👟',
  },
  {
    id: 'void_crown',
    name: 'Void Crown',
    description: '+20 ATK, +15 DEF, +25 HP',
    type: 'equipment',
    slot: 'head',
    cost: 800,
    statBoosts: { attack: 20, defense: 15, health: 25 },
    icon: '👑',
  },
  {
    id: 'berserker_plate',
    name: 'Berserker Plate',
    description: '+50 HP, +15 DEF, +10 ATK',
    type: 'equipment',
    slot: 'body',
    cost: 900,
    statBoosts: { health: 50, defense: 15, attack: 10 },
    icon: '🛡️',
  },
  {
    id: 'demon_slot',
    name: 'Demon Slot +1',
    description: 'Expand your base to hold one more demon guardian',
    type: 'demon_slot',
    cost: 600,
    icon: '🔮',
  },
];

export default function ShopScreen() {
  const { raider, addCurrency } = useGameStore();

  function buyItem(item: ShopItem) {
    if (!raider) return;
    if (raider.currency < item.cost) {
      Alert.alert('Not enough gold', `You need ${item.cost} gold to buy ${item.name}.`);
      return;
    }

    Alert.alert(
      `Buy ${item.name}?`,
      `Cost: ${item.cost} gold\n${item.description}\n\nYou have ${raider.currency} gold.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            addCurrency(-item.cost);
            // Apply stat boosts
            if (item.statBoosts && raider.userId !== 'bot') {
              const newStats = { ...raider.stats };
              for (const [key, val] of Object.entries(item.statBoosts)) {
                (newStats as any)[key] = ((newStats as any)[key] ?? 0) + val;
              }
              const newEquipment = { ...raider.equipment };
              if (item.slot) newEquipment[item.slot] = item.id;

              await updateDoc(doc(db, 'raiders', raider.userId), {
                stats: newStats,
                equipment: newEquipment,
                currency: raider.currency - item.cost,
              });
            }
            Alert.alert('Purchased!', `${item.name} has been added to your loadout.`);
          },
        },
      ]
    );
  }

  const equipped = raider?.equipment ?? { head: null, body: null, weapon: null, boots: null };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🏪 SHOP</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {raider?.currency.toLocaleString()} gold</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Spend your raid earnings to power up your raider.
      </Text>

      <View style={styles.grid}>
        {SHOP_ITEMS.map((item) => {
          const isEquipped = item.slot && equipped[item.slot] === item.id;
          const canAfford = (raider?.currency ?? 0) >= item.cost;
          return (
            <View key={item.id} style={[styles.itemCard, isEquipped && styles.equipped]}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              {isEquipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
              {item.slot && (
                <Text style={styles.itemSlot}>{item.slot.toUpperCase()}</Text>
              )}
              <TouchableOpacity
                style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                onPress={() => buyItem(item)}
                disabled={!canAfford}
              >
                <Text style={[styles.buyText, !canAfford && { color: '#555' }]}>
                  {item.cost}g
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { color: '#e8c84a', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  goldBadge: {
    backgroundColor: '#e8c84a22',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e8c84a44',
  },
  goldText: { color: '#e8c84a', fontWeight: '700', fontSize: 14 },
  subtitle: { color: '#555', fontSize: 13, marginBottom: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: '47%',
    backgroundColor: '#12121a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    alignItems: 'center',
  },
  equipped: {
    borderColor: '#e8c84a66',
    backgroundColor: '#1a1a12',
  },
  equippedBadge: {
    color: '#e8c84a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  itemIcon: { fontSize: 36, marginBottom: 8 },
  itemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDesc: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
  },
  itemSlot: {
    color: '#444',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#e8c84a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  buyButtonDisabled: { backgroundColor: '#1e1e2e' },
  buyText: { color: '#000', fontWeight: '800', fontSize: 13 },
});
