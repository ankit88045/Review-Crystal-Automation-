# Crystal Makeover Salon & Academy — Review & AI Response System

AI-Powered Google Business Profile Review Collection Funnel and Sentiment-Tailored Automated Response Engine for **Crystal Makeover Salon And Academy**.

---

## 🚀 Features

1. **Customer Review Funnel (`/`)**:
   - Interactive 5-star rating selector with dynamic visual feedback.
   - **4–5 Star Reviews**: AI-assisted draft generator that crafts glowing, concise reviews in English or Hinglish with 1-click copy & redirect to the official Google Business Profile.
   - **1–2 Star Reviews (Shielding)**: Private feedback form sent directly to salon management email (`crystalmakeoversalon@gmail.com`) to resolve issues privately before negative reviews go public.
   - Desk QR Code generation with location tracking.

2. **Owner AI Monitor & Dashboard (`/dashboard`)**:
   - **Live GBP Sync**: Background telemetry monitoring incoming customer reviews.
   - **Sentiment-Tailored AI Replies**:
     - 🟢 **Positive (4–5★)**: Heartfelt gratitude mentioning glow and the female team.
     - 🟡 **Neutral (3★)**: Polite acknowledgment focusing on dedication to continuous improvement.
     - 🔴 **Critical (1–2★)**: Humble, non-defensive owner apology with direct resolution contact info.
   - **Custom Placeholders**: Dynamically injects `{salon_name}`, `{service_name}`, `{owner_name}`, and `{contact_info}`.
   - **Batch Auto-Draft**: Single-click auto-generation for all unreplied reviews.
   - **Security**: 256-bit Google OAuth token verification restricting admin actions strictly to `crystalmakeoversalon@gmail.com`.

---

## ⚡ Deploy to Vercel (1-Click or Git Import)

### Option 1: Import via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import `https://github.com/ayurlifecare/crystalreview`.
3. Framework Preset: **Vite** (detected automatically).
4. Root Directory: `./`
5. Click **Deploy**.

### Option 2: Deploy with Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🔑 Environment Variables (Vercel Settings)

Add the following environment variables under **Project Settings → Environment Variables** on Vercel:

| Variable Name | Description | Example / Default |
|---|---|---|
| `OPENROUTER_API_KEY` | OpenRouter API Key for natural AI replies | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Model for OpenRouter AI | `openai/gpt-4o-mini` |
| `GEMINI_API_KEY` | Google Gemini API Key (Alternative) | `AIzaSy...` |
| `APP_URL` | Deployed Domain URL | `https://crystalreview.vercel.app` |
| `VITE_ADMIN_EMAIL` | Verified Admin Google Email | `crystalmakeoversalon@gmail.com` |
| `ADMIN_EMAIL` | Backend Verified Admin Email | `crystalmakeoversalon@gmail.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-id.apps.googleusercontent.com` |
| `VITE_GBP_REVIEW_LINK` | Direct Google Review Link | `https://search.google.com/local/writereview?placeid=...` |

*(Note: If no API keys are provided, the system gracefully uses built-in sentiment template engines so the app is always 100% functional!)*

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser at http://localhost:3000
```

---

## 📦 Build & Verification

```bash
# Build for production
npm run build

# Start production server
npm start
```
