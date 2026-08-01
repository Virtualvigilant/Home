import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, role } = useAuthStore();

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
