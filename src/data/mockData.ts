// Production data store — initial empty state for live production usage
import { Property, Product, Service, Profile, HunterLead } from '../lib/database.types';

export const mockUsers: Profile[] = [];

export const mockProperties: Property[] = [];

export const mockProducts: Product[] = [];

export const mockServices: Service[] = [];

export const mockHunterLeads: HunterLead[] = [];

export const mockWishlist: any[] = [];

export const mockTransactions: any[] = [];

export const serviceCategories = [
  { id: 'cat_mover', name: 'Mover', icon: 'bus', count: 0 },
  { id: 'cat_cleaner', name: 'Cleaner', icon: 'sparkles', count: 0 },
  { id: 'cat_bundle', name: 'Furniture Bundle', icon: 'bed', count: 0 },
  { id: 'cat_setup', name: 'Setup & Assembly', icon: 'construct', count: 0 },
];
