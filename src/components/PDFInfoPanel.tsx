import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Info, ShieldCheck, FileText, Image, Type, Lock, FileCode, CheckCircle2 } from 'lucide-react';
import { PDFMetadata } from '../types';

interface PDFInfoPanelProps {
  metadata: PDFMetadata;
}

export const PDFInfoPanel: React.FC<PDFInfoPanelProps> = ({ metadata }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFriendlyRecommendation = () => {
    if (metadata.documentType === 'image_heavy') {
      return {
        title: 'High Compression Potential (Image Heavy)',
        description: `This PDF contains ${metadata.imageCount} high-resolution images. Applying Balanced or Maximum Compression will significantly reduce file size (estimated 50-75% reduction) with minimal visual impact.`,
        level: 'balanced',
      };
    } else if (metadata.documentType === 'scanned') {
      return {
        title: 'Scanned Document Optimization',
        description: 'This document consists of scanned page images. Converting to grayscale or applying 150 DPI downsampling will shrink file size drastically while keeping text crisp.',
        level: 'max',
      };
    } else if (metadata.documentType === 'text_heavy') {
      return {
        title: 'Structural Deflate Recommended',
        description: 'This document is predominantly text and vectors. Object stream compression and font subsetting will optimize structure safely without losing any vector sharpness.',
        level: 'balanced',
      };
    } else if (metadata.alreadyOptimized) {
      return {
        title: 'Already Highly Optimized',
        description: 'This PDF is already well-compressed. Compression will clean metadata and compact object streams, but size reduction may be modest (5-15%).',
        level: 'high',
      };
    } else {
      return {
        title: 'Balanced Optimization Recommended',
        description: 'Recommended for most documents. Offers excellent file size reduction while preserving high-definition visual quality.',
        level: 'balanced',
      };
    }
  };

  const rec = getFriendlyRecommendation();

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      {/* Smart Recommendation Banner */}
      <div className="bg-indigo-50 p-4 rounded-2xl mb-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 fill-white/20" />
        </div>
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            Recommendation: {rec.title}
          </p>
          <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
            {rec.description}
          </p>
        </div>
      </div>

      {/* Quick Key Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-medium block">Total Pages</span>
          <span className="text-sm font-bold text-slate-800 mt-0.5 block">{metadata.pageCount} pages</span>
        </div>
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-medium block">Est. Images</span>
          <span className="text-sm font-bold text-slate-800 mt-0.5 block">{metadata.imageCount} embedded</span>
        </div>
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-medium block">PDF Version</span>
          <span className="text-sm font-bold text-slate-800 mt-0.5 block">v{metadata.pdfVersion}</span>
        </div>
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-medium block">PDF/A Standard</span>
          <span className="text-sm font-bold text-slate-800 mt-0.5 block">
            {metadata.isPdfA ? 'Yes (Archival)' : 'Standard PDF'}
          </span>
        </div>
      </div>

      {/* Expandable Technical Analysis */}
      <div className="mt-4 pt-3 border-t border-slate-200/60">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          id="btn-toggle-pdf-analysis"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            PDF Analysis & Structural Metadata
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-normal">
              {isExpanded ? 'Hide details' : 'Show technical details'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Document Type</span>
                <span className="font-semibold capitalize">{metadata.documentType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Already Optimized?</span>
                <span className="font-semibold">{metadata.alreadyOptimized ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Password Encryption</span>
                <span className="font-semibold">{metadata.isEncrypted ? 'Encrypted' : 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Digital Signature</span>
                <span className="font-semibold">{metadata.isSigned ? 'Signed' : 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Interactive Form Fields</span>
                <span className="font-semibold">{metadata.hasForms ? 'Contains AcroForms' : 'No forms'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Embedded Fonts</span>
                <span className="font-semibold">{metadata.hasEmbeddedFonts ? 'Fonts subsetted' : 'Standard'}</span>
              </div>
            </div>

            {/* Document Metadata Fields */}
            {metadata.metadataFields && (
              <div className="pt-2">
                <span className="font-bold text-slate-800 block mb-1">Embedded Document Metadata:</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-600 space-y-1">
                  <div>Title: {metadata.metadataFields.title || '—'}</div>
                  <div>Author: {metadata.metadataFields.author || '—'}</div>
                  <div>Producer: {metadata.metadataFields.producer || '—'}</div>
                  <div>Creation Date: {metadata.metadataFields.creationDate || '—'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
