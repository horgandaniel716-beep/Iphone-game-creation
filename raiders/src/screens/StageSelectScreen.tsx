import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { STAGES } from '../game/arenaHtml';
import type { StageId } from '../game/arenaHtml';
import { useGameStore } from '../store/gameStore';

const STAGE_DETAILS: Partial<Record<StageId, { vibe: string; hazard: string; bgColor: string; accentColor: string; borderColor: string; lines: string[] }>> = {
  wheat_field: {
    vibe: '🌾 SCRAPPY & RAW',
    hazard: 'Open space — nowhere to hide. Crowd watches from the fence.',
    bgColor: '#1a1000',
    accentColor: '#d4a85e',
    borderColor: '#8b7355',
    lines: ['Open dirt field', 'Someone\'s uncle filming on his phone', 'No rules, no ref'],
  },
  back_alley: {
    vibe: '🧱 GRIMY & HOSTILE',
    hazard: 'Bystanders. Chain-link fence. Nowhere to run.',
    bgColor: '#0a0a14',
    accentColor: '#ff8800',
    borderColor: '#3a3a6a',
    lines: ['Brick walls, bad lighting', 'Crowd paid cash', 'Word got around'],
  },
  warehouse: {
    vibe: '🏭 INDUSTRIAL HEAT',
    hazard: 'Flickering lights — hard to read your opponent.',
    bgColor: '#0d0d0d',
    accentColor: '#ffaa00',
    borderColor: '#444444',
    lines: ['Concrete floors', 'Underground circuit', 'No footage'],
  },
  underground: {
    vibe: '🌑 INVITE ONLY',
    hazard: 'Purple laser grid disrupts your rhythm.',
    bgColor: '#08080f',
    accentColor: '#6622ff',
    borderColor: '#3a1a6e',
    lines: ['Graffiti walls', 'High stakes', 'No footage, ever'],
  },
  stadium: {
    vibe: '🏟️ THE MAIN STAGE',
    hazard: 'Twenty thousand watching. The pressure is real.',
    bgColor: '#070715',
    accentColor: '#4488ff',
    borderColor: '#3333aa',
    lines: ['Jumbo screens', 'Professional lighting', 'You made it here'],
  },
  colosseum: {
    vibe: '🏛️ ANCIENT GLORY',
    hazard: 'The sand is slippery. Footing matters.',
    bgColor: '#0a0a1a',
    accentColor: '#e8c84a',
    borderColor: '#4a3a2a',
    lines: ['Ancient stone', 'Torchlight', 'Emperors fell here'],
  },
  skyscraper: {
    vibe: '🌆 HIGH ALTITUDE',
    hazard: 'Rain-slick floors. Neon blinds at close range.',
    bgColor: '#020210',
    accentColor: '#ff00aa',
    borderColor: '#1a1a2a',
    lines: ['Top floor', 'Whole city beneath you', 'The world is watching'],
  },
  void_throne: {
    vibe: '🌀 TRANSCENDENT',
    hazard: 'Dimensional tears deal passive damage near edges.',
    bgColor: '#000000',
    accentColor: '#8800ff',
    borderColor: '#4400aa',
    lines: ['No ground', 'No sky', 'Only legends fight here'],
  },
  favelas: {
    vibe: '🌡️ HOT & DIRTY',
    hazard: 'Chain-link walls close in the further you get pushed',
    bgColor: '#1a0a00',
    accentColor: '#e67e22',
    borderColor: '#8b4513',
    lines: ['Dense concrete jungle', 'Hostile crowd', 'Jungle cage wire'],
  },
  sakura: {
    vibe: '🌙 DARK & SERENE',
    hazard: 'Falling petals reduce visibility at low HP',
    bgColor: '#080515',
    accentColor: '#ff69b4',
    borderColor: '#6e3d8e',
    lines: ['Ancient stone court', 'Cherry blossoms in bloom', 'Moonlit mist'],
  },
  death_pit: {
    vibe: '💀 INSTANT DEATH',
    hazard: 'Fall off the platform and you die instantly',
    bgColor: '#0d0000',
    accentColor: '#ff2200',
    borderColor: '#660000',
    lines: ['Molten lava below', 'No ring-out — only falling', 'Narrowest arena'],
  },
};

interface StageSelectScreenProps {
  onSelect: (stageId: StageId) => void;
}

export default function StageSelectScreen({ onSelect }: StageSelectScreenProps) {
  const [selected, setSelected] = useState<StageId>('wheat_field');

  const stage    = STAGES.find((s) => s.id === selected)!;
  const detail   = STAGE_DETAILS[selected] ?? STAGE_DETAILS['wheat_field']!;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SELECT STAGE</Text>
      <Text style={styles.subtitle}>Each arena has unique hazards. Choose wisely.</Text>

      {/* Stage tabs */}
      <View style={styles.tabs}>
        {STAGES.map((s) => {
          const d = STAGE_DETAILS[s.id as StageId] ?? STAGE_DETAILS['wheat_field']!;
          const isActive = selected === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.tab,
                isActive && { borderColor: d.accentColor, backgroundColor: d.bgColor },
              ]}
              onPress={() => setSelected(s.id as StageId)}
            >
              <Text style={styles.tabIcon}>{s.icon}</Text>
              <Text style={[styles.tabName, isActive && { color: d.accentColor }]}>
                {s.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stage detail card */}
      <View style={[styles.detailCard, { borderColor: detail.borderColor, backgroundColor: detail.bgColor + 'cc' }]}>
        <View style={styles.detailHeader}>
          <Text style={styles.stageIcon}>{stage.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stageName, { color: detail.accentColor }]}>{stage.name}</Text>
            <Text style={styles.stageLocation}>{stage.location}</Text>
          </View>
          <View style={[styles.vibePill, { backgroundColor: detail.accentColor + '22' }]}>
            <Text style={[styles.vibeText, { color: detail.accentColor }]}>{detail.vibe}</Text>
          </View>
        </View>

        <Text style={styles.stageDesc}>{stage.description}</Text>

        <View style={styles.featureList}>
          {detail.lines.map((line, i) => (
            <Text key={i} style={[styles.featureLine, { color: detail.accentColor + 'cc' }]}>
              ◆ {line}
            </Text>
          ))}
        </View>

        <View style={[styles.hazardBox, { borderColor: '#e74c3c44', backgroundColor: '#1a000022' }]}>
          <Text style={styles.hazardLabel}>⚠️ STAGE HAZARD</Text>
          <Text style={styles.hazardText}>{detail.hazard}</Text>
        </View>
      </View>

      {/* Artifact reminder */}
      <View style={styles.artifactHint}>
        <Text style={styles.artifactTitle}>⬇️ ARTIFACTS DROP DURING BATTLE</Text>
        <View style={styles.artifactRow}>
          <ArtifactPill icon="💊" label="HEAL" color="#2ecc71" desc="+40 HP" />
          <ArtifactPill icon="🛡" label="SHIELD" color="#4a9eff" desc="Shield boost" />
          <ArtifactPill icon="⚡" label="POWER" color="#e8c84a" desc="+50% ATK" />
          <ArtifactPill icon="💨" label="SPEED" color="#ce93d8" desc="+40% SPD" />
        </View>
        <Text style={styles.artifactWarning}>
          Run to grab them — but you're exposed to attack while doing it.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: detail.accentColor }]}
        onPress={() => onSelect(selected)}
      >
        <Text style={styles.confirmText}>FIGHT HERE</Text>
      </TouchableOpacity>
    </View>
  );
}

function ArtifactPill({ icon, label, color, desc }: {
  icon: string; label: string; color: string; desc: string;
}) {
  return (
    <View style={[styles.artPill, { borderColor: color + '44' }]}>
      <Text style={styles.artIcon}>{icon}</Text>
      <Text style={[styles.artLabel, { color }]}>{label}</Text>
      <Text style={styles.artDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    color: '#e8c84a',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  subtitle: { color: '#444', fontSize: 11, textAlign: 'center', marginBottom: 20 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    backgroundColor: '#12121a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  tabIcon: { fontSize: 24, marginBottom: 4 },
  tabName: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  detailCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  stageIcon: { fontSize: 36 },
  stageName: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  stageLocation: { color: '#555', fontSize: 11, marginTop: 2 },
  vibePill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  vibeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  stageDesc: { color: '#777', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  featureList: { gap: 4, marginBottom: 12 },
  featureLine: { fontSize: 12 },
  hazardBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  hazardLabel: { color: '#e74c3c', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  hazardText: { color: '#888', fontSize: 12 },
  artifactHint: {
    backgroundColor: '#12121a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  artifactTitle: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  artifactRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  artPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  artIcon: { fontSize: 18, marginBottom: 2 },
  artLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  artDesc: { color: '#555', fontSize: 9 },
  artifactWarning: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 20, letterSpacing: 4 },
});
