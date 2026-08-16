import { create } from 'zustand';
import { Property, HunterLead, Booking } from '../lib/database.types';
import { supabase } from '../lib/supabase';
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
  fetchWishlist: () => Promise<void>;
  
  // Wishlist actions
  toggleWishlist: (propertyId: string) => Promise<void>;
  isWishlisted: (propertyId: string) => boolean;

  // Property management actions
  getPropertyById: (id: string) => Property | undefined;
  addProperty: (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => Promise<Property>;
  updateProperty: (propertyId: string, updates: Partial<Omit<Property, 'id' | 'created_at'>>) => Promise<Property>;
  deleteProperty: (propertyId: string) => Promise<void>;
  updatePropertyStatus: (propertyId: string, status: Property['status']) => Promise<void>;

  // Hunter actions
  verifyLead: (leadId: string) => Promise<void>;
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
  unlockPropertyAccess: (leadId: string) => Promise<void>;
  claimBountyPayout: (leadId: string, mpesaPhone: string) => Promise<void>;

  // Booking & Rental actions
  bookTour: (propertyId: string, date: string, notes?: string) => Promise<Booking>;
  rentProperty: (propertyId: string, totalAmount: number, notes?: string) => Promise<Booking>;
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

      if (error) throw error;
      set({ properties: sanitizedProps, hunterLeads: sanitizedLeads, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  fetchWishlist: async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      set({ wishlistIds: [] });
      return;
    }
    const { data, error } = await supabase
      .from('wishlists')
      .select('property_id')
      .eq('user_id', authData.user.id)
      .not('property_id', 'is', null);
    if (error) throw error;
    set({ wishlistIds: (data || []).map((item) => item.property_id).filter(Boolean) as string[] });
  },

  toggleWishlist: async (propertyId: string) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Sign in to save properties to your wishlist.');
    const exists = get().wishlistIds.includes(propertyId);
    const query = exists
      ? supabase.from('wishlists').delete().eq('user_id', authData.user.id).eq('property_id', propertyId)
      : supabase.from('wishlists').insert({ user_id: authData.user.id, property_id: propertyId });
    const { error } = await query;
    if (error) throw error;
    set((state) => ({
      wishlistIds: exists
        ? state.wishlistIds.filter((id) => id !== propertyId)
        : [...state.wishlistIds, propertyId],
    }));
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

    throw new Error('The property was not saved.');
  },

  updateProperty: async (propertyId, updates) => {
    const updatedAt = new Date().toISOString();
    const payload = {
      ...updates,
      updated_at: updatedAt,
    };

    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', propertyId)
      .select()
      .single();
    if (error || !data) throw error || new Error('Property update failed.');
    const updatedProp = data as Property;
    set((state) => ({
      properties: state.properties.map((p) => p.id === propertyId ? updatedProp : p),
    }));
    return updatedProp;
  },

  deleteProperty: async (propertyId) => {
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) throw error;
    set((state) => ({ properties: state.properties.filter((p) => p.id !== propertyId) }));
  },

  updatePropertyStatus: async (propertyId, status) => {
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('properties')
      .update({ status, updated_at: updatedAt })
      .eq('id', propertyId);
    if (error) throw error;
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, status, updated_at: updatedAt } : p
      ),
    }));
  },

  verifyLead: async (leadId) => {
    const targetLead = get().hunterLeads.find((lead) => lead.id === leadId);
    if (!targetLead) throw new Error('Lead not found.');
    const { error: leadError } = await supabase
      .from('hunter_leads').update({ status: 'Verified' }).eq('id', leadId);
    if (leadError) throw leadError;
    const { error: propertyError } = await supabase
      .from('properties').update({ is_verified: true }).eq('id', targetLead.property_id);
    if (propertyError) throw propertyError;
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
    const propertyPayload = {
      landlord_id: newLeadData.hunterId,
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
    };

    const { data: propertyData, error: propertyError } = await supabase
      .from('properties').insert(propertyPayload).select().single();
    if (propertyError || !propertyData) throw propertyError || new Error('Property lead could not be saved.');
    const newProperty = propertyData as Property;
    const { data: leadData, error: leadError } = await supabase.from('hunter_leads').insert({
      hunter_id: newLeadData.hunterId,
      property_id: newProperty.id,
      status: 'New',
      bounty_amount: newLeadData.bountyAmount || 4000,
      currency: 'KES',
      notes: newLeadData.notes || 'Off-market lead sourced on-ground.',
    }).select().single();
    if (leadError || !leadData) {
      await supabase.from('properties').delete().eq('id', newProperty.id);
      throw leadError || new Error('Lead could not be saved.');
    }
    const newLead = { ...(leadData as HunterLead), property: newProperty };

    set((state) => ({
      properties: [newProperty, ...state.properties],
      hunterLeads: [newLead, ...state.hunterLeads],
    }));

    return newLead;
  },

  unlockPropertyAccess: async (leadId) => {
    const { error } = await supabase.from('hunter_leads').update({ status: 'Booked' }).eq('id', leadId);
    if (error) throw error;
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
    throw new Error('M-PESA payouts require a configured payment provider and cannot be simulated.');
  },

  bookTour: async (propertyId, date, notes) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Sign in to schedule a viewing.');
    const prop = get().properties.find((p) => p.id === propertyId);
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + (date.toLowerCase().includes('tomorrow') ? 1 : 2));
    const payload = {
      client_id: authData.user.id,
      property_id: propertyId,
      product_id: null,
      service_id: null,
      move_in_date: scheduledDate.toISOString().slice(0, 10),
      status: 'Pending',
      total_amount: prop ? prop.price : 0,
      currency: 'KES',
      notes: `Viewing requested for ${date}${notes ? ` — ${notes}` : ''}`,
    };
    const { data, error } = await supabase.from('bookings').insert(payload).select().single();
    if (error || !data) throw error || new Error('Viewing request failed.');
    const newBooking = data as Booking;
    set((state) => ({
      bookings: [newBooking, ...state.bookings],
    }));
    return newBooking;
  },

  rentProperty: async (propertyId, totalAmount, notes) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Sign in to request this property.');
    const payload = {
      client_id: authData.user.id,
      property_id: propertyId,
      product_id: null,
      service_id: null,
      move_in_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      total_amount: totalAmount,
      currency: 'KES',
      notes: notes || 'Rental and escrow payment requested',
    };
    const { data, error } = await supabase.from('bookings').insert(payload).select().single();
    if (error || !data) throw error || new Error('Rental request failed.');
    const newBooking = data as Booking;

    set((state) => ({
      bookings: [newBooking, ...state.bookings],
    }));

    return newBooking;
  },
}));
