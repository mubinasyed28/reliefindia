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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          citizen_id: string | null
          created_at: string | null
          disaster_id: string | null
          id: string
          is_active: boolean | null
          tokens_allocated: number | null
          tokens_spent: number | null
        }
        Insert: {
          citizen_id?: string | null
          created_at?: string | null
          disaster_id?: string | null
          id?: string
          is_active?: boolean | null
          tokens_allocated?: number | null
          tokens_spent?: number | null
        }
        Update: {
          citizen_id?: string | null
          created_at?: string | null
          disaster_id?: string | null
          id?: string
          is_active?: boolean | null
          tokens_allocated?: number | null
          tokens_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaries_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_validations: {
        Row: {
          ai_confidence_score: number | null
          ai_validation_notes: string | null
          ai_validation_status: string | null
          amount: number
          bill_date: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          ngo_id: string
          transaction_id: string | null
          updated_at: string
          validated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
          amount: number
          bill_date?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          ngo_id: string
          transaction_id?: string | null
          updated_at?: string
          validated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
          amount?: number
          bill_date?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          ngo_id?: string
          transaction_id?: string | null
          updated_at?: string
          validated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_validations_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_validations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          complainant_id: string | null
          complaint_type: string
          created_at: string | null
          description: string
          id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          subject: string
        }
        Insert: {
          complainant_id?: string | null
          complaint_type: string
          created_at?: string | null
          description: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          complainant_id?: string | null
          complaint_type?: string
          created_at?: string | null
          description?: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      disasters: {
        Row: {
          affected_states: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          spending_limit_per_user: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["disaster_status"] | null
          tokens_distributed: number | null
          total_tokens_allocated: number | null
          updated_at: string | null
        }
        Insert: {
          affected_states?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          spending_limit_per_user?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["disaster_status"] | null
          tokens_distributed?: number | null
          total_tokens_allocated?: number | null
          updated_at?: string | null
        }
        Update: {
          affected_states?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          spending_limit_per_user?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["disaster_status"] | null
          tokens_distributed?: number | null
          total_tokens_allocated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          disaster_id: string | null
          donor_email: string | null
          donor_name: string | null
          donor_phone: string | null
          id: string
          is_anonymous: boolean | null
          payment_reference: string | null
          payment_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          disaster_id?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          id?: string
          is_anonymous?: boolean | null
          payment_reference?: string | null
          payment_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          disaster_id?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          id?: string
          is_anonymous?: boolean | null
          payment_reference?: string | null
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_claims: {
        Row: {
          aadhaar_hash: string
          flagged_at: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          wallet_addresses: string[]
        }
        Insert: {
          aadhaar_hash: string
          flagged_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          wallet_addresses: string[]
        }
        Update: {
          aadhaar_hash?: string
          flagged_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          wallet_addresses?: string[]
        }
        Relationships: []
      }
      grievances: {
        Row: {
          complainant_id: string | null
          created_at: string | null
          description: string
          evidence_urls: string[] | null
          grievance_type: string
          id: string
          merchant_id: string | null
          ngo_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          complainant_id?: string | null
          created_at?: string | null
          description: string
          evidence_urls?: string[] | null
          grievance_type: string
          id?: string
          merchant_id?: string | null
          ngo_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          complainant_id?: string | null
          created_at?: string | null
          description?: string
          evidence_urls?: string[] | null
          grievance_type?: string
          id?: string
          merchant_id?: string | null
          ngo_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grievances_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_stories: {
        Row: {
          created_at: string | null
          disaster_id: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string | null
          story: string
          title: string
        }
        Insert: {
          created_at?: string | null
          disaster_id?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          story: string
          title: string
        }
        Update: {
          created_at?: string | null
          disaster_id?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          story?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_stories_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          aadhaar_number: string
          aadhaar_verified: boolean | null
          activation_time: string | null
          created_at: string | null
          daily_volume: number | null
          date_of_birth: string
          fraud_flags: number | null
          full_name: string
          gst_number: string | null
          id: string
          is_active: boolean | null
          merchant_token: string | null
          mobile: string
          performance_score: number | null
          shop_address: string
          shop_documents: string[] | null
          shop_license: string | null
          shop_name: string
          stock_categories: string[] | null
          total_redemptions: number | null
          trust_score: number | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          aadhaar_number: string
          aadhaar_verified?: boolean | null
          activation_time?: string | null
          created_at?: string | null
          daily_volume?: number | null
          date_of_birth: string
          fraud_flags?: number | null
          full_name: string
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          merchant_token?: string | null
          mobile: string
          performance_score?: number | null
          shop_address: string
          shop_documents?: string[] | null
          shop_license?: string | null
          shop_name: string
          stock_categories?: string[] | null
          total_redemptions?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          aadhaar_number?: string
          aadhaar_verified?: boolean | null
          activation_time?: string | null
          created_at?: string | null
          daily_volume?: number | null
          date_of_birth?: string
          fraud_flags?: number | null
          full_name?: string
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          merchant_token?: string | null
          mobile?: string
          performance_score?: number | null
          shop_address?: string
          shop_documents?: string[] | null
          shop_license?: string | null
          shop_name?: string
          stock_categories?: string[] | null
          total_redemptions?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      ngos: {
        Row: {
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          board_members: Json | null
          compliance_accepted: boolean | null
          contact_email: string
          contact_phone: string
          created_at: string | null
          fraud_flags: number | null
          government_certificates: string[] | null
          id: string
          impact_metrics: Json | null
          legal_registration_number: string
          ngo_name: string
          office_address: string
          office_photos: string[] | null
          registration_id: string | null
          rejection_reason: string | null
          relief_work_proof: string[] | null
          status: Database["public"]["Enums"]["verification_status"] | null
          tax_documents: string[] | null
          trust_score: number | null
          updated_at: string | null
          user_id: string | null
          verification_token: string | null
          wallet_address: string | null
          wallet_balance: number | null
        }
        Insert: {
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          board_members?: Json | null
          compliance_accepted?: boolean | null
          contact_email: string
          contact_phone: string
          created_at?: string | null
          fraud_flags?: number | null
          government_certificates?: string[] | null
          id?: string
          impact_metrics?: Json | null
          legal_registration_number: string
          ngo_name: string
          office_address: string
          office_photos?: string[] | null
          registration_id?: string | null
          rejection_reason?: string | null
          relief_work_proof?: string[] | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          tax_documents?: string[] | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          wallet_address?: string | null
          wallet_balance?: number | null
        }
        Update: {
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          board_members?: Json | null
          compliance_accepted?: boolean | null
          contact_email?: string
          contact_phone?: string
          created_at?: string | null
          fraud_flags?: number | null
          government_certificates?: string[] | null
          id?: string
          impact_metrics?: Json | null
          legal_registration_number?: string
          ngo_name?: string
          office_address?: string
          office_photos?: string[] | null
          registration_id?: string | null
          rejection_reason?: string | null
          relief_work_proof?: string[] | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          tax_documents?: string[] | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          wallet_address?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      offline_ledger: {
        Row: {
          amount: number
          citizen_wallet: string
          created_at: string | null
          id: string
          local_timestamp: string
          merchant_id: string | null
          qr_signature: string
          synced: boolean | null
          synced_at: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          citizen_wallet: string
          created_at?: string | null
          id?: string
          local_timestamp: string
          merchant_id?: string | null
          qr_signature: string
          synced?: boolean | null
          synced_at?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          citizen_wallet?: string
          created_at?: string | null
          id?: string
          local_timestamp?: string
          merchant_id?: string | null
          qr_signature?: string
          synced?: boolean | null
          synced_at?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offline_ledger_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_last_four: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          mobile: string | null
          notifications: Json | null
          qr_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
          wallet_address: string | null
          wallet_balance: number | null
        }
        Insert: {
          aadhaar_last_four?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          mobile?: string | null
          notifications?: Json | null
          qr_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
          wallet_balance?: number | null
        }
        Update: {
          aadhaar_last_four?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          mobile?: string | null
          notifications?: Json | null
          qr_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      relief_locations: {
        Row: {
          address: string
          capacity: number | null
          contact_phone: string | null
          created_at: string | null
          current_occupancy: number | null
          disaster_id: string | null
          id: string
          is_active: boolean | null
          latitude: number
          location_type: string
          longitude: number
          name: string
          operating_hours: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          capacity?: number | null
          contact_phone?: string | null
          created_at?: string | null
          current_occupancy?: number | null
          disaster_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          location_type: string
          longitude: number
          name: string
          operating_hours?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          capacity?: number | null
          contact_phone?: string | null
          created_at?: string | null
          current_occupancy?: number | null
          disaster_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          location_type?: string
          longitude?: number
          name?: string
          operating_hours?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relief_locations_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          amount: number
          block_hash: string | null
          created_at: string | null
          disaster_id: string | null
          expires_at: string | null
          id: string
          is_frozen: boolean | null
          is_transferable: boolean | null
          owner_id: string
          owner_type: string
          purpose: string | null
        }
        Insert: {
          amount: number
          block_hash?: string | null
          created_at?: string | null
          disaster_id?: string | null
          expires_at?: string | null
          id?: string
          is_frozen?: boolean | null
          is_transferable?: boolean | null
          owner_id: string
          owner_type: string
          purpose?: string | null
        }
        Update: {
          amount?: number
          block_hash?: string | null
          created_at?: string | null
          disaster_id?: string | null
          expires_at?: string | null
          id?: string
          is_frozen?: boolean | null
          is_transferable?: boolean | null
          owner_id?: string
          owner_type?: string
          purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bill_url: string | null
          bill_verification_notes: string | null
          bill_verified: boolean | null
          created_at: string | null
          disaster_id: string | null
          from_type: string
          from_wallet: string
          id: string
          is_offline: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          purpose: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          to_type: string
          to_wallet: string
          transaction_hash: string | null
        }
        Insert: {
          amount: number
          bill_url?: string | null
          bill_verification_notes?: string | null
          bill_verified?: boolean | null
          created_at?: string | null
          disaster_id?: string | null
          from_type: string
          from_wallet: string
          id?: string
          is_offline?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          purpose?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          to_type: string
          to_wallet: string
          transaction_hash?: string | null
        }
        Update: {
          amount?: number
          bill_url?: string | null
          bill_verification_notes?: string | null
          bill_verified?: boolean | null
          created_at?: string | null
          disaster_id?: string | null
          from_type?: string
          from_wallet?: string
          id?: string
          is_offline?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          purpose?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          to_type?: string
          to_wallet?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          notes: string | null
          old_data: Json | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Relationships: []
      }
      volunteer_signups: {
        Row: {
          availability: string | null
          city: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          mobile: string
          skills: string[] | null
          state: string
          status: string | null
        }
        Insert: {
          availability?: string | null
          city: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          mobile: string
          skills?: string[] | null
          state: string
          status?: string | null
        }
        Update: {
          availability?: string | null
          city?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          mobile?: string
          skills?: string[] | null
          state?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_transaction_hash: { Args: never; Returns: string }
      generate_wallet_address: { Args: never; Returns: string }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      disaster_status: "active" | "completed" | "frozen"
      transaction_status: "pending" | "completed" | "failed" | "synced"
      user_role: "admin" | "ngo" | "merchant" | "citizen"
      verification_status: "pending" | "verified" | "rejected"
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
      disaster_status: ["active", "completed", "frozen"],
      transaction_status: ["pending", "completed", "failed", "synced"],
      user_role: ["admin", "ngo", "merchant", "citizen"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
