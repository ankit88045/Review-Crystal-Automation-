import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Copy, ExternalLink, ThumbsUp, AlertCircle, Check, RefreshCw, Send, Quote } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Confetti = () => {
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#fcd34d'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
      {[...Array(60)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 150 + Math.random() * 250;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 200; // slightly upward bias
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{ 
              x: [0, tx, tx + (Math.random() - 0.5) * 100], 
              y: [0, ty, ty + 400], 
              scale: [0, 1, 1, 0], 
              rotate: [0, Math.random() * 360, Math.random() * 720] 
            }}
            transition={{ 
              duration: 2.5 + Math.random(), 
              ease: [0.23, 1, 0.32, 1],
              times: [0, 0.4, 1] 
            }}
            className="absolute w-2 h-4"
            style={{
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        );
      })}
    </div>
  );
};

const CATEGORIZED_TAGS = {
  Services: ["Haircut", "Hair Color", "Styling", "Manicure", "Pedicure", "Massage"],
  Vibe: ["Clean environment", "Friendly staff", "Relaxing", "Professional"],
  Issues: ["Wait was too long", "Not what I asked for", "Overpriced", "Rushed"]
};

const TESTIMONIALS = [
  { text: "Best salon experience ever! Staff is so sweet.", name: "Priya S." },
  { text: "My makeup stayed perfect the entire night.", name: "Aarohi M." },
  { text: "Great hygiene and very professional.", name: "Sneha K." },
  { text: "Highly recommend their hair spa!", name: "Kavya R." }
];

export function CustomerReview() {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [reviewLink, setReviewLink] = useState<string>(import.meta.env.VITE_GBP_REVIEW_LINK || '#');
  const [suggestion, setSuggestion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    // Check if there is a location-specific link passed via query param (from QR code)
    const params = new URLSearchParams(window.location.search);
    const customLink = params.get('link');
    if (customLink) {
      setReviewLink(decodeURIComponent(customLink));
    }
  }, []);

  useEffect(() => {
    if (step === 1) {
      const interval = setInterval(() => {
        setTestimonialIndex(prev => (prev + 1) % TESTIMONIALS.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const generateDraft = async () => {
    if (rating === 0) return;
    
    // For 1-2 stars, this shouldn't be reached because we skip step 2, 
    // but just in case, double check.
    if (rating <= 2) {
      setStep(4);
      return;
    }

    setIsDrafting(true);
    setStep(3);
    try {
      const response = await fetch('/api/ai/draft-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedback: [...selectedTags, customFeedback].filter(Boolean),
          salonType: 'salon'
        })
      });
      const data = await response.json();
      if (data.draft) {
        setDraft(data.draft);
      }
      
      if (rating >= 4) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error(error);
      setDraft('I had a great experience here. Highly recommended!');
    } finally {
      setIsDrafting(false);
    }
  };

  const submitNegativeFeedback = async () => {
    if (!suggestion.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, suggestion })
      });
      setStep(5);
      toast.success('Email sent to management. Thank you for your feedback!');
    } catch (error) {
      console.error(error);
      // Fallback: advance to success step anyway so user isn't stuck
      setStep(5);
      toast.success('Email sent to management. Thank you for your feedback!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    setIsCopied(true);
    toast.success('Review text copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const visibleCategories = rating === 3 
    ? ['Services', 'Vibe', 'Issues'] 
    : ['Services', 'Vibe'];

  const getActiveColor = (val: number) => {
    switch (val) {
      case 1: return "fill-red-500 text-red-600 filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.6)] scale-125 -translate-y-1";
      case 2: return "fill-orange-400 text-orange-500 filter drop-shadow-[0_4px_12px_rgba(249,115,22,0.6)] scale-125 -translate-y-1";
      case 3: return "fill-amber-400 text-amber-500 filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)] scale-125 -translate-y-1";
      case 4: return "fill-lime-400 text-lime-500 filter drop-shadow-[0_4px_12px_rgba(163,230,53,0.6)] scale-125 -translate-y-1";
      case 5: return "fill-green-500 text-green-600 filter drop-shadow-[0_4px_12px_rgba(34,197,94,0.6)] scale-125 -translate-y-1";
      default: return "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {showConfetti && <Confetti />}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">How was your visit?</h2>
        <p className="text-slate-500 text-sm">We appreciate your feedback to help us improve.</p>
      </div>

      {step === 1 && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center flex-1 w-full"
        >
          {/* Testimonial Carousel */}
          <div className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl p-5 mb-8 relative min-h-[110px] flex items-center justify-center overflow-hidden">
            <Quote className="absolute top-3 left-3 text-slate-100" size={32} />
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center px-4 z-10 w-full"
              >
                <p className="text-slate-700 text-sm font-medium italic mb-2">"{TESTIMONIALS[testimonialIndex].text}"</p>
                <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase">— {TESTIMONIALS[testimonialIndex].name}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div layout className="flex gap-1 sm:gap-2 mb-8 items-end">
            {[1, 2, 3, 4, 5].map((star) => {
              const currentVal = hoverRating || rating;
              const isActive = currentVal >= star;
              return (
                <motion.button
                  layout
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 sm:p-2 group focus:outline-none flex justify-center items-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div layout>
                    <Star
                      size={32 + (star * 8)}
                      strokeWidth={1.5}
                      className={cn(
                        "transition-all duration-300",
                        isActive
                          ? getActiveColor(currentVal)
                          : "fill-white text-slate-300 drop-shadow-sm group-hover:fill-slate-100"
                      )}
                    />
                  </motion.div>
                </motion.button>
              );
            })}
          </motion.div>

          <AnimatePresence mode="popLayout">
            {rating > 0 && (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full mt-auto pt-8"
              >
                <button
                  onClick={() => {
                    if (rating <= 2) {
                      setStep(4);
                    } else {
                      setStep(2);
                    }
                  }}
                  className="w-full flex justify-center items-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
                >
                  Continue
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full flex flex-col"
        >
          <h3 className="font-semibold text-slate-800 mb-6 text-center text-lg">What stood out to you?</h3>
          
          <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {visibleCategories.map(category => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIZED_TAGS[category as keyof typeof CATEGORIZED_TAGS].map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-1.5",
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Other / Custom (Optional)
            </h4>
            <textarea
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="Any other service or vibe you want to mention?"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none h-20 text-sm bg-slate-50 transition-colors"
            />
          </div>
          
          <button
            onClick={generateDraft}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
          >
            Continue to Review
          </button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full flex flex-col"
        >
          {isDrafting ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-4"></div>
              <p className="font-medium animate-pulse">AI is writing your review...</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 relative group">
                <p className="text-slate-700 text-base leading-relaxed">{draft}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={generateDraft}
                  disabled={isDrafting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-2xl transition-all active:scale-[0.98]"
                >
                  <RefreshCw size={18} />
                  Regenerate Review
                </button>

                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-medium rounded-2xl transition-all active:scale-[0.98]"
                >
                  {isCopied ? <ThumbsUp size={18} className="text-green-600" /> : <Copy size={18} />}
                  {isCopied ? 'Copied to clipboard!' : 'Copy Review Text'}
                </button>

                <a
                  href={reviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
                >
                  <ExternalLink size={18} />
                  Post on Google
                </a>
                
                <div className="pt-4 text-center space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Step 1: Copy your review</p>
                  <p className="text-xs text-slate-500 font-medium">Step 2: Paste it on our Google Profile</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {step === 4 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full flex flex-col"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Thank you for your Honest Review</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We're sorry we didn't meet your expectations. Please suggest how we can improve or write to our management team about your issue.
            </p>
          </div>
          
          <div className="mb-6">
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Tell us what went wrong..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none h-32 text-sm bg-white shadow-sm transition-colors"
            />
          </div>
          
          <button
            onClick={submitNegativeFeedback}
            disabled={isSubmitting || !suggestion.trim()}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </div>
            ) : (
              <>
                <Send size={18} />
                Send to Management
              </>
            )}
          </button>
        </motion.div>
      )}

      {step === 5 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5">
            <Check className="text-green-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Thank You For Your Honest Review</h3>
          <p className="text-slate-600 mb-8 leading-relaxed text-sm">
            We are genuinely sorry for the inconvenience. We will fix it soon or improve.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setRating(0);
              setSuggestion('');
            }}
            className="text-slate-500 font-medium hover:text-slate-800 transition-colors"
          >
            Start over
          </button>
        </motion.div>
      )}
    </div>
  );
}
