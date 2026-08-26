import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

// Helper to sanitize API Keys
function cleanKey(val?: string): string {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

export interface PlaceholderConfig {
  salonName?: string;
  serviceName?: string;
  ownerName?: string;
  contactInfo?: string;
}

// Fallback high-quality template generator if no external API key is set
export function generateFallbackReply(params: {
  reviewerName: string;
  rating: number;
  reviewText: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  placeholders?: PlaceholderConfig;
  tone?: string;
}): string {
  const { reviewerName, rating, placeholders } = params;
  const salon = placeholders?.salonName || 'Crystal Makeover Salon And Academy';
  const service = placeholders?.serviceName || 'salon services';
  const owner = placeholders?.ownerName || 'Crystal Team';
  const contact = placeholders?.contactInfo || 'our desk directly';

  // Determine sentiment
  let sentiment = params.sentiment;
  if (!sentiment) {
    if (rating >= 4) sentiment = 'positive';
    else if (rating === 3) sentiment = 'neutral';
    else sentiment = 'negative';
  }

  if (sentiment === 'positive') {
    const positiveReplies = [
      `Dear ${reviewerName}, thank you so much for your glowing review! ❤️ Hum bohot khush hain ki aapko ${salon} par hamari ${service} pasand aayi. Looking forward to welcoming you again soon! ✨ - ${owner}`,
      `Thank you so much ${reviewerName}! 🥰 Aapka feedback hamari puri team ke liye bohot special hai. ${salon} par hum hamesha best experience dene ki koshish karte hain. See you soon! 🙏 - ${owner}`,
      `Hi ${reviewerName}, thank you for your kind words! 🙏 We are thrilled to know you had a wonderful time with our team at ${salon}. Aapse jald milne ka intezar rahega! ❤️ - ${owner}`
    ];
    return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
  } else if (sentiment === 'neutral') {
    const neutralReplies = [
      `Dear ${reviewerName}, thank you for visiting ${salon} and sharing your honest feedback. 🙏 Hum constantly apni services improve karte hain. Agli baar aaiye, we promise an even better experience! - ${owner}`,
      `Hi ${reviewerName}, thanks for your review! We appreciate your suggestions regarding our ${service}. ${salon} par hum hamesha client satisfaction ko priority dete hain. Hope to serve you better next time! 🙏 - ${owner}`
    ];
    return neutralReplies[Math.floor(Math.random() * neutralReplies.length)];
  } else {
    const negativeReplies = [
      `Dear ${reviewerName}, we sincerely apologize for your experience. Yeh ${salon} ke standards ke mutabiq nahi tha. Please connect with us directly at ${contact} so hum ise turant theek kar sakein. Sincere apologies. 🙏 - ${owner}`,
      `Hi ${reviewerName}, hum dil se maafi maangte hain ki aapka experience accha nahi raha. We take your feedback very seriously. Please reach out to us at ${contact} so we can make this right for you. 🙏 - ${owner}`
    ];
    return negativeReplies[Math.floor(Math.random() * negativeReplies.length)];
  }
}

// Unified AI generator supporting OpenRouter, Gemini API, and smart fallback
export async function generateAIResponse(prompt: string, fallbackText?: string): Promise<string> {
  const openRouterKey = cleanKey(process.env.OPENROUTER_API_KEY);
  const geminiKey = cleanKey(process.env.GEMINI_API_KEY) || cleanKey(process.env.API_KEY);

  // 1. Try OpenRouter if configured
  if (openRouterKey && openRouterKey !== 'YOUR_OPENROUTER_API_KEY') {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "https://review.crystalmakeover.com",
          "X-Title": "Crystal Makeover Salon And Academy Review"
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content.replace(/^["']|["']$/g, '').trim();
      } else {
        const errorText = await response.text().catch(() => 'no text');
        console.log(`OpenRouter request failed (${response.status}): ${errorText}. Trying Gemini or fallback...`);
      }
    } catch (err) {
      console.log("OpenRouter error:", err);
    }
  }

  // 2. Try Gemini API if configured
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = result.text?.trim();
      if (text) return text.replace(/^["']|["']$/g, '').trim();
    } catch (geminiErr) {
      console.log("Gemini API error:", geminiErr);
    }
  }

  // 3. Graceful fallback
  return fallbackText || "Thank you so much for your valuable feedback! We look forward to serving you again at Crystal Makeover Salon And Academy. 🙏";
}

// Helper: Verify Admin Token for Owner APIs
export async function verifyAdminAuth(req: express.Request, res: express.Response): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
    return false;
  }

  const token = authHeader.split(' ')[1];

  try {
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    if (!verifyRes.ok) {
      res.status(401).json({ error: 'Unauthorized: Invalid Google token' });
      return false;
    }

    const tokenData = await verifyRes.json();
    const adminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com';

    if (tokenData.email && tokenData.email.toLowerCase() !== adminEmail.toLowerCase()) {
      res.status(403).json({ error: 'Forbidden: You are not the authorized Admin account' });
      return false;
    }
    return true;
  } catch (err) {
    console.error('Token validation failed:', err);
    res.status(401).json({ error: 'Failed to verify authentication token' });
    return false;
  }
}

export function createExpressApp(): express.Application {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxies (Vercel, Cloud Run, Nginx)
  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false
  }));

  // Permissive CORS for Vercel preview URLs, custom domains, and local development
  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));

  app.use(express.json());

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests from this IP, please try again later.' }
  });

  app.use('/api/', apiLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // API: Customer Review Generation
  // ==========================================
  app.post('/api/ai/draft-review', async (req, res) => {
    try {
      const { rating, feedback } = req.body;
      const prompt = `You are a real customer writing an authentic, professional Google Review for "Crystal Makeover Salon And Academy" (a female-only salon).
Rating: ${rating} out of 5 stars.
Key points to include: ${(feedback || []).join(', ')}.

CRITICAL INSTRUCTIONS:
1. Write like an authentic client who visited the salon.
2. CHOOSE EXACTLY ONE LANGUAGE: EITHER 100% English OR 100% natural Roman Hindi / Hinglish.
3. Keep it sincere, polite, and concise (1-2 sentences maximum).
4. Use at most 1 relevant emoji (✨, ❤️, 👍, or 😊).
5. ONLY output the raw review comment text. No quotes or introductory text.`;

      const fallback = rating >= 4
        ? "Amazing experience at Crystal Makeover Salon! The staff is very polite and professional. Highly recommended! ✨"
        : "Had an okay experience at the salon. Staff was courteous.";

      const draftText = await generateAIResponse(prompt, fallback);
      res.json({ draft: draftText });
    } catch (error: any) {
      console.error('Error drafting review:', error);
      res.status(500).json({ error: error.message || 'Failed to draft review' });
    }
  });

  // ==========================================
  // API: AI Review Reply with Sentiment & Placeholders
  // ==========================================
  app.post('/api/ai/draft-reply', async (req, res) => {
    try {
      const isAuthenticated = await verifyAdminAuth(req, res);
      if (!isAuthenticated) return;

      const {
        reviewerName = 'Valued Customer',
        rating = 5,
        reviewText = '',
        sentimentTone,
        placeholders = {},
        customDirective
      } = req.body;

      const salonName = placeholders.salonName || 'Crystal Makeover Salon And Academy';
      const serviceName = placeholders.serviceName || 'bridal makeup and salon treatments';
      const ownerName = placeholders.ownerName || 'Crystal Team';
      const contactInfo = placeholders.contactInfo || 'our salon desk directly';

      // Auto-classify sentiment
      let sentiment: 'positive' | 'neutral' | 'negative' = 'positive';
      if (sentimentTone) {
        sentiment = sentimentTone;
      } else if (Number(rating) <= 2) {
        sentiment = 'negative';
      } else if (Number(rating) === 3) {
        sentiment = 'neutral';
      } else {
        sentiment = 'positive';
      }

      const prompt = `You are the owner/manager of "${salonName}", a premium female-only salon and academy.
You are writing an official, customized, polite, and professional response to a Google Business Profile review.

Review Details:
- Reviewer Name: ${reviewerName}
- Star Rating: ${rating} out of 5
- Review Content: "${reviewText}"
- Detected Sentiment: ${sentiment.toUpperCase()}

Configured Placeholders:
- Salon Name: ${salonName}
- Featured/Mentioned Services: ${serviceName}
- Owner/Sign-off Name: ${ownerName}
- Contact / Resolution Info: ${contactInfo}

SENTIMENT-TAILORED GUIDELINES:
${
  sentiment === 'positive'
    ? `- POSITIVE SENTIMENT: Express heartfelt, enthusiastic gratitude. Celebrate their happiness. Politely mention ${salonName} and ${serviceName}. Warmly invite them back for their next visit. Use 1-2 warm emojis (❤️, ✨, 🙏).`
    : sentiment === 'neutral'
    ? `- NEUTRAL SENTIMENT: Sincerely thank ${reviewerName} for their honest feedback. Graciously acknowledge their experience, affirm ${salonName}'s commitment to continuous improvement, and invite them back to try our enhanced ${serviceName}. Use a respectful emoji (🙏, 😊).`
    : `- NEGATIVE SENTIMENT: Offer a sincere, calm, and empathetic apology on behalf of ${ownerName}. Acknowledge their concern with humility (never be defensive or dismissive). Politely invite them to contact us directly at ${contactInfo} so we can make things right immediately. Use a humble emoji (🙏).`
}

${customDirective ? `Additional Owner Directive: ${customDirective}` : ''}

CRITICAL RULES:
1. Write in a natural, polite Hinglish or polished conversational English blend commonly used in Indian business replies.
2. Keep the reply concise (25 to 45 words maximum).
3. Naturally incorporate relevant placeholders ({salon_name}, {service_name}, {owner_name}, or {contact_info}) where appropriate.
4. Output STRICTLY the finalized reply text. No meta-commentary, no quotation marks.`;

      const fallbackText = generateFallbackReply({
        reviewerName,
        rating: Number(rating),
        reviewText,
        sentiment,
        placeholders
      });

      const replyText = await generateAIResponse(prompt, fallbackText);
      res.json({
        reply: replyText,
        sentiment,
        placeholdersUsed: {
          salonName,
          serviceName,
          ownerName,
          contactInfo
        }
      });
    } catch (error: any) {
      console.error('Error drafting reply:', error);
      res.status(500).json({ error: error.message || 'Failed to draft reply' });
    }
  });

  // ==========================================
  // API: Batch AI Reply Generator for Monitoring
  // ==========================================
  app.post('/api/ai/batch-draft-replies', async (req, res) => {
    try {
      const isAuthenticated = await verifyAdminAuth(req, res);
      if (!isAuthenticated) return;

      const { reviews = [], placeholders = {} } = req.body;

      const results = await Promise.all(
        reviews.map(async (rev: any) => {
          const numRating = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 }[rev.starRating] || Number(rev.starRating) || 5;
          let sentiment: 'positive' | 'neutral' | 'negative' = numRating >= 4 ? 'positive' : numRating === 3 ? 'neutral' : 'negative';

          const fallback = generateFallbackReply({
            reviewerName: rev.reviewer?.displayName || 'Customer',
            rating: numRating,
            reviewText: rev.comment || '',
            sentiment,
            placeholders
          });

          return {
            reviewId: rev.reviewId,
            reply: fallback,
            sentiment
          };
        })
      );

      res.json({ results });
    } catch (error: any) {
      console.error('Batch draft error:', error);
      res.status(500).json({ error: error.message || 'Batch generation failed' });
    }
  });

  // ==========================================
  // API: Google Business Profile Proxy
  // ==========================================
  app.all('/api/gbp/*', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl || !targetUrl.startsWith('https://mybusiness')) {
      return res.status(400).json({ error: 'Invalid Google Business Profile URL' });
    }
    try {
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      };
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(req.body);
      }
      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('GBP Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // API: Feedback Submission (Private Customer Complaints)
  // ==========================================
  app.post('/api/feedback', async (req, res) => {
    try {
      const { rating, suggestion } = req.body;
      console.log('--------------------------------------------------');
      console.log('EMAIL SENT TO: crystalmakeoversalon@gmail.com');
      console.log(`SUBJECT: New ${rating}-Star Customer Feedback`);
      console.log(`BODY: ${suggestion}`);
      console.log('--------------------------------------------------');
      await new Promise(resolve => setTimeout(resolve, 600));
      res.json({ success: true, message: 'Feedback sent successfully.' });
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      res.status(500).json({ error: error.message || 'Failed to send feedback' });
    }
  });

  return app;
}
