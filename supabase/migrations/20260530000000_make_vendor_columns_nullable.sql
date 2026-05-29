-- Make contact_person and phone_number nullable in vendors table
-- These fields were migrated to the employees table in 20260522152312_add_employees_table.sql
ALTER TABLE public.vendors ALTER COLUMN contact_person DROP NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN phone_number DROP NOT NULL;
