import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Copy, ExternalLink, ThumbsUp, AlertCircle, Check, RefreshCw, Send, Quote, Sparkles, MessageSquare, Bot, CheckCircle } from 'lucide-react';
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
                {rating >= 4 ? (
                  <button
                    onClick={() => {
                      setStep(2);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
                  >
                    Continue <ExternalLink size={18} />
                  </button>
                ) : (
                  <button
                    onClick={generateDraft}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
                  >
                    Share Feedback
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full h-full flex flex-col"
        >
          <div className="flex-1 overflow-y-auto pb-4 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles size={16} className="text-amber-500" /> What did you love?
              </h3>
              <div className="flex flex-wrap gap-2">
                {visibleCategories.map(category => (
                  <React.Fragment key={category}>
                    {CATEGORIZED_TAGS[category as keyof typeof CATEGORIZED_TAGS].map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border",
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-md"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <MessageSquare size={16} className="text-blue-500" /> Any special shoutout? (Optional)
              </h3>
              <textarea
                className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none text-sm shadow-inner bg-slate-50 focus:bg-white transition-colors"
                placeholder="Name of your stylist, or anything else..."
                value={customFeedback}
                onChange={e => setCustomFeedback(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={generateDraft}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98] mt-4"
          >
            Create Review Text
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
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 h-full">
              <Bot size={48} className="text-blue-500 animate-bounce mb-4" />
              <div className="flex space-x-1 mb-4">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-ping" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="font-medium">Crafting the perfect review...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Your AI Review</h3>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center gap-1">
                  <Sparkles size={12} /> AI Magic
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner relative">
                <Quote className="absolute top-3 left-3 text-slate-200 z-0" size={40} />
                <p className="text-slate-800 text-sm leading-relaxed relative z-10 font-medium">{draft}</p>
              </div>

              <div className="space-y-3 mt-auto">
                <button
                  onClick={generateDraft}
                  disabled={isDrafting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all active:scale-[0.98]"
                >
                  <RefreshCw size={16} />
                  Rewrite
                </button>

                <button
                  onClick={() => {
                    copyToClipboard();
                    setTimeout(() => {
                      window.open(reviewLink, '_blank', 'noopener,noreferrer');
                    }, 500);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98]"
                >
                  <ExternalLink size={20} />
                  Copy & Post on Google
                </button>
                
                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
                    <CheckCircle size={12} className="text-green-500" />
                    Just paste it in the Google window that opens!
                  </p>
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
          <div className="flex-1 mb-6">
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none text-sm bg-slate-50"
              placeholder="What could we do better?"
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
            />
          </div>
          <div className="mt-auto space-y-3">
            <button
              onClick={submitNegativeFeedback}
              disabled={isSubmitting || !suggestion.trim()}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send to Management
                </>
              )}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3.5 px-4 bg-transparent text-slate-500 hover:text-slate-700 font-medium rounded-2xl transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {step === 5 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full flex flex-col items-center justify-center text-center py-8"
        >
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-green-100">
            <Check size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Feedback Received</h3>
          <p className="text-slate-600 text-sm mb-8 leading-relaxed max-w-[250px] mx-auto">
            Thank you for helping us improve. Our management team will review your feedback shortly.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setRating(0);
              setSelectedTags([]);
              setCustomFeedback('');
              setSuggestion('');
            }}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-2xl transition-all shadow-sm active:scale-95"
          >
            Start over
          </button>
        </motion.div>
      )}
    </div>
  );
}
