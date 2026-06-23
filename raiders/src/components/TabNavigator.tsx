import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ArenaScreen from '../screens/ArenaScreen';
import BaseScreen from '../screens/BaseScreen';
import ShopScreen from '../screens/ShopScreen';
import RaidScreen from '../screens/RaidScreen';
import CharacterSelectScreen from '../screens/CharacterSelectScreen';
import MovesScreen from '../screens/MovesScreen';
import WeaponsScreen from '../screens/WeaponsScreen';
import DojoScreen from '../screens/DojoScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Home:    '🏠',
  Arena:   '⚔️',
  Fighter: '👤',
  Moves:   '🥋',
  Weapons: '🗡️',
  Raid:    '🏴',
  Base:    '🏰',
  Shop:    '🏪',
  Dojo:    '🏯',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: '#e8c84a',
        tabBarInactiveTintColor: '#444',
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
            {ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Arena"   component={ArenaScreen} />
      <Tab.Screen name="Fighter" component={CharacterSelectScreen} />
      <Tab.Screen name="Moves"   component={MovesScreen} />
      <Tab.Screen name="Weapons" component={WeaponsScreen} />
      <Tab.Screen name="Raid"    component={RaidScreen} />
      <Tab.Screen name="Base"    component={BaseScreen} />
      <Tab.Screen name="Dojo"    component={DojoScreen} />
      <Tab.Screen name="Shop"    component={ShopScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f0f17',
    borderTopColor: '#1a1a2e',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
