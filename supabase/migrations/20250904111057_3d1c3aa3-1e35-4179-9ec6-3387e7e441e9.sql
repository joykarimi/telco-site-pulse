-- Fix critical security vulnerability: Restrict access to sensitive financial data in monthly_data table

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Monthly data can be inserted by anyone" ON public.monthly_data;
DROP POLICY IF EXISTS "Monthly data can be updated by anyone" ON public.monthly_data;
DROP POLICY IF EXISTS "Monthly data is viewable by everyone" ON public.monthly_data;

-- Create secure role-based policies for financial data access

-- Admins have full access to all financial data
CREATE POLICY "Admins can manage all monthly data" 
ON public.monthly_data 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Operations managers can view and update financial data (they manage revenue streams)
CREATE POLICY "Operations managers can view monthly data" 
ON public.monthly_data 
FOR SELECT 
USING (get_user_role(auth.uid()) IN ('operations_manager', 'admin'));

CREATE POLICY "Operations managers can insert monthly data" 
ON public.monthly_data 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) IN ('operations_manager', 'admin'));

CREATE POLICY "Operations managers can update monthly data" 
ON public.monthly_data 
FOR UPDATE 
USING (get_user_role(auth.uid()) IN ('operations_manager', 'admin'));

-- Maintenance managers can view cost data (need to understand operational costs)
CREATE POLICY "Maintenance managers can view monthly costs" 
ON public.monthly_data 
FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('maintenance_manager', 'operations_manager', 'admin')
);

-- Regular users have no access to sensitive financial data
-- (No policy needed - they're denied by default with RLS enabled)

-- Add audit logging trigger for financial data changes
CREATE OR REPLACE FUNCTION public.audit_monthly_data_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'monthly_data', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'monthly_data', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'monthly_data', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit trigger for monthly_data
CREATE TRIGGER audit_monthly_data_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.monthly_data
  FOR EACH ROW EXECUTE FUNCTION public.audit_monthly_data_changes();