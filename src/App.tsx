/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CustomerReview } from './components/CustomerReview';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ShieldCheck, MessageSquareHeart } from 'lucide-react';
import { cn } from './components/CustomerReview';
import { Toaster } from 'sonner';

function Navigation() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <header 
      className="px-5 py-5 bg-zinc-950 relative border-b border-zinc-800 shrink-0"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
        backgroundSize: '12px 12px'
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="https://i.ibb.co/TMZk10py/IMG-20260721-171158.png" 
            alt="Crystal Makeover Salon And Academy" 
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md" 
          />
        </Link>

        <div className="flex gap-2 bg-white/10 border border-white/15 backdrop-blur-md p-1 rounded-full shadow-xs">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              !isDashboard ? "bg-white text-zinc-950 shadow-sm" : "text-white/70 hover:text-white"
            )}
          >
            <MessageSquareHeart size={14} />
            <span>Customer Review</span>
          </Link>
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              isDashboard ? "bg-white text-zinc-950 shadow-sm" : "text-white/70 hover:text-white"
            )}
          >
            <ShieldCheck size={14} />
            <span>Owner AI Monitor</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#ffaf7b] to-[#d76d77] flex items-center justify-center p-3 sm:p-6 font-sans">
      <div 
        className={cn(
          "w-full bg-[#f9f9f9] rounded-[36px] sm:rounded-[42px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col relative z-10 transition-all duration-300",
          isDashboard ? "max-w-5xl min-h-[720px]" : "max-w-[420px] min-h-[640px]"
        )}
      >
        <Navigation />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<CustomerReview />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <MainLayout />
    </Router>
  );
}
