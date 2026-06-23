import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import type { Raider, Base } from '../types';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setRaider, setBase } = useGameStore();

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const raider: Raider = {
          id: user.uid,
          userId: user.uid,
          name: name || 'Unnamed Raider',
          level: 1,
          xp: 0,
          currency: 500,
          wins: 0,
          losses: 0,
          raids: 0,
          equipment: { head: null, body: null, weapon: null, boots: null },
          stats: { health: 100, attack: 20, defense: 10, speed: 80 },
          avatarStyle: { skinTone: '#d4a47c', hairColor: '#3b2314', outfit: 'default' },
        };
        const base: Base = {
          id: user.uid,
          userId: user.uid,
          name: `${raider.name}'s Fortress`,
          layout: { walls: [], floors: [], traps: [] },
          demons: [],
          trophies: 0,
          lastRaidedAt: null,
        };
        await setDoc(doc(db, 'raiders', user.uid), raider);
        await setDoc(doc(db, 'bases', user.uid), base);
        setRaider(raider);
        setBase(base);
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const raiderDoc = await getDoc(doc(db, 'raiders', user.uid));
        const baseDoc = await getDoc(doc(db, 'bases', user.uid));
        if (raiderDoc.exists()) setRaider(raiderDoc.data() as Raider);
        if (baseDoc.exists()) setBase(baseDoc.data() as Base);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>⚔️ RAIDERS</Text>
      <Text style={styles.tagline}>Fight. Raid. Build. Dominate.</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Raider Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'login' ? 'Enter the Arena' : 'Begin Your Raid'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? 'New raider? Create account' : 'Already raiding? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#e8c84a',
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    color: '#888',
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  button: {
    backgroundColor: '#e8c84a',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  switchText: {
    color: '#e8c84a',
    textAlign: 'center',
    fontSize: 13,
  },
});
