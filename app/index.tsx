import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/theme';

export default function Index() {
  const { initialized, isAuthenticated, role } = useAuthStore();

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.matteClay} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect to the appropriate role-based layout
  switch (role) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'hunter':
      return <Redirect href="/(hunter)/leads" />;
    case 'landlord':
      return <Redirect href="/(landlord)/portfolio" />;
    case 'retailer':
      return <Redirect href="/(retailer)/catalog" />;
    case 'mover':
      return <Redirect href="/(mover)/jobs" />;
    case 'client':
    default:
      return <Redirect href="/(client)/(explore)/homes" />;
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.softCream },
});
