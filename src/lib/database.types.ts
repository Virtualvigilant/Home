// Supabase database types for the Home App

export type UserRole = 'client' | 'hunter' | 'landlord' | 'retailer' | 'mover' | 'admin';

export type PropertyStatus = 'Available' | 'Pending_Escrow' | 'Rented';

export type EscrowStatus = 'Held_In_Escrow' | 'Released' | 'Refunded';

export type BookingStatus = 'Pending' | 'Confirmed' | 'In_Progress' | 'Completed' | 'Cancelled';

export type LeadStatus = 'New' | 'Verified' | 'Booked' | 'Expired';

export type ServiceType = 'Mover' | 'Cleaner' | 'Furniture_Bundle' | 'Setup';

export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  requested_role?: UserRole | null;
  role_approval_status?: ApprovalStatus;
  verification_status: boolean;
  location: string | null;
  city: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  hunter_id: string | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  status: PropertyStatus;
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  retailer_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  stock_count: number;
  is_featured: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  type: ServiceType;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  availability: boolean;
  rating: number;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  property_id: string | null;
  product_id: string | null;
  service_id: string | null;
  move_in_date: string | null;
  status: BookingStatus;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  booking_id: string;
  amount_paid: number;
  currency: string;
  escrow_status: EscrowStatus;
  release_date: string | null;
  dispute_flag: boolean;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  property_id: string | null;
  product_id: string | null;
  service_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  booking_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface HunterLead {
  id: string;
  hunter_id: string;
  property_id: string;
  status: LeadStatus;
  bounty_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: Property;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_id: string;
  target_type: 'property' | 'product' | 'service' | 'user';
  rating: number;
  comment: string | null;
  created_at: string;
}

export type HouseRequestStatus = 'Active' | 'Fulfilled' | 'Cancelled';

export interface HouseRequest {
  id: string;
  client_id: string;
  location: string;
  city: string;
  max_budget: number;
  min_budget?: number | null;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  move_in_date: string;
  amenities: string[];
  description: string;
  status: HouseRequestStatus;
  responses_count: number;
  created_at: string;
  updated_at: string;
  // Joined client profile
  client?: Profile;
}

