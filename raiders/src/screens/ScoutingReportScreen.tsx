import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { getCharacter } from '../lib/characters';
import { getRankDisplayString, getRankInfo, isStreetTier, isTechTier } from '../lib/ranking';
import { detectBuildVariant, MOVE_TYPE_MAP, MOVE_TYPES } from '../lib/moveTypes';
import type { Fighter } from '../types';

interface Props {
  player: Fighter;
  opponent: Fighter;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ScoutingReportScreen({ player, opponent, onConfirm, onBack }: Props) {
  const [scanning, setScanning] = useState(true);

  const pChar = getCharacter(player.selectedCharacter);
  const oChar = getCharacter(opponent.selectedCharacter);
  const oRank = opponent.rank;
  const oRankInfo = oRank ? getRankInfo(oRank.tier) : null;
  const oRankDisplay = oRank ? getRankDisplayString(oRank) : '🩸 Scrapper 4';
  const oVariant = detectBuildVariant(opponent.unlockedMoves ?? [], opponent.wins);
  const pVariant = detectBuildVariant(player.unlockedMoves ?? [], player.wins);

  const totalGames = opponent.wins + opponent.losses;
  const winRate = totalGames > 0 ? Math.round((opponent.wins / totalGames) * 100) : 0;
  const streak = opponent.wins > 5 ? `${Math.min(opponent.wins, 12)}-WIN STREAK` : null;
  const isFlawless = opponent.wins > 0 && opponent.losses === 0;
  const isFamous = opponent.wins >= 10;

  // Detect opponent move types
  const oppMoveTypes = [...new Set(
    (opponent.unlockedMoves ?? []).map((id) => MOVE_TYPE_MAP[id]).filter(Boolean)
  )].slice(0, 4);

  // Counter advice
  const counterAdvice: string[] = [];
  if (oChar.archetype === 'rushdown') counterAdvice.push('Play footsies — they want to rush in');
  if (oChar.archetype === 'zoner') counterAdvice.push('Jump in — close the distance fast');
  if (oChar.archetype === 'tank') counterAdvice.push('Hit and move — don\'t trade');
  if (oChar.archetype === 'assassin') counterAdvice.push('Block low — they go for ankles');
  if (oChar.archetype === 'trickster') counterAdvice.push('Be patient — they bait reactions');
  if (opponent.level > player.level + 3) counterAdvice.push('You\'re the underdog — play it safe early');
  if (opponent.level < player.level - 3) counterAdvice.push('You\'re the favorite — apply pressure');
  if (winRate > 65) counterAdvice.push('High win rate — expect optimal play');
  if (winRate < 40) counterAdvice.push('Low win rate — exploit hesitation');

  useEffect(() => {
    const t = setTimeout(() => setScanning(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (scanning) {
    return (
      <View style={styles.scanScreen}>
        <ActivityIndicator size="large" color="#e8c84a" />
        <Text style={styles.scanTitle}>SCOUTING OPPONENT</Text>
        <Text style={styles.scanSub}>Analyzing {opponent.name}...</Text>
        <View style={styles.scanLines}>
          {['Checking fight record...', 'Analyzing move set...', 'Detecting build variant...', 'Calculating matchup...'].map((line, i) => (
            <Text key={i} style={[styles.scanLine, { opacity: 0.3 + i * 0.2 }]}>{line}</Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>← BACK</Text></TouchableOpacity>
        <Text style={styles.title}>SCOUTING REPORT</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── VS BANNER ──────────────────────────────────────── */}
      <View style={styles.vsBanner}>
        <View style={styles.vsCard}>
          <Text style={styles.vsIcon}>{pChar.icon}</Text>
          <Text style={[styles.vsName, { color: pChar.primaryColor }]}>{player.name}</Text>
          <View style={[styles.variantTag, { backgroundColor: pVariant.color + '22', borderColor: pVariant.color + '44' }]}>
            <Text style={[styles.variantTagText, { color: pVariant.color }]}>{pVariant.icon} {pVariant.name}</Text>
          </View>
        </View>
        <Text style={styles.vsText}>VS</Text>
        <View style={styles.vsCard}>
          <Text style={styles.vsIcon}>{oChar.icon}</Text>
          <Text style={[styles.vsName, { color: oChar.primaryColor }]}>{opponent.name}</Text>
          <View style={[styles.variantTag, { backgroundColor: oVariant.color + '22', borderColor: oVariant.color + '44' }]}>
            <Text style={[styles.variantTagText, { color: oVariant.color }]}>{oVariant.icon} {oVariant.name}</Text>
          </View>
        </View>
      </View>

      {/* ── THREAT FLAGS ───────────────────────────────────── */}
      <View style={styles.flagsRow}>
        {isFamous && <View style={[styles.flag, { backgroundColor: '#ff440022', borderColor: '#ff440044' }]}><Text style={[styles.flagText, { color: '#ff4400' }]}>🔥 KNOWN FIGHTER</Text></View>}
        {isFlawless && <View style={[styles.flag, { backgroundColor: '#e8c84a22', borderColor: '#e8c84a44' }]}><Text style={[styles.flagText, { color: '#e8c84a' }]}>⚡ UNDEFEATED</Text></View>}
        {streak && <View style={[styles.flag, { backgroundColor: '#2ecc7122', borderColor: '#2ecc7144' }]}><Text style={[styles.flagText, { color: '#2ecc71' }]}>📈 {streak}</Text></View>}
        {opponent.level > player.level + 2 && <View style={[styles.flag, { backgroundColor: '#e74c3c22', borderColor: '#e74c3c44' }]}><Text style={[styles.flagText, { color: '#e74c3c' }]}>⚠️ LEVEL UP</Text></View>}
      </View>

      {/* ── OPPONENT RANK ──────────────────────────────────── */}
      {oRankInfo && (
        <View style={[styles.section, { borderColor: oRankInfo.color + '33' }]}>
          <Text style={styles.sectionTitle}>RANK</Text>
          <View style={styles.rankRow}>
            <Text style={styles.rankIcon}>{oRankInfo.icon}</Text>
            <Text style={[styles.rankDisplay, { color: oRankInfo.color }]}>{oRankDisplay}</Text>
            <Text style={[styles.mmrText, { color: oRankInfo.color }]}>{oRank?.mmr ?? 0} MMR</Text>
          </View>
          <Text style={styles.rankFlavor}>{oRankInfo.flavor}</Text>
          <View style={[styles.fightStylePill, {
            backgroundColor: oRank && isStreetTier(oRank.tier) ? '#e74c3c11' : oRank && isTechTier(oRank.tier) ? '#9b59b611' : '#e8c84a11',
            borderColor: oRank && isStreetTier(oRank.tier) ? '#e74c3c33' : oRank && isTechTier(oRank.tier) ? '#9b59b633' : '#e8c84a33',
          }]}>
            <Text style={[styles.fightStyleText, {
              color: oRank && isStreetTier(oRank.tier) ? '#e74c3c' : oRank && isTechTier(oRank.tier) ? '#b44aff' : '#e8c84a',
            }]}>
              {oRank && isStreetTier(oRank.tier) ? '🔥 STREET FIGHTER' : oRank && isTechTier(oRank.tier) ? '🔬 TECHNICIAN' : '⚡ RISING THREAT'}
            </Text>
            <Text style={styles.fightStyleDesc}>{oRankInfo.fightStyle}</Text>
          </View>
        </View>
      )}

      {/* ── FIGHT STATS ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FIGHT RECORD</Text>
        <View style={styles.recordRow}>
          <StatBlock label="WINS" value={String(opponent.wins)} color="#2ecc71" />
          <StatBlock label="LOSSES" value={String(opponent.losses)} color="#e74c3c" />
          <StatBlock label="WIN RATE" value={totalGames > 0 ? `${winRate}%` : '--'} color={winRate > 55 ? '#e8c84a' : '#888'} />
          <StatBlock label="LEVEL" value={String(opponent.level)} color="#4a9eff" />
        </View>
      </View>

      {/* ── CHARACTER ──────────────────────────────────────── */}
      <View style={[styles.section, { borderColor: oChar.primaryColor + '22' }]}>
        <Text style={styles.sectionTitle}>CHARACTER</Text>
        <View style={styles.charRow}>
          <Text style={styles.charIcon}>{oChar.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.charName, { color: oChar.primaryColor }]}>{oChar.name}</Text>
            <Text style={styles.charSub}>{oChar.subtitle}</Text>
            <Text style={[styles.archetype, { color: oChar.accentColor }]}>{oChar.archetype.toUpperCase()} ARCHETYPE</Text>
          </View>
        </View>
        <View style={styles.baseStats}>
          <MiniStat label="HP" value={oChar.stats.health} max={300} color="#e74c3c" />
          <MiniStat label="ATK" value={oChar.stats.attack} max={100} color="#e8c84a" />
          <MiniStat label="DEF" value={oChar.stats.defense} max={100} color="#4a9eff" />
          <MiniStat label="SPD" value={oChar.stats.speed} max={150} color="#2ecc71" />
        </View>
        <View style={styles.signatureBox}>
          <Text style={[styles.sigName, { color: oChar.accentColor }]}>✦ {oChar.specialName}</Text>
          <Text style={styles.sigDesc}>{oChar.specialDesc}</Text>
          <Text style={[styles.sigName, { color: '#ff4400', marginTop: 6 }]}>★ {oChar.superName}</Text>
          <Text style={styles.sigDesc}>{oChar.superDesc}</Text>
        </View>
      </View>

      {/* ── BUILD VARIANT ──────────────────────────────────── */}
      <View style={[styles.section, { borderColor: oVariant.color + '33' }]}>
        <Text style={styles.sectionTitle}>BUILD VARIANT</Text>
        <View style={[styles.variantBox, { backgroundColor: oVariant.color + '11', borderColor: oVariant.color + '33' }]}>
          <Text style={styles.variantIcon}>{oVariant.icon}</Text>
          <View>
            <Text style={[styles.variantName, { color: oVariant.color }]}>{oVariant.name}</Text>
            <Text style={styles.variantDesc}>{oVariant.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* ── MOVE TYPES ─────────────────────────────────────── */}
      {oppMoveTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KNOWN MOVE TYPES</Text>
          <View style={styles.typesRow}>
            {oppMoveTypes.map((type) => {
              const info = MOVE_TYPES[type];
              return (
                <View key={type} style={[styles.typePill, { backgroundColor: info.color + '22', borderColor: info.color + '44' }]}>
                  <Text style={styles.typeIcon}>{info.icon}</Text>
                  <Text style={[styles.typeLabel, { color: info.color }]}>{info.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── COUNTER INTEL ──────────────────────────────────── */}
      {counterAdvice.length > 0 && (
        <View style={[styles.section, { borderColor: '#e8c84a22' }]}>
          <Text style={styles.sectionTitle}>COUNTER INTEL</Text>
          {counterAdvice.slice(0, 3).map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>›</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── FIGHT BUTTON ───────────────────────────────────── */}
      <TouchableOpacity style={[styles.fightBtn, { backgroundColor: pChar.primaryColor }]} onPress={onConfirm}>
        <Text style={styles.fightBtnText}>ENTER ARENA</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statBlockVal, { color }]}>{value}</Text>
      <Text style={styles.statBlockLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <View style={styles.miniStatRow}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <View style={styles.miniStatBg}>
        <View style={[styles.miniStatFill, { width: `${Math.min(100, (value / max) * 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.miniStatVal, { color }]}>{value}</Text>
    </View>
  );
}

const C = '#080810';
const BORDER = '#1a1a28';

const styles = StyleSheet.create({
  // Scan animation
  scanScreen: { flex: 1, backgroundColor: C, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scanTitle: { color: '#e8c84a', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  scanSub: { color: '#444', fontSize: 12 },
  scanLines: { gap: 6, marginTop: 16 },
  scanLine: { color: '#4a9eff', fontSize: 11, fontFamily: 'monospace' },

  // Main
  container: { flex: 1, backgroundColor: C },
  content: { padding: 18, paddingBottom: 50, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  back: { color: '#555', fontSize: 13 },
  title: { color: '#e8c84a', fontSize: 14, fontWeight: '900', letterSpacing: 3 },

  // VS
  vsBanner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vsCard: { flex: 1, backgroundColor: '#0e0e18', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  vsIcon: { fontSize: 40, marginBottom: 6 },
  vsName: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  variantTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  variantTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  vsText: { color: '#e8c84a', fontSize: 20, fontWeight: '900' },

  // Flags
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  flagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Section
  section: { backgroundColor: '#0e0e18', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  sectionTitle: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 10 },

  // Rank
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankIcon: { fontSize: 26 },
  rankDisplay: { flex: 1, fontSize: 18, fontWeight: '900' },
  mmrText: { fontSize: 16, fontWeight: '800' },

  // Record
  recordRow: { flexDirection: 'row', gap: 8 },
  statBlock: { flex: 1, backgroundColor: '#12121a', borderRadius: 10, padding: 10, alignItems: 'center' },
  statBlockVal: { fontSize: 18, fontWeight: '900' },
  statBlockLabel: { color: '#333', fontSize: 8, letterSpacing: 1, marginTop: 2 },

  // Character
  charRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  charIcon: { fontSize: 40 },
  charName: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  charSub: { color: '#555', fontSize: 11, marginTop: 2 },
  archetype: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  baseStats: { gap: 8, marginBottom: 12 },
  miniStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniStatLabel: { color: '#444', fontSize: 10, fontWeight: '700', width: 28 },
  miniStatBg: { flex: 1, height: 4, backgroundColor: '#1a1a28', borderRadius: 2 },
  miniStatFill: { height: 4, borderRadius: 2 },
  miniStatVal: { fontSize: 10, fontWeight: '700', width: 28, textAlign: 'right' },
  signatureBox: { backgroundColor: '#12121a', borderRadius: 10, padding: 10 },
  sigName: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  sigDesc: { color: '#555', fontSize: 11, marginTop: 2 },

  // Variant
  variantBox: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  variantIcon: { fontSize: 32 },
  variantName: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  variantDesc: { color: '#555', fontSize: 11, marginTop: 2 },

  // Types
  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  typeIcon: { fontSize: 14 },
  typeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Rank flavor
  rankFlavor: { color: '#555', fontSize: 11, fontStyle: 'italic', marginTop: 6, marginBottom: 8 },
  fightStylePill: { borderRadius: 8, borderWidth: 1, padding: 10 },
  fightStyleText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  fightStyleDesc: { color: '#555', fontSize: 11 },

  // Counter intel
  tipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  tipBullet: { color: '#e8c84a', fontSize: 14, fontWeight: '900' },
  tipText: { color: '#666', fontSize: 12, flex: 1, lineHeight: 17 },

  // Fight button
  fightBtn: { borderRadius: 14, paddingVertical: 20, alignItems: 'center', marginTop: 8 },
  fightBtnText: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 5 },
});
