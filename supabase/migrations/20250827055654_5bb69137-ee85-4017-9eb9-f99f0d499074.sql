-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'maintenance_manager', 'operations_manager', 'user');

-- Create asset types enum
CREATE TYPE public.asset_type AS ENUM ('generator', 'solar_panel', 'battery', 'aps_board', 'router', 'rectifier', 'electronic_lock');

-- Create asset status enum
CREATE TYPE public.asset_status AS ENUM ('active', 'in_repair', 'retired');

-- Create movement status enum
CREATE TYPE public.movement_status AS ENUM ('pending', 'approved', 'rejected');

-- Create site revenue type enum
CREATE TYPE public.revenue_type AS ENUM ('colocated', 'safaricom_only', 'airtel_only');

-- Update sites table to include revenue type
ALTER TABLE public.sites ADD COLUMN revenue_type public.revenue_type NOT NULL DEFAULT 'colocated';

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number TEXT NOT NULL UNIQUE,
  asset_type public.asset_type NOT NULL,
  purchase_date DATE,
  installation_date DATE,
  status public.asset_status NOT NULL DEFAULT 'active',
  current_site_id UUID REFERENCES public.sites(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create asset movements table
CREATE TABLE public.asset_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  from_site_id UUID REFERENCES public.sites(id),
  to_site_id UUID NOT NULL REFERENCES public.sites(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status public.movement_status NOT NULL DEFAULT 'pending',
  maintenance_manager_approval BOOLEAN,
  operations_manager_approval BOOLEAN,
  maintenance_approved_by UUID REFERENCES auth.users(id),
  operations_approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on asset movements
ALTER TABLE public.asset_movements ENABLE ROW LEVEL SECURITY;

-- Create audit log table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for assets
CREATE POLICY "Everyone can view assets" ON public.assets
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage assets" ON public.assets
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'maintenance_manager', 'operations_manager')
  );

-- Create RLS policies for asset movements
CREATE POLICY "Everyone can view asset movements" ON public.asset_movements
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create movement requests" ON public.asset_movements
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can update movement approvals" ON public.asset_movements
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) IN ('maintenance_manager', 'operations_manager', 'admin')
  );

-- Create RLS policies for audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_movements_updated_at
  BEFORE UPDATE ON public.asset_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@profitloss.com' THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();