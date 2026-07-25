import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/theme';

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.softCream },
        animation: 'fade',
      }}
    />
  );
}
