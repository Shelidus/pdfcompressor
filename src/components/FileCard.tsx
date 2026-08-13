import React from 'react';
import { FileText, Trash2, ShieldAlert, Sparkles, Image, AlignLeft, Layers, FileCode } from 'lucide-react';
import { BatchItem, DocumentClassification } from '../types';

interface FileCardProps {
  item: BatchItem;
  onRemove: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ item, onRemove, isSelected = false, onSelect }) => {
  const { id, file, metadata, status, error } = item;

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getClassBadge = (type?: DocumentClassification) => {
    switch (type) {
      case 'image_heavy':
        return { label: 'Image Heavy 📸', bg: 'bg-amber-50 text-amber-600' };
      case 'text_heavy':
        return { label: 'Text Heavy 📄', bg: 'bg-indigo-50 text-indigo-600' };
      case 'scanned':
        return { label: 'Scanned Document 🔍', bg: 'bg-indigo-50 text-indigo-700' };
      case 'vector_heavy':
        return { label: 'Vector Graphics 📐', bg: 'bg-emerald-50 text-emerald-600' };
      default:
        return { label: 'Mixed PDF', bg: 'bg-slate-100 text-slate-600' };
    }
  };

  const badge = getClassBadge(metadata?.documentType);

  return (
    <div
      onClick={() => onSelect && onSelect(id)}
      id={`file-card-${id}`}
      className={`relative p-5 rounded-3xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-indigo-50/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
          : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail Preview or PDF Icon */}
        <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center group shadow-2xs">
          {metadata?.thumbnailDataUrl ? (
            <img
              src={metadata.thumbnailDataUrl}
              alt="PDF Page 1 Preview"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <FileText className="w-7 h-7 text-indigo-600" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">PDF</span>
            </div>
          )}
          {metadata?.pageCount && (
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-slate-900/80 text-white rounded-md">
              {metadata.pageCount}p
            </span>
          )}
        </div>

        {/* Info Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base truncate max-w-[200px] sm:max-w-[320px]" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {formatSize(file.size)} • {metadata ? `${metadata.pageCount} ${metadata.pageCount === 1 ? 'page' : 'pages'}` : 'Analyzing...'}
              </p>
            </div>

            {/* Remove File Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              title="Remove file"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              id={`btn-remove-file-${id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Classification Badge & Warnings */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {metadata && (
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${badge.bg}`}>
                {badge.label}
              </span>
            )}

            {metadata?.securityWarning && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                {metadata.isSigned ? 'Signed PDF' : 'Security Warning'}
              </span>
            )}

            {status === 'analyzing' && (
              <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                Analyzing structure...
              </span>
            )}

            {status === 'compressing' && (
              <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                Optimizing & Deflating...
              </span>
            )}

            {status === 'completed' && item.result && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                🎉 Reduced by {item.result.reductionPercentage}%
              </span>
            )}

            {status === 'error' && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                Error processing PDF
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
