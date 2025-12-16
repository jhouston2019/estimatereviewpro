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


