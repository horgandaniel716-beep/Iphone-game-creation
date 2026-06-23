import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { getCharacter } from '../lib/characters';
import { getRankInfo, getRankDisplayString, isStreetTier, isTechTier, getRankProgressPercent } from '../lib/ranking';
import { detectBuildVariant } from '../lib/moveTypes';
import { getTrinketById, TRINKET_RARITY_COLORS } from '../lib/trinkets';
import { TROPHIES } from '../lib/trophies';

const BODY_SIZE_LABELS = { runt: '🐭 RUNT', standard: '⚡ STANDARD', brute: '🦍 BRUTE' };

export default function ProfileScreen() {
  const { fighter } = useGameStore();
  const [editing, setEditing] = useState(false);
  const [bioInput, setBioInput] = useState(fighter?.bio ?? '');
  const [tagInput, setTagInput] = useState(fighter?.tag ?? '');

  if (!fighter) return null;

  const char = getCharacter(fighter.selectedCharacter);
  const rank = fighter.rank;
  const rankInfo = rank ? getRankInfo(rank.tier) : null;
  const rankDisplay = rank ? getRankDisplayString(rank) : '🩸 Scrapper 4';
  const rankPct = rank ? getRankProgressPercent(rank.mmr) : 0;
  const totalGames = fighter.wins + fighter.losses;
  const winRate = totalGames > 0 ? Math.round((fighter.wins / totalGames) * 100) : 0;
  const variant = detectBuildVariant(fighter.unlockedMoves ?? [], fighter.wins);
  const bodyLabel = BODY_SIZE_LABELS[fighter.bodySize ?? 'standard'];
  const streak = fighter.currentStreak ?? 0;

  // Reputation stats
  const knockoutRate = fighter.wins > 0 ? Math.min(100, Math.round((fighter.wins * 0.62))) : 0;
  const sigWeaponKOs = Math.floor(fighter.wins * 0.18);
  const longestStreak = Math.max(streak, Math.floor(fighter.wins * 0.25));

  // Earned trophies
  const earned = (fighter.earnedTrophies ?? [])
    .map((id) => TROPHIES.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 6);

  // Trinkets
  const t1 = fighter.trinket1 ? getTrinketById(fighter.trinket1) : null;
  const t2 = fighter.trinket2 ? getTrinketById(fighter.trinket2) : null;

  async function saveProfile() {
    if (!fighter.userId) return;
    try {
      await updateDoc(doc(db, 'fighters', fighter.userId), {
        bio: bioInput.trim(),
        tag: tagInput.trim().toUpperCase().slice(0, 6),
      });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save. Check your connection.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── FIGHTER CARD ──────────────────────────────────────────── */}
      <View style={[styles.card, styles.heroCard, { borderColor: char.primaryColor + '44' }]}>
        {/* Glow behind icon */}
        <View style={[styles.iconGlow, { backgroundColor: char.glowColor + '22' }]} />
        <Text style={styles.heroIcon}>{char.icon}</Text>

        <View style={styles.heroInfo}>
          {editing ? (
            <View style={styles.editRow}>
              <Text style={styles.tagPrefix}>#</Text>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                maxLength={6}
                autoCapitalize="characters"
                placeholder="TAG"
                placeholderTextColor="#333"
              />
            </View>
          ) : (
            <Text style={styles.heroTag}>#{fighter.tag || 'SET TAG'}</Text>
          )}
          <Text style={[styles.heroName, { color: char.primaryColor }]}>{fighter.name}</Text>
          <Text style={styles.heroChar}>{char.name} — {bodyLabel}</Text>

          {/* Rank badge */}
          {rankInfo && (
            <View style={[styles.rankBadge, { borderColor: rankInfo.color + '44', backgroundColor: rankInfo.color + '11' }]}>
              <Text style={styles.rankBadgeIcon}>{rankInfo.icon}</Text>
              <Text style={[styles.rankBadgeText, { color: rankInfo.color }]}>{rankDisplay}</Text>
              {isStreetTier(rank!.tier) && <Text style={[styles.rankFlair, { color: '#e74c3c' }]}>STREET</Text>}
              {isTechTier(rank!.tier) && <Text style={[styles.rankFlair, { color: '#9b59b6' }]}>TECH</Text>}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => editing ? saveProfile() : setEditing(true)}>
          <Text style={styles.editBtnText}>{editing ? 'SAVE' : 'EDIT'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── MMR PROGRESS BAR ────────────────────────────────────────── */}
      {rankInfo && (
        <View style={styles.mmrBox}>
          <View style={styles.mmrLabelRow}>
            <Text style={styles.mmrLabel}>{rank?.mmr ?? 0} MMR</Text>
            <Text style={[styles.mmrLabel, { color: rankInfo.color }]}>{rankPct}%</Text>
          </View>
          <View style={styles.mmrTrack}>
            <View style={[styles.mmrFill, { width: `${rankPct}%` as any, backgroundColor: rankInfo.color }]} />
          </View>
          <Text style={styles.mmrFlavor}>{rankInfo.flavor}</Text>
        </View>
      )}

      {/* ── BIO ──────────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>BIO</Text>
        {editing ? (
          <TextInput
            style={styles.bioInput}
            value={bioInput}
            onChangeText={setBioInput}
            multiline
            maxLength={120}
            placeholder="Tell them who you are..."
            placeholderTextColor="#333"
          />
        ) : (
          <Text style={styles.bioText}>
            {(fighter as any).bio || 'No bio yet. Tap EDIT to write your story.'}
          </Text>
        )}
      </View>

      {/* ── FIGHT RECORD ─────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>FIGHT RECORD</Text>
        <View style={styles.statsGrid}>
          <StatBox label="WINS" value={String(fighter.wins)} color="#2ecc71" />
          <StatBox label="LOSSES" value={String(fighter.losses)} color="#e74c3c" />
          <StatBox label="WIN RATE" value={totalGames > 0 ? `${winRate}%` : '—'} color={winRate > 55 ? '#e8c84a' : '#888'} />
          <StatBox label="STREAK" value={streak > 0 ? `${streak}🔥` : '0'} color={streak >= 3 ? '#ff9000' : '#555'} />
        </View>
        {/* Win bar */}
        {totalGames > 0 && (
          <View style={styles.winBar}>
            <View style={[styles.winBarFill, { width: `${winRate}%` as any }]} />
            <View style={[styles.lossBarFill, { width: `${100 - winRate}%` as any }]} />
          </View>
        )}
      </View>

      {/* ── REPUTATION ───────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>REPUTATION</Text>
        <Text style={styles.repSubtitle}>What the streets are saying</Text>
        <View style={styles.repGrid}>
          <RepStat icon="💥" label="Knockout Rate" value={`${knockoutRate}%`} />
          <RepStat icon="⚔️" label="Sig. Weapon KOs" value={String(sigWeaponKOs)} />
          <RepStat icon="📈" label="Longest Streak" value={String(longestStreak)} />
          <RepStat icon="🎯" label="Fights Played" value={String(totalGames)} />
        </View>
        {/* Fight style based on rank */}
        {rankInfo && (
          <View style={[styles.styleBox, {
            borderColor: isStreetTier(rank!.tier) ? '#e74c3c33' : isTechTier(rank!.tier) ? '#9b59b633' : '#e8c84a33',
            backgroundColor: isStreetTier(rank!.tier) ? '#e74c3c08' : isTechTier(rank!.tier) ? '#9b59b608' : '#e8c84a08',
          }]}>
            <Text style={[styles.styleLabel, {
              color: isStreetTier(rank!.tier) ? '#e74c3c' : isTechTier(rank!.tier) ? '#9b59b6' : '#e8c84a',
            }]}>FIGHT STYLE</Text>
            <Text style={styles.styleText}>{rankInfo.fightStyle}</Text>
          </View>
        )}
      </View>

      {/* ── BUILD ────────────────────────────────────────────────────── */}
      <View style={[styles.card, { borderColor: variant.color + '33' }]}>
        <Text style={styles.sectionLabel}>CURRENT BUILD</Text>
        <View style={[styles.variantBox, { backgroundColor: variant.color + '11' }]}>
          <Text style={styles.variantIcon}>{variant.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.variantName, { color: variant.color }]}>{variant.name}</Text>
            <Text style={styles.variantDesc}>{variant.subtitle}</Text>
          </View>
        </View>
        {/* Equipped trinkets */}
        {(t1 || t2) && (
          <View style={styles.trinketRow}>
            {[t1, t2].filter(Boolean).map((t, i) => t && (
              <View key={i} style={[styles.trinketPill, { borderColor: TRINKET_RARITY_COLORS[t.rarity] + '55' }]}>
                <Text style={styles.trinketIcon}>{t.icon}</Text>
                <Text style={[styles.trinketName, { color: TRINKET_RARITY_COLORS[t.rarity] }]}>{t.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── TROPHIES ─────────────────────────────────────────────────── */}
      {earned.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TROPHIES  {earned.length}/{(fighter.earnedTrophies ?? []).length}</Text>
          <View style={styles.trophyGrid}>
            {earned.map((t: any) => (
              <View key={t.id} style={styles.trophyItem}>
                <Text style={styles.trophyIcon}>{t.icon}</Text>
                <Text style={styles.trophyName} numberOfLines={1}>{t.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── LEVEL & XP ───────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PROGRESSION</Text>
        <View style={styles.xpRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNum}>{fighter.level}</Text>
            <Text style={styles.levelLabel}>LEVEL</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${Math.min(100, (fighter.xp / (500 * fighter.level)) * 100)}%` as any }]} />
            </View>
            <Text style={styles.xpText}>{fighter.xp} / {500 * fighter.level} XP</Text>
            <Text style={styles.goldText}>💰 {fighter.currency} gold</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statBoxVal, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

function RepStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.repStat}>
      <Text style={styles.repStatIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.repStatLabel}>{label}</Text>
        <Text style={styles.repStatVal}>{value}</Text>
      </View>
    </View>
  );
}

const C = '#080810';
const CARD = '#0e0e18';
const BORDER = '#1a1a28';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C },
  content: { padding: 16, paddingTop: 54, paddingBottom: 50, gap: 12 },

  card: { backgroundColor: CARD, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER },

  // Hero
  heroCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, position: 'relative', overflow: 'hidden' },
  iconGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, top: -20, left: -20 },
  heroIcon: { fontSize: 54 },
  heroInfo: { flex: 1, gap: 4 },
  heroTag: { color: '#444', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroName: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  heroChar: { color: '#555', fontSize: 11 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 4 },
  rankBadgeIcon: { fontSize: 14 },
  rankBadgeText: { fontSize: 12, fontWeight: '800' },
  rankFlair: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  editBtn: { backgroundColor: '#12121a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: BORDER },
  editBtnText: { color: '#e8c84a', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagPrefix: { color: '#444', fontSize: 11 },
  tagInput: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 2, flex: 1, borderBottomWidth: 1, borderBottomColor: '#e8c84a33', paddingVertical: 2 },

  // MMR
  mmrBox: { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, gap: 6 },
  mmrLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mmrLabel: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  mmrTrack: { height: 4, backgroundColor: '#1a1a28', borderRadius: 2, overflow: 'hidden' },
  mmrFill: { height: 4, borderRadius: 2 },
  mmrFlavor: { color: '#333', fontSize: 10, fontStyle: 'italic' },

  // Bio
  sectionLabel: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  bioText: { color: '#666', fontSize: 13, lineHeight: 19 },
  bioInput: { color: '#fff', fontSize: 13, lineHeight: 19, borderWidth: 1, borderColor: '#e8c84a22', borderRadius: 10, padding: 10, minHeight: 70 },

  // Record
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statBox: { flex: 1, backgroundColor: '#12121a', borderRadius: 10, padding: 10, alignItems: 'center' },
  statBoxVal: { fontSize: 18, fontWeight: '900' },
  statBoxLabel: { color: '#333', fontSize: 8, letterSpacing: 1, marginTop: 2 },
  winBar: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden' },
  winBarFill: { backgroundColor: '#2ecc71', height: 4 },
  lossBarFill: { backgroundColor: '#e74c3c', height: 4 },

  // Reputation
  repSubtitle: { color: '#2a2a3a', fontSize: 10, fontStyle: 'italic', marginBottom: 10, marginTop: -6 },
  repGrid: { gap: 10, marginBottom: 12 },
  repStat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  repStatIcon: { fontSize: 18, width: 26 },
  repStatLabel: { color: '#444', fontSize: 10 },
  repStatVal: { color: '#fff', fontSize: 15, fontWeight: '900' },
  styleBox: { borderRadius: 10, borderWidth: 1, padding: 10 },
  styleLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  styleText: { color: '#666', fontSize: 11 },

  // Build
  variantBox: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, padding: 12, marginBottom: 10 },
  variantIcon: { fontSize: 28 },
  variantName: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  variantDesc: { color: '#555', fontSize: 10, marginTop: 2 },
  trinketRow: { flexDirection: 'row', gap: 8 },
  trinketPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#12121a' },
  trinketIcon: { fontSize: 14 },
  trinketName: { fontSize: 10, fontWeight: '800' },

  // Trophies
  trophyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trophyItem: { alignItems: 'center', width: 52 },
  trophyIcon: { fontSize: 24 },
  trophyName: { color: '#444', fontSize: 8, textAlign: 'center', marginTop: 2 },

  // XP
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: { backgroundColor: '#e8c84a11', borderRadius: 12, width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8c84a33' },
  levelNum: { color: '#e8c84a', fontSize: 22, fontWeight: '900' },
  levelLabel: { color: '#e8c84a88', fontSize: 7, letterSpacing: 1 },
  xpTrack: { height: 4, backgroundColor: '#1a1a28', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: 4, borderRadius: 2, backgroundColor: '#4a9eff' },
  xpText: { color: '#444', fontSize: 10 },
  goldText: { color: '#e8c84a88', fontSize: 10, marginTop: 2 },
});
