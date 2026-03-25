-- Add policy for admins to read all driver documents
CREATE POLICY "Admins can read all driver documents"
ON driver_documents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Add policy for admins to update driver documents (for verification)
CREATE POLICY "Admins can update driver documents"
ON driver_documents FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));