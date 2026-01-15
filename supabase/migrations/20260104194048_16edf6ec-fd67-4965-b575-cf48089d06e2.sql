-- Create storage bucket for NGO bills
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ngo-bills', 'ngo-bills', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Create table for bill validations
CREATE TABLE public.bill_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id),
  ngo_id UUID REFERENCES public.ngos(id) NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  vendor_name TEXT,
  bill_date DATE,
  ai_validation_status TEXT DEFAULT 'pending' CHECK (ai_validation_status IN ('pending', 'valid', 'invalid', 'requires_review')),
  ai_validation_notes TEXT,
  ai_confidence_score DECIMAL(3,2),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bill_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_validations
CREATE POLICY "NGOs can view their own bill validations"
ON public.bill_validations FOR SELECT
USING (ngo_id IN (SELECT id FROM public.ngos WHERE user_id = auth.uid()));

CREATE POLICY "NGOs can insert their own bill validations"
ON public.bill_validations FOR INSERT
WITH CHECK (ngo_id IN (SELECT id FROM public.ngos WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all bill validations"
ON public.bill_validations FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bill validations"
ON public.bill_validations FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Storage policies for ngo-bills bucket
CREATE POLICY "NGOs can upload their own bills"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ngo-bills' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "NGOs can view their own bills"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ngo-bills' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all bills"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ngo-bills' AND
  public.is_admin(auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_bill_validations_updated_at
BEFORE UPDATE ON public.bill_validations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();