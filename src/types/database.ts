export type UserRole = 'admin' | 'maintenance_manager' | 'operations_manager' | 'user';

export type AssetType = 'generator' | 'solar_panel' | 'battery' | 'aps_board' | 'router' | 'rectifier' | 'electronic_lock';

export type AssetStatus = 'active' | 'in_repair' | 'retired';

export type MovementStatus = 'pending' | 'approved' | 'rejected';

export type RevenueType = 'colocated' | 'safaricom_only' | 'airtel_only';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  serial_number: string;
  asset_type: AssetType;
  purchase_date?: string;
  installation_date?: string;
  status: AssetStatus;
  current_site_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMovement {
  id: string;
  asset_id: string;
  from_site_id?: string;
  to_site_id: string;
  requested_by: string;
  status: MovementStatus;
  maintenance_manager_approval?: boolean;
  operations_manager_approval?: boolean;
  maintenance_approved_by?: string;
  operations_approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
}