import { create } from 'zustand';

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

  acceptJob: (jobId: string) => void;
  startGpsNavigation: (jobId: string) => void;
  verifyCargoArrival: (jobId: string, checklist: { boxes_intact: boolean; furniture_unloaded: boolean; client_signoff: boolean }) => void;
  withdrawMpesa: (amount: number, phone: string) => Promise<void>;
}

const initialJobs: MoverJob[] = [];

export const useMoverStore = create<MoverState>((set, get) => ({
  jobs: initialJobs,
  loading: false,

  acceptJob: (jobId) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, status: 'Accepted' } : j
      ),
    }));
  },

  startGpsNavigation: (jobId) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, status: 'En_Route' } : j
      ),
    }));
  },

  verifyCargoArrival: (jobId, checklist) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'Arrived_Verified',
              cargo_checklist: checklist,
              payout_released: true,
            }
          : j
      ),
    }));
  },

  withdrawMpesa: async (amount, phone) => {
    // Instant M-PESA payout simulation
  },
}));
