import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Href, Redirect } from 'expo-router';
import { UserRole } from '../lib/database.types';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

const roleHomes: Record<UserRole, Href> = {
  client: '/(client)/(explore)/homes',
  hunter: '/(hunter)/leads',
  landlord: '/(landlord)/portfolio',
  retailer: '/(retailer)/catalog',
  mover: '/(mover)/jobs',
  admin: '/(admin)/dashboard',
};

export function RoleGuard({ allowedRole, children }: { allowedRole: UserRole; children: ReactNode }) {
  const { initialized, isAuthenticated, role } = useAuthStore();

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.matteClay} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (role !== allowedRole) return <Redirect href={roleHomes[role]} />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softCream,
  },
});
