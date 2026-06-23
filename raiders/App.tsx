import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/lib/firebase';
import { useGameStore } from './src/store/gameStore';
import AuthScreen from './src/screens/AuthScreen';
import TabNavigator from './src/components/TabNavigator';
import type { Fighter, Base } from './src/types';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { fighter, setFighter, setBase, reset } = useGameStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        setLoadError('');
        try {
          const fighterDoc = await getDoc(doc(db, 'fighters', user.uid));
          const baseDoc    = await getDoc(doc(db, 'bases', user.uid));
          if (fighterDoc.exists()) setFighter(fighterDoc.data() as Fighter);
          if (baseDoc.exists())    setBase(baseDoc.data() as Base);
        } catch {
          setLoadError('Connection error. Check your network.');
        } finally {
          setLoading(false);
        }
      } else {
        reset();
      }
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  if (!authChecked || loading) {
    return (
      <View style={boot.container}>
        <Text style={boot.logo}>⚔️</Text>
        <Text style={boot.title}>RAIDERS</Text>
        <ActivityIndicator size="large" color="#e8c84a" style={{ marginTop: 24 }} />
        {loadError ? <Text style={boot.error}>{loadError}</Text> : null}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {fighter ? <TabNavigator /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const boot = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 64 },
  title: { color: '#e8c84a', fontSize: 36, fontWeight: '900', letterSpacing: 6, marginTop: 8 },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 20, textAlign: 'center', paddingHorizontal: 40 },
});
