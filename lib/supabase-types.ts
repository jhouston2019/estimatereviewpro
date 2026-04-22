export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          stripe_customer_id: string | null;
          plan_type:
            | "single"
            | "essential"
            | "professional"
            | "enterprise"
            | "premier"
            | null;
          payment_verification_status: string | null;
          is_paid: boolean | null;
          team_id: string | null;
          role: "owner" | "member" | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          stripe_customer_id?: string | null;
          plan_type?:
            | "single"
            | "essential"
            | "professional"
            | "enterprise"
            | "premier"
            | null;
          payment_verification_status?: string | null;
          is_paid?: boolean | null;
          team_id?: string | null;
          role?: "owner" | "member" | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          stripe_customer_id?: string | null;
          plan_type?:
            | "single"
            | "essential"
            | "professional"
            | "enterprise"
            | "premier"
            | null;
          payment_verification_status?: string | null;
          is_paid?: boolean | null;
          team_id?: string | null;
          role?: "owner" | "member" | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_review_usage: {
        Row: {
          user_id: string;
          reviews_used: number;
          reviews_limit: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          reviews_used?: number;
          reviews_limit?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          reviews_used?: number;
          reviews_limit?: number;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          stripe_customer_id: string | null;
          subscription_status: string | null;
          tier: "free" | "oneoff" | "pro" | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          created_at?: string;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          tier?: "free" | "oneoff" | "pro" | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          tier?: "free" | "oneoff" | "pro" | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          plan_type: "essential" | "professional" | "enterprise" | "premier";
          stripe_subscription_id: string | null;
          stripe_subscription_status: string | null;
          review_limit: number;
          overage_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          plan_type: "essential" | "professional" | "enterprise" | "premier";
          stripe_subscription_id?: string | null;
          stripe_subscription_status?: string | null;
          review_limit: number;
          overage_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          plan_type?: "essential" | "professional" | "enterprise" | "premier";
          stripe_subscription_id?: string | null;
          stripe_subscription_status?: string | null;
          review_limit?: number;
          overage_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          team_id: string | null;
          estimate_name: string;
          estimate_type: string | null;
          damage_type: string | null;
          result_json: Json;
          paid_single_use: boolean | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id?: string | null;
          estimate_name: string;
          estimate_type?: string | null;
          damage_type?: string | null;
          result_json: Json;
          paid_single_use?: boolean | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string | null;
          estimate_name?: string;
          estimate_type?: string | null;
          damage_type?: string | null;
          result_json?: Json;
          paid_single_use?: boolean | null;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          team_id: string;
          month_year: string;
          review_count: number | null;
          overage_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          month_year: string;
          review_count?: number | null;
          overage_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          month_year?: string;
          review_count?: number | null;
          overage_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          type: string;
          received_at: string;
        };
        Insert: {
          id: string;
          type: string;
          received_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          received_at?: string;
        };
      };
      processed_sessions: {
        Row: {
          session_id: string;
          user_id: string | null;
          processed_at: string;
          status: string | null;
          completed_at: string | null;
        };
        Insert: {
          session_id: string;
          user_id?: string | null;
          processed_at?: string;
          status?: string | null;
          completed_at?: string | null;
        };
        Update: {
          session_id?: string;
          user_id?: string | null;
          processed_at?: string;
          status?: string | null;
          completed_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          contractor_estimate_url: string | null;
          carrier_estimate_url: string | null;
          ai_analysis_json: Json | null;
          ai_comparison_json: Json | null;
          ai_summary_json: Json | null;
          insured_name: string | null;
          pdf_report_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contractor_estimate_url?: string | null;
          carrier_estimate_url?: string | null;
          ai_analysis_json?: Json | null;
          ai_comparison_json?: Json | null;
          ai_summary_json?: Json | null;
          insured_name?: string | null;
          pdf_report_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contractor_estimate_url?: string | null;
          carrier_estimate_url?: string | null;
          ai_analysis_json?: Json | null;
          ai_comparison_json?: Json | null;
          ai_summary_json?: Json | null;
          insured_name?: string | null;
          pdf_report_url?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      user_has_paid_access: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_user_plan_usage: {
        Args: { user_id_param: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}


