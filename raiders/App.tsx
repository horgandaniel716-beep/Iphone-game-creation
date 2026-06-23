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
import type { Fighter, Base } from './src/types';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const { fighter, setFighter, setBase, reset } = useGameStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fighterDoc = await getDoc(doc(db, 'fighters', user.uid));
        const baseDoc    = await getDoc(doc(db, 'bases', user.uid));
        if (fighterDoc.exists()) setFighter(fighterDoc.data() as Fighter);
        if (baseDoc.exists())    setBase(baseDoc.data() as Base);
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
        {fighter ? <TabNavigator /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
