import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User, ShoppingBag, Award, MapPin, Phone, Heart } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: any;
  membership_tier: string;
  avatar_url?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: any;
}

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: (data.address as any) || {
            street: '',
            city: '',
            state: '',
            pincode: ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Problem loading profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Problem updating profile.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onBack();
  };

  const getTierBadge = (tier: string) => {
    const tiers = {
      regular: { label: 'Regular', color: 'bg-muted' },
      premium: { label: 'Premium', color: 'bg-gradient-to-r from-candy to-primary' },
      gold: { label: 'Gold', color: 'bg-gradient-to-r from-lemon to-warning' }
    };
    const tierInfo = tiers[tier as keyof typeof tiers] || tiers.regular;
    return (
      <Badge className={`${tierInfo.color} text-card shadow-cartoon border-0`}>
        <Award className="w-3 h-3 mr-1" />
        {tierInfo.label} Member
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="border-primary/30 bg-card/80 backdrop-blur-sm shadow-cartoon hover:shadow-bounce transition-all duration-300">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-gradient drop-shadow-lg">🧁 My Profile</h1>
          <Button variant="destructive" onClick={handleLogout} className="bg-gradient-to-r from-destructive to-candy shadow-cartoon hover:shadow-bounce">
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-magical border-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h2>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="hover:bg-primary/10">
                  Edit Profile
                </Button>
              )}
            </div>

            {profile && getTierBadge(profile.membership_tier)}

            <div className="mt-4 space-y-4">
              {editing ? (
                <>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="mt-1 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 XXXXX XXXXX"
                      className="mt-1 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Street/House Number"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="border-primary/30 focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, city: e.target.value}
                        })}
                        className="border-primary/30 focus:border-primary"
                      />
                      <Input
                        placeholder="State"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, state: e.target.value}
                        })}
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                    <Input
                      placeholder="PIN Code"
                      value={formData.address.pincode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: {...formData.address, pincode: e.target.value}
                      })}
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateProfile} className="bg-gradient-to-r from-primary to-candy hover:from-candy hover:to-primary shadow-cartoon">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{profile?.full_name || 'Update your name'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{profile?.phone || 'Add phone number'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-1" />
                  <span>
                    {profile?.address ? 
                      `${(profile.address as any)?.street || ''}, ${(profile.address as any)?.city || ''}, ${(profile.address as any)?.state || ''} - ${(profile.address as any)?.pincode || ''}` 
                      : 'Add your address'
                    }
                  </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Order History */}
          <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-magical border-2 border-candy/20">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-candy" />
              Order History
            </h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-2 text-candy/50" />
                <p>No orders yet</p>
                <p className="text-sm">Place your first sweet order!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.id} className="border border-primary/20 rounded-xl p-3 bg-card/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className={order.status === 'paid' ? 'bg-success text-card' : ''}>
                        {order.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </p>
                    <p className="font-semibold text-primary">
                      ₹{(order.total_amount / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Membership Benefits */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-accent/20 to-sage/20 border-2 border-accent/30 shadow-magical">
          <h2 className="text-xl font-semibold mb-4 text-gradient flex items-center gap-2">
            <Award className="w-6 h-6 text-warning" />
            Your Membership Benefits
          </h2>
          {profile?.membership_tier && getMembershipBenefits(profile.membership_tier)}
        </Card>
      </div>
    </div>
  );

  function getMembershipBenefits(tier: string) {
    const benefits = {
      basic: {
        discount: '10%',
        freeDelivery: '₹300+',
        priority: 'Standard',
        color: 'from-accent/10 to-sage/10',
        icon: '🧁'
      },
      premium: {
        discount: '20%',
        freeDelivery: '₹200+',
        priority: 'Priority',
        color: 'from-candy/10 to-primary/10',
        icon: '⭐'
      },
      royal: {
        discount: '30%',
        freeDelivery: 'Always',
        priority: 'VIP',
        color: 'from-warning/10 to-lemon/10',
        icon: '👑'
      }
    };

    const tierBenefits = benefits[tier as keyof typeof benefits] || benefits.basic;

    return (
      <div className={`bg-gradient-to-r ${tierBenefits.color} rounded-xl p-6 border border-primary/20`}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{tierBenefits.icon}</div>
          <h3 className="text-xl font-bold capitalize">{tier} Member</h3>
          <p className="text-sm text-muted-foreground">Enjoying exclusive sweet benefits</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              💰
            </div>
            <h4 className="font-medium text-sm">Discount</h4>
            <p className="text-lg font-bold text-primary">{tierBenefits.discount}</p>
            <p className="text-xs text-muted-foreground">on all orders</p>
          </div>
          
          <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-2">
              🚚
            </div>
            <h4 className="font-medium text-sm">Free Delivery</h4>
            <p className="text-lg font-bold text-success">{tierBenefits.freeDelivery}</p>
            <p className="text-xs text-muted-foreground">orders</p>
          </div>
          
          <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-2">
              ⚡
            </div>
            <h4 className="font-medium text-sm">Support</h4>
            <p className="text-lg font-bold text-warning">{tierBenefits.priority}</p>
            <p className="text-xs text-muted-foreground">customer care</p>
          </div>
          
          <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-candy/20 rounded-full flex items-center justify-center mx-auto mb-2">
              🎁
            </div>
            <h4 className="font-medium text-sm">Special Perks</h4>
            <p className="text-lg font-bold text-candy">
              {tier === 'royal' ? 'VIP' : tier === 'premium' ? 'Extra' : 'Basic'}
            </p>
            <p className="text-xs text-muted-foreground">access</p>
          </div>
        </div>

        {tier === 'premium' && (
          <div className="mt-4 p-3 bg-candy/10 rounded-lg border border-candy/20">
            <p className="text-sm text-center text-candy font-medium">✨ Early access to new products & custom cake designs!</p>
          </div>
        )}

        {tier === 'royal' && (
          <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-sm text-center text-warning font-medium">👑 VIP perks: Free birthday cake, priority support & exclusive events!</p>
          </div>
        )}

        {tier === 'basic' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Want more sweet benefits?</p>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-primary to-candy hover:from-candy hover:to-primary"
              onClick={() => window.location.href = '/membership'}
            >
              Upgrade Membership 🚀
            </Button>
          </div>
        )}
      </div>
    );
  }
}