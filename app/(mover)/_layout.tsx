import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Typography } from '../../src/constants/theme';
import { RoleGuard } from '../../src/components/RoleGuard';

export default function MoverLayout() {
  return (
    <RoleGuard allowedRole="mover">
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.matteClay,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
          ...Shadows.bottomTab,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: Typography.medium },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </RoleGuard>
  );
}
