import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const role = useAuthStore((state) => state.role);

  // Redirect to the appropriate role-based layout
  switch (role) {
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
