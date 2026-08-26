import { create } from 'zustand';
import { HouseRequest, HouseRequestStatus } from '../lib/database.types';
import { supabase } from '../lib/supabase';

interface CreateHouseRequestInput {
  location: string;
  city?: string;
  max_budget: number;
  min_budget?: number;
  bedrooms: number;
  bathrooms?: number;
  move_in_date: string;
  amenities: string[];
  description: string;
}

interface HouseRequestState {
  requests: HouseRequest[];
  myRequests: HouseRequest[];
  loading: boolean;

  fetchHouseRequests: () => Promise<void>;
  fetchMyRequests: () => Promise<void>;
  createHouseRequest: (input: CreateHouseRequestInput) => Promise<HouseRequest>;
  cancelHouseRequest: (requestId: string) => Promise<void>;
  fulfillHouseRequest: (requestId: string) => Promise<void>;
}

export const useHouseRequestStore = create<HouseRequestState>((set, get) => ({
  requests: [],
  myRequests: [],
  loading: false,

  fetchHouseRequests: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('house_requests')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedRequests: HouseRequest[] = await Promise.all(
        (data || []).map(async (row: any) => {
          let clientProfile = undefined;
          try {
            const { data: profileRows } = await supabase.rpc('get_public_profile', {
              profile_id: row.client_id,
            });
            if (profileRows && profileRows.length > 0) {
              clientProfile = profileRows[0];
            }
          } catch {
            // Public profile fetch fallback
          }

          return {
            id: row.id,
            client_id: row.client_id,
            location: row.location,
            city: row.city || 'Nairobi',
            max_budget: Number(row.max_budget),
            min_budget: row.min_budget ? Number(row.min_budget) : null,
            currency: row.currency || 'KES',
            bedrooms: Number(row.bedrooms) || 1,
            bathrooms: Number(row.bathrooms) || 1,
            move_in_date: row.move_in_date,
            amenities: Array.isArray(row.amenities) ? row.amenities : [],
            description: row.description || '',
            status: row.status as HouseRequestStatus,
            responses_count: Number(row.responses_count) || 0,
            created_at: row.created_at,
            updated_at: row.updated_at,
            client: clientProfile,
          };
        })
      );

      set({ requests: loadedRequests, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchMyRequests: async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        set({ myRequests: [] });
        return;
      }

      const { data, error } = await supabase
        .from('house_requests')
        .select('*')
        .eq('client_id', authData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userRequests: HouseRequest[] = (data || []).map((row: any) => ({
        id: row.id,
        client_id: row.client_id,
        location: row.location,
        city: row.city || 'Nairobi',
        max_budget: Number(row.max_budget),
        min_budget: row.min_budget ? Number(row.min_budget) : null,
        currency: row.currency || 'KES',
        bedrooms: Number(row.bedrooms) || 1,
        bathrooms: Number(row.bathrooms) || 1,
        move_in_date: row.move_in_date,
        amenities: Array.isArray(row.amenities) ? row.amenities : [],
        description: row.description || '',
        status: row.status as HouseRequestStatus,
        responses_count: Number(row.responses_count) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      set({ myRequests: userRequests });
    } catch {
      // Graceful fallback
    }
  },

  createHouseRequest: async (input: CreateHouseRequestInput) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      throw new Error('Please sign in to broadcast your home acquisition request.');
    }

    const payload = {
      client_id: authData.user.id,
      location: input.location.trim(),
      city: input.city || 'Nairobi',
      max_budget: input.max_budget,
      min_budget: input.min_budget || null,
      currency: 'KES',
      bedrooms: input.bedrooms || 1,
      bathrooms: input.bathrooms || 1,
      move_in_date: input.move_in_date,
      amenities: input.amenities || [],
      description: input.description.trim(),
      status: 'Active' as const,
      responses_count: 0,
    };

    const { data, error } = await supabase
      .from('house_requests')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Unable to submit your house request.');
    }

    const newRequest: HouseRequest = {
      id: data.id,
      client_id: data.client_id,
      location: data.location,
      city: data.city,
      max_budget: Number(data.max_budget),
      min_budget: data.min_budget ? Number(data.min_budget) : null,
      currency: data.currency,
      bedrooms: Number(data.bedrooms),
      bathrooms: Number(data.bathrooms),
      move_in_date: data.move_in_date,
      amenities: data.amenities || [],
      description: data.description || '',
      status: data.status as HouseRequestStatus,
      responses_count: 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    set((state) => ({
      requests: [newRequest, ...state.requests],
      myRequests: [newRequest, ...state.myRequests],
    }));

    return newRequest;
  },

  cancelHouseRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('house_requests')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;

    set((state) => ({
      requests: state.requests.filter((r) => r.id !== requestId),
      myRequests: state.myRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'Cancelled' } : r
      ),
    }));
  },

  fulfillHouseRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('house_requests')
      .update({ status: 'Fulfilled', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;

    set((state) => ({
      requests: state.requests.filter((r) => r.id !== requestId),
      myRequests: state.myRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'Fulfilled' } : r
      ),
    }));
  },
}));
