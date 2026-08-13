import React from 'react';
import { FileText, ShieldCheck, Zap, Layers, HelpCircle, FileSearch } from 'lucide-react';
import { ActiveTool } from '../types';

interface NavbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  fileCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTool, setActiveTool, fileCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTool('compress')}
            className="flex items-center gap-3 cursor-pointer group"
            id="nav-brand-logo"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-slate-800">
                  Shel's<span className="text-indigo-600">PDF</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-600 rounded-md">
                  Pro
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTool('compress')}
              id="nav-tab-compress"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTool === 'compress'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              Compress
              {fileCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-indigo-50 text-indigo-700 rounded-full font-bold">
                  {fileCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTool('merge')}
              id="nav-tab-tools"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                ['merge', 'split', 'rotate', 'image_to_pdf'].includes(activeTool)
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              Convert & Tools
            </button>

            <button
              onClick={() => setActiveTool('inspector')}
              id="nav-tab-inspector"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTool === 'inspector'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSearch className="w-4 h-4 text-indigo-600" />
              PDF Inspector
            </button>

            <button
              onClick={() => setActiveTool('faq')}
              id="nav-tab-faq"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTool === 'faq'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              FAQ & Guides
            </button>
          </nav>

          {/* Privacy Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">100% Private</span>
              <span className="sm:hidden">Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-50 border-t border-slate-200 px-2 py-2">
        <button
          onClick={() => setActiveTool('compress')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            activeTool === 'compress' ? 'text-indigo-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Zap className="w-4 h-4" />
          Compress
        </button>
        <button
          onClick={() => setActiveTool('merge')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            ['merge', 'split', 'rotate', 'image_to_pdf'].includes(activeTool) ? 'text-indigo-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tools
        </button>
        <button
          onClick={() => setActiveTool('inspector')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            activeTool === 'inspector' ? 'text-indigo-600 font-bold' : 'text-slate-600'
          }`}
        >
          <FileSearch className="w-4 h-4" />
          Inspector
        </button>
        <button
          onClick={() => setActiveTool('faq')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            activeTool === 'faq' ? 'text-indigo-600 font-bold' : 'text-slate-600'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          FAQ
        </button>
      </div>
    </header>
  );
};
