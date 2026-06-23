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
import type { Fighter, Base } from '../types';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setFighter, setBase } = useGameStore();

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const fighter: Fighter = {
          id: user.uid,
          userId: user.uid,
          name: name.trim() || 'Unknown Fighter',
          tag: name.slice(0, 4).toUpperCase() || 'FGTR',
          level: 1,
          xp: 0,
          currency: 500,
          wins: 0,
          losses: 0,
          selectedCharacter: 'apex',
          equipment: { head: null, body: null, weapon: null, boots: null },
          stats: { health: 100, attack: 50, defense: 40, speed: 90 },
        };
        const base: Base = {
          id: user.uid,
          userId: user.uid,
          name: `${fighter.name}'s Territory`,
          demons: [],
          trophies: 0,
          lastRaidedAt: null,
        };
        await setDoc(doc(db, 'fighters', user.uid), fighter);
        await setDoc(doc(db, 'bases', user.uid), base);
        setFighter(fighter);
        setBase(base);
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const fighterDoc = await getDoc(doc(db, 'fighters', user.uid));
        const baseDoc    = await getDoc(doc(db, 'bases', user.uid));
        if (fighterDoc.exists()) setFighter(fighterDoc.data() as Fighter);
        if (baseDoc.exists())    setBase(baseDoc.data() as Base);
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
      <Text style={styles.logo}>CLASH</Text>
      <Text style={styles.tagline}>Fight. Dominate. Rise.</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Fighter Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoCorrect={false}
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
              {mode === 'login' ? 'ENTER' : 'CREATE FIGHTER'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? 'No account? Create one' : 'Already have an account? Sign in'}
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
    fontSize: 56,
    fontWeight: '900',
    color: '#e8c84a',
    letterSpacing: 10,
    marginBottom: 8,
  },
  tagline: {
    color: '#555',
    fontSize: 12,
    letterSpacing: 4,
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
    fontSize: 20,
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
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
  },
  switchText: {
    color: '#e8c84a',
    textAlign: 'center',
    fontSize: 13,
  },
});
