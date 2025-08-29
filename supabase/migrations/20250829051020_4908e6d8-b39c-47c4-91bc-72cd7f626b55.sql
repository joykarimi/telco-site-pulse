-- Update auth flow to be admin-only by disabling public signup
-- Create admin user creation system
-- Update existing handle_new_user function to only work for admin-created users

-- First, let's create a table to track admin-created users
CREATE TABLE public.pending_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  temporary_password TEXT NOT NULL,
  created_by UUID NOT NULL,
  is_activated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS on pending_users
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage pending users
CREATE POLICY "Admins can manage pending users" 
ON public.pending_users 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Update the handle_new_user function to check pending_users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending_user_data RECORD;
BEGIN
  -- Check if this user was created by an admin
  SELECT * INTO pending_user_data
  FROM public.pending_users 
  WHERE email = NEW.email AND NOT is_activated;
  
  IF pending_user_data IS NOT NULL THEN
    -- User was pre-created by admin, create profile with specified role
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (
      NEW.id,
      pending_user_data.full_name,
      pending_user_data.role
    );
    
    -- Mark as activated
    UPDATE public.pending_users 
    SET is_activated = true 
    WHERE email = NEW.email;
  ELSE
    -- Check if it's the main admin
    IF NEW.email = 'admin@profitloss.com' THEN
      INSERT INTO public.profiles (user_id, full_name, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'admin'::public.user_role
      );
    ELSE
      -- Unauthorized signup, delete the user
      DELETE FROM auth.users WHERE id = NEW.id;
      RAISE EXCEPTION 'Unauthorized signup. Please contact an administrator for account creation.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to generate temporary password
CREATE OR REPLACE FUNCTION public.generate_temp_password()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;