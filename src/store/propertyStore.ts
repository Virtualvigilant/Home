import { create } from 'zustand';
import { Property, HunterLead, Booking } from '../lib/database.types';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { getValidPropertyImages } from '../lib/imageUtils';
import { mockProperties, mockHunterLeads } from '../data/mockData';

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
  updateProperty: (propertyId: string, updates: Partial<Omit<Property, 'id' | 'created_at'>>) => Promise<Property>;
  deleteProperty: (propertyId: string) => Promise<void>;
  updatePropertyStatus: (propertyId: string, status: Property['status']) => Promise<void>;

  // Hunter actions
  verifyLead: (leadId: string) => void;
  addHunterLead: (data: {
    title: string;
    location: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    description?: string;
    images: string[];
    bountyAmount: number;
    latitude?: number;
    longitude?: number;
    hunterId: string;
    notes?: string;
  }) => Promise<HunterLead>;
  unlockPropertyAccess: (leadId: string) => void;
  claimBountyPayout: (leadId: string, mpesaPhone: string) => Promise<void>;

  // Booking & Rental actions
  bookTour: (propertyId: string, date: string, time: string) => void;
  rentProperty: (propertyId: string, totalAmount: number, notes?: string) => Booking;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: mockProperties,
  wishlistIds: [],
  hunterLeads: mockHunterLeads,
  bookings: [],
  loading: false,

  fetchProperties: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: leadsData } = await supabase
        .from('hunter_leads')
        .select('*, property:properties(*)');

      const sanitizedProps = !error && data
        ? (data as Property[]).map((p) => ({
            ...p,
            images: getValidPropertyImages(p.images),
          }))
        : [];

      const sanitizedLeads = leadsData && Array.isArray(leadsData)
        ? (leadsData as HunterLead[]).map((l) => ({
            ...l,
            property: l.property ? { ...l.property, images: getValidPropertyImages(l.property.images) } : undefined,
          }))
        : get().hunterLeads;

      set({ properties: sanitizedProps, hunterLeads: sanitizedLeads, loading: false });
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

  updateProperty: async (propertyId, updates) => {
    const updatedAt = new Date().toISOString();
    const payload = {
      ...updates,
      updated_at: updatedAt,
    };

    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, ...payload } : p
      ),
    }));

    try {
      const { data, error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) {
        console.error('Supabase property update error:', error.message);
      } else if (data) {
        const updatedProp = data as Property;
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId ? updatedProp : p
          ),
        }));
        return updatedProp;
      }
    } catch (e) {
      console.error('Update property error:', e);
    }

    const currentProp = get().properties.find((p) => p.id === propertyId);
    return (currentProp || { id: propertyId, ...updates }) as Property;
  },

  deleteProperty: async (propertyId) => {
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== propertyId),
    }));

    try {
      await supabase.from('properties').delete().eq('id', propertyId);
    } catch (e) {
      console.error('Delete property error:', e);
    }
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

  addHunterLead: async (newLeadData) => {
    const propId = `p_scout_${Date.now()}`;
    const newProperty: Property = {
      id: propId,
      landlord_id: 'u3',
      hunter_id: newLeadData.hunterId,
      title: newLeadData.title,
      description: newLeadData.description || 'Off-market vacant apartment sourced on-ground by Scout.',
      price: newLeadData.price,
      currency: 'KES',
      location: newLeadData.location,
      city: 'Nairobi',
      latitude: newLeadData.latitude || -1.286389,
      longitude: newLeadData.longitude || 36.817223,
      images: getValidPropertyImages(newLeadData.images),
      bedrooms: newLeadData.bedrooms || 1,
      bathrooms: newLeadData.bathrooms || 1,
      amenities: ['24/7 Security & CCTV', 'Borehole / 24/7 Water', 'Dedicated Parking'],
      status: 'Available',
      is_verified: false,
      rating: 5.0,
      review_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const leadId = `lead_${Date.now()}`;
    const newLead: HunterLead = {
      id: leadId,
      hunter_id: newLeadData.hunterId,
      property_id: propId,
      status: 'New',
      bounty_amount: newLeadData.bountyAmount || 4000,
      currency: 'KES',
      notes: newLeadData.notes || 'Off-market lead sourced on-ground.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      property: newProperty,
    };

    set((state) => ({
      properties: [newProperty, ...state.properties],
      hunterLeads: [newLead, ...state.hunterLeads],
    }));

    try {
      await supabase.from('properties').insert(newProperty);
      await supabase.from('hunter_leads').insert({
        id: leadId,
        hunter_id: newLeadData.hunterId,
        property_id: propId,
        status: 'New',
        bounty_amount: newLeadData.bountyAmount,
        currency: 'KES',
        notes: newLeadData.notes,
      });
    } catch (e) {}

    return newLead;
  },

  unlockPropertyAccess: (leadId) => {
    set((state) => ({
      hunterLeads: state.hunterLeads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: 'Booked' as const,
              notes: 'Property unlocked on move-in day. Bounty released to wallet.',
            }
          : lead
      ),
    }));
  },

  claimBountyPayout: async (leadId, mpesaPhone) => {
    set((state) => ({
      hunterLeads: state.hunterLeads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              notes: `Bounty paid out instantly to M-PESA (${mpesaPhone})`,
            }
          : lead
      ),
    }));
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
