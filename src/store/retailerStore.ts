import { create } from 'zustand';
import { Product } from '../lib/database.types';
import { supabase } from '../lib/supabase';

export interface RetailerOrder {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar: string;
  client_phone: string;
  delivery_address: string;
  neighborhood: string;
  move_in_date: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total_amount: number;
  status: 'Pending_Delivery' | 'Scout_Coordinated' | 'Delivered' | 'Signed_Off';
  scout_name?: string;
  scout_notes?: string;
  payment_status: 'Held_In_Escrow' | 'Released_To_Retailer';
  created_at: string;
}

interface RetailerState {
  products: Product[];
  orders: RetailerOrder[];
  loading: boolean;

  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  coordinateScoutDropoff: (orderId: string, scoutName: string, notes: string) => Promise<void>;
  confirmClientSignoff: (orderId: string) => Promise<void>;
}

const initialProducts: Product[] = [];

const initialOrders: RetailerOrder[] = [];

export const useRetailerStore = create<RetailerState>((set) => ({
  products: initialProducts,
  orders: initialOrders,
  loading: false,

  fetchProducts: async () => {
    set({ loading: true });
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      set({ products: [], loading: false });
      return;
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('retailer_id', authData.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({ products: (data || []) as Product[], loading: false });
  },

  fetchOrders: async () => {
    set({ loading: true });
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      set({ orders: [], loading: false });
      return;
    }
    const { data, error } = await supabase
      .from('bookings')
      .select('*, product:products!inner(*)')
      .eq('product.retailer_id', authData.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      set({ loading: false });
      throw error;
    }
    const orders = await Promise.all((data || []).map(async (booking: any) => {
      const { data: profileRows } = await supabase.rpc('get_public_profile', { profile_id: booking.client_id });
      const client = profileRows?.[0];
      const status: RetailerOrder['status'] = booking.status === 'Completed'
        ? 'Delivered'
        : booking.status === 'Confirmed' ? 'Scout_Coordinated' : 'Pending_Delivery';
      return {
        id: booking.id,
        client_id: booking.client_id,
        client_name: client?.display_name || 'Client',
        client_avatar: client?.avatar_url || 'https://i.pravatar.cc/150?img=11',
        client_phone: client?.phone || '',
        delivery_address: booking.notes || 'Address to be confirmed with client',
        neighborhood: '',
        move_in_date: booking.move_in_date,
        items: [{ name: booking.product.name, price: Number(booking.product.price), quantity: 1 }],
        total_amount: Number(booking.total_amount),
        status,
        scout_notes: booking.notes,
        payment_status: 'Held_In_Escrow' as const,
        created_at: booking.created_at,
      };
    }));
    set({ orders, loading: false });
  },

  addProduct: async (newProdData) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Sign in to publish products.');
    const payload = {
      ...newProdData,
      retailer_id: authData.user.id,
      currency: 'KES',
      stock_count: newProdData.stock_count || 10,
      // Featuring is a merchandising/admin decision, not a seller-controlled flag.
      is_featured: false,
      rating: 0,
    };
    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error || !data) throw error || new Error('Product could not be saved.');
    const newProd = data as Product;
    set((state) => ({ products: [newProd, ...state.products] }));
    return newProd;
  },

  coordinateScoutDropoff: async (orderId, scoutName, notes) => {
    const { error } = await supabase.from('bookings').update({
      status: 'Confirmed',
      notes: `Drop-off coordinated${scoutName ? ` with ${scoutName}` : ''}${notes ? ` — ${notes}` : ''}`,
    }).eq('id', orderId);
    if (error) throw error;
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Scout_Coordinated',
              scout_name: scoutName,
              scout_notes: notes,
            }
          : o
      ),
    }));
  },

  confirmClientSignoff: async (orderId) => {
    const { error } = await supabase.from('bookings').update({ status: 'Completed' }).eq('id', orderId);
    if (error) throw error;
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Delivered',
              payment_status: 'Held_In_Escrow',
            }
          : o
      ),
    }));
  },
}));
