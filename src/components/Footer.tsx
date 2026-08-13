import React from 'react';
import { Zap, ShieldCheck, Lock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          {/* Brand col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span>Shel'sPDF Pro</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Production-grade PDF compression, structural optimization, and document utility platform.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Private & Auto-Deleted</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">PDF Compression</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Maximum Compression</li>
              <li>Balanced Optimization</li>
              <li>High Quality Print</li>
              <li>Target Size Mode (Under 2MB)</li>
            </ul>
          </div>

          {/* PDF Utilities */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">PDF Utilities</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Merge PDF Files</li>
              <li>Rotate PDF Pages</li>
              <li>JPG/PNG to PDF Converter</li>
              <li>PDF Inspector & Metadata</li>
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Security & Privacy</h4>
            <p className="text-slate-400 leading-relaxed">
              Files are processed securely in browser memory and edge workers. We never store, sell, or retain your uploaded documents.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} OptiPDF Pro. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Designed for privacy, speed, and uncompromising quality.
          </p>
        </div>
      </div>
    </footer>
  );
};
