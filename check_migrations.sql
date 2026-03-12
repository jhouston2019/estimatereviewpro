-- Run this query in Supabase SQL Editor to check which tables exist

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('pricing_database', 'regional_multipliers', 'labor_rates', 'audit_events', 'ai_decisions') THEN 'Migration 03'
    WHEN table_name IN ('carrier_behavior_patterns', 'scope_gap_patterns', 'pricing_deviation_patterns', 'labor_rate_patterns', 'claim_recovery_patterns', 'litigation_evidence', 'reconstructed_estimates') THEN 'Migration 04'
    WHEN table_name = 'code_requirements' THEN 'Migration 05'
    WHEN table_name IN ('subscription_plans', 'user_review_usage', 'recovery_metrics', 'payment_transactions') THEN 'Migration 06'
    ELSE 'Other'
  END as migration_source
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'pricing_database', 'regional_multipliers', 'labor_rates', 'audit_events', 'ai_decisions',
    'carrier_behavior_patterns', 'scope_gap_patterns', 'pricing_deviation_patterns', 
    'labor_rate_patterns', 'claim_recovery_patterns', 'litigation_evidence', 'reconstructed_estimates',
    'code_requirements',
    'subscription_plans', 'user_review_usage', 'recovery_metrics', 'payment_transactions'
  )
ORDER BY migration_source, table_name;
