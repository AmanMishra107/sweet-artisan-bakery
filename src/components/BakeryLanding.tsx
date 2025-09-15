import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Star, MapPin, Clock, Phone, Mail, User, Crown, Settings, RefreshCw, Menu, X, Award, Heart, Users, Truck } from 'lucide-react';
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

// Database Product interface - matches your Supabase table structure
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  in_stock: boolean;
  created_at: string;
}

// CartItem extends database Product but adds quantity and image for CheckoutPage compatibility
interface CartItem extends Product {
  quantity: number;
  image: string; // Required for CheckoutPage compatibility
}

// Fallback products with proper image mapping based on your original products
const fallbackProducts: Product[] = [
  {
    id: 'fallback-1',
    name: '🥐 Magical Chocolate Croissants',
    description: 'Buttery, flaky pastries filled with enchanted dark chocolate',
    price: 85,
    image_url: chocolateCroissants,
    category: 'Pastries',
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'fallback-2',
    name: '🍞 Artisan Sourdough Bread',
    description: 'Traditional sourdough bread with a perfect crust and tangy flavor',
    price: 120,
    image_url: sourdoughBread,
    category: 'Breads',
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'fallback-3',
    name: '🌈 Rainbow French Macarons',
    description: 'Delicate almond cookies with magical ganache filling',
    price: 180,
    image_url: macarons,
    category: 'Cookies',
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'fallback-4',
    name: '🧁 Vanilla Dream Cupcakes',
    description: 'Moist vanilla cupcakes topped with fluffy cloud frosting',
    price: 65,
    image_url: cupcakes,
    category: 'Cupcakes',
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'fallback-5',
    name: '🌪️ Cinnamon Sugar Spirals',
    description: 'Warm, soft rolls swirled with cinnamon magic and glazed perfection',
    price: 95,
    image_url: cinnamonRolls,
    category: 'Pastries',
    in_stock: true,
    created_at: new Date().toISOString()
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
  // State declarations
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  
  // Products state - now from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for sticky navigation
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  // Get default image based on category
  const getDefaultImageForCategory = (category: string): string => {
    const categoryImageMap: { [key: string]: string } = {
      'Pastries': chocolateCroissants,
      'Breads': sourdoughBread,
      'Cookies': macarons,
      'Cupcakes': cupcakes,
      'Cakes': cupcakes,
      'Muffins': cupcakes,
      'Desserts': macarons,
      'Pies': cupcakes
    };
    
    return categoryImageMap[category] || cupcakes;
  };

  // Fetch products from database - moved outside useEffect to prevent dependency issues
  const fetchProducts = async () => {
    try {
      console.log('Fetching products from database...');
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true) // Only fetch products that are in stock
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Fetched products:', data?.length || 0, 'items');

      if (data && data.length > 0) {
        // Map database products to include fallback images if needed
        const productsWithImages = data.map(product => ({
          ...product,
          image_url: product.image_url || getDefaultImageForCategory(product.category)
        }));
        
        setProducts(productsWithImages);
        console.log('Products set successfully:', productsWithImages.length);
      } else {
        console.warn('No products found in database, using fallback products');
        setProducts(fallbackProducts);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products from database');
      
      // Use fallback products on error
      console.log('Using fallback products due to error');
      setProducts(fallbackProducts);
      
      toast({
        title: "Database Connection",
        description: "Using demo products. Database might not be available.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch - separate useEffect to prevent infinite loops
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      console.log('Loading initial data...');
      setLoading(true);
      
      try {
        await fetchProducts();
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to prevent flash of loading state
    const timer = setTimeout(() => {
      loadInitialData();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - runs only once

  // Set up authentication - separate useEffect
  useEffect(() => {
    console.log('Setting up authentication...');
    
    let authSubscription: any = null;

    // Set up auth state listener
    const setupAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Current session:', currentSession?.user?.email || 'None');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          try {
            const { data } = await supabase
              .from('admin_users')
              .select('role')
              .eq('user_id', currentSession.user.id)
              .maybeSingle();
            setIsAdmin(data?.role === 'admin');
            console.log('User admin status:', data?.role === 'admin');
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email || 'None');
            setSession(session);
            setUser(session?.user ?? null);
            
            // Check if user is admin
            if (session?.user) {
              try {
                const { data } = await supabase
                  .from('admin_users')
                  .select('role')
                  .eq('user_id', session.user.id)
                  .maybeSingle();
                setIsAdmin(data?.role === 'admin');
                console.log('User admin status:', data?.role === 'admin');
              } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
              }
            } else {
              setIsAdmin(false);
            }
          }
        );
        
        authSubscription = subscription;
      } catch (error) {
        console.error('Auth setup error:', error);
      }
    };

    setupAuth();

    return () => {
      console.log('Cleaning up auth subscription...');
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - runs only once

  // Set up real-time subscription - separate useEffect
  useEffect(() => {
    console.log('Setting up real-time subscription for products...');
    
    const productSubscription = supabase
      .channel('products_landing')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        (payload) => {
          console.log('Product change received on landing page:', payload.eventType, payload);
          
          // Refetch products when any change occurs
          fetchProducts();
          
          // Show toast notification for changes
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Product Added!",
              description: `${payload.new?.name || 'A new product'} is now available.`,
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Product Updated",
              description: `${payload.new?.name || 'A product'} has been updated.`,
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "Product Removed",
              description: "A product has been removed from the menu.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up product subscription...');
      supabase.removeChannel(productSubscription);
    };
  }, []); // Empty dependency array - runs only once

  // Auto-advance testimonials - separate useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array - runs only once

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const addToCart = (product: Product) => {
    if (!product.in_stock) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive"
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // Create CartItem with both image_url and image for compatibility
      const cartItem: CartItem = {
        ...product,
        quantity: 1,
        image: product.image_url || getDefaultImageForCategory(product.category)
      };
      
      return [...prev, cartItem];
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

  const refreshProducts = () => {
    console.log('Manual refresh triggered');
    setLoading(true);
    setError(null);
    fetchProducts();
  };

  // Handle page navigation
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
  
  // Get unique categories from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Responsive Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-gradient">
                🥐 Sweet Artisan Bakery
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <button onClick={() => scrollToSection('menu')} className="text-foreground hover:text-primary transition-colors">Menu</button>
              <button onClick={() => scrollToSection('about')} className="text-foreground hover:text-primary transition-colors">About</button>
              <button onClick={() => setShowSubscriptions(true)} className="text-foreground hover:text-primary transition-colors">Membership</button>
              <button onClick={() => scrollToSection('contact')} className="text-foreground hover:text-primary transition-colors">Contact</button>
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfile(true)}
                    className="relative border-orange-200"
                  >
                    <User className="h-4 w-4 text-orange-500" />
                    <Crown className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdmin(true)}
                      className="border-orange-200 text-orange-600"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuth(true)}
                  className="border-orange-200"
                >
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center space-x-2">
              {/* Cart Button */}
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

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden border-orange-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md">
              <div className="py-4 space-y-3">
                <button 
                  onClick={() => scrollToSection('menu')}
                  className="block w-full text-left px-4 py-2 text-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                >
                  Menu
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="block w-full text-left px-4 py-2 text-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                >
                  About
                </button>
                <button 
                  onClick={() => {
                    setShowSubscriptions(true);
                    setIsMobileMenuOpen(false);
                  }} 
                  className="block w-full text-left px-4 py-2 text-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                >
                  Membership
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="block w-full text-left px-4 py-2 text-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                >
                  Contact
                </button>
                
                <div className="border-t border-border pt-3 mt-3">
                  {user ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowProfile(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start border-orange-200"
                      >
                        <User className="h-4 w-4 mr-2 text-orange-500" />
                        Profile
                        <Crown className="h-3 w-3 text-yellow-500 ml-auto" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAdmin(true);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start border-orange-200 text-orange-600"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAuth(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start border-orange-200"
                    >
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Responsive Hero Section */}
      <section className="relative overflow-hidden bg-cream-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-fade-in text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 lg:mb-6">
                Baked with Love & 
                <span className="text-gradient block">Artisan Tradition</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 lg:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Fresh, handcrafted breads, pastries, and desserts made daily with the finest ingredients. 
                Every bite tells a story of passion and craftsmanship.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  className="btn-hero bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 w-full sm:w-auto" 
                  onClick={() => scrollToSection('menu')}
                >
                  Order Now
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-hero-outline border-orange-500 text-orange-600 hover:bg-orange-500/10 w-full sm:w-auto" 
                  onClick={() => setShowSubscriptions(true)}
                >
                  Membership
                </Button>
              </div>
            </div>
            <div className="animate-slide-up order-first lg:order-last">
              <motion.img
                src={heroBakedGoods}
                alt="Artisan baked goods"
                className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover rounded-2xl lg:rounded-3xl shadow-elegant"
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Featured Products */}
      <section id="menu" className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">
                Our Signature Collection
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshProducts}
                disabled={loading}
                className="flex-shrink-0"
                title="Refresh products from database"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Handcrafted with premium ingredients and time-honored techniques, these are our most beloved creations
            </p>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-sm text-gray-500 px-4">
                Products: {products.length} | Loading: {loading ? 'Yes' : 'No'} | 
                {error && ` Error: ${error}`} | DB Connected: {products.some(p => !p.id.startsWith('fallback')) ? 'Yes' : 'No'}
              </div>
            )}
            
            {/* Responsive Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 lg:mt-8 px-4">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`text-xs sm:text-sm ${selectedCategory === category ? "bg-gradient-to-r from-primary to-warning" : ""}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Loading state */}
          {loading && products.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-muted-foreground">Loading fresh products from kitchen...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && products.length === 0 && (
            <div className="text-center py-12 px-4">
              <p className="text-red-500 mb-4">Database connection issue. Loading demo products...</p>
              <Button onClick={refreshProducts} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Database Again
              </Button>
            </div>
          )}

          {/* Responsive Products grid */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredProducts.map((product, index) => (
                <Card key={product.id} className="product-card animate-bounce-in h-full flex flex-col" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-square mb-4 overflow-hidden rounded-xl">
                    <img
                      src={product.image_url || getDefaultImageForCategory(product.category)}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to default image if the product image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = getDefaultImageForCategory(product.category);
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      <div className="flex items-center gap-1">
                        {!product.in_stock && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
                        <FavoriteButton productId={product.id} productName={product.name} />
                        <ShareButton productName={product.name} />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base line-clamp-3 flex-1">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xl sm:text-2xl font-bold text-gradient">₹{product.price}</span>
                      <Button 
                        onClick={() => addToCart(product)}
                        className="add-to-cart-btn bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-sm sm:text-base"
                        disabled={!product.in_stock}
                        size="sm"
                      >
                        {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No products state */}
          {!loading && filteredProducts.length === 0 && products.length > 0 && (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground mb-4">
                No products found in {selectedCategory} category.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory('All')}
                className="mt-4"
              >
                Show All Products
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 bg-warm-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              About Sweet Artisan Bakery
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Founded in 2018, we've been crafting exceptional baked goods with passion, tradition, and the finest ingredients.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-xl sm:text-2xl font-display font-semibold text-foreground mb-4">
                  Our Story
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  What started as a small family bakery has grown into a beloved community staple. Our master bakers combine 
                  time-honored techniques with innovative flavors to create memorable experiences in every bite.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  From our signature sourdough starter that's been maintained for over 5 years to our handcrafted pastries 
                  made fresh daily, every product reflects our commitment to quality and craftsmanship.
                </p>
              </motion.div>
            </div>
            <div className="order-first lg:order-last">
              <motion.img
                src={sourdoughBread}
                alt="Artisan bread making"
                className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-2xl shadow-elegant"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Award Winning</h4>
              <p className="text-muted-foreground text-sm">Recognized for excellence in artisan baking</p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Made with Love</h4>
              <p className="text-muted-foreground text-sm">Every item crafted with passion and care</p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Community Focused</h4>
              <p className="text-muted-foreground text-sm">Supporting local families and events</p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Fresh Daily</h4>
              <p className="text-muted-foreground text-sm">Baked fresh every morning, delivered daily</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Responsive Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-12 lg:mb-16">
            What Our Customers Say
          </h2>
          
          <div className="testimonial-card max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-warning text-warning" />
              ))}
            </div>
            <blockquote className="text-base sm:text-lg text-foreground mb-6 italic leading-relaxed px-4">
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

      {/* Responsive Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-black/50 flex-1" onClick={() => setIsCartOpen(false)} />
          <div className="bg-card w-full max-w-sm sm:max-w-md lg:w-96 p-4 sm:p-6 shadow-elegant overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-display font-semibold">Your Cart</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <img 
                        src={item.image || item.image_url || getDefaultImageForCategory(item.category)} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-primary font-bold text-sm">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
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

      {/* Responsive Newsletter */}
      <section className="newsletter-section py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
            Join Our Sweet Newsletter
          </h2>
          <p className="text-base sm:text-lg mb-6 lg:mb-8 opacity-90 px-4">
            Get exclusive recipes, baking tips, and be the first to know about new products. 
            Plus enjoy 15% off your first order!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto px-4">
            <input
              type="email"
              placeholder="Your email address"
              className="form-input flex-1 text-sm sm:text-base"
            />
            <Button className="bg-orange-500 text-white hover:bg-orange-600 text-sm sm:text-base">
              Subscribe & Save 15%
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about our products or want to place a custom order? We'd love to hear from you!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-xl font-display font-semibold text-foreground mb-6">
                  Visit Our Bakery
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <p className="text-muted-foreground">123 Baker Street, Sweet City, SC 12345</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">hello@sweetartisan.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Hours</p>
                      <div className="text-muted-foreground space-y-1">
                        <p>Monday - Friday: 7:00 AM - 7:00 PM</p>
                        <p>Saturday: 8:00 AM - 8:00 PM</p>
                        <p>Sunday: 8:00 AM - 6:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-xl font-display font-semibold text-foreground mb-6">
                  Delivery Information
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-orange-500" />
                    <span>Same-day delivery within 5km radius</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Free delivery on orders ₹500+</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span>Express delivery available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span>Schedule orders in advance</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-6 lg:p-8">
                <h3 className="text-xl font-display font-semibold text-foreground mb-6">
                  Send us a Message
                </h3>
                <form className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                      <option>General Inquiry</option>
                      <option>Custom Order</option>
                      <option>Catering Request</option>
                      <option>Feedback</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Tell us about your inquiry or custom order requirements..."
                    ></textarea>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    Send Message
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Responsive Footer */}
      <footer className="bg-card border-t border-border py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-gradient mb-4">🥐 Sweet Artisan Bakery</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Handcrafted bakery products made with love, tradition, and the finest ingredients.
              </p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline">Facebook</Button>
                <Button size="sm" variant="outline">Instagram</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-primary transition-colors">Menu</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-primary transition-colors">About Us</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-primary transition-colors">Contact</button></li>
                <li><a href="#" className="hover:text-primary transition-colors">Catering</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Custom Orders</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Gift Cards</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Delivery Info</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  Same-day delivery
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
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
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  hello@sweetartisan.com
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  Mon-Sun 7AM-7PM
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  123 Baker Street, Sweet City
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-muted-foreground text-sm sm:text-base">
            <p>&copy; 2024 Sweet Artisan Bakery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
