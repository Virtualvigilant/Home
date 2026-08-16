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

-- Role applications are separate from the effective role. Every new account
-- starts as a client until an administrator approves a specialist dashboard.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role user_role,
  ADD COLUMN IF NOT EXISTS role_approval_status TEXT NOT NULL DEFAULT 'approved';

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_approval_status_check
    CHECK (role_approval_status IN ('none', 'pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins view profiles" ON public.profiles;
CREATE POLICY "Users and admins view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'client'::user_role);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = id OR public.is_platform_admin());

-- Prevent browser clients from granting themselves roles through the REST API.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, avatar_url, phone, location, city, bio, updated_at)
  ON public.profiles TO authenticated;

-- Trigger to automatically create profile row when new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  parsed_requested_role user_role;
  raw_requested_role TEXT;
  clean_phone TEXT;
BEGIN
  raw_requested_role := NEW.raw_user_meta_data->>'requested_role';
  IF raw_requested_role IN ('hunter', 'landlord', 'retailer', 'mover') THEN
    parsed_requested_role := raw_requested_role::user_role;
  END IF;

  clean_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.profiles (
    id, email, display_name, phone, role, requested_role, role_approval_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1)),
    clean_phone,
    'client'::user_role,
    parsed_requested_role,
    CASE WHEN parsed_requested_role IS NULL THEN 'approved' ELSE 'pending' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    requested_role = COALESCE(public.profiles.requested_role, EXCLUDED.requested_role),
    role_approval_status = CASE
      WHEN public.profiles.role = 'client'::user_role AND EXCLUDED.requested_role IS NOT NULL
        THEN 'pending'
      ELSE public.profiles.role_approval_status
    END,
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

-- User and administrator workflows use SECURITY DEFINER functions so the
-- authorization fields stay server-controlled.
CREATE OR REPLACE FUNCTION public.request_role_upgrade(desired_role user_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF desired_role NOT IN ('hunter'::user_role, 'landlord'::user_role, 'retailer'::user_role, 'mover'::user_role) THEN
    RAISE EXCEPTION 'Invalid specialist role';
  END IF;

  UPDATE public.profiles
  SET requested_role = desired_role,
      role_approval_status = 'pending',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_access(
  target_user_id UUID,
  target_role user_role,
  approval TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF approval NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid approval status';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot change their own access';
  END IF;

  UPDATE public.profiles
  SET role = CASE WHEN approval = 'approved' THEN target_role ELSE 'client'::user_role END,
      requested_role = CASE WHEN approval = 'rejected' THEN NULL ELSE requested_role END,
      role_approval_status = approval,
      verification_status = CASE WHEN approval = 'approved' THEN TRUE ELSE verification_status END,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_verification(
  target_user_id UUID,
  verified BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  UPDATE public.profiles
  SET verification_status = verified, updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE public.kyc_submissions
  SET status = CASE WHEN verified THEN 'approved' ELSE 'rejected' END,
      reviewed_by = auth.uid(),
      reviewed_at = CURRENT_TIMESTAMP
  WHERE user_id = target_user_id AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.request_role_upgrade(user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_access(UUID, user_role, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_verification(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_role_upgrade(user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_access(UUID, user_role, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_verification(UUID, BOOLEAN) TO authenticated;

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
DROP POLICY IF EXISTS "Approved members insert own properties" ON public.properties;
CREATE POLICY "Landlords can insert own properties" ON public.properties FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Landlords & Hunters can update assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Owners update assigned properties" ON public.properties;
CREATE POLICY "Landlords & Hunters can update assigned properties" ON public.properties FOR UPDATE USING (true);

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
DROP POLICY IF EXISTS "Recipients mark messages read" ON public.messages;
CREATE POLICY "Recipients mark messages read" ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role,
  verification_status BOOLEAN,
  location TEXT,
  bio TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.phone, p.role,
         p.verification_status, p.location, p.bio
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;
REVOKE ALL ON FUNCTION public.get_public_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated;

-- Production authorization hardening for business data.
CREATE OR REPLACE FUNCTION public.has_approved_role(expected_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = expected_role
      AND role_approval_status = 'approved'
  );
$$;
REVOKE ALL ON FUNCTION public.has_approved_role(user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_approved_role(user_role) TO authenticated;

DROP POLICY IF EXISTS "Landlords can insert own properties" ON public.properties;
CREATE POLICY "Approved members insert own properties" ON public.properties
  FOR INSERT WITH CHECK (
    (auth.uid() = landlord_id AND public.has_approved_role('landlord'::user_role))
    OR
    (auth.uid() = hunter_id AND auth.uid() = landlord_id AND public.has_approved_role('hunter'::user_role))
  );
DROP POLICY IF EXISTS "Landlords & Hunters can update assigned properties" ON public.properties;
CREATE POLICY "Owners update assigned properties" ON public.properties
  FOR UPDATE USING (
    (auth.uid() = landlord_id AND public.has_approved_role('landlord'::user_role))
    OR (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role))
    OR public.is_platform_admin()
  ) WITH CHECK (
    (auth.uid() = landlord_id AND public.has_approved_role('landlord'::user_role))
    OR (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role))
    OR public.is_platform_admin()
  );
DROP POLICY IF EXISTS "Owners delete properties" ON public.properties;
CREATE POLICY "Owners delete properties" ON public.properties
  FOR DELETE USING (auth.uid() = landlord_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Retailers can manage own products" ON public.products;
DROP POLICY IF EXISTS "Retailers insert own products" ON public.products;
DROP POLICY IF EXISTS "Retailers update own products" ON public.products;
DROP POLICY IF EXISTS "Retailers delete own products" ON public.products;
CREATE POLICY "Retailers insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = retailer_id AND public.has_approved_role('retailer'::user_role));
CREATE POLICY "Retailers update own products" ON public.products
  FOR UPDATE USING (auth.uid() = retailer_id AND public.has_approved_role('retailer'::user_role))
  WITH CHECK (auth.uid() = retailer_id AND public.has_approved_role('retailer'::user_role));
CREATE POLICY "Retailers delete own products" ON public.products
  FOR DELETE USING (auth.uid() = retailer_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Providers insert own services" ON public.services;
DROP POLICY IF EXISTS "Providers update own services" ON public.services;
DROP POLICY IF EXISTS "Providers delete own services" ON public.services;
CREATE POLICY "Providers insert own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers update own services" ON public.services
  FOR UPDATE USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers delete own services" ON public.services
  FOR DELETE USING (auth.uid() = provider_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Booking parties view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Booking providers update status" ON public.bookings;
DROP POLICY IF EXISTS "Clients cancel pending bookings" ON public.bookings;
CREATE POLICY "Booking parties view bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.landlord_id = auth.uid() OR p.hunter_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.retailer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid())
    OR public.is_platform_admin()
  );
CREATE POLICY "Booking providers update status" ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.landlord_id = auth.uid() OR p.hunter_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.retailer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid())
    OR public.is_platform_admin()
  );
CREATE POLICY "Clients cancel pending bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = client_id AND status = 'Pending'::booking_status)
  WITH CHECK (auth.uid() = client_id AND status = 'Cancelled'::booking_status);

DROP POLICY IF EXISTS "Hunters manage own leads" ON public.hunter_leads;
DROP POLICY IF EXISTS "Hunters insert own leads" ON public.hunter_leads;
DROP POLICY IF EXISTS "Hunters view own leads" ON public.hunter_leads;
DROP POLICY IF EXISTS "Hunters update own leads" ON public.hunter_leads;
DROP POLICY IF EXISTS "Hunters delete own leads" ON public.hunter_leads;
CREATE POLICY "Hunters insert own leads" ON public.hunter_leads
  FOR INSERT WITH CHECK (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role));
CREATE POLICY "Hunters view own leads" ON public.hunter_leads
  FOR SELECT USING (auth.uid() = hunter_id OR public.is_platform_admin());
CREATE POLICY "Hunters update own leads" ON public.hunter_leads
  FOR UPDATE USING (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role));
CREATE POLICY "Hunters delete own leads" ON public.hunter_leads
  FOR DELETE USING (auth.uid() = hunter_id OR public.is_platform_admin());

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_property_unique
  ON public.wishlists(user_id, property_id) WHERE property_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_unique
  ON public.wishlists(user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_service_unique
  ON public.wishlists(user_id, service_id) WHERE service_id IS NOT NULL;

DO $$ BEGIN ALTER TABLE public.properties ADD CONSTRAINT properties_price_positive CHECK (price > 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.properties ADD CONSTRAINT properties_bedrooms_valid CHECK (bedrooms >= 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.properties ADD CONSTRAINT properties_bathrooms_valid CHECK (bathrooms >= 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.products ADD CONSTRAINT products_price_positive CHECK (price > 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.products ADD CONSTRAINT products_stock_nonnegative CHECK (stock_count >= 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.services ADD CONSTRAINT services_price_nonnegative CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.bookings ADD CONSTRAINT bookings_amount_nonnegative CHECK (total_amount >= 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.bookings ADD CONSTRAINT bookings_single_subject CHECK (
  num_nonnulls(property_id, product_id, service_id) = 1
); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Durable listing media. Files are public to support marketplace cards, while
-- writes are restricted to the authenticated user's own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-images', 'property-images', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-images', 'product-images', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public marketplace images" ON storage.objects;
CREATE POLICY "Public marketplace images" ON storage.objects FOR SELECT
  USING (bucket_id IN ('property-images', 'product-images'));
DROP POLICY IF EXISTS "Members upload marketplace images" ON storage.objects;
CREATE POLICY "Members upload marketplace images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('property-images', 'product-images')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
DROP POLICY IF EXISTS "Members update own marketplace images" ON storage.objects;
CREATE POLICY "Members update own marketplace images" ON storage.objects FOR UPDATE TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::TEXT)
  WITH CHECK ((storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Members delete own marketplace images" ON storage.objects;
CREATE POLICY "Members delete own marketplace images" ON storage.objects FOR DELETE TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Members upload own KYC documents" ON storage.objects;
CREATE POLICY "Members upload own KYC documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Members and admins read KYC documents" ON storage.objects;
CREATE POLICY "Members and admins read KYC documents" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_platform_admin())
  );
DROP POLICY IF EXISTS "Members delete pending KYC documents" ON storage.objects;
CREATE POLICY "Members delete pending KYC documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id', 'passport', 'alien_id')),
  id_number TEXT NOT NULL,
  document_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members submit own KYC" ON public.kyc_submissions;
CREATE POLICY "Members submit own KYC" ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
DROP POLICY IF EXISTS "Members and admins view KYC" ON public.kyc_submissions;
CREATE POLICY "Members and admins view KYC" ON public.kyc_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin());
DROP POLICY IF EXISTS "Admins review KYC" ON public.kyc_submissions;
CREATE POLICY "Admins review KYC" ON public.kyc_submissions FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE UNIQUE INDEX IF NOT EXISTS kyc_one_pending_submission_per_user
  ON public.kyc_submissions(user_id) WHERE status = 'pending';
