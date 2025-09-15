-- Add subscription plans data with correct allowed tiers (premium and royal)
INSERT INTO subscription_plans (name, tier, price_monthly, description, features) VALUES
('Premium Bakery Club', 'premium', 599, 'For true dessert enthusiasts', '["15% discount on all orders", "Free delivery on all orders", "Exclusive access to new products", "Birthday special treats", "Monthly baking tips video", "Recipe sharing community"]'),
('Royal Master Baker', 'royal', 999, 'Ultimate sweet experience', '["25% discount on all orders", "Free express delivery", "Custom cake design consultation", "Monthly surprise box", "Personal baker consultation", "VIP event invitations", "Recipe masterclass access"]');

-- Update profiles table to include loyalty points
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT now();