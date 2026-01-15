-- Add trust_score and risk_score columns to existing tables
ALTER TABLE public.ngos 
ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS impact_metrics jsonb DEFAULT '{"people_helped": 0, "meals_served": 0, "medicines_delivered": 0, "shelters_provided": 0}'::jsonb;

ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_categories text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_redemptions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_volume numeric DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '[]'::jsonb;

-- Create relief_locations table for Help Map
CREATE TABLE IF NOT EXISTS public.relief_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    location_type text NOT NULL CHECK (location_type IN ('relief_camp', 'food_point', 'medical_store', 'shelter')),
    address text NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    disaster_id uuid REFERENCES public.disasters(id),
    contact_phone text,
    operating_hours text,
    capacity integer,
    current_occupancy integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.relief_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active relief locations"
ON public.relief_locations FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage relief locations"
ON public.relief_locations FOR ALL
USING (is_admin(auth.uid()));

-- Create grievances table
CREATE TABLE IF NOT EXISTS public.grievances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    complainant_id uuid REFERENCES auth.users(id),
    grievance_type text NOT NULL CHECK (grievance_type IN ('overpricing', 'refusal_of_service', 'fraud', 'other')),
    merchant_id uuid REFERENCES public.merchants(id),
    ngo_id uuid REFERENCES public.ngos(id),
    description text NOT NULL,
    evidence_urls text[] DEFAULT '{}',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    resolution text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grievances"
ON public.grievances FOR SELECT
USING (complainant_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create grievances"
ON public.grievances FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update grievances"
ON public.grievances FOR UPDATE
USING (is_admin(auth.uid()));

-- Create volunteer_signups table
CREATE TABLE IF NOT EXISTS public.volunteer_signups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL,
    mobile text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    skills text[] DEFAULT '{}',
    availability text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'inactive')),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit volunteer signup"
ON public.volunteer_signups FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage volunteers"
ON public.volunteer_signups FOR ALL
USING (is_admin(auth.uid()));

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name text,
    donor_email text,
    donor_phone text,
    amount numeric NOT NULL,
    disaster_id uuid REFERENCES public.disasters(id),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    payment_reference text,
    is_anonymous boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create donations"
ON public.donations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all donations"
ON public.donations FOR SELECT
USING (is_admin(auth.uid()));

-- Create impact_stories table
CREATE TABLE IF NOT EXISTS public.impact_stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    story text NOT NULL,
    location text,
    disaster_id uuid REFERENCES public.disasters(id),
    image_url text,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.impact_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published stories"
ON public.impact_stories FOR SELECT
USING (is_published = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage stories"
ON public.impact_stories FOR ALL
USING (is_admin(auth.uid()));

-- Create duplicate_claims table for fraud detection
CREATE TABLE IF NOT EXISTS public.duplicate_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhaar_hash text NOT NULL,
    wallet_addresses text[] NOT NULL,
    flagged_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'flagged' CHECK (status IN ('flagged', 'investigating', 'verified', 'dismissed')),
    notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone
);

ALTER TABLE public.duplicate_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage duplicate claims"
ON public.duplicate_claims FOR ALL
USING (is_admin(auth.uid()));

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;