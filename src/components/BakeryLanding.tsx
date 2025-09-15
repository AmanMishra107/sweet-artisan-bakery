import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Star, MapPin, Clock, Phone, Mail, User, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import AuthPage from './AuthPage';
import ProfilePage from './ProfilePage';
import CheckoutPage from './CheckoutPage';
import AdminDashboard from './AdminDashboard';
import SubscriptionManager from './SubscriptionManager';
import { FavoriteButton, ShareButton, LoyaltyCard, WeeklySpecial, BakingTip, OrderScheduler } from './InteractiveFeatures';
import ReviewRewards from './ReviewRewards';
import { motion } from 'framer-motion';
import heroBakedGoods from '@/assets/hero-baked-goods.jpg';
import chocolateCroissants from '@/assets/chocolate-croissants.jpg';
import sourdoughBread from '@/assets/sourdough-bread.jpg';
import macarons from '@/assets/macarons.jpg';
import cupcakes from '@/assets/cupcakes.jpg';
import cinnamonRolls from '@/assets/cinnamon-rolls.jpg';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const products: Product[] = [
  {
    id: '1',
    name: '🥐 Magical Chocolate Croissants',
    description: 'Buttery, flaky pastries filled with enchanted dark chocolate',
    price: 85,
    image: chocolateCroissants,
    category: 'Pastries'
  },
  {
    id: '2',
    name: '🍞 Artisan Sourdough Bread',
    description: 'Traditional sourdough bread with a perfect crust and tangy flavor',
    price: 120,
    image: sourdoughBread,
    category: 'Breads'
  },
  {
    id: '3',
    name: '🌈 Rainbow French Macarons',
    description: 'Delicate almond cookies with magical ganache filling',
    price: 180,
    image: macarons,
    category: 'Cookies'
  },
  {
    id: '4',
    name: '🧁 Vanilla Dream Cupcakes',
    description: 'Moist vanilla cupcakes topped with fluffy cloud frosting',
    price: 65,
    image: cupcakes,
    category: 'Cupcakes'
  },
  {
    id: '5',
    name: '🌪️ Cinnamon Sugar Spirals',
    description: 'Warm, soft rolls swirled with cinnamon magic and glazed perfection',
    price: 95,
    image: cinnamonRolls,
    category: 'Pastries'
  },
  {
    id: '6',
    name: '❤️ Red Velvet Love Cake',
    description: 'Classic red velvet cake with heart-melting cream cheese frosting',
    price: 450,
    image: cupcakes,
    category: 'Cakes'
  },
  {
    id: '7',
    name: '🫐 Blueberry Burst Muffins',
    description: 'Fresh blueberry muffins with a golden treasure crumb topping',
    price: 55,
    image: cupcakes,
    category: 'Muffins'
  },
  {
    id: '8',
    name: '🍪 Chocolate Chip Wonder Cookies',
    description: 'Classic cookies loaded with premium chocolate chip treasures',
    price: 40,
    image: macarons,
    category: 'Cookies'
  }
];

type Page = 'home' | 'auth' | 'profile' | 'admin' | 'checkout' | 'subscriptions';

// Testimonials data (fixed and centralized)
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    rating: 5,
    comment: 'The croissants are absolutely divine! Best I\'ve had outside of Paris. The chocolate filling is rich and the pastry is perfectly flaky.',
    location: 'Downtown'
  },
  {
    id: 2,
    name: 'Mike Chen',
    rating: 5,
    comment: 'Amazing sourdough bread with the perfect tang and crust. My family orders this every week now!',
    location: 'Westside'
  },
  {
    id: 3,
    name: 'Emma Davis',
    rating: 5,
    comment: 'Ordered a custom cake for my daughter\'s birthday. It was not only beautiful but tasted incredible! Everyone loved it.',
    location: 'East Village'
  },
  {
    id: 4,
    name: 'Robert Wilson',
    rating: 5,
    comment: 'The tiramisu is authentic and delicious. Reminds me of my trip to Italy. Will definitely be back for more!',
    location: 'Midtown'
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    rating: 5,
    comment: 'Fresh, warm cinnamon rolls delivered right to my door. The glaze is perfect and they taste homemade.',
    location: 'Northside'
  }
];

export default function BakeryLanding() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user is admin
        if (session?.user) {
          const { data } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();
          setIsAdmin(data?.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setIsAdmin(data?.role === 'admin');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-advance testimonials every 4s (moved before any early returns to keep hook order stable)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({
      title: "Added to Cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleCheckout = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowCheckout(true);
    setIsCartOpen(false);
  };

  const handleOrderComplete = () => {
    setCart([]);
    setShowCheckout(false);
  };

  if (showAuth) {
    return <AuthPage onAuthSuccess={() => setShowAuth(false)} />;
  }

  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  if (showCheckout) {
    return (
      <CheckoutPage
        cart={cart}
        onBack={() => setShowCheckout(false)}
        onOrderComplete={handleOrderComplete}
        preAppliedPromoCode={appliedDiscountCode}
        preAppliedDiscount={discountAmount}
      />
    );
  }

  if (showAdmin) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  if (showSubscriptions) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-bold text-gradient">Membership Plans</h1>
            <Button variant="outline" onClick={() => setShowSubscriptions(false)}>Back</Button>
          </div>
          <SubscriptionManager />
        </div>
      </div>
    );
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-display font-bold text-gradient">🥐 Sweet Artisan Bakery</h1>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#menu" className="text-foreground hover:text-primary transition-colors">Menu</a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors">About</a>
              <button onClick={() => navigate('/membership')} className="text-foreground hover:text-primary transition-colors">Membership</button>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="relative border-orange-200"
                  >
                    <User className="h-4 w-4 text-orange-500" />
                    <Crown className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="border-orange-200 text-orange-600"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="border-orange-200"
                >
                  Login
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative border-orange-200"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-cream-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
                Baked with Love & 
                <span className="text-gradient block">Artisan Tradition</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Fresh, handcrafted breads, pastries, and desserts made daily with the finest ingredients. 
                Every bite tells a story of passion and craftsmanship.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="btn-hero bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>
                  Order Now
                </Button>
                <Button variant="outline" className="btn-hero-outline border-orange-500 text-orange-600 hover:bg-orange-500/10" onClick={() => navigate('/membership')}>
                  Membership
                </Button>
              </div>
            </div>
            <div className="animate-slide-up">
              <motion.img
                src={heroBakedGoods}
                alt="Artisan baked goods"
                className="w-full h-[500px] object-cover rounded-3xl shadow-elegant"
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="menu" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Our Signature Collection
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Handcrafted with premium ingredients and time-honored techniques, these are our most beloved creations
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-gradient-to-r from-primary to-warning" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <Card key={product.id} className="product-card animate-bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="aspect-square mb-4 overflow-hidden rounded-xl">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{product.category}</Badge>
                  <div className="flex items-center gap-1">
                    <FavoriteButton productId={product.id} productName={product.name} />
                    <ShareButton productName={product.name} />
                  </div>
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">{product.name}</h3>
                <p className="text-muted-foreground mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gradient">₹{product.price}</span>
                  <Button 
                    onClick={() => addToCart(product)}
                    className="add-to-cart-btn bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-black/50 flex-1" onClick={() => setIsCartOpen(false)} />
          <div className="bg-card w-96 p-6 shadow-elegant overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-semibold">Your Cart</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)}>
                ×
              </Button>
            </div>
            
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-primary font-bold">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-gradient">₹{cartTotal}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full btn-hero mb-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
                <Button variant="outline" className="w-full border-orange-200" onClick={() => setIsCartOpen(false)}>
                  Continue Shopping
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <section className="py-20 bg-warm-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-foreground mb-16">
            What Our Customers Say
          </h2>
          
          <div className="testimonial-card max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-warning text-warning" />
              ))}
            </div>
            <blockquote className="text-lg text-foreground mb-6 italic leading-relaxed">
              "{testimonials[currentTestimonial].comment}"
            </blockquote>
            <div>
              <p className="font-semibold text-foreground">{testimonials[currentTestimonial].name}</p>
              <p className="text-muted-foreground flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                {testimonials[currentTestimonial].location}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? 'bg-primary scale-125' : 'bg-primary/30'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Review Rewards Section */}
      <ReviewRewards onDiscountGenerated={(code, discount) => {
        // Auto-apply discount code to checkout
        setAppliedDiscountCode(code);
        setDiscountAmount(discount);
        toast({
          title: "Discount Applied!",
          description: `${code} (${discount}% off) will be applied at checkout.`,
        });
      }} />

      {/* Newsletter */}
      <section className="newsletter-section py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Join Our Sweet Newsletter
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Get exclusive recipes, baking tips, and be the first to know about new products. 
            Plus enjoy 15% off your first order!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="form-input flex-1"
            />
            <Button className="bg-orange-500 text-white hover:bg-orange-600">
              Subscribe & Save 15%
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-display font-bold text-gradient mb-4">🥐 Sweet Artisan Bakery</h3>
              <p className="text-muted-foreground mb-4">
                Handcrafted bakery products made with love, tradition, and the finest ingredients.
              </p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline">Facebook</Button>
                <Button size="sm" variant="outline">Instagram</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#menu" className="hover:text-primary transition-colors">Menu</a></li>
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Catering</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Custom Orders</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Gift Cards</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Delivery Info</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Same-day delivery
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  5km delivery radius
                </li>
                <li>Free delivery on ₹500+</li>
                <li>💳 Card & UPI accepted</li>
                <li>🚀 Express delivery available</li>
                <li>📅 Schedule orders in advance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  hello@sweetartisan.com
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Mon-Sun 7AM-7PM
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  123 Baker Street, Sweet City
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Sweet Artisan Bakery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
