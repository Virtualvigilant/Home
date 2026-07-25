import React from 'react';
import { create } from 'zustand';
import { UserRole, Profile } from '../lib/database.types';
import { mockUsers } from '../data/mockData';

interface AuthState {
  isAuthenticated: boolean;
  user: Profile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  setUser: (user: Profile | null) => void;
  signIn: (role: UserRole) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Default to client role for demo purposes
  isAuthenticated: true,
  user: mockUsers[0],
  role: 'client',
  setRole: (role) => {
    const userForRole = mockUsers.find(u => u.role === role) || mockUsers[0];
    set({ role, user: userForRole });
  },
  setUser: (user) => set({ user }),
  signIn: (role) => {
    const userForRole = mockUsers.find(u => u.role === role) || mockUsers[0];
    set({ isAuthenticated: true, role, user: userForRole });
  },
  signOut: () => set({ isAuthenticated: false, user: null, role: 'client' }),
}));
