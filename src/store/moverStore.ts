import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface MoverJob {
  id: string;
  client_name: string;
  client_avatar: string;
  client_phone: string;
  from_address: string;
  to_address: string;
  neighborhood: string;
  distance_km: number;
  est_duration_mins: number;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  move_in_date: string;
  move_in_time: string;
  cargo_description: string;
  fee: number;
  status: 'Open' | 'Accepted' | 'En_Route' | 'Arrived_Verified' | 'Completed';
  cargo_checklist?: {
    boxes_intact: boolean;
    furniture_unloaded: boolean;
    client_signoff: boolean;
  };
  payout_released: boolean;
}

interface MoverState {
  jobs: MoverJob[];
  loading: boolean;

  fetchJobs: () => Promise<void>;
  acceptJob: (jobId: string) => Promise<void>;
  startGpsNavigation: (jobId: string) => Promise<void>;
  verifyCargoArrival: (jobId: string, checklist: { boxes_intact: boolean; furniture_unloaded: boolean; client_signoff: boolean }) => Promise<void>;
  withdrawMpesa: (amount: number, phone: string) => Promise<void>;
}

const initialJobs: MoverJob[] = [];

export const useMoverStore = create<MoverState>((set, get) => ({
  jobs: initialJobs,
  loading: false,

  fetchJobs: async () => {
    set({ loading: true });
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      set({ jobs: [], loading: false });
      return;
    }
    const { data, error } = await supabase.from('bookings')
      .select('*, service:services!inner(*)')
      .eq('service.provider_id', authData.user.id)
      .eq('service.type', 'Mover')
      .order('created_at', { ascending: false });
    if (error) {
      set({ loading: false });
      throw error;
    }
    const jobs = await Promise.all((data || []).map(async (booking: any) => {
      const { data: profileRows } = await supabase.rpc('get_public_profile', { profile_id: booking.client_id });
      const client = profileRows?.[0];
      const status: MoverJob['status'] = booking.status === 'Completed' ? 'Completed'
        : booking.status === 'In_Progress' ? 'En_Route'
        : booking.status === 'Confirmed' ? 'Accepted' : 'Open';
      return {
        id: booking.id,
        client_name: client?.display_name || 'Client',
        client_avatar: client?.avatar_url || 'https://i.pravatar.cc/150?img=11',
        client_phone: client?.phone || '',
        from_address: 'Pickup address to be confirmed',
        to_address: booking.notes || 'Destination to be confirmed',
        neighborhood: '',
        distance_km: 0,
        est_duration_mins: 0,
        pickup_lat: -1.286389,
        pickup_lng: 36.817223,
        dropoff_lat: -1.286389,
        dropoff_lng: 36.817223,
        move_in_date: booking.move_in_date,
        move_in_time: 'Time to be confirmed',
        cargo_description: booking.service.name,
        fee: Number(booking.total_amount),
        status,
        payout_released: false,
      } as MoverJob;
    }));
    set({ jobs, loading: false });
  },

  acceptJob: async (jobId) => {
    const { error } = await supabase.from('bookings').update({ status: 'Confirmed' }).eq('id', jobId);
    if (error) throw error;
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, status: 'Accepted' } : j
      ),
    }));
  },

  startGpsNavigation: async (jobId) => {
    const { error } = await supabase.from('bookings').update({ status: 'In_Progress' }).eq('id', jobId);
    if (error) throw error;
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, status: 'En_Route' } : j
      ),
    }));
  },

  verifyCargoArrival: async (jobId, checklist) => {
    const { error } = await supabase.from('bookings').update({
      status: 'Completed',
      notes: 'Mover recorded cargo arrival; awaiting client/payment confirmation',
    }).eq('id', jobId);
    if (error) throw error;
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'Arrived_Verified',
              cargo_checklist: checklist,
              payout_released: false,
            }
          : j
      ),
    }));
  },

  withdrawMpesa: async (amount, phone) => {
    throw new Error('M-PESA payouts require a configured server-side payment provider.');
  },
}));
