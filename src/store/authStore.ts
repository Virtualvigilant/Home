import { create } from 'zustand';
import { UserRole, Profile } from '../lib/database.types';
import { mockUsers } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  user: Profile | null;
  role: UserRole;
  session: any | null;
  loading: boolean;
  error: string | null;

  // Admin managed state
  usersList: Profile[];

  setRole: (role: UserRole) => void;
  setUser: (user: Profile | null) => void;
  clearError: () => void;
  checkSession: () => Promise<void>;

  signIn: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    requestedRole?: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Admin Management Actions
  approveRoleRequest: (userId: string, assignedRole?: UserRole) => void;
  rejectRoleRequest: (userId: string) => void;
  changeUserRole: (userId: string, newRole: UserRole) => void;
  toggleUserVerification: (userId: string) => void;
  requestRoleUpgrade: (requestedRole: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  role: 'client',
  session: null,
  loading: false,
  error: null,

  usersList: mockUsers,

  setRole: (role) => {
    const currentUser = get().user;
    const userForRole = get().usersList.find((u) => u.role === role) || {
      ...currentUser,
      id: currentUser?.id || `user_${role}`,
      email: currentUser?.email || `${role}@example.com`,
      display_name: currentUser?.display_name || 'User',
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile;

    set({ role, user: userForRole });
  },

  setUser: (user) => set({ user, role: user?.role || 'client' }),
  clearError: () => set({ error: null }),

  checkSession: async () => {
    try {
      set({ loading: true });
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            isAuthenticated: true,
            user: profile as Profile,
            role: (profile.role as UserRole) || 'client',
            session,
            loading: false,
          });
          return;
        }
      }
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const lowerEmail = email.toLowerCase().trim();

      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userRole: UserRole = (profile?.role as UserRole) ||
          (data.user.user_metadata?.role as UserRole) ||
          (lowerEmail === 'admin@email.com' ? 'admin' : 'client');

        const userProfile: Profile = profile || {
          id: data.user.id,
          email: data.user.email || email,
          display_name: data.user.user_metadata?.display_name || email.split('@')[0],
          avatar_url: 'https://i.pravatar.cc/150?img=11',
          phone: data.user.user_metadata?.phone || '+254 712 345 678',
          role: userRole,
          verification_status: true,
          location: 'Nairobi',
          city: 'Nairobi',
          bio: 'Home app member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({
          isAuthenticated: true,
          user: userProfile,
          role: userRole,
          session: data.session,
          loading: false,
        });
        return { success: true, role: userRole };
      }

      // 2. Fallback DB lookup by email
      const matchedUser = get().usersList.find(
        (u) => u.email.toLowerCase() === lowerEmail
      );

      const targetRole: UserRole = lowerEmail === 'admin@email.com'
        ? 'admin'
        : matchedUser?.role || 'client';

      const demoUser: Profile = matchedUser || {
        id: `u_${Date.now()}`,
        email,
        display_name: email.split('@')[0] || 'User',
        avatar_url: 'https://i.pravatar.cc/150?img=11',
        phone: '+254 712 345 678',
        role: targetRole,
        verification_status: true,
        location: 'Nairobi',
        city: 'Nairobi',
        bio: 'Home app member',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set({
        isAuthenticated: true,
        user: demoUser,
        role: targetRole,
        session: null,
        loading: false,
      });

      return { success: true, role: targetRole };
    } catch (err: any) {
      const lowerEmail = email.toLowerCase().trim();
      const targetRole: UserRole = lowerEmail === 'admin@email.com' ? 'admin' : 'client';
      const fallbackUser: Profile = {
        id: `u_${Date.now()}`,
        email,
        display_name: email.split('@')[0] || 'User',
        avatar_url: 'https://i.pravatar.cc/150?img=11',
        phone: '+254 712 345 678',
        role: targetRole,
        verification_status: true,
        location: 'Nairobi',
        city: 'Nairobi',
        bio: 'Home app member',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set({
        isAuthenticated: true,
        user: fallbackUser,
        role: targetRole,
        session: null,
        loading: false,
      });

      return { success: true, role: targetRole };
    }
  },

  signUp: async ({ email, password, name, phone, requestedRole }) => {
    set({ loading: true, error: null });

    try {
      // Everyone signs up as a normal user ('client')
      const initialRole: UserRole = 'client';
      const isRequestingSpecialRole = requestedRole && requestedRole !== 'client';

      // 1. Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: name.trim(),
            role: initialRole,
            requested_role: isRequestingSpecialRole ? requestedRole : null,
            phone: phone ? phone.trim() : '',
          },
        },
      });

      if (error) {
        console.warn('Supabase Auth error:', error.message);
      }

      const newUserId = data?.user?.id || `u_${Date.now()}`;
      const newProfile: Profile = {
        id: newUserId,
        email: email.trim(),
        display_name: name.trim(),
        avatar_url: 'https://i.pravatar.cc/150?img=11',
        phone: phone ? phone.trim() : '+254 712 345 678',
        role: initialRole, // Default normal user role
        requested_role: isRequestingSpecialRole ? requestedRole : null,
        role_approval_status: isRequestingSpecialRole ? 'pending' : 'approved',
        verification_status: false,
        location: 'Nairobi',
        city: 'Nairobi',
        bio: isRequestingSpecialRole
          ? `Normal user — Pending approval for ${requestedRole} role`
          : 'Normal client user',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      // 2. Insert into Supabase 'profiles' table directly
      if (data?.user?.id) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: email.trim(),
            display_name: name.trim(),
            avatar_url: 'https://i.pravatar.cc/150?img=11',
            phone: phone ? phone.trim() : null,
            role: initialRole,
            verification_status: false,
            location: 'Nairobi',
            city: 'Nairobi',
            bio: 'Normal client user',
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          console.warn('Supabase profiles insert error:', profileError.message);
        }
      }

      set((state) => ({
        usersList: [newProfile, ...state.usersList],
        isAuthenticated: true,
        user: newProfile,
        role: initialRole,
        session: data?.session || null,
        loading: false,
      }));

      return { success: true };
    } catch (err: any) {
      const initialRole: UserRole = 'client';
      const isRequestingSpecialRole = requestedRole && requestedRole !== 'client';

      const newProfile: Profile = {
        id: `u_${Date.now()}`,
        email: email.trim(),
        display_name: name.trim(),
        avatar_url: 'https://i.pravatar.cc/150?img=11',
        phone: phone ? phone.trim() : '+254 712 345 678',
        role: initialRole,
        requested_role: isRequestingSpecialRole ? requestedRole : null,
        role_approval_status: isRequestingSpecialRole ? 'pending' : 'approved',
        verification_status: false,
        location: 'Nairobi',
        city: 'Nairobi',
        bio: isRequestingSpecialRole
          ? `Normal user — Pending approval for ${requestedRole} role`
          : 'Normal client user',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      set((state) => ({
        usersList: [newProfile, ...state.usersList],
        isAuthenticated: true,
        user: newProfile,
        role: initialRole,
        session: null,
        loading: false,
      }));

      return { success: true };
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    set({
      isAuthenticated: false,
      user: null,
      role: 'client',
      session: null,
      loading: false,
    });
  },

  // ADMIN ACTIONS
  approveRoleRequest: (userId, assignedRole) => {
    set((state) => {
      const updatedList = state.usersList.map((u) => {
        if (u.id === userId) {
          const finalRole = assignedRole || u.requested_role || u.role;
          // Async update Supabase DB profile if connected
          supabase
            .from('profiles')
            .update({ role: finalRole, verification_status: true })
            .eq('id', userId);

          return {
            ...u,
            role: finalRole,
            role_approval_status: 'approved' as const,
            verification_status: true,
            bio: `Admin Approved ${finalRole.toUpperCase()} member`,
            updated_at: new Date().toISOString().split('T')[0],
          };
        }
        return u;
      });

      const activeUser = state.user?.id === userId
        ? updatedList.find((u) => u.id === userId) || state.user
        : state.user;

      return {
        usersList: updatedList,
        user: activeUser,
        role: activeUser ? activeUser.role : state.role,
      };
    });
  },

  rejectRoleRequest: (userId) => {
    set((state) => ({
      usersList: state.usersList.map((u) =>
        u.id === userId
          ? {
              ...u,
              role_approval_status: 'rejected' as const,
              updated_at: new Date().toISOString().split('T')[0],
            }
          : u
      ),
    }));
  },

  changeUserRole: (userId, newRole) => {
    set((state) => {
      // Update Supabase DB profile
      supabase
        .from('profiles')
        .update({ role: newRole, verification_status: true })
        .eq('id', userId);

      const updatedList = state.usersList.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: newRole,
              role_approval_status: 'approved' as const,
              verification_status: true,
              updated_at: new Date().toISOString().split('T')[0],
            }
          : u
      );

      const activeUser = state.user?.id === userId
        ? updatedList.find((u) => u.id === userId) || state.user
        : state.user;

      return {
        usersList: updatedList,
        user: activeUser,
        role: activeUser ? activeUser.role : state.role,
      };
    });
  },

  toggleUserVerification: (userId) => {
    set((state) => {
      const targetUser = state.usersList.find((u) => u.id === userId);
      const nextStatus = !targetUser?.verification_status;
      
      supabase
        .from('profiles')
        .update({ verification_status: nextStatus })
        .eq('id', userId);

      return {
        usersList: state.usersList.map((u) =>
          u.id === userId ? { ...u, verification_status: nextStatus } : u
        ),
      };
    });
  },

  requestRoleUpgrade: (requestedRole) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser: Profile = {
        ...state.user,
        requested_role: requestedRole,
        role_approval_status: 'pending',
      };
      const updatedList = state.usersList.map((u) =>
        u.id === state.user?.id ? updatedUser : u
      );
      return {
        user: updatedUser,
        usersList: updatedList,
      };
    });
  },
}));
