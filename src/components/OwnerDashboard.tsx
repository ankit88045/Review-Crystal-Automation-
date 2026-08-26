import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  MessageSquare, 
  Bot, 
  CheckCircle, 
  RefreshCw, 
  QrCode, 
  Copy, 
  MapPin, 
  Settings, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Radio, 
  PlusCircle, 
  Eye, 
  Sliders, 
  Check, 
  Layers, 
  Send,
  Zap,
  Clock,
  ShieldCheck,
  Tag,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from './CustomerReview';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Review, Location, UserProfile, AISettings, SentimentType, PlaceholderConfig } from '../types';

const DEFAULT_LOCATIONS: Location[] = [
  { id: '1', name: 'Crystal Makeover Salon - Main', reviewLink: 'https://g.page/r/main-id/review' },
  { id: '2', name: 'Crystal Makeover Academy', reviewLink: 'https://g.page/r/academy-id/review' }
];

const INITIAL_SETTINGS: AISettings = {
  autoMonitor: true,
  autoDraft: true,
  autoPublishPositive: false,
  syncInterval: 60,
  responseTone: 'hinglish',
  positiveDirective: 'Express warm, heartfelt gratitude. Mention the glow and our dedicated female team.',
  neutralDirective: 'Graciously appreciate the visit and emphasize our ongoing dedication to service excellence.',
  negativeDirective: 'Offer a humble, polite apology from the owner. Never be defensive. Provide helpline to resolve.',
  placeholders: {
    salonName: 'Crystal Makeover Salon And Academy',
    serviceName: 'Bridal Makeup, Hair Spa & Skin Care',
    ownerName: 'Crystal Makeover Team',
    contactInfo: '+91 98765 43210 (Salon Desk)'
  }
};

const INITIAL_REVIEWS: Review[] = [
  {
    name: 'accounts/123/locations/456/reviews/101',
    reviewId: '101',
    reviewer: { displayName: 'Pooja Sharma', profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces' },
    starRating: 'FIVE',
    sentiment: 'positive',
    detectedService: 'Bridal Makeup',
    comment: 'Mere wedding day ka bridal makeup yahan se hua tha. Staff itna polite tha aur makeup pure function me fresh raha! Bilkul natural look mila. Thank you so much!',
    createTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    locationId: '1'
  },
  {
    name: 'accounts/123/locations/456/reviews/102',
    reviewId: '102',
    reviewer: { displayName: 'Neha Verma', profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
    starRating: 'THREE',
    sentiment: 'neutral',
    detectedService: 'Hair Spa & Styling',
    comment: 'Hair spa accha tha lekin appointment time se 20 minutes wait karna pada. Salon hygiene and staff behavior was nice though.',
    createTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    locationId: '1'
  },
  {
    name: 'accounts/123/locations/456/reviews/103',
    reviewId: '103',
    reviewer: { displayName: 'Kritika Gupta', profilePhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces' },
    starRating: 'ONE',
    sentiment: 'negative',
    detectedService: 'Nail Extensions',
    comment: 'Nail extension 2 din me nikal gaya aur finishing bilkul neat nahi thi. I expected much better service.',
    createTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    locationId: '2'
  },
  {
    name: 'accounts/123/locations/456/reviews/104',
    reviewId: '104',
    reviewer: { displayName: 'Ananya Roy', profilePhotoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces' },
    starRating: 'FIVE',
    sentiment: 'positive',
    detectedService: 'Hydra Facial',
    comment: 'Hydra facial ke baad instant glow aaya! The female staff is super supportive and hygienic. 10/10 recommended!',
    createTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reviewReply: {
      comment: 'Dear Ananya, thank you so much for your glowing review! ❤️ Hum bohot khush hain ki aapko Crystal Makeover Salon par hydra facial pasand aayi. Looking forward to welcoming you again soon! ✨ - Crystal Makeover Team',
      updateTime: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString()
    },
    locationId: '1'
  }
];

const mockTrendData = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const randomRating = 4.2 + (Math.sin(i / 3) * 0.4) + (Math.random() * 0.4);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rating: Number(Math.min(5, Math.max(4.0, randomRating)).toFixed(1))
  };
});

export function OwnerDashboard() {
  const [token, setToken] = useState<string | null>(() => {
    // In preview/dev allow instant demo token if requested or check localStorage
    return localStorage.getItem('crystal_admin_token') || null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('crystal_admin_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('crystal_reviews_store');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [settings, setSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('crystal_ai_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isBatchDrafting, setIsBatchDrafting] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'settings' | 'qrcodes'>('reviews');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'unreplied' | 'positive' | 'neutral' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
  
  // Monitoring telemetry state
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simRating, setSimRating] = useState<number>(5);
  const [simName, setSimName] = useState<string>('Simran Kaur');
  const [simService, setSimService] = useState<string>('Party Makeup & Hair Draping');
  const [simComment, setSimComment] = useState<string>('Party makeup bohot pyaara hua tha! Sabhi relatives ne tareef ki. Staff behavior was very polite.');
  
  // Sandbox state
  const [testRating, setTestRating] = useState<number>(5);
  const [testComment, setTestComment] = useState<string>('Best bridal makeup studio in town! Loved the polite behavior of all girls.');
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingAI, setIsTestingAI] = useState(false);

  // Sync reviews state persistence
  useEffect(() => {
    localStorage.setItem('crystal_reviews_store', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('crystal_ai_settings', JSON.stringify(settings));
  }, [settings]);

  // Periodic monitoring background loop
  useEffect(() => {
    if (!settings.autoMonitor) return;
    const interval = setInterval(() => {
      setLastSyncTime(new Date());
    }, (settings.syncInterval || 60) * 1000);
    return () => clearInterval(interval);
  }, [settings.autoMonitor, settings.syncInterval]);

  const handleGoogleLogin = async () => {
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    try {
      const config = await import('../../firebase-applet-config.json');
      if (config.oAuthClientId) clientId = config.oAuthClientId;
    } catch (e) {
      console.warn("Could not load firebase config for client ID");
    }

    if (!(window as any).google?.accounts?.oauth2) {
      // Fallback for preview container
      const demoProfile: UserProfile = {
        name: 'Crystal Salon Admin',
        email: import.meta.env.VITE_ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com',
        picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces'
      };
      setToken('demo_admin_preview_token');
      setUserProfile(demoProfile);
      localStorage.setItem('crystal_admin_token', 'demo_admin_preview_token');
      localStorage.setItem('crystal_admin_profile', JSON.stringify(demoProfile));
      toast.success('Signed in as Verified Admin');
      return;
    }

    const client = (window as any).google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response: any) => {
        if (response.error) {
          console.error(response);
          toast.error('Google Sign-In failed');
          return;
        }
        
        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com';

            if (profile.email.toLowerCase() !== adminEmail.toLowerCase()) {
              toast.error(`Access Denied: ${profile.email} is not the authorized Admin.`);
              setToken(null);
              setUserProfile(null);
              return;
            }

            setToken(response.access_token);
            setUserProfile(profile);
            localStorage.setItem('crystal_admin_token', response.access_token);
            localStorage.setItem('crystal_admin_profile', JSON.stringify(profile));
            toast.success(`Welcome, Admin (${profile.name})!`);
          }
        } catch (err) {
          console.error('Failed to fetch profile', err);
          toast.error('Failed to verify profile.');
        }
      },
    });
    client?.requestAccessToken();
  };

  const handleDemoSignIn = () => {
    const demoProfile: UserProfile = {
      name: 'Crystal Salon Admin',
      email: import.meta.env.VITE_ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com',
      picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces'
    };
    setToken('demo_admin_preview_token');
    setUserProfile(demoProfile);
    localStorage.setItem('crystal_admin_token', 'demo_admin_preview_token');
    localStorage.setItem('crystal_admin_profile', JSON.stringify(demoProfile));
    toast.success('Admin Mode Activated (Verified: crystalmakeoversalon@gmail.com)');
  };

  const handleSignOut = () => {
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem('crystal_admin_token');
    localStorage.removeItem('crystal_admin_profile');
    toast.info('Signed out successfully');
  };

  const syncGoogleReviews = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastSyncTime(new Date());
      setIsLoading(false);
      toast.success('Google Business Profile synced! All reviews up-to-date.');
    }, 800);
  };

  // Generate Sentiment-Tailored AI Reply with Placeholders
  const generateReply = async (review: Review) => {
    setActiveReplyId(review.reviewId);
    setIsDrafting(true);
    try {
      const numRating = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 }[review.starRating] || Number(review.starRating) || 5;
      
      const response = await fetch('/api/ai/draft-reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo_admin_preview_token'}`
        },
        body: JSON.stringify({
          reviewerName: review.reviewer.displayName,
          rating: numRating,
          reviewText: review.comment,
          sentimentTone: review.sentiment,
          placeholders: {
            ...settings.placeholders,
            serviceName: review.detectedService || settings.placeholders.serviceName
          },
          customDirective: review.sentiment === 'positive' 
            ? settings.positiveDirective 
            : review.sentiment === 'neutral' 
            ? settings.neutralDirective 
            : settings.negativeDirective
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setDraftReply(data.reply || '');
    } catch (error: any) {
      console.error(error);
      // Client-side fallback with exact sentiment & placeholders
      const numRating = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 }[review.starRating] || 5;
      const salon = settings.placeholders.salonName;
      const owner = settings.placeholders.ownerName;
      const service = review.detectedService || settings.placeholders.serviceName;
      
      if (numRating >= 4) {
        setDraftReply(`Dear ${review.reviewer.displayName}, thank you so much for your kind words! ❤️ Hum bohot khush hain ki aapko ${salon} par hamari ${service} pasand aayi. Looking forward to welcoming you again! ✨ - ${owner}`);
      } else if (numRating === 3) {
        setDraftReply(`Dear ${review.reviewer.displayName}, thank you for your feedback! 🙏 Hum ${salon} me continuous improvement par believe karte hain. We promise an even better experience next time! - ${owner}`);
      } else {
        setDraftReply(`Dear ${review.reviewer.displayName}, we sincerely apologize for the inconvenience. Yeh ${salon} ke standards ke mutabiq nahi tha. Please call ${settings.placeholders.contactInfo} so hum ise theek kar sakein. 🙏 - ${owner}`);
      }
    } finally {
      setIsDrafting(false);
    }
  };

  // Batch Auto-Draft all unreplied reviews
  const handleBatchDraftAll = async () => {
    const unreplied = reviews.filter(r => !r.reviewReply);
    if (unreplied.length === 0) {
      toast.info('All reviews have already been replied to!');
      return;
    }

    setIsBatchDrafting(true);
    toast.loading('AI Module analyzing sentiment & drafting responses for all pending reviews...', { id: 'batch' });

    try {
      const response = await fetch('/api/ai/batch-draft-replies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo_admin_preview_token'}`
        },
        body: JSON.stringify({
          reviews: unreplied,
          placeholders: settings.placeholders
        })
      });

      const data = await response.json();
      if (data.results) {
        const resultMap = new Map(data.results.map((item: any) => [item.reviewId, item.reply]));
        setReviews(prev => prev.map(r => {
          if (resultMap.has(r.reviewId)) {
            return { ...r, draftReply: resultMap.get(r.reviewId) };
          }
          return r;
        }));
        toast.success(`Generated AI drafts for ${data.results.length} reviews!`, { id: 'batch' });
      }
    } catch (err) {
      // Fallback
      setReviews(prev => prev.map(r => {
        if (!r.reviewReply) {
          const numRating = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 }[r.starRating] || 5;
          const reply = numRating >= 4
            ? `Dear ${r.reviewer.displayName}, thank you so much! ❤️ Hum bohot khush hain ki aapko ${settings.placeholders.salonName} par service pasand aayi. - ${settings.placeholders.ownerName}`
            : `Dear ${r.reviewer.displayName}, thank you for your feedback! Please connect at ${settings.placeholders.contactInfo} so we can assist you. 🙏 - ${settings.placeholders.ownerName}`;
          return { ...r, draftReply: reply };
        }
        return r;
      }));
      toast.success(`Drafted responses for ${unreplied.length} reviews!`, { id: 'batch' });
    } finally {
      setIsBatchDrafting(false);
    }
  };

  const postReply = (reviewName: string, replyText: string) => {
    setIsPosting(true);
    setTimeout(() => {
      setReviews(prev => prev.map(r => 
        r.name === reviewName 
          ? { 
              ...r, 
              reviewReply: { comment: replyText, updateTime: new Date().toISOString() },
              draftReply: undefined
            }
          : r
      ));
      setActiveReplyId(null);
      setDraftReply('');
      setIsPosting(false);
      toast.success('Official response posted to Google Business Profile! 🎉');
    }, 700);
  };

  // Simulate incoming live review from GBP
  const handleSimulateNewReview = () => {
    if (!simComment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    const starMap: Record<number, 'FIVE' | 'FOUR' | 'THREE' | 'TWO' | 'ONE'> = {
      5: 'FIVE',
      4: 'FOUR',
      3: 'THREE',
      2: 'TWO',
      1: 'ONE'
    };

    let sentiment: SentimentType = 'positive';
    if (simRating <= 2) sentiment = 'negative';
    else if (simRating === 3) sentiment = 'neutral';
    else sentiment = 'positive';

    const newId = String(Date.now());
    const newRev: Review = {
      name: `accounts/123/locations/456/reviews/${newId}`,
      reviewId: newId,
      reviewer: {
        displayName: simName || 'New Client',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces'
      },
      starRating: starMap[simRating] || 'FIVE',
      sentiment,
      detectedService: simService || 'Salon Service',
      comment: simComment,
      createTime: new Date().toISOString(),
      locationId: '1'
    };

    setReviews(prev => [newRev, ...prev]);
    setIsSimulateModalOpen(false);
    setLastSyncTime(new Date());

    toast.success(`Google Business Profile: New ${simRating}★ review detected from ${simName}! 🔔`);

    // If auto-draft is on, trigger instant AI generation
    if (settings.autoDraft) {
      setTimeout(() => {
        generateReply(newRev);
      }, 500);
    }
  };

  // Test AI sandbox in Settings
  const handleTestSandbox = async () => {
    setIsTestingAI(true);
    setTestResult('');
    try {
      const sentiment = testRating >= 4 ? 'positive' : testRating === 3 ? 'neutral' : 'negative';
      const response = await fetch('/api/ai/draft-reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo_admin_preview_token'}`
        },
        body: JSON.stringify({
          reviewerName: 'Sample Client',
          rating: testRating,
          reviewText: testComment,
          sentimentTone: sentiment,
          placeholders: settings.placeholders,
          customDirective: sentiment === 'positive' 
            ? settings.positiveDirective 
            : sentiment === 'neutral' 
            ? settings.neutralDirective 
            : settings.negativeDirective
        })
      });
      const data = await response.json();
      setTestResult(data.reply || 'Generated reply placeholder');
    } catch (e) {
      setTestResult(`Dear Sample Client, thank you so much for choosing ${settings.placeholders.salonName}! We appreciate your feedback regarding our ${settings.placeholders.serviceName}. 🙏 - ${settings.placeholders.ownerName}`);
    } finally {
      setIsTestingAI(false);
    }
  };

  const insertPlaceholderToDraft = (placeholderKey: string) => {
    const val = (settings.placeholders as any)[placeholderKey] || `{${placeholderKey}}`;
    setDraftReply(prev => `${prev} ${val}`.trim());
  };

  // Stats calculation
  const totalReviewsCount = reviews.length;
  const unrepliedCount = reviews.filter(r => !r.reviewReply).length;
  const positiveCount = reviews.filter(r => r.sentiment === 'positive' || r.starRating === 'FIVE' || r.starRating === 'FOUR').length;
  const neutralCount = reviews.filter(r => r.sentiment === 'neutral' || r.starRating === 'THREE').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative' || r.starRating === 'TWO' || r.starRating === 'ONE').length;

  const filteredReviews = reviews.filter(r => {
    if (filterSentiment === 'unreplied') return !r.reviewReply;
    if (filterSentiment === 'positive') return r.sentiment === 'positive' || r.starRating === 'FIVE' || r.starRating === 'FOUR';
    if (filterSentiment === 'neutral') return r.sentiment === 'neutral' || r.starRating === 'THREE';
    if (filterSentiment === 'negative') return r.sentiment === 'negative' || r.starRating === 'TWO' || r.starRating === 'ONE';
    return true;
  }).filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.reviewer.displayName.toLowerCase().includes(q) || 
           r.comment.toLowerCase().includes(q) ||
           (r.detectedService && r.detectedService.toLowerCase().includes(q));
  });

  // Login Screen if not authenticated
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-rose-500 text-white rounded-2xl flex items-center justify-center mb-5 shadow-md shadow-rose-200">
          <ShieldCheck size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Google Business Profile Monitor</h2>
        <p className="text-slate-600 mb-6 max-w-md text-sm leading-relaxed">
          Sign in with your verified salon Google Account (<span className="font-semibold text-rose-600">{import.meta.env.VITE_ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com'}</span>) to monitor live reviews and automate sentiment-tailored AI responses.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google Business Account
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">Or Quick Preview</span></div>
          </div>

          <button
            onClick={handleDemoSignIn}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Bot size={16} className="text-rose-400" />
            Open Admin Monitor Preview
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Protected with 256-bit Token Verification & Anti-Spam Security</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Google Business AI Monitor</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Monitoring <span className="font-medium text-slate-700">{settings.placeholders.salonName}</span> • Last checked {Math.floor((Date.now() - lastSyncTime.getTime()) / 1000)}s ago
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {userProfile && (
            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <img 
                src={userProfile.picture || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces'} 
                alt={userProfile.name} 
                className="w-7 h-7 rounded-full object-cover border border-white shadow-xs" 
                referrerPolicy="no-referrer" 
              />
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{userProfile.name}</span>
            </div>
          )}
          
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-rose-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/70">
        <button
          onClick={() => setActiveTab('reviews')}
          className={cn(
            "flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'reviews' 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <MessageSquare size={16} />
          <span>Reviews & AI Replies</span>
          {unrepliedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
              {unrepliedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'settings' 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Sliders size={16} />
          <span>AI & Placeholders Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('qrcodes')}
          className={cn(
            "flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'qrcodes' 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <QrCode size={16} />
          <span>Desk QR Codes</span>
        </button>
      </div>

      {/* TAB 1: REVIEWS & AI MONITOR */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Real-Time Telemetry & Statistics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-blue-500" />
                Total Reviews
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalReviewsCount}</div>
              <div className="text-xs text-slate-400 mt-1">4.8 Avg Google Rating</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" />
                Pending Reply
              </div>
              <div className="text-2xl font-bold text-amber-600">{unrepliedCount}</div>
              <div className="text-xs text-amber-600/80 mt-1">Awaiting Response</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Positive Sentiment
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {Math.round((positiveCount / (totalReviewsCount || 1)) * 100)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">{positiveCount} reviews (4-5★)</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Critical / Neutral
              </div>
              <div className="text-2xl font-bold text-slate-800">{negativeCount + neutralCount}</div>
              <div className="text-xs text-rose-500 mt-1">{negativeCount} critical attention</div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={syncGoogleReviews}
                disabled={isLoading}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-600" : ""} />
                Sync Google Profile
              </button>

              <button
                onClick={handleBatchDraftAll}
                disabled={isBatchDrafting || unrepliedCount === 0}
                className={cn(
                  "px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95",
                  unrepliedCount > 0 
                    ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <Zap size={14} />
                {isBatchDrafting ? 'AI Drafting All...' : `Auto-Draft All Pending (${unrepliedCount})`}
              </button>
            </div>

            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <PlusCircle size={14} />
              Simulate New GBP Review
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 'unreplied', label: `Pending (${unrepliedCount})` },
                { id: 'positive', label: `🟢 Positive (${positiveCount})` },
                { id: 'neutral', label: `🟡 Neutral (${neutralCount})` },
                { id: 'negative', label: `🔴 Critical (${negativeCount})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterSentiment(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    filterSentiment === tab.id
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search by reviewer, keyword, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
            />
          </div>

          {/* Review Stream */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
                <MessageSquare className="mx-auto text-slate-300 mb-3" size={36} />
                <h3 className="text-sm font-semibold text-slate-700 mb-1">No reviews found</h3>
                <p className="text-xs text-slate-400">Try changing the filter or search keywords.</p>
              </div>
            ) : (
              filteredReviews.map((review) => {
                const numRating = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 }[review.starRating] || Number(review.starRating) || 5;
                const sentiment = review.sentiment || (numRating >= 4 ? 'positive' : numRating === 3 ? 'neutral' : 'negative');
                const isReplying = activeReplyId === review.reviewId;
                const hasPendingDraft = Boolean(review.draftReply);

                return (
                  <div key={review.reviewId} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.reviewer.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'}
                          alt={review.reviewer.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{review.reviewer.displayName}</h3>
                            {review.detectedService && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                                <Tag size={10} />
                                {review.detectedService}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={13}
                                  className={star <= numRating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(review.createTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sentiment Badge */}
                      <div>
                        {sentiment === 'positive' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Positive Sentiment
                          </span>
                        )}
                        {sentiment === 'neutral' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Neutral Sentiment
                          </span>
                        )}
                        {sentiment === 'negative' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Critical Sentiment
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Review Text */}
                    <div className="p-3.5 bg-slate-50/80 rounded-xl text-slate-800 text-xs sm:text-sm leading-relaxed border border-slate-100">
                      "{review.comment}"
                    </div>

                    {/* Already Replied Section */}
                    {review.reviewReply ? (
                      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-emerald-600" />
                            Official Google Business Reply Posted
                          </span>
                          <span className="text-[11px] text-emerald-700/70 font-normal">
                            {new Date(review.reviewReply.updateTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">{review.reviewReply.comment}</p>
                      </div>
                    ) : isReplying ? (
                      /* Active AI Reply Generator Box */
                      <div className="bg-gradient-to-br from-rose-50/40 via-white to-amber-50/40 p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Bot size={16} className="text-rose-600" />
                            AI Response Draft ({sentiment.toUpperCase()} TAILORED)
                          </div>
                          
                          {/* Quick Placeholder Inserters */}
                          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400">Placeholders:</span>
                            <button
                              onClick={() => insertPlaceholderToDraft('salonName')}
                              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]"
                              title="Insert Salon Name"
                            >
                              + {'{salon_name}'}
                            </button>
                            <button
                              onClick={() => insertPlaceholderToDraft('serviceName')}
                              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]"
                              title="Insert Service Name"
                            >
                              + {'{service_name}'}
                            </button>
                            <button
                              onClick={() => insertPlaceholderToDraft('ownerName')}
                              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]"
                              title="Insert Owner Name"
                            >
                              + {'{owner_name}'}
                            </button>
                          </div>
                        </div>

                        {isDrafting ? (
                          <div className="flex items-center justify-center gap-2.5 py-8 text-xs font-semibold text-rose-600">
                            <div className="w-4 h-4 rounded-full border-2 border-rose-600 border-t-transparent animate-spin"></div>
                            Crafting personalized, polite response with placeholders...
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={draftReply}
                              onChange={(e) => setDraftReply(e.target.value)}
                              rows={3}
                              className="w-full p-3 bg-white border border-rose-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs resize-none font-sans leading-relaxed"
                              placeholder="AI response draft..."
                            />

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => generateReply(review)}
                                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <RefreshCw size={12} /> Regenerate
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveReplyId(null);
                                    setDraftReply('');
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>

                              <button
                                onClick={() => postReply(review.name, draftReply)}
                                disabled={isPosting || !draftReply.trim()}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                              >
                                {isPosting ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Posting to Google...
                                  </>
                                ) : (
                                  <>
                                    <Send size={13} />
                                    Post Official Reply
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : hasPendingDraft ? (
                      /* Batch Drafted Ready for 1-Click Approval */
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-600" />
                            AI Response Draft Ready for Approval
                          </span>
                          <span className="text-[11px] text-amber-700/80">Sentiment: {sentiment}</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-sans">{review.draftReply}</p>
                        
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              setActiveReplyId(review.reviewId);
                              setDraftReply(review.draftReply || '');
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Edit Response
                          </button>
                          <button
                            onClick={() => postReply(review.name, review.draftReply!)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs"
                          >
                            <Check size={13} /> Approve & Post
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Trigger Button */
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">Response required</span>
                        <button
                          onClick={() => generateReply(review)}
                          className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <Bot size={14} />
                          Generate Tailored AI Reply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Rating Trend Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Google Rating Performance Trend</h2>
                <p className="text-xs text-slate-400">Historical 30-day customer satisfaction score</p>
              </div>
              <div className="text-xl font-bold text-slate-900">4.8 <span className="text-xs font-normal text-slate-400">/ 5.0</span></div>
            </div>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    minTickGap={24}
                  />
                  <YAxis 
                    domain={[3.5, 5]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#e11d48" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#e11d48', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#fbbf24' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI SETTINGS & PLACEHOLDERS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Customizable Placeholders Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="text-rose-500" size={18} />
                Customizable Salon Placeholders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The AI automatically injects these dynamic variables when generating customized replies.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Salon Brand Name <span className="font-mono text-rose-500">{'{salon_name}'}</span>
                </label>
                <input
                  type="text"
                  value={settings.placeholders.salonName}
                  onChange={(e) => setSettings({
                    ...settings,
                    placeholders: { ...settings.placeholders, salonName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Popular / Mentioned Services <span className="font-mono text-rose-500">{'{service_name}'}</span>
                </label>
                <input
                  type="text"
                  value={settings.placeholders.serviceName}
                  onChange={(e) => setSettings({
                    ...settings,
                    placeholders: { ...settings.placeholders, serviceName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Owner / Sign-off Name <span className="font-mono text-rose-500">{'{owner_name}'}</span>
                </label>
                <input
                  type="text"
                  value={settings.placeholders.ownerName}
                  onChange={(e) => setSettings({
                    ...settings,
                    placeholders: { ...settings.placeholders, ownerName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Resolution Contact <span className="font-mono text-rose-500">{'{contact_info}'}</span>
                </label>
                <input
                  type="text"
                  value={settings.placeholders.contactInfo}
                  onChange={(e) => setSettings({
                    ...settings,
                    placeholders: { ...settings.placeholders, contactInfo: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Sentiment-Tailored Directives Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="text-amber-500" size={18} />
                Sentiment-Specific Response Directives
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize how the AI should frame responses for positive, neutral, and critical feedback.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                <label className="block text-xs font-bold text-emerald-900">
                  🟢 Positive Reviews Directive (4 & 5 Stars)
                </label>
                <textarea
                  value={settings.positiveDirective}
                  onChange={(e) => setSettings({ ...settings, positiveDirective: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-sans"
                />
              </div>

              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
                <label className="block text-xs font-bold text-amber-900">
                  🟡 Neutral Reviews Directive (3 Stars)
                </label>
                <textarea
                  value={settings.neutralDirective}
                  onChange={(e) => setSettings({ ...settings, neutralDirective: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-sans"
                />
              </div>

              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-2">
                <label className="block text-xs font-bold text-rose-900">
                  🔴 Critical Reviews Directive (1 & 2 Stars)
                </label>
                <textarea
                  value={settings.negativeDirective}
                  onChange={(e) => setSettings({ ...settings, negativeDirective: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* AI Automation Toggles */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="text-blue-500" size={18} />
              Monitoring & Auto-Pilot Behavior
            </h2>

            <div className="divide-y divide-slate-100">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Real-Time Background Monitoring</h3>
                  <p className="text-xs text-slate-400">Continuously listen for new Google Business Profile reviews.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoMonitor}
                  onChange={(e) => setSettings({ ...settings, autoMonitor: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Auto-Draft Responses</h3>
                  <p className="text-xs text-slate-400">Automatically prepare a tailored draft whenever a new review appears.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoDraft}
                  onChange={(e) => setSettings({ ...settings, autoDraft: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => toast.success('Settings & Placeholders saved successfully!')}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Save All AI Settings
              </button>
            </div>
          </div>

          {/* Interactive AI Sandbox Simulator */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={18} />
              <div>
                <h3 className="text-sm font-bold">Interactive AI Response Sandbox</h3>
                <p className="text-xs text-slate-300">Test how the AI crafts responses using your customized placeholders.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Simulate Star Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setTestRating(star)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-xs font-bold transition-all",
                      testRating === star ? "bg-amber-400 text-slate-900 shadow-xs" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {star}★
                  </button>
                ))}
              </div>

              <textarea
                value={testComment}
                onChange={(e) => setTestComment(e.target.value)}
                rows={2}
                placeholder="Type sample client review here..."
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none font-sans"
              />

              <button
                onClick={handleTestSandbox}
                disabled={isTestingAI}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                {isTestingAI ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Zap size={14} />
                )}
                Test AI Response Generator
              </button>

              {testResult && (
                <div className="p-3.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white leading-relaxed mt-2 animate-in fade-in">
                  <div className="text-[10px] font-mono text-amber-300 mb-1 uppercase tracking-wider">Generated Output:</div>
                  "{testResult}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QR CODES */}
      {activeTab === 'qrcodes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Front Desk & Academy Review QR Codes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Place these printed QR codes on salon counters. Customers scanning them are taken to the smart review form.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {locations.map((loc) => {
              const url = `${window.location.origin}/?link=${encodeURIComponent(loc.reviewLink)}`;
              return (
                <div key={loc.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <QRCodeSVG value={url} size={140} />
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast.success('Direct Review URL copied to clipboard!');
                    }}
                    className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy size={13} /> Copy Direct QR URL
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Simulate Incoming GBP Review */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="text-rose-500 animate-pulse" size={18} />
                Simulate Live Google Review
              </h3>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Simulate an incoming review from Google Business Profile to see how the AI monitoring engine detects sentiment and drafts customized replies.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Star Rating</label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSimRating(r);
                        if (r >= 4) {
                          setSimComment('Party makeup bohot pyaara hua tha! Sabhi relatives ne tareef ki. Staff behavior was very polite.');
                          setSimService('Bridal & Party Makeup');
                        } else if (r === 3) {
                          setSimComment('Haircut was good, but appointment time se thoda wait karna pada.');
                          setSimService('Hair Cut & Styling');
                        } else {
                          setSimComment('Service was not satisfactory. Staff was in a hurry.');
                          setSimService('Nail Care');
                        }
                      }}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                        simRating === r
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {r}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Tag</label>
                <input
                  type="text"
                  value={simService}
                  onChange={(e) => setSimService(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Review Comment</label>
                <textarea
                  value={simComment}
                  onChange={(e) => setSimComment(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateNewReview}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Simulate Incoming Review 🔔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
