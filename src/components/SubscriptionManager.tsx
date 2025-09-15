import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Crown, Star, Check, Sparkles, Gift, CreditCard, ArrowLeft, Shield, Zap, Heart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  description: string;
  features: any;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
}

export default function SubscriptionManager() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchasePage, setShowPurchasePage] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subError) throw subError;
        setUserSubscription(subData);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'royal': return <Crown className="w-6 h-6 text-warning" />;
      case 'premium': return <Star className="w-6 h-6 text-candy" />;
      default: return <Gift className="w-6 h-6 text-accent" />;
    }
  };

  const getTierGradient = (tier: string) => {
    switch(tier) {
      case 'royal': return 'from-warning/20 via-card to-lemon/30';
      case 'premium': return 'from-candy/20 via-card to-primary/30';
      default: return 'from-accent/20 via-card to-sage/30';
    }
  };

  const getMembershipBenefits = (tier: string) => {
    const benefits = {
      basic: {
        discount: '10%',
        freeDelivery: '₹300+',
        priority: 'Standard',
        earlyAccess: false,
        customCakes: false,
        birthdaySpecial: false
      },
      premium: {
        discount: '20%',
        freeDelivery: '₹200+',
        priority: 'Priority',
        earlyAccess: true,
        customCakes: true,
        birthdaySpecial: false
      },
      royal: {
        discount: '30%',
        freeDelivery: 'Always',
        priority: 'VIP',
        earlyAccess: true,
        customCakes: true,
        birthdaySpecial: true
      }
    };
    return benefits[tier as keyof typeof benefits] || benefits.basic;
  };

  const handleStartPurchase = async (plan: SubscriptionPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }
    setSelectedPlan(plan);
    setShowPurchasePage(true);
  };

  const handleCompletePurchase = async () => {
    if (!selectedPlan) return;
    
    setPurchaseLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Deactivate existing active subscriptions for this user
      await supabase
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Create new active subscription
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) throw subError;

      // Update user profile with membership tier
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          membership_tier: selectedPlan.tier,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      toast({
        title: "🎉 Membership Activated!",
        description: `Welcome to ${selectedPlan.name}! Your benefits are now active.`,
      });

      setShowPurchasePage(false);
      setSelectedPlan(null);
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error completing purchase:', error);
      toast({
        title: "Purchase Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sweet plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold text-gradient flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-warning animate-pulse" />
          Sweet Membership Plans
          <Sparkles className="w-8 h-8 text-warning animate-pulse" />
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join our bakery family and enjoy exclusive benefits, discounts, and magical treats delivered to your door! 🧁✨
        </p>
      </motion.div>

      {userSubscription && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6 bg-gradient-to-r from-success/20 to-sage/20 border-2 border-success/30 shadow-magical">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-success mb-1">Active Membership</h3>
              <p className="text-sm text-muted-foreground">
                Your membership is active until {new Date(userSubscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {plans.map((plan, index) => {
            const isCurrentPlan = userSubscription?.plan_id === plan.id;
            const benefits = getMembershipBenefits(plan.tier);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`
                    p-8 relative overflow-hidden transition-all duration-300 hover:scale-105 shadow-magical
                    bg-gradient-to-br ${getTierGradient(plan.tier)}
                    border-2 ${isCurrentPlan ? 'border-success' : 'border-primary/30'}
                    ${plan.tier === 'royal' ? 'ring-2 ring-warning/50' : ''}
                  `}
                >
                  {plan.tier === 'royal' && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-warning to-lemon text-foreground px-4 py-1 text-xs font-bold rounded-br-xl">
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getTierIcon(plan.tier)}
                        <h3 className="text-2xl font-bold text-gradient">{plan.name}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    </div>

                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-1">
                        ₹{plan.price_monthly}
                      </div>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>

                    <Separator className="bg-border/50" />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-center text-foreground">Membership Benefits:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-success" />
                          <span className="text-sm">{benefits.discount} discount on all orders</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-success" />
                          <span className="text-sm">Free delivery on {benefits.freeDelivery} orders</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-success" />
                          <span className="text-sm">{benefits.priority} customer support</span>
                        </div>
                        {benefits.earlyAccess && (
                          <div className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-success" />
                            <span className="text-sm">Early access to new products</span>
                          </div>
                        )}
                        {benefits.customCakes && (
                          <div className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-success" />
                            <span className="text-sm">Custom cake design service</span>
                          </div>
                        )}
                        {benefits.birthdaySpecial && (
                          <div className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-success" />
                            <span className="text-sm">Free birthday cake annually</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleStartPurchase(plan)}
                      disabled={isCurrentPlan}
                      className={`
                        w-full transition-all duration-300 hover:scale-105 shadow-bounce border-0
                        ${plan.tier === 'royal' 
                          ? 'bg-gradient-to-r from-warning to-lemon hover:from-lemon hover:to-warning text-foreground' 
                          : 'bg-gradient-to-r from-primary to-candy hover:from-candy hover:to-primary text-card'
                        }
                        ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade Now! 🚀
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchasePage} onOpenChange={setShowPurchasePage}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gradient">
              <CreditCard className="w-5 h-5" />
              Complete Your Purchase
            </DialogTitle>
            <DialogDescription>
              Secure checkout. Your payment details are encrypted and never stored.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-candy/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedPlan.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                  </div>
                  <div className="text-xl font-bold text-primary">₹{selectedPlan.price_monthly}</div>
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="cursor-pointer">UPI Payment</Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                        placeholder="John Doe"
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                        placeholder="1234 5678 9012 3456"
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input
                          id="expiry"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                          placeholder="MM/YY"
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          placeholder="123"
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchasePage(false)}
                  className="flex-1"
                  disabled={purchaseLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCompletePurchase}
                  disabled={purchaseLoading}
                  className="flex-1 bg-gradient-to-r from-primary to-candy hover:from-candy hover:to-primary"
                >
                  {purchaseLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Complete Purchase
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="p-6 bg-gradient-to-br from-secondary/30 to-accent/20 border-2 border-secondary/30">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-gradient">🎁 Special Launch Offer</h3>
          <p className="text-muted-foreground">
            Get your first month at 50% off when you subscribe to any plan! Use code <Badge className="bg-primary text-card">SWEET50</Badge> at checkout.
          </p>
          <p className="text-xs text-muted-foreground">
            * Offer valid for new subscribers only. Cannot be combined with other offers.
          </p>
        </div>
      </Card>
    </div>
  );
}