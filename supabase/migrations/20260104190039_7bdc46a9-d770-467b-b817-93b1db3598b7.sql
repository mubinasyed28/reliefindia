-- Fix function search path for generate_wallet_address
CREATE OR REPLACE FUNCTION public.generate_wallet_address()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN 'RLX' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 32));
END;
$$;

-- Fix function search path for generate_transaction_hash
CREATE OR REPLACE FUNCTION public.generate_transaction_hash()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN '0x' || md5(random()::text || clock_timestamp()::text);
END;
$$;

-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;