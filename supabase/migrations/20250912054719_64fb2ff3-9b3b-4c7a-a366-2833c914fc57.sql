-- Check what tiers are allowed in subscription_plans
SELECT column_name, data_type, check_clause 
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'subscription_plans' AND ccu.column_name = 'tier';

-- Let's see the current structure
SELECT * FROM subscription_plans LIMIT 1;