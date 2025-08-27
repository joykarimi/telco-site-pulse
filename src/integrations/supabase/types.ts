export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      asset_movements: {
        Row: {
          approved_at: string | null
          asset_id: string
          created_at: string
          from_site_id: string | null
          id: string
          maintenance_approved_by: string | null
          maintenance_manager_approval: boolean | null
          operations_approved_by: string | null
          operations_manager_approval: boolean | null
          reason: string | null
          rejected_at: string | null
          requested_by: string
          status: Database["public"]["Enums"]["movement_status"]
          to_site_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          asset_id: string
          created_at?: string
          from_site_id?: string | null
          id?: string
          maintenance_approved_by?: string | null
          maintenance_manager_approval?: boolean | null
          operations_approved_by?: string | null
          operations_manager_approval?: boolean | null
          reason?: string | null
          rejected_at?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["movement_status"]
          to_site_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          asset_id?: string
          created_at?: string
          from_site_id?: string | null
          id?: string
          maintenance_approved_by?: string | null
          maintenance_manager_approval?: boolean | null
          operations_approved_by?: string | null
          operations_manager_approval?: boolean | null
          reason?: string | null
          rejected_at?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["movement_status"]
          to_site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_movements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_from_site_id_fkey"
            columns: ["from_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_to_site_id_fkey"
            columns: ["to_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          current_site_id: string | null
          id: string
          installation_date: string | null
          purchase_date: string | null
          serial_number: string
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          current_site_id?: string | null
          id?: string
          installation_date?: string | null
          purchase_date?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          current_site_id?: string | null
          id?: string
          installation_date?: string | null
          purchase_date?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_current_site_id_fkey"
            columns: ["current_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_data: {
        Row: {
          airtel_revenue: number
          created_at: string
          generator_fuel_cost: number
          id: string
          kplc_bill: number
          month: number
          safaricom_revenue: number
          site_id: string
          solar_contribution: number
          updated_at: string
          year: number
        }
        Insert: {
          airtel_revenue?: number
          created_at?: string
          generator_fuel_cost?: number
          id?: string
          kplc_bill?: number
          month: number
          safaricom_revenue?: number
          site_id: string
          solar_contribution?: number
          updated_at?: string
          year: number
        }
        Update: {
          airtel_revenue?: number
          created_at?: string
          generator_fuel_cost?: number
          id?: string
          kplc_bill?: number
          month?: number
          safaricom_revenue?: number
          site_id?: string
          solar_contribution?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string
          id: string
          location: string
          revenue_type: Database["public"]["Enums"]["revenue_type"]
          site_id: string
          site_type: Database["public"]["Enums"]["site_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          revenue_type?: Database["public"]["Enums"]["revenue_type"]
          site_id: string
          site_type: Database["public"]["Enums"]["site_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          revenue_type?: Database["public"]["Enums"]["revenue_type"]
          site_id?: string
          site_type?: Database["public"]["Enums"]["site_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      asset_status: "active" | "in_repair" | "retired"
      asset_type:
        | "generator"
        | "solar_panel"
        | "battery"
        | "aps_board"
        | "router"
        | "rectifier"
        | "electronic_lock"
      movement_status: "pending" | "approved" | "rejected"
      revenue_type: "colocated" | "safaricom_only" | "airtel_only"
      site_type:
        | "Grid Only"
        | "Grid + Generator"
        | "Grid + Generator + Solar"
        | "Generator Only"
        | "Generator + Solar"
        | "Gen Only"
        | "Solar Only"
      user_role: "admin" | "maintenance_manager" | "operations_manager" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_status: ["active", "in_repair", "retired"],
      asset_type: [
        "generator",
        "solar_panel",
        "battery",
        "aps_board",
        "router",
        "rectifier",
        "electronic_lock",
      ],
      movement_status: ["pending", "approved", "rejected"],
      revenue_type: ["colocated", "safaricom_only", "airtel_only"],
      site_type: [
        "Grid Only",
        "Grid + Generator",
        "Grid + Generator + Solar",
        "Generator Only",
        "Generator + Solar",
        "Gen Only",
        "Solar Only",
      ],
      user_role: ["admin", "maintenance_manager", "operations_manager", "user"],
    },
  },
} as const
