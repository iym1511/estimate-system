-- Create vendors table
CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text NOT NULL,
    contact_person text NOT NULL,
    phone_number text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create buildings table (Managed by vendors)
CREATE TABLE public.buildings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text NOT NULL,
    password text,
    created_at timestamptz DEFAULT now()
);

-- Create quotes table (Related to buildings)
CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id uuid REFERENCES public.buildings(id) ON DELETE CASCADE,
    room_number text NOT NULL,
    work_date date NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    is_paid boolean NOT NULL DEFAULT false,
    remarks text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create policies (Public access for prototype)
CREATE POLICY "Allow all for everyone vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for everyone buildings" ON public.buildings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for everyone quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);
