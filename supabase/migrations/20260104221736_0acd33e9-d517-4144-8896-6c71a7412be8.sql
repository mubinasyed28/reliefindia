-- Allow NGOs to insert and update beneficiary records when issuing funds
CREATE POLICY "NGOs can insert beneficiaries when issuing funds"
ON public.beneficiaries
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM ngos WHERE status = 'verified'));

CREATE POLICY "NGOs can update beneficiaries when issuing funds"
ON public.beneficiaries
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM ngos WHERE status = 'verified'));