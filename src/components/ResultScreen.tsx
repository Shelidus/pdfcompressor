import React, { useState } from 'react';
import {
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileText,
  Clock,
  Zap,
  HelpCircle,
  Edit3,
  Archive,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CompressionResult } from '../types';

interface ResultScreenProps {
  result: CompressionResult;
  onPreview: () => void;
  onCompressAnother: () => void;
  onRecompress?: (newLevel: 'max' | 'balanced' | 'high') => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onPreview,
  onCompressAnother,
  onRecompress,
}) => {
  const [outputName, setOutputName] = useState(result.outputFilename);
  const [showWhyExplainer, setShowWhyExplainer] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (!result.compressedBlobUrl) return;
    const link = document.createElement('a');
    link.href = result.compressedBlobUrl;
    link.download = outputName || result.outputFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm animate-fade-in">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Your PDF is optimized
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Processed in {(result.processingTimeMs / 1000).toFixed(2)}s using {result.qualityProfile} profile.
        </p>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Metric 1: Size Before -> After */}
        <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-2xl text-center">
          <span className="text-xs font-semibold text-slate-400 block">File Size</span>
          <div className="mt-2 flex items-center justify-center gap-2 font-bold text-slate-800 text-base">
            <span className="line-through text-slate-400 font-normal">{formatSize(result.originalSize)}</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
            <span className="text-indigo-600 font-bold text-lg">{formatSize(result.compressedSize)}</span>
          </div>
        </div>

        {/* Metric 2: Percentage Reduction */}
        <div className="p-5 bg-indigo-600 text-white rounded-2xl text-center shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider block text-indigo-200">Reduction</span>
          <div className="mt-1 font-bold text-3xl tracking-tight">
            {result.reductionPercentage}% <span className="text-xs font-normal text-indigo-200">smaller</span>
          </div>
        </div>

        {/* Metric 3: Total Saved Bytes */}
        <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-2xl text-center">
          <span className="text-xs font-semibold text-slate-400 block">Space Saved</span>
          <div className="mt-2 font-bold text-slate-800 text-lg text-emerald-600">
            {formatSize(result.savedBytes)}
          </div>
        </div>
      </div>

      {/* Explanation Banner / "Why did my PDF only shrink X%" */}
      {result.isWorseThanOriginal || result.reductionPercentage < 15 ? (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl mb-6 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Why did my PDF shrink by {result.reductionPercentage}%?
              </h4>
              <p className="leading-relaxed text-amber-900/90">
                {result.explanationText ||
                  'Your document consists mainly of pre-compressed vector paths or embedded font subset streams. To protect crispness, image quality wasn’t aggressively destroyed.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl mb-6 text-xs text-indigo-950 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold">Strategy Applied:</span> {result.strategyUsed}. Preserved all {result.pageCount} pages and vector layers.
          </p>
        </div>
      )}

      {/* Output Filename Input */}
      <div className="mb-6 space-y-1.5">
        <label htmlFor="input-output-filename" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
          Output Filename:
        </label>
        <div className="flex items-center gap-2">
          <input
            id="input-output-filename"
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleDownload}
          id="btn-download-compressed-pdf"
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.005]"
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
          Download Compressed PDF
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onPreview}
            id="btn-preview-before-after"
            className="py-3 px-4 bg-white border border-slate-300 hover:border-indigo-500 text-slate-800 hover:text-indigo-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            Before / After Comparison
          </button>

          <button
            onClick={onCompressAnother}
            id="btn-compress-another"
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            Compress Another File
          </button>
        </div>
      </div>

      {/* Re-compress options */}
      {onRecompress && (
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <span className="text-xs font-semibold text-slate-500 block mb-3">Want a different result?</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onRecompress('max')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Try Maximum Compression
            </button>
            <button
              onClick={() => onRecompress('balanced')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Try Balanced
            </button>
            <button
              onClick={() => onRecompress('high')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Try High Quality
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
