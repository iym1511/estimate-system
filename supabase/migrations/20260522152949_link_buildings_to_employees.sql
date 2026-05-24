-- Add employee_id to buildings
ALTER TABLE public.buildings ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Update RLS for employees if needed (already public for prototype)
