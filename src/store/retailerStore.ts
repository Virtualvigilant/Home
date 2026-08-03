import { create } from 'zustand';
import { Product } from '../lib/database.types';

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

  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  coordinateScoutDropoff: (orderId: string, scoutName: string, notes: string) => void;
  confirmClientSignoff: (orderId: string) => void;
}

const initialProducts: Product[] = [];

const initialOrders: RetailerOrder[] = [];

export const useRetailerStore = create<RetailerState>((set) => ({
  products: initialProducts,
  orders: initialOrders,
  loading: false,

  addProduct: (newProdData) => {
    const newProd: Product = {
      ...newProdData,
      id: `prod_${Date.now()}`,
      currency: 'KES',
      stock_count: newProdData.stock_count || 10,
      is_featured: true,
      rating: 5.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({ products: [newProd, ...state.products] }));
  },

  coordinateScoutDropoff: (orderId, scoutName, notes) => {
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

  confirmClientSignoff: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Signed_Off',
              payment_status: 'Released_To_Retailer',
            }
          : o
      ),
    }));
  },
}));
