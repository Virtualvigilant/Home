-- 003_house_requests.sql
-- Uber-Style Housing Acquisition Requests (Reverse Marketplace)

DO $$ BEGIN
  CREATE TYPE house_request_status AS ENUM ('Active', 'Fulfilled', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.house_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nairobi',
  max_budget DECIMAL(12, 2) NOT NULL,
  min_budget DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'KES',
  bedrooms INT NOT NULL DEFAULT 1,
  bathrooms INT DEFAULT 1,
  move_in_date VARCHAR(50) NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  description TEXT,
  status house_request_status DEFAULT 'Active',
  responses_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for house_requests
ALTER TABLE public.house_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "House requests viewable by everyone" ON public.house_requests;
CREATE POLICY "House requests viewable by everyone" ON public.house_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients insert own house requests" ON public.house_requests;
CREATE POLICY "Clients insert own house requests" ON public.house_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients update own house requests" ON public.house_requests;
CREATE POLICY "Clients update own house requests" ON public.house_requests
  FOR UPDATE USING (auth.uid() = client_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = client_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Clients delete own house requests" ON public.house_requests;
CREATE POLICY "Clients delete own house requests" ON public.house_requests
  FOR DELETE USING (auth.uid() = client_id OR public.is_platform_admin());
