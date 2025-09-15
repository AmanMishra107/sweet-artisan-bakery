-- Create admin roles and enhanced products table
-- Add admin role support
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.role = 'admin'
  )
);

-- Create products table for admin management
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (in_stock = true);

CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.role = 'admin'
  )
);

-- Add updated_at trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample products
INSERT INTO public.products (name, description, price, category, in_stock) VALUES
('Chocolate Croissants', 'Buttery, flaky pastries filled with rich dark chocolate', 85, 'Pastries', true),
('Artisan Sourdough Bread', 'Traditional sourdough bread with a perfect crust and tangy flavor', 120, 'Breads', true),
('French Macarons', 'Delicate almond cookies with smooth ganache filling', 180, 'Desserts', true),
('Vanilla Cupcakes', 'Moist vanilla cupcakes topped with creamy buttercream', 65, 'Cakes', true),
('Cinnamon Rolls', 'Warm, gooey cinnamon rolls with sweet glaze', 95, 'Pastries', true),
('Red Velvet Cake', 'Rich red velvet cake with cream cheese frosting', 450, 'Cakes', true),
('Blueberry Muffins', 'Fresh blueberry muffins with a golden top', 55, 'Muffins', true),
('Chocolate Brownies', 'Fudgy chocolate brownies with walnuts', 75, 'Desserts', true),
('Apple Pie', 'Classic apple pie with flaky crust and cinnamon spice', 320, 'Pies', true),
('Banana Bread', 'Moist banana bread with chocolate chips', 140, 'Breads', true);