import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/lib/firebase';
import { useGameStore } from './src/store/gameStore';
import AuthScreen from './src/screens/AuthScreen';
import TabNavigator from './src/components/TabNavigator';
import type { Raider, Base } from './src/types';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const { raider, setRaider, setBase, reset } = useGameStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const raiderDoc = await getDoc(doc(db, 'raiders', user.uid));
        const baseDoc = await getDoc(doc(db, 'bases', user.uid));
        if (raiderDoc.exists()) setRaider(raiderDoc.data() as Raider);
        if (baseDoc.exists()) setBase(baseDoc.data() as Base);
      } else {
        reset();
      }
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  if (!authChecked) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {raider ? <TabNavigator /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
