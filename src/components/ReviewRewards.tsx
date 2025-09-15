import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Gift, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface ReviewRewardsProps {
  onDiscountGenerated?: (code: string, discount: number) => void;
}

const ReviewRewards: React.FC<ReviewRewardsProps> = ({ onDiscountGenerated }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const generateDiscountCode = (rating: number) => {
    const codes = {
      5: { code: 'SWEET20', discount: 20 },
      4: { code: 'SWEET15', discount: 15 },
      3: { code: 'SWEET10', discount: 10 },
      2: { code: 'SWEET5', discount: 5 },
      1: { code: 'SWEET5', discount: 5 }
    };
    return codes[rating as keyof typeof codes] || codes[1];
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Please rate us!",
        description: "Your rating helps us improve our bakery.",
        variant: "destructive"
      });
      return;
    }

    if (review.trim().length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters to help other customers.",
        variant: "destructive"
      });
      return;
    }

    const discount = generateDiscountCode(rating);
    setDiscountCode(discount.code);
    setDiscountAmount(discount.discount);
    setIsSubmitted(true);
    
    onDiscountGenerated?.(discount.code, discount.discount);

    toast({
      title: "Thank you for your review! 🎉",
      description: `You've earned a ${discount.discount}% discount code: ${discount.code}`,
    });
  };

  const copyDiscountCode = () => {
    navigator.clipboard.writeText(discountCode);
    setIsCopied(true);
    toast({
      title: "Discount code copied!",
      description: "Apply it at checkout to save money.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isSubmitted) {
    return (
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <Gift className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Thank You for Your Review! 🎉
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your feedback helps us serve you better. Here's your exclusive discount code!
              </p>
            </div>

            <Card className="max-w-md mx-auto p-8 bg-gradient-to-br from-orange-100 to-red-100 border-orange-200">
              <div className="text-center">
                <div className="bg-white rounded-lg p-4 mb-4 shadow-md">
                  <p className="text-sm text-muted-foreground mb-2">Your Discount Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-orange-600 tracking-wider">
                      {discountCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyDiscountCode}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="bg-orange-500 text-white rounded-lg p-3 mb-4">
                  <p className="font-semibold text-lg">{discountAmount}% OFF</p>
                  <p className="text-sm opacity-90">on your next order</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Code applied automatically to your cart. Valid for 30 days.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Share Your Experience & Get Rewarded! 🍰
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Rate your experience and write a review to unlock exclusive discount codes for your next order
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">How would you rate your experience?</h3>
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {rating === 5 && "Amazing! 🌟"}
                  {rating === 4 && "Great! 😊"}
                  {rating === 3 && "Good! 👍"}
                  {rating === 2 && "Okay 😐"}
                  {rating === 1 && "We'll do better 😔"}
                </motion.p>
              )}
            </div>

            {/* Review Text */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tell us more about your experience</h3>
              <Textarea
                placeholder="What did you love about our bakery? Any suggestions for improvement? Your feedback helps us serve you better..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="min-h-24 bg-white border-orange-200 focus:border-orange-400"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {review.length}/150 characters (minimum 10 required)
              </p>
            </div>

            {/* Reward Preview */}
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4 border border-orange-200"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-orange-700">Your Reward Preview</span>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Complete your review to get <span className="font-bold text-orange-600">
                    {generateDiscountCode(rating).discount}% OFF
                  </span> your next order!
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0 || review.trim().length < 10}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3"
            >
              Submit Review & Get Discount Code 🎁
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ReviewRewards;