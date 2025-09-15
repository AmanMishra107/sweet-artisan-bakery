import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, MapPin, Clock, Check, Truck, Star, Gift, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutPageProps {
  cart: CartItem[];
  onBack: () => void;
  onOrderComplete: () => void;
  preAppliedPromoCode?: string;
  preAppliedDiscount?: number;
}

export default function CheckoutPage({ cart, onBack, onOrderComplete, preAppliedPromoCode = '', preAppliedDiscount = 0 }: CheckoutPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    specialInstructions: '',
    saveAddress: false,
    subscribeNewsletter: false
  });
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [promoCode, setPromoCode] = useState(preAppliedPromoCode);
  const [promoDiscount, setPromoDiscount] = useState(preAppliedDiscount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'express' ? 50 : deliveryMethod === 'premium' ? 80 : 25;
  const tax = Math.round(subtotal * 0.05);
  const tipAmount = selectedTip;
  const total = subtotal + deliveryFee + tax + tipAmount - promoDiscount;

  // Calculate discount when pre-applied promo code is present
  useEffect(() => {
    if (preAppliedPromoCode && preAppliedDiscount > 0) {
      const discountAmountValue = Math.round(subtotal * (preAppliedDiscount / 100));
      setPromoDiscount(discountAmountValue);
      if (preAppliedPromoCode) {
        toast({
          title: "Review discount applied! 🎉",
          description: `${preAppliedPromoCode} (${preAppliedDiscount}% off) - ₹${discountAmountValue} saved!`,
        });
      }
    }
  }, [preAppliedPromoCode, preAppliedDiscount, subtotal]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.email && formData.firstName && formData.lastName && formData.phone;
      case 2:
        return formData.address && formData.city && formData.postalCode;
      case 3:
        if (formData.paymentMethod === 'card') {
          return formData.cardNumber && formData.expiryDate && formData.cvv && formData.nameOnCard;
        }
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "Please complete all required fields",
        variant: "destructive"
      });
    }
  };

  const applyPromoCode = () => {
    const code = promoCode.toLowerCase();
    
    // Review reward codes
    if (code === 'sweet20') {
      setPromoDiscount(Math.round(subtotal * 0.2));
      toast({
        title: "Review reward applied! 🌟",
        description: "You saved 20% with your 5-star review!",
      });
    } else if (code === 'sweet15') {
      setPromoDiscount(Math.round(subtotal * 0.15));
      toast({
        title: "Review reward applied! ⭐",
        description: "You saved 15% with your 4-star review!",
      });
    } else if (code === 'sweet10') {
      setPromoDiscount(Math.round(subtotal * 0.1));
      toast({
        title: "Review reward applied! 👍",
        description: "You saved 10% with your review!",
      });
    } else if (code === 'sweet5') {
      setPromoDiscount(Math.round(subtotal * 0.05));
      toast({
        title: "Review reward applied! 🎁",
        description: "You saved 5% with your review!",
      });
    } else if (code === 'firstorder') {
      setPromoDiscount(50);
      toast({
        title: "Welcome discount applied!",
        description: "₹50 off your first order.",
      });
    } else {
      toast({
        title: "Invalid promo code",
        description: "Please check your code and try again.",
        variant: "destructive"
      });
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login required",
          description: "Please sign in before placing your order.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Create order in database
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: cart as any,
          amount: Math.round(subtotal),
          delivery_fee: Math.round(deliveryFee),
          total_amount: Math.round(total),
          delivery_address: {
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode
          } as any,
          special_instructions: formData.specialInstructions,
          status: 'pending'
        });
  
      if (error) throw error;

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Order placed successfully!",
        description: "You'll receive an email confirmation shortly.",
      });
      
      setCurrentStep(5); // Success step
    } catch (error: any) {
      console.error('Order error:', error);
      toast({
        title: "Order failed",
        description: error?.message || "Something went wrong while placing your order.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: "Contact Info", completed: currentStep > 1 },
    { number: 2, title: "Delivery & Extras", completed: currentStep > 2 },
    { number: 3, title: "Payment", completed: currentStep > 3 },
    { number: 4, title: "Review & Confirm", completed: currentStep > 4 },
  ];

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-success-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. We'll start preparing your delicious items right away.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="font-medium">Order #BK-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">Estimated delivery: 45-60 minutes</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={onOrderComplete} className="bg-gradient-to-r from-primary to-warning">
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Print Receipt
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
            <h1 className="text-2xl font-display font-bold text-gradient">Sweet Artisan Checkout</h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.completed ? 'bg-success text-success-foreground' :
                  currentStep === step.number ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step.completed ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.number ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step.completed ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <Card className="p-6">
                <h2 className="text-xl font-display font-semibold mb-6">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Delivery */}
            {currentStep === 2 && (
              <Card className="p-6">
                <h2 className="text-xl font-display font-semibold mb-6">Delivery Information</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold mb-4">Delivery Options</h3>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="standard" id="standard" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="font-medium cursor-pointer">
                        Standard Delivery (45-60 min) - ₹25
                      </Label>
                      <p className="text-sm text-muted-foreground">Perfect for when you can wait a bit</p>
                    </div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="express" id="express" />
                    <div className="flex-1">
                      <Label htmlFor="express" className="font-medium cursor-pointer">
                        Express Delivery (20-30 min) - ₹50
                      </Label>
                      <p className="text-sm text-muted-foreground">When you need it fast!</p>
                    </div>
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                </RadioGroup>
              </Card>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <Card className="p-6">
                <h2 className="text-xl font-display font-semibold mb-6">Payment Method</h2>
                <RadioGroup value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                  <div className="flex items-center space-x-2 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="font-medium cursor-pointer flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="font-medium cursor-pointer">
                      Cash on Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="font-medium cursor-pointer">
                      UPI Payment
                    </Label>
                  </div>
                </RadioGroup>

                {formData.paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="nameOnCard">Name on Card *</Label>
                      <Input
                        id="nameOnCard"
                        value={formData.nameOnCard}
                        onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date *</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <Card className="p-6">
                <h2 className="text-xl font-display font-semibold mb-6">Review Your Order</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <p className="text-muted-foreground">{formData.firstName} {formData.lastName}</p>
                    <p className="text-muted-foreground">{formData.email}</p>
                    <p className="text-muted-foreground">{formData.phone}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Delivery Address</h3>
                    <p className="text-muted-foreground">{formData.address}</p>
                    <p className="text-muted-foreground">{formData.city}, {formData.postalCode}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p className="text-muted-foreground capitalize">{formData.paymentMethod.replace(/([A-Z])/g, ' $1')}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="bg-gradient-to-r from-primary to-warning">
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-success to-primary"
                >
                  {isProcessing ? 'Processing...' : `Place Order (₹${total})`}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-display font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>₹{tax}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-gradient">₹{total}</span>
              </div>

              <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 text-success">
                  <Star className="h-4 w-4" />
                  <span className="text-sm font-medium">Premium Member Benefits</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Free delivery on orders above ₹500. You saved ₹{subtotal > 500 ? deliveryFee : 0}!
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}