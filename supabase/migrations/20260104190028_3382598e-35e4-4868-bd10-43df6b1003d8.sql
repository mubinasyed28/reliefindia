-- Create enum types for roles and statuses
CREATE TYPE public.user_role AS ENUM ('admin', 'ngo', 'merchant', 'citizen');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.disaster_status AS ENUM ('active', 'completed', 'frozen');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'synced');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'citizen',
  full_name TEXT,
  mobile TEXT,
  aadhaar_last_four TEXT,
  wallet_address TEXT UNIQUE,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  qr_code TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NGO table
CREATE TABLE public.ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  registration_id TEXT UNIQUE,
  verification_token TEXT UNIQUE,
  ngo_name TEXT NOT NULL,
  legal_registration_number TEXT NOT NULL,
  government_certificates TEXT[],
  office_address TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  board_members JSONB,
  tax_documents TEXT[],
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  office_photos TEXT[],
  relief_work_proof TEXT[],
  compliance_accepted BOOLEAN DEFAULT false,
  status verification_status DEFAULT 'pending',
  rejection_reason TEXT,
  wallet_address TEXT UNIQUE,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchants table
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  merchant_token TEXT UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  aadhaar_number TEXT NOT NULL,
  aadhaar_verified BOOLEAN DEFAULT false,
  mobile TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  shop_address TEXT NOT NULL,
  shop_documents TEXT[],
  shop_license TEXT,
  gst_number TEXT,
  wallet_address TEXT UNIQUE,
  is_active BOOLEAN DEFAULT false,
  activation_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disasters table
CREATE TABLE public.disasters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  affected_states TEXT[],
  total_tokens_allocated DECIMAL(15,2) DEFAULT 0,
  tokens_distributed DECIMAL(15,2) DEFAULT 0,
  spending_limit_per_user DECIMAL(15,2) DEFAULT 15000,
  status disaster_status DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tokens table (blockchain simulation)
CREATE TABLE public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES public.disasters(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('ngo', 'citizen', 'merchant')),
  owner_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  purpose TEXT,
  is_transferable BOOLEAN DEFAULT false,
  is_frozen BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  block_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE,
  disaster_id UUID REFERENCES public.disasters(id),
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  from_type TEXT NOT NULL,
  to_type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  purpose TEXT,
  bill_url TEXT,
  bill_verified BOOLEAN,
  bill_verification_notes TEXT,
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_offline BOOLEAN DEFAULT false,
  status transaction_status DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline ledger table
CREATE TABLE public.offline_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id),
  citizen_wallet TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  qr_signature TEXT NOT NULL,
  local_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification requests table
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ngo', 'merchant', 'citizen')),
  entity_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  status verification_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create beneficiaries table (citizens linked to disasters)
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES public.disasters(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tokens_allocated DECIMAL(15,2) DEFAULT 0,
  tokens_spent DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(disaster_id, citizen_id)
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_id UUID REFERENCES auth.users(id),
  complaint_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for NGOs
CREATE POLICY "NGOs can view own data" ON public.ngos
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Anyone can insert NGO registration" ON public.ngos
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Admins can view all NGOs" ON public.ngos
  FOR SELECT USING (public.is_admin(auth.uid()));
  
CREATE POLICY "Admins can update NGOs" ON public.ngos
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for merchants
CREATE POLICY "Merchants can view own data" ON public.merchants
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Anyone can insert merchant registration" ON public.merchants
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Merchants can update own data" ON public.merchants
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all merchants" ON public.merchants
  FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for disasters
CREATE POLICY "Anyone can view active disasters" ON public.disasters
  FOR SELECT USING (status = 'active' OR public.is_admin(auth.uid()));
  
CREATE POLICY "Admins can manage disasters" ON public.disasters
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    from_wallet IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
    OR to_wallet IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
  
CREATE POLICY "Authenticated users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for beneficiaries
CREATE POLICY "Citizens can view own beneficiary status" ON public.beneficiaries
  FOR SELECT USING (
    citizen_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- RLS Policies for complaints
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (complainant_id = auth.uid() OR public.is_admin(auth.uid()));
  
CREATE POLICY "Users can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = complainant_id);

-- RLS for tokens
CREATE POLICY "Users can view own tokens" ON public.tokens
  FOR SELECT USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- RLS for offline ledger
CREATE POLICY "Merchants can manage own offline ledger" ON public.offline_ledger
  FOR ALL USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

-- RLS for audit logs (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));
  
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS for verification requests
CREATE POLICY "Admins can manage verification requests" ON public.verification_requests
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create function to generate wallet address
CREATE OR REPLACE FUNCTION public.generate_wallet_address()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'RLX' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 32));
END;
$$;

-- Create function to generate transaction hash
CREATE OR REPLACE FUNCTION public.generate_transaction_hash()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN '0x' || md5(random()::text || clock_timestamp()::text);
END;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_ngos_updated_at BEFORE UPDATE ON public.ngos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_disasters_updated_at BEFORE UPDATE ON public.disasters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, wallet_address)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'citizen'),
    NEW.raw_user_meta_data->>'full_name',
    public.generate_wallet_address()
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();