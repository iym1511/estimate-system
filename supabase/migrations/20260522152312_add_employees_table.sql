-- Create employees table
CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone_number text,
    created_at timestamptz DEFAULT now()
);

-- Migrate existing data from vendors to employees
INSERT INTO public.employees (vendor_id, name, phone_number)
SELECT id, contact_person, phone_number FROM public.vendors WHERE contact_person IS NOT NULL AND contact_person != '';

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for everyone employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
