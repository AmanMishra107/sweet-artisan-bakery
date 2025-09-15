import React, { useState } from 'react';
import { Heart, Share2, Gift, Calendar, Award, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export const FavoriteButton = ({ productId, productName }: { productId: string; productName: string }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: `${productName} ${isFavorited ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFavorite}
      className={`p-2 ${isFavorited ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
    </Button>
  );
};

export const ShareButton = ({ productName }: { productName: string }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${productName} at Sweet Artisan Bakery`,
          text: `I found this amazing ${productName} at Sweet Artisan Bakery!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard.",
      });
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleShare} className="p-2">
      <Share2 className="h-4 w-4" />
    </Button>
  );
};

export const LoyaltyCard = () => {
  const [points, setPoints] = useState(150);
  const [level, setLevel] = useState('Silver');

  return (
    <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-foreground">Sweet Rewards</h3>
        </div>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {level} Member
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Points</span>
            <span className="font-medium">{points} / 500</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(points / 500) * 100}%` }}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {500 - points} points until Gold status and free delivery for life!
        </p>
        
        <Button 
          size="sm" 
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          onClick={() => {
            setPoints(prev => Math.min(prev + 25, 500));
            toast({ title: "Bonus points added!", description: "+25 points for being awesome!" });
          }}
        >
          Claim Daily Bonus
        </Button>
      </div>
    </Card>
  );
};

export const WeeklySpecial = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  
  const special = {
    name: "Mystery Monday Muffin",
    originalPrice: 85,
    specialPrice: 60,
    description: "Our baker's special creation of the week!"
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-foreground">Weekly Special</h3>
        <Badge className="bg-purple-100 text-purple-800">Limited Time</Badge>
      </div>
      
      {!isRevealed ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground mb-4">Click to reveal this week's special!</p>
          <Button 
            onClick={() => setIsRevealed(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Reveal Special 🎁
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">{special.name}</h4>
          <p className="text-sm text-muted-foreground">{special.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gradient">₹{special.specialPrice}</span>
            <span className="text-sm text-muted-foreground line-through">₹{special.originalPrice}</span>
            <Badge variant="destructive" className="text-xs">30% OFF</Badge>
          </div>
          <Button size="sm" className="w-full">
            Add to Cart
          </Button>
        </div>
      )}
    </Card>
  );
};

export const BakingTip = () => {
  const tips = [
    "Always use room temperature ingredients for better mixing and texture.",
    "Preheat your oven for at least 15 minutes before baking for even heat distribution.",
    "Don't overmix cake batter - mix just until ingredients are combined.",
    "Use parchment paper for easy removal and even browning.",
    "Store cookies in an airtight container with a slice of bread to keep them soft."
  ];
  
  const [currentTip, setCurrentTip] = useState(0);

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Coffee className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-foreground">Pro Baking Tip</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tips[currentTip]}
        </p>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setCurrentTip(prev => (prev + 1) % tips.length)}
          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          Next Tip 💡
        </Button>
      </div>
    </Card>
  );
};

export const OrderScheduler = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      toast({
        title: "Order scheduled!",
        description: `Your order will be prepared for ${selectedDate} at ${selectedTime}`,
      });
    } else {
      toast({
        title: "Please select date and time",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-foreground">Schedule Order</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-green-200 rounded-lg text-sm"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Time</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full p-2 border border-green-200 rounded-lg text-sm"
          >
            <option value="">Select time</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleSchedule}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          Schedule Order 📅
        </Button>
      </div>
    </Card>
  );
};