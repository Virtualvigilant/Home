-- Home App Database Migration Schema v1.0
-- Supabase PostgreSQL Architecture

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'hunter', 'landlord', 'retailer', 'mover', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('Available', 'Pending_Escrow', 'Rented');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM ('Held_In_Escrow', 'Released', 'Refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('Pending', 'Confirmed', 'In_Progress', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('New', 'Verified', 'Booked', 'Expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('Mover', 'Cleaner', 'Furniture_Bundle', 'Setup');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'client',
  verification_status BOOLEAN DEFAULT FALSE,
  location TEXT,
  city TEXT DEFAULT 'Nairobi',
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

-- Trigger to automatically create profile row when new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  parsed_role user_role := 'client'::user_role;
  raw_role_str TEXT;
  clean_phone TEXT;
BEGIN
  raw_role_str := NEW.raw_user_meta_data->>'role';
  IF raw_role_str IS NOT NULL AND raw_role_str IN ('client', 'hunter', 'landlord', 'retailer', 'mover', 'admin') THEN
    parsed_role := raw_role_str::user_role;
  END IF;

  clean_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.profiles (id, email, display_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1)),
    clean_phone,
    parsed_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      split_part(NEW.email, '@', 1),
      'client'::user_role
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback safety to never block auth.users creation
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  location TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nairobi',
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  images TEXT[] DEFAULT '{}',
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  status property_status DEFAULT 'Available',
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Landlords can insert own properties" ON public.properties;
CREATE POLICY "Landlords can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords & Hunters can update assigned properties" ON public.properties;
CREATE POLICY "Landlords & Hunters can update assigned properties" ON public.properties FOR UPDATE USING (
  auth.uid() = landlord_id OR auth.uid() = hunter_id
);

-- 4. PRODUCTS (Marketplace) TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  images TEXT[] DEFAULT '{}',
  category VARCHAR(50) NOT NULL,
  stock_count INT DEFAULT 1,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Retailers can manage own products" ON public.products;
CREATE POLICY "Retailers can manage own products" ON public.products FOR ALL USING (auth.uid() = retailer_id);

-- 5. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type service_type NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  image_url TEXT,
  availability BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Services viewable by everyone" ON public.services;
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (true);

-- 6. BOOKINGS TABLE (Core Unified Cart)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  move_in_date DATE NOT NULL,
  status booking_status DEFAULT 'Pending',
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;
CREATE POLICY "Clients view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients insert own bookings" ON public.bookings;
CREATE POLICY "Clients insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 7. TRANSACTIONS TABLE (Escrow Engine)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount_paid DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  escrow_status escrow_status DEFAULT 'Held_In_Escrow',
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dispute_flag BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view transactions linked to their bookings" ON public.transactions;
CREATE POLICY "Users view transactions linked to their bookings" ON public.transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE public.bookings.id = public.transactions.booking_id
    AND public.bookings.client_id = auth.uid()
  )
);

-- Business Logic Trigger: Release date = move_in_date + 48 hours
CREATE OR REPLACE FUNCTION set_escrow_release_date()
RETURNS TRIGGER AS $$
BEGIN
  SELECT (move_in_date + INTERVAL '48 hours') INTO NEW.release_date
  FROM public.bookings
  WHERE id = NEW.booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_release_date ON public.transactions;
CREATE TRIGGER trigger_set_release_date
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION set_escrow_release_date();

-- 8. HUNTER LEADS TABLE
CREATE TABLE IF NOT EXISTS public.hunter_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  status lead_status DEFAULT 'New',
  bounty_amount DECIMAL(10, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'KES',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Hunter Leads
ALTER TABLE public.hunter_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hunters manage own leads" ON public.hunter_leads;
CREATE POLICY "Hunters manage own leads" ON public.hunter_leads FOR ALL USING (auth.uid() = hunter_id);

-- 9. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own wishlist" ON public.wishlists;
CREATE POLICY "Users view own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert into own wishlist" ON public.wishlists;
CREATE POLICY "Users insert into own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete from own wishlist" ON public.wishlists;
CREATE POLICY "Users delete from own wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- 10. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view messages sent or received" ON public.messages;
CREATE POLICY "Users view messages sent or received" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
