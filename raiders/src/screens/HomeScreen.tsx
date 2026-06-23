import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { getCharacter } from '../lib/characters';
import { getRankInfo, getRankDisplayString } from '../lib/ranking';
import { detectBuildVariant, MOVE_TYPES, MOVE_TYPE_MAP } from '../lib/moveTypes';
import { getTrinketById, TRINKET_RARITY_COLORS } from '../lib/trinkets';

const RARITY_COLOR = {
  common: '#888',
  rare: '#4a9eff',
  epic: '#b44aff',
  legendary: '#ff9000',
};

// Mock social feed
const MOCK_FEED = [
  { user: 'VENOM_XIII', action: 'dropped a 14 hit combo on a Menace', char: '🐍', color: '#2ecc71', time: '2m ago' },
  { user: 'TITANFALL',  action: 'hit Sovereign — they\'re not playing',  char: '🏔️', color: '#e8c84a', time: '8m ago' },
  { user: 'GHOSTSTEP',  action: 'got a FLAWLESS on a Problem',    char: '👻', color: '#b44aff', time: '14m ago' },
  { user: 'APEX_GOD',   action: 'reached LEGEND. Send the next one.', char: '🌟', color: '#ff2d78', time: '1h ago' },
  { user: 'SCRAPPER44', action: 'just hit Goon status 🔱 word spreadin', char: '🩸', color: '#e67e22', time: '3h ago' },
];

export default function HomeScreen() {
  const { fighter, base, battleHistory } = useGameStore();
  const [feedVisible, setFeedVisible] = useState(true);

  if (!fighter) return null;

  const char = getCharacter(fighter.selectedCharacter);
  const xpPercent = Math.min((fighter.xp / (500 * fighter.level)) * 100, 100);
  const rank = fighter.rank;
  const rankInfo = rank ? getRankInfo(rank.tier) : null;
  const rankDisplay = rank ? getRankDisplayString(rank) : '🩸 Scrapper 4';
  const totalGames = fighter.wins + fighter.losses;
  const winRate = totalGames > 0 ? Math.round((fighter.wins / totalGames) * 100) : 0;
  const variantRaw = detectBuildVariant(fighter.unlockedMoves ?? [], fighter.wins);
  const variant = { name: variantRaw.name, desc: variantRaw.subtitle, color: variantRaw.color };
  const isFamous = fighter.wins >= 10;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>WELCOME BACK</Text>
          <Text style={styles.name}>{fighter.name}</Text>
          {fighter.tag ? <Text style={styles.tag}>#{fighter.tag}</Text> : null}
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut(auth)}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>

      {/* ── FAME BANNER ─────────────────────────────────────── */}
      {isFamous && (
        <View style={styles.fameBanner}>
          <Text style={styles.fameIcon}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.fameLabel}>REPUTATION</Text>
            <Text style={styles.fameName}>{fighter.name.toUpperCase()} IS KNOWN</Text>
          </View>
          <View style={styles.followBox}>
            <Text style={styles.followCount}>{fighter.wins * 12}</Text>
            <Text style={styles.followLabel}>FOLLOWERS</Text>
          </View>
        </View>
      )}

      {/* ── RANK BANNER ─────────────────────────────────────── */}
      {rankInfo && (
        <View style={[styles.rankBanner, { borderColor: rankInfo.color + '55', backgroundColor: rankInfo.color + '0d' }]}>
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

      {/* ── FIGHTER CARD ────────────────────────────────────── */}
      <View style={[styles.fighterCard, { borderColor: char.primaryColor + '44' }]}>
        <Text style={styles.charIcon}>{char.icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.charTopRow}>
            <Text style={[styles.charName, { color: char.primaryColor }]}>{char.name}</Text>
            <View style={[styles.rarityPill, { backgroundColor: char.primaryColor + '22' }]}>
              <Text style={[styles.rarityText, { color: char.accentColor }]}>{char.rarity?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={styles.charSubtitle}>{char.subtitle}</Text>
            {fighter.bodySize && (
              <View style={{ backgroundColor: '#1e1e2e', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ color: '#555', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>
                  {fighter.bodySize === 'runt' ? '🐀 RUNT' : fighter.bodySize === 'brute' ? '🦍 BRUTE' : '⚖️ STANDARD'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>LVL {fighter.level}</Text>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpPercent}%` as any, backgroundColor: char.primaryColor }]} />
            </View>
            <Text style={styles.xpText}>{fighter.xp}/{500 * fighter.level}</Text>
          </View>
        </View>
      </View>

      {/* ── BUILD VARIANT ───────────────────────────────────── */}
      <View style={[styles.variantCard, { borderColor: variant.color + '44' }]}>
        <View style={[styles.variantDot, { backgroundColor: variant.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.variantLabel}>BUILD VARIANT</Text>
          <Text style={[styles.variantName, { color: variant.color }]}>{variant.name}</Text>
          <Text style={styles.variantDesc}>{variant.desc}</Text>
        </View>
        <Text style={styles.variantBadge}>◆</Text>
      </View>

      {/* ── STATS ───────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatBox label="💰 GOLD"   value={fighter.currency.toLocaleString()} />
        <StatBox label="⚔️ WINS"   value={String(fighter.wins)} />
        <StatBox label="💀 LOSSES" value={String(fighter.losses)} />
        <StatBox label="📊 W/RATE" value={totalGames > 0 ? `${winRate}%` : '--'} />
      </View>

      {/* ── WEAPON LOADOUT ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WEAPON LOADOUT</Text>
        <View style={styles.weaponRow}>
          <WeaponSlot label="LEFT" weaponId={fighter.weaponSlot1 ?? null} />
          <WeaponSlot label="RIGHT" weaponId={fighter.weaponSlot2 ?? null} />
        </View>
      </View>

      {/* ── TRINKETS ────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRINKETS</Text>
        <View style={styles.weaponRow}>
          {[fighter.trinket1, fighter.trinket2].map((tid, i) => {
            const t = tid ? getTrinketById(tid) : null;
            const rc = t ? TRINKET_RARITY_COLORS[t.rarity] : '#2a2a3a';
            return (
              <View key={i} style={[styles.weaponSlot, { borderColor: rc + '55' }]}>
                <Text style={styles.weaponSlotLabel}>SLOT {i + 1}</Text>
                {t ? (
                  <>
                    <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                    <Text style={[styles.weaponSlotName, { color: rc }]}>{t.name}</Text>
                    <Text style={[styles.weaponSlotLabel, { marginTop: 2 }]} numberOfLines={2}>{t.effect}</Text>
                  </>
                ) : (
                  <Text style={styles.weaponSlotEmpty}>EMPTY</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── SIGNATURE MOVES ─────────────────────────────────── */}
      <View style={[styles.section, { borderColor: char.primaryColor + '22' }]}>
        <Text style={styles.sectionTitle}>SIGNATURE MOVES</Text>
        <View style={styles.sigRow}>
          <View style={[styles.sigPill, { backgroundColor: char.accentColor + '22', borderColor: char.accentColor + '44' }]}>
            <Text style={[styles.sigIcon, { color: char.accentColor }]}>✦</Text>
            <View>
              <Text style={[styles.sigName, { color: char.accentColor }]}>{char.specialName}</Text>
              <Text style={styles.sigDesc}>{char.specialDesc}</Text>
            </View>
          </View>
          <View style={[styles.sigPill, { backgroundColor: char.primaryColor + '22', borderColor: char.primaryColor + '44', marginTop: 8 }]}>
            <Text style={[styles.sigIcon, { color: '#ff4400' }]}>★</Text>
            <View>
              <Text style={[styles.sigName, { color: char.primaryColor }]}>{char.superName}</Text>
              <Text style={styles.sigDesc}>{char.superDesc}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── UNLOCKED MOVES ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MOVES UNLOCKED ({fighter.unlockedMoves?.length ?? 2})</Text>
        {/* Type breakdown */}
        {(() => {
          const moves = fighter.unlockedMoves ?? ['jab', 'low_kick'];
          const typeCounts: Record<string, number> = {};
          for (const m of moves) {
            const t = MOVE_TYPE_MAP[m];
            if (t) typeCounts[t] = (typeCounts[t] ?? 0) + 1;
          }
          const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
          if (!sorted.length) return null;
          return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {sorted.map(([type, count]) => {
                const info = MOVE_TYPES[type as keyof typeof MOVE_TYPES];
                return (
                  <View key={type} style={[styles.movePill, { backgroundColor: info.color + '22', borderColor: info.color + '55' }]}>
                    <Text style={{ fontSize: 10 }}>{info.icon}</Text>
                    <Text style={[styles.movePillText, { color: info.color }]}>{info.label} ×{count}</Text>
                  </View>
                );
              })}
            </View>
          );
        })()}
        <View style={styles.movesGrid}>
          {(fighter.unlockedMoves ?? ['jab', 'low_kick']).slice(0, 8).map((moveId) => {
            const t = MOVE_TYPE_MAP[moveId];
            const info = t ? MOVE_TYPES[t] : null;
            return (
              <View key={moveId} style={[styles.movePill, info && { borderColor: info.color + '44' }]}>
                {info && <Text style={{ fontSize: 9 }}>{info.icon}</Text>}
                <Text style={styles.movePillText}>{moveId.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            );
          })}
          {(fighter.unlockedMoves?.length ?? 2) > 8 && (
            <View style={[styles.movePill, { backgroundColor: '#1e1e2e' }]}>
              <Text style={styles.movePillText}>+{(fighter.unlockedMoves?.length ?? 2) - 8} MORE</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── BASE GUARDIANS ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BASE GUARDIANS ({base?.demons.length ?? 0}/5)</Text>
        {!base?.demons.length ? (
          <Text style={styles.emptyText}>No guardians yet. Summon AI demons in the Base tab.</Text>
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

      {/* ── SOCIAL FEED ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Pressable style={styles.sectionHeader} onPress={() => setFeedVisible(!feedVisible)}>
          <Text style={styles.sectionTitle}>WHAT'S POPPING 🔥</Text>
          <Text style={styles.sectionToggle}>{feedVisible ? '▲' : '▼'}</Text>
        </Pressable>
        {feedVisible && MOCK_FEED.map((item, i) => (
          <View key={i} style={styles.feedRow}>
            <Text style={styles.feedChar}>{item.char}</Text>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={[styles.feedUser, { color: item.color }]}>{item.user} </Text>
                <Text style={styles.feedAction}>{item.action}</Text>
              </Text>
              <Text style={styles.feedTime}>{item.time}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.feedMoreBtn}>
          <Text style={styles.feedMoreText}>FULL FEED — COMING SOON</Text>
        </TouchableOpacity>
      </View>

      {/* ── RECENT BATTLES ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT BATTLES</Text>
        {!battleHistory.length ? (
          <Text style={styles.emptyText}>No battles yet. Step into the Arena.</Text>
        ) : (
          battleHistory.slice(0, 5).map((b, i) => (
            <View key={i} style={styles.battleRow}>
              <View style={[styles.battleResult, { backgroundColor: b.won ? '#2ecc7122' : '#e74c3c22' }]}>
                <Text style={b.won ? styles.winLabel : styles.lossLabel}>{b.won ? 'W' : 'L'}</Text>
              </View>
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

      {/* ── DOJO ────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.dojoCard}>
        <View style={styles.dojoLeft}>
          <Text style={styles.dojoIcon}>🏯</Text>
          <View>
            <Text style={styles.dojoTitle}>CLAN DOJO</Text>
            <Text style={styles.dojoDesc}>Train. Host. Dominate.</Text>
          </View>
        </View>
        <View style={styles.dojoBadge}>
          <Text style={styles.dojoBadgeText}>COMING SOON</Text>
        </View>
      </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: '#080810' },
  content: { padding: 18, paddingBottom: 50, gap: 10 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  greeting: { color: '#333', fontSize: 9, letterSpacing: 3 },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  tag: { color: '#333', fontSize: 10, marginTop: 1 },
  signOutBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e' },
  signOutText: { color: '#444', fontSize: 10, letterSpacing: 1 },

  // Fame
  fameBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ff440011', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#ff440033',
  },
  fameIcon: { fontSize: 26 },
  fameLabel: { color: '#ff4400', fontSize: 9, letterSpacing: 2 },
  fameName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  followBox: { alignItems: 'center' },
  followCount: { color: '#ff4400', fontSize: 20, fontWeight: '900' },
  followLabel: { color: '#444', fontSize: 8, letterSpacing: 1 },

  // Rank
  rankBanner: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankIcon: { fontSize: 28 },
  rankLabel: { color: '#333', fontSize: 8, letterSpacing: 2, marginBottom: 2 },
  rankDisplay: { fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  mmrBox: { alignItems: 'center' },
  mmrValue: { fontSize: 20, fontWeight: '900' },
  mmrLabel: { color: '#333', fontSize: 8, letterSpacing: 1 },

  // Fighter card
  fighterCard: {
    backgroundColor: '#0e0e18', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1,
  },
  charIcon: { fontSize: 44 },
  charTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  charName: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  rarityPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  rarityText: { fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  charSubtitle: { color: '#444', fontSize: 10, marginBottom: 7 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelText: { color: '#e8c84a', fontWeight: '800', fontSize: 12, width: 42 },
  xpBarBg: { flex: 1, height: 4, backgroundColor: '#1e1e2e', borderRadius: 2 },
  xpBarFill: { height: 4, borderRadius: 2 },
  xpText: { color: '#333', fontSize: 9, width: 48 },

  // Build variant
  variantCard: {
    backgroundColor: '#0e0e18', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1,
  },
  variantDot: { width: 12, height: 12, borderRadius: 6 },
  variantLabel: { color: '#333', fontSize: 8, letterSpacing: 2, marginBottom: 2 },
  variantName: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  variantDesc: { color: '#444', fontSize: 10, marginTop: 1 },
  variantBadge: { color: '#2a2a3a', fontSize: 20 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: '#0e0e18', borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#1a1a28',
  },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '800' },
  statLabel: { color: '#333', fontSize: 8, marginTop: 2, letterSpacing: 0.5 },

  // Section
  section: {
    backgroundColor: '#0e0e18', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1a1a28',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  sectionToggle: { color: '#333', fontSize: 12 },

  // Weapons
  weaponRow: { flexDirection: 'row', gap: 10 },
  weaponSlot: {
    flex: 1, backgroundColor: '#12121a', borderRadius: 10, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#1a1a28',
  },
  weaponSlotLabel: { color: '#333', fontSize: 8, letterSpacing: 1, marginBottom: 4 },
  weaponSlotName: { color: '#e8c84a', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  weaponSlotEmpty: { color: '#252535', fontSize: 10 },

  // Signature moves
  sigRow: {},
  sigPill: { borderRadius: 10, borderWidth: 1, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  sigIcon: { fontSize: 18 },
  sigName: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  sigDesc: { color: '#555', fontSize: 11, marginTop: 1 },

  // Moves
  movesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  movePill: {
    backgroundColor: '#12121a', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#1a1a28', flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  movePillText: { color: '#444', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  // Demons
  demonRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#12121a',
  },
  demonDot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  demonName: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  demonOrigin: { color: '#333', fontSize: 10, marginTop: 1 },
  rarityBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Feed
  feedRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#12121a',
  },
  feedChar: { fontSize: 22 },
  feedUser: { fontWeight: '800', fontSize: 12 },
  feedAction: { color: '#666', fontSize: 12 },
  feedTime: { color: '#2a2a3a', fontSize: 10, marginTop: 2 },
  feedMoreBtn: { paddingTop: 10, alignItems: 'center' },
  feedMoreText: { color: '#2a2a3a', fontSize: 9, letterSpacing: 2 },

  emptyText: { color: '#252535', fontSize: 12, textAlign: 'center', paddingVertical: 8 },

  // Battles
  battleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#12121a',
  },
  battleResult: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  winLabel: { color: '#2ecc71', fontWeight: '900', fontSize: 12 },
  lossLabel: { color: '#e74c3c', fontWeight: '900', fontSize: 12 },
  battleOpp: { color: '#666', flex: 1, fontSize: 12 },
  battleReward: { color: '#e8c84a', fontSize: 12, fontWeight: '600' },
  mmrChange: { fontSize: 9, fontWeight: '700' },

  // Dojo
  dojoCard: {
    backgroundColor: '#0e0e18', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#1a1a28',
  },
  dojoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dojoIcon: { fontSize: 32 },
  dojoTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  dojoDesc: { color: '#444', fontSize: 10, marginTop: 2 },
  dojoBadge: { backgroundColor: '#1a1a28', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  dojoBadgeText: { color: '#333', fontSize: 8, letterSpacing: 1, fontWeight: '800' },
});
