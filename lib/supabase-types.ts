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
          plan_type: "single" | "professional" | "enterprise" | null;
          team_id: string | null;
          role: "owner" | "member" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          stripe_customer_id?: string | null;
          plan_type?: "single" | "professional" | "enterprise" | null;
          team_id?: string | null;
          role?: "owner" | "member" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          stripe_customer_id?: string | null;
          plan_type?: "single" | "professional" | "enterprise" | null;
          team_id?: string | null;
          role?: "owner" | "member" | null;
          created_at?: string;
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
          plan_type: "professional" | "enterprise";
          stripe_subscription_id: string | null;
          review_limit: number;
          overage_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          plan_type: "professional" | "enterprise";
          stripe_subscription_id?: string | null;
          review_limit: number;
          overage_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          plan_type?: "professional" | "enterprise";
          stripe_subscription_id?: string | null;
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
      reviews: {
        Row: {
          id: string;
          user_id: string;
          contractor_estimate_url: string | null;
          carrier_estimate_url: string | null;
          ai_analysis_json: Json | null;
          ai_comparison_json: Json | null;
          ai_summary_json: Json | null;
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
          pdf_report_url?: string | null;
          created_at?: string;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}


