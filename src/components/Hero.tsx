import React from 'react';
import { Zap, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-6 pb-4 md:pt-10 md:pb-6 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        
        {/* Sleek Trust Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Next-Gen Smart PDF Engine</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 tracking-tight leading-tight mb-3">
          Compress PDF files without <br className="hidden sm:inline" />
          <span className="text-indigo-600">
            sacrificing quality.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mb-6 leading-relaxed">
          Intelligent deflate, image downsampling, and object stream optimization. Reduce file size up to 80% for email, web uploads, and archiving with instant comparison preview.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Smart Content Analysis</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>100% Private & In-Browser</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Target Size Mode</span>
          </div>
        </div>

      </div>
    </div>
  );
};
