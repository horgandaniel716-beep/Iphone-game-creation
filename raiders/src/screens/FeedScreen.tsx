import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { getRankInfo } from '../lib/ranking';
import { detectBuildVariant } from '../lib/moveTypes';

interface FeedEvent {
  id: string;
  type: 'win' | 'rank_up' | 'boss_kill' | 'streak' | 'trophy' | 'build' | 'zombie';
  user: string;
  tag: string;
  icon: string;
  color: string;
  headline: string;
  sub: string;
  time: string;
  mmr?: number;
}

// Simulated live feed — will pull from Firestore in multiplayer
function generateFeed(playerName: string, playerRankTier: string): FeedEvent[] {
  const rankInfo = getRankInfo(playerRankTier as any);
  return [
    {
      id: '1', type: 'rank_up', user: 'VENOM_XIII', tag: 'BLOCK', icon: '🐍', color: '#2ecc71',
      headline: 'VENOM_XIII just hit Menace ⚡',
      sub: 'They ducking his matchup now. Can\'t blame them.',
      time: '2m ago', mmr: 3100,
    },
    {
      id: '2', type: 'boss_kill', user: 'TITANFALL', tag: 'BRUTE', icon: '🏔️', color: '#e8c84a',
      headline: 'TITANFALL took down IRON MIKE',
      sub: '+200 gold  •  Iron Fist Trinket dropped',
      time: '7m ago',
    },
    {
      id: '3', type: 'streak', user: 'GHOSTSTEP', tag: 'MNCE', icon: '👻', color: '#9b59b6',
      headline: 'GHOSTSTEP on a 9-WIN STREAK 🔥',
      sub: 'Playing at Sovereign level. Watch the film.',
      time: '12m ago',
    },
    {
      id: '4', type: 'win', user: 'APEX_GOD', tag: 'SOV', icon: '⚡', color: '#ff9000',
      headline: 'APEX_GOD got a FLAWLESS victory',
      sub: 'Opponent didn\'t land a single clean hit.',
      time: '18m ago',
    },
    {
      id: '5', type: 'zombie', user: 'DUPREE44', tag: 'SCRPPR', icon: '🩸', color: '#e74c3c',
      headline: 'DUPREE44 survived Wave 5 in Zombies',
      sub: '+450 gold  •  Cashed out before the boss wave',
      time: '25m ago',
    },
    {
      id: '6', type: 'build', user: 'COLD_CASE', tag: 'TECH', icon: '🔬', color: '#4a9eff',
      headline: 'COLD_CASE unlocked VOID WALKER build',
      sub: 'Shadow type mastery. Certified ghost.',
      time: '31m ago',
    },
    {
      id: '7', type: 'rank_up', user: 'SCRAPPER44', tag: 'GOON', icon: '🔱', color: '#e67e22',
      headline: 'SCRAPPER44 hit Goon status 🔱',
      sub: 'Word spreadin. They know who you are now.',
      time: '1h ago',
    },
    {
      id: '8', type: 'boss_kill', user: 'NIGHTMARE', tag: 'PRBLM', icon: '😤', color: '#ff2d78',
      headline: 'NIGHTMARE beat THE VOID BOSS 🌀',
      sub: 'Void Crown dropped. First player to do it.',
      time: '2h ago',
    },
    {
      id: '9', type: 'win', user: 'DYNASTY', tag: 'SOV', icon: '👑', color: '#e8c84a',
      headline: 'DYNASTY just went 20-0 this session',
      sub: 'Another one. Send the next one.',
      time: '3h ago',
    },
    {
      id: '10', type: 'streak', user: playerName || 'YOU', tag: rankInfo.icon, icon: rankInfo.icon, color: rankInfo.color,
      headline: `${playerName || 'YOU'} is on the grind 👀`,
      sub: 'Your name is starting to show up in feeds.',
      time: 'just now',
    },
  ].reverse();
}

const EVENT_COLORS = {
  win:       '#2ecc71',
  rank_up:   '#e8c84a',
  boss_kill: '#ff2d78',
  streak:    '#ff9000',
  trophy:    '#9b59b6',
  build:     '#4a9eff',
  zombie:    '#e74c3c',
};

const EVENT_LABELS = {
  win:       'WIN',
  rank_up:   'RANK UP',
  boss_kill: 'BOSS',
  streak:    'STREAK',
  trophy:    'TROPHY',
  build:     'BUILD',
  zombie:    'ZOMBIES',
};

export default function FeedScreen() {
  const { fighter } = useGameStore();
  const [refreshing, setRefreshing] = useState(false);
  const [feed, setFeed] = useState(() =>
    generateFeed(fighter?.name ?? 'YOU', fighter?.rank?.tier ?? 'scrapper')
  );

  function refresh() {
    setRefreshing(true);
    setTimeout(() => {
      setFeed(generateFeed(fighter?.name ?? 'YOU', fighter?.rank?.tier ?? 'scrapper'));
      setRefreshing(false);
    }, 800);
  }

  const variant = fighter ? detectBuildVariant(fighter.unlockedMoves ?? [], fighter.wins) : null;
  const rankInfo = fighter?.rank ? getRankInfo(fighter.rank.tier) : null;

  return (
    <View style={styles.container}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>FEED</Text>
        <View style={styles.headerRight}>
          {rankInfo && (
            <View style={[styles.rankChip, { borderColor: rankInfo.color + '44' }]}>
              <Text style={[styles.rankChipText, { color: rankInfo.color }]}>
                {rankInfo.icon} {rankInfo.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── YOUR CARD ─────────────────────────────────────────────────── */}
      {fighter && variant && (
        <View style={[styles.youCard, { borderColor: variant.color + '33' }]}>
          <View>
            <Text style={styles.youLabel}>YOUR STATUS</Text>
            <Text style={styles.youName}>{fighter.name}</Text>
            <Text style={styles.youRecord}>{fighter.wins}W / {fighter.losses}L  •  LVL {fighter.level}</Text>
          </View>
          <View style={[styles.variantPill, { backgroundColor: variant.color + '22', borderColor: variant.color + '44' }]}>
            <Text style={styles.variantIcon}>{variant.icon}</Text>
            <Text style={[styles.variantText, { color: variant.color }]}>{variant.name}</Text>
          </View>
        </View>
      )}

      {/* ── FEED ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#e8c84a" />}
      >
        {feed.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            {/* Left: avatar + type pill */}
            <View style={styles.eventLeft}>
              <View style={[styles.avatar, { backgroundColor: event.color + '22', borderColor: event.color + '44' }]}>
                <Text style={styles.avatarIcon}>{event.icon}</Text>
              </View>
              <View style={[styles.typePill, { backgroundColor: EVENT_COLORS[event.type] + '22' }]}>
                <Text style={[styles.typeText, { color: EVENT_COLORS[event.type] }]}>
                  {EVENT_LABELS[event.type]}
                </Text>
              </View>
            </View>

            {/* Right: content */}
            <View style={styles.eventContent}>
              <Text style={styles.eventHeadline}>{event.headline}</Text>
              <Text style={styles.eventSub}>{event.sub}</Text>
              <Text style={styles.eventTime}>{event.time}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.feedEnd}>— Pull to refresh —</Text>
      </ScrollView>
    </View>
  );
}

const C = '#080810';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 },
  title: { color: '#e8c84a', fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rankChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  rankChipText: { fontSize: 11, fontWeight: '800' },

  youCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#0e0e18', borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  youLabel: { color: '#333', fontSize: 8, letterSpacing: 2, marginBottom: 2 },
  youName: { color: '#fff', fontSize: 16, fontWeight: '900' },
  youRecord: { color: '#444', fontSize: 10, marginTop: 2 },
  variantPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  variantIcon: { fontSize: 16 },
  variantText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  feed: { flex: 1, paddingHorizontal: 16 },

  eventRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#0e0e18' },
  eventLeft: { alignItems: 'center', gap: 6, width: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 20 },
  typePill: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  typeText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  eventContent: { flex: 1, justifyContent: 'center' },
  eventHeadline: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  eventSub: { color: '#555', fontSize: 11, marginTop: 2, lineHeight: 15 },
  eventTime: { color: '#2a2a3a', fontSize: 9, marginTop: 4 },

  feedEnd: { color: '#1a1a28', fontSize: 10, textAlign: 'center', paddingVertical: 24 },
});
