import React from 'react';
import JSZip from 'jszip';
import { Download, Archive, Trash2, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { BatchItem } from '../types';
import { FileCard } from './FileCard';

interface BatchWorkspaceProps {
  items: BatchItem[];
  onRemoveItem: (id: string) => void;
  onCompressAll: () => void;
  onClearAll: () => void;
  isCompressing: boolean;
  selectedItemId?: string;
  onSelectItem?: (id: string) => void;
}

export const BatchWorkspace: React.FC<BatchWorkspaceProps> = ({
  items,
  onRemoveItem,
  onCompressAll,
  onClearAll,
  isCompressing,
  selectedItemId,
  onSelectItem,
}) => {
  const completedItems = items.filter((item) => item.status === 'completed' && item.result);
  const totalOriginalBytes = items.reduce((acc, item) => acc + item.file.size, 0);
  const totalCompressedBytes = completedItems.reduce(
    (acc, item) => acc + (item.result?.compressedSize || item.file.size),
    0
  );
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const overallReduction = totalOriginalBytes > 0
    ? Number((((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100).toFixed(1))
    : 0;

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadAllZip = async () => {
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    completedItems.forEach((item) => {
      if (item.result?.compressedArrayBuffer) {
        zip.file(item.result.outputFilename, item.result.compressedArrayBuffer);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `OptiPDF_compressed_batch_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Batch Workspace ({items.length} {items.length === 1 ? 'file' : 'files'})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total Queue Size: <span className="font-bold text-slate-800">{formatSize(totalOriginalBytes)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {completedItems.length > 0 && (
            <button
              onClick={handleDownloadAllZip}
              id="btn-download-zip"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
            >
              <Archive className="w-4 h-4" />
              Download ZIP ({completedItems.length})
            </button>
          )}

          <button
            disabled={isCompressing}
            onClick={onCompressAll}
            id="btn-compress-batch-all"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 stroke-[2.5]" />
            {isCompressing ? 'Processing Queue...' : `Compress All (${items.length})`}
          </button>

          <button
            onClick={onClearAll}
            id="btn-clear-queue"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Clear Queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Statistics Card if completed */}
      {completedItems.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                Batch Processing Complete ({completedItems.length}/{items.length})
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Overall Reduction: <span className="text-emerald-700 font-bold">{overallReduction}% smaller</span>
              </span>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-500 block">Total Space Saved</span>
            <span className="font-extrabold text-emerald-700 text-lg">{formatSize(totalSavedBytes)}</span>
          </div>
        </div>
      )}

      {/* File Cards List */}
      <div className="space-y-3 max-h-[500px] overflow-auto pr-1">
        {items.map((item) => (
          <FileCard
            key={item.id}
            item={item}
            onRemove={onRemoveItem}
            isSelected={item.id === selectedItemId}
            onSelect={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
};
