-- Allow admins to update complaints (for status changes and resolutions)
CREATE POLICY "Admins can update complaints"
ON public.complaints
FOR UPDATE
USING (is_admin(auth.uid()));