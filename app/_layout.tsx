import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  useEffect(() => {
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setTimeout(() => checkSession(), 0);
      }
    });
    const appStateListener = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshProfile();
    });
    return () => {
      authListener.subscription.unsubscribe();
      appStateListener.remove();
    };
  }, [checkSession, refreshProfile]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.softCream },
          animation: 'fade',
        }}
      />
    </>
  );
}
