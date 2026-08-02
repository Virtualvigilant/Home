import { create } from 'zustand';
import { Property, HunterLead, Booking } from '../lib/database.types';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

interface PropertyState {
  properties: Property[];
  wishlistIds: string[];
  hunterLeads: HunterLead[];
  bookings: Booking[];
  loading: boolean;
  
  // Data fetching
  fetchProperties: () => Promise<void>;
  
  // Wishlist actions
  toggleWishlist: (propertyId: string) => void;
  isWishlisted: (propertyId: string) => boolean;

  // Property management actions
  getPropertyById: (id: string) => Property | undefined;
  addProperty: (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => Promise<Property>;
  updatePropertyStatus: (propertyId: string, status: Property['status']) => Promise<void>;

  // Hunter actions
  verifyLead: (leadId: string) => void;

  // Booking & Rental actions
  bookTour: (propertyId: string, date: string, time: string) => void;
  rentProperty: (propertyId: string, totalAmount: number, notes?: string) => Booking;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  wishlistIds: [],
  hunterLeads: [],
  bookings: [],
  loading: false,

  fetchProperties: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        set({ properties: data as Property[], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ loading: false });
    }
  },

  toggleWishlist: (propertyId: string) => {
    set((state) => {
      const exists = state.wishlistIds.includes(propertyId);
      const updatedWishlist = exists
        ? state.wishlistIds.filter((id) => id !== propertyId)
        : [...state.wishlistIds, propertyId];
      return { wishlistIds: updatedWishlist };
    });
  },

  isWishlisted: (propertyId: string) => {
    return get().wishlistIds.includes(propertyId);
  },

  getPropertyById: (id: string) => {
    return get().properties.find((p) => p.id === id);
  },

  addProperty: async (newPropData) => {
    let landlordId = newPropData.landlord_id;
    
    // Check if landlordId is missing or mock string
    if (!landlordId || !landlordId.includes('-')) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        landlordId = authData.user.id;
      }
    }

    if (!landlordId || !landlordId.includes('-')) {
      Alert.alert('Sign In Required', 'Please sign in to your landlord account to publish properties.');
      throw new Error('Valid landlord UUID required to save property.');
    }

    try {
      const insertPayload = {
        landlord_id: landlordId,
        hunter_id: newPropData.hunter_id || null,
        title: newPropData.title,
        description: newPropData.description,
        price: newPropData.price,
        currency: newPropData.currency || 'KES',
        location: newPropData.location,
        city: newPropData.city || 'Nairobi',
        latitude: newPropData.latitude || -1.286389,
        longitude: newPropData.longitude || 36.817223,
        images: newPropData.images || [],
        bedrooms: newPropData.bedrooms || 1,
        bathrooms: newPropData.bathrooms || 1,
        amenities: newPropData.amenities || [],
        status: newPropData.status || 'Available',
        is_verified: newPropData.is_verified || false,
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('Supabase property insert error:', error.message, error.details);
        Alert.alert('Database Error', error.message || 'Could not save property to database.');
        throw error;
      }

      if (data) {
        const addedProp = data as Property;
        set((state) => ({
          properties: [addedProp, ...state.properties],
        }));
        return addedProp;
      }
    } catch (e: any) {
      console.error('Property save error:', e);
      throw e;
    }

    const fallbackTemp: Property = {
      ...newPropData,
      landlord_id: landlordId,
      id: `p_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return fallbackTemp;
  },

  updatePropertyStatus: async (propertyId, status) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, status, updated_at: new Date().toISOString() } : p
      ),
    }));

    try {
      await supabase
        .from('properties')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', propertyId);
    } catch (e) {}
  },

  verifyLead: (leadId) => {
    set((state) => {
      const updatedLeads = state.hunterLeads.map((lead) => {
        if (lead.id === leadId) {
          const updatedProp = lead.property
            ? { ...lead.property, is_verified: true }
            : undefined;
          return {
            ...lead,
            status: 'Verified' as const,
            property: updatedProp,
          };
        }
        return lead;
      });

      const targetLead = state.hunterLeads.find((l) => l.id === leadId);
      let updatedProps = state.properties;
      if (targetLead?.property_id) {
        updatedProps = state.properties.map((p) =>
          p.id === targetLead.property_id ? { ...p, is_verified: true } : p
        );
      }

      return {
        hunterLeads: updatedLeads,
        properties: updatedProps,
      };
    });
  },

  bookTour: (propertyId, date, time) => {
    const prop = get().properties.find((p) => p.id === propertyId);
    const newBooking: Booking = {
      id: `b_${Date.now()}`,
      client_id: 'u1',
      property_id: propertyId,
      product_id: null,
      service_id: null,
      move_in_date: date,
      status: 'Confirmed',
      total_amount: prop ? prop.price : 0,
      currency: 'KES',
      notes: `Viewing scheduled for ${date} at ${time}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      bookings: [newBooking, ...state.bookings],
    }));
  },

  rentProperty: (propertyId, totalAmount, notes) => {
    const newBooking: Booking = {
      id: `rent_${Date.now()}`,
      client_id: 'u1',
      property_id: propertyId,
      product_id: null,
      service_id: null,
      move_in_date: new Date().toISOString().split('T')[0],
      status: 'In_Progress',
      total_amount: totalAmount,
      currency: 'KES',
      notes: notes || 'Lease agreement signed and initial deposit held in Escrow',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      bookings: [newBooking, ...state.bookings],
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, status: 'Rented' as const } : p
      ),
    }));

    return newBooking;
  },
}));
