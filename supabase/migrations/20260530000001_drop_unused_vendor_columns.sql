-- Drop unused columns from vendors table
-- contact_person and phone_number were migrated to the employees table
-- in 20260522152312_add_employees_table.sql and are no longer used
ALTER TABLE public.vendors DROP COLUMN IF EXISTS contact_person;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS phone_number;
