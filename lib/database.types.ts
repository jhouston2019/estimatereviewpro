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
          tier: string | null;
          subscription_status: string | null;
          stripe_customer_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          tier?: string | null;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          tier?: string | null;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          contractor_estimate_url: string | null;
          carrier_estimate_url: string | null;
          report_url: string | null;
          pdf_report_url: string | null;
          ai_analysis_json: Json | null;
          ai_comparison_json: Json | null;
          ai_summary_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          contractor_estimate_url?: string | null;
          carrier_estimate_url?: string | null;
          report_url?: string | null;
          pdf_report_url?: string | null;
          ai_analysis_json?: Json | null;
          ai_comparison_json?: Json | null;
          ai_summary_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

