import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { getCharacter } from '../lib/characters';
import {
  createMatch, joinMatch, subscribeToMatch, cleanupMatch,
  type MatchState,
} from '../lib/matchmaking';

type LobbyPhase = 'menu' | 'creating' | 'waiting' | 'joining' | 'ready';

interface Props {
  onMatchReady: (matchState: MatchState, role: 'p1' | 'p2') => void;
  onBack: () => void;
}

export default function MultiplayerLobbyScreen({ onMatchReady, onBack }: Props) {
  const { fighter } = useGameStore();
  const [phase, setPhase] = useState<LobbyPhase>('menu');
  const [matchId, setMatchId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const roleRef = useRef<'p1' | 'p2'>('p1');

  const char = getCharacter(fighter?.selectedCharacter ?? 'apex');

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      if (matchId && roleRef.current === 'p1') cleanupMatch(matchId);
    };
  }, [matchId]);

  async function handleCreateMatch() {
    if (!fighter) return;
    setPhase('creating');
    try {
      const id = await createMatch(fighter, 'neon_city');
      setMatchId(id);
      roleRef.current = 'p1';
      const unsub = subscribeToMatch(id, (state) => {
        setMatchState(state);
        if (state.phase === 'ready' && state.player2) {
          setPhase('ready');
          setTimeout(() => {
            unsub();
            onMatchReady(state, 'p1');
          }, 1500);
        }
      });
      unsubRef.current = unsub;
      setPhase('waiting');
    } catch {
      Alert.alert('Error', 'Failed to create match. Check your connection.');
      setPhase('menu');
    }
  }

  async function handleJoinMatch() {
    if (!fighter || !joinCode.trim()) return;
    const code = joinCode.trim().toUpperCase();
    setPhase('joining');
    try {
      const success = await joinMatch(code, fighter);
      if (!success) {
        Alert.alert('Match Not Found', 'Check the code and try again.');
        setPhase('menu');
        return;
      }
      setMatchId(code);
      roleRef.current = 'p2';
      const unsub = subscribeToMatch(code, (state) => {
        setMatchState(state);
        if (state.phase === 'ready') {
          setPhase('ready');
          setTimeout(() => {
            unsub();
            onMatchReady(state, 'p2');
          }, 1500);
        }
      });
      unsubRef.current = unsub;
    } catch {
      Alert.alert('Error', 'Failed to join match.');
      setPhase('menu');
    }
  }

  if (phase === 'ready' && matchState) {
    const opponent = roleRef.current === 'p1' ? matchState.player2 : matchState.player1;
    const oppChar = getCharacter(opponent?.selectedCharacter ?? 'apex');
    return (
      <View style={styles.container}>
        <Text style={styles.readyTitle}>MATCH FOUND!</Text>
        <Text style={styles.readyVs}>VS</Text>
        <View style={styles.vsRow}>
          <View style={styles.vsCard}>
            <Text style={styles.vsIcon}>{char.icon}</Text>
            <Text style={[styles.vsName, { color: char.primaryColor }]}>{fighter?.name}</Text>
            <Text style={styles.vsChar}>{char.name}</Text>
          </View>
          <Text style={styles.vsDivider}>⚔️</Text>
          <View style={styles.vsCard}>
            <Text style={styles.vsIcon}>{oppChar.icon}</Text>
            <Text style={[styles.vsName, { color: oppChar.primaryColor }]}>{opponent?.name}</Text>
            <Text style={styles.vsChar}>{oppChar.name}</Text>
          </View>
        </View>
        <ActivityIndicator color="#e8c84a" style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Loading arena...</Text>
      </View>
    );
  }

  if (phase === 'waiting') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>WAITING FOR OPPONENT</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>SHARE THIS CODE</Text>
          <Text style={styles.code}>{matchId}</Text>
        </View>
        <Text style={styles.hint}>Tell your friend to enter this code in their game</Text>
        <ActivityIndicator color="#e8c84a" size="large" style={{ marginTop: 32 }} />
        <Text style={styles.waitText}>Searching...</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => { unsubRef.current?.(); cleanupMatch(matchId); setPhase('menu'); }}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'joining' || phase === 'creating') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#e8c84a" size="large" />
        <Text style={styles.waitText}>{phase === 'creating' ? 'Creating match...' : 'Joining match...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      <Text style={styles.title}>⚔️ MULTIPLAYER</Text>
      <Text style={styles.subtitle}>Fight a friend in real time</Text>

      <View style={[styles.fighterCard, { borderColor: char.primaryColor + '66' }]}>
        <Text style={styles.cardIcon}>{char.icon}</Text>
        <View>
          <Text style={styles.cardName}>{fighter?.name}</Text>
          <Text style={[styles.cardChar, { color: char.primaryColor }]}>{char.name}</Text>
          <Text style={styles.cardLevel}>LVL {fighter?.level}  •  {fighter?.wins}W</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreateMatch}>
        <Text style={styles.createBtnText}>CREATE MATCH</Text>
        <Text style={styles.createBtnSub}>Generate a code for your friend</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.joinLabel}>JOIN WITH CODE</Text>
      <View style={styles.joinRow}>
        <TextInput
          style={styles.codeInput}
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          placeholder="ENTER CODE"
          placeholderTextColor="#333"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.joinBtn, { opacity: joinCode.length === 6 ? 1 : 0.4 }]}
          onPress={handleJoinMatch}
          disabled={joinCode.length !== 6}
        >
          <Text style={styles.joinBtnText}>JOIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 24, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20 },
  backText: { color: '#555', fontSize: 14 },
  title: { color: '#e8c84a', fontSize: 32, fontWeight: '900', letterSpacing: 3, marginBottom: 4 },
  subtitle: { color: '#444', fontSize: 12, letterSpacing: 1, marginBottom: 24 },
  fighterCard: {
    width: '100%', backgroundColor: '#12121a', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, marginBottom: 24,
  },
  cardIcon: { fontSize: 40 },
  cardName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  cardChar: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  cardLevel: { color: '#444', fontSize: 11, marginTop: 2 },
  createBtn: {
    width: '100%', backgroundColor: '#1e1e30', borderRadius: 14, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: '#e8c84a44', marginBottom: 20,
  },
  createBtnText: { color: '#e8c84a', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  createBtnSub: { color: '#555', fontSize: 11, marginTop: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a2a3a' },
  dividerText: { color: '#333', fontSize: 11, marginHorizontal: 12 },
  joinLabel: { color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 10, alignSelf: 'flex-start' },
  joinRow: { flexDirection: 'row', width: '100%', gap: 12 },
  codeInput: {
    flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 6,
    borderWidth: 1, borderColor: '#2a2a3a', textAlign: 'center',
  },
  joinBtn: { backgroundColor: '#4a9eff', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  codeBox: { backgroundColor: '#12121a', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e8c84a44', marginBottom: 12 },
  codeLabel: { color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  code: { color: '#e8c84a', fontSize: 48, fontWeight: '900', letterSpacing: 12 },
  hint: { color: '#444', fontSize: 12, textAlign: 'center' },
  waitText: { color: '#888', fontSize: 14, marginTop: 12 },
  cancelBtn: { marginTop: 32, padding: 12 },
  cancelText: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
  readyTitle: { color: '#e8c84a', fontSize: 36, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
  readyVs: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 20 },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' },
  vsCard: { flex: 1, backgroundColor: '#12121a', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  vsIcon: { fontSize: 40, marginBottom: 8 },
  vsName: { fontSize: 16, fontWeight: '900' },
  vsChar: { color: '#555', fontSize: 11, marginTop: 2 },
  vsDivider: { fontSize: 28 },
  loadingText: { color: '#555', fontSize: 12, marginTop: 8 },
});
