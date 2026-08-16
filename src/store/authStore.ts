import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { ApprovalStatus, Profile, UserRole } from '../lib/database.types';
import { supabase } from '../lib/supabase';

const SPECIAL_ROLES: UserRole[] = ['hunter', 'landlord', 'retailer', 'mover'];

type AuthResult = {
  success: boolean;
  role?: UserRole;
  requiresEmailConfirmation?: boolean;
  error?: string;
};

interface AuthState {
  initialized: boolean;
  isAuthenticated: boolean;
  user: Profile | null;
  role: UserRole;
  session: Session | null;
  loading: boolean;
  usersLoading: boolean;
  error: string | null;
  usersList: Profile[];

  setUser: (user: Profile | null) => void;
  clearError: () => void;
  checkSession: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    requestedRole?: UserRole;
  }) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;

  approveRoleRequest: (userId: string, assignedRole?: UserRole) => Promise<AuthResult>;
  rejectRoleRequest: (userId: string) => Promise<AuthResult>;
  changeUserRole: (userId: string, newRole: UserRole) => Promise<AuthResult>;
  toggleUserVerification: (userId: string) => Promise<AuthResult>;
  requestRoleUpgrade: (requestedRole: UserRole) => Promise<AuthResult>;
  completeKycVerification: (idNumber: string, documentType: string, documentPath: string) => Promise<AuthResult>;
}

function messageFromError(error: unknown, fallback: string) {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '').trim();
    if (message) return message;
  }
  return fallback;
}

function normalizeProfile(profile: Record<string, any>): Profile {
  return {
    ...profile,
    role: (profile.role || 'client') as UserRole,
    requested_role: (profile.requested_role || null) as UserRole | null,
    role_approval_status: (profile.role_approval_status || 'approved') as ApprovalStatus,
    verification_status: Boolean(profile.verification_status),
  } as Profile;
}

async function loadProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(
      messageFromError(error, 'Your account profile could not be loaded. Please contact support.')
    );
  }

  return normalizeProfile(data);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  isAuthenticated: false,
  user: null,
  role: 'client',
  session: null,
  loading: false,
  usersLoading: false,
  error: null,
  usersList: [],

  setUser: (user) => set({
    user,
    role: user?.role || 'client',
    isAuthenticated: Boolean(user),
  }),
  clearError: () => set({ error: null }),

  checkSession: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!data.session?.user) {
        set({
          initialized: true,
          isAuthenticated: false,
          user: null,
          role: 'client',
          session: null,
          loading: false,
        });
        return;
      }

      const profile = await loadProfile(data.session.user.id);
      set({
        initialized: true,
        isAuthenticated: true,
        user: profile,
        role: profile.role,
        session: data.session,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = messageFromError(error, 'Unable to restore your session. Please sign in again.');
      await supabase.auth.signOut().catch(() => undefined);
      set({
        initialized: true,
        isAuthenticated: false,
        user: null,
        role: 'client',
        session: null,
        loading: false,
        error: message,
      });
    }
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return null;
    try {
      const profile = await loadProfile(userId);
      set({ user: profile, role: profile.role });
      return profile;
    } catch (error) {
      set({ error: messageFromError(error, 'Unable to refresh your profile.') });
      return null;
    }
  },

  fetchUsers: async () => {
    if (get().role !== 'admin') return;
    set({ usersLoading: true });
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({
        usersLoading: false,
        error: messageFromError(error, 'Unable to load registered users.'),
      });
      return;
    }

    set({ usersList: (data || []).map(normalizeProfile), usersLoading: false });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error || !data.session || !data.user) {
        throw error || new Error('Sign in failed. Please check your credentials.');
      }

      const profile = await loadProfile(data.user.id);
      set({
        initialized: true,
        isAuthenticated: true,
        user: profile,
        role: profile.role,
        session: data.session,
        loading: false,
        error: null,
      });
      return { success: true, role: profile.role };
    } catch (error) {
      const rawMessage = messageFromError(error, 'Unable to sign in. Please try again.');
      const message = /invalid login credentials/i.test(rawMessage)
        ? 'Incorrect email or password.'
        : rawMessage;
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signUp: async ({ email, password, name, phone, requestedRole = 'client' }) => {
    set({ loading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || null;
    const requestedSpecialRole = SPECIAL_ROLES.includes(requestedRole) ? requestedRole : null;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: name.trim(),
            phone: cleanPhone,
            requested_role: requestedSpecialRole,
          },
        },
      });
      if (error) throw error;
      if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }

      if (!data.session) {
        set({
          initialized: true,
          isAuthenticated: false,
          user: null,
          role: 'client',
          session: null,
          loading: false,
        });
        return { success: true, role: 'client', requiresEmailConfirmation: true };
      }

      const profile = await loadProfile(data.user.id);
      set({
        initialized: true,
        isAuthenticated: true,
        user: profile,
        role: 'client',
        session: data.session,
        loading: false,
        error: null,
      });
      return { success: true, role: 'client' };
    } catch (error) {
      const rawMessage = messageFromError(error, 'Unable to create your account.');
      const message = /already registered|already exists/i.test(rawMessage)
        ? 'An account with this email address already exists. Please sign in instead.'
        : rawMessage;
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  resetPassword: async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'Enter your email address first.' };
    set({ loading: true, error: null });
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) {
      const message = messageFromError(error, 'Unable to send reset instructions.');
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
    set({ loading: false });
    return { success: true };
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut().catch(() => undefined);
    set({
      initialized: true,
      isAuthenticated: false,
      user: null,
      role: 'client',
      session: null,
      usersList: [],
      loading: false,
      error: null,
    });
  },

  approveRoleRequest: async (userId, assignedRole) => {
    const target = get().usersList.find((item) => item.id === userId);
    const finalRole = assignedRole || target?.requested_role;
    if (!finalRole || !SPECIAL_ROLES.includes(finalRole)) {
      return { success: false, error: 'Select a valid requested role.' };
    }
    const { error } = await supabase.rpc('admin_set_user_access', {
      target_user_id: userId,
      target_role: finalRole,
      approval: 'approved',
    });
    if (error) return { success: false, error: messageFromError(error, 'Approval failed.') };
    await get().fetchUsers();
    return { success: true, role: finalRole };
  },

  rejectRoleRequest: async (userId) => {
    const { error } = await supabase.rpc('admin_set_user_access', {
      target_user_id: userId,
      target_role: 'client',
      approval: 'rejected',
    });
    if (error) return { success: false, error: messageFromError(error, 'Rejection failed.') };
    await get().fetchUsers();
    return { success: true, role: 'client' };
  },

  changeUserRole: async (userId, newRole) => {
    const approval = newRole === 'client' ? 'approved' : 'approved';
    const { error } = await supabase.rpc('admin_set_user_access', {
      target_user_id: userId,
      target_role: newRole,
      approval,
    });
    if (error) return { success: false, error: messageFromError(error, 'Role update failed.') };
    await get().fetchUsers();
    return { success: true, role: newRole };
  },

  toggleUserVerification: async (userId) => {
    const target = get().usersList.find((item) => item.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    const { error } = await supabase.rpc('admin_set_user_verification', {
      target_user_id: userId,
      verified: !target.verification_status,
    });
    if (error) return { success: false, error: messageFromError(error, 'Verification update failed.') };
    await get().fetchUsers();
    return { success: true };
  },

  requestRoleUpgrade: async (requestedRole) => {
    const user = get().user;
    if (!user || !SPECIAL_ROLES.includes(requestedRole)) {
      return { success: false, error: 'Sign in and select a valid role.' };
    }
    const { error } = await supabase.rpc('request_role_upgrade', {
      desired_role: requestedRole,
    });
    if (error) return { success: false, error: messageFromError(error, 'Role request failed.') };
    await get().refreshProfile();
    return { success: true, role: 'client' };
  },

  completeKycVerification: async (idNumber, documentType, documentPath) => {
    const user = get().user;
    if (!user) return { success: false, error: 'You must be signed in.' };
    const { error } = await supabase.from('kyc_submissions').insert({
      user_id: user.id,
      document_type: documentType,
      id_number: idNumber,
      document_path: documentPath,
      status: 'pending',
    });
    if (error) return { success: false, error: messageFromError(error, 'Document submission failed.') };
    await get().refreshProfile();
    return { success: true };
  },
}));
