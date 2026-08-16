-- Forward-only production upgrade for databases that already applied 001.
-- Adds role approval, server-enforced authorization, durable media, KYC, and
-- the RLS rules required by the application workflows.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role user_role,
  ADD COLUMN IF NOT EXISTS role_approval_status TEXT NOT NULL DEFAULT 'approved';
DO $$ BEGIN ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_approval_status_check
  CHECK (role_approval_status IN ('none', 'pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role);
$$;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins view profiles" ON public.profiles;
CREATE POLICY "Users and admins view profiles" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_platform_admin());
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'client'::user_role);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = id OR public.is_platform_admin());
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, avatar_url, phone, location, city, bio, updated_at)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  ) VALUES (
    NEW.id, NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1)),
    clean_phone, 'client'::user_role, parsed_requested_role,
    CASE WHEN parsed_requested_role IS NULL THEN 'approved' ELSE 'pending' END
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    requested_role = COALESCE(public.profiles.requested_role, EXCLUDED.requested_role),
    role_approval_status = CASE
      WHEN public.profiles.role = 'client'::user_role AND EXCLUDED.requested_role IS NOT NULL THEN 'pending'
      ELSE public.profiles.role_approval_status
    END,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

CREATE OR REPLACE FUNCTION public.request_role_upgrade(desired_role user_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF desired_role NOT IN ('hunter'::user_role, 'landlord'::user_role, 'retailer'::user_role, 'mover'::user_role)
    THEN RAISE EXCEPTION 'Invalid specialist role'; END IF;
  UPDATE public.profiles SET requested_role = desired_role,
    role_approval_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_access(
  target_user_id UUID, target_role user_role, approval TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'Administrators cannot change their own access'; END IF;
  IF approval NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid approval status'; END IF;
  UPDATE public.profiles SET
    role = CASE WHEN approval = 'approved' THEN target_role ELSE 'client'::user_role END,
    requested_role = CASE WHEN approval = 'rejected' THEN NULL ELSE requested_role END,
    role_approval_status = approval,
    verification_status = CASE WHEN approval = 'approved' THEN TRUE ELSE verification_status END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_verification(target_user_id UUID, verified BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  UPDATE public.profiles SET verification_status = verified, updated_at = CURRENT_TIMESTAMP
    WHERE id = target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  UPDATE public.kyc_submissions SET
    status = CASE WHEN verified THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(), reviewed_at = CURRENT_TIMESTAMP
    WHERE user_id = target_user_id AND status = 'pending';
END;
$$;
REVOKE ALL ON FUNCTION public.request_role_upgrade(user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_access(UUID, user_role, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_verification(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_role_upgrade(user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_access(UUID, user_role, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_verification(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id UUID)
RETURNS TABLE (id UUID, display_name TEXT, avatar_url TEXT, phone TEXT, role user_role,
  verification_status BOOLEAN, location TEXT, bio TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.phone, p.role,
    p.verification_status, p.location, p.bio FROM public.profiles p WHERE p.id = profile_id;
$$;
REVOKE ALL ON FUNCTION public.get_public_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_approved_role(expected_role user_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND role = expected_role AND role_approval_status = 'approved');
$$;
REVOKE ALL ON FUNCTION public.has_approved_role(user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_approved_role(user_role) TO authenticated;

DROP POLICY IF EXISTS "Landlords can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Approved members insert own properties" ON public.properties;
CREATE POLICY "Approved members insert own properties" ON public.properties FOR INSERT WITH CHECK (
  (auth.uid() = landlord_id AND public.has_approved_role('landlord'::user_role)) OR
  (auth.uid() = hunter_id AND auth.uid() = landlord_id AND public.has_approved_role('hunter'::user_role))
);
DROP POLICY IF EXISTS "Landlords & Hunters can update assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Owners update assigned properties" ON public.properties;
CREATE POLICY "Owners update assigned properties" ON public.properties FOR UPDATE USING (
  (auth.uid() = landlord_id AND public.has_approved_role('landlord'::user_role)) OR
  (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role)) OR public.is_platform_admin()
) WITH CHECK (
  (auth.uid() = landlord_id AND public.has_approved_role('landlord'::user_role)) OR
  (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role)) OR public.is_platform_admin()
);
DROP POLICY IF EXISTS "Owners delete properties" ON public.properties;
CREATE POLICY "Owners delete properties" ON public.properties FOR DELETE
  USING (auth.uid() = landlord_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Retailers can manage own products" ON public.products;
DROP POLICY IF EXISTS "Retailers insert own products" ON public.products;
CREATE POLICY "Retailers insert own products" ON public.products FOR INSERT
  WITH CHECK (auth.uid() = retailer_id AND public.has_approved_role('retailer'::user_role));
DROP POLICY IF EXISTS "Retailers update own products" ON public.products;
CREATE POLICY "Retailers update own products" ON public.products FOR UPDATE
  USING (auth.uid() = retailer_id AND public.has_approved_role('retailer'::user_role))
  WITH CHECK (auth.uid() = retailer_id AND public.has_approved_role('retailer'::user_role));
DROP POLICY IF EXISTS "Retailers delete own products" ON public.products;
CREATE POLICY "Retailers delete own products" ON public.products FOR DELETE
  USING (auth.uid() = retailer_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Providers insert own services" ON public.services;
CREATE POLICY "Providers insert own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
DROP POLICY IF EXISTS "Providers update own services" ON public.services;
CREATE POLICY "Providers update own services" ON public.services FOR UPDATE
  USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
DROP POLICY IF EXISTS "Providers delete own services" ON public.services;
CREATE POLICY "Providers delete own services" ON public.services FOR DELETE
  USING (auth.uid() = provider_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Booking parties view bookings" ON public.bookings;
CREATE POLICY "Booking parties view bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = client_id OR
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.landlord_id = auth.uid() OR p.hunter_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.retailer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid()) OR
  public.is_platform_admin()
);
DROP POLICY IF EXISTS "Booking providers update status" ON public.bookings;
CREATE POLICY "Booking providers update status" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.landlord_id = auth.uid() OR p.hunter_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.retailer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid()) OR
  public.is_platform_admin()
);
DROP POLICY IF EXISTS "Clients cancel pending bookings" ON public.bookings;
CREATE POLICY "Clients cancel pending bookings" ON public.bookings FOR UPDATE
  USING (auth.uid() = client_id AND status = 'Pending'::booking_status)
  WITH CHECK (auth.uid() = client_id AND status = 'Cancelled'::booking_status);

DROP POLICY IF EXISTS "Hunters manage own leads" ON public.hunter_leads;
DROP POLICY IF EXISTS "Hunters insert own leads" ON public.hunter_leads;
CREATE POLICY "Hunters insert own leads" ON public.hunter_leads FOR INSERT
  WITH CHECK (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role));
DROP POLICY IF EXISTS "Hunters view own leads" ON public.hunter_leads;
CREATE POLICY "Hunters view own leads" ON public.hunter_leads FOR SELECT
  USING (auth.uid() = hunter_id OR public.is_platform_admin());
DROP POLICY IF EXISTS "Hunters update own leads" ON public.hunter_leads;
CREATE POLICY "Hunters update own leads" ON public.hunter_leads FOR UPDATE
  USING (auth.uid() = hunter_id AND public.has_approved_role('hunter'::user_role));
DROP POLICY IF EXISTS "Hunters delete own leads" ON public.hunter_leads;
CREATE POLICY "Hunters delete own leads" ON public.hunter_leads FOR DELETE
  USING (auth.uid() = hunter_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Recipients mark messages read" ON public.messages;
CREATE POLICY "Recipients mark messages read" ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_property_unique
  ON public.wishlists(user_id, property_id) WHERE property_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_unique
  ON public.wishlists(user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_service_unique
  ON public.wishlists(user_id, service_id) WHERE service_id IS NOT NULL;

DO $$ BEGIN ALTER TABLE public.bookings ADD CONSTRAINT bookings_single_subject
  CHECK (num_nonnulls(property_id, product_id, service_id) = 1);
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('property-images', 'property-images', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-images', 'product-images', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public marketplace images" ON storage.objects;
CREATE POLICY "Public marketplace images" ON storage.objects FOR SELECT
  USING (bucket_id IN ('property-images', 'product-images'));
DROP POLICY IF EXISTS "Members upload marketplace images" ON storage.objects;
CREATE POLICY "Members upload marketplace images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('property-images', 'product-images') AND (storage.foldername(name))[1] = auth.uid()::TEXT);
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
  USING (bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_platform_admin()));
DROP POLICY IF EXISTS "Members delete pending KYC documents" ON storage.objects;
CREATE POLICY "Members delete pending KYC documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
