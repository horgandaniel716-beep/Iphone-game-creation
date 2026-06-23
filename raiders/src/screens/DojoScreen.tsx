import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

// ── DOJO CUSTOMIZATION OPTIONS ──────────────────────────────────────────────

export interface DojoConfig {
  name: string;
  theme: string;
  floor: string;
  walls: string;
  lighting: string;
  banner: string;
  motto: string;
  emblem: string;
  music: string;
}

const DOJO_THEMES = [
  { id: 'underground',  label: 'UNDERGROUND',  icon: '🕳️',  desc: 'Concrete pit. No rules.',        cost: 0     },
  { id: 'neon_temple',  label: 'NEON TEMPLE',  icon: '🌆',  desc: 'Cyberpunk shrine. Neon prayers.', cost: 500   },
  { id: 'blood_dojo',   label: 'BLOOD DOJO',   icon: '🩸',  desc: 'For those who never stop.',       cost: 800   },
  { id: 'void_sanctum', label: 'VOID SANCTUM', icon: '🌌',  desc: 'Exists between dimensions.',      cost: 1500  },
  { id: 'forest_shrine',label: 'FOREST SHRINE',icon: '🌿',  desc: 'Ancient. Quiet. Dangerous.',      cost: 600   },
  { id: 'death_palace', label: 'DEATH PALACE', icon: '💀',  desc: 'Built on bones. Literally.',      cost: 2000  },
  { id: 'cloud_temple', label: 'CLOUD TEMPLE', icon: '☁️',  desc: 'High above. Gods train here.',    cost: 1200  },
  { id: 'fire_forge',   label: 'FIRE FORGE',   icon: '🔥',  desc: 'Heat that breaks weak iron.',     cost: 700   },
];

const DOJO_FLOORS = [
  { id: 'cracked_concrete', label: 'CRACKED CONCRETE', icon: '🪨', cost: 0    },
  { id: 'black_marble',     label: 'BLACK MARBLE',     icon: '⬛', cost: 300  },
  { id: 'tatami',           label: 'TATAMI MATS',      icon: '🟫', cost: 200  },
  { id: 'lava_stone',       label: 'LAVA STONE',       icon: '🌋', cost: 500  },
  { id: 'void_tiles',       label: 'VOID TILES',       icon: '🌑', cost: 800  },
  { id: 'gold_marble',      label: 'GOLD MARBLE',      icon: '🟡', cost: 1200 },
  { id: 'blood_stained',    label: 'BLOOD STAINED',    icon: '🔴', cost: 600  },
  { id: 'sakura_wood',      label: 'SAKURA WOOD',      icon: '🌸', cost: 400  },
];

const DOJO_WALLS = [
  { id: 'brick',          label: 'BRICK',           icon: '🧱', cost: 0    },
  { id: 'mirror',         label: 'MIRROR GLASS',    icon: '🪞', cost: 500  },
  { id: 'rune_stone',     label: 'RUNE STONE',      icon: '🔯', cost: 700  },
  { id: 'neon_panel',     label: 'NEON PANELS',     icon: '💡', cost: 600  },
  { id: 'vine_wall',      label: 'LIVING VINES',    icon: '🌿', cost: 400  },
  { id: 'obsidian',       label: 'OBSIDIAN',        icon: '⬛', cost: 900  },
  { id: 'plasma',         label: 'PLASMA FIELD',    icon: '⚡', cost: 1500 },
  { id: 'trophy_wall',    label: 'TROPHY WALL',     icon: '🏆', cost: 1000 },
];

const DOJO_LIGHTING = [
  { id: 'torches',      label: 'TORCHES',        icon: '🔦', color: '#ff8800', cost: 0    },
  { id: 'neon_red',     label: 'NEON RED',       icon: '🔴', color: '#ff2244', cost: 300  },
  { id: 'neon_blue',    label: 'NEON BLUE',      icon: '🔵', color: '#2244ff', cost: 300  },
  { id: 'neon_purple',  label: 'NEON PURPLE',    icon: '🟣', color: '#aa22ff', cost: 300  },
  { id: 'moonlight',    label: 'MOONLIGHT',      icon: '🌙', color: '#8899ff', cost: 500  },
  { id: 'void_dark',    label: 'VOID DARK',      icon: '🌑', color: '#220033', cost: 800  },
  { id: 'golden',       label: 'GOLDEN BEAMS',   icon: '✨', color: '#ffcc00', cost: 1000 },
  { id: 'blood_red',    label: 'BLOOD RED',      icon: '🩸', color: '#aa0000', cost: 600  },
];

const DOJO_BANNERS = [
  { id: 'fist',       label: 'IRON FIST',      icon: '✊', cost: 0    },
  { id: 'skull',      label: 'DEATH MARK',     icon: '💀', cost: 200  },
  { id: 'dragon',     label: 'DRAGON',         icon: '🐉', cost: 500  },
  { id: 'eye',        label: 'ALL-SEEING EYE', icon: '👁️', cost: 700  },
  { id: 'crown',      label: 'THE CROWN',      icon: '👑', cost: 1000 },
  { id: 'fire',       label: 'ETERNAL FLAME',  icon: '🔥', cost: 400  },
  { id: 'void',       label: 'THE VOID',       icon: '🌌', cost: 900  },
  { id: 'lightning',  label: 'THUNDER MARK',   icon: '⚡', cost: 600  },
];

const DOJO_MUSIC = [
  { id: 'silence',      label: 'SILENCE',          icon: '🔇', desc: 'Just the sound of hits', cost: 0    },
  { id: 'trap_808',     label: 'TRAP 808s',         icon: '🎵', desc: 'Hard bass, heavy kicks',  cost: 200  },
  { id: 'metal',        label: 'METAL',             icon: '🎸', desc: 'Shred everything',        cost: 200  },
  { id: 'ancient_drum', label: 'WAR DRUMS',         icon: '🥁', desc: 'Tribal. Primal.',         cost: 300  },
  { id: 'synthwave',    label: 'SYNTHWAVE',         icon: '🌆', desc: 'Neon night vibes',        cost: 400  },
  { id: 'lo_fi',        label: 'LO-FI BEATS',      icon: '🎧', desc: 'Chill but still deadly',  cost: 200  },
  { id: 'void_hum',     label: 'VOID HUM',          icon: '🌑', desc: 'Something\'s wrong here', cost: 600  },
  { id: 'orchestral',   label: 'WAR ORCHESTRAL',   icon: '🎼', desc: 'Epic. Cinematic. Final.',  cost: 800  },
];

const DOJO_EMBLEMS = ['⚔️','🔥','💀','👁️','⚡','🌑','🐉','👑','🩸','☠️','🌀','🪬','🗡️','🛡️','🔮','🦅','🐺','🦁','🐍','🌊'];

type Section = 'overview' | 'theme' | 'floor' | 'walls' | 'lighting' | 'banner' | 'emblem' | 'music' | 'motto';

const DEFAULT_DOJO: DojoConfig = {
  name: 'THE DOJO',
  theme: 'underground',
  floor: 'cracked_concrete',
  walls: 'brick',
  lighting: 'torches',
  banner: 'fist',
  motto: 'Hit first. Hit last.',
  emblem: '⚔️',
  music: 'silence',
};

export default function DojoScreen() {
  const { fighter } = useGameStore();
  const [dojo, setDojo] = useState<DojoConfig>((fighter as any)?.dojo ?? DEFAULT_DOJO);
  const [section, setSection] = useState<Section>('overview');
  const [nameInput, setNameInput] = useState(dojo.name);
  const [mottoInput, setMottoInput] = useState(dojo.motto);
  const [saving, setSaving] = useState(false);

  const theme     = DOJO_THEMES.find((x) => x.id === dojo.theme) ?? DOJO_THEMES[0];
  const floor     = DOJO_FLOORS.find((x) => x.id === dojo.floor) ?? DOJO_FLOORS[0];
  const walls     = DOJO_WALLS.find((x) => x.id === dojo.walls) ?? DOJO_WALLS[0];
  const lighting  = DOJO_LIGHTING.find((x) => x.id === dojo.lighting) ?? DOJO_LIGHTING[0];
  const banner    = DOJO_BANNERS.find((x) => x.id === dojo.banner) ?? DOJO_BANNERS[0];
  const music     = DOJO_MUSIC.find((x) => x.id === dojo.music) ?? DOJO_MUSIC[0];

  async function save(updates: Partial<DojoConfig>) {
    const newDojo = { ...dojo, ...updates };
    setDojo(newDojo);
    setSaving(true);
    try {
      if (fighter && fighter.userId !== 'bot') {
        await updateDoc(doc(db, 'fighters', fighter.userId), { dojo: newDojo });
      }
    } catch {}
    setSaving(false);
  }

  function buy<T extends { id: string; cost: number }>(
    item: T,
    field: keyof DojoConfig
  ) {
    if (!fighter) return;
    if ((dojo as any)[field] === item.id) return;
    if (fighter.currency < item.cost) {
      Alert.alert('Not enough gold', `You need ${item.cost}g for this upgrade.`);
      return;
    }
    Alert.alert(
      'Upgrade Dojo?',
      `Cost: ${item.cost}g`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => save({ [field]: item.id } as Partial<DojoConfig>) },
      ]
    );
  }

  if (section !== 'overview') {
    return (
      <View style={styles.root}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSection('overview')}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>{section.toUpperCase().replace('_', ' ')}</Text>
        <ScrollView contentContainerStyle={styles.optionGrid}>
          {section === 'theme'   && DOJO_THEMES.map((item) => (
            <OptionCard key={item.id} icon={item.icon} label={item.label} desc={item.desc} cost={item.cost}
              active={dojo.theme === item.id} color="#e8c84a" onPress={() => buy(item, 'theme')} />
          ))}
          {section === 'floor'   && DOJO_FLOORS.map((item) => (
            <OptionCard key={item.id} icon={item.icon} label={item.label} cost={item.cost}
              active={dojo.floor === item.id} color="#8d6e63" onPress={() => buy(item, 'floor')} />
          ))}
          {section === 'walls'   && DOJO_WALLS.map((item) => (
            <OptionCard key={item.id} icon={item.icon} label={item.label} cost={item.cost}
              active={dojo.walls === item.id} color="#78909c" onPress={() => buy(item, 'walls')} />
          ))}
          {section === 'lighting' && DOJO_LIGHTING.map((item) => (
            <OptionCard key={item.id} icon={item.icon} label={item.label} cost={item.cost}
              active={dojo.lighting === item.id} color={item.color} onPress={() => buy(item, 'lighting')} />
          ))}
          {section === 'banner'  && DOJO_BANNERS.map((item) => (
            <OptionCard key={item.id} icon={item.icon} label={item.label} cost={item.cost}
              active={dojo.banner === item.id} color="#e74c3c" onPress={() => buy(item, 'banner')} />
          ))}
          {section === 'music'   && DOJO_MUSIC.map((item) => (
            <OptionCard key={item.id} icon={item.icon} label={item.label} desc={item.desc} cost={item.cost}
              active={dojo.music === item.id} color="#4a9eff" onPress={() => buy(item, 'music')} />
          ))}
          {section === 'emblem' && (
            <View style={styles.emblemGrid}>
              {DOJO_EMBLEMS.map((em) => (
                <TouchableOpacity
                  key={em}
                  style={[styles.emblemBtn, dojo.emblem === em && styles.emblemBtnActive]}
                  onPress={() => save({ emblem: em })}
                >
                  <Text style={styles.emblemIcon}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {section === 'motto' && (
            <View style={styles.mottoSection}>
              <Text style={styles.mottoLabel}>DOJO NAME</Text>
              <TextInput
                style={styles.mottoInput}
                value={nameInput}
                onChangeText={setNameInput}
                maxLength={24}
                placeholder="THE DOJO"
                placeholderTextColor="#333"
              />
              <Text style={styles.mottoLabel}>MOTTO</Text>
              <TextInput
                style={[styles.mottoInput, { height: 80, textAlignVertical: 'top' }]}
                value={mottoInput}
                onChangeText={setMottoInput}
                maxLength={64}
                multiline
                placeholder="Hit first. Hit last."
                placeholderTextColor="#333"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  save({ name: nameInput.trim() || 'THE DOJO', motto: mottoInput.trim() || '' });
                  setSection('overview');
                }}
              >
                <Text style={styles.saveBtnText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── OVERVIEW ──────────────────────────────────────────────────────────────────
  const lightColor = DOJO_LIGHTING.find((x) => x.id === dojo.lighting)?.color ?? '#ff8800';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.overviewContent}>
      {/* Dojo preview card */}
      <View style={[styles.dojoPreview, { borderColor: lightColor + '88', shadowColor: lightColor }]}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewEmblem}>{dojo.emblem}</Text>
          <Text style={[styles.bannerIcon]}>{banner.icon}</Text>
        </View>
        <Text style={[styles.dojoName, { color: lightColor }]}>{dojo.name}</Text>
        <Text style={styles.dojoMotto}>"{dojo.motto}"</Text>
        <View style={styles.dojoAtmRow}>
          <Text style={styles.dojoAtmChip}>{theme.icon} {theme.label}</Text>
          <Text style={styles.dojoAtmChip}>{music.icon} {music.label}</Text>
          <Text style={styles.dojoAtmChip}>{lighting.icon} {lighting.label}</Text>
        </View>
        <View style={styles.dojoMaterialRow}>
          <Text style={styles.dojoMatChip}>{floor.icon} {floor.label}</Text>
          <Text style={styles.dojoMatChip}>{walls.icon} {walls.label}</Text>
        </View>
        {saving && <Text style={styles.saving}>Saving...</Text>}
      </View>

      {/* Customize sections */}
      <Text style={styles.customizeLabel}>CUSTOMIZE YOUR DOJO</Text>

      <View style={styles.menuGrid}>
        <MenuTile icon="🎨" label="THEME"    sub={theme.label}    color="#e8c84a" onPress={() => setSection('theme')}    />
        <MenuTile icon="🪨" label="FLOOR"    sub={floor.label}    color="#8d6e63" onPress={() => setSection('floor')}    />
        <MenuTile icon="🧱" label="WALLS"    sub={walls.label}    color="#78909c" onPress={() => setSection('walls')}    />
        <MenuTile icon="💡" label="LIGHTING" sub={lighting.label} color={lightColor} onPress={() => setSection('lighting')} />
        <MenuTile icon="🚩" label="BANNER"   sub={banner.label}   color="#e74c3c" onPress={() => setSection('banner')}   />
        <MenuTile icon="🔮" label="EMBLEM"   sub={dojo.emblem}    color="#b44aff" onPress={() => setSection('emblem')}   />
        <MenuTile icon="🎵" label="MUSIC"    sub={music.label}    color="#4a9eff" onPress={() => setSection('music')}    />
        <MenuTile icon="✏️" label="NAME & MOTTO" sub={dojo.motto.slice(0, 20) + (dojo.motto.length > 20 ? '…' : '')} color="#aaa" onPress={() => setSection('motto')} />
      </View>

      {/* Dojo stats */}
      <View style={styles.dojoStats}>
        <Text style={styles.customizeLabel}>DOJO RECORD</Text>
        <View style={styles.dojoStatRow}>
          <StatChip label="RAIDS DEFENDED" value={String(fighter?.wins ?? 0)} />
          <StatChip label="TOTAL FIGHTS" value={String((fighter?.wins ?? 0) + (fighter?.losses ?? 0))} />
          <StatChip label="REPUTATION" value={fighter && fighter.wins >= 10 ? 'KNOWN' : 'UNKNOWN'} />
        </View>
      </View>
    </ScrollView>
  );
}

function MenuTile({ icon, label, sub, color, onPress }: {
  icon: string; label: string; sub: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.menuTile, { borderColor: color + '33' }]} onPress={onPress}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[styles.menuTileLabel, { color }]}>{label}</Text>
      <Text style={styles.menuTileSub} numberOfLines={1}>{sub}</Text>
      <Text style={styles.menuTileArrow}>›</Text>
    </TouchableOpacity>
  );
}

function OptionCard({ icon, label, desc, cost, active, color, onPress }: {
  icon: string; label: string; desc?: string; cost: number; active: boolean; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, active && { borderColor: color + 'aa', backgroundColor: color + '11' }]}
      onPress={onPress}
    >
      <Text style={{ fontSize: 28, marginBottom: 6 }}>{icon}</Text>
      {active && <Text style={[styles.activeBadge, { color }]}>ACTIVE</Text>}
      <Text style={[styles.optionLabel, active && { color }]}>{label}</Text>
      {desc && <Text style={styles.optionDesc}>{desc}</Text>}
      <Text style={[styles.optionCost, cost === 0 && { color: '#2ecc71' }]}>
        {cost === 0 ? 'FREE' : `${cost}g`}
      </Text>
    </TouchableOpacity>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipVal}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080810' },
  overviewContent: { padding: 16, paddingBottom: 60 },
  backBtn: { paddingTop: 52, paddingLeft: 20, paddingBottom: 8 },
  backText: { color: '#555', fontSize: 14 },
  sectionTitle: { color: '#e8c84a', fontSize: 20, fontWeight: '900', letterSpacing: 3, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16, paddingBottom: 60 },
  optionCard: { width: '47%', backgroundColor: '#12121a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a3a', alignItems: 'center' },
  activeBadge: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  optionLabel: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  optionDesc: { color: '#444', fontSize: 9, textAlign: 'center', marginBottom: 6 },
  optionCost: { color: '#e8c84a', fontSize: 11, fontWeight: '700' },
  // Preview card
  dojoPreview: {
    backgroundColor: '#0e0e18', borderRadius: 20, padding: 20, borderWidth: 1,
    marginBottom: 20, alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20,
  },
  previewBanner: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  previewEmblem: { fontSize: 36 },
  bannerIcon: { fontSize: 36 },
  dojoName: { fontSize: 26, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  dojoMotto: { color: '#666', fontSize: 12, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' },
  dojoAtmRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 },
  dojoAtmChip: { color: '#888', fontSize: 10, backgroundColor: '#1a1a28', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  dojoMaterialRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  dojoMatChip: { color: '#555', fontSize: 10, backgroundColor: '#12121a', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  saving: { color: '#e8c84a', fontSize: 10, marginTop: 8 },
  customizeLabel: { color: '#333', fontSize: 9, letterSpacing: 2, marginBottom: 12 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  menuTile: { width: '47%', backgroundColor: '#12121a', borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  menuTileLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  menuTileSub: { color: '#444', fontSize: 9 },
  menuTileArrow: { color: '#333', fontSize: 16, position: 'absolute', right: 12, top: 14 },
  dojoStats: { marginTop: 4 },
  dojoStatRow: { flexDirection: 'row', gap: 8 },
  statChip: { flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e2e' },
  statChipVal: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statChipLabel: { color: '#333', fontSize: 8, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
  // Emblem grid
  emblemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 4 },
  emblemBtn: { width: 62, height: 62, backgroundColor: '#12121a', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  emblemBtnActive: { borderColor: '#e8c84a', backgroundColor: '#e8c84a22' },
  emblemIcon: { fontSize: 28 },
  // Motto section
  mottoSection: { width: '100%', padding: 4 },
  mottoLabel: { color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 8, marginTop: 12 },
  mottoInput: { backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a3a', color: '#fff', fontSize: 15, padding: 14, marginBottom: 4 },
  saveBtn: { backgroundColor: '#e8c84a', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 2 },
});
